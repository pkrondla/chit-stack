import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LayoutDashboard, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const PortalDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/Customer/dashboard');
                setData(response.data);
            } catch (error) {
                console.error("Failed to load dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Failed to load data. Please ensure you are logged in as a Subscriber linked to a Member profile.</div>;

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>My Dashboard</h2>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#64748b' }}>
                        <AlertCircle size={20} style={{ marginRight: '0.5rem' }} /> Pending Liability
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                        ₹{data.totalLiability.toLocaleString()}
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#64748b' }}>
                        <TrendingUp size={20} style={{ marginRight: '0.5rem' }} /> Total Savings (Dividend)
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>
                        ₹{data.totalSavings.toLocaleString()}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* My Tickets */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>My Enrolled Chits</h3>
                    {data.myTickets.length === 0 ? <p>No active chits found.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.myTickets.map(ticket => (
                                <div key={ticket.ticketId} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{ticket.groupName}</span>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold',
                                            backgroundColor: ticket.isPrized ? '#dcfce7' : '#e0f2fe',
                                            color: ticket.isPrized ? '#166534' : '#0369a1'
                                        }}>
                                            {ticket.isPrized ? 'Prized' : 'Active'}
                                        </span>
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        Ticket #{ticket.ticketNumber} • Value: ₹{ticket.chitValue.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Auctions */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Upcoming Auctions</h3>
                    {data.upcomingAuctions.length === 0 ? <p>No upcoming auctions.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.upcomingAuctions.map(auction => (
                                <div key={auction.auctionId} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                    <Clock size={20} style={{ marginRight: '1rem', color: '#854d0e' }} />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{auction.groupName}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                            {new Date(auction.date).toLocaleDateString()} • Installment #{auction.installment}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortalDashboard;
