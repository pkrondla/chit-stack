import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message } from 'antd';
import { Plus, Edit2, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';

const ChartOfAccounts = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [form] = Form.useForm();

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (values) => {
            if (editingAccount) {
                return api.put(`/Reporting/accounts/${editingAccount.id}`, values);
            }
            return api.post('/Reporting/accounts', values);
        },
        onSuccess: () => {
            message.success(`Account ${editingAccount ? 'updated' : 'created'} successfully`);
            setIsModalOpen(false);
            queryClient.invalidateQueries(['accounts']);
        }
    });

    const columns = [
        { title: 'Code', dataIndex: 'accountCode', key: 'code' },
        { title: 'Account Name', dataIndex: 'accountName', key: 'name' },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag color="geekblue">{t.toUpperCase()}</Tag> },
        { title: 'System', dataIndex: 'isSystem', key: 'system', render: (s) => s ? <ShieldCheck size={16} className="text-slate-400" /> : null },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<Edit2 size={16} />} onClick={() => handleEdit(record)} />
                </Space>
            ),
        },
    ];

    const handleEdit = (account) => {
        setEditingAccount(account);
        form.setFieldsValue(account);
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <Typography.Title level={2} className="!mb-0">Chart of Accounts</Typography.Title>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingAccount(null); form.resetFields(); setIsModalOpen(true); }}>
                    Add Account
                </Button>
            </div>

            <Card className="shadow-sm rounded-xl">
                <Table columns={columns} dataSource={accounts} rowKey="id" loading={isLoading} />
            </Card>

            <Modal
                title={editingAccount ? 'Edit Account' : 'New Account'}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
                    <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Office Rent" />
                    </Form.Item>
                    <Form.Item name="accountCode" label="Account Code" rules={[{ required: true }]}>
                        <Input placeholder="e.g. EXP-RENT" />
                    </Form.Item>
                    <Form.Item name="type" label="Account Type" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="Asset">Asset</Select.Option>
                            <Select.Option value="Liability">Liability</Select.Option>
                            <Select.Option value="Income">Income</Select.Option>
                            <Select.Option value="Expense">Expense</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChartOfAccounts;
