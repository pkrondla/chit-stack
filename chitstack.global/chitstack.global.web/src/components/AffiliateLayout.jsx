import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown } from 'antd';
import { LayoutDashboard, IndianRupee, Users, Receipt, LogOut, ChevronDown, Handshake } from 'lucide-react';
import useAffiliateAuthStore from '../store/useAffiliateAuthStore';
import { semanticColors } from '../theme/tokens';

const { Header, Sider, Content } = AntLayout;

export default function AffiliateLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const affiliate = useAffiliateAuthStore(state => state.affiliate);
    const logout = useAffiliateAuthStore(state => state.logout);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/affiliate/login');
    };

    if (!affiliate) return null;

    const menuItems = [
        { key: '/affiliate/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { key: '/affiliate/tenants', icon: <Users size={18} />, label: 'My Referrals' },
        { key: '/affiliate/commissions', icon: <IndianRupee size={18} />, label: 'Commissions' },
        { key: '/affiliate/payouts', icon: <Receipt size={18} />, label: 'Payouts' },
    ];

    return (
        <AntLayout className="h-screen font-sans">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="dark"
                className="overflow-y-auto"
                style={{ background: semanticColors.navBg }}
            >
                <div className="flex flex-col items-center justify-center p-4 border-b"
                    style={{ background: semanticColors.navBg, borderColor: semanticColors.textStrong, color: semanticColors.surface }}>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-700 mb-2">
                        <Handshake size={20} className="text-white" />
                    </div>
                    {!collapsed && (
                        <>
                            <div className="font-bold text-sm text-center">Affiliate Portal</div>
                            <div className="text-xs mt-1" style={{ color: semanticColors.textMuted }}>ChitStack</div>
                        </>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={({ key }) => navigate(key)}
                    items={menuItems}
                    style={{ background: semanticColors.navBg }}
                    className="mt-4 border-none"
                />
            </Sider>
            <AntLayout>
                <Header className="px-6 py-0 shadow-sm flex items-center justify-between z-10"
                    style={{ backgroundColor: semanticColors.surface }}>
                    <div className="text-sm text-slate-500">
                        Code: <strong className="text-indigo-600">{affiliate.code}</strong>
                    </div>
                    <Dropdown menu={{
                        items: [
                            { key: 'logout', label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                        ]
                    }} trigger={['click']} placement="bottomRight">
                        <span className="cursor-pointer flex items-center gap-2" style={{ color: semanticColors.textSecondary }}>
                            {affiliate.name} <ChevronDown size={16} />
                        </span>
                    </Dropdown>
                </Header>
                <Content className="m-6 p-6 min-h-[280px] rounded-lg shadow-sm overflow-auto"
                    style={{ background: semanticColors.surface }}>
                    <Outlet />
                </Content>
            </AntLayout>
        </AntLayout>
    );
}
