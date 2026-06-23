import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Typography, Tag, Table, Space, Spin } from 'antd';
import { IndianRupee, Users, Clock, CheckCircle, Handshake } from 'lucide-react';
import affiliateApi from '../../api/affiliateApi';
import useAffiliateAuthStore from '../../store/useAffiliateAuthStore';

const { Title, Text } = Typography;

export default function AffiliateDashboard() {
    const affiliate = useAffiliateAuthStore(state => state.affiliate);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['affiliate-profile', affiliate?.id],
        queryFn: async () => {
            const res = await affiliateApi.get('/Affiliates/me');
            return res.data.data;
        },
        enabled: !!affiliate
    });

    const { data: recentCommissions = [] } = useQuery({
        queryKey: ['affiliate-commissions-recent', affiliate?.id],
        queryFn: async () => {
            const res = await affiliateApi.get('/Affiliates/me/commissions');
            return (res.data.data || []).slice(0, 5);
        },
        enabled: !!affiliate
    });

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;

    const commissionColumns = [
        { title: 'Company', dataIndex: 'companyName', key: 'company' },
        { title: 'Order Ref', dataIndex: 'orderReference', key: 'ref', render: v => <Text code>{v}</Text> },
        { title: 'Order Amount', dataIndex: 'orderAmount', key: 'amount', render: v => `₹${v?.toLocaleString('en-IN')}` },
        { title: 'Commission', dataIndex: 'commissionAmount', key: 'commission', render: v => <strong className="text-green-600">₹{v?.toLocaleString('en-IN')}</strong> },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: v => <Tag color={v === 'Paid' ? 'success' : 'warning'}>{v}</Tag>
        },
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Handshake size={24} className="text-indigo-600" />
                <div>
                    <Title level={3} className="m-0">Welcome, {profile?.name}!</Title>
                    <Text type="secondary">Affiliate Code: <strong className="text-indigo-600">{profile?.code}</strong></Text>
                </div>
            </div>

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-0">
                        <Statistic
                            title="Total Referrals"
                            value={profile?.totalReferrals ?? 0}
                            prefix={<Users size={18} className="text-blue-500 mr-1" />}
                            valueStyle={{ color: '#1d4ed8' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-0">
                        <Statistic
                            title="Total Earned"
                            value={profile?.totalEarned ?? 0}
                            prefix={<IndianRupee size={18} className="text-green-500 mr-1" />}
                            precision={2}
                            valueStyle={{ color: '#16a34a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-0">
                        <Statistic
                            title="Pending Amount"
                            value={profile?.pendingAmount ?? 0}
                            prefix={<Clock size={18} className="text-orange-500 mr-1" />}
                            precision={2}
                            valueStyle={{ color: '#d97706' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-0">
                        <Statistic
                            title="Paid Out"
                            value={profile?.paidAmount ?? 0}
                            prefix={<CheckCircle size={18} className="text-indigo-500 mr-1" />}
                            precision={2}
                            valueStyle={{ color: '#4f46e5' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Recent Commissions" className="shadow-sm border-0">
                <Table
                    dataSource={recentCommissions}
                    columns={commissionColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: 'No commissions yet. Start referring clients using your affiliate code!' }}
                />
            </Card>

            <Card className="mt-4 shadow-sm border-0 bg-indigo-50 border-indigo-200">
                <Space direction="vertical">
                    <Title level={5} className="m-0 text-indigo-700">How to earn commissions</Title>
                    <Text className="text-indigo-600">
                        Share your affiliate code <strong>{profile?.code}</strong> with potential customers. 
                        When they subscribe to ChitStack and their payment is confirmed, 
                        {profile?.commissionPercent
                            ? ` you earn ${profile.commissionPercent}%`
                            : ' you earn a commission percentage (set by admin)'}
                        {' '}of the order total.
                    </Text>
                </Space>
            </Card>
        </div>
    );
}
