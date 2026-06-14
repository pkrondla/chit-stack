import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Table, Typography, Button, Tag, Space, Drawer, Tabs,
    Form, Input, DatePicker, InputNumber, Select, message, Popconfirm,
    Timeline, Divider, Alert, Descriptions
} from 'antd';
import { ShoppingBag, CheckCircle, XCircle, Zap, Eye } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_COLORS = {
    Submitted: 'blue',
    PaymentPending: 'orange',
    PaymentConfirmed: 'green',
    Provisioning: 'purple',
    Provisioned: 'success',
    Cancelled: 'red',
    OrderSubmitted: 'blue',
};

const PAYMENT_STATUS_COLORS = {
    None: 'default',
    Pending: 'orange',
    Confirmed: 'green',
    Rejected: 'red',
};

export default function Orders() {
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentForm] = Form.useForm();
    const [provisionForm] = Form.useForm();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['admin-orders', statusFilter],
        queryFn: async () => {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const res = await api.get(`/Orders/admin${params}`);
            return res.data.data || [];
        }
    });

    const { data: orderDetail, isLoading: detailLoading } = useQuery({
        queryKey: ['admin-order-detail', selectedOrder?.orderReference],
        queryFn: async () => {
            const res = await api.get(`/Orders/admin/${selectedOrder.orderReference}`);
            return res.data.data;
        },
        enabled: !!selectedOrder?.orderReference
    });

    const recordPaymentMutation = useMutation({
        mutationFn: (values) => api.patch(`/Orders/admin/${selectedOrder.orderReference}/payment`, {
            ...values,
            paymentDate: values.paymentDate?.toISOString(),
            updatedBy: 'Admin',
        }),
        onSuccess: () => {
            message.success('Payment recorded');
            queryClient.invalidateQueries({ queryKey: ['admin-order-detail', selectedOrder?.orderReference] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            paymentForm.resetFields();
        },
        onError: (err) => message.error(err.response?.data?.errors?.[0] || 'Failed')
    });

    const confirmPaymentMutation = useMutation({
        mutationFn: ({ ref, transactionId, isRejection, rejectionReason }) =>
            api.post(`/Orders/admin/${ref}/${isRejection ? 'reject-payment' : 'confirm-payment'}`, {
                transactionId, rejectionReason
            }),
        onSuccess: (_, { isRejection }) => {
            message.success(isRejection ? 'Payment rejected' : 'Payment confirmed!');
            queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
    });

    const provisionMutation = useMutation({
        mutationFn: (ref) => api.post(`/Orders/admin/${ref}/provision`),
        onSuccess: () => {
            message.success('Order marked as Provisioning');
            queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
    });

    const completeMutation = useMutation({
        mutationFn: (values) => api.post(`/Orders/admin/${selectedOrder.orderReference}/complete`, {
            connectionString: values.connectionString,
            portalUrl: values.portalUrl,
        }),
        onSuccess: () => {
            message.success('Provisioning complete! Welcome email sent.');
            queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            provisionForm.resetFields();
        }
    });

    const columns = [
        {
            title: 'Order Ref',
            dataIndex: 'orderReference',
            key: 'ref',
            render: v => <Text code>{v}</Text>
        },
        { title: 'Company', dataIndex: 'companyName', key: 'company' },
        { title: 'Subdomain', dataIndex: 'tenantKey', key: 'key', render: v => <Tag>{v}</Tag> },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            key: 'amount',
            render: v => <span className="font-semibold">₹{v?.toLocaleString('en-IN')}</span>
        },
        {
            title: 'Status',
            dataIndex: 'orderStatus',
            key: 'status',
            render: v => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'payment',
            render: v => <Tag color={PAYMENT_STATUS_COLORS[v] || 'default'}>{v}</Tag>
        },
        {
            title: 'Submitted',
            dataIndex: 'createdAt',
            key: 'date',
            render: v => new Date(v).toLocaleDateString('en-IN')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    size="small"
                    icon={<Eye size={14} />}
                    onClick={() => { setSelectedOrder(record); setDrawerOpen(true); }}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Space>
                    <ShoppingBag size={24} className="text-indigo-600" />
                    <Title level={2} className="m-0">Subscription Orders</Title>
                </Space>
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 180 }}
                    placeholder="Filter by status"
                    allowClear
                >
                    {Object.keys(STATUS_COLORS).map(s => (
                        <Option key={s} value={s}>{s}</Option>
                    ))}
                </Select>
            </div>

            <Card className="shadow-sm border-0">
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 20 }}
                />
            </Card>

            {/* Detail Drawer */}
            <Drawer
                title={selectedOrder ? `Order ${selectedOrder.orderReference}` : ''}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
                width={680}
                bodyStyle={{ padding: 16 }}
            >
                {detailLoading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : orderDetail ? (
                    <Tabs
                        items={[
                            {
                                key: 'summary',
                                label: 'Order Summary',
                                children: <OrderSummaryTab order={orderDetail} />
                            },
                            {
                                key: 'payment',
                                label: 'Payment',
                                children: (
                                    <PaymentTab
                                        order={orderDetail}
                                        paymentForm={paymentForm}
                                        onRecord={(v) => recordPaymentMutation.mutate(v)}
                                        onConfirm={(txId) => confirmPaymentMutation.mutate({
                                            ref: orderDetail.orderReference,
                                            transactionId: txId,
                                            isRejection: false
                                        })}
                                        onReject={(txId, reason) => confirmPaymentMutation.mutate({
                                            ref: orderDetail.orderReference,
                                            transactionId: txId,
                                            isRejection: true,
                                            rejectionReason: reason
                                        })}
                                        isPending={recordPaymentMutation.isPending || confirmPaymentMutation.isPending}
                                    />
                                )
                            },
                            {
                                key: 'provisioning',
                                label: 'Provisioning',
                                children: (
                                    <ProvisioningTab
                                        order={orderDetail}
                                        form={provisionForm}
                                        onProvision={() => provisionMutation.mutate(orderDetail.orderReference)}
                                        onComplete={(v) => completeMutation.mutate(v)}
                                        isPending={provisionMutation.isPending || completeMutation.isPending}
                                    />
                                )
                            }
                        ]}
                    />
                ) : <Alert message="Could not load order details." type="error" />}
            </Drawer>
        </div>
    );
}

