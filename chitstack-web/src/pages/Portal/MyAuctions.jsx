import React, { useState } from 'react';
import { Typography, Card, Table, Tag, Spin, Result, Button, Select, Row, Col, Space, Layout } from 'antd';
import { Gavel, Calendar, Clock, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { semanticColors } from '../../theme/tokens';

const { Title, Text } = Typography;
const { Content } = Layout;

const MyAuctions = () => {
    const navigate = useNavigate();
    const { data: auctions = [], isLoading, error } = useQuery({
        queryKey: ['myAuctions'],
        queryFn: async () => {
            const res = await api.get('/Customer/my-auctions');
            return res.data.data || res.data;
        }
    });

    const [selectedGroup, setSelectedGroup] = useState('All');
    const uniqueGroups = Array.from(new Set(auctions.map(a => a.groupName)));

    const filteredAuctions = selectedGroup === 'All'
        ? auctions
        : auctions.filter(a => a.groupName === selectedGroup);

    const columns = [
        {
            title: 'Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <Text strong style={{ color: semanticColors.textTertiary }}>{text}</Text>
        },
        {
            title: 'Installment',
            dataIndex: 'installmentNumber',
            key: 'installmentNumber',
            render: (val) => <Tag color="blue" style={{ borderRadius: '8px', border: 'none' }}>#{val}</Tag>
        },
        {
            title: 'Auction Date',
            dataIndex: 'auctionDate',
            key: 'auctionDate',
            sorter: (a, b) => new Date(a.auctionDate) - new Date(b.auctionDate),
            defaultSortOrder: 'ascend',
            render: (date) => (
                <Space size={8}>
                    <Calendar size={14} style={{ color: semanticColors.textSecondary }} />
                    <Text style={{ color: semanticColors.textTertiary }}>{new Date(date).toLocaleDateString()}</Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    'Scheduled': 'processing',
                    'Open': 'success',
                    'Closed': 'default',
                    'Cancelled': 'error'
                };
                return <Tag color={colors[status] || 'default'} style={{ borderRadius: '12px', padding: '0 12px', fontWeight: 'bold', border: 'none' }}>{status}</Tag>;
            }
        },
        {
            title: 'Winning Bid',
            dataIndex: 'winningBidAmount',
            key: 'winningBidAmount',
            render: (val) => val ? <Text strong style={{ color: semanticColors.textTertiary }}>₹{val.toLocaleString()}</Text> : '-'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'Closed' || record.status === 'Completed' ? (
                        <Button
                            size="small"
                            style={{ borderRadius: '8px', fontWeight: 'bold', borderColor: semanticColors.border, color: semanticColors.textSecondary }}
                            onClick={() => navigate(`/portal/auctions/live/${record.auctionId}`)}
                        >
                            View Room
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            size="small"
                            style={{ background: semanticColors.primary, border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
                            onClick={() => navigate(`/portal/auctions/live/${record.auctionId}`)}
                        >
                            Join Auction
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spin size="large" /></div>;
    if (error) return <Result status="error" title="Data Sync Issue" subTitle="Failed to load auctions" />;

    return (
        <Layout style={{ background: 'transparent' }}>
            <Content style={{ padding: '0 4px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '16px', background: semanticColors.amber, color: 'white', borderRadius: '16px', boxShadow: '0 8px 16px rgba(245,158,11,0.1)' }}>
                            <Gavel size={24} />
                        </div>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>Auction Schedule</Title>
                            <Text type="secondary">Join live bidding and view previous auction history.</Text>
                        </div>
                    </div>

                    <Space direction="horizontal" align="center" size={12}>
                        <Text strong style={{ color: semanticColors.textSecondary, fontSize: '12px', textTransform: 'uppercase' }}>Group:</Text>
                        <Select
                            style={{ width: '240px' }}
                            value={selectedGroup}
                            onChange={setSelectedGroup}
                            options={[
                                { label: 'All Registered Groups', value: 'All' },
                                ...uniqueGroups.map(g => ({ label: g, value: g }))
                            ]}
                        />
                    </Space>
                </div>

                <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                    {filteredAuctions.filter(a => a.status === 'Open').map(auction => (
                        <Col xs={24} lg={12} key={auction.auctionId}>
                            <Card 
                                bordered={false} 
                                style={{ 
                                    background: `linear-gradient(135deg, ${semanticColors.textStrong} 0%, ${semanticColors.navBg} 100%)`, 
                                    borderRadius: '24px', 
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    height: '100%'
                                }}
                                bodyStyle={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
                            >
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <Tag color="warning" style={{ marginBottom: '16px', border: 'none', fontWeight: 900, textTransform: 'uppercase', borderRadius: '4px', fontSize: '10px' }}>Live Now</Tag>
                                    <Title level={3} style={{ color: 'white', margin: '0 0 16px 0' }}>{auction.groupName}</Title>
                                    
                                    <Row gutter={24} style={{ marginBottom: '24px' }}>
                                        <Col>
                                            <Space size={8}>
                                                <Clock size={16} style={{ color: semanticColors.textMuted }} />
                                                <Text style={{ color: semanticColors.textSubtle, fontWeight: 500 }}>Bidding in Progress</Text>
                                            </Space>
                                        </Col>
                                        <Col>
                                            <Space size={8}>
                                                <Trophy size={16} style={{ color: semanticColors.amber }} />
                                                <Text style={{ color: semanticColors.textSubtle, fontWeight: 500 }}>Ticket #{auction.installmentNumber}</Text>
                                            </Space>
                                        </Col>
                                    </Row>

                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => navigate(`/portal/auctions/live/${auction.auctionId}`)}
                                        style={{ background: semanticColors.surface, color: semanticColors.text, border: 'none', borderRadius: '12px', fontWeight: 900, height: '48px', padding: '0 32px' }}
                                    >
                                        Join Live Room
                                    </Button>
                                </div>
                                <Gavel size={200} style={{ position: 'absolute', right: '-40px', bottom: '-80px', color: 'rgba(255,255,255,0.03)' }} />
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Card 
                    title={<Text strong>Participation History</Text>}
                    style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${semanticColors.borderSoft}`, overflow: 'hidden' }}
                    bodyStyle={{ padding: '8px' }}
                >
                    <Table
                        columns={columns}
                        dataSource={filteredAuctions}
                        rowKey="auctionId"
                        pagination={{ pageSize: 12 }}
                        scroll={{ x: 800 }}
                    />
                </Card>
            </Content>
        </Layout>
    );
};

export default MyAuctions;
