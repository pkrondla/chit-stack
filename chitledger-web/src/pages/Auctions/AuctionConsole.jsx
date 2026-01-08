import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Calculator, ArrowLeft, CheckCircle, FileText } from 'lucide-react';

const AuctionConsole = () => {
    const { auctionId } = useParams();
    const navigate = useNavigate();
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [bidAmount, setBidAmount] = useState('');
    const [winningTicketId, setWinningTicketId] = useState('');
    const [tickets, setTickets] = useState([]); // List of eligible tickets for dropdown

    // Calculated Values
    const [calculations, setCalculations] = useState({
        commission: 0,
        distributable: 0,
        dividend: 0,
        payable: 0
    });

    useEffect(() => {
        fetchAuctionDetails();
    }, [auctionId]);

    useEffect(() => {
        if (auction && bidAmount) {
            calculate();
        }
    }, [bidAmount, auction]);

    const fetchAuctionDetails = async () => {
        try {
            // Optimization: In a real app, we might need a specific GetAuctionById endpoint.
            // For now, filtering from list or assuming we modify backend later.
            // Let's assume we fetch list and find it, OR add GetById.
            // Quick hack for prototype: Fetch list.
            const response = await api.get('/Auctions');
            const found = response.data.find(a => a.id === parseInt(auctionId));

            if (found) {
                setAuction(found);
                // Also fetch tickets for this group to populate winner dropdown
                // Assuming we have an endpoint or filter.
                // For MVP, letting user enter Ticket Number manually or fetching Group Tickets.
                // Let's fetch Group details for tickets.
                // const groupRes = await api.get(`/ChitGroups/${found.chitGroupId}`); // Not implemented yet
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculate = () => {
        // Logic should match Backend: 
        // ForemanCommission = 5% of Chit Value (Fixed? or on Bid? Usually on Chit Value)
        // Actually, logic varies. Let's assume:
        // ForemanCommission = 5% of Chit Value.
        // Auction Discount = Bid Amount.
        // Distributable = Bid Amount - Foreman Commission.
        // Dividend = Distributable / TotalTickets (e.g. 50).
        // Payable = ChitValue - BidAmount.

        // Wait, standard logic:
        // Winner takes: (ChitValue - BidAmount).
        // BidAmount is the "Discount".
        // Commission = 5% of ChitValue.
        // Distributable Dividend = BidAmount - Commission.
        // Dividend per member = Distributable / TotalMembers.

        // Use default if missing
        const chitValue = 100000; // Placeholder, need from Group data
        const totalMembers = 20; // Placeholder
        const commissionRate = 0.05;

        const bid = parseFloat(bidAmount) || 0;
        const commission = chitValue * commissionRate;
        const distributable = bid - commission;
        const dividend = distributable > 0 ? (distributable / totalMembers) : 0;
        const payable = chitValue - bid;

        setCalculations({ commission, distributable, dividend, payable });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Auctions/close', {
                auctionId: parseInt(auctionId),
                winningTicketId: 1, // Placeholder, need to resolve from Ticket Number input
                winningBidAmount: parseFloat(bidAmount)
            });
            alert('Auction Closed Successfully!');
            navigate('/auctions');
        } catch (error) {
            alert('Failed to close auction');
        }
    };

    if (loading || !auction) return <div>Loading...</div>;

    const isClosed = auction.auctionStatus === 'Closed';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate('/auctions')} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'none', marginBottom: '1rem', cursor: 'pointer', color: '#64748b' }}>
                <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to Board
            </button>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a' }}>{auction.groupName}</h1>
                        <div style={{ color: '#64748b' }}>Installment #{auction.installmentNumber} • {new Date(auction.auctionDate).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                        padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 'bold',
                        backgroundColor: isClosed ? '#dcfce7' : '#fef9c3',
                        color: isClosed ? '#166534' : '#854d0e'
                    }}>
                        {auction.auctionStatus}
                    </span>
                </div>

                {isClosed ? (
                    <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <CheckCircle size={48} color="#166534" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Auction Completed</h3>
                        <p>Winning Bid: ₹{auction.winningBidAmount.toLocaleString()}</p>
                        <button
                            onClick={() => window.open(`https://localhost:7191/api/forms/minutes/${auction.id}`, '_blank')}
                            style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            <FileText size={18} style={{ marginRight: '0.5rem' }} />
                            Download Minutes (Form VIII)
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Input Section */}
                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                                <Calculator size={20} style={{ marginRight: '0.5rem' }} /> Bid Calculator
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Winning Bid Amount (Discount)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }}>₹</span>
                                        <input
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2rem', fontSize: '1.25rem', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Enter the total discount offered by the winner.</div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Winning Ticket #</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        placeholder="Enter Ticket Number"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!bidAmount}
                                    style={{
                                        width: '100%', padding: '1rem', backgroundColor: bidAmount ? '#0f172a' : '#cbd5e1', color: 'white',
                                        border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: bidAmount ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Confirm & Close Auction
                                </button>
                            </form>
                        </div>

                        {/* Results Section */}
                        <div style={{ backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#334155' }}>Projected Outcome</h3>

                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b' }}>Foreman Commission (5%)</span>
                                <span>₹{calculations.commission.toLocaleString()}</span>
                            </div>

                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b' }}>Distributable Dividend</span>
                                <span style={{ fontWeight: 'bold', color: '#166534' }}>₹{calculations.distributable.toLocaleString()}</span>
                            </div>

                            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Dividend / Member</span>
                                <span style={{ fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                    ₹{calculations.dividend.toLocaleString()}
                                </span>
                            </div>

                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Net Amount Payable to Winner</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>
                                    ₹{calculations.payable.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctionConsole;
