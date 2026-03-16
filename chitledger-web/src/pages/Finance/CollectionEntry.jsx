import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, Select, InputNumber, App, Divider, Space } from 'antd';
import { Printer, CheckCircle, Calculator } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title, Text } = Typography;

const CollectionEntry = () => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // UI State
    const [duesInfo, setDuesInfo] = useState(null);
    const [lastReceiptId, setLastReceiptId] = useState(null);
    const [isCheckingDues, setIsCheckingDues] = useState(false);
    const paymentMode = Form.useWatch('paymentMode', form) || 'Cash';

    const calcMutation = useMutation({
        mutationFn: async () => await api.post('/Finance/calc-penalties'),
        onSuccess: () => message.success('Penalties Updated Successfully'),
        onError: () => message.error('Failed to calculate penalties')
    });

    const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const handleCheckDues = async () => {
        const ticketId = form.getFieldValue('ticketId');
        if (!ticketId) {
            message.warning("Please enter a Ticket ID");
            return;
        }
        setIsCheckingDues(true);
        try {
            const res = await api.get(`/Tickets/dues/${ticketId}`);
            setDuesInfo(res.data);
            form.setFieldsValue({ amount: res.data.totalDue });
        } catch (e) {
            message.error("Ticket not found or error fetching dues.");
            setDuesInfo(null);
        } finally {
            setIsCheckingDues(false);
        }
    };

    const paymentMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Finance/pay', payload);
            return res.data.data || res.data;
        },
        onSuccess: (data) => {
            message.success("Payment Recorded Successfully!");
            setLastReceiptId(data.data);
            form.resetFields(['amount', 'referenceNumber', 'accountHeadId']);
            setDuesInfo(null);
        },
        onError: (error) => {
            message.error("Payment Failed: " + (error.response?.data?.error || error.message));
        }
    });

    const handlePaymentSubmit = (values) => {
        paymentMutation.mutate({
            ticketId: parseInt(values.ticketId),
            amount: parseFloat(values.amount),
            paymentMode: values.paymentMode,
            referenceNumber: values.referenceNumber || '',
            accountHeadId: values.accountHeadId
        });
    };

    const handleReset = () => {
        setLastReceiptId(null);
        form.resetFields();
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">Collection Entry</Title>
                <Button
                    type="default"
                    icon={<Calculator size={16} />}
                    onClick={() => calcMutation.mutate()}
                    loading={calcMutation.isPending}
                    className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 font-semibold"
                >
                    Run Late Fee Calc
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <Card className="shadow-lg border-0 rounded-xl" styles={{ body: { padding: '2rem' } }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handlePaymentSubmit}
                        initialValues={{ paymentMode: 'Cash' }}
                    >
                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Ticket ID</span>}
                            required
                        >
                            <Space.Compact className="w-full">
                                <Form.Item
                                    name="ticketId"
                                    noStyle
                                    rules={[{ required: true, message: 'Ticket ID is required' }]}
                                >
                                    <Input size="large" placeholder="Enter Ticket ID" className="flex-1" />
                                </Form.Item>
                                <Button
                                    size="large"
                                    onClick={handleCheckDues}
                                    loading={isCheckingDues}
                                    className="bg-slate-100 font-semibold text-slate-700"
                                >
                                    Check Dues
                                </Button>
                            </Space.Compact>
                        </Form.Item>

                        {duesInfo && (
                            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                <Text strong className="text-orange-900 block mb-3 text-base">
                                    {duesInfo.memberName} ({duesInfo.groupName})
                                </Text>
                                <div className="flex justify-between text-sm mb-1 text-slate-600">
                                    <span>Principal:</span>
                                    <span>₹{duesInfo.pendingPrincipal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-3 font-semibold text-red-600">
                                    <span>Penalty:</span>
                                    <span>₹{duesInfo.pendingPenalty.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-orange-200 border-dashed font-bold text-base text-slate-800">
                                    <span>Total Due:</span>
                                    <span>₹{duesInfo.totalDue.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Amount Received</span>}
                            name="amount"
                            rules={[{ required: true, message: 'Amount is required' }]}
                        >
                            <InputNumber
                                className="w-full text-lg"
                                size="large"
                                placeholder="0.00"
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\₹\s?|(,*)/g, '')}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Payment Mode</span>}
                            name="paymentMode"
                            rules={[{ required: true }]}
                        >
                            <Select size="large" onChange={() => form.setFieldValue('accountHeadId', undefined)}>
                                <Select.Option value="Cash">Cash</Select.Option>
                                <Select.Option value="Bank">Bank Transfer / NEFT</Select.Option>
                                <Select.Option value="UPI">UPI</Select.Option>
                                <Select.Option value="Cheque">Cheque</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">{(paymentMode === 'Cash' || paymentMode === 'UPI') ? 'Deposit To (Cash/PhonePe)' : 'Deposit To (Bank Account)'}</span>}
                            name="accountHeadId"
                            rules={[{ required: true, message: 'Please select where money is deposited' }]}
                        >
                            <Select size="large" placeholder="Select Account" loading={isLoadingAccounts}>
                                {accounts
                                    .filter(a => (paymentMode === 'Cash' || paymentMode === 'UPI') ? a.systemRole === 'Cash' : a.systemRole === 'Bank')
                                    .map(a => (
                                        <Select.Option key={a.id} value={a.id}>
                                            {a.accountName} ({a.accountCode})
                                        </Select.Option>
                                    ))
                                }
                            </Select>
                        </Form.Item>

                        {paymentMode !== 'Cash' && (
                            <Form.Item
                                label={<span className="font-semibold text-slate-700">Reference / Cheque No</span>}
                                name="referenceNumber"
                                rules={[{ required: true, message: 'Reference number is required for non-cash payments' }]}
                            >
                                <Input size="large" placeholder="Enter reference number" />
                            </Form.Item>
                        )}

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            className="bg-slate-900 h-12 text-lg font-bold mt-4 shadow-md"
                            loading={paymentMutation.isPending}
                        >
                            Record Payment
                        </Button>
                    </Form>
                </Card>

                {/* Receipt Preview Section */}
                <div>
                    {lastReceiptId ? (
                        <Card className="bg-green-50 border border-green-200 text-center rounded-xl shadow-sm" styles={{ body: { padding: '3rem 2rem' } }}>
                            <CheckCircle size={64} className="text-green-700 mx-auto mb-4" />
                            <Title level={3} className="text-green-800 !mb-2">Payment Successful</Title>
                            <Text className="text-green-700 block mb-8 text-base">Receipt #{lastReceiptId} generated.</Text>

                            <Button
                                type="primary"
                                size="large"
                                icon={<Printer size={18} />}
                                onClick={() => downloadFile(`/forms/receipt/${lastReceiptId}`, `Receipt_${lastReceiptId}.pdf`)}
                                className="bg-green-700 border-none hover:bg-green-800 mb-6 px-8 shadow-md"
                            >
                                Print Receipt
                            </Button>

                            <div>
                                <Button type="link" onClick={handleReset} className="text-green-800 underline hover:text-green-600 font-semibold">
                                    Make Another Entry
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-slate-50 border border-slate-200 text-center rounded-xl h-full flex items-center justify-center flex-col min-h-[400px]">
                            <Printer size={64} className="text-slate-300 mb-6" />
                            <Text className="text-slate-500 text-lg">Receipt download will appear here<br />after payment is recorded.</Text>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionEntry;
