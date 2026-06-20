import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card, Form, Input, DatePicker, InputNumber, Select, Button,
    Typography, Alert, Spin, Tag, Space, Divider, Result
} from 'antd';
import { CreditCard, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const STATUS_COLORS = {
    Submitted: 'blue',
    PaymentPending: 'orange',
    PaymentConfirmed: 'green',
    Provisioning: 'purple',
    Provisioned: 'success',
    Cancelled: 'red',
};

export default function PaymentEntry() {
    const { orderRef } = useParams();
    const [form] = Form.useForm();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!orderRef) return;
        api.get(`/Orders/${orderRef}`)
            .then(r => setOrder(r.data.data))
            .catch(() => setError('Order not found. Please check your order reference.'))
            .finally(() => setLoading(false));
    }, [orderRef]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        setError('');
        try {
            await api.patch(`/Orders/${orderRef}/payment`, {
                transactionReference: values.transactionReference,
                paymentDate: values.paymentDate.toISOString(),
                amount: values.amount,
                paymentMethod: values.paymentMethod,
                bankOrUpiDetails: values.bankOrUpiDetails,
                updatedBy: values.updatedBy || 'User',
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.errors?.[0] || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Spin size="large" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center">
            <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                    <div className="mx-auto bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                        <CreditCard size={28} />
                    </div>
                    <Title level={2} className="m-0 text-white">Submit Payment Details</Title>
                    <Text className="text-slate-400">Order: {orderRef}</Text>
                </div>

                <Card className="shadow-2xl rounded-2xl border-0">
                    {error && <Alert message={error} type="error" showIcon className="mb-4" />}

                    {/* Order Summary */}
                    {order && !submitted && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <Space className="w-full justify-between mb-2">
                                <Text strong>{order.companyName}</Text>
                                <Tag color={STATUS_COLORS[order.orderStatus] || 'default'}>
                                    {order.orderStatus}
                                </Tag>
                            </Space>
                            <div className="text-sm text-slate-600">
                                <span>Amount Due: </span>
                                <span className="font-semibold text-indigo-700 text-base">
                                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            {order.paymentTransactions?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                    <Text type="secondary" className="text-xs">
                                        Previously submitted transactions: {order.paymentTransactions.length}
                                    </Text>
                                </div>
                            )}
                        </div>
                    )}

                    {submitted ? (
                        <Result
                            status="success"
                            title="Payment Details Submitted"
                            subTitle="Our team will verify and confirm your payment within 1 business day. You will receive an email confirmation."
                            extra={
                                <div className="text-sm text-slate-500">
                                    Order Reference: <strong>{orderRef}</strong>
                                </div>
                            }
                        />
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            size="large"
                            onFinish={handleSubmit}
                            initialValues={{ paymentDate: dayjs(), amount: order?.totalAmount }}
                        >
                            <Form.Item
                                name="transactionReference"
                                label="Transaction Reference / UTR Number"
                                rules={[{ required: true, message: 'Please enter the transaction reference' }]}
                            >
                                <Input placeholder="e.g. 123456789012 or UPI ref" />
                            </Form.Item>

                            <Form.Item
                                name="paymentDate"
                                label="Payment Date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>

                            <Form.Item
                                name="amount"
                                label="Amount Paid (₹)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber className="w-full" min={1} precision={2}
                                    formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={v => v.replace(/₹\s?|(,*)/g, '')} />
                            </Form.Item>

                            <Form.Item
                                name="paymentMethod"
                                label="Payment Method"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Select payment method">
                                    <Option value="UPI">UPI</Option>
                                    <Option value="NEFT">NEFT</Option>
                                    <Option value="IMPS">IMPS</Option>
                                    <Option value="RTGS">RTGS</Option>
                                    <Option value="Cheque">Cheque</Option>
                                    <Option value="Other">Other</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="bankOrUpiDetails"
                                label="Your Bank / UPI Details (optional)"
                            >
                                <Input placeholder="UPI ID or bank account you paid from" />
                            </Form.Item>

                            <Form.Item
                                name="updatedBy"
                                label="Your Email"
                                rules={[{ type: 'email' }]}
                            >
                                <Input placeholder="your@email.com" />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                className="w-full bg-indigo-600"
                                size="large"
                                icon={<CheckCircle size={18} />}
                            >
                                Submit Payment Details
                            </Button>
                        </Form>
                    )}
                </Card>

                <Paragraph className="text-center text-slate-500 text-xs mt-4">
                    Questions? Email us at support@chitstack.com
                </Paragraph>
            </div>
        </div>
    );
}
