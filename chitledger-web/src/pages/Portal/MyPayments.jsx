import { Typography, Card, Table, Tag, Spin, Result, Button, Tabs, Row, Col, Space, Layout } from 'antd';
import { Wallet, CreditCard, ChevronRight, Download, Clock, CheckCircle2, History as HistoryIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Content } = Layout;

const MyPayments = () => {
    const { data: summary = { recentPayments: [], pendingDemands: [] }, isLoading, error } = useQuery({
        queryKey: ['myPayments'],
        queryFn: async () => {
            const res = await api.get('/Customer/my-payments');
            return res.data.data || res.data;
        }
    });

    const pendingColumns = [
        {
            title: 'Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <Text strong style={{ color: '#1e293b' }}>{text}</Text>
        },
        {
            title: 'Installment',
            dataIndex: 'installmentNumber',
            key: 'installmentNumber',
            render: (val) => <Tag color="blue" style={{ borderRadius: '8px', border: 'none' }}>#{val}</Tag>
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (date) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ color: '#334155', fontWeight: 500 }}>{new Date(date).toLocaleDateString()}</Text>
                    <Text style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>Action Required</Text>
                </Space>
            )
        },
        {
            title: 'Amount Due',
            key: 'amount',
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    <Text strong style={{ color: '#1e293b', fontSize: '18px' }}>₹{record.balanceAmount.toLocaleString()}</Text>
                    
                    <Space direction="vertical" size={2}>
                        <Space style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b' }}>
                            <span>Subs: ₹{record.grossAmount.toLocaleString()}</span>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{ color: '#059669' }}>Div: -₹{record.dividendAmount.toLocaleString()}</span>
                        </Space>
                        
                        <Space wrap size={6}>
                            <Text 
                                delete={record.paidAmount > 0} 
                                style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', color: record.paidAmount > 0 ? '#94a3b8' : '#1e293b' }}
                            >
                                Net: ₹{record.netAmount.toLocaleString()}
                            </Text>
                            
                            {record.penaltyAmount > 0 && (
                                <Tag color="error" style={{ margin: 0, fontSize: '9px', padding: '0 6px', border: 'none', borderRadius: '4px', fontWeight: 900, textTransform: 'uppercase' }}>
                                    +₹{record.penaltyAmount.toLocaleString()} Late Fee
                                </Tag>
                            )}

                            {record.paidAmount > 0 && (
                                <Tag style={{ margin: 0, fontSize: '9px', padding: '0 6px', border: 'none', borderRadius: '4px', fontWeight: 900, textTransform: 'uppercase', background: '#ecfdf5', color: '#047857' }}>
                                    -₹{record.paidAmount.toLocaleString()} Paid
                                </Tag>
                            )}
                        </Space>
                    </Space>
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: () => (
                <Button type="primary" style={{ background: '#059669', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                    Pay Now
                </Button>
            )
        }
    ];

    const historyColumns = [
        {
            title: 'Date',
            dataIndex: 'receiptDate',
            key: 'receiptDate',
            render: (date) => <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>
        },
        {
            title: 'Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <Text strong style={{ color: '#1e293b' }}>{text}</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val) => <Text strong style={{ color: '#059669' }}>₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: (mode) => <Tag style={{ borderRadius: '12px' }}>{mode}</Tag>
        },
        {
            title: 'Reference',
            dataIndex: 'referenceNumber',
            key: 'referenceNumber',
            render: (ref) => <Text code style={{ fontSize: '11px', color: '#94a3b8' }}>{ref || '-'}</Text>
        },
        {
            title: 'Receipt',
            key: 'receipt',
            render: () => (
                <Button type="text" icon={<Download size={16} />} style={{ color: '#4f46e5', padding: 0 }} />
            )
        }
    ];

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spin size="large" /></div>;
    if (error) return <Result status="error" title="Data Sync Issue" subTitle={error?.response?.data?.message || "Failed to load payment info"} />;

    const totalDue = summary.pendingDemands.reduce((acc, d) => acc + d.balanceAmount, 0);

    return (
        <Layout style={{ background: 'transparent' }}>
            <Content style={{ padding: '0 4px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '16px', background: '#059669', color: 'white', borderRadius: '16px', boxShadow: '0 8px 16px rgba(5,150,105,0.1)' }}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>My Payments</Title>
                        <Text type="secondary">Manage your dues and track your transaction history.</Text>
                    </div>
                </div>

                {totalDue > 0 && (
                    <Card 
                        style={{ 
                            marginBottom: '32px', 
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                            borderRadius: '32px', 
                            border: 'none',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                        }}
                        bodyStyle={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                            <div>
                                <Text style={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                                    Total Outstanding Balance
                                </Text>
                                <Title level={1} style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '48px', letterSpacing: '-0.02em' }}>
                                    ₹{totalDue.toLocaleString()}
                                </Title>
                                <div style={{ marginTop: '16px' }}>
                                    <Tag style={{ background: '#334155', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '24px' }}>
                                        <Clock size={12} /> {summary.pendingDemands.length} Pending Dues
                                    </Tag>
                                </div>
                            </div>
                            <Button 
                                type="primary"
                                size="large" 
                                style={{ height: '60px', padding: '0 40px', borderRadius: '16px', background: 'white', color: '#1e293b', border: 'none', fontWeight: 900, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                Pay All Dues <ChevronRight size={20} />
                            </Button>
                        </div>
                        <Wallet size={240} style={{ position: 'absolute', right: '-40px', bottom: '-80px', color: 'rgba(255,255,255,0.03)' }} />
                    </Card>
                )}

                <Card 
                    style={{ borderRadius: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}
                    bodyStyle={{ padding: '24px' }}
                >
                    <Tabs
                        defaultActiveKey="pending"
                        items={[
                            {
                                key: 'pending',
                                label: (
                                    <Space style={{ padding: '8px 16px' }}>
                                        <Clock size={18} /> <Text strong>Pending Dues</Text>
                                    </Space>
                                ),
                                children: (
                                    <div style={{ marginTop: '16px' }}>
                                        {summary.pendingDemands.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '64px 0', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                                                <div style={{ background: '#d1fae5', color: '#10b981', width: '64px', height: '64px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                                    <CheckCircle2 size={32} />
                                                </div>
                                                <Title level={4} style={{ margin: 0 }}>No Pending Dues</Title>
                                                <Text type="secondary">You are all caught up! Great job.</Text>
                                            </div>
                                        ) : (
                                            <Table
                                                columns={pendingColumns}
                                                dataSource={summary.pendingDemands}
                                                rowKey="demandId"
                                                pagination={false}
                                                scroll={{ x: 800 }}
                                            />
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'history',
                                label: (
                                    <Space style={{ padding: '8px 16px' }}>
                                        <HistoryIcon size={18} /> <Text strong>Payment History</Text>
                                    </Space>
                                ),
                                children: (
                                    <div style={{ marginTop: '16px' }}>
                                        <Table
                                            columns={historyColumns}
                                            dataSource={summary.recentPayments}
                                            rowKey="receiptId"
                                            pagination={{ pageSize: 10 }}
                                            scroll={{ x: 800 }}
                                        />
                                    </div>
                                )
                            }
                        ]}
                    />
                </Card>
            </Content>
        </Layout>
    );
};

export default MyPayments;
