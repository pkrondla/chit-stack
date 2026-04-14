import { useState, useEffect } from 'react';
import { Card, Switch, List, Typography, Button, Space, Form, Input, InputNumber, message, Spin, Tabs, Badge, Select, Collapse } from 'antd';
import { Bell, Smartphone, MessageSquare, Mail, Settings, ShieldCheck, Zap, Cog, LayoutList, Send } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;

const NotificationSettings = () => {
    const [userSettings, setUserSettings] = useState(null);
    const [adminConfig, setAdminConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'Admin';
    const [adminForm] = Form.useForm();

    const fetchData = async () => {
        try {
            setLoading(true);
            const userRes = await api.get('/notification/settings');
            setUserSettings(userRes.data);

            if (isAdmin) {
                const adminRes = await api.get('/adminnotification/config');
                setAdminConfig(adminRes.data);
                adminForm.setFieldsValue(adminRes.data);
            }
        } catch (err) {
            message.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUserToggle = async (field, value) => {
        try {
            const updated = { ...userSettings, [field]: value };
            await api.put('/notification/settings', updated);
            setUserSettings(updated);
            message.success('Preferences updated');
        } catch (err) {
            message.error('Failed to update preferences');
        }
    };

    const onAdminSubmit = async (values) => {
        try {
            setSaving(true);
            await api.put('/adminnotification/config', values);
            message.success('System configuration saved');
        } catch (err) {
            message.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTemplate = async (template) => {
        try {
            await api.put(`/adminnotification/templates/${template.id}`, template);
            message.success(`${template.name} template updated!`);
        } catch (err) {
            message.error('Failed to update template');
        }
    };

    if (loading) return <div className="p-10 text-center"><Spin /></div>;

    const adminTabs = [
        {
            key: 'system-setup',
            label: <span className="flex items-center gap-2 text-indigo-600"><Settings size={16} /> System Gateways</span>,
            children: (
                <div className="space-y-6">
                    <Form form={adminForm} layout="vertical" onFinish={onAdminSubmit}>
                        <Card className="shadow-sm border-0 rounded-[2rem] overflow-hidden p-0">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <Title level={4} className="!m-0 text-slate-800">Global Communication Gateways</Title>
                                <Text className="text-slate-500 text-sm">Configure the delivery providers for your system-wide notifications.</Text>
                            </div>
                            
                            <Collapse 
                                ghost 
                                expandIconPosition="end"
                                className="gateway-collapse"
                                defaultActiveKey={['email']}
                            >
                                <Collapse.Panel 
                                    header={
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm"><Mail size={20} /></div>
                                            <div>
                                                <div className="font-bold text-slate-700 text-base">Email (SMTP)</div>
                                                <div className="text-xs text-slate-400">Configure mail server for transactional statements</div>
                                            </div>
                                        </div>
                                    } 
                                    key="email"
                                    className="border-b border-slate-50 px-4"
                                >
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/20 rounded-3xl m-2 border border-slate-100">
                                        <Form.Item name="smtpHost" label={<span className="text-xs font-bold text-slate-500 uppercase">SMTP Host</span>}><Input placeholder="smtp.gmail.com" className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="smtpPort" label={<span className="text-xs font-bold text-slate-500 uppercase">Port</span>}><InputNumber className="w-full rounded-xl h-10 flex items-center" /></Form.Item>
                                        <Form.Item name="smtpUser" label={<span className="text-xs font-bold text-slate-500 uppercase">User</span>}><Input className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="smtpPass" label={<span className="text-xs font-bold text-slate-500 uppercase">Password</span>}><Input.Password className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="emailFrom" label={<span className="text-xs font-bold text-slate-500 uppercase">Sender Email</span>}><Input className="rounded-xl h-10" /></Form.Item>
                                    </div>
                                </Collapse.Panel>

                                <Collapse.Panel 
                                    header={
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm"><MessageSquare size={20} /></div>
                                            <div>
                                                <div className="font-bold text-slate-700 text-base">WhatsApp (Gupshup)</div>
                                                <div className="text-xs text-slate-400">Manage instant messaging API credentials</div>
                                            </div>
                                        </div>
                                    } 
                                    key="whatsapp"
                                    className="border-b border-slate-50 px-4"
                                >
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/20 rounded-3xl m-2 border border-slate-100">
                                        <Form.Item name="whatsAppApiUrl" label={<span className="text-xs font-bold text-slate-500 uppercase">API Endpoint</span>}><Input className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="whatsAppApiKey" label={<span className="text-xs font-bold text-slate-500 uppercase">API Key</span>}><Input.Password className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="whatsAppSenderNumber" label={<span className="text-xs font-bold text-slate-500 uppercase">Sender Number</span>}><Input className="rounded-xl h-10" /></Form.Item>
                                    </div>
                                </Collapse.Panel>

                                <Collapse.Panel 
                                    header={
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm"><Smartphone size={20} /></div>
                                            <div>
                                                <div className="font-bold text-slate-700 text-base">SMS Gateway</div>
                                                <div className="text-xs text-slate-400">Configure primary SMS provider and Sender ID</div>
                                            </div>
                                        </div>
                                    } 
                                    key="sms"
                                    className="border-b border-slate-50 px-4"
                                >
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/20 rounded-3xl m-2 border border-slate-100">
                                        <Form.Item name="smsApiUrl" label={<span className="text-xs font-bold text-slate-500 uppercase">API Endpoint</span>}><Input className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="smsApiKey" label={<span className="text-xs font-bold text-slate-500 uppercase">API Key</span>}><Input.Password className="rounded-xl h-10" /></Form.Item>
                                        <Form.Item name="smsSenderId" label={<span className="text-xs font-bold text-slate-500 uppercase">Sender ID</span>}><Input className="rounded-xl h-10" /></Form.Item>
                                    </div>
                                </Collapse.Panel>

                                <Collapse.Panel 
                                    header={
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shadow-sm"><Send size={20} /></div>
                                            <div>
                                                <div className="font-bold text-slate-700 text-base">Telegram (Staff Alerts)</div>
                                                <div className="text-xs text-slate-400">Broadcast operational events to a Telegram channel for staff</div>
                                            </div>
                                        </div>
                                    } 
                                    key="telegram"
                                    className="px-4"
                                >
                                    <div className="p-4 bg-slate-50/20 rounded-3xl m-2 border border-slate-100 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Form.Item
                                                name="telegramBotToken"
                                                label={<span className="text-xs font-bold text-slate-500 uppercase">Bot Token</span>}
                                                extra={<span className="text-xs text-slate-400">Get this from @BotFather on Telegram</span>}
                                            >
                                                <Input.Password placeholder="123456789:ABCdef..." className="rounded-xl h-10" />
                                            </Form.Item>
                                            <Form.Item
                                                name="telegramChannelId"
                                                label={<span className="text-xs font-bold text-slate-500 uppercase">Channel ID</span>}
                                                extra={<span className="text-xs text-slate-400">e.g. @yourchannel or -1001234567890</span>}
                                            >
                                                <Input placeholder="@channelname" className="rounded-xl h-10" />
                                            </Form.Item>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                                            <Form.Item
                                                name="staffInPortalAlertsEnabled"
                                                label={<span className="text-xs font-bold text-slate-500 uppercase">In-Portal Staff Alerts</span>}
                                                valuePropName="checked"
                                                extra={<span className="text-xs text-slate-400">Push events to staff users' in-portal notification inbox</span>}
                                            >
                                                <Switch />
                                            </Form.Item>
                                            <Form.Item
                                                name="staffTelegramAlertsEnabled"
                                                label={<span className="text-xs font-bold text-slate-500 uppercase">Telegram Channel Alerts</span>}
                                                valuePropName="checked"
                                                extra={<span className="text-xs text-slate-400">Post operational events to the configured Telegram channel</span>}
                                            >
                                                <Switch />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </Collapse.Panel>
                            </Collapse>
                        </Card>
                    </Form>
                </div>
            )
        }
    ];

    if (!isAdmin) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Settings size={24} />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">Gateway Config</Title>
                        <Text className="text-slate-500 text-sm">Manage global delivery providers for your system notifications.</Text>
                    </div>
                </div>
                <Button type="primary" size="large" onClick={() => adminForm.submit()} loading={saving} icon={<Cog size={18} />} className="shadow-lg shadow-indigo-100 rounded-2xl h-12 px-8 font-bold">
                    Save System Config
                </Button>
            </div>

            <Tabs 
                defaultActiveKey="system-setup" 
                items={adminTabs}
                className="notification-tabs-custom"
            />
        </div>
    );
};

export default NotificationSettings;
