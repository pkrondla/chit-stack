import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Row, Col, Statistic, Table, Button, Space, Tag } from 'antd';
import { FileText, Download, TrendingUp, Users, Home } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const AuditorDashboard = () => {
    const { data: stats = {} } = useQuery({
        queryKey: ['auditor-stats'],
        queryFn: async () => {
            const res = await api.get('/Reporting/auditor-summary');
            return res.data.data || res.data;
        }
    });

    const { data: recentEntries = [] } = useQuery({
        queryKey: ['recent-journal-entries'],
        queryFn: async () => {
            const res = await api.get('/Reporting/daybook?limit=10');
            return res.data.data || res.data;
        }
    });

    const columns = [
        { title: 'Date', dataIndex: 'transactionDate', key: 'date', render: (d) => new Date(d).toLocaleDateString() },
        { title: 'Voucher', dataIndex: 'voucherNumber', key: 'voucher' },
        { title: 'Account', dataIndex: 'accountName', key: 'account' },
        { title: 'Type', dataIndex: 'entryType', key: 'type', render: (t) => <Tag color="blue">{t}</Tag> },
        { title: 'Debit', dataIndex: 'debitAmount', key: 'debit', align: 'right', render: (v) => v > 0 ? v.toLocaleString() : '-' },
        { title: 'Credit', dataIndex: 'creditAmount', key: 'credit', align: 'right', render: (v) => v > 0 ? v.toLocaleString() : '-' },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0">Auditor Dashboard</Title>
                <Space>
                    <Button icon={<Download size={16} />}>Download Annual Report</Button>
                    <Button type="primary" icon={<Download size={16} />}>Export All Data (CSV)</Button>
                </Space>
            </div>

            <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic title="Total Assets" value={stats.totalAssets || 0} prefix="₹" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic title="Total Liabilities" value={stats.totalLiabilities || 0} prefix="₹" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic title="Foreman Profit (YTD)" value={stats.netProfit || 0} prefix="₹" valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm">
                        <Statistic title="Total Subscribers" value={stats.memberCount || 0} />
                    </Card>
                </Col>
            </Row>

            <Card title="Recent Financial Transactions" className="shadow-sm rounded-xl">
                <Table
                    columns={columns}
                    dataSource={recentEntries}
                    rowKey={(r, i) => i}
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default AuditorDashboard;
