import { useState, useEffect } from 'react';
import { Card, Switch, List, Typography, Button, Space, Form, Input, InputNumber, message, Spin, Tabs } from 'antd';
import { Bell, Smartphone, MessageSquare, Mail, Settings, ShieldCheck, Zap, Cog, LayoutList } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;

const NotificationSettings = () => {
    const [userSettings, setUserSettings] = useState(null);
    const [adminConfig, setAdminConfig] = useState(null);
    const [templates, setTemplates] = useState([]);
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
                const [adminRes, templateRes] = await Promise.all([
                    api.get('/adminnotification/config'),
                    api.get('/adminnotification/templates')
                ]);
                setAdminConfig(adminRes.data);
                setTemplates(templateRes.data);
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

    const userTabs = [
        {
            key: 'my-channels',
            label: <span className="flex items-center gap-2"><Settings size={16} /> My Channels</span>,
            children: (
                <Card className="shadow-sm border-0">
                    <Paragraph type="secondary">Choose how you want to receive alerts for your account and groups.</Paragraph>
                    <List itemLayout="horizontal">
                        <List.Item actions={[<Switch checked={userSettings?.inPortalEnabled} onChange={(v) => handleUserToggle('inPortalEnabled', v)} />]}>
                            <List.Item.Meta avatar={<Bell className="text-blue-500" />} title="In-Portal Dashboard" description="Receive real-time alerts while using the application." />
                        </List.Item>
                        <List.Item actions={[<Switch checked={userSettings?.whatsAppEnabled} onChange={(v) => handleUserToggle('whatsAppEnabled', v)} />]}>
                            <List.Item.Meta avatar={<MessageSquare className="text-green-500" />} title="WhatsApp Messages" description="Get instant updates on your WhatsApp number." />
                        </List.Item>
                        <List.Item actions={[<Switch checked={userSettings?.smsEnabled} onChange={(v) => handleUserToggle('smsEnabled', v)} />]}>
                            <List.Item.Meta avatar={<Smartphone className="text-purple-500" />} title="SMS Alerts" description="Traditional text message alerts for important events." />
                        </List.Item>
                        <List.Item actions={[<Switch checked={userSettings?.emailEnabled} onChange={(v) => handleUserToggle('emailEnabled', v)} />]}>
                            <List.Item.Meta avatar={<Mail className="text-orange-500" />} title="Email Notifications" description="Receive detailed updates and statements via email." />
                        </List.Item>
                    </List>
                </Card>
            )
        }
    ];

    const adminTabs = [
        ...userTabs,
        {
            key: 'provider-setup',
            label: <span className="flex items-center gap-2 text-indigo-600"><ShieldCheck size={16} /> Providers</span>,
            children: (
                <Form form={adminForm} layout="vertical" onFinish={onAdminSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card title="Email (SMTP)" size="small" className="shadow-sm">
                            <Form.Item name="smtpHost" label="Host"><Input placeholder="smtp.gmail.com" /></Form.Item>
                            <Form.Item name="smtpPort" label="Port"><InputNumber className="w-full" /></Form.Item>
                            <Form.Item name="smtpUser" label="User"><Input /></Form.Item>
                            <Form.Item name="smtpPass" label="Pass"><Input.Password /></Form.Item>
                            <Form.Item name="emailFrom" label="From"><Input /></Form.Item>
                        </Card>
                        <Card title="WhatsApp (Gupshup)" size="small" className="shadow-sm">
                            <Form.Item name="whatsAppApiUrl" label="API Endpoint"><Input /></Form.Item>
                            <Form.Item name="whatsAppApiKey" label="API Key"><Input.Password /></Form.Item>
                            <Form.Item name="whatsAppSenderNumber" label="No."><Input /></Form.Item>
                        </Card>
                        <Card title="SMS Gateway" size="small" className="shadow-sm">
                            <Form.Item name="smsApiUrl" label="API Endpoint"><Input /></Form.Item>
                            <Form.Item name="smsApiKey" label="API Key"><Input.Password /></Form.Item>
                            <Form.Item name="smsSenderId" label="Sender ID"><Input /></Form.Item>
                        </Card>
                    </div>
                </Form>
            )
        },
        {
            key: 'system-rules',
            label: <span className="flex items-center gap-2 text-indigo-600"><Cog size={16} /> Automation Roles</span>,
            children: (
                <Form form={adminForm} layout="vertical" onFinish={onAdminSubmit}>
                    <Card className="shadow-sm border-0">
                        <Title level={5}>Background Reminders</Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <Space direction="vertical" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <Space><Form.Item name="autoPaymentRemindersEnabled" valuePropName="checked" noStyle><Switch /></Form.Item> <Text strong>Payment Reminders</Text></Space>
                                <Space><Text className="text-xs">Send</Text> <Form.Item name="paymentReminderDaysBefore" noStyle><InputNumber size="small" min={1} /></Form.Item> <Text className="text-xs text-slate-500">days before due</Text></Space>
                            </Space>
                            <Space direction="vertical" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <Space><Form.Item name="autoAuctionRemindersEnabled" valuePropName="checked" noStyle><Switch /></Form.Item> <Text strong>Auction Alerts</Text></Space>
                                <Space><Text className="text-xs">Send</Text> <Form.Item name="auctionReminderHoursBefore" noStyle><InputNumber size="small" min={1} /></Form.Item> <Text className="text-xs text-slate-500">hours before start</Text></Space>
                            </Space>
                        </div>
                        
                        <Title level={5}>Transactional Auto-Alerts</Title>
                        <Paragraph type="secondary">Automatically notify members when these events occur.</Paragraph>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { name: 'NotifyOnReceipt', label: 'Payment Receipts' },
                                { name: 'NotifyOnAuctionWon', label: 'Auction Winner' },
                                { name: 'NotifyOnDividend', label: 'Dividend Credits' },
                                { name: 'NotifyOnDemand', label: 'Monthly Demands' },
                                { name: 'NotifyOnReconciliation', label: 'Agent Submissions' },
                                { name: 'NotifyOnPayout', label: 'Prize Payouts' },
                            ].map(x => (
                                <div key={x.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <Text className="text-xs font-medium">{x.label}</Text>
                                    <Form.Item name={x.name} valuePropName="checked" noStyle><Switch size="small" /></Form.Item>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Form>
            )
        },
        {
            key: 'templates',
            label: <span className="flex items-center gap-2 text-amber-600"><LayoutList size={16} /> Message Templates</span>,
            children: (
                <Card className="shadow-sm border-0">
                    <Paragraph type="secondary">Customize the message content for each automated trigger. Use {`{brackets}`} as placeholders.</Paragraph>
                    <div className="space-y-6">
                        {templates.map(tmp => (
                            <div key={tmp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <Text strong className="text-indigo-900">{tmp.name.replace(/([A-Z])/g, ' $1').trim()}</Text>
                                        <div className="text-[10px] text-amber-600 font-mono mt-0.5">Available Tags: {tmp.placeholders}</div>
                                    </div>
                                    <Button size="small" type="primary" onClick={() => handleSaveTemplate(tmp)}>Update Template</Button>
                                </div>
                                <div className="space-y-3">
                                    <Input 
                                        placeholder="Alert Title" 
                                        value={tmp.titleTemplate} 
                                        onChange={e => {
                                            const newTemplates = [...templates];
                                            const t = newTemplates.find(t => t.id === tmp.id);
                                            if (t) t.titleTemplate = e.target.value;
                                            setTemplates(newTemplates);
                                        }}
                                        className="rounded-lg shadow-sm"
                                    />
                                    <Input.TextArea 
                                        rows={2} 
                                        placeholder="Message Format" 
                                        value={tmp.messageTemplate} 
                                        onChange={e => {
                                            const newTemplates = [...templates];
                                            const t = newTemplates.find(t => t.id === tmp.id);
                                            if (t) t.messageTemplate = e.target.value;
                                            setTemplates(newTemplates);
                                        }}
                                        className="rounded-lg shadow-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <Title level={4} className="!m-0">Notification Dashboard</Title>
                    <Text type="secondary">Configure your personalized and automated system alerts.</Text>
                </div>
                {isAdmin && (
                    <Button type="primary" onClick={() => adminForm.submit()} loading={saving} icon={<Cog size={16} />}>
                        Save All System Rules
                    </Button>
                )}
            </div>

            <Tabs 
                defaultActiveKey="my-channels" 
                items={isAdmin ? adminTabs : userTabs}
                type="card"
                className="notification-tabs"
            />
        </div>
    );
};

export default NotificationSettings;
