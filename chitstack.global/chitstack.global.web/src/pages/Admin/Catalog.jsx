import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Table, Typography, Button, Form, Input, Select, Switch,
    InputNumber, Tag, Space, Drawer, Popconfirm, message, Tooltip
} from 'antd';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CATEGORY_OPTIONS = ['Core', 'AddOn', 'Service'];
const PRICING_OPTIONS = ['Monthly', 'License', 'Hourly'];

const CATEGORY_COLORS = { Core: 'blue', AddOn: 'green', Service: 'orange' };
const PRICING_COLORS = { Monthly: 'cyan', License: 'purple', Hourly: 'gold' };

function PriceSummary({ comp }) {
    if (comp.pricingType === 'License') return <Tag color="purple">₹{comp.licensePrice?.toLocaleString('en-IN')} once</Tag>;
    if (comp.pricingType === 'Hourly') return <Tag color="gold">₹{comp.hourlyPrice?.toLocaleString('en-IN')}/hr</Tag>;
    return <Tag color="cyan">₹{comp.monthlyPrice?.toLocaleString('en-IN')}/mo</Tag>;
}

export default function Catalog() {
    const queryClient = useQueryClient();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    const [pricingType, setPricingType] = useState('Monthly');

    const { data: components = [], isLoading } = useQuery({
        queryKey: ['catalog-admin'],
        queryFn: async () => {
            const res = await api.get('/Catalog/admin/components');
            return res.data.data || [];
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (values) => {
            if (editing) {
                return api.put(`/Catalog/admin/components/${editing.id}`, values);
            }
            return api.post('/Catalog/admin/components', values);
        },
        onSuccess: () => {
            message.success(`Component ${editing ? 'updated' : 'created'}!`);
            queryClient.invalidateQueries({ queryKey: ['catalog-admin'] });
            setDrawerOpen(false);
            form.resetFields();
            setEditing(null);
        },
        onError: (err) => message.error(err.response?.data?.errors?.[0] || 'Save failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/Catalog/admin/components/${id}`),
        onSuccess: () => {
            message.success('Component deactivated');
            queryClient.invalidateQueries({ queryKey: ['catalog-admin'] });
        }
    });

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        setPricingType('Monthly');
        setDrawerOpen(true);
    };

    const openEdit = (record) => {
        setEditing(record);
        setPricingType(record.pricingType);
        form.setFieldsValue(record);
        setDrawerOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            saveMutation.mutate(values);
        } catch { }
    };

    const columns = [
        {
            title: 'Component',
            key: 'name',
            render: (_, r) => (
                <Space>
                    <div>
                        <div className="font-semibold">{r.name}</div>
                        {r.description && <div className="text-xs text-slate-500 max-w-xs truncate">{r.description}</div>}
                    </div>
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: v => <Tag color={CATEGORY_COLORS[v] || 'default'}>{v}</Tag>
        },
        {
            title: 'Pricing Type',
            dataIndex: 'pricingType',
            key: 'pricingType',
            render: v => <Tag color={PRICING_COLORS[v] || 'default'}>{v}</Tag>
        },
        {
            title: 'Price',
            key: 'price',
            render: (_, r) => <PriceSummary comp={r} />
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>
        },
        {
            title: 'Order',
            dataIndex: 'displayOrder',
            key: 'displayOrder',
            align: 'center'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button icon={<Edit2 size={14} />} size="small" onClick={() => openEdit(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Deactivate this component?"
                        onConfirm={() => deleteMutation.mutate(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Deactivate">
                            <Button icon={<Trash2 size={14} />} size="small" danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Space>
                    <Package size={24} className="text-indigo-600" />
                    <Title level={2} className="m-0">Product Catalog</Title>
                </Space>
                <Button type="primary" icon={<Plus size={16} />} onClick={openCreate} className="bg-indigo-600">
                    Add Component
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Table
                    dataSource={components}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={false}
                    rowClassName={r => !r.isActive ? 'opacity-50' : ''}
                />
            </Card>

            <Drawer
                title={editing ? 'Edit Component' : 'Add Component'}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditing(null); form.resetFields(); }}
                width={480}
                footer={
                    <Space className="w-full justify-end">
                        <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            className="bg-indigo-600"
                            onClick={handleSave}
                            loading={saveMutation.isPending}
                        >
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. WhatsApp Notifications" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={2} placeholder="Brief description shown on order form" />
                    </Form.Item>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select category">
                            {CATEGORY_OPTIONS.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="pricingType" label="Pricing Type" rules={[{ required: true }]}>
                        <Select placeholder="Select pricing type" onChange={v => setPricingType(v)}>
                            {PRICING_OPTIONS.map(p => <Option key={p} value={p}>{p}</Option>)}
                        </Select>
                    </Form.Item>

                    {/* Conditional price fields */}
                    {pricingType === 'Monthly' && (
                        <>
                            <Form.Item name="monthlyPrice" label="Monthly Price (₹)" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                            </Form.Item>
                            <Form.Item name="halfYearlyPrice" label="Half-Yearly Price (₹)" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                            </Form.Item>
                            <Form.Item name="annualPrice" label="Annual Price (₹)" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                            </Form.Item>
                        </>
                    )}
                    {pricingType === 'License' && (
                        <Form.Item name="licensePrice" label="License Price — One Time (₹)" rules={[{ required: true }]}>
                            <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                        </Form.Item>
                    )}
                    {pricingType === 'Hourly' && (
                        <Form.Item name="hourlyPrice" label="Hourly Rate (₹/hr)" rules={[{ required: true }]}>
                            <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                        </Form.Item>
                    )}

                    <Form.Item name="displayOrder" label="Display Order" initialValue={0}>
                        <InputNumber className="w-full" min={0} />
                    </Form.Item>
                    <Form.Item name="isMandatory" label="Mandatory" valuePropName="checked">
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
}
