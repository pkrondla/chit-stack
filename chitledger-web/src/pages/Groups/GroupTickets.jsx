import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { UserMinus, UserPlus, AlertTriangle, FileText } from 'lucide-react';

const GroupTickets = () => {
    const { groupId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableMembers, setMembers] = useState([]);

    // Nominee State
    const [selectedNomineeTicket, setSelectedNomineeTicket] = useState(null);
    const [nomineeForm, setNomineeForm] = useState({ fullName: '', relationship: '', dateOfBirth: '', aadhaarNumber: '', phoneNumber: '', guardianName: '' });

    const handleNomineeClick = async (ticket) => {
        setSelectedNomineeTicket(ticket);
        setNomineeForm({ fullName: '', relationship: '', dateOfBirth: '', aadhaarNumber: '', phoneNumber: '', guardianName: '' }); // Reset
        try {
            const res = await api.get(`/Nominees/${ticket.id}`);
            if (res.data.data) {
                const n = res.data.data;
                setNomineeForm({
                    fullName: n.fullName,
                    relationship: n.relationship,
                    dateOfBirth: n.dateOfBirth.split('T')[0],
                    aadhaarNumber: n.aadhaarNumber || '',
                    phoneNumber: n.phoneNumber || '',
                    guardianName: n.guardianName || ''
                });
            }
        } catch (e) { console.error("No nominee found or error", e); }
    };

    const saveNominee = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Nominees', { ...nomineeForm, ticketId: selectedNomineeTicket.id });
            alert("Nominee Saved!");
            setSelectedNomineeTicket(null);
        } catch (error) {
            alert("Failed to save nominee");
        }
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Ticket #{ticket.ticketNumber}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleNomineeClick(ticket)}
                                    title="Manage Nominee"
                                    style={{ padding: '0.2rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <UserPlus size={18} />
                                </button>
                                <button
                                    onClick={() => window.open(`https://localhost:7191/api/forms/subscriber-agreement/${ticket.id}`, '_blank')}
                                    title="Download Agreement"
                                    style={{ padding: '0.2rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <FileText size={18} />
                                </button>
                                <span style={{
                                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                    backgroundColor: ticket.status === 'Active' ? '#dcfce7' : '#fef3c7',
                                    color: ticket.status === 'Active' ? '#166534' : '#b45309'
                                }}>
                                    {ticket.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', color: '#475569' }}>
                            {ticket.memberName}
                            {ticket.isPrized && <span style={{ marginLeft: '0.5rem', color: '#166534', fontWeight: 'bold' }}>(Prized)</span>}
                        </div>

                        {
                            ticket.status === 'Active' && !ticket.isPrized && (
                                <button
                                    onClick={() => handleRemove(ticket.id)}
                                    style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <UserMinus size={16} style={{ marginRight: '0.5rem' }} /> Remove Subscriber
                                </button>
                            )
                        }

                        {
                            ticket.status === 'Vacant' && (
                                <button
                                    onClick={() => setSelectedTicket(ticket)}
                                    style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <UserPlus size={16} style={{ marginRight: '0.5rem' }} /> Assign Vacancy
                                </button>
                            )
                        }
                    </div>
                ))}
            </div>

            {/* Assign Modal */}
            {
                selectedTicket && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
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
                )
            }

            {/* Nominee Modal */}
            {selectedNomineeTicket && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            Nominee for Ticket #{selectedNomineeTicket.ticketNumber}
                        </h3>
                        <form onSubmit={saveNominee}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                                <input required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                    value={nomineeForm.fullName} onChange={e => setNomineeForm({ ...nomineeForm, fullName: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Relationship</label>
                                    <input required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                        value={nomineeForm.relationship} onChange={e => setNomineeForm({ ...nomineeForm, relationship: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Birth</label>
                                    <input required type="date" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                        value={nomineeForm.dateOfBirth} onChange={e => setNomineeForm({ ...nomineeForm, dateOfBirth: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Aadhaar Number</label>
                                <input style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                    value={nomineeForm.aadhaarNumber} onChange={e => setNomineeForm({ ...nomineeForm, aadhaarNumber: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number</label>
                                <input style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                    value={nomineeForm.phoneNumber} onChange={e => setNomineeForm({ ...nomineeForm, phoneNumber: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Guardian (If Nominee is Minor)</label>
                                <input placeholder="Guardian Name" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                    value={nomineeForm.guardianName} onChange={e => setNomineeForm({ ...nomineeForm, guardianName: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setSelectedNomineeTicket(null)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Nominee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default GroupTickets;
