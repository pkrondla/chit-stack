import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Tag, Space } from 'antd';
import { Users } from 'lucide-react';
import affiliateApi from '../../api/affiliateApi';
import useAffiliateAuthStore from '../../store/useAffiliateAuthStore';

const { Title, Text } = Typography;

const ORDER_STATUS_COLOR = {
    Submitted: 'blue', PaymentPending: 'orange', PaymentConfirmed: 'green',
    Provisioning: 'purple', Provisioned: 'success', Cancelled: 'red',
};

const COMMISSION_STATUS_COLOR = { Pending: 'warning', Paid: 'success' };

export default function AffiliateTenants() {
    const affiliate = useAffiliateAuthStore(state => state.affiliate);

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['affiliate-tenants', affiliate?.id],
        queryFn: async () => {
            const res = await affiliateApi.get('/Affiliates/me/tenants');
            return res.data.data || [];
        },
        enabled: !!affiliate
    });

    const columns = [
        { title: 'Company', dataIndex: 'companyName', key: 'company' },
        { title: 'Email', dataIndex: 'contactEmail', key: 'email' },
        {
            title: 'Subscription', dataIndex: 'subscriptionStatus', key: 'status',
            render: v => <Tag color={v === 'Active' ? 'success' : v === 'DemoAccess' ? 'blue' : 'default'}>{v}</Tag>
        },
        {
            title: 'Registered', dataIndex: 'registeredAt', key: 'registered',
            render: v => new Date(v).toLocaleDateString('en-IN')
        },
        {
            title: 'Order Ref', dataIndex: 'orderReference', key: 'ref',
            render: v => v ? <Text code>{v}</Text> : '—'
        },
        {
            title: 'Order Status', dataIndex: 'orderStatus', key: 'orderStatus',
            render: v => v ? <Tag color={ORDER_STATUS_COLOR[v] || 'default'}>{v}</Tag> : '—'
        },
        {
            title: 'Order Amount', dataIndex: 'orderAmount', key: 'amount',
            render: v => v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—'
        },
        {
            title: 'My Commission', dataIndex: 'commissionAmount', key: 'commission',
            render: v => v != null ? <strong className="text-green-600">₹{Number(v).toLocaleString('en-IN')}</strong> : '—'
        },
        {
            title: 'Commission Status', dataIndex: 'commissionStatus', key: 'commStatus',
            render: v => v ? <Tag color={COMMISSION_STATUS_COLOR[v] || 'default'}>{v}</Tag> : '—'
        },
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Users size={24} className="text-indigo-600" />
                <div>
                    <Title level={2} className="m-0">My Referrals</Title>
                    <Text type="secondary">Tenants who subscribed using your affiliate code</Text>
                </div>
            </div>

            <Card className="shadow-sm border-0">
                <Table
                    dataSource={tenants}
                    columns={columns}
                    rowKey="tenantId"
                    loading={isLoading}
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'No referrals yet. Share your affiliate code to start earning!' }}
                />
            </Card>
        </div>
    );
}
