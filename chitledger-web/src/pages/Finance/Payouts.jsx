import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { IndianRupee, CheckCircle, Clock } from 'lucide-react';

const Payouts = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Payment Modal State
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [paymentMode, setPaymentMode] = useState('Bank');
    const [referenceNumber, setReferenceNumber] = useState('');

    const fetchAuctions = async () => {
        try {
            const response = await api.get('/Auctions');
            // Filter: Closed Auctions + Has Winner + Not Paid (or show Check History tab)
            setAuctions(response.data.filter(a => a.auctionStatus === 'Closed' && a.winningTicketId));
        } catch (error) {
            console.error("Failed to load auctions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    // Guarantor State
    const [guarantors, setGuarantors] = useState([]);
    const [showGuarantorForm, setShowGuarantorForm] = useState(false);
    const [newGuarantor, setNewGuarantor] = useState({ name: '', phoneNumber: '', aadhaarNumber: '', annualIncome: 0, occupation: '' });

    const fetchGuarantors = async (ticketId) => {
        try {
            const res = await api.get(`/Guarantors/${ticketId}`);
            setGuarantors(res.data);
        } catch (e) {
            console.error("Failed to load guarantors", e);
        }
    };

    const handleAddGuarantor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Guarantors', {
                ticketId: selectedAuction.winningTicketId,
                ...newGuarantor
            });
            alert("Guarantor Added");
            setNewGuarantor({ name: '', phoneNumber: '', aadhaarNumber: '', annualIncome: 0, occupation: '' });
            setShowGuarantorForm(false);
            fetchGuarantors(selectedAuction.winningTicketId);
        } catch (e) {
            alert(e.response?.data?.error || e.message);
        }
    };

    // Effect to load guarantors when auction selected
    useEffect(() => {
        if (selectedAuction?.winningTicketId) {
            fetchGuarantors(selectedAuction.winningTicketId);
        } else {
            setGuarantors([]);
        }
    }, [selectedAuction]);

    const handleDisburse = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Finance/payout', {
                auctionId: selectedAuction.id,
                paymentMode,
                referenceNumber
            });
            alert("Payment Disbursed Successfully!");
            setSelectedAuction(null);
            fetchAuctions(); // Refresh
        } catch (error) {
            alert("Payout Failed: " + (error.response?.data?.error || error.message));
        }
    };

    if (loading) return <div>Loading Payouts...</div>;

    const pendingPayouts = auctions.filter(a => !a.isPaid);
    const completedPayouts = auctions.filter(a => a.isPaid);

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Prize Money Payouts</h2>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#dc2626' }}>Pending Disbursements</h3>
                {pendingPayouts.length === 0 ? <p style={{ color: '#64748b' }}>No pending payouts.</p> : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {pendingPayouts.map(auction => (
                            <div key={auction.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{auction.groupName}</div>
                                    <div style={{ color: '#64748b' }}>
                                        Auction Date: {new Date(auction.auctionDate).toLocaleDateString()} • Ticket ID: {auction.winningTicketId}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', color: '#0f172a', fontWeight: '500' }}>
                                        Net Payable: ₹{auction.netPayableAmount.toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedAuction(auction)}
                                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                >
                                    <IndianRupee size={16} style={{ marginRight: '0.5rem' }} />
                                    Disburse
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#166534' }}>Payment History</h3>
                {completedPayouts.length === 0 ? <p style={{ color: '#64748b' }}>No history available.</p> : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {completedPayouts.map(auction => (
                            <div key={auction.id} style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#166534' }}>{auction.groupName}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                                        Paid on {new Date(auction.paymentDate).toLocaleDateString()} • ₹{auction.netPayableAmount.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#166534' }}>
                                    <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
                                    Paid
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedAuction && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Confirm Payout</h3>
                        <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                            Disburse <strong>₹{selectedAuction.netPayableAmount.toLocaleString()}</strong> for {selectedAuction.groupName}?
                        </p>

                        {/* Guarantors Section */}
                        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>Security / Guarantors</label>
                                <button
                                    type="button"
                                    onClick={() => setShowGuarantorForm(!showGuarantorForm)}
                                    style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + Add Guarantor
                                </button>
                            </div>

                            {showGuarantorForm && (
                                <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                    <input placeholder="Name" style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.25rem' }}
                                        value={newGuarantor.name} onChange={e => setNewGuarantor({ ...newGuarantor, name: e.target.value })} />
                                    <input placeholder="Phone" style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.25rem' }}
                                        value={newGuarantor.phoneNumber} onChange={e => setNewGuarantor({ ...newGuarantor, phoneNumber: e.target.value })} />
                                    <input placeholder="Aadhaar" style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.25rem' }}
                                        value={newGuarantor.aadhaarNumber} onChange={e => setNewGuarantor({ ...newGuarantor, aadhaarNumber: e.target.value })} />
                                    <input placeholder="Annual Income" type="number" style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.25rem' }}
                                        value={newGuarantor.annualIncome} onChange={e => setNewGuarantor({ ...newGuarantor, annualIncome: e.target.value })} />
                                    <button type="button" onClick={handleAddGuarantor} style={{ width: '100%', padding: '0.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Save Guarantor</button>
                                </div>
                            )}

                            {guarantors.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No guarantors added. Risk Check Recommended.</div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {guarantors.map(g => (
                                        <li key={g.id} style={{ fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <strong>{g.name}</strong> ({g.relationship}) - Ph: {g.phoneNumber}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <form onSubmit={handleDisburse}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="Bank">Bank Transfer / NEFT</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>

                            {paymentMode !== 'Cash' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reference No / Cheque No</label>
                                    <input
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAuction(null)}
                                    style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payouts;
