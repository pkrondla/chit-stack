import { useState, useEffect } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await api.get('/ChitGroups'); // Ensure this matches Backend Route
            setGroups(response.data);
        } catch (error) {
            console.error("Failed to fetch groups", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Active Chit Groups</h2>
                <button
                    onClick={() => navigate('/groups/new')}
                    style={{
                        display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', color: 'white',
                        padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    New Chit Group
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {groups.map(group => (
                        <div key={group.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{group.groupName}</h3>
                                <span style={{
                                    padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold',
                                    backgroundColor: group.status === 'Running' ? '#dcfce7' : '#f1f5f9',
                                    color: group.status === 'Running' ? '#166534' : '#475569'
                                }}>
                                    {group.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                <div>
                                    <div style={{ color: '#64748b' }}>Chit Value</div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>₹{group.chitValue.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748b' }}>Duration</div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>{group.durationMonths} Months</div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748b' }}>Monthly Due</div>
                                    <div style={{ fontWeight: '600' }}>₹{(group.chitValue / group.durationMonths).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748b' }}>Next Auction</div>
                                    <div style={{ fontWeight: '600' }}>{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => navigate(`/groups/${group.id}/tickets`)}
                                    title="Manage Members & Vacancies"
                                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    Members
                                </button>
                                <button style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>
                                    Auctions
                                </button>
                                <button
                                    onClick={() => navigate(`/groups/enroll?groupId=${group.id}`)}
                                    title="Enroll Member"
                                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => window.open(`https://localhost:7191/api/forms/sanction/${group.id}`, '_blank')}
                                    title="Download Sanction Form"
                                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    <FileText size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Groups;
