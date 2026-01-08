import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { UserMinus, UserPlus, AlertTriangle } from 'lucide-react';

const GroupTickets = () => {
    const { groupId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableMembers, setMembers] = useState([]);

    // Assignment State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    const fetchTickets = async () => {
        try {
            const res = await api.get(`/Tickets/${groupId}`);
            setTickets(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/Members');
            setMembers(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchTickets();
        fetchMembers();
    }, [groupId]);

    const handleRemove = async (ticketId) => {
        if (!window.confirm("Are you sure you want to remove this subscriber? This will mark the ticket as Vacant.")) return;
        try {
            await api.post('/Tickets/remove', { ticketId, reason: 'User requested' });
            alert("Subscriber removed.");
            fetchTickets();
        } catch (e) { alert(e.response?.data?.error || e.message); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Tickets/assign-vacancy', {
                ticketId: selectedTicket.id,
                newMemberId: parseInt(selectedMemberId)
            });
            alert("Vacancy Assigned!");
            setSelectedTicket(null);
            fetchTickets();
        } catch (e) { alert(e.response?.data?.error || e.message); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Ticket Management</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {tickets.map(ticket => (
                    <div key={ticket.id} style={{
                        backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${ticket.status === 'Active' ? '#166534' : '#f59e0b'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Ticket #{ticket.ticketNumber}</span>
                            <span style={{
                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                backgroundColor: ticket.status === 'Active' ? '#dcfce7' : '#fef3c7',
                                color: ticket.status === 'Active' ? '#166534' : '#b45309'
                            }}>
                                {ticket.status}
                            </span>
                        </div>

                        <div style={{ marginBottom: '1rem', color: '#475569' }}>
                            {ticket.memberName}
                            {ticket.isPrized && <span style={{ marginLeft: '0.5rem', color: '#166534', fontWeight: 'bold' }}>(Prized)</span>}
                        </div>

                        {ticket.status === 'Active' && !ticket.isPrized && (
                            <button
                                onClick={() => handleRemove(ticket.id)}
                                style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                <UserMinus size={16} style={{ marginRight: '0.5rem' }} /> Remove Subscriber
                            </button>
                        )}

                        {ticket.status === 'Vacant' && (
                            <button
                                onClick={() => setSelectedTicket(ticket)}
                                style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                <UserPlus size={16} style={{ marginRight: '0.5rem' }} /> Assign Vacancy
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Assign Modal */}
            {selectedTicket && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Assign Vacant Ticket #{selectedTicket.ticketNumber}</h3>
                        <form onSubmit={handleAssign}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select New Member</label>
                                <select
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="">-- Choose Member --</option>
                                    {availableMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.fullName} ({m.phoneNumber})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setSelectedTicket(null)} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f1f5f9' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '0.5rem', backgroundColor: '#0f172a', color: 'white' }}>Assign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupTickets;
