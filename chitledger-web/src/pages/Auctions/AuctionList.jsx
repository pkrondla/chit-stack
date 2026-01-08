import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Gavel, Play, Eye } from 'lucide-react';

const Auctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            const response = await api.get('/Auctions');
            setAuctions(response.data);
        } catch (error) {
            console.error("Failed to fetch auctions", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Auction Board</h2>
                {/* Optional: Button to manually schedule next month's auctions if not auto-scheduled */}
            </div>

            {loading ? <div>Loading...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {auctions.map(auction => (
                        <div key={auction.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: auction.auctionStatus === 'Closed' ? '4px solid #166534' : '4px solid #eab308' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#64748b' }}>
                                    {new Date(auction.auctionDate).toLocaleDateString()}
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold',
                                    backgroundColor: auction.auctionStatus === 'Closed' ? '#dcfce7' : '#fef9c3',
                                    color: auction.auctionStatus === 'Closed' ? '#166534' : '#854d0e'
                                }}>
                                    {auction.auctionStatus}
                                </span>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{auction.groupName}</h3>
                            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>Installment #{auction.installmentNumber}</div>

                            {auction.auctionStatus === 'Closed' ? (
                                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>Winning Bid:</span>
                                        <span style={{ fontWeight: 'bold' }}>₹{auction.winningBidAmount.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Dividend:</span>
                                        <span style={{ fontWeight: 'bold', color: '#166534' }}>₹{auction.dividendAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#94a3b8', fontSize: '0.875rem' }}>
                                    Ready to conduct auction.
                                </div>
                            )}

                            <button
                                onClick={() => navigate(`/auctions/console/${auction.id}`)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                                    padding: '0.75rem', borderRadius: '4px', cursor: 'pointer',
                                    backgroundColor: auction.auctionStatus === 'Closed' ? 'white' : '#0f172a',
                                    color: auction.auctionStatus === 'Closed' ? '#0f172a' : 'white',
                                    border: auction.auctionStatus === 'Closed' ? '1px solid #0f172a' : 'none'
                                }}
                            >
                                {auction.auctionStatus === 'Closed' ? (
                                    <><Eye size={18} style={{ marginRight: '0.5rem' }} /> View Details</>
                                ) : (
                                    <><Play size={18} style={{ marginRight: '0.5rem' }} /> Start Console</>
                                )}
                            </button>

                            {auction.auctionStatus !== 'Closed' && (
                                <button
                                    onClick={() => navigate(`/auctions/live/${auction.id}`)}
                                    style={{
                                        marginTop: '0.5rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                                        padding: '0.75rem', borderRadius: '4px', cursor: 'pointer',
                                        backgroundColor: '#ef4444', color: 'white', border: 'none'
                                    }}
                                >
                                    <Gavel size={18} style={{ marginRight: '0.5rem' }} /> Enter Live Room
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Auctions;
