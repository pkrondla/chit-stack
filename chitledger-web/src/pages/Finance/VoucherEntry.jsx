import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Select, Button, Space, Typography, DatePicker, InputNumber, Divider, message, Alert } from 'antd';
import { Save, Plus, Trash2, Receipt, CreditCard, ArrowLeftRight } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const VoucherEntry = () => {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const { data: accounts = [], isLoading: isAccountsLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await api.get('/Reporting/branches');
            return res.data.data || res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                entryDate: values.entryDate.toISOString(),
                entryType: values.entryType,
                description: values.description,
                branchId: values.branchId,
                lines: values.lines.map(line => ({
                    accountCode: line.accountCode,
                    debit: line.debit || 0,
                    credit: line.credit || 0
                }))
            };
            return api.post('/Finance/journal', payload);
        },
        onSuccess: () => {
            message.success('Journal Entry posted successfully!');
            form.resetFields();
            form.setFieldsValue({
                entryDate: dayjs(),
                entryType: 'General',
                lines: [{}, {}]
            });
            queryClient.invalidateQueries(['daybook', 'ledger']);
        },
        onError: (err) => {
            message.error(err.response?.data?.error || 'Failed to post entry');
        }
    });

    const [totals, setTotals] = useState({ debit: 0, credit: 0 });

    const handleValuesChange = (_, allValues) => {
        const debit = allValues.lines?.reduce((sum, line) => sum + (line?.debit || 0), 0) || 0;
        const credit = allValues.lines?.reduce((sum, line) => sum + (line?.credit || 0), 0) || 0;
        setTotals({ debit, credit });
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
                onValuesChange={handleValuesChange}
                initialValues={{
                    entryDate: dayjs(),
                    entryType: 'General',
                    lines: [{}, {}]
                }}
            >
                <Card className="shadow-sm rounded-xl mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Form.Item name="entryDate" label="Voucher Date" rules={[{ required: true }]}>
                            <DatePicker className="w-full" format="DD-MMM-YYYY" />
                        </Form.Item>

                        <Form.Item name="entryType" label="Voucher Type" rules={[{ required: true }]}>
                            <Select>
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

                    <Form.Item name="description" label="Narration / Description" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Enter transaction details..." />
                    </Form.Item>
                </Card>

                <Card className="shadow-sm rounded-xl mb-6" title="Journal Details">
                    <Form.List name="lines">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} className="flex flex-col md:flex-row gap-4 items-start mb-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                        <div className="flex-1 w-full">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'accountCode']}
                                                rules={[{ required: true, message: 'Required' }]}
                                                className="!mb-0"
                                            >
                                                <Select
                                                    showSearch
                                                    placeholder="Select Account"
                                                    optionFilterProp="children"
                                                    loading={isAccountsLoading}
                                                >
                                                    {accounts.map(acc => (
                                                        <Select.Option key={acc.accountCode} value={acc.accountCode}>
                                                            {acc.accountCode} - {acc.accountName}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </div>

                                        <div className="flex gap-4 w-full md:w-auto">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'debit']}
                                                className="!mb-0 w-32"
                                            >
                                                <InputNumber
                                                    placeholder="Debit"
                                                    className="w-full"
                                                    min={0}
                                                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'credit']}
                                                className="!mb-0 w-32"
                                            >
                                                <InputNumber
                                                    placeholder="Credit"
                                                    className="w-full"
                                                    min={0}
                                                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                                />
                                            </Form.Item>

                                            {fields.length > 2 && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<Trash2 size={16} />}
                                                    onClick={() => remove(name)}
                                                    className="mt-1"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<Plus size={16} />}
                                    className="mt-4"
                                >
                                    Add Line
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Divider className="my-6" />

                    <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="mb-4 md:mb-0">
                            {totals.debit !== totals.credit ? (
                                <Alert
                                    message="Mismatch"
                                    description={`Debit and Credit must match. Difference: ₹${Math.abs(totals.debit - totals.credit).toLocaleString()}`}
                                    type="error"
                                    showIcon
                                    className="rounded-lg"
                                />
                            ) : totals.debit > 0 ? (
                                <Alert
                                    message="Balanced"
                                    type="success"
                                    showIcon
                                    className="rounded-lg py-2"
                                />
                            ) : null}
                        </div>

                        <div className="flex gap-8 text-right">
                            <div className="flex flex-col">
                                <Text className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Total Debit</Text>
                                <Title level={4} className="!mb-0 text-slate-700">₹{totals.debit.toLocaleString()}</Title>
                            </div>
                            <div className="flex flex-col">
                                <Text className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Total Credit</Text>
                                <Title level={4} className="!mb-0 text-slate-700">₹{totals.credit.toLocaleString()}</Title>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button size="large" onClick={() => form.resetFields()}>Discard</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<Save size={18} />}
                        loading={mutation.isPending}
                        disabled={totals.debit === 0 || totals.debit !== totals.credit}
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
