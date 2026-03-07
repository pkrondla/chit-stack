import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown } from 'antd';
import {
    LayoutDashboard, Users, Gavel, LogOut, FileText,
    ScrollText, IndianRupee, Settings, ChevronDown
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

    const adminItems = [
        { key: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { key: '/groups', icon: <Users size={18} />, label: 'Chit Groups' },
        { key: '/auctions', icon: <Gavel size={18} />, label: 'Auctions' },
        { key: '/members', icon: <Users size={18} />, label: 'Members' },
        { key: '/finance', icon: <FileText size={18} />, label: 'Collections' },
        { key: '/finance/payouts', icon: <IndianRupee size={18} />, label: 'Payouts' },
        { key: '/reports', icon: <ScrollText size={18} />, label: 'Reports' },
        { type: 'divider' },
        {
            key: 'setupGrp', label: 'Setup', type: 'group', children: [
                { key: '/settings', icon: <Settings size={18} />, label: 'Settings' },
                { key: '/admin/users', icon: <Users size={18} />, label: 'Staff Users' },
            ]
        },
    ];

    const portalItems = [
        { key: '/portal', icon: <LayoutDashboard size={18} />, label: 'My Dashboard' }
    ];

    const menuItems = (user.role === 'Admin' || user.role === 'Manager') ? adminItems : portalItems;

    return (
        <AntLayout className="h-screen font-sans">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                theme="dark"
                className="overflow-y-auto"
            >
                <div className="flex items-center justify-center h-16 text-white text-xl font-bold bg-slate-900 shadow-md">
                    {collapsed ? 'CL' : 'ChitLedger'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={({ key }) => navigate(key)}
                    items={menuItems}
                    className="mt-4"
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
                                {user.fullName} ({user.role}) <ChevronDown size={16} />
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
