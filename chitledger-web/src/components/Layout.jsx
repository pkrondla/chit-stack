import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Select } from 'antd';
import {
    LayoutDashboard, Users, Gavel, LogOut, FileText,
    ScrollText, IndianRupee, Settings, ChevronDown, Building2
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

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
                { key: '/groups', label: 'Group List' },
                { key: '/reports/statutory', label: 'Statutory Forms' }
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
        { key: '/members', icon: <Users size={18} />, label: 'Members' },
        {
            key: 'collectionsGrp',
            icon: <IndianRupee size={18} />,
            label: 'Collections',
            children: [
                { key: '/finance', label: 'Field Entry' },
                { key: '/admin/reconciliation', label: 'Office Verification' },
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
                { key: '/reports', label: 'Day Book' },
                { key: '/reports?tab=Ledger', label: 'General Ledger' },
                { key: '/reports?tab=ProfitLoss', label: 'Profit & Loss' },
                { key: '/reports?tab=TrialBalance', label: 'Trial Balance' },
            ]
        },
        { type: 'divider' },
        {
            key: 'setupGrp', label: 'Setup', type: 'group', children: [
                { key: '/settings', icon: <Settings size={18} />, label: 'Settings' },
                { key: '/admin/users', icon: <Users size={18} />, label: 'Users' },
            ]
        },
    ];

    const portalItems = [
        { key: '/portal', icon: <LayoutDashboard size={18} />, label: 'My Dashboard' },
        { key: '/portal/my-chits', icon: <Users size={18} />, label: 'My Chits' }
    ];

    const agentItems = [
        { key: '/agent/dashboard', icon: <LayoutDashboard size={18} />, label: 'Field Dashboard' },
        { key: '/agent/route', icon: <MapPin size={18} />, label: 'My Route' },
        { key: '/agent/vacancies', icon: <Users size={18} />, label: 'Recruitment' },
    ];

    let menuItems = portalItems;
    if (['Admin', 'Manager', 'Staff', 'Auditor'].includes(user.role)) {
        menuItems = adminItems;
    } else if (user.role === 'Agent') {
        menuItems = agentItems;
    }

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
                    selectedKeys={[location.pathname + location.search]}
                    onClick={({ key }) => navigate(key)}
                    items={menuItems}
                    className="mt-4"
                />
            </Sider>
            <AntLayout>
                <Header
                    className="px-6 py-0 shadow-sm flex items-center justify-between z-10"
                    style={{ backgroundColor: '#ffffff', lineHeight: 'inherit' }}
                >
                    <h1 className="text-xl font-bold text-gray-900 capitalize m-0">
                        {location.pathname.startsWith('/agent') ? 'Field Agent Portal' : (location.pathname.split('/')[1] || 'Dashboard')}
                    </h1>
                    <div className="flex items-center gap-6">
                        {authorizedBranches && authorizedBranches.length > 0 && (
                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
                                <Building2 size={16} className="text-blue-600" />
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
                        <Dropdown menu={{
                            items: [
                                { key: 'logout', label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                            ]
                        }} trigger={['click']} placement="bottomRight">
                            <span className="cursor-pointer flex items-center gap-2 pl-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden md:block text-sm">
                                    <div className="font-semibold text-slate-900 leading-tight">{user.fullName || user.username}</div>
                                    <div className="text-xs text-slate-600 font-medium">{user.role}</div>
                                </div>
                                <ChevronDown size={14} className="text-slate-500" />
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
