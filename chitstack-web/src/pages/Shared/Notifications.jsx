import { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Space, Tag, Empty, Spin, message, Modal, Tabs } from 'antd';
import { Bell, Trash2, CheckCircle2, Info, TriangleAlert, CircleCheck, CircleX, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/notification?onlyUnread=${activeTab === 'unread'}`);
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            message.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notification/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            message.error('Failed to mark as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notification/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            message.success('Notification deleted');
        } catch (err) {
            message.error('Failed to delete notification');
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notification/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            message.success('All marked as read');
        } catch (err) {
            message.error('Operation failed');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 0: return 'blue';
            case 1: return 'green';
            case 2: return 'warning';
            case 3: return 'error';
            default: return 'default';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 0: return <Info size={18} />;
            case 1: return <CircleCheck size={18} />;
            case 2: return <TriangleAlert size={18} />;
            case 3: return <CircleX size={18} />;
            default: return <Bell size={18} />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <Title level={2} className="m-0 flex items-center gap-3">
                    <Bell className="text-blue-600" /> Notifications
                </Title>
                <Space>
                    <Button icon={<CheckCircle2 size={16} />} onClick={markAllRead}>
                        Mark all as read
                    </Button>
                </Space>
            </div>

            <Card className="shadow-sm border-slate-200 overflow-hidden">
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    className="px-4"
                    items={[
                        { key: 'all', label: 'All Notifications' },
                        { key: 'unread', label: 'Unread Only' },
                    ]}
                />

                {loading ? (
                    <div className="flex justify-center p-10"><Spin /></div>
                ) : notifications.length === 0 ? (
                    <Empty 
                        description={`No ${activeTab === 'unread' ? 'unread ' : ''}notifications found`} 
                        className="p-10"
                    />
                ) : (
                    <List
                        itemLayout="vertical"
                        dataSource={notifications}
                        renderItem={(n) => (
                            <List.Item
                                className={`px-6 py-4 hover:bg-slate-50 transition-colors border-b last:border-0 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                actions={[
                                    !n.isRead && <Button type="link" size="small" onClick={() => markAsRead(n.id)}>Mark as read</Button>,
                                    <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => deleteNotification(n.id)}>Delete</Button>
                                ].filter(Boolean)}
                            >
                                <div className="flex gap-4 cursor-pointer" onClick={() => n.actionUrl && navigate(n.actionUrl)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${getTypeColor(n.type)}-50 text-${getTypeColor(n.type)}-600`}>
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <Space align="center" size={4}>
                                                <Title level={5} className="m-0 text-sm font-semibold">{n.title}</Title>
                                                {!n.isRead && <Tag color="blue" className="text-[10px] uppercase leading-3 py-0">New</Tag>}
                                            </Space>
                                            <Text type="secondary" className="text-xs">
                                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </div>
                                        <Paragraph className="text-slate-600 mt-1 mb-0 line-clamp-2">
                                            {n.message}
                                        </Paragraph>
                                    </div>
                                    {n.actionUrl && <ChevronRight className="text-slate-300 self-center" size={20} />}
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};

export default Notifications;
