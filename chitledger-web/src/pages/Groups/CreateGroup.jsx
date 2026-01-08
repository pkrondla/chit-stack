import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CreateGroup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        groupName: '',
        chitValue: '',
        durationMonths: 20,
        commissionPercentage: 5,
        startDate: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/ChitGroups', {
                groupName: formData.groupName,
                chitValue: parseFloat(formData.chitValue),
                durationMonths: parseInt(formData.durationMonths),
                commissionPercentage: parseFloat(formData.commissionPercentage),
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString()
            });
            navigate('/groups');
        } catch (error) {
            alert('Failed to create group');
        }
    };

    return (
        <div style={{ maxWidth: '600px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Create New Chit Group</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Group Name</label>
                    <input name="groupName" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Chit Value (₹)</label>
                        <input name="chitValue" type="number" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Duration (Months)</label>
                        <input name="durationMonths" type="number" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Commission (%)</label>
                        <input name="commissionPercentage" type="number" defaultValue="5" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Start Date</label>
                        <input name="startDate" type="date" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => navigate('/groups')} style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#0f172a', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Create Group</button>
                </div>
            </form>
        </div>
    );
};

export default CreateGroup;
