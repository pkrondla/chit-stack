import { useState, useEffect } from 'react';
import { Plus, Search, User } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await api.get('/Members');
            setMembers(response.data);
        } catch (error) {
            console.error("Failed to fetch members", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Member Directory</h2>
                <button
                    onClick={() => navigate('/members/new')}
                    style={{
                        display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', color: 'white',
                        padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    Register Member
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#64748b' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#64748b' }}>Contact</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#64748b' }}>KYC Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#64748b' }}>Registered On</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#64748b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>
                                                <User size={16} color="#64748b" />
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{member.fullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem' }}>{member.phoneNumber}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold',
                                            backgroundColor: member.panNumber ? '#dcfce7' : '#fee2e2',
                                            color: member.panNumber ? '#166534' : '#991b1b'
                                        }}>
                                            {member.panNumber ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                                        {new Date(member.joinedDate).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Members;
