import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Button, Dropdown, Badge, Menu } from 'antd';
import {
    LayoutDashboard, Gavel, LogOut,
    History, Wallet, Bell, User, ChevronDown, Menu as MenuIcon
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

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
        { key: '/portal/my-chits', icon: <History size={20} />, label: 'Chits' },
        { key: '/portal/auctions', icon: <Gavel size={20} />, label: 'Auction' },
        { key: '/portal/payments', icon: <Wallet size={20} />, label: 'Pay' },
    ];

    return (
        <AntLayout className="min-h-screen bg-slate-50/50">
            {/* Top Navigation - Enterprise-Grade Header */}
            <Header
                className="sticky top-0 z-50 w-full flex items-center justify-between !bg-white/90 backdrop-blur-2xl border-b border-slate-100 !h-24 shadow-sm !overflow-visible"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#0f172a', display: 'flex', alignItems: 'center', paddingLeft: '5px', paddingRight: '5px' }}
            >
                <div className="flex items-center gap-6 md:gap-14">
                    {/* Brand Logo - More Minimal */}
                    <div
                        className="h-12 w-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100 cursor-pointer hover:scale-110 active:scale-95 transition-all"
                        onClick={() => navigate('/portal')}
                    >
                        C
                    </div>

                    {/* System Navigation - Professional Tabs */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map(item => {
                            const isActive = location.pathname === item.key;
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => navigate(item.key)}
                                    className={`relative h-14 px-5 flex items-center gap-3 rounded-2xl cursor-pointer transition-all ${isActive
                                        ? 'text-indigo-600 bg-indigo-50/50'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400 opacity-80'}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`text-[13px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-4 right-4 h-1 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Branding */}
                    <div className="md:hidden flex flex-col justify-center">
                        <span className="text-xs font-black text-slate-800 tracking-widest uppercase leading-none">ChitLedger</span>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mt-1">Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    {/* Global Search Mock - Adds Professional Density */}
                    <div className="hidden lg:flex items-center h-12 px-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 hover:border-indigo-200 transition-colors cursor-pointer mr-2 group">
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Global Records</span>
                        <div className="ml-6 h-6 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">⌘K</div>
                    </div>

                    <Badge count={2} size="small" offset={[-2, 2]} color="#4f46e5">
                        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-pointer text-slate-400">
                            <Bell size={22} />
                        </div>
                    </Badge>

                    <Dropdown menu={{
                        items: [
                            { key: 'profile', label: 'Profile Settings', icon: <User size={16} /> },
                            { type: 'divider' },
                            { key: 'logout', label: 'Logout Session', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                        ]
                    }} trigger={['click']} placement="bottomRight">
                        <div className="flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 px-5 py-2.5 rounded-[1.5rem] cursor-pointer transition-all border border-slate-100 hover:border-indigo-100 group">
                            <div className="h-11 w-11 rounded-xl bg-white shadow-sm flex items-center justify-center border border-indigo-100/50 shrink-0 group-hover:scale-105 transition-transform">
                                <User size={24} className="text-indigo-600" />
                            </div>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-[15px] font-black !text-slate-900 leading-none mb-1.5">
                                    {user.fullName || 'Member'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified</span>
                                </div>
                            </div>
                            <ChevronDown size={14} className="text-slate-400 ml-2 group-hover:text-indigo-600 transition-colors" />
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