function OrderSummaryTab({ order }) {
    return (
        <div>
            <Descriptions column={1} size="small" bordered className="mb-4">
                <Descriptions.Item label="Company">{order.companyName}</Descriptions.Item>
                <Descriptions.Item label="Subdomain">{order.tenantKey}.chitstack.com</Descriptions.Item>
                <Descriptions.Item label="Admin">{order.adminName} &lt;{order.adminEmail}&gt;</Descriptions.Item>
                <Descriptions.Item label="Phone">{order.adminPhone || '—'}</Descriptions.Item>
                <Descriptions.Item label="State">{order.state}</Descriptions.Item>
                <Descriptions.Item label="Billing">{order.billingPeriod}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[order.orderStatus]}>{order.orderStatus}</Tag></Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" orientationMargin={0}>Order Items</Divider>
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-600">
                        <th className="text-left p-2">Component</th>
                        <th className="text-center p-2">Type</th>
                        <th className="text-right p-2">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items?.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                            <td className="p-2">{item.componentName}</td>
                            <td className="text-center p-2"><Tag>{item.pricingType}</Tag></td>
                            <td className="text-right p-2 font-medium">₹{item.lineTotal?.toLocaleString('en-IN')}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    {order.recurringTotal > 0 && (
                        <tr className="text-indigo-700">
                            <td className="p-2" colSpan={2}>Recurring Total</td>
                            <td className="text-right p-2 font-semibold">₹{order.recurringTotal?.toLocaleString('en-IN')}</td>
                        </tr>
                    )}
                    {order.oneTimeTotal > 0 && (
                        <tr className="text-purple-700">
                            <td className="p-2" colSpan={2}>One-Time Total</td>
                            <td className="text-right p-2 font-semibold">₹{order.oneTimeTotal?.toLocaleString('en-IN')}</td>
                        </tr>
                    )}
                    {order.serviceTotal > 0 && (
                        <tr className="text-orange-600">
                            <td className="p-2" colSpan={2}>Service Total</td>
                            <td className="text-right p-2 font-semibold">₹{order.serviceTotal?.toLocaleString('en-IN')}</td>
                        </tr>
                    )}
                    <tr className="bg-indigo-50 font-bold text-indigo-800">
                        <td className="p-2" colSpan={2}>Grand Total</td>
                        <td className="text-right p-2">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function PaymentTab({ order, paymentForm, onRecord, onConfirm, onReject, isPending }) {
    const [rejectReason, setRejectReason] = useState('');

    return (
        <div>
            {/* Existing Transactions */}
            {order.paymentTransactions?.length > 0 && (
                <>
                    <Title level={5}>Payment Transactions</Title>
                    {order.paymentTransactions.map(tx => (
                        <Card key={tx.id} size="small" className="mb-3 border-slate-200">
                            <Space className="w-full justify-between mb-1">
                                <Text strong>{tx.transactionReference}</Text>
                                <Tag color={PAYMENT_STATUS_COLORS[tx.status] || 'default'}>{tx.status}</Tag>
                            </Space>
                            <div className="text-sm text-slate-600">
                                <span>₹{tx.amount?.toLocaleString('en-IN')} via {tx.paymentMethod}</span>
                                <span className="ml-2 text-slate-400">· {new Date(tx.paymentDate).toLocaleDateString('en-IN')}</span>
                                <span className="ml-2 text-slate-400">by {tx.updatedByRole}</span>
                            </div>
                            {tx.status === 'Pending' && (
                                <Space className="mt-2">
                                    <Popconfirm title="Confirm this payment?" onConfirm={() => onConfirm(tx.id)}>
                                        <Button size="small" type="primary" icon={<CheckCircle size={12} />} className="bg-green-600">
                                            Confirm
                                        </Button>
                                    </Popconfirm>
                                    <Space.Compact>
                                        <Input
                                            placeholder="Rejection reason"
                                            size="small"
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                        />
                                        <Popconfirm title="Reject this payment?" onConfirm={() => onReject(tx.id, rejectReason)}>
                                            <Button size="small" danger icon={<XCircle size={12} />}>Reject</Button>
                                        </Popconfirm>
                                    </Space.Compact>
                                </Space>
                            )}
                            {tx.rejectionReason && (
                                <Alert message={tx.rejectionReason} type="error" className="mt-2" />
                            )}
                        </Card>
                    ))}
                    <Divider />
                </>
            )}

            {/* Record New Payment */}
            <Title level={5}>Record Payment</Title>
            <Form form={paymentForm} layout="vertical" size="middle" onFinish={onRecord}
                initialValues={{ paymentDate: dayjs(), amount: order.totalAmount }}>
                <Form.Item name="transactionReference" label="Transaction Ref / UTR" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Space className="w-full" size="middle">
                    <Form.Item name="paymentDate" label="Date" className="w-full" rules={[{ required: true }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item name="amount" label="Amount (₹)" className="w-full" rules={[{ required: true }]}>
                        <InputNumber className="w-full" min={0} precision={2} />
                    </Form.Item>
                </Space>
                <Form.Item name="paymentMethod" label="Method" rules={[{ required: true }]}>
                    <Select>
                        {['UPI', 'NEFT', 'IMPS', 'RTGS', 'Cheque', 'Other'].map(m => (
                            <Option key={m} value={m}>{m}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="bankOrUpiDetails" label="Bank / UPI Details">
                    <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={isPending} className="bg-indigo-600">
                    Record Payment
                </Button>
            </Form>
        </div>
    );
}

function ProvisioningTab({ order, form, onProvision, onComplete, isPending }) {
    const canProvision = order.orderStatus === 'PaymentConfirmed';
    const isProvisioning = order.orderStatus === 'Provisioning';
    const isProvisioned = order.orderStatus === 'Provisioned';

    return (
        <div>
            <Timeline className="mt-4"
                items={[
                    {
                        color: order.confirmedAt ? 'green' : 'gray',
                        children: `Payment Confirmed${order.confirmedAt ? ` — ${new Date(order.confirmedAt).toLocaleDateString('en-IN')}` : ' (pending)'}`
                    },
                    {
                        color: isProvisioning || isProvisioned ? 'green' : 'gray',
                        children: 'Provisioning Started'
                    },
                    {
                        color: isProvisioned ? 'green' : 'gray',
                        children: `Portal Provisioned${order.provisionedAt ? ` — ${new Date(order.provisionedAt).toLocaleDateString('en-IN')}` : ' (pending)'}`
                    },
                ]}
            />

            {canProvision && !isProvisioning && (
                <div className="mb-6">
                    <Popconfirm title="Mark this order as Provisioning?" onConfirm={onProvision}>
                        <Button icon={<Zap size={14} />} type="primary" className="bg-purple-600">
                            Start Provisioning
                        </Button>
                    </Popconfirm>
                    <div className="mt-2 text-xs text-slate-500">
                        This will update the status. Then:
                        <ol className="mt-1 ml-4 list-decimal">
                            <li>Add tenant to tenants.json</li>
                            <li>Push to main branch</li>
                            <li>Trigger provision-tenant.yml workflow</li>
                        </ol>
                    </div>
                </div>
            )}

            {(isProvisioning || canProvision) && !isProvisioned && (
                <>
                    <Divider orientation="left">Complete Provisioning</Divider>
                    <Form form={form} layout="vertical" onFinish={onComplete}>
                        <Form.Item name="connectionString" label="Tenant DB Connection String" rules={[{ required: true }]}>
                            <Input.TextArea rows={2} placeholder="Server=...;Database=...;User Id=...;Password=...;" />
                        </Form.Item>
                        <Form.Item name="portalUrl" label="Portal URL" rules={[{ required: true }]}>
                            <Input placeholder={`https://${order.tenantKey}.chitstack.com`} />
                        </Form.Item>
                        <Button
                            icon={<CheckCircle size={14} />}
                            type="primary"
                            htmlType="submit"
                            loading={isPending}
                            className="bg-green-600"
                        >
                            Mark as Provisioned & Send Welcome Email
                        </Button>
                    </Form>
                </>
            )}

            {isProvisioned && (
                <Alert
                    type="success"
                    message="Portal provisioned successfully!"
                    description={`Provisioned on ${new Date(order.provisionedAt).toLocaleDateString('en-IN')}. Welcome email sent.`}
                    showIcon
                />
            )}
        </div>
    );
}
