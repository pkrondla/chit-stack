import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Tag, Spin, Result, Button, Row, Col, Space, Layout, Badge } from 'antd';
import {
    ChevronRight,
    Gavel,
    CreditCard,
    PlayCircle,
    History as HistoryIcon,
    Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Content } = Layout;

const PortalDashboard = () => {
    const navigate = useNavigate();

    const { data = null, isLoading, error } = useQuery({
        queryKey: ['portalDashboard'],
        queryFn: async () => {
            const res = await api.get('/Customer/dashboard');
            return res.data.data || res.data;
        },
        retry: 1
    });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spin size="large" /></div>;

    if (error) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to load dashboard. Please try again.";
        return (
            <div style={{ padding: '24px' }}>
                <Result
                    status="error"
                    title="Data Sync Error"
                    subTitle={errorMessage}
                    extra={<Button type="primary" onClick={() => window.location.reload()}>Retry</Button>}
                />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: '24px' }}>
                <Result
                    status="warning"
                    title="Account Incomplete"
                    subTitle="Please ensure your profile is linked to a Member record."
                    extra={<Button type="primary" onClick={() => navigate('/portal/settings')}>Check Profile</Button>}
                />
            </div>
        );
    }

    const { totalLiability = 0, myTickets = [], upcomingAuctions = [] } = data;

    const filteredAuctions = [...upcomingAuctions]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    return (
        <Layout style={{ background: 'transparent', padding: '24px' }}>
            <Content style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {/* Header Section */}
                <div style={{ marginBottom: '32px' }}>
                    <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4em', display: 'block', marginBottom: '4px' }}>
                        Account Insights
                    </Text>
                    <Title level={2} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.02em' }}>
                        Member Portal
                    </Title>
                </div>

                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                    {/* 1. Outstanding & Payments */}
                    <Col xs={24} lg={12}>
                        <Card 
                            bordered 
                            style={{ borderRadius: '24px', height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            bodyStyle={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        >
                            <div>
                                <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                                    Total Outstanding
                                </Text>
                                <Title level={1} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.05em', fontSize: '48px' }}>
                                    ₹{totalLiability.toLocaleString()}
                                </Title>
                                {data.totalPenalty > 0 && (
                                    <Text type="danger" strong style={{ fontSize: '10px', display: 'block', marginTop: '4px', textTransform: 'uppercase' }}>
                                        Includes ₹{data.totalPenalty.toLocaleString()} Late Fees
                                    </Text>
                                )}
                                <div style={{ marginTop: '16px' }}>
                                    <Badge 
                                        status={data.accountStatus === 'Healthy' ? 'success' : 'warning'} 
                                        text={<Text strong style={{ fontSize: '10px', textTransform: 'uppercase' }}>{data.accountStatus}</Text>} 
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={() => navigate('/portal/payments')}
                                    icon={<CreditCard size={18} />}
                                    style={{ height: '56px', borderRadius: '12px', fontWeight: 900, fontSize: '16px', background: '#4f46e5' }}
                                >
                                    Pay Outstanding
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    {/* 2. Upcoming Auctions */}
                    <Col xs={24} lg={12}>
                        <Card
                            bordered
                            title={<Space><Gavel size={20} /><Text strong>Upcoming Auctions</Text></Space>}
                            style={{ borderRadius: '24px', height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                {filteredAuctions.length === 0 ? (
                                    <div style={{ padding: '32px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0', color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                                        No pending auctions
                                    </div>
                                ) : (
                                    filteredAuctions.map((auction) => (
                                        <Card 
                                            key={auction.auctionId} 
                                            size="small" 
                                            style={{ borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}
                                            bodyStyle={{ padding: '12px' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Space size={12}>
                                                    <div style={{ width: '44px', height: '44px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>
                                                        <span style={{ color: '#64748b' }}>{new Date(auction.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                                        <span style={{ fontSize: '14px' }}>{new Date(auction.date).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <Text strong style={{ display: 'block' }}>{auction.groupName}</Text>
                                                        <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Inst. #{auction.installment}</Text>
                                                    </div>
                                                </Space>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    onClick={() => navigate(`/portal/auctions/live/${auction.auctionId}`)}
                                                    icon={<PlayCircle size={14} />}
                                                    style={{ borderRadius: '8px', fontSize: '10px', fontWeight: 900, background: '#4f46e5' }}
                                                >
                                                    JOIN
                                                </Button>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* Portfolio Section */}
                <Card
                    bordered
                    title={<Space><HistoryIcon size={20} /><Text strong>My Portfolio</Text></Space>}
                    style={{ borderRadius: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}
                    bodyStyle={{ padding: '24px' }}
                >
                    <Row gutter={[20, 20]}>
                        {myTickets.length === 0 ? (
                            <Col span={24}>
                                <div style={{ padding: '48px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0', color: '#94a3b8', fontSize: '13px' }}>
                                    No active chits found in your portfolio.
                                </div>
                            </Col>
                        ) : (
                            myTickets.map(ticket => (
                                <Col xs={24} sm={12} md={8} lg={6} key={ticket.ticketId}>
                                    <Card
                                        hoverable
                                        style={{ borderRadius: '20px', height: '100%', border: '1px solid #f1f5f9' }}
                                        onClick={() => navigate('/portal/my-chits')}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ width: '36px', height: '36px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                                                #{ticket.ticketNumber}
                                            </div>
                                            <Tag color={ticket.isPrized ? "gold" : "blue"} style={{ margin: 0, borderRadius: '20px', fontWeight: 'bold', fontSize: '10px' }}>
                                                {ticket.isPrized ? "PRIZED" : "ACTIVE"}
                                            </Tag>
                                        </div>
                                        
                                        <div style={{ marginBottom: '20px' }}>
                                            <Title level={5} style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{ticket.groupName}</Title>
                                            <Space style={{ marginTop: '8px' }}>
                                                <Wallet size={14} style={{ color: '#94a3b8' }} />
                                                <Text strong style={{ fontSize: '16px' }}>₹{ticket.chitValue?.toLocaleString()}</Text>
                                            </Space>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                                            <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
                                        </div>
                                    </Card>
                                </Col>
                            ))
                        )}
                    </Row>
                </Card>
            </Content>
        </Layout>
    );
};

export default PortalDashboard;
