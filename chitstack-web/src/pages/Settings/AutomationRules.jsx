import { useState, useEffect } from 'react';
import { Card, Switch, Typography, Button, Space, Form, InputNumber, message, Spin } from 'antd';
import { Cog, Zap, Bell, Calendar, Clock, Smartphone, Send, Users } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;

const AutomationRules = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/adminnotification/config');
            setConfig(res.data);
            form.setFieldsValue(res.data);
        } catch (err) {
            message.error('Failed to load automation rules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onFinish = async (values) => {
        try {
            setSaving(true);
            await api.put('/adminnotification/config', values);
            message.success('Automation rules updated successfully');
        } catch (err) {
            message.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12 h-[60vh] items-center"><Spin size="large" description="Loading Automation Rules..." /></div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                        <Cog size={24} />
                    </div>
                    <div>
                        <Title level={3} className="!m-0 text-slate-800">Automation Rules</Title>
                        <Text className="text-slate-500 text-sm">Define and schedule your system's automated alerting behavior.</Text>
                    </div>
                </div>
                <Button 
                    type="primary" 
                    size="large"
                    onClick={() => form.submit()} 
                    loading={saving} 
                    icon={<Zap size={18} />}
                    className="bg-indigo-600 rounded-xl h-12 shadow-lg shadow-indigo-100 px-8 font-bold border-0"
                >
                    Save Changes
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Reminders Card */}
                    <Card 
                        className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100"
                        styles={{ body: { padding: '2rem', backgroundColor: '#f8fafc' } }}
                    >
                        <div className="mb-8 flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Clock size={20} />
                            </div>
                            <Title level={4} className="!m-0 text-slate-800">Background Reminders</Title>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                        <Calendar size={18} className="text-indigo-400" /> Payment Reminders
                                    </div>
                                    <Form.Item name="autoPaymentRemindersEnabled" valuePropName="checked" noStyle>
                                        <Switch className="bg-slate-200" />
                                    </Form.Item>
                                </div>
                                <Text className="text-xs text-slate-400 block mb-5 leading-relaxed">
                                    Send automated alerts to members before their chit installments are due.
                                </Text>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occurs</Text>
                                    <Form.Item name="paymentReminderDaysBefore" noStyle>
                                        <InputNumber min={1} className="w-20 rounded-lg h-9 border-slate-200" />
                                    </Form.Item>
                                    <Text className="text-sm font-bold text-slate-600">days before deadline</Text>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                        <GavelIcon size={18} className="text-indigo-400" /> Auction Alerts
                                    </div>
                                    <Form.Item name="autoAuctionRemindersEnabled" valuePropName="checked" noStyle>
                                        <Switch className="bg-slate-200" />
                                    </Form.Item>
                                </div>
                                <Text className="text-xs text-slate-400 block mb-5 leading-relaxed">
                                    Remind subscribers about upcoming live auctions to maximize participation.
                                </Text>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occurs</Text>
                                    <Form.Item name="auctionReminderHoursBefore" noStyle>
                                        <InputNumber min={1} className="w-20 rounded-lg h-9 border-slate-200" />
                                    </Form.Item>
                                    <Text className="text-sm font-bold text-slate-600">hours before start</Text>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Auto Alerts Card */}
                    <Card 
                        className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100"
                        styles={{ body: { padding: '2rem' } }}
                    >
                        <div className="mb-2 flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <Zap size={20} />
                            </div>
                            <Title level={4} className="!m-0 text-slate-800">Transactional Auto-Alerts</Title>
                        </div>
                        <Paragraph type="secondary" className="text-xs mb-8">
                            Choose which financial events trigger instant notifications to members.
                        </Paragraph>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { name: 'notifyOnReceipt', label: 'Payment Receipts', desc: 'Instantly notify member upon receipt entry', icon: <Bell size={14} className="text-blue-500" /> },
                                { name: 'notifyOnAuctionWon', label: 'Auction Winner', desc: 'Congratulate the winner with prize details', icon: <Zap size={14} className="text-amber-500" /> },
                                { name: 'notifyOnDividend', label: 'Dividend Credits', desc: 'Alert when monthly dividend is calculated', icon: <Calendar size={14} className="text-green-500" /> },
                                { name: 'notifyOnDemand', label: 'Monthly Demands', desc: 'Send net installment amounts for the month', icon: <Clock size={14} className="text-purple-500" /> },
                                { name: 'notifyOnPayout', label: 'Prize Payouts', desc: 'Notification of prize amount disbursement', icon: <Bell size={14} className="text-orange-500" /> },
                            ].map(x => (
                                <div key={x.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {x.icon}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-700">{x.label}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{x.desc}</div>
                                        </div>
                                    </div>
                                    <Form.Item name={x.name} valuePropName="checked" noStyle>
                                        <Switch size="small" />
                                    </Form.Item>
                                </div>
                            ))}
                </div>
                </Card>
                </div>

                {/* Staff Broadcast Channels Card */}
                <Card
                    className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100"
                    styles={{ body: { padding: '2rem' } }}
                >
                    <div className="mb-2 flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Staff Broadcast Channels</Title>
                        </div>
                    </div>
                    <Paragraph type="secondary" className="text-xs mb-6">
                        Control how operational events (auctions, payments, members, penalties) are broadcast to all staff users. Configure bot credentials in Gateway Config.
                    </Paragraph>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Bell size={14} className="text-indigo-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700">In-Portal Alerts</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Push events to staff notification inbox in real-time</div>
                                </div>
                            </div>
                            <Form.Item name="staffInPortalAlertsEnabled" valuePropName="checked" noStyle>
                                <Switch size="small" />
                            </Form.Item>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Send size={14} className="text-sky-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700">Telegram Channel</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Post events to the configured Telegram broadcast channel</div>
                                </div>
                            </div>
                            <Form.Item name="staffTelegramAlertsEnabled" valuePropName="checked" noStyle>
                                <Switch size="small" />
                            </Form.Item>
                        </div>
                    </div>
                </Card>
            </Form>
        </div>
    );
};

// Internal icon dependency fix
const GavelIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 15L7 20" /><path d="M2 22l5-5" /><path d="M7 22l5-5" /><path d="M10 7l-7 7" /><path d="M14 7l-7 7" /><path d="M17 10l-7 7" /><path d="M22 5l-7 7" /><path d="m15 13 2-2" /><path d="m17 11 2-2" /><path d="m21 9-2-2" /><path d="m19 7-2-2" /><path d="m17 5-2-2" /><path d="m15 3-2-2" />
    </svg>
);

export default AutomationRules;
