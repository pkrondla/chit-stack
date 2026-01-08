import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const EnrollMember = () => {
    const navigate = useNavigate();
    const { groupId } = useParams(); // Optional, if coming from Group Details
    const [searchParams] = useSearchParams();

    // State
    const [members, setMembers] = useState([]);
    const [groups, setGroups] = useState([]);

    const [formData, setFormData] = useState({
        chitGroupId: groupId || '',
        memberId: '',
        ticketNumber: '' // Default to empty, could auto-suggest
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, groupsRes] = await Promise.all([
                    api.get('/Members'),
                    api.get('/ChitGroups')
                ]);
                setMembers(membersRes.data);
                setGroups(groupsRes.data);

                // If groupId param exists, verify it exists in loaded groups
                if (groupId) {
                    setFormData(prev => ({ ...prev, chitGroupId: groupId }));
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [groupId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Members/allocate-ticket', {
                chitGroupId: parseInt(formData.chitGroupId),
                memberId: parseInt(formData.memberId),
                ticketNumber: parseInt(formData.ticketNumber)
            });
            alert('Member successfully enrolled!');
            navigate('/groups');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to enroll member');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '600px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Enroll Member into Group</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Chit Group</label>
                    <select
                        name="chitGroupId"
                        value={formData.chitGroupId}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">-- Select Group --</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.groupName} (₹{g.chitValue})</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Member</label>
                    <select
                        name="memberId"
                        value={formData.memberId}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">-- Select Member --</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.fullName} ({m.phoneNumber})</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assign Ticket Number</label>
                    <input
                        name="ticketNumber"
                        type="number"
                        value={formData.ticketNumber}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 1"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Note: Ticket 1 is typically reserved for the Foreman.
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => navigate('/groups')} style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#0f172a', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Enroll Member</button>
                </div>
            </form>
        </div>
    );
};

export default EnrollMember;
