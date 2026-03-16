import { Typography, Card, Table, Tag, Spin, Result, Button, Tabs, Alert } from 'antd';
import { Wallet, CreditCard, ChevronRight, Download, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const { Title, Text } = Typography;

const MyPayments = () => {
    const { data: summary = { recentPayments: [], pendingDemands: [] }, isLoading, error } = useQuery({
        queryKey: ['myPayments'],
        queryFn: async () => {
            const res = await api.get('/Customer/my-payments');
            return res.data.data || res.data;
        }
    });

    const pendingColumns = [
        {
            title: 'Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <span className="font-bold text-slate-800">{text}</span>
        },
        {
            title: 'Installment',
            dataIndex: 'installmentNumber',
            key: 'installmentNumber',
            render: (val) => <Tag color="blue">#{val}</Tag>
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (date) => (
                <div className="flex flex-col">
                    <span className="text-slate-700 font-medium">{new Date(date).toLocaleDateString()}</span>
                    <span className="text-[10px] text-red-500 font-bold uppercase">Action Required</span>
                </div>
            )
        },
        {
            title: 'Amount Due',
            key: 'amount',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-slate-800 font-bold">₹{record.balanceAmount.toLocaleString()}</span>
                    <Text delete className="text-[11px] text-slate-400">Total: ₹{record.totalAmount.toLocaleString()}</Text>
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: () => (
                <Button type="primary" className="bg-emerald-600 hover:bg-emerald-700 border-0 rounded-lg font-bold">
                    Pay Now
                </Button>
            )
        }
    ];

    const historyColumns = [
        {
            title: 'Date',
            dataIndex: 'receiptDate',
            key: 'receiptDate',
            render: (date) => <span className="text-slate-600">{new Date(date).toLocaleDateString()}</span>
        },
        {
            title: 'Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <span className="font-medium text-slate-800">{text}</span>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val) => <span className="font-bold text-emerald-600">₹{val.toLocaleString()}</span>
        },
        {
            title: 'Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: (mode) => <Tag className="rounded-full">{mode}</Tag>
        },
        {
            title: 'Reference',
            dataIndex: 'referenceNumber',
            key: 'referenceNumber',
            render: (ref) => <span className="text-xs text-slate-400 font-mono">{ref || '-'}</span>
        },
        {
            title: 'Receipt',
            key: 'receipt',
            render: () => (
                <Button type="text" icon={<Download size={16} />} className="text-indigo-600 hover:text-indigo-700 p-0" />
            )
        }
    ];

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (error) return <Result status="error" title="Failed to load payment info" />;

    const totalDue = summary.pendingDemands.reduce((acc, d) => acc + d.balanceAmount, 0);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">Payments</Title>
                        <Text className="text-slate-500 font-medium">Manage your dues and view payment history.</Text>
                    </div>
                </div>
            </div>

            {totalDue > 0 && (
                <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden relative">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-4">
                        <div>
                            <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest block mb-2">Total Outstanding Balance</Text>
                            <div className="text-5xl font-black tracking-tighter">₹{totalDue.toLocaleString()}</div>
                            <div className="mt-4 flex gap-3">
                                <Tag className="bg-slate-700 border-0 text-white flex items-center gap-1 py-1 px-3 rounded-full">
                                    <Clock size={12} /> {summary.pendingDemands.length} Pending Dues
                                </Tag>
                            </div>
                        </div>
                        <Button size="large" className="h-14 px-10 rounded-2xl bg-white text-slate-900 border-0 font-black text-lg hover:!bg-indigo-50 hover:!text-indigo-600 transition-all flex items-center justify-center gap-2">
                            Pay All Dues <ChevronRight size={20} />
                        </Button>
                    </div>
                    <Wallet className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" />
                </Card>
            )}

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8">
                <Tabs
                    defaultActiveKey="pending"
                    className="member-portal-tabs"
                    items={[
                        {
                            key: 'pending',
                            label: (
                                <span className="flex items-center gap-2 py-2 px-4">
                                    <Clock size={18} /> Pending Dues
                                </span>
                            ),
                            children: (
                                <div className="mt-6">
                                    {summary.pendingDemands.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <Title level={4} className="!m-0 text-slate-800">No Pending Dues</Title>
                                            <Text className="text-slate-500">You are all caught up! Great job.</Text>
                                        </div>
                                    ) : (
                                        <Table
                                            columns={pendingColumns}
                                            dataSource={summary.pendingDemands}
                                            rowKey="demandId"
                                            pagination={false}
                                            className="member-portal-table"
                                        />
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'history',
                            label: (
                                <span className="flex items-center gap-2 py-2 px-4">
                                    <History size={18} /> Payment History
                                </span>
                            ),
                            children: (
                                <div className="mt-6">
                                    <Table
                                        columns={historyColumns}
                                        dataSource={summary.recentPayments}
                                        rowKey="receiptId"
                                        pagination={{ pageSize: 10 }}
                                        className="member-portal-table"
                                    />
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
};

export default MyPayments;
