import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Tag, Modal, Form, Input, InputNumber, Select, Alert, App, List, Divider } from 'antd';
import { IndianRupee, CheckCircle, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const Payouts = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

    const [form] = Form.useForm();
    const paymentMode = Form.useWatch('paymentMode', form) || 'Bank';

    // Guarantor specific state
    const [isGuarantorFormOpen, setIsGuarantorFormOpen] = useState(false);
    const [guarantorForm] = Form.useForm();

    const { data: auctions = [], isLoading } = useQuery({
        queryKey: ['payouts'],
        queryFn: async () => {
            const res = await api.get('/Auctions');
            return res.data.data || res.data;
        }
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const { data: guarantors = [], refetch: refetchGuarantors } = useQuery({
        queryKey: ['guarantors', selectedAuction?.winningTicketId],
        queryFn: async () => {
            if (!selectedAuction?.winningTicketId) return [];
            const res = await api.get(`/Guarantors/${selectedAuction.winningTicketId}`);
            return res.data.data || res.data;
        },
        enabled: !!selectedAuction?.winningTicketId
    });

    const payoutMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Finance/payout', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success("Payment Disbursed Successfully!");
            setIsPayoutModalOpen(false);
            setSelectedAuction(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
        },
        onError: (error) => {
            message.error("Payout Failed: " + (error.response?.data?.error || error.message));
        }
    });

    const guarantorMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Guarantors', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success("Guarantor Added Successfully");
            guarantorForm.resetFields();
            setIsGuarantorFormOpen(false);
            refetchGuarantors();
        },
        onError: (error) => {
            message.error(error.response?.data?.error || error.message);
        }
    });

    const handleDisburseSubmit = (values) => {
        payoutMutation.mutate({
            auctionId: selectedAuction.id,
            paymentMode: values.paymentMode,
            referenceNumber: values.referenceNumber || '',
            accountHeadId: values.accountHeadId
        });
    };

    const handleAddGuarantor = (values) => {
        guarantorMutation.mutate({
            ticketId: selectedAuction.winningTicketId,
            ...values,
            annualIncome: parseFloat(values.annualIncome) || 0
        });
    };

    const openPayoutModal = (auction) => {
        setSelectedAuction(auction);
        setIsPayoutModalOpen(true);
        form.setFieldsValue({ paymentMode: 'Bank' });
        setIsGuarantorFormOpen(false);
    };

    const pendingPayouts = auctions.filter(a => a.auctionStatus === 'Closed' && a.winningTicketId && !a.isPaid);
    const completedPayouts = auctions.filter(a => a.isPaid);

    if (isLoading) return <div className="p-12 text-center text-slate-500 text-lg">Loading Payouts...</div>;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800">Prize Money Payouts</Title>

            <div className="mb-12">
                <Title level={3} className="text-red-700 !mb-6 font-semibold border-b border-red-100 pb-2">Pending Disbursements</Title>

                {pendingPayouts.length === 0 ? (
                    <Card className="bg-slate-50 border border-slate-200 text-center py-8">
                        <Text className="text-slate-500 text-lg">No pending payouts at this time.</Text>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingPayouts.map(auction => (
                            <Card key={auction.id} className="shadow-sm border-0 border-l-4 border-l-red-500 rounded-xl hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Title level={4} className="!mb-1 text-slate-800">{auction.groupName}</Title>
                                        <Text className="text-slate-500 block text-sm mb-4">
                                            Auction Date: {new Date(auction.auctionDate).toLocaleDateString()} • Ticket ID: {auction.winningTicketId}
                                        </Text>
                                        <div className="bg-slate-50 px-4 py-2 rounded-lg inline-block">
                                            <Text className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Net Payable</Text>
                                            <Text className="text-slate-900 text-xl font-bold font-mono">
                                                ₹{auction.netPayableAmount?.toLocaleString()}
                                            </Text>
                                        </div>
                                    </div>
                                    <Button
                                        type="primary"
                                        onClick={() => openPayoutModal(auction)}
                                        className="bg-slate-900 font-bold h-10 shadow-sm"
                                        icon={<IndianRupee size={16} />}
                                    >
                                        Disburse
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <Title level={3} className="text-green-700 !mb-6 font-semibold border-b border-green-100 pb-2">Payment History</Title>

                {completedPayouts.length === 0 ? (
                    <Card className="bg-slate-50 border border-slate-200 text-center py-8">
                        <Text className="text-slate-500 text-lg">No disbursement history available.</Text>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedPayouts.map(auction => (
                            <div key={auction.id} className="bg-green-50 p-4 rounded-xl border border-green-200 flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="font-bold text-green-800 text-lg mb-1">{auction.groupName}</div>
                                    <div className="text-sm text-green-700 flex items-center gap-2">
                                        <span className="font-semibold bg-green-200 px-2 py-0.5 rounded text-xs">₹{auction.netPayableAmount?.toLocaleString()}</span>
                                        Paid on {new Date(auction.paymentDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center text-green-700 bg-white px-3 py-1 rounded-full shadow-sm font-bold border border-green-100">
                                    <CheckCircle size={18} className="mr-2" />
                                    Paid
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payout Modal */}
            <Modal
                title={<Title level={3} className="!mb-0">Confirm Payout</Title>}
                open={isPayoutModalOpen}
                onCancel={() => setIsPayoutModalOpen(false)}
                footer={null}
                width={600}
                destroyOnClose
                className="top-10"
            >
                {selectedAuction && (
                    <div className="mt-4">
                        <Alert
                            message={
                                <div className="text-base text-slate-700">
                                    Disbursing <strong className="text-lg">₹{selectedAuction.netPayableAmount?.toLocaleString()}</strong> for <strong>{selectedAuction.groupName}</strong>
                                </div>
                            }
                            type="info"
                            showIcon
                            className="bg-blue-50 border-blue-200 mb-6"
                        />

                        {/* Guarantors Section */}
                        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <Title level={5} className="!mb-0 flex items-center gap-2 text-slate-700">
                                    <ShieldAlert size={18} /> Security / Guarantors
                                </Title>
                                <Button
                                    type="link"
                                    onClick={() => setIsGuarantorFormOpen(!isGuarantorFormOpen)}
                                    className="font-semibold"
                                >
                                    {isGuarantorFormOpen ? 'Cancel' : '+ Add Guarantor'}
                                </Button>
                            </div>

                            {isGuarantorFormOpen && (
                                <Card className="mb-4 bg-white shadow-sm border-slate-200" bodyStyle={{ padding: '1rem' }}>
                                    <Form form={guarantorForm} layout="vertical" onFinish={handleAddGuarantor} size="middle">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Form.Item name="name" rules={[{ required: true }]} className="mb-3">
                                                <Input placeholder="Full Name" />
                                            </Form.Item>
                                            <Form.Item name="phoneNumber" rules={[{ required: true }]} className="mb-3">
                                                <Input placeholder="Phone Number" />
                                            </Form.Item>
                                            <Form.Item name="aadhaarNumber" className="mb-3">
                                                <Input placeholder="Aadhaar Number (Optional)" />
                                            </Form.Item>
                                            <Form.Item name="annualIncome" className="mb-3">
                                                <InputNumber className="w-full" placeholder="Annual Income" />
                                            </Form.Item>
                                        </div>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={guarantorMutation.isPending}
                                            className="bg-blue-600 font-semibold mt-2"
                                        >
                                            Save Guarantor
                                        </Button>
                                    </Form>
                                </Card>
                            )}

                            {guarantors.length === 0 ? (
                                <div className="text-sm text-slate-500 italic flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-slate-100">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    No guarantors added. Risk Check Recommended.
                                </div>
                            ) : (
                                <List
                                    size="small"
                                    dataSource={guarantors}
                                    renderItem={(g) => (
                                        <List.Item className="bg-white mb-2 rounded border border-slate-100 px-3">
                                            <Text strong className="text-slate-700">{g.name}</Text>
                                            <Text className="text-slate-500 text-xs ml-2">Ph: {g.phoneNumber}</Text>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </div>

                        {/* Payment Form */}
                        <Divider />
                        <Title level={5} className="!mb-4">Disbursement Details</Title>

                        <Form form={form} layout="vertical" onFinish={handleDisburseSubmit} initialValues={{ paymentMode: 'Bank' }}>
                            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
                                <Select size="large" onChange={() => form.setFieldValue('accountHeadId', undefined)}>
                                    <Select.Option value="Bank">Bank Transfer / NEFT</Select.Option>
                                    <Select.Option value="Cheque">Cheque</Select.Option>
                                    <Select.Option value="Cash">Cash</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-slate-700">{paymentMode === 'Cash' ? 'Cash Account' : 'Bank Account'}</span>}
                                name="accountHeadId"
                                rules={[{ required: true, message: 'Please select an account' }]}
                            >
                                <Select size="large" placeholder="Select Account">
                                    {accounts
                                        .filter(a => paymentMode === 'Cash' ? a.systemRole === 'Cash' : a.systemRole === 'Bank')
                                        .map(a => (
                                            <Select.Option key={a.id} value={a.id}>
                                                {a.accountName} ({a.accountCode})
                                            </Select.Option>
                                        ))
                                    }
                                </Select>
                            </Form.Item>

                            {paymentMode !== 'Cash' && (
                                <Form.Item name="referenceNumber" label="Reference No / Cheque No" rules={[{ required: true }]}>
                                    <Input size="large" />
                                </Form.Item>
                            )}

                            <div className="flex gap-4 mt-8">
                                <Button size="large" onClick={() => setIsPayoutModalOpen(false)} className="flex-1 font-semibold">
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    className="bg-slate-900 flex-1 font-bold shadow-md"
                                    loading={payoutMutation.isPending}
                                >
                                    Confirm Payment
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Payouts;
