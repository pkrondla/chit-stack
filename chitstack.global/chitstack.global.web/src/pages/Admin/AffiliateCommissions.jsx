import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Tag, Select, Space, Statistic, Row, Col } from 'antd';
import { IndianRupee } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AffiliateCommissions() {
    const [statusFilter, setStatusFilter] = useState('');

    const { data: commissions = [], isLoading } = useQuery({
        queryKey: ['admin-all-commissions', statusFilter],
        queryFn: async () => {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const res = await api.get(`/Affiliates/admin/commissions${params}`);
            return res.data.data || [];
        }
    });

    const totalPending = commissions.filter(c => c.status === 'Pending').reduce((s, c) => s + (c.commissionAmount || 0), 0);
    const totalPaid = commissions.filter(c => c.status === 'Paid').reduce((s, c) => s + (c.commissionAmount || 0), 0);

    const columns = [
        {
            title: 'Affiliate', key: 'affiliate',
            render: (_, r) => (
                <div>
                    <div className="font-medium">{r.affiliateName}</div>
                    <Text code className="text-xs">{r.affiliateCode}</Text>
                </div>
            )
        },
        {
            title: 'Company', dataIndex: 'companyName', key: 'company'
        },
        {
            title: 'Order Ref', dataIndex: 'orderReference', key: 'ref',
            render: v => <Text code>{v}</Text>
        },
        {
            title: 'Order Amount', dataIndex: 'orderAmount', key: 'amount',
            render: v => `₹${Number(v).toLocaleString('en-IN')}`
        },
        {
            title: 'Rate', dataIndex: 'commissionPercent', key: 'pct',
            render: v => `${v}%`
        },
        {
            title: 'Commission', dataIndex: 'commissionAmount', key: 'commission',
            render: v => <strong className="text-green-600">₹{Number(v).toLocaleString('en-IN')}</strong>
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: v => <Tag color={v === 'Paid' ? 'success' : 'warning'}>{v}</Tag>
        },
        {
            title: 'Created', dataIndex: 'createdAt', key: 'date',
            render: v => new Date(v).toLocaleDateString('en-IN')
        },
        {
            title: 'Paid On', dataIndex: 'paidAt', key: 'paidAt',
            render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—'
        },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Space>
                    <IndianRupee size={24} className="text-indigo-600" />
                    <Title level={2} className="m-0">Affiliate Commissions</Title>
                </Space>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }} allowClear placeholder="All statuses">
                    <Option value="Pending">Pending</Option>
                    <Option value="Paid">Paid</Option>
                </Select>
            </div>

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12}>
                    <Card className="shadow-sm border-0">
                        <Statistic title="Pending Payouts" value={totalPending} precision={2}
                            prefix="₹" valueStyle={{ color: '#d97706' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card className="shadow-sm border-0">
                        <Statistic title="Total Paid Out" value={totalPaid} precision={2}
                            prefix="₹" valueStyle={{ color: '#16a34a' }} />
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm border-0">
                <Table
                    dataSource={commissions}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'No commissions found.' }}
                />
            </Card>
        </div>
    );
}
