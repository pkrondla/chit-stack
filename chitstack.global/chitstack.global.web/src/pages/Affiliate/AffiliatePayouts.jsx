import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Tag, Space, Statistic } from 'antd';
import { Receipt } from 'lucide-react';
import affiliateApi from '../../api/affiliateApi';
import useAffiliateAuthStore from '../../store/useAffiliateAuthStore';

const { Title, Text } = Typography;

export default function AffiliatePayouts() {
    const affiliate = useAffiliateAuthStore(state => state.affiliate);

    const { data: payouts = [], isLoading } = useQuery({
        queryKey: ['affiliate-payouts', affiliate?.id],
        queryFn: async () => {
            const res = await affiliateApi.get('/Affiliates/me/payouts');
            return res.data.data || [];
        },
        enabled: !!affiliate
    });

    const totalPaid = payouts.reduce((s, p) => s + (p.amount || 0), 0);

    const columns = [
        {
            title: 'Date', dataIndex: 'createdAt', key: 'date',
            render: v => new Date(v).toLocaleDateString('en-IN')
        },
        {
            title: 'Amount', dataIndex: 'amount', key: 'amount',
            render: v => <strong className="text-green-600">₹{Number(v).toLocaleString('en-IN')}</strong>
        },
        { title: 'Method', dataIndex: 'paymentMethod', key: 'method' },
        {
            title: 'Reference', dataIndex: 'paymentReference', key: 'ref',
            render: v => v ? <Text code>{v}</Text> : '—'
        },
        {
            title: 'Commissions', dataIndex: 'commissionsLinked', key: 'commissions',
            render: v => `${v} order${v !== 1 ? 's' : ''}`
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: v => <Tag color="success">{v}</Tag>
        },
        { title: 'Notes', dataIndex: 'notes', key: 'notes', render: v => v || '—' },
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Receipt size={24} className="text-indigo-600" />
                <Title level={2} className="m-0">My Payouts</Title>
            </div>

            <Card className="shadow-sm border-0 mb-6">
                <Statistic
                    title="Total Received"
                    value={totalPaid}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: '#4f46e5', fontSize: 28 }}
                />
            </Card>

            <Card className="shadow-sm border-0">
                <Table
                    dataSource={payouts}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: 'No payouts recorded yet. Pending commissions will be paid out by the admin.' }}
                />
            </Card>
        </div>
    );
}
