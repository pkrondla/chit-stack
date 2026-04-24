import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Spin, message, Space, Divider } from 'antd';
import { Bell, Info, TriangleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { getHubUrl } from '../config/apiConfig';

const { Text } = Typography;

const NotificationBell = ({ isDark = false }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [connection, setConnection] = useState(null);
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    const user = useAuthStore(state => state.user);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notification?onlyUnread=false');
            const data = Array.isArray(res.data) ? res.data : [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;

        fetchNotifications();

        const hubUrl = getHubUrl('/notificationHub');

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token || localStorage.getItem('token')
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, [token]);

    useEffect(() => {
        if (connection && token) {
            connection.start()
                .then(() => {
                    console.log('Connected to NotificationHub');
                    connection.on('ReceiveNotification', (notification) => {
                        setNotifications(prev => [notification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        message.info(`New Notification: ${notification.title}`);
                    });
                })
                .catch(e => console.log('Connection failed: ', e));
            
            return () => {
                connection.off('ReceiveNotification');
            };
        }
    }, [connection, token]);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notification/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            message.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notification/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            message.success('All notifications marked as read');
        } catch (err) {
            message.error('Failed to mark all as read');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 0: return <Info size={16} style={{ color: '#3b82f6' }} />; // Info
            case 1: return <CircleCheck size={16} style={{ color: '#22c55e' }} />; // Success
            case 2: return <TriangleAlert size={16} style={{ color: '#f59e0b' }} />; // Warning
            case 3: return <CircleX size={16} style={{ color: '#ef4444' }} />; // Error
            default: return <Info size={16} style={{ color: '#3b82f6' }} />;
        }
    };

    const menuItems = [
        {
            key: 'header',
            label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f1f5f9', minWidth: '320px' }}>
                    <Text strong>Notifications</Text>
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} style={{ padding: 0 }}>
                            Mark all as read
                        </Button>
                    )}
                </div>
            ),
        },
        {
            key: 'list',
            label: (
                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spin size="small" /></div>
                    ) : notifications.length === 0 ? (
                        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '32px 0' }} />
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={notifications.slice(0, 10)}
                            renderItem={(n) => (
                                <List.Item
                                    style={{ 
                                        cursor: 'pointer', 
                                        padding: '12px 16px', 
                                        transition: 'all 0.3s',
                                        background: !n.isRead ? 'rgba(59,130,246,0.05)' : 'transparent'
                                    }}
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                        if (n.actionUrl) navigate(n.actionUrl);
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={<div style={{ marginTop: '4px' }}>{getTypeIcon(n.type)}</div>}
                                        title={<Text strong={!n.isRead} style={{ fontSize: '13px', display: 'block' }}>{n.title}</Text>}
                                        description={
                                            <Space direction="vertical" size={2}>
                                                <Text type="secondary" style={{ fontSize: '11px', display: 'block', maxWidth: '240px' }} ellipsis>{n.message}</Text>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>
                                                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            ),
        },
        {
            key: 'footer',
            label: (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '4px' }}>
                    <Button 
                        type="link"
                        block 
                        style={{ fontSize: '12px', fontWeight: 600 }}
                        onClick={() => {
                            const path = user?.role === 'Subscriber' ? '/portal/notifications' 
                                       : user?.role === 'Agent' ? '/agent/notifications' 
                                       : '/notifications';
                            navigate(path);
                        }}
                    >
                        View All Activity
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" arrow={{ pointAtCenter: true }}>
            <Badge count={unreadCount} overflowCount={99} size="small" offset={isDark ? [-4, 4] : [-2, 6]} style={{ boxShadow: '0 0 0 2px #0f172a' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '16px', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s',
                    width: isDark ? '48px' : '40px',
                    height: isDark ? '48px' : '40px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    color: isDark ? '#94a3b8' : '#475569'
                }}>
                    <Bell size={isDark ? 22 : 20} />
                </div>
            </Badge>
        </Dropdown>
    );
};

export default NotificationBell;
