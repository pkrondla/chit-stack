import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Select, Button, Typography, DatePicker, InputNumber, Divider, App, Alert } from 'antd';
import { Save, Plus, Trash2, Receipt } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const VoucherEntry = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const entryType = Form.useWatch('entryType', form);

    const { activeBranch, authorizedBranches: branches } = useAuthStore();

    const { data: accounts = [], isLoading: isAccountsLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const filteredDebitAccounts = useMemo(() => {
        if (!accounts.length) return [];
        switch (entryType) {
            case 'Payment':
                return accounts.filter(a => a.type === 'Expense' || (a.type === 'Asset' && a.systemRole !== 'Cash' && a.systemRole !== 'Bank'));
            case 'Receipt':
            case 'Contra':
                return accounts.filter(a => a.systemRole === 'Cash' || a.systemRole === 'Bank');
            default:
                return accounts;
        }
    }, [accounts, entryType]);

    const filteredCreditAccounts = useMemo(() => {
        if (!accounts.length) return [];
        switch (entryType) {
            case 'Payment':
            case 'Contra':
                return accounts.filter(a => a.systemRole === 'Cash' || a.systemRole === 'Bank');
            case 'Receipt':
                return accounts.filter(a => a.type === 'Income' || a.type === 'Liability' || (a.type === 'Asset' && a.systemRole !== 'Cash' && a.systemRole !== 'Bank'));
            default:
                return accounts;
        }
    }, [accounts, entryType]);

    const mutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                entryDate: values.entryDate.toISOString(),
                entryType: values.entryType,
                description: values.description,
                branchId: values.branchId,
                lines: [
                    {
                        accountCode: values.debitAccountCode,
                        debit: values.amount,
                        credit: 0
                    },
                    {
                        accountCode: values.creditAccountCode,
                        debit: 0,
                        credit: values.amount
                    }
                ]
            };
            return api.post('/Finance/journal', payload);
        },
        onSuccess: () => {
            message.success('Journal Entry posted successfully!');
            form.resetFields();
            form.setFieldsValue({
                entryDate: dayjs(),
                entryType: 'General',
                branchId: activeBranch?.id
            });
            queryClient.invalidateQueries(['daybook', 'ledger']);
        },
        onError: (err) => {
            message.error(err.response?.data?.error || 'Failed to post entry');
        }
    });

    const handleTypeChange = () => {
        form.setFieldsValue({ debitAccountCode: undefined, creditAccountCode: undefined });
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-3 mb-6">
                <Receipt size={28} className="text-slate-700" />
                <div>
                    <Title level={2} className="!mb-0 text-slate-800">Voucher Entry</Title>
                    <Text className="text-slate-500">Post manual payment, receipt, or adjustment journals.</Text>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={mutation.mutate}
                initialValues={{
                    entryDate: dayjs(),
                    entryType: 'General',
                    branchId: activeBranch?.id
                }}
            >
                <Card className="shadow-sm rounded-xl mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Form.Item name="entryDate" label="Voucher Date" rules={[{ required: true }]}>
                            <DatePicker className="w-full" format="DD-MMM-YYYY" />
                        </Form.Item>

                        <Form.Item name="entryType" label="Voucher Type" rules={[{ required: true }]}>
                            <Select onChange={handleTypeChange}>
                                <Select.Option value="Payment">Payment</Select.Option>
                                <Select.Option value="Receipt">Receipt</Select.Option>
                                <Select.Option value="Contra">Contra</Select.Option>
                                <Select.Option value="General">General/Journal</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="branchId" label="Branch">
                            <Select placeholder="Select Branch" allowClear>
                                {branches.map(b => (
                                    <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <Form.Item
                            name="debitAccountCode"
                            label="Debit Account (Receiving)"
                            rules={[{ required: true, message: 'Please select debit account' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select Debit Account"
                                optionFilterProp="children"
                                loading={isAccountsLoading}
                            >
                                {filteredDebitAccounts.map(acc => (
                                    <Select.Option key={acc.accountCode} value={acc.accountCode}>
                                        {acc.accountName} <span className="text-slate-400 text-xs">({acc.type})</span>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="creditAccountCode"
                            label="Credit Account (Giving)"
                            rules={[{ required: true, message: 'Please select credit account' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select Credit Account"
                                optionFilterProp="children"
                                loading={isAccountsLoading}
                            >
                                {filteredCreditAccounts.map(acc => (
                                    <Select.Option key={acc.accountCode} value={acc.accountCode}>
                                        {acc.accountName} <span className="text-slate-400 text-xs">({acc.type})</span>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="amount"
                            label="Amount"
                            rules={[{ required: true, message: 'Please enter amount' }]}
                        >
                            <InputNumber
                                placeholder="Enter Amount"
                                className="w-full"
                                min={1}
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/₹\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item name="description" label="Narration / Description" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Enter transaction details..." />
                    </Form.Item>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button size="large" onClick={() => form.resetFields()}>Discard</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<Save size={18} />}
                        loading={mutation.isPending}
                        className="bg-slate-900 border-none px-8 font-semibold shadow-lg"
                    >
                        Post Voucher
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default VoucherEntry;
