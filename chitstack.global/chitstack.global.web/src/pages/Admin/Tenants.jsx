import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Typography, Button, Form, Input, Tag, message, Space, Tooltip } from 'antd';
import { Building, Plus, Mail } from 'lucide-react';
import api from '../../api/axios';

const { Title } = Typography;

const Tenants = () => {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ['tenants'],
        queryFn: async () => {
            const res = await api.get('/Tenants');
            return res.data.data || [];
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newTenant) => {
            const res = await api.post('/Tenants', newTenant);
            return res.data;
        },
        onSuccess: () => {
            message.success('Tenant Created!');
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
        },
        onError: (error) => {
            message.error("Error: " + (error.response?.data?.error || error.message));
        }
    });

    const handleCreate = (values) => {
        createMutation.mutate(values);
    };

    const STATUS_COLORS = {
        DemoAccess: 'blue', TrialExpired: 'orange', OrderSubmitted: 'cyan',
        PaymentPending: 'gold', PaymentConfirmed: 'green', Provisioning: 'purple',
        Active: 'success', Suspended: 'red'
    };

    const columns = [
        {
            title: 'Tenant',
            key: 'tenant',
            render: (_, record) => (
                <Space className="items-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex justify-center items-center">
                        <Building size={24} className="text-slate-500" />
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{record.name}</div>
                        <div className="text-slate-500 text-sm">
                            {record.subdomain ? `${record.subdomain}.chitstack.com` : 'Demo access'}
                        </div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_, r) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                        <Mail size={12} />{r.contactEmail || '—'}
                    </div>
                    {r.contactPhone && <div className="text-slate-400">{r.contactPhone}</div>}
                </div>
            )
        },
        {
            title: 'Subscription',
            dataIndex: 'subscriptionStatus',
            key: 'subscriptionStatus',
            render: (status) => (
                <Tag color={STATUS_COLORS[status] || 'default'}>{status || 'Active'}</Tag>
            )
        },
        {
            title: 'Trial Ends',
            dataIndex: 'trialEndDate',
            key: 'trialEndDate',
            render: (v, r) => {
                if (!v || r.subscriptionStatus === 'Active') return '—';
                const end = new Date(v);
                const past = end < new Date();
                return (
                    <Tooltip title={end.toLocaleString('en-IN')}>
                        <span className={past ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                            {end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {past ? ' (expired)' : ''}
                        </span>
                    </Tooltip>
                );
            }
        },
        {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
        }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <Title level={2} className="mb-8 text-slate-800">Global Admin: Tenant Management</Title>

            <Card className="mb-8 shadow-sm border-0">
                <Title level={4} className="mb-4 text-slate-800">Onboard New Tenant</Title>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <Form.Item
                        name="name"
                        label="Tenant Name (Organization)"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="Enter company name" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="tenantKey"
                        label="Tenant Key (Subdomain)"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="e.g., mycompany" size="large" />
                    </Form.Item>
                    <Form.Item label=" " className="flex items-end self-end mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            icon={<Plus size={18} />}
                            loading={createMutation.isPending}
                            className="bg-slate-900 w-full"
                        >
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Table
                dataSource={tenants}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={false}
                className="shadow-sm rounded-lg overflow-hidden bg-white"
            />
        </div>
    );
};

export default Tenants;
