import { useState, useEffect } from 'react';
import { Card, Switch, List, Typography, Button, Space, Divider, Form, Input, InputNumber, message, Spin, Alert } from 'antd';
import { Bell, Smartphone, MessageSquare, Mail, Settings, ShieldCheck, Zap } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import axios from 'axios';

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
            const userRes = await axios.get('/api/notification/settings');
            setUserSettings(userRes.data);

            if (isAdmin) {
                const adminRes = await axios.get('/api/adminnotification/config');
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
            await axios.put('/api/notification/settings', updated);
            setUserSettings(updated);
            message.success('Preferences updated');
        } catch (err) {
            message.error('Failed to update preferences');
        }
    };

    const onAdminSubmit = async (values) => {
        try {
            setSaving(true);
            await axios.put('/api/adminnotification/config', values);
            message.success('Provider configuration saved');
        } catch (err) {
            message.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Spin /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* User Preferences */}
            <Card title={<span className="flex items-center gap-2"><Settings size={18} /> My Notification Channels</span>} className="shadow-sm">
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

            {/* Admin Configuration */}
            {isAdmin && (
                <Card 
                    title={<span className="flex items-center gap-2 text-blue-600"><ShieldCheck size={18} /> Notification Provider Setup (Admin)</span>} 
                    className="shadow-sm border-blue-100"
                >
                    <Form form={adminForm} layout="vertical" onFinish={onAdminSubmit}>
                        <Title level={5}>Email (SMTP) Settings</Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="smtpHost" label="SMTP Host"><Input placeholder="smtp.gmail.com" /></Form.Item>
                            <Form.Item name="smtpPort" label="Port"><InputNumber className="w-full" placeholder="587" /></Form.Item>
                            <Form.Item name="smtpUser" label="Username"><Input /></Form.Item>
                            <Form.Item name="smtpPass" label="Password"><Input.Password /></Form.Item>
                            <Form.Item name="emailFrom" label="From Email" className="md:col-span-2"><Input placeholder="notifications@yourdomain.com" /></Form.Item>
                        </div>
                        
                        <Divider />
                        
                        <Title level={5}>WhatsApp (Gupshup / Meta) Settings</Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="whatsAppApiUrl" label="API Endpoint"><Input /></Form.Item>
                            <Form.Item name="whatsAppApiKey" label="API Key"><Input.Password /></Form.Item>
                            <Form.Item name="whatsAppSenderNumber" label="Sender Number"><Input /></Form.Item>
                        </div>
                        
                        <Divider />
                        
                        <Title level={5}>SMS Gateway Settings</Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="smsApiUrl" label="API Endpoint"><Input /></Form.Item>
                            <Form.Item name="smsApiKey" label="API Key"><Input.Password /></Form.Item>
                            <Form.Item name="smsSenderId" label="Sender ID"><Input /></Form.Item>
                        </div>

                        <Divider />

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={18} className="text-amber-500" />
                                <Title level={5} className="!m-0">Automation & Reminders</Title>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Space direction="vertical">
                                    <Text strong>Payment Reminders</Text>
                                    <Space>
                                        <Form.Item name="autoPaymentRemindersEnabled" valuePropName="checked" className="m-0"><Switch /></Form.Item>
                                        <Text>Enable</Text>
                                    </Space>
                                    <Space>
                                        <Text>Send</Text>
                                        <Form.Item name="paymentReminderDaysBefore" className="m-0"><InputNumber min={1} /></Form.Item>
                                        <Text>days before due date</Text>
                                    </Space>
                                </Space>

                                <Space direction="vertical">
                                    <Text strong>Auction Reminders</Text>
                                    <Space>
                                        <Form.Item name="autoAuctionRemindersEnabled" valuePropName="checked" className="m-0"><Switch /></Form.Item>
                                        <Text>Enable</Text>
                                    </Space>
                                    <Space>
                                        <Text>Send</Text>
                                        <Form.Item name="auctionReminderHoursBefore" className="m-0"><InputNumber min={1} /></Form.Item>
                                        <Text>hours before auction</Text>
                                    </Space>
                                </Space>
                            </div>
                        </div>

                        <Button type="primary" htmlType="submit" loading={saving} block size="large">
                            Save System Configuration
                        </Button>
                    </Form>
                </Card>
            )}
        </div>
    );
};

export default NotificationSettings;
