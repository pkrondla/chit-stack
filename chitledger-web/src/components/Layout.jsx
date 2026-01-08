import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Gavel, LogOut, FileText, ScrollText } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, active }) => (
    <Link to={to} style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        textDecoration: 'none',
        color: active ? 'white' : '#cbd5e1',
        backgroundColor: active ? '#334155' : 'transparent',
        borderRadius: '0.375rem',
        marginBottom: '0.25rem'
    }}>
        <Icon size={20} style={{ marginRight: '0.75rem' }} />
        <span>{label}</span>
    </Link>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
                    ChitLedger
                </div>

                <nav style={{ flex: 1 }}>
                    {user.role === 'Admin' || user.role === 'Manager' ? (
                        <>
                            <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
                            <SidebarItem to="/groups" icon={Users} label="Chit Groups" active={location.pathname.startsWith('/groups')} />
                            <SidebarItem to="/auctions" icon={Gavel} label="Auctions" active={location.pathname.startsWith('/auctions')} />
                            <SidebarItem to="/members" icon={Users} label="Members" active={location.pathname.startsWith('/members')} />
                            <SidebarItem to="/finance" icon={FileText} label="Finance" active={location.pathname.startsWith('/finance')} />
                            <SidebarItem to="/reports" icon={ScrollText} label="Reports" active={location.pathname.startsWith('/reports')} />
                        </>
                    ) : (
                        <SidebarItem to="/portal" icon={LayoutDashboard} label="My Dashboard" active={location.pathname === '/portal'} />
                    )}
                </nav>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                        {user.fullName} ({user.role})
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', width: '100%', padding: '0.5rem',
                            background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer'
                        }}
                    >
                        <LogOut size={18} style={{ marginRight: '0.75rem' }} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, backgroundColor: '#f1f5f9', overflow: 'auto' }}>
                <header style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0f172a' }}>
                        {location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1) || 'Dashboard'}
                    </h1>
                </header>
                <div style={{ padding: '2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
