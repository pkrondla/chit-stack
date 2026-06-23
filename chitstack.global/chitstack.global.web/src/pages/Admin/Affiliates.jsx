import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Table, Typography, Button, Tag, Space, Drawer, Tabs,
    Form, Input, InputNumber, Switch, message, Popconfirm, Descriptions, Divider, Modal
} from 'antd';
import { Handshake, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

export default function Affiliates() {
    const queryClient = useQueryClient();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const { data: affiliates = [], isLoading } = useQuery({
        queryKey: ['admin-affiliates'],
        queryFn: async () => {
            const res = await api.get('/Affiliates/admin');
            return res.data.data || [];
        }
    });

    const { data: commissions = [] } = useQuery({
        queryKey: ['affiliate-commissions-detail', selected?.id],
        queryFn: async () => {
            const res = await api.get(`/Affiliates/admin/${selected.id}/commissions`);
            return res.data.data || [];
        },
        enabled: !!selected?.id
    });

    const { data: payouts = [] } = useQuery({
        queryKey: ['affiliate-payouts-detail', selected?.id],
        queryFn: async () => {
            const res = await api.get(`/Affiliates/admin/${selected.id}/payouts`);
            return res.data.data || [];
        },
        enabled: !!selected?.id
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, approve }) => api.post(`/Affiliates/admin/${id}/approve`, { approve }),
        onSuccess: (_, { approve }) => {
            message.success(approve ? 'Affiliate approved!' : 'Affiliate suspended.');
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
        },
        onError: err => message.error(err.response?.data?.errors?.[0] || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, values }) => api.put(`/Affiliates/admin/${id}`, {
            commissionPercent: values.commissionPercent,
            clearCommissionOverride: values.clearOverride,
            name: values.name,
            phone: values.phone,
            companyName: values.companyName
        }),
        onSuccess: () => {
            message.success('Affiliate updated.');
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
        },
        onError: err => message.error(err.response?.data?.errors?.[0] || 'Failed')
    });

    const addMutation = useMutation({
        mutationFn: values => api.post('/Affiliates/admin', values),
        onSuccess: () => {
            message.success('Affiliate added successfully.');
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
            setAddModal(false);
            addForm.resetFields();
        },
        onError: err => message.error(err.response?.data?.errors?.[0] || 'Failed')
    });

    const payoutMutation = useMutation({
        mutationFn: ({ id, values }) => api.post(`/Affiliates/admin/${id}/payouts`, {
            amount: values.amount,
            paymentMethod: values.paymentMethod,
            paymentReference: values.paymentReference,
            notes: values.notes
        }),
        onSuccess: () => {
            message.success('Payout recorded!');
            queryClient.invalidateQueries({ queryKey: ['affiliate-commissions-detail', selected?.id] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-payouts-detail', selected?.id] });
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
        },
        onError: err => message.error(err.response?.data?.errors?.[0] || 'Failed')
    });

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', render: v => <Text code>{v}</Text> },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Company', dataIndex: 'companyName', key: 'company', render: v => v || '—' },
        {
            title: 'Status', key: 'status',
            render: (_, r) => (
                <Space>
                    <Tag color={r.isApproved ? 'success' : 'warning'}>{r.isApproved ? 'Approved' : 'Pending'}</Tag>
                    {!r.isActive && <Tag color="error">Suspended</Tag>}
                </Space>
            )
        },
        {
            title: 'Commission %', dataIndex: 'commissionPercent', key: 'pct',
            render: v => v != null ? `${v}%` : <Tag>Default</Tag>
        },
        {
            title: 'Referrals', dataIndex: 'totalReferrals', key: 'referrals', align: 'center'
        },
        {
            title: 'Total Earned', dataIndex: 'totalCommissionAmount', key: 'earned',
            render: v => <strong className="text-green-600">₹{Number(v).toLocaleString('en-IN')}</strong>
        },
        {
            title: 'Pending', dataIndex: 'pendingCommissionAmount', key: 'pending',
            render: v => v > 0 ? <span className="text-orange-600 font-medium">₹{Number(v).toLocaleString('en-IN')}</span> : '—'
        },
        {
            title: 'Joined', dataIndex: 'createdAt', key: 'date',
            render: v => new Date(v).toLocaleDateString('en-IN')
        },
        {
            title: 'Actions', key: 'actions',
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<Eye size={14} />}
                        onClick={() => { setSelected(r); setDrawerOpen(true); editForm.setFieldsValue({ commissionPercent: r.commissionPercent, name: r.name, phone: r.phone, companyName: r.companyName }); }}>
                        View
                    </Button>
                    {!r.isApproved && (
                        <Popconfirm title="Approve this affiliate?" onConfirm={() => approveMutation.mutate({ id: r.id, approve: true })}>
                            <Button size="small" type="primary" icon={<CheckCircle size={12} />} className="bg-green-600">Approve</Button>
                        </Popconfirm>
                    )}
                    {r.isApproved && r.isActive && (
                        <Popconfirm title="Suspend this affiliate?" onConfirm={() => approveMutation.mutate({ id: r.id, approve: false })}>
                            <Button size="small" danger icon={<XCircle size={12} />}>Suspend</Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Space>
                    <Handshake size={24} className="text-indigo-600" />
                    <Title level={2} className="m-0">Affiliates</Title>
                </Space>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => setAddModal(true)} className="bg-indigo-600">
                    Add Affiliate
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Table dataSource={affiliates} columns={columns} rowKey="id" loading={isLoading}
                    pagination={{ pageSize: 20 }} scroll={{ x: 1000 }} />
            </Card>

            {/* Detail Drawer */}
            <Drawer
                title={selected ? `${selected.name} (${selected.code})` : ''}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setSelected(null); }}
                width={700}
            >
                {selected && (
                    <Tabs items={[
                        {
                            key: 'profile',
                            label: 'Profile & Settings',
                            children: <ProfileTab
                                affiliate={selected}
                                form={editForm}
                                onUpdate={values => updateMutation.mutate({ id: selected.id, values })}
                                isPending={updateMutation.isPending}
                            />
                        },
                        {
                            key: 'commissions',
                            label: `Commissions (${commissions.length})`,
                            children: <CommissionsTab
                                commissions={commissions}
                                affiliateId={selected?.id}
                                pendingAmount={selected?.pendingCommissionAmount}
                                onPayout={values => payoutMutation.mutate({ id: selected.id, values })}
                                isPending={payoutMutation.isPending}
                            />
                        },
                        {
                            key: 'payouts',
                            label: `Payouts (${payouts.length})`,
                            children: <PayoutsTab payouts={payouts} />
                        }
                    ]} />
                )}
            </Drawer>

            {/* Add Affiliate Modal */}
            <Modal title="Add New Affiliate" open={addModal} onCancel={() => { setAddModal(false); addForm.resetFields(); }}
                footer={null} width={480}>
                <Form form={addForm} layout="vertical" onFinish={v => addMutation.mutate(v)} className="mt-4">
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="companyName" label="Company Name">
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="commissionPercent" label="Commission % (leave blank for default)">
                        <InputNumber min={0} max={100} precision={2} className="w-full" addonAfter="%" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={addMutation.isPending} block className="bg-indigo-600">
                        Add Affiliate
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}

