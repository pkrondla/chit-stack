import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Spin, message } from 'antd';
import { Bell, CheckCheck, Trash2, Info, TriangleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';

const { Text } = Typography;

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [connection, setConnection] = useState(null);
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/notification?onlyUnread=false');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_URL || ''}/notificationHub`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [token]);

    useEffect(() => {
        if (connection) {
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
        }
    }, [connection]);

    const markAsRead = async (id) => {
        try {
            await axios.post(`/api/notification/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            message.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post('/api/notification/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            message.success('All notifications marked as read');
        } catch (err) {
            message.error('Failed to mark all as read');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 0: return <Info size={16} className="text-blue-500" />; // Info
            case 1: return <CircleCheck size={16} className="text-green-500" />; // Success
            case 2: return <TriangleAlert size={16} className="text-orange-500" />; // Warning
            case 3: return <CircleX size={16} className="text-red-500" />; // Error
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const menuItems = [
        {
            key: 'header',
            label: (
                <div className="flex justify-between items-center p-2 border-b border-gray-100 min-w-[300px]">
                    <Text strong>Notifications</Text>
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>
                            Mark all as read
                        </Button>
                    )}
                </div>
            ),
        },
        {
            key: 'list',
            label: (
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-4"><Spin size="small" /></div>
                    ) : notifications.length === 0 ? (
                        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-4" />
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={notifications.slice(0, 10)}
                            renderItem={(n) => (
                                <List.Item
                                    className={`cursor-pointer hover:bg-slate-50 transition-colors px-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                        if (n.actionUrl) navigate(n.actionUrl);
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={<div className="mt-1">{getTypeIcon(n.type)}</div>}
                                        title={<Text strong={!n.isRead} className="text-xs">{n.title}</Text>}
                                        description={
                                            <div className="flex flex-col">
                                                <Text type="secondary" className="text-[11px] line-clamp-2">{n.message}</Text>
                                                <Text type="secondary" className="text-[10px] mt-1">
                                                    {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </Text>
                                            </div>
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
                <Button type="block" className="w-full text-blue-600 border-t border-gray-100 rounded-none" onClick={() => navigate('/notifications')}>
                    View All Notifications
                </Button>
            ),
        }
    ];

    return (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" arrow>
            <Badge count={unreadCount} overflowCount={99} size="small" offset={[-2, 6]}>
                <div className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors text-slate-600">
                    <Bell size={20} />
                </div>
            </Badge>
        </Dropdown>
    );
};

export default NotificationBell;
