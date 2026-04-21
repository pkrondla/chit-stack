import { useState } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, Select, InputNumber, App, Divider, Space, Tabs, Table, Tag, Alert } from 'antd';
import { Printer, CheckCircle, Calculator, Users, LayoutList, Info, Clock, Timer } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title, Text } = Typography;

const CollectionEntry = () => {
    const { message } = App.useApp();
    const [form] = Form.useForm();

    // UI State
    const [duesInfo, setDuesInfo] = useState(null);
    const [lastReceiptId, setLastReceiptId] = useState(null);
    const [isCheckingDues, setIsCheckingDues] = useState(false);
    const [searchMode, setSearchMode] = useState('member'); // 'member' or 'group'
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const paymentMode = Form.useWatch('paymentMode', form) || 'Cash';

    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data?.data || res.data;
        }
    });

    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data?.data || res.data;
        }
    });

    const { data: groupTickets = [], isLoading: isLoadingGroupTickets } = useQuery({
        queryKey: ['groupTickets', selectedGroup],
        queryFn: async () => {
            if (!selectedGroup) return [];
            const res = await api.get(`/ChitGroups/${selectedGroup}/tickets`);
            return res.data?.data || res.data;
        },
        enabled: !!selectedGroup
    });

    const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const handleCheckDues = async () => {
        if (searchMode === 'member') {
            if (!selectedMember) {
                message.warning("Please select a Member");
                return;
            }
            setIsCheckingDues(true);
            try {
                const res = await api.get(`/Members/${selectedMember}/dues`);
                const data = res.data?.data || res.data;
                setDuesInfo({ type: 'member', ...data });
                form.setFieldsValue({ amount: data?.totalDue });
            } catch (e) {
                message.error("Error fetching dues.");
                setDuesInfo(null);
            } finally {
                setIsCheckingDues(false);
            }
        } else {
            const ticketId = form.getFieldValue('ticketId');
            if (!ticketId) {
                message.warning("Please select a Ticket");
                return;
            }
            setIsCheckingDues(true);
            try {
                const res = await api.get(`/Tickets/dues/${ticketId}`);
                const data = res.data?.data || res.data;
                setDuesInfo({ type: 'ticket', ...data });
                form.setFieldsValue({ amount: data?.totalDue });
            } catch (e) {
                message.error("Error fetching dues.");
                setDuesInfo(null);
            } finally {
                setIsCheckingDues(false);
            }
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
        const payload = {
            amount: parseFloat(values.amount),
            paymentMode: values.paymentMode,
            referenceNumber: values.referenceNumber || '',
            accountHeadId: values.accountHeadId
        };

        if (searchMode === 'member') {
            payload.memberId = selectedMember;
        } else {
            payload.ticketId = parseInt(values.ticketId);
        }

        paymentMutation.mutate(payload);
    };

    const handleReset = () => {
        setLastReceiptId(null);
        form.resetFields();
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">Collection Entry</Title>
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
                            label={<span className="font-semibold text-slate-700">Ticket Selection</span>}
                            required
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                        >
                            <Tabs
                                activeKey={searchMode}
                                onChange={(key) => {
                                    setSearchMode(key);
                                    form.setFieldsValue({ ticketId: undefined });
                                    setSelectedMember(null);
                                    setSelectedGroup(null);
                                    setDuesInfo(null);
                                    setLastReceiptId(null);
                                }}
                                type="card"
                                items={[
                                    {
                                        label: <span className="flex items-center gap-2"><Users size={16} />Search by Member</span>,
                                        key: 'member',
                                        children: (
                                            <div className="flex flex-col gap-3 mt-2">
                                                <Space.Compact className="w-full">
                                                    <Select
                                                        showSearch
                                                        allowClear
                                                        size="large"
                                                        className="flex-1"
                                                        placeholder="Search by Member Name or Mobile..."
                                                        optionFilterProp="children"
                                                        loading={isLoadingMembers}
                                                        filterOption={(input, option) =>
                                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                                                            (option?.mobile ?? '').includes(input)
                                                        }
                                                        options={members.map(m => ({
                                                            value: m.id,
                                                            label: m.fullName + (m.phoneNumber ? ` (${m.phoneNumber})` : ''),
                                                            mobile: m.phoneNumber
                                                        }))}
                                                        onChange={setSelectedMember}
                                                        value={selectedMember}
                                                    />
                                                    <Button
                                                        size="large"
                                                        onClick={handleCheckDues}
                                                        loading={isCheckingDues}
                                                        className="bg-slate-200 font-semibold text-slate-700 hover:bg-slate-300"
                                                    >
                                                        Check Dues
                                                    </Button>
                                                </Space.Compact>
                                            </div>
                                        )
                                    },
                                    {
                                        label: <span className="flex items-center gap-2"><LayoutList size={16} />Search by Group</span>,
                                        key: 'group',
                                        children: (
                                            <div className="flex flex-col gap-3 mt-2">
                                                <Select
                                                    showSearch
                                                    allowClear
                                                    size="large"
                                                    placeholder="Select Chit Group"
                                                    optionFilterProp="label"
                                                    loading={isLoadingGroups}
                                                    options={groups.map(g => ({
                                                        value: g.id,
                                                        label: g.groupName
                                                    }))}
                                                    onChange={setSelectedGroup}
                                                    value={selectedGroup}
                                                />
                                                {selectedGroup && (
                                                    <Space.Compact className="w-full">
                                                        <Form.Item
                                                            name="ticketId"
                                                            noStyle
                                                            rules={[{ required: true, message: 'Please select a ticket' }]}
                                                        >
                                                            <Select
                                                                size="large"
                                                                placeholder="Select Ticket Number"
                                                                className="flex-1"
                                                                loading={isLoadingGroupTickets}
                                                                options={groupTickets.map(t => ({
                                                                    value: t.id,
                                                                    label: `Ticket #${t.ticketNumber} - ${t.memberName || 'Vacant'} ${t.isPrized ? '(Prized)' : ''}`
                                                                }))}
                                                                showSearch
                                                                optionFilterProp="label"
                                                            />
                                                        </Form.Item>
                                                        <Button
                                                            size="large"
                                                            onClick={handleCheckDues}
                                                            loading={isCheckingDues}
                                                            className="bg-slate-200 font-semibold text-slate-700 hover:bg-slate-300"
                                                        >
                                                            Check Dues
                                                        </Button>
                                                    </Space.Compact>
                                                )}
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Amount Received</span>}
                            name="amount"
                            rules={[{ required: true, message: 'Amount is required' }]}
                        >
                            <InputNumber
                                className="text-lg font-bold text-slate-800"
                                style={{ width: '100%' }}
                                size="large"
                                placeholder="0.00"
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/₹\s?|(,*)/g, '')}
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
                            className="bg-slate-900 h-12 text-lg font-bold mt-4 shadow-md hover:bg-slate-800"
                            loading={paymentMutation.isPending}
                            disabled={searchMode === 'member' && duesInfo && (!duesInfo.ticketDues || duesInfo.ticketDues.length === 0)}
                        >
                            Record Payment
                        </Button>
                    </Form>
                </Card>

                {/* Information / Receipt Pane (Right Side) */}
                <div className="flex flex-col h-full">
                    {lastReceiptId ? (
                        <Card className="bg-green-50 border border-green-200 text-center rounded-xl shadow-sm h-full flex items-center justify-center flex-col min-h-[500px]" styles={{ body: { padding: '3rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }}>
                            <CheckCircle size={80} className="text-green-600 mb-6" />
                            <Title level={2} className="text-green-800 !mb-2">Payment Successful</Title>
                            <Text className="text-green-700 block mb-8 text-lg font-medium">Receipt #{lastReceiptId} generated.</Text>

                            <Button
                                type="primary"
                                size="large"
                                icon={<Printer size={20} />}
                                onClick={() => downloadFile(`/forms/receipt/${lastReceiptId}`, `Receipt_${lastReceiptId}.pdf`)}
                                className="bg-green-600 hover:bg-green-700 border-none mb-8 px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                Print Receipt
                            </Button>

                            <Button type="link" onClick={handleReset} className="text-green-700 underline hover:text-green-900 font-semibold text-base">
                                Make Another Entry
                            </Button>
                        </Card>
                    ) : (
                        <Card className="shadow-lg border-0 rounded-xl h-full flex flex-col min-h-[500px]" styles={{ body: { padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' } }}>
                            <Title level={4} className="!mb-6 text-slate-700 border-b border-slate-100 pb-4">
                                Account Overview
                            </Title>

                            {duesInfo ? (
                                <div className="flex-1 flex flex-col">
                                    {(duesInfo.type === 'member' && (!duesInfo.ticketDues || duesInfo.ticketDues.length === 0)) || (duesInfo.type === 'ticket' && duesInfo.totalDue <= 0) ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 bg-green-50/50 rounded-xl border border-dashed border-green-200 p-8">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                                <CheckCircle size={32} />
                                            </div>
                                            <Title level={4} className="text-green-800 !mb-2">No Outstanding Dues</Title>
                                            <Text className="text-slate-500 text-sm">
                                                This {duesInfo.type} is fully up-to-date with all installments.
                                            </Text>

                                            {(duesInfo.type === 'ticket' && duesInfo.advanceBalance > 0) && (
                                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl w-full">
                                                    <div className="flex justify-between items-center">
                                                        <Text className="text-green-800 font-medium">Current Advance Balance</Text>
                                                        <Text className="text-2xl font-black text-green-700">₹{duesInfo.advanceBalance.toLocaleString()}</Text>
                                                    </div>
                                                </div>
                                            )}
                                            {duesInfo.type === 'member' ? (
                                                <div className="flex flex-col gap-4 mt-6">
                                                    <Alert
                                                        message="Advance Allocation Required"
                                                        description="Because this member has no pending dues, please explicitly select a Ticket using 'Search by Group' on the left to allocate an advance payment."
                                                        type="warning"
                                                        showIcon
                                                        className="text-left rounded-lg bg-orange-50 border border-orange-200 text-orange-800 shadow-sm"
                                                    />
                                                    <Button
                                                        type="default"
                                                        size="large"
                                                        onClick={() => {
                                                            setSearchMode('group');
                                                            form.setFieldsValue({ ticketId: undefined });
                                                            setSelectedMember(null);
                                                            setSelectedGroup(null);
                                                            setDuesInfo(null);
                                                            setLastReceiptId(null);
                                                        }}
                                                        className="font-bold text-amber-600 bg-amber-50 border-amber-300 mx-auto"
                                                    >
                                                        Switch to Search by Group
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Alert
                                                    message="Advance Payment Notice"
                                                    description="Any amount recorded here will be safely banked as an Advance Payment against this specific ticket. The system will automatically sweep these advances to cover future auction installments!"
                                                    type="info"
                                                    showIcon
                                                    icon={<Info className="mt-1" />}
                                                    className="mt-6 text-left rounded-lg bg-white border border-blue-100 text-slate-600 shadow-sm"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                                                    <Users size={24} />
                                                </div>
                                                <div>
                                                    <Text className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
                                                        {duesInfo.type === 'member' ? 'Member Aggregated Dues' : 'Ticket Outstanding'}
                                                    </Text>
                                                    <Text className="text-lg font-bold text-slate-800">
                                                        {duesInfo.memberName} {duesInfo.type === 'ticket' && <span className="text-slate-400 font-normal text-sm">({duesInfo.groupName})</span>}
                                                    </Text>
                                                </div>
                                            </div>

                                            {duesInfo.type === 'member' && (
                                                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden mb-6 flex flex-col shadow-sm">
                                                    <Table
                                                        dataSource={duesInfo.ticketDues}
                                                        rowKey="ticketId"
                                                        pagination={{ pageSize: 5, hideOnSinglePage: true, simple: true }}
                                                        size="middle"
                                                        className="flex-1"
                                                        expandable={{
                                                            expandedRowRender: (record) => (
                                                                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                                                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Installment Breakdown</Text>
                                                                    <div className="space-y-3">
                                                                        {record.installments.map(inst => (
                                                                            <div key={inst.installmentNumber} className="flex justify-between items-center text-xs">
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold text-slate-700">Inst #{inst.installmentNumber} <span className="text-[9px] font-normal text-slate-400 font-mono">({dayjs(inst.dueDate).format('DD MMM')})</span></span>
                                                                                    {inst.overdueDays > 0 && <span className="text-rose-400 text-[9px]">{inst.overdueDays} days late</span>}
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="font-bold text-slate-600">₹{inst.totalDue.toLocaleString()}</div>
                                                                                    <div className="text-[9px] text-slate-400">₹{inst.grossPrincipal.toLocaleString()} - ₹{inst.dividend.toLocaleString()} + ₹{inst.pendingPenalty.toLocaleString()}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ),
                                                            rowExpandable: (record) => record.installments.length > 0,
                                                        }}
                                                        columns={[
                                                            { title: 'Chit Group', dataIndex: 'groupName', key: 'groupName', render: (text, record) => <div className="font-semibold text-slate-700 flex flex-col gap-1"><div>{text} <Tag className="m-0">#{record.ticketNumber}</Tag></div><div className="flex gap-1 flex-wrap">{record.advanceBalance > 0 && <Tag color="success" className="m-0 text-[10px] border-green-200 bg-green-50 text-green-700">Adv: ₹{record.advanceBalance.toLocaleString()}</Tag>}{record.overdueDays > 0 && <Tag color="warning" className="m-0 text-[10px] border-orange-200 bg-orange-50 text-orange-700 flex items-center gap-1"><Clock size={10} />{record.overdueDays}d Late</Tag>}</div></div> },
                                                            { title: 'Div.', dataIndex: 'dividend', align: 'right', render: (val) => <span className="text-green-600 text-xs">₹{val.toLocaleString()}</span> },
                                                            { title: 'Total Due', key: 'due', align: 'right', render: (_, r) => (
                                                                <div className="text-right">
                                                                    <div className="font-bold text-slate-800">₹{(r.pendingPrincipal + r.pendingPenalty).toLocaleString()}</div>
                                                                    <div className="text-[9px] text-slate-400 font-normal">
                                                                        ₹{r.grossPrincipal.toLocaleString()} - ₹{r.dividend.toLocaleString()} + ₹{r.pendingPenalty.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        ]}
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-auto bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                                                {duesInfo.type === 'ticket' && (
                                                    <>
                                                        <div className="space-y-4 mb-4 pb-4 border-b border-slate-200">
                                                            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Month-by-Month Breakdown</Text>
                                                            {duesInfo.installments.map(inst => (
                                                                <div key={inst.installmentNumber} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-slate-800">Installment #{inst.installmentNumber}</span>
                                                                            <span className="text-[10px] text-slate-400">Due: {dayjs(inst.dueDate).format('DD MMM YYYY')}</span>
                                                                        </div>
                                                                        {inst.overdueDays > 0 && <Tag color="error" className="m-0 text-[9px] uppercase border-red-100">{inst.overdueDays}d overdue</Tag>}
                                                                    </div>
                                                                    <div className="flex justify-between text-[11px] text-slate-500 italic">
                                                                        <span>{inst.grossPrincipal.toLocaleString()} (Gross) - {inst.dividend.toLocaleString()} (Div) + {inst.pendingPenalty.toLocaleString()} (Penalty)</span>
                                                                        <span className="font-bold text-slate-700">₹{inst.totalDue.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}

                                                {duesInfo.type === 'member' && (
                                                    <>
                                                        <div className="flex justify-between text-slate-500 mb-1 text-sm italic">
                                                            <span>Total Gross Installments:</span>
                                                            <span>₹{(duesInfo.totalGrossPrincipal || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-green-600 mb-2 text-sm italic">
                                                            <span>Total Earned Dividends:</span>
                                                            <span>- ₹{(duesInfo.totalDividend || 0).toLocaleString()}</span>
                                                        </div>
                                                        <Divider className="my-2" />
                                                        <div className="flex justify-between text-rose-500 mb-4 pb-4 border-b border-slate-200 text-base">
                                                            <span>Aggregated Late Fees:</span>
                                                            <span className="font-bold">₹{(duesInfo.totalPendingPenalty || 0).toLocaleString()}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {((duesInfo.type === 'member' && duesInfo.totalAdvanceBalance > 0) || (duesInfo.type === 'ticket' && duesInfo.advanceBalance > 0)) && (
                                                    <div className="flex justify-between items-center mb-4 p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                                                        <div>
                                                            <Text className="text-green-700 font-bold text-xs uppercase tracking-wider block mb-1">Stored Advance Balance</Text>
                                                            <Text className="text-2xl font-black text-green-700">+₹{((duesInfo.type === 'member' ? duesInfo.totalAdvanceBalance : duesInfo.advanceBalance) || 0).toLocaleString()}</Text>
                                                        </div>
                                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                            <CheckCircle size={20} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center">
                                                    <Text className="text-slate-500 font-medium text-lg">Total Outstanding</Text>
                                                    <Text className="text-4xl font-black text-rose-600">₹{(duesInfo.totalDue || 0).toLocaleString()}</Text>
                                                </div>

                                                {duesInfo.type === 'member' && (
                                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest block mt-4 text-center text-slate-400">
                                                        Payments auto-settle via FIFO logic across all tickets
                                                    </Text>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <Calculator size={48} className="text-slate-300" />
                                    </div>
                                    <Title level={4} className="text-slate-600 !mb-2">Awaiting Selection</Title>
                                    <Text className="text-slate-400 max-w-xs text-sm">
                                        Select a member or specify a ticket group on the left to instantly load their current financial standing and metrics.
                                    </Text>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionEntry;
