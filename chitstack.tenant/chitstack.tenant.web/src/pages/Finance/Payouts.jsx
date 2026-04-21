import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Tag, Modal, Form, Input, InputNumber, Select, Alert, App, List, Divider, DatePicker, Space, Table } from 'antd';
import { IndianRupee, CheckCircle, ShieldAlert, Plus, User, Search, Eye, FileText, Filter, RotateCcw } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Payouts = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [form] = Form.useForm();
    const paymentMode = Form.useWatch('paymentMode', form) || 'Bank';

    // Guarantor specific state
    const [isGuarantorFormOpen, setIsGuarantorFormOpen] = useState(false);
    const [guarantorForm] = Form.useForm();

    const [filters, setFilters] = useState({
        chitGroupId: null,
        memberId: null,
        fromDate: null,
        toDate: null
    });

    const { data: auctions = [], isLoading } = useQuery({
        queryKey: ['payouts', filters],
        queryFn: async () => {
            const params = {
                chitGroupId: filters.chitGroupId,
                memberId: filters.memberId,
                fromDate: filters.fromDate ? filters.fromDate.format('YYYY-MM-DD') : null,
                toDate: filters.toDate ? filters.toDate.format('YYYY-MM-DD') : null
            };
            const res = await api.get('/Auctions', { params });
            return res.data.data || res.data;
        }
    });

    const { data: groups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data.data || res.data;
        }
    });

    const { data: members = [] } = useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await api.get('/Members');
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
        setIsViewModalOpen(false);
        form.setFieldsValue({ paymentMode: 'Bank' });
        setIsGuarantorFormOpen(false);
    };

    const openViewModal = (auction) => {
        setSelectedAuction(auction);
        setIsViewModalOpen(true);
        setIsPayoutModalOpen(false);
    };

    const handleReset = () => {
        setFilters({
            chitGroupId: null,
            memberId: null,
            fromDate: null,
            toDate: null
        });
    };

    const pendingPayouts = auctions.filter(a => a.auctionStatus === 'Closed' && a.winningTicketId && !a.isPaid);
    const completedPayouts = auctions.filter(a => a.isPaid);

    const historyColumns = [
        {
            title: 'Chit Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <Text strong className="text-slate-800">{text}</Text>
        },
        {
            title: 'Winner',
            key: 'winner',
            render: (_, record) => (
                <div>
                    <div className="font-semibold text-slate-700">{record.winnerName}</div>
                    <div className="text-xs text-slate-500">Ticket #{record.winningTicketNumber}</div>
                </div>
            )
        },
        {
            title: 'Payout Amount',
            dataIndex: 'netPayableAmount',
            key: 'netPayableAmount',
            render: (val) => <span className="font-mono text-slate-900 font-bold">₹{val?.toLocaleString()}</span>
        },
        {
            title: 'Payment Date',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (date) => <Text className="text-slate-600">{date ? dayjs(date).format('DD MMM YYYY') : 'N/A'}</Text>,
            sorter: (a, b) => dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix()
        },
        {
            title: 'Status',
            key: 'status',
            render: () => (
                <Tag color="success" className="rounded-full px-4 border-0 font-bold m-0 inline-flex items-center">
                    <CheckCircle size={14} className="mr-1.5" /> PAID
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<Eye size={18} className="text-slate-500" />}
                    onClick={() => openViewModal(record)}
                    className="hover:bg-indigo-50"
                />
            )
        }
    ];

    if (isLoading) return <div className="p-12 text-center text-slate-500 text-lg">Loading Payouts...</div>;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">Prize Money Payouts</Title>
            </div>

            {/* Filters Bar */}
            <Card className="mb-8 shadow-sm border-0 rounded-xl bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-1">
                        <Text className="text-slate-500 text-xs font-bold uppercase block mb-2 px-1">Chit Group</Text>
                        <Select
                            className="w-full"
                            placeholder="All Groups"
                            size="large"
                            allowClear
                            value={filters.chitGroupId}
                            onChange={(val) => setFilters({ ...filters, chitGroupId: val })}
                            options={groups.map(g => ({ label: g.groupName, value: g.id }))}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Text className="text-slate-500 text-xs font-bold uppercase block mb-2 px-1">Member</Text>
                        <Select
                            className="w-full"
                            placeholder="All Members"
                            size="large"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={filters.memberId}
                            onChange={(val) => setFilters({ ...filters, memberId: val })}
                            options={members.map(m => ({ label: m.fullName, value: m.id }))}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Text className="text-slate-500 text-xs font-bold uppercase block mb-2 px-1">From Date</Text>
                        <DatePicker
                            className="w-full"
                            size="large"
                            placeholder="Start Date"
                            value={filters.fromDate}
                            onChange={(date) => setFilters({ ...filters, fromDate: date })}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Text className="text-slate-500 text-xs font-bold uppercase block mb-2 px-1">To Date</Text>
                        <DatePicker
                            className="w-full"
                            size="large"
                            placeholder="End Date"
                            value={filters.toDate}
                            onChange={(date) => setFilters({ ...filters, toDate: date })}
                        />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        <Button
                            className="w-full h-10 font-semibold"
                            icon={<RotateCcw size={16} />}
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="mb-12">
                <Title level={3} className="text-red-700 !mb-6 font-semibold border-b border-red-100 pb-2 flex items-center gap-3">
                    <span className="bg-red-100 w-2 h-8 rounded-full"></span>
                    Pending Disbursements
                </Title>

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
                <Title level={3} className="text-green-700 !mb-6 font-semibold border-b border-green-100 pb-2 flex items-center gap-3">
                    <span className="bg-green-100 w-2 h-8 rounded-full"></span>
                    Payment History
                </Title>

                <Card className="shadow-sm border-0 rounded-xl overflow-hidden p-0" styles={{ body: { padding: 0 } }}>
                    <Table
                        columns={historyColumns}
                        dataSource={completedPayouts}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payments`
                        }}
                        locale={{ emptyText: <div className="py-12 text-slate-400">No payout history found matching filters.</div> }}
                        className="payout-history-table cursor-pointer"
                        onRow={(record) => ({
                            onClick: () => openViewModal(record),
                        })}
                    />
                </Card>
            </div>

            {/* View Payout Modal */}
            <Modal
                title={<Title level={3} className="!mb-0">Payout Details</Title>}
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsViewModalOpen(false)} className="bg-slate-900 font-bold px-8">
                        Close
                    </Button>
                ]}
                width={600}
                destroyOnClose
                className="top-10"
            >
                {selectedAuction && (
                    <div className="mt-4">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Title level={4} className="!mb-1 text-slate-800">{selectedAuction.groupName}</Title>
                                    <Text className="text-slate-500">Installment #{selectedAuction.installmentNumber}</Text>
                                </div>
                                <div className="text-right">
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Total Paid</Text>
                                    <Title level={3} className="!mt-0 !mb-0 text-slate-900 font-mono">₹{selectedAuction.netPayableAmount?.toLocaleString()}</Title>
                                </div>
                            </div>

                            <Divider className="my-4 opacity-50" />

                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Beneficiary</Text>
                                    <Text strong className="text-slate-700">{selectedAuction.winnerName}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Payment Date</Text>
                                    <Text strong className="text-slate-700">{dayjs(selectedAuction.paymentDate).format('DD MMMM YYYY')}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Disbursement Mode</Text>
                                    <Tag color="blue" className="rounded-full px-3 border-0 font-bold m-0">{selectedAuction.paymentMode}</Tag>
                                </div>
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Reference No</Text>
                                    <Text strong className="text-slate-700 font-mono">{selectedAuction.paymentReference || 'N/A'}</Text>
                                </div>
                            </div>
                        </div>

                        {/* Guarantors Section - Reused Logic */}
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <Title level={5} className="!mb-4 flex items-center gap-2 text-slate-700">
                                <ShieldAlert size={18} /> Security & Guarantors
                            </Title>

                            {guarantors.length === 0 ? (
                                <div className="text-sm text-slate-500 italic bg-white px-4 py-3 rounded-lg border border-slate-100">
                                    No guarantor records found for this disbursement.
                                </div>
                            ) : (
                                <List
                                    size="small"
                                    dataSource={guarantors}
                                    renderItem={(g) => (
                                        <List.Item className="bg-white mb-2 rounded border border-slate-100 px-3 flex justify-between">
                                            <div>
                                                <Text strong className="text-slate-700 block">{g.name}</Text>
                                                <Text className="text-slate-500 text-xs">Phone: {g.phoneNumber}</Text>
                                            </div>
                                            {g.aadhaarNumber && (
                                                <div className="text-right">
                                                    <Text className="text-slate-400 text-[10px] block uppercase">Aadhaar</Text>
                                                    <Text className="text-slate-600 text-xs font-mono">{g.aadhaarNumber}</Text>
                                                </div>
                                            )}
                                        </List.Item>
                                    )}
                                />
                            )}
                        </div>
                    </div>
                )}
            </Modal>

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

            {/* View Payout Modal */}
            <Modal
                title={<Title level={3} className="!mb-0">Payout Details</Title>}
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsViewModalOpen(false)} className="bg-slate-900 font-bold px-8">
                        Close
                    </Button>
                ]}
                width={600}
                destroyOnClose
                className="top-10"
            >
                {selectedAuction && (
                    <div className="mt-4">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Title level={4} className="!mb-1 text-slate-800">{selectedAuction.groupName}</Title>
                                    <Text className="text-slate-500">Installment #{selectedAuction.installmentNumber}</Text>
                                </div>
                                <div className="text-right">
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Total Paid</Text>
                                    <Title level={3} className="!mt-0 !mb-0 text-slate-900 font-mono">₹{selectedAuction.netPayableAmount?.toLocaleString()}</Title>
                                </div>
                            </div>

                            <Divider className="my-4 opacity-50" />

                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Beneficiary</Text>
                                    <Text strong className="text-slate-700">{selectedAuction.winnerName}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Payment Date</Text>
                                    <Text strong className="text-slate-700">{dayjs(selectedAuction.paymentDate).format('DD MMMM YYYY')}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Disbursement Mode</Text>
                                    <Tag color="blue" className="rounded-full px-3 border-0 font-bold m-0">{selectedAuction.paymentMode}</Tag>
                                </div>
                                <div>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Reference No</Text>
                                    <Text strong className="text-slate-700 font-mono">{selectedAuction.paymentReference || 'N/A'}</Text>
                                </div>
                            </div>
                        </div>

                        {/* Guarantors Section */}
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <Title level={5} className="!mb-4 flex items-center gap-2 text-slate-700">
                                <ShieldAlert size={18} /> Security & Guarantors
                            </Title>

                            {guarantors.length === 0 ? (
                                <div className="text-sm text-slate-500 italic bg-white px-4 py-3 rounded-lg border border-slate-100">
                                    No guarantor records found for this disbursement.
                                </div>
                            ) : (
                                <List
                                    size="small"
                                    dataSource={guarantors}
                                    renderItem={(g) => (
                                        <List.Item className="bg-white mb-2 rounded border border-slate-100 px-3 flex justify-between">
                                            <div>
                                                <Text strong className="text-slate-700 block">{g.name}</Text>
                                                <Text className="text-slate-500 text-xs">Phone: {g.phoneNumber}</Text>
                                            </div>
                                            {g.aadhaarNumber && (
                                                <div className="text-right">
                                                    <Text className="text-slate-400 text-[10px] block uppercase">Aadhaar</Text>
                                                    <Text className="text-slate-600 text-xs font-mono">{g.aadhaarNumber}</Text>
                                                </div>
                                            )}
                                        </List.Item>
                                    )}
                                />
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Payouts;
