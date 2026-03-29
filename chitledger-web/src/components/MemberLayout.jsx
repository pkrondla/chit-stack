import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Button, Dropdown, Badge, Menu } from 'antd';
import {
    LayoutDashboard, Gavel, LogOut,
    History as HistoryIcon, Wallet, Bell, User, ChevronDown, Menu as MenuIcon
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

import NotificationBell from './NotificationBell';

const { Header, Content } = AntLayout;

const MemberLayout = () => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const navItems = [
        { key: '/portal', icon: <LayoutDashboard size={20} />, label: 'Home' },
        { key: '/portal/my-chits', icon: <HistoryIcon size={20} />, label: 'Chits' },
        { key: '/portal/auctions', icon: <Gavel size={20} />, label: 'Auction' },
        { key: '/portal/payments', icon: <Wallet size={20} />, label: 'Pay' },
    ];

    return (
        <AntLayout className="min-h-screen bg-slate-50/50">
            {/* Top Navigation - Enterprise-Grade Header */}
            <Header
                className="sticky top-0 z-50 w-full flex items-center justify-between !bg-slate-900 border-b border-white/5 shadow-2xl !overflow-visible"
                style={{ color: '#ffffff', display: 'flex', alignItems: 'center', paddingLeft: '20px', paddingRight: '20px' }}
            >
                <div className="flex items-center gap-6 md:gap-14">
                    {/* Brand Logo - More Minimal */}
                    <div
                        className="h-12 w-12 bg-white/10 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all"
                        onClick={() => navigate('/portal')}
                    >
                        C
                    </div>

                    {/* System Navigation - Standard Ant Design Menu to match Admin */}
                    <div className="hidden md:block min-w-[500px]">
                        <Menu
                            mode="horizontal"
                            theme="dark"
                            selectedKeys={[location.pathname]}
                            onClick={({ key }) => navigate(key)}
                            items={navItems}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                height: '48px',
                            }}
                            className="member-portal-menu"
                        />
                        <style>{`
                            .member-portal-menu.ant-menu-dark.ant-menu-horizontal > .ant-menu-item-selected {
                                background-color: #4f46e5 !important;
                                border-radius: 12px !important;
                                color: white !important;
                            }
                            .member-portal-menu.ant-menu-dark.ant-menu-horizontal > .ant-menu-item::after {
                                display: none !important;
                            }
                            .member-portal-menu.ant-menu-dark.ant-menu-horizontal > .ant-menu-item {
                                transition: all 0.3s;
                                margin: 0 4px;
                                height: 40px !important;
                                line-height: 40px !important;
                            }
                        `}</style>
                    </div>

                    {/* Mobile Branding */}
                    <div className="md:hidden flex flex-col justify-center">
                        <span className="text-xs font-black text-white tracking-widest uppercase leading-none">ChitLedger</span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-1">Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <NotificationBell isDark={true} />

                    <Dropdown menu={{
                        items: [
                            { key: 'profile', label: 'Profile Settings', icon: <User size={16} /> },
                            { type: 'divider' },
                            { key: 'logout', label: 'Logout Session', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                        ]
                    }} trigger={['click']} placement="bottomRight">
                        <div className="flex items-center h-10 gap-3 bg-white/5 hover:bg-white/10 px-4 rounded-xl cursor-pointer transition-all border border-white/10 hover:border-white/20 group">
                            <div className="h-9 w-9 rounded-lg bg-white/10 shadow-sm flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                                <User size={20} className="text-white" />
                            </div>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-sm font-bold text-white leading-none mb-1">
                                    {user.fullName || user.username}
                                </span>
                            </div>
                            <ChevronDown size={12} className="text-slate-400 ml-1 group-hover:text-white transition-colors" />
                        </div>
                    </Dropdown>
                </div>
            </Header>

            {/* Content Area - Wider for Desktop */}
            <Content className="pt-4 md:pt-10 px-4 md:px-12 pb-32 md:pb-16 min-h-[calc(100vh-80px)]">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </Content>

            {/* Floating Mobile Navigation - Improved Contrast */}
            <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-[#0f172a] rounded-[2rem] shadow-2xl flex items-center justify-around px-4 z-[100] border border-white/5">
                {navItems.map(item => {
                    const isActive = location.pathname === item.key;
                    return (
                        <div
                            key={item.key}
                            onClick={() => navigate(item.key)}
                            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-14 h-14 rounded-2xl active:scale-90 ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20' : ''}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-300 opacity-100' : 'text-slate-400 opacity-80'}`}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Footer (Optional but adds polish) */}
            <footer className="hidden md:block py-10 border-t border-slate-100 bg-white" style={{ paddingLeft: '5px', paddingRight: '5px' }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center px-0">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">ChitLedger <span className="text-indigo-600">Pro</span></span>
                        <span className="text-xs font-medium text-slate-400">Government Regulated Financial Platform</span>
                    </div>
                    <div className="flex gap-8">
                        <span className="text-xs font-bold text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">Support</span>
                        <span className="text-xs font-bold text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">Privacy</span>
                        <span className="text-xs font-bold text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">Terms</span>
                    </div>
                </div>
            </footer>
        </AntLayout>
    );
};

export default MemberLayout;
