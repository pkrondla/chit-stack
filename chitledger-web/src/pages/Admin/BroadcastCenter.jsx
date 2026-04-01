import { useState, useEffect } from 'react';
import { Card, Button, Form, Select, Input, Switch, Typography, message, Space, Badge } from 'antd';
import { Send, User, Bell, Info, Zap, Smartphone, MessageSquare, Mail, LayoutGrid } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const BroadcastCenter = () => {
    const [form] = Form.useForm();
    const [sending, setSending] = useState(false);
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [targetType, setTargetType] = useState('specific');

    const fetchData = async () => {
        try {
            const [userRes, memberRes] = await Promise.all([
                api.get('/users'),
                api.get('/members')
            ]);
            setUsers(userRes.data?.data || []);
            setMembers(memberRes.data?.data || []);
        } catch (err) {
            message.error('Failed to load user data');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSendNotification = async (values) => {
        try {
            setSending(true);
            await api.post('/adminnotification/send', values);
            message.success('Notification broadcasted successfully!');
            form.resetFields();
        } catch (err) {
            message.error('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 py-1">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Send size={24} />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">Broadcast Center</Title>
                        <Text className="text-slate-500 font-medium text-sm">Dispatch manual alerts across multiple channels instantly.</Text>
                    </div>
                </div>
                <Badge count="Admin Live" status="processing" className="mr-8" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Form 
                        form={form} 
                        layout="vertical" 
                        onFinish={onSendNotification}
                        initialValues={{
                            type: 0,
                            targetType: 'specific',
                            channels: { inPortal: true }
                        }}
                        className="space-y-6"
                    >
                        <Card className="shadow-sm border-slate-100 rounded-[40px] p-4">
                            <Title level={5} className="mb-6 flex items-center gap-2"><LayoutGrid size={18} className="text-indigo-500" /> Target Configuration</Title>
                            
                            <Form.Item label={<span className="font-bold text-slate-600">Select Audience</span>}>
                                <Select 
                                    value={targetType} 
                                    onChange={setTargetType}
                                    className="h-12 rounded-2xl text-lg font-medium"
                                >
                                    <Option value="specific">Specific Users (Searchable)</Option>
                                    <Option value="role">Target specific roles (Admin/Staff/Agents)</Option>
                                    <Option value="members">Broadcast to ALL registered members</Option>
                                </Select>
                            </Form.Item>

                            {targetType === 'specific' && (
                                <Form.Item 
                                    name="userIds" 
                                    label={<span className="font-bold text-slate-600">Recipients List</span>}
                                    rules={[{ required: true, message: 'Select at least one user' }]}
                                >
                                    <Select 
                                        mode="multiple"
                                        placeholder="Type username or name..." 
                                        optionFilterProp="children"
                                        className="rounded-2xl min-h-[3rem]"
                                        size="large"
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
                                    label={<span className="font-bold text-slate-600">Select Role</span>}
                                    rules={[{ required: true, message: 'Select a role' }]}
                                >
                                    <Select className="h-12 rounded-2xl" size="large">
                                        <Option value="Admin">Administrators Only</Option>
                                        <Option value="Manager">Office Managers</Option>
                                        <Option value="Staff">Support Staff</Option>
                                        <Option value="Agent">Collection Agents</Option>
                                        <Option value="Subscriber">Active Subscribers (Members)</Option>
                                    </Select>
                                </Form.Item>
                            )}

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Info size={18} className="text-indigo-600" />
                                </div>
                                <Text className="text-sm text-slate-600 font-medium">
                                    {targetType === 'members' ? 
                                        `Audience size: ${members.length} members. Platform will auto-select verified Phone/Email data.` : 
                                        `Directly targeting specific users ensures immediate portal visibility.`}
                                </Text>
                            </div>
                        </Card>

                        <Card className="shadow-sm border-slate-100 rounded-[40px] p-4">
                            <Title level={5} className="mb-6 flex items-center gap-2"><Bell size={18} className="text-indigo-500" /> Notification Content</Title>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Form.Item 
                                    name="type" 
                                    label={<span className="font-bold text-slate-600 text-sm uppercase tracking-widest">Priority Style</span>}
                                >
                                    <Select className="h-12 rounded-2xl" size="large">
                                        <Option value={0}>Standard Info (Blue)</Option>
                                        <Option value={1}>Success Update (Green)</Option>
                                        <Option value={2}>Warning Alert (Orange)</Option>
                                        <Option value={3}>Critical Error (Red)</Option>
                                    </Select>
                                </Form.Item>
                                
                                <Form.Item 
                                    name="title" 
                                    label={<span className="font-bold text-slate-600 text-sm uppercase tracking-widest">Message Heading</span>}
                                    rules={[{ required: true, message: 'Enter title' }]}
                                >
                                    <Input placeholder="Keep it catchy..." className="h-12 rounded-2xl bg-white border-slate-200" />
                                </Form.Item>
                            </div>

                            <Form.Item 
                                name="message" 
                                label={<span className="font-bold text-slate-600 text-sm uppercase tracking-widest">Message Body</span>}
                                rules={[{ required: true, message: 'Enter message' }]}
                            >
                                <Input.TextArea 
                                    rows={4} 
                                    placeholder="Type your message content here..." 
                                    className="rounded-3xl border-slate-200 pt-4"
                                />
                            </Form.Item>

                            <Form.Item 
                                name="actionUrl" 
                                label={<span className="font-bold text-slate-400 text-sm uppercase tracking-widest">Call-to-Action Link (Optional)</span>}
                            >
                                <Input placeholder="/dashboard" className="h-12 rounded-2xl bg-slate-50 border-0 text-indigo-400 font-mono" />
                            </Form.Item>
                        </Card>
                    </Form>
                </div>

                <div className="space-y-8">
                    <Card className="shadow-sm border-slate-100 rounded-[40px] bg-indigo-900 text-white overflow-hidden relative">
                        <div className="absolute top-[-20px] right-[-20px] opacity-10">
                            <Zap size={140} />
                        </div>
                        <div className="relative z-10 pt-4">
                            <Title level={5} className="!text-white mb-6 uppercase tracking-widest text-sm opacity-70">Push Channels</Title>
                            <div className="space-y-6">
                                <Form.Item name={['channels', 'inPortal']} valuePropName="checked" className="m-0 border-b border-indigo-800 pb-4">
                                    <div className="flex justify-between items-center">
                                        <Space><LayoutGrid size={18} /> <Text className="text-white font-bold">Portal Hub</Text></Space>
                                        <Switch className="bg-indigo-700" />
                                    </div>
                                </Form.Item>
                                <Form.Item name={['channels', 'whatsApp']} valuePropName="checked" className="m-0 border-b border-indigo-800 pb-4">
                                    <div className="flex justify-between items-center">
                                        <Space><MessageSquare size={18} /> <Text className="text-white font-bold">WhatsApp</Text></Space>
                                        <Switch className="bg-white/20" />
                                    </div>
                                </Form.Item>
                                <Form.Item name={['channels', 'sms']} valuePropName="checked" className="m-0 border-b border-indigo-800 pb-4">
                                    <div className="flex justify-between items-center">
                                        <Space><Smartphone size={18} /> <Text className="text-white font-bold">SMS Express</Text></Space>
                                        <Switch className="bg-white/20" />
                                    </div>
                                </Form.Item>
                                <Form.Item name={['channels', 'email']} valuePropName="checked" className="m-0">
                                    <div className="flex justify-between items-center">
                                        <Space><Mail size={18} /> <Text className="text-white font-bold">Email Push</Text></Space>
                                        <Switch className="bg-white/20" />
                                    </div>
                                </Form.Item>
                            </div>
                            
                            <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <Text className="text-white/60 text-xs leading-tight block">
                                    Broadcast overrides user preferences. Use carefully for critical operational announcements.
                                </Text>
                            </div>

                            <Button 
                                type="primary" 
                                size="large"
                                loading={sending}
                                block
                                className="h-16 rounded-[28px] bg-white text-indigo-900 border-0 font-black text-lg mt-8 hover:!bg-indigo-50 shadow-2xl shadow-indigo-950"
                                onClick={() => form.submit()}
                            >
                                <Send size={24} className="mr-2" /> DISPATCH NOW
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BroadcastCenter;
