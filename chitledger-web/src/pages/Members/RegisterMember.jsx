import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const RegisterMember = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        userId: '', // Should be linked to an existing User if applicable, or created new
        phoneNumber: '',
        email: '',
        aadhaarNumber: '',
        panNumber: '',
        address: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Note: The EnrollMember/CreateMember commands in implementation_plan.md differ slightly from this simple CRUD.
            // We should ensure the backend supports a direct 'Create Member' or we treat this as 'Enrollment'.
            // For now, assuming standard REST POST to /Members based on previous patterns.
            await api.post('/Members', formData);
            navigate('/members');
        } catch (error) {
            console.error(error);
            alert('Failed to register member');
        }
    };

    return (
        <div style={{ maxWidth: '800px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Register New Subscriber</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                        <input name="fullName" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div>
                        {/* Optional: User Linking for Login Access */}
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Linked User ID (Optional)</label>
                        <input name="userId" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="UUID if account exists" />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number</label>
                        <input name="phoneNumber" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                        <input name="email" type="email" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Aadhaar Number</label>
                        <input name="aadhaarNumber" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>PAN Number</label>
                        <input name="panNumber" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Residential Address</label>
                    <textarea name="address" rows="3" onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit' }}></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => navigate('/members')} style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#0f172a', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Register Subscriber</button>
                </div>
            </form>
        </div>
    );
};

export default RegisterMember;
