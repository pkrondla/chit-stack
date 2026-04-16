import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Select } from 'antd';
import {
    LayoutDashboard, Users, Gavel, LogOut, FileText,
    ScrollText, IndianRupee, Settings, ChevronDown, Building2, MapPin, BookOpen, Bell, User
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import useAuthStore from '../store/useAuthStore';
import { semanticColors } from '../theme/tokens';

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const user = useAuthStore(state => state.user);
    const activeBranch = useAuthStore(state => state.activeBranch);
    const authorizedBranches = useAuthStore(state => state.authorizedBranches);
    const setActiveBranch = useAuthStore(state => state.setActiveBranch);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const dashboardItem = user.role === 'Admin' ? {
        key: 'dashboardGrp',
        icon: <LayoutDashboard size={18} />,
        label: 'Dashboard',
        children: [
            { key: '/dashboard', label: 'Staff' },
            { key: '/admin/auditor', label: 'Auditor' }
        ]
    } : {
        key: user.role === 'Auditor' ? '/admin/auditor' : '/dashboard',
        icon: <LayoutDashboard size={18} />,
        label: 'Dashboard'
    };

    const adminItems = [
        dashboardItem,
        {
            key: 'groupsGrp',
            icon: <Users size={18} />,
            label: 'Chit Groups',
            children: [
                { key: '/groups', label: 'Group List' }
            ]
        },
        {
            key: 'auctionsGrp',
            icon: <Gavel size={18} />,
            label: 'Auctions',
            children: [
                { key: '/auctions', label: 'Auctions Board' },
                { key: '/finance/payouts', label: 'Payout Entry' }
            ]
        },
        {
            key: 'membersGrp',
            icon: <Users size={18} />,
            label: 'Members',
            children: [
                { key: '/members', label: 'Member List' },
                { key: '/members/passbook', label: 'Passbook' },
            ]
        },
        {
            key: 'collectionsGrp',
            icon: <IndianRupee size={18} />,
            label: 'Collections',
            children: [
                { key: '/finance', label: 'Collection Entry' },
                { key: '/admin/reconciliation', label: 'Agent Collection' },
                { key: '/admin/routes', label: 'Route Mgmt' },
            ]
        },
        {
            key: 'financeGrp',
            icon: <FileText size={18} />,
            label: 'Accounts',
            children: [
                { key: '/finance/vouchers', label: 'Voucher Entry' },
                { key: '/finance/accounts', label: 'Chart of Accounts' },
                { key: '/finance/reconciliation', label: 'Bank Reconciliation' },
            ]
        },
        {
            key: 'reportsGrp',
            icon: <ScrollText size={18} />,
            label: 'Reports',
            children: [
                { key: '/reports', label: 'Financial Reports' },
                { key: '/reports/arrears', label: 'Arrears Report' },
                { key: '/reports/agent-performance', label: 'Agent Performance' },
                { key: '/reports/statutory', label: 'Statutory Forms' },
            ]
        },
        {
            key: 'notifGrp',
            icon: <Bell size={18} />,
            label: 'Notifications',
            children: [
                { key: '/admin/broadcast', label: 'Broadcast Center' },
                { key: '/admin/notifications', label: 'Notifications' },
                { key: '/settings/templates', label: 'Message Designer' },
                { key: '/settings/automation', label: 'Automation Rules' },
                { key: '/settings/notifications', label: 'Gateway Config' }
            ]
        },
        { type: 'divider' },
        { key: '/settings', icon: <Settings size={18} />, label: 'Settings' },
        { key: '/admin/users', icon: <Users size={18} />, label: 'Users' },
    ];

    const portalItems = [
        { key: '/portal', icon: <LayoutDashboard size={18} />, label: 'My Dashboard' },
        { key: '/portal/my-chits', icon: <Users size={18} />, label: 'My Chits' }
    ];

    const agentItems = [
        { key: '/agent/dashboard', icon: <LayoutDashboard size={18} />, label: 'Field Dashboard' },
        { key: '/agent/route', icon: <MapPin size={18} />, label: 'My Route' },
        { key: '/agent/passbook-selector', icon: <BookOpen size={18} />, label: 'Passbook' },
        { key: '/agent/vacancies', icon: <Users size={18} />, label: 'Recruitment' },
    ];

    let menuItems = portalItems;
    if (['Admin', 'Manager', 'Staff', 'Auditor'].includes(user.role)) {
        menuItems = adminItems;
    } else if (user.role === 'Agent') {
        menuItems = agentItems;
    }

    const getPageTitle = (items, path) => {
        for (const item of items) {
            if (item.key === path) return item.label;
            if (item.children) {
                const found = getPageTitle(item.children, path);
                if (found) return found;
            }
        }
        // Fallback to pretty-printing the path segment if no menu item matches
        return path.startsWith('/agent') ? 'Field Agent Portal' : (path.split('/')[1] || 'Dashboard');
    };

    const currentTitle = getPageTitle(menuItems, location.pathname);

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
                    className="flex items-center justify-center h-16 text-xl font-bold shadow-md gap-2 px-3"
                    style={{ background: semanticColors.navBg, color: semanticColors.surface }}
                >
                    <img
                        src="/logo-192.png"
                        alt="ChitStack logo"
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    {!collapsed && <span>ChitStack</span>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname + location.search]}
                    onClick={({ key }) => navigate(key)}
                    items={menuItems}
                    className="mt-4"
                    style={{ background: semanticColors.navBg }}
                />
            </Sider>
            <AntLayout>
                <Header
                    className="px-6 py-0 shadow-sm flex items-center justify-between z-10"
                    style={{ backgroundColor: semanticColors.surface, lineHeight: 'inherit' }}
                >
                    <h1 className="text-xl font-bold capitalize m-0" style={{ color: semanticColors.text }}>
                        {currentTitle}
                    </h1>
                    <div className="flex items-center gap-6">
                        {authorizedBranches && authorizedBranches.length > 0 && (
                            <div
                                className="flex items-center gap-2 px-3 py-1 rounded-md border"
                                style={{
                                    color: semanticColors.textSecondary,
                                    background: semanticColors.appBg,
                                    borderColor: semanticColors.border
                                }}
                            >
                                <Building2 size={16} style={{ color: semanticColors.primary }} />
                                <Select
                                    value={activeBranch?.id}
                                    style={{ width: 180 }}
                                    variant="borderless"
                                    options={authorizedBranches.map(b => ({ label: b.name, value: b.id }))}
                                    onChange={(val) => {
                                        const branch = authorizedBranches.find(b => b.id === val);
                                        if (branch) {
                                            setActiveBranch(branch);
                                            window.location.reload(); // Refresh the page to reload branch data
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <NotificationBell />
                        <Dropdown menu={{
                            items: [
                                { key: 'profile', label: 'My Profile', icon: <User size={16} />, onClick: () => navigate('/profile') },
                                { type: 'divider' },
                                { key: 'logout', label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                            ]
                        }} trigger={['click']} placement="bottomRight">
                            <span className="cursor-pointer flex items-center gap-2 pl-4">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold border"
                                    style={{ background: semanticColors.primaryLight, color: semanticColors.infoBlue, borderColor: semanticColors.primaryBorder }}
                                >
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden md:block text-sm">
                                    <div className="font-semibold leading-tight" style={{ color: semanticColors.text }}>
                                        {user.fullName || user.username}
                                    </div>
                                    <div className="text-xs font-medium" style={{ color: semanticColors.textSecondary }}>
                                        {user.role}
                                    </div>
                                </div>
                                <ChevronDown size={14} style={{ color: semanticColors.textMuted }} />
                            </span>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    className="m-4 md:m-6 p-4 md:p-6 min-h-[calc(100vh-120px)] rounded-2xl shadow-sm overflow-x-hidden"
                    style={{ background: semanticColors.surface }}
                >
                    <div className="max-w-full overflow-x-hidden">
                        <Outlet />
                    </div>
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;
