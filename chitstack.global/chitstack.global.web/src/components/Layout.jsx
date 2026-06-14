import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown } from 'antd';
import {
    LayoutDashboard, Users,
    LogOut, Settings, Settings2, ChevronDown, Building, Package, ShoppingBag
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { semanticColors } from '../theme/tokens';

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
        { key: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Subscription Orders' },
        { key: '/admin/catalog', icon: <Package size={18} />, label: 'Product Catalog' },
        { key: '/admin/users', icon: <Users size={18} />, label: 'System Users' },
        { key: '/admin/settings', icon: <Settings2 size={18} />, label: 'Platform Settings' },
    ];

    return (
        <AntLayout className="h-screen font-sans">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                theme="dark"
                className="overflow-y-auto"
                style={{ background: semanticColors.navBg }}
            >
                <div
                    className="flex flex-col items-center justify-center p-4 border-b"
                    style={{ background: semanticColors.navBg, borderColor: semanticColors.textStrong, color: semanticColors.surface }}
                >
                    <img
                        src="/logo-192.png"
                        alt="ChitStack logo"
                        className={`rounded-lg object-cover mb-2 transition-all ${collapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
                    />
                    <div className={`font-bold transition-all ${collapsed ? 'text-xl' : 'text-lg text-center'}`}>
                        {collapsed ? 'GA' : 'Global Admin'}
                    </div>
                    {!collapsed && <div className="text-xs mt-1" style={{ color: semanticColors.textMuted }}>ChitStack</div>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={({ key }) => navigate(key)}
                    items={globalAdminItems}
                    style={{ background: semanticColors.navBg }}
                    className="mt-4 border-none"
                />
            </Sider>
            <AntLayout>
                <Header
                    className="px-6 py-0 shadow-sm flex items-center justify-between z-10"
                    style={{ backgroundColor: semanticColors.surface }}
                >
                    <h1 className="text-xl font-semibold capitalize m-0" style={{ color: semanticColors.text }}>
                        {location.pathname.split('/')[1] || 'Dashboard'}
                    </h1>
                    <div className="flex items-center">
                        <Dropdown menu={{
                            items: [
                                { key: 'logout', label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                            ]
                        }} trigger={['click']} placement="bottomRight">
                            <span className="cursor-pointer flex items-center gap-2" style={{ color: semanticColors.textSecondary }}>
                                {user.fullName || 'Admin User'} <ChevronDown size={16} />
                            </span>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    className="m-6 p-6 min-h-[280px] rounded-lg shadow-sm overflow-auto"
                    style={{ background: semanticColors.surface }}
                >
                    <Outlet />
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;
