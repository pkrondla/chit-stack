import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Building, Plus } from 'lucide-react';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [newTenant, setNewTenant] = useState({ name: '', tenantKey: '' });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/Tenants');
            setTenants(res.data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        try {
            await api.post('/Tenants', newTenant);
            alert("Tenant Created!");
            setNewTenant({ name: '', tenantKey: '' });
            fetchTenants();
        } catch (e) {
            alert("Error: " + (e.response?.data?.error || e.message));
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Global Admin: Tenant Management</h2>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Onboard New Tenant</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tenant Name (Organization)</label>
                        <input
                            value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tenant Key (Subdomain)</label>
                        <input
                            value={newTenant.tenantKey} onChange={e => setNewTenant({ ...newTenant, tenantKey: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#0f172a', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Plus size={18} style={{ marginRight: '0.5rem' }} /> Create
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {tenants.map(t => (
                    <div key={t.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Building size={24} color="#64748b" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t.name}</div>
                                <div style={{ color: '#64748b' }}>Key: {t.tenantKey}</div>
                            </div>
                        </div>
                        <div style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '999px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {t.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tenants;