function ProfileTab({ affiliate, form, onUpdate, isPending }) {
    return (
        <div>
            <Descriptions column={1} size="small" bordered className="mb-4">
                <Descriptions.Item label="Name">{affiliate.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{affiliate.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{affiliate.phone}</Descriptions.Item>
                <Descriptions.Item label="Company">{affiliate.companyName || '—'}</Descriptions.Item>
                <Descriptions.Item label="Code"><Text code>{affiliate.code}</Text></Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={affiliate.isApproved ? 'success' : 'warning'}>{affiliate.isApproved ? 'Approved' : 'Pending'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Approved By">{affiliate.approvedBy || '—'}</Descriptions.Item>
                <Descriptions.Item label="Joined">{new Date(affiliate.createdAt).toLocaleDateString('en-IN')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Update Commission Rate</Divider>
            <Form form={form} layout="vertical" onFinish={onUpdate}>
                <Form.Item name="commissionPercent" label="Commission % Override (blank = use global default)">
                    <InputNumber min={0} max={100} precision={2} className="w-full" addonAfter="%" />
                </Form.Item>
                <Form.Item name="clearOverride" valuePropName="checked">
                    <Switch checkedChildren="Clear override" unCheckedChildren="Keep override" />
                    <span className="ml-2 text-slate-500 text-sm">Toggle to remove the override and use the global default</span>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={isPending} className="bg-indigo-600">
                    Save Changes
                </Button>
            </Form>
        </div>
    );
}

function CommissionsTab({ commissions, pendingAmount, onPayout, isPending }) {
    const [payoutForm] = Form.useForm();
    const pending = commissions.filter(c => c.status === 'Pending');

    return (
        <div>
            <Table
                dataSource={commissions}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                    { title: 'Order', dataIndex: 'orderReference', render: v => <Text code>{v}</Text> },
                    { title: 'Company', dataIndex: 'companyName' },
                    { title: 'Amount', dataIndex: 'orderAmount', render: v => `₹${Number(v).toLocaleString('en-IN')}` },
                    { title: 'Commission', dataIndex: 'commissionAmount', render: v => <strong className="text-green-600">₹{Number(v).toLocaleString('en-IN')}</strong> },
                    { title: 'Status', dataIndex: 'status', render: v => <Tag color={v === 'Paid' ? 'success' : 'warning'}>{v}</Tag> },
                    { title: 'Date', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString('en-IN') },
                ]}
            />

            {pending.length > 0 && (
                <>
                    <Divider orientation="left">Record Payout</Divider>
                    <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                        <Text>Pending amount: <strong className="text-orange-600">₹{Number(pendingAmount).toLocaleString('en-IN')}</strong> across {pending.length} commission(s)</Text>
                    </div>
                    <Form form={payoutForm} layout="vertical" onFinish={onPayout}>
                        <Form.Item name="amount" label="Payout Amount (₹)" rules={[{ required: true }]}
                            initialValue={pendingAmount}>
                            <InputNumber min={0} precision={2} className="w-full" />
                        </Form.Item>
                        <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
                            <Input placeholder="UPI / NEFT / Cash / Cheque" />
                        </Form.Item>
                        <Form.Item name="paymentReference" label="Payment Reference / UTR">
                            <Input />
                        </Form.Item>
                        <Form.Item name="notes" label="Notes">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={isPending} className="bg-green-600">
                            Record Payout & Mark Commissions as Paid
                        </Button>
                    </Form>
                </>
            )}
        </div>
    );
}

function PayoutsTab({ payouts }) {
    return (
        <Table
            dataSource={payouts}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
                { title: 'Date', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString('en-IN') },
                { title: 'Amount', dataIndex: 'amount', render: v => <strong>₹{Number(v).toLocaleString('en-IN')}</strong> },
                { title: 'Method', dataIndex: 'paymentMethod' },
                { title: 'Reference', dataIndex: 'paymentReference', render: v => v || '—' },
                { title: 'Orders', dataIndex: 'commissionsLinked' },
                { title: 'Notes', dataIndex: 'notes', render: v => v || '—' },
            ]}
        />
    );
}
