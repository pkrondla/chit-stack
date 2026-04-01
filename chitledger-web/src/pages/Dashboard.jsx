import { Row, Col, Card, Statistic, Table } from 'antd';
import { UserOutlined, GroupOutlined, DollarOutlined, TransactionOutlined } from '@ant-design/icons';
import React from 'react';

const Dashboard = () => {
    return (
        <div className="dashboard-container" style={{ padding: '24px' }}>
            <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>
            
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic 
                            title="Total Members" 
                            value={1254} 
                            prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic 
                            title="Active Groups" 
                            value={45} 
                            prefix={<GroupOutlined style={{ color: '#52c41a' }} />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic 
                            title="Total Collections" 
                            value={1250000} 
                            prefix={<DollarOutlined style={{ color: '#faad14' }} />} 
                            precision={2}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic 
                            title="Pending Auctions" 
                            value={5} 
                            prefix={<TransactionOutlined style={{ color: '#f5222d' }} />} 
                        />
                    </Card>
                </Col>
            </Row>

            {/* Placeholder for more dashboard content */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card title="Recent Transactions">
                        <Table 
                            dataSource={[]} 
                            columns={[
                                { title: 'Date', dataIndex: 'date' },
                                { title: 'Member', dataIndex: 'member' },
                                { title: 'Amount', dataIndex: 'amount' },
                                { title: 'Status', dataIndex: 'status' }
                            ]} 
                            locale={{ emptyText: 'No recent transactions' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
