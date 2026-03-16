import { Typography, Card, Table, Tag, Spin, Result } from 'antd';
import { History as HistoryIcon, TrendingUp, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const { Title, Text } = Typography;

const MyChits = () => {
    const { data: chits = [], isLoading, error } = useQuery({
        queryKey: ['myChits'],
        queryFn: async () => {
            const res = await api.get('/Customer/my-chits');
            return res.data.data || res.data;
        }
    });

    const columns = [
        {
            title: 'Group Details',
            key: 'group',
            render: (_, record) => (
                <div>
                    <div className="font-bold text-slate-800">{record.groupName}</div>
                    <div className="text-xs text-slate-500">{record.groupCode}</div>
                </div>
            )
        },
        {
            title: 'Ticket',
            dataIndex: 'ticketNumber',
            key: 'ticketNumber',
            render: (num) => <Tag className="bg-slate-100 border-0 text-slate-700 font-medium">#{num}</Tag>
        },
        {
            title: 'Value',
            dataIndex: 'chitValue',
            key: 'chitValue',
            render: (val) => <span className="font-semibold text-slate-700">₹{val.toLocaleString()}</span>
        },
        {
            title: 'Progression',
            key: 'progression',
            render: (_, record) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{record.currentInstallment} / {record.duration}</span>
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-indigo-500 h-full"
                            style={{ width: `${(record.currentInstallment / record.duration) * 100}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Paid Amount',
            dataIndex: 'totalPaid',
            key: 'totalPaid',
            render: (val) => <span className="text-green-600 font-bold">₹{val.toLocaleString()}</span>
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <div className="flex gap-2">
                    {record.isPrized && <Tag color="gold" className="rounded-full border-0 font-bold">Prized</Tag>}
                    <Tag color="cyan" className="rounded-full border-0 font-bold">In-Progress</Tag>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (error) return <Result status="error" title="Failed to load your chits" />;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-100">
                        <HistoryIcon size={28} />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">My Enrolled Chits</Title>
                        <Text className="text-slate-500 font-medium">Manage and track your active participation in chit groups.</Text>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-0 shadow-sm rounded-2xl bg-slate-100">
                    <Text className="text-slate-900 font-bold uppercase text-[10px] tracking-widest block mb-1">Active Chits</Text>
                    <Title level={3} className="!m-0 text-slate-900">{chits.length}</Title>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl bg-emerald-50">
                    <Text className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest block mb-1">Prized Tickets</Text>
                    <Title level={3} className="!m-0 text-emerald-900">{chits.filter(c => c.isPrized).length}</Title>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl bg-amber-50">
                    <Text className="text-amber-600 font-bold uppercase text-[10px] tracking-widest block mb-1">Total Paid</Text>
                    <Title level={3} className="!m-0 text-amber-900">₹{chits.reduce((acc, c) => acc + c.totalPaid, 0).toLocaleString()}</Title>
                </Card>
            </div>

            <Card className="shadow-xl shadow-slate-200/50 border-0 rounded-3xl overflow-hidden p-2">
                <Table
                    columns={columns}
                    dataSource={chits}
                    rowKey="ticketId"
                    pagination={false}
                    className="member-portal-table"
                />
            </Card>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl flex items-start gap-4 border border-slate-100">
                <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                    <Info size={20} />
                </div>
                <div>
                    <Title level={5} className="!m-0 text-slate-800">About Participation</Title>
                    <Text className="text-slate-600 text-sm">
                        You can view more details about each group by clicking on the row. Prized tickets indicate that you have successfully won the auction for that group.
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default MyChits;
