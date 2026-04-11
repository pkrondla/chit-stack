import { Typography, Card, Table, Tag, Spin, Result, Button, Row, Col, Space, Progress, Layout } from 'antd';
import { History as HistoryIcon, Info, FileText, Wallet, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Content } = Layout;

const MyChits = () => {
    const navigate = useNavigate();
    const { data: chits = [], isLoading, error } = useQuery({
        queryKey: ['myChits'],
        queryFn: async () => {
            const res = await api.get('/Customer/my-chits');
            return res.data.data || res.data;
        }
    });

    const columns = [
        {
            title: 'Group Details',
            key: 'group',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#1e293b' }}>{record.groupName}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.groupCode}</Text>
                </Space>
            )
        },
        {
            title: 'Ticket',
            dataIndex: 'ticketNumber',
            key: 'ticketNumber',
            render: (num) => <Tag style={{ background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 500 }}>#{num}</Tag>
        },
        {
            title: 'Value',
            dataIndex: 'chitValue',
            key: 'chitValue',
            render: (val) => <Text strong style={{ color: '#334155' }}>₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Progression',
            key: 'progression',
            render: (_, record) => (
                <Space direction="vertical" size={4} style={{ width: '100%', minWidth: '120px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: '12px' }}>{record.currentInstallment} / {record.duration}</Text>
                        <Text type="secondary" style={{ fontSize: '10px' }}>{Math.round((record.currentInstallment / record.duration) * 100)}%</Text>
                    </div>
                    <Progress 
                        percent={(record.currentInstallment / record.duration) * 100} 
                        showInfo={false} 
                        strokeColor="#6366f1"
                        trailColor="#f1f5f9"
                        size="small"
                    />
                </Space>
            )
        },
        {
            title: 'Paid Amount',
            dataIndex: 'totalPaid',
            key: 'totalPaid',
            render: (val) => <Text strong style={{ color: '#10b981' }}>₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Space size={4}>
                    {record.isPrized && <Tag color="gold" style={{ borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>PRIZED</Tag>}
                    <Tag color="processing" style={{ borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>ACTIVE</Tag>
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Button 
                    type="primary"
                    icon={<FileText size={16} />} 
                    style={{ borderRadius: '10px', fontWeight: 'bold', background: '#4f46e5', height: '36px' }}
                    onClick={() => navigate(`/portal/passbook/${record.ticketId}`)}
                >
                    Passbook
                </Button>
            )
        }
    ];

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spin size="large" /></div>;
    if (error) return <Result status="error" title="Data Sync Issue" subTitle={error?.response?.data?.message || "Failed to load your chits. Please try again."} />;

    return (
        <Layout style={{ background: 'transparent' }}>
            <Content style={{ padding: '0 4px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '16px', background: '#0f172a', color: 'white', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                        <HistoryIcon size={24} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1e293b' }}>My Enrollment Portfolio</Title>
                        <Text type="secondary">Track your active groups and participation progress.</Text>
                    </div>
                </div>

                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ background: '#f8fafc', borderRadius: '20px' }}>
                            <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Chits</Text>
                            <Title level={3} style={{ margin: '4px 0 0 0' }}>{chits.length}</Title>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ background: '#ecfdf5', borderRadius: '20px' }}>
                            <Space align="start">
                                <div>
                                    <Text style={{ color: '#059669', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em' }}>Prized Tickets</Text>
                                    <Title level={3} style={{ margin: '4px 0 0 0', color: '#064e3b' }}>{chits.filter(c => c.isPrized).length}</Title>
                                </div>
                                <CheckCircle size={16} style={{ color: '#059669', marginTop: '2px' }} />
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ background: '#fffbeb', borderRadius: '20px' }}>
                            <Space align="start">
                                <div>
                                    <Text style={{ color: '#d97706', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em' }}>Total Savings</Text>
                                    <Title level={3} style={{ margin: '4px 0 0 0', color: '#78350f' }}>₹{chits.reduce((acc, c) => acc + c.totalPaid, 0).toLocaleString()}</Title>
                                </div>
                                <Wallet size={16} style={{ color: '#d97706', marginTop: '2px' }} />
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Card 
                    style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden' }}
                    bodyStyle={{ padding: '8px' }}
                >
                    <Table
                        columns={columns}
                        dataSource={chits}
                        rowKey="ticketId"
                        pagination={false}
                        scroll={{ x: 800 }}
                    />
                </Card>

                <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '20px', display: 'flex', gap: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ padding: '8px', background: '#e2e8f0', borderRadius: '8px', color: '#475569' }}>
                        <Info size={20} />
                    </div>
                    <div>
                        <Title level={5} style={{ margin: 0, color: '#334155' }}>About Your Portfolio</Title>
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                            View granular details by clicking on the 'Passbook' button. Prized tickets represent groups where you have successfully won an auction.
                        </Text>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default MyChits;
