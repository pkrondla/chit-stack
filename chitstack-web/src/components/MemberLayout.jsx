import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Button, Dropdown, Menu, Space, Typography, ConfigProvider } from 'antd';
import {
    LayoutDashboard, Gavel, LogOut,
    History as HistoryIcon, Wallet, User, ChevronDown
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import NotificationBell from './NotificationBell';

const { Header, Content, Footer } = AntLayout;
const { Text } = Typography;

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
        { key: '/portal', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { key: '/portal/my-chits', icon: <HistoryIcon size={18} />, label: 'My Chits' },
        { key: '/portal/auctions', icon: <Gavel size={18} />, label: 'Auctions' },
        { key: '/portal/payments', icon: <Wallet size={18} />, label: 'Payments' },
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#4f46e5',
                },
                components: {
                    Layout: {
                        headerBg: '#ffffff',
                        headerHeight: 72,
                        headerPadding: '0 24px',
                    },
                    Menu: {
                        itemBg: '#ffffff',
                        itemColor: '#64748b',
                        itemSelectedColor: '#4f46e5',
                        itemHoverColor: '#4f46e5',
                        itemHoverBg: '#f8fafc',
                        itemActiveBg: '#f8fafc',
                        horizontalItemSelectedColor: '#4f46e5',
                        itemBorderRadius: 12,
                    }
                }
            }}
        >
            <AntLayout style={{ minHeight: '100vh', background: '#f8fafc' }}>
                <Header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1000,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        padding: '0 24px',
                        borderBottom: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {/* Logo */}
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                background: '#4f46e5',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 900,
                                fontSize: '20px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(79,70,229,0.2)',
                                flexShrink: 0,
                                marginRight: '16px'
                            }}
                            onClick={() => navigate('/portal')}
                        >
                            C
                        </div>

                        {/* Navigation Desktop */}
                        <div className="member-nav-desktop" style={{ flex: 1, minWidth: 0 }}>
                            <Menu
                                mode="horizontal"
                                selectedKeys={[location.pathname]}
                                onClick={({ key }) => navigate(key)}
                                items={navItems}
                                overflowedIndicator={null}
                                style={{
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    background: 'transparent',
                                    width: '100%',
                                    lineHeight: '70px'
                                }}
                            />
                        </div>
                    </div>

                    <Space size={24} align="center" style={{ flexShrink: 0, marginLeft: '16px' }}>
                        <NotificationBell isDark={false} />

                        <Dropdown 
                            menu={{
                                items: [
                                    { key: 'profile', label: 'My Profile', icon: <User size={16} />, onClick: () => navigate('/portal/settings') },
                                    { type: 'divider' },
                                    { key: 'logout', label: 'Logout Session', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                                ]
                            }} 
                            trigger={['click']} 
                            placement="bottomRight"
                        >
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                cursor: 'pointer', 
                                padding: '6px 16px', 
                                borderRadius: '12px', 
                                background: '#f8fafc',
                                border: '1px solid #f1f5f9',
                                height: '44px'
                            }}>
                                <div style={{ 
                                    width: '30px', 
                                    height: '30px', 
                                    borderRadius: '8px', 
                                    background: 'white', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#4f46e5',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <User size={18} />
                                </div>
                                <Text style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }} className="desktop-user-name">
                                    {user.fullName || user.username}
                                </Text>
                                <ChevronDown size={14} style={{ color: '#94a3b8' }} />
                            </div>
                        </Dropdown>
                    </Space>
                </Header>

                {/* Content */}
                <Content style={{ padding: '32px 24px', minHeight: 'calc(100vh - 144px)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </Content>

                {/* Footer */}
                <Footer style={{ 
                    background: 'white', 
                    borderTop: '1px solid #f1f5f9', 
                    padding: '40px 24px' 
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <Text strong style={{ fontSize: '18px', color: '#0f172a' }}>
                                ChitStack <Text style={{ color: '#4f46e5' }}>Portal</Text>
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Government-Regulated Digital Chit Fund Management
                            </Text>
                        </div>
                        <Space size={40}>
                            <Text type="secondary" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Support</Text>
                            <Text type="secondary" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Privacy</Text>
                            <Text type="secondary" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Terms</Text>
                        </Space>
                    </div>
                </Footer>

                <style>{`
                    .ant-menu-horizontal {
                        line-height: 70px !important;
                    }
                    .ant-menu-item-selected::after {
                        border-bottom-width: 3px !important;
                        border-bottom-color: #4f46e5 !important;
                    }
                    @media (max-width: 992px) {
                        .member-nav-desktop, .desktop-user-name { display: none !important; }
                    }
                    .mobile-nav-visible { display: none !important; }
                    @media (max-width: 768px) {
                        .mobile-nav-visible { display: flex !important; }
                    }
                `}</style>
                
                {/* Mobile Navigation */}
                <div className="mobile-nav-visible" style={{ 
                    position: 'fixed', 
                    bottom: '24px', 
                    left: '24px', 
                    right: '24px', 
                    height: '72px', 
                    background: '#0f172a', 
                    borderRadius: '24px', 
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '0 16px',
                    zIndex: 2000
                }}>
                    {navItems.map(item => {
                        const isActive = location.pathname === item.key;
                        return (
                            <div 
                                key={item.key} 
                                onClick={() => navigate(item.key)}
                                style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    cursor: 'pointer',
                                    color: isActive ? '#818cf8' : '#94a3b8'
                                }}
                            >
                                {item.icon}
                                <Text style={{ color: isActive ? '#818cf8' : '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}>
                                    {item.label}
                                </Text>
                            </div>
                        );
                    })}
                </div>
            </AntLayout>
        </ConfigProvider>
    );
};

export default MemberLayout;
