import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, Space, Typography, message, Badge, Switch } from 'antd';
import { Send, History, Filter, User, Bell, Search, Mail, MessageSquare, Smartphone, Zap, Info } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ManageNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [sending, setSending] = useState(false);
    const [targetType, setTargetType] = useState('specific'); // specific, role, all

    const fetchData = async () => {
        try {
            setLoading(true);
            const [notifRes, userRes, memberRes] = await Promise.all([
                api.get('/adminnotification/recent'),
                api.get('/users'),
                api.get('/members')
            ]);
            setNotifications(notifRes.data);
            setUsers(userRes.data?.data || []);
            setMembers(memberRes.data?.data || []);
        } catch (err) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSendNotification = async (values) => {
        try {
            setSending(true);
            await api.post('/adminnotification/send', values);
            message.success('Notification sent successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchData();
        } catch (err) {
            message.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'userId',
            key: 'userId',
            render: (userId) => {
                const user = users.find(u => u.id === userId);
                return (
                    <Space size={4}>
                        <User size={14} className="text-slate-400" />
                        <Text strong>{user?.username || userId}</Text>
                        {user?.role && <Tag size="small" className="text-[10px] leading-3 py-0">{user.role}</Tag>}
                    </Space>
                );
            }
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-sm">{text}</Text>
                    <Text type="secondary" className="text-xs line-clamp-1">{record.message}</Text>
                </div>
            )
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const types = [
                    { label: 'Info', color: 'blue' },
                    { label: 'Success', color: 'green' },
                    { label: 'Warning', color: 'orange' },
                    { label: 'Error', color: 'red' }
                ];
                return <Tag color={types[type]?.color || 'default'}>{types[type]?.label || 'General'}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'isRead',
            key: 'isRead',
            render: (isRead) => isRead ? 
                <Tag color="success">Read</Tag> : 
                <Tag color="processing">Unread</Tag>
        },
        {
            title: 'Sent At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
        }
    ];

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="!m-0 flex items-center gap-3">
                        <Send className="text-indigo-600" /> Manage Notifications
                    </Title>
                    <Text type="secondary">Review sent messages and broadcast new alerts to specific users.</Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<Send size={16} />} 
                    size="large"
                    className="h-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100 font-bold"
                    onClick={() => setIsModalOpen(true)}
                >
                    Send Custom Notification
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-sm border-0 md:col-span-1 bg-indigo-50/50">
                    <Space direction="vertical" className="w-full">
                        <Title level={5} className="!m-0 text-indigo-900">Broadcast Stats</Title>
                        <div className="mt-4 space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex justify-between items-center">
                                <Text type="secondary">Total Sent</Text>
                                <Title level={4} className="!m-0">{notifications.length}</Title>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex justify-between items-center">
                                <Text type="secondary">Read Rate</Text>
                                <Title level={4} className="!m-0 text-green-600">
                                    {notifications.length > 0 ? 
                                        Math.round((notifications.filter(n => n.isRead).length / notifications.length) * 100) : 0}%
                                </Title>
                            </div>
                        </div>
                    </Space>
                </Card>

                <Card className="shadow-sm border-slate-200 md:col-span-3">
                    <div className="flex items-center gap-2 mb-4">
                        <History size={18} className="text-slate-500" />
                        <Title level={5} className="!m-0">Recent Activity</Title>
                    </div>
                    <Table 
                        dataSource={notifications} 
                        columns={columns} 
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 8 }}
                        className="notification-table border-t border-slate-50"
                    />
                </Card>
            </div>

            <Modal
                title={
                    <div className="flex items-center gap-2 py-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Bell size={20} />
                        </div>
                        <div>
                            <div className="text-lg font-bold">New Notification</div>
                            <div className="text-xs font-normal text-slate-500 italic">Target specific user via multi-channel push</div>
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={500}
                className="rounded-3xl overflow-hidden"
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={onSendNotification}
                    className="mt-6"
                >
                    <Form.Item label={<span className="font-bold px-1">Targeting Method</span>}>
                        <Select 
                            value={targetType} 
                            onChange={setTargetType}
                            className="h-11 rounded-2xl"
                        >
                            <Option value="specific">Specific Users</Option>
                            <Option value="role">Users by Role</Option>
                            <Option value="members">All Members (incl. non-portal)</Option>
                        </Select>
                    </Form.Item>

                    {targetType === 'specific' && (
                        <Form.Item 
                            name="userIds" 
                            label={<span className="font-bold flex items-center gap-2 px-1"><User size={14} className="text-indigo-500" /> Selected Recipients</span>}
                            rules={[{ required: true, message: 'Select at least one user' }]}
                        >
                            <Select 
                                mode="multiple"
                                placeholder="Search users..." 
                                optionFilterProp="children"
                                className="rounded-2xl"
                            >
                                {users.map(u => (
                                    <Option key={u.id} value={u.id}>{u.username} ({u.role})</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {targetType === 'role' && (
                        <Form.Item 
                            name="userRole" 
                            label={<span className="font-bold px-1">Select Role</span>}
                            rules={[{ required: true, message: 'Select a role' }]}
                        >
                            <Select className="h-11 rounded-2xl">
                                <Option value="Admin">Administrators</Option>
                                <Option value="Manager">Managers</Option>
                                <Option value="Staff">Staff / Clerks</Option>
                                <Option value="Agent">Collection Agents</Option>
                                <Option value="Subscriber">Subscribers (Members)</Option>
                            </Select>
                        </Form.Item>
                    )}

                    {targetType === 'members' && (
                        <Form.Item name="allMembers" valuePropName="checked" initialValue={true} hidden>
                            <Input type="checkbox" />
                        </Form.Item>
                    )}

                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-6 flex items-center gap-3">
                        <Info size={18} className="text-indigo-600" />
                        <Text className="text-xs text-indigo-700 font-medium">
                            {targetType === 'members' ? 
                                `This will target all ${members.length} registered members via their phone/email if available.` : 
                                `Select targets from the list above.`}
                        </Text>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item 
                            name="type" 
                            label={<span className="font-bold px-1">Type</span>}
                            initialValue={0}
                        >
                            <Select className="h-11 rounded-2xl">
                                <Option value={0}>Info (Blue)</Option>
                                <Option value={1}>Success (Green)</Option>
                                <Option value={2}>Warning (Orange)</Option>
                                <Option value={3}>Error (Red)</Option>
                            </Select>
                        </Form.Item>
                        
                        <Form.Item 
                            name="title" 
                            label={<span className="font-bold px-1">Short Title</span>}
                            rules={[{ required: true, message: 'Enter title' }]}
                        >
                            <Input placeholder="e.g., Payment Received" className="h-11 rounded-2xl bg-slate-50 border-0" />
                        </Form.Item>
                    </div>

                    <Form.Item 
                        name="message" 
                        label={<span className="font-bold px-1">Message Body</span>}
                        rules={[{ required: true, message: 'Enter message' }]}
                    >
                        <Input.TextArea 
                            rows={3} 
                            placeholder="Write your custom message here..." 
                            className="rounded-2xl bg-slate-50 border-0 pt-3"
                        />
                    </Form.Item>

                    <Form.Item 
                        name="actionUrl" 
                        label={<span className="font-bold px-1 text-slate-400">Action URL (Optional)</span>}
                    >
                        <Input placeholder="/finance/payouts" className="h-11 rounded-2xl bg-slate-50 border-0 text-slate-400" />
                    </Form.Item>

                    <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={18} className="text-amber-500" />
                            <Text strong className="text-slate-800">Select Channels to Send</Text>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4">
                            <Form.Item name={['channels', 'inPortal']} valuePropName="checked" initialValue={true} className="m-0">
                                <Space><Switch size="small" /><Text className="text-sm">In-Portal Hub</Text></Space>
                            </Form.Item>
                            <Form.Item name={['channels', 'whatsApp']} valuePropName="checked" initialValue={false} className="m-0">
                                <Space><Switch size="small" /><Text className="text-sm">WhatsApp</Text></Space>
                            </Form.Item>
                            <Form.Item name={['channels', 'sms']} valuePropName="checked" initialValue={false} className="m-0">
                                <Space><Switch size="small" /><Text className="text-sm">SMS Gateway</Text></Space>
                            </Form.Item>
                            <Form.Item name={['channels', 'email']} valuePropName="checked" initialValue={false} className="m-0">
                                <Space><Switch size="small" /><Text className="text-sm">Email (SMTP)</Text></Space>
                            </Form.Item>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <Text type="secondary" className="text-[10px] italic leading-3 block">
                                Note: These manual selections will override the user's default configuration for this broadcast.
                            </Text>
                        </div>
                    </div>

                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={sending} 
                        block 
                        size="large"
                        className="h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-100 font-bold text-lg"
                    >
                        Dispatch Notification
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default ManageNotifications;
