import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Typography, Button, Form, Input, Tag, message, Space } from 'antd';
import { Building, Plus } from 'lucide-react';
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
                        <div className="text-slate-500 text-sm">Key: {record.tenantKey}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'right',
            render: (status) => (
                <Tag color="success" className="px-3 py-1 rounded-full font-bold text-sm">
                    {status || 'Active'}
                </Tag>
            )
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
