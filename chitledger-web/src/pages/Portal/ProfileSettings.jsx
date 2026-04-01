import { useState, useEffect } from 'react';
import { Card, Typography, Switch, Space, Divider, Spin, Avatar, Button, Tag, App, Row, Col, Layout } from 'antd';
import { User, Bell, MessageSquare, Smartphone, Mail, Shield } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const ProfileSettings = () => {
    const user = useAuthStore(state => state.user);
    const { message } = App.useApp();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/Members/${user.memberId}`);
            setMember(res.data.data || res.data);
        } catch (err) {
            message.error('Failed to load profile settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.memberId) fetchProfile();
    }, [user]);

    const updatePreference = async (key, value) => {
        try {
            const formData = new FormData();
            formData.append(key, value);
            await api.put(`/Members/${member.id}`, formData);
            setMember(prev => ({ ...prev, [key]: value }));
            message.success('Preference updated successfully');
        } catch (err) {
            message.error('Failed to update preference');
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spin size="large" /></div>;

    const identityFields = [
        { label: 'Full Registered Name', value: member?.fullName, icon: null },
        { label: 'Mobile Number', value: member?.phoneNumber, icon: <Smartphone size={14} /> },
        { label: 'Email Address', value: member?.email || 'Not Provided', icon: <Mail size={14} /> },
        { label: 'PAN Number', value: member?.panNumber ? `${member.panNumber.substring(0, 5)}*****` : 'Pending', icon: null },
        { label: 'Aadhaar Number', value: member?.aadhaarNumber ? `**** **** ${member.aadhaarNumber.slice(-4)}` : 'Pending', icon: null },
        { label: 'Mailing Address', value: member?.address || 'Not Provided', icon: null, span: true },
    ];

    const notificationPrefs = [
        { 
            label: 'In-Portal Notifications', 
            key: 'inPortalEnabled', 
            icon: <Bell size={18} />, 
            desc: 'Receive alerts within the web/app portal (bell icon).' 
        },
        { 
            label: 'WhatsApp Alerts', 
            key: 'whatsAppEnabled', 
            icon: <MessageSquare size={18} />, 
            desc: 'Get instant payment receipts and auction updates on WhatsApp.' 
        },
        { 
            label: 'SMS Notifications', 
            key: 'smsEnabled', 
            icon: <Smartphone size={18} />, 
            desc: 'Traditional text message alerts for critical updates.' 
        },
        { 
            label: 'Email Communication', 
            key: 'emailEnabled', 
            icon: <Mail size={18} />, 
            desc: 'Detailed statements and receipts delivered to your inbox.' 
        }
    ];

    return (
        <Layout style={{ background: 'transparent' }}>
            <Content style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '0 12px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <Title level={2} style={{ margin: 0 }}>Account Settings</Title>
                    <Text type="secondary" style={{ fontWeight: 500 }}>Manage your profile and communication preferences.</Text>
                </div>

                <Card 
                    bordered={false} 
                    style={{ borderRadius: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', marginBottom: '24px', overflow: 'hidden' }}
                    bodyStyle={{ padding: 0 }}
                >
                    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'linear-gradient(to right, #f8fafc, white)' }}>
                        <Avatar size={80} icon={<User size={40} />} style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }} />
                        <div>
                            <Title level={3} style={{ margin: 0, fontWeight: 900 }}>{member?.fullName}</Title>
                            <Tag color="blue" style={{ borderRadius: '20px', border: 'none', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', marginTop: '8px' }}>
                                Verified Member Profile
                            </Tag>
                        </div>
                    </div>
                    
                    <div style={{ padding: '32px', borderTop: '1px solid #f1f5f9' }}>
                        <Space style={{ marginBottom: '24px', color: '#1e293b' }}>
                            <User size={18} style={{ color: '#4f46e5' }} />
                            <Text strong style={{ fontSize: '16px' }}>Personal Identity</Text>
                        </Space>

                        <Row gutter={[16, 16]}>
                            {identityFields.map((field, idx) => (
                                <Col xs={24} sm={field.span ? 24 : 12} key={idx}>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                        <Text style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                                            {field.label}
                                        </Text>
                                        <Text strong style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {field.icon} {field.value}
                                        </Text>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '20px', border: '1px solid #fef3c7', display: 'flex', gap: '12px' }}>
                            <Text style={{ fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
                                ⓘ These details were verified by the branch during registration. Contact your administrator to update this information.
                            </Text>
                        </div>
                    </div>
                    
                    <Divider style={{ margin: 0 }} />
                    
                    <div style={{ padding: '32px' }}>
                        <Space style={{ marginBottom: '24px', color: '#1e293b' }}>
                            <Bell size={18} style={{ color: '#4f46e5' }} />
                            <Text strong style={{ fontSize: '16px' }}>Notification Channels</Text>
                        </Space>
                        
                        <Space direction="vertical" style={{ width: '100%' }} size={24}>
                            {notificationPrefs.map(pref => (
                                <div key={pref.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Space size={16} align="start">
                                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                                            {pref.icon}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text strong style={{ color: '#1e293b', fontSize: '14px' }}>{pref.label}</Text>
                                            <Text type="secondary" style={{ fontSize: '12px', maxWidth: '400px' }}>{pref.desc}</Text>
                                        </div>
                                    </Space>
                                    <Switch 
                                        checked={member?.[pref.key]} 
                                        onChange={(checked) => updatePreference(pref.key, checked)}
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                            ))}
                        </Space>
                    </div>
                </Card>

                <Card 
                    bordered={false} 
                    style={{ borderRadius: '32px', background: '#0f172a', marginBottom: '48px' }}
                    bodyStyle={{ padding: '32px' }}
                >
                    <Space size={20} align="start">
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white' }}>
                            <Shield size={24} />
                        </div>
                        <div>
                            <Title level={5} style={{ color: 'white', margin: '0 0 8px 0' }}>Privacy & Security</Title>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '20px' }}>
                                Your account is secured with enterprise-grade encryption. We only send transactional alerts related to your financial activity.
                            </Paragraph>
                            <Button 
                                type="primary" 
                                ghost 
                                style={{ borderRadius: '12px', borderColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
                            >
                                Change Security Password
                            </Button>
                        </div>
                    </Space>
                </Card>
            </Content>
        </Layout>
    );
};

export default ProfileSettings;
