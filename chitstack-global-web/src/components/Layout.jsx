import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown } from 'antd';
import {
    LayoutDashboard, Users,
    LogOut, Settings, ChevronDown, Building
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const globalAdminItems = [
        { key: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { key: '/tenants', icon: <Building size={18} />, label: 'Tenants' },
        { key: '/admin/users', icon: <Users size={18} />, label: 'System Users' },
        { key: '/settings', icon: <Settings size={18} />, label: 'Global Settings' },
    ];

    return (
        <AntLayout className="h-screen font-sans">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                theme="dark"
                className="overflow-y-auto"
                style={{ background: '#0f172a' }} // tailwind slate-900
            >
                <div className="flex flex-col items-center justify-center p-4 text-white border-b border-slate-800">
                    <div className={`font-bold transition-all ${collapsed ? 'text-xl' : 'text-lg text-center'}`}>
                        {collapsed ? 'GL' : 'Global Admin'}
                    </div>
                    {!collapsed && <div className="text-xs text-slate-400 mt-1">ChitStack</div>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={({ key }) => navigate(key)}
                    items={globalAdminItems}
                    style={{ background: '#0f172a' }}
                    className="mt-4 border-none"
                />
            </Sider>
            <AntLayout>
                <Header className="bg-white px-6 py-0 shadow-sm flex items-center justify-between z-10">
                    <h1 className="text-xl font-semibold text-slate-800 capitalize m-0">
                        {location.pathname.split('/')[1] || 'Dashboard'}
                    </h1>
                    <div className="flex items-center">
                        <Dropdown menu={{
                            items: [
                                { key: 'logout', label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                            ]
                        }} trigger={['click']} placement="bottomRight">
                            <span className="cursor-pointer text-slate-600 hover:text-slate-900 flex items-center gap-2">
                                {user.fullName || 'Admin User'} <ChevronDown size={16} />
                            </span>
                        </Dropdown>
                    </div>
                </Header>
                <Content className="m-6 p-6 bg-white min-h-[280px] rounded-lg shadow-sm overflow-auto">
                    <Outlet />
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;
