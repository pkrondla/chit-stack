import { useState, useEffect } from 'react';
import { Card, Typography, Switch, Divider, Spin, Avatar, Button, Tag, List, Modal, Form, Input, message } from 'antd';
import { User, Bell, MessageSquare, Smartphone, Mail, ShieldCheck, Key } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

const UserProfile = () => {
    const user = useAuthStore(state => state.user);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm] = Form.useForm();
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notification/settings');
            setSettings(res.data);
        } catch (err) {
            console.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggle = async (field, value) => {
        try {
            const updated = { ...settings, [field]: value };
            await api.put('/notification/settings', updated);
            setSettings(updated);
        } catch (err) {
            console.error('Failed to update preferences');
        }
    };

    const handleChangePassword = async (values) => {
        try {
            setUpdatingPassword(true);
            // Updating current user's password using standard User API
            await api.put(`/Users/${user.id}`, { 
                fullName: user.fullName,
                username: user.username,
                password: values.newPassword 
            });
            message.success('Password updated successfully');
            setIsPasswordModalOpen(false);
            passwordForm.resetFields();
        } catch (err) {
            message.error(err.response?.data?.error || 'Failed to update password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12 h-[60vh] items-center"><Spin size="large" description="Loading Profile..." /></div>;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="mb-8">
                <Title level={2} className="!m-0 text-slate-800">My Profile</Title>
                <Text className="text-slate-500 text-sm">Review your account details and manage communication preferences.</Text>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Info Card */}
                <div className="lg:col-span-1">
                    <Card className="shadow-sm border-0 rounded-[2.5rem] overflow-hidden p-0 text-center bg-white border border-slate-100">
                        <div className="h-32 bg-indigo-600 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600"></div>
                        </div>
                        <div className="px-6 pb-8 -mt-16 relative z-10">
                            <Avatar 
                                size={120} 
                                icon={<User size={60} />} 
                                className="bg-white text-indigo-600 shadow-xl border-4 border-white mb-5" 
                            />
                            <Title level={4} className="!m-0 text-slate-800 font-bold">{user?.fullName || user?.username}</Title>
                            <div className="mt-3 flex justify-center gap-2">
                                <Tag color="blue" className="rounded-xl border-0 font-bold uppercase text-[10px] px-3 py-1">
                                    {user?.role}
                                </Tag>
                                <Tag color="green" className="rounded-xl border-0 font-bold uppercase text-[10px] px-3 py-1">
                                    Active
                                </Tag>
                            </div>
                            
                            <Divider className="my-8 border-slate-100" />
                            
                            <div className="space-y-4 text-left px-4">
                                <div>
                                    <Text className="text-slate-700 font-medium block flex items-center gap-2 text-sm">
                                        <Mail size={14} className="text-slate-400" /> {user?.username}
                                    </Text>
                                </div>
                            </div>
                            
                            <Button 
                                block 
                                type="primary" 
                                size="large" 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="mt-10 rounded-xl h-12 bg-indigo-600 border-0 font-bold" 
                                icon={<Key size={18} />}
                            >
                                Update Password
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Preferences Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-0 rounded-[2.5rem] p-8 bg-white border border-slate-100">
                        <div className="mb-10 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                <Bell size={28} />
                            </div>
                            <div>
                                <Title level={4} className="!m-0 text-slate-800">Alert Preferences</Title>
                                <Text className="text-slate-500 text-sm">Control exactly where the system pushes your transactional notifications.</Text>
                            </div>
                        </div>

                        <List 
                            itemLayout="horizontal" 
                            dataSource={[
                                { id: 'inPortalEnabled', icon: <Bell className="text-blue-500" />, title: 'In-Portal Dashboard', description: 'Visual alerts within the web hub.' },
                                { id: 'whatsAppEnabled', icon: <MessageSquare className="text-green-500" />, title: 'WhatsApp Delivery', description: 'Instant receipts and auction pings on WhatsApp.' },
                                { id: 'smsEnabled', icon: <Smartphone className="text-purple-500" />, title: 'Direct SMS', description: 'Plain-text fallback for mission-critical updates.' },
                                { id: 'emailEnabled', icon: <Mail className="text-orange-500" />, title: 'Email Context', description: 'PDF receipts and monthly summaries to your inbox.' }
                            ]}
                            renderItem={item => (
                                <List.Item 
                                    className="px-6 py-5 hover:bg-slate-50/50 transition-all border-slate-50 rounded-2xl mb-4"
                                    actions={[<Switch checked={settings?.[item.id]} onChange={(v) => handleToggle(item.id, v)} />]}
                                >
                                    <List.Item.Meta 
                                        avatar={<div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">{item.icon}</div>} 
                                        title={<Text className="font-bold text-slate-700">{item.title}</Text>} 
                                        description={<Text className="text-xs text-slate-400 leading-tight block pr-6">{item.description}</Text>} 
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Card className="shadow-sm border-0 rounded-[2.5rem] p-6 bg-slate-50 border border-slate-100">
                        <div className="flex gap-4">
                            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 h-fit">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <Title level={5} className="!m-0">Global Encryption Layer</Title>
                                <Paragraph className="text-slate-500 text-xs mt-2 mb-0 leading-relaxed">
                                    All personal contact data and notification preferences are encrypted at rest. 
                                    Staff members can trigger alerts, but your granular delivery platform choices remain private.
                                </Paragraph>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal
                title={<Title level={3} className="!m-0 text-slate-800">Change Password</Title>}
                open={isPasswordModalOpen}
                onCancel={() => {
                    setIsPasswordModalOpen(false);
                    passwordForm.resetFields();
                }}
                footer={null}
                centered
                destroyOnClose
            >
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    className="mt-6"
                >
                    <Form.Item 
                        name="newPassword" 
                        label={<span className="text-xs font-bold text-slate-500 uppercase">New Password</span>}
                        rules={[
                            { required: true, message: 'Please enter your new password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password size="large" className="rounded-xl h-12" placeholder="••••••••" />
                    </Form.Item>
                    <Form.Item 
                        name="confirmPassword" 
                        label={<span className="text-xs font-bold text-slate-500 uppercase">Confirm Password</span>}
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm your new password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password size="large" className="rounded-xl h-12" placeholder="••••••••" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button 
                            onClick={() => setIsPasswordModalOpen(false)} 
                            size="large" 
                            className="rounded-xl border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            size="large" 
                            loading={updatingPassword}
                            className="bg-indigo-600 rounded-xl h-12 px-8 border-0 font-bold shadow-lg shadow-indigo-100"
                        >
                            Save New Password
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default UserProfile;
