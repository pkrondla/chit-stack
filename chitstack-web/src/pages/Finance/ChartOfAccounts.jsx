import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, App, Typography } from 'antd';
import { Plus, Edit2, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';

const ChartOfAccounts = () => {
    const { message } = App.useApp();
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

    const buildTree = (list, pid = null) => {
        return list
          .filter(a => (a.parentId === pid) || (pid === null && !a.parentId))
          .map(a => ({
            ...a,
            children: buildTree(list, a.id).length > 0 ? buildTree(list, a.id) : undefined
          }));
    };

    const treeData = buildTree(accounts);

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
        { 
            title: 'Account Name', 
            dataIndex: 'accountName', 
            key: 'name',
            render: (text, record) => (
                <Space>
                    <span className={record.isGroup ? "font-bold text-slate-800" : "text-blue-600"}>
                        {text} <small className="text-slate-400 font-normal">({record.accountCode})</small>
                    </span>
                    {record.isGroup && <Tag color="default" scale="small">GROUP</Tag>}
                </Space>
            )
        },
        { 
            title: 'Opening Balance', 
            dataIndex: 'openingBalance', 
            key: 'openingBalance', 
            align: 'right',
            render: (val, record) => !record.isGroup 
                    ? <span className="font-medium text-slate-600">{val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span> 
                    : <span className="text-slate-300 italic">Aggregate</span>
        },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag color={t === 'Asset' ? 'green' : t === 'Liability' ? 'red' : 'blue'}>{t?.toUpperCase()}</Tag> },
        { title: 'System Role', dataIndex: 'systemRole', key: 'role', render: (r) => r ? <Tag color="orange" size="small">{r}</Tag> : '-' },
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
        form.setFieldsValue({
            ...account,
            openingBalance: account.openingBalance || 0,
            parentId: account.parentId?.toString()
        });
        setIsModalOpen(true);
    };

    const treeSelectData = accounts
        .filter(a => a.isGroup)
        .map(a => ({
            title: `${a.accountName} (${a.accountCode})`,
            value: a.id.toString(),
            key: a.id,
            type: a.type
        }));

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <Typography.Title level={2} className="!mb-0">Chart of Accounts</Typography.Title>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingAccount(null); form.resetFields(); setIsModalOpen(true); }}>
                    Add Account
                </Button>
            </div>

            <Card className="shadow-sm rounded-xl">
                <Table 
                    columns={columns} 
                    dataSource={treeData} 
                    rowKey="id" 
                    loading={isLoading} 
                    pagination={false}
                    expandable={{ defaultExpandAllRows: true }}
                />
            </Card>

            <Modal
                title={editingAccount ? 'Edit Account' : 'New Account'}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                width={600}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={(v) => mutation.mutate({
                        ...v,
                        parentId: v.parentId ? parseInt(v.parentId) : null
                    })}
                    initialValues={{ isGroup: false }}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="isGroup" label="Is Group Account?" valuePropName="checked">
                            <Select>
                                <Select.Option value={true}>Yes (Aggregation Only)</Select.Option>
                                <Select.Option value={false}>No (Posting Account)</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="parentId" label="Parent Group" extra="Under which group? (Optional)">
                            <Select 
                                allowClear 
                                placeholder="-- Top Level --"
                                onChange={(val) => {
                                    if (val) {
                                        const parent = accounts.find(a => a.id === parseInt(val));
                                        if (parent) form.setFieldsValue({ type: parent.type });
                                    }
                                }}
                            >
                                {treeSelectData.map(d => (
                                    <Select.Option key={d.key} value={d.value}>{d.title}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Office Rent" />
                    </Form.Item>
                    <Form.Item name="accountCode" label="Account Code" rules={[{ required: true }]}>
                        <Input placeholder="e.g. EXP-RENT" />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item 
                            name="type" 
                            label="Account Type" 
                            rules={[{ required: true }]}
                            noStyle
                            shouldUpdate={(p, c) => p.parentId !== c.parentId}
                        >
                            {({ getFieldValue }) => (
                                <Form.Item name="type" label="Account Type" rules={[{ required: true }]}>
                                    <Select disabled={!!getFieldValue('parentId')}>
                                        <Select.Option value="Asset">Asset</Select.Option>
                                        <Select.Option value="Liability">Liability</Select.Option>
                                        <Select.Option value="Income">Income</Select.Option>
                                        <Select.Option value="Expense">Expense</Select.Option>
                                    </Select>
                                </Form.Item>
                            )}
                        </Form.Item>

                        <Form.Item 
                            noStyle
                            shouldUpdate={(p, c) => p.isGroup !== c.isGroup}
                        >
                            {({ getFieldValue }) => !getFieldValue('isGroup') ? (
                                <Form.Item name="openingBalance" label="Opening Balance" tooltip="Initial balance at start of history.">
                                    <Input type="number" placeholder="0.00" prefix="₹" />
                                </Form.Item>
                            ) : <div className="pt-8 text-xs text-slate-400 italic">Groups don't have direct balances.</div>}
                        </Form.Item>
                    </div>

                    <Form.Item name="systemRole" label="System Role Mapping" extra="Advanced: Map to system operation. Leave empty for custom ledgers.">
                        <Select allowClear>
                            <Select.Option value="MemberReceivable">Member Receivable</Select.Option>
                            <Select.Option value="CommissionIncome">Commission Income</Select.Option>
                            <Select.Option value="LateFeeIncome">Late Fee Income</Select.Option>
                            <Select.Option value="CgstLiability">CGST Liability</Select.Option>
                            <Select.Option value="SgstLiability">SGST Liability</Select.Option>
                            <Select.Option value="TdsLiability">TDS Liability</Select.Option>
                            <Select.Option value="PrizePayable">Prize Money Payable</Select.Option>
                            <Select.Option value="BounceChargeIncome">Bounce Charge Income</Select.Option>
                            <Select.Option value="Cash">Cash Account (Default)</Select.Option>
                            <Select.Option value="Bank">Bank Account (Default)</Select.Option>
                            <Select.Option value="RetainedEarnings">Retained Earnings</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(p, c) => p.type !== c.type}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('type') === 'Asset' ? (
                                <Form.Item name="bankDetails" label="Bank Details (A/c No, IFSC, etc.)">
                                    <Input.TextArea placeholder="Enter bank account details for this ledger" />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChartOfAccounts;
