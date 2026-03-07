import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Tag, Spin, Result } from 'antd';
import { AlertCircle, TrendingUp, Clock, FileText } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const PortalDashboard = () => {
    const { data = null, isLoading, error } = useQuery({
        queryKey: ['portalDashboard'],
        queryFn: async () => {
            const res = await api.get('/Customer/dashboard');
            return res.data.data || res.data;
        },
        retry: 1
    });

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;

    if (error || !data) {
        return (
            <div className="p-8">
                <Result
                    status="403"
                    title="Access Restricted"
                    subTitle="Failed to load data. Please ensure you are logged in as a Subscriber linked to a Member profile."
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800">My Dashboard</Title>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="shadow-sm border-0 rounded-xl bg-gradient-to-br from-red-50 to-white" styles={{ body: { padding: '2rem' } }}>
                    <div className="flex items-center mb-4 text-red-700 font-semibold text-lg">
                        <AlertCircle size={24} className="mr-2" /> Pending Liability
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-red-700 font-mono tracking-tight">
                        ₹{data.totalLiability?.toLocaleString()}
                    </div>
                </Card>

                <Card className="shadow-sm border-0 rounded-xl bg-gradient-to-br from-green-50 to-white" styles={{ body: { padding: '2rem' } }}>
                    <div className="flex items-center mb-4 text-green-700 font-semibold text-lg">
                        <TrendingUp size={24} className="mr-2" /> Total Savings (Dividend)
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-green-700 font-mono tracking-tight">
                        ₹{data.totalSavings?.toLocaleString()}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* My Tickets */}
                <Card className="shadow-sm border-0 rounded-xl h-full" styles={{ body: { padding: '2rem' } }}>
                    <Title level={3} className="!mb-6 text-slate-700 flex items-center gap-2">
                        <FileText size={24} className="text-indigo-600" /> My Enrolled Chits
                    </Title>

                    {!data.myTickets || data.myTickets.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
                            No active chits found.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {data.myTickets.map(ticket => (
                                <div key={ticket.ticketId} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg text-slate-800">{ticket.groupName}</div>
                                        <Tag
                                            color={ticket.isPrized ? 'success' : 'processing'}
                                            className="rounded-full px-3 py-0.5 font-bold m-0 border-0"
                                        >
                                            {ticket.isPrized ? 'Prized' : 'Active'}
                                        </Tag>
                                    </div>
                                    <div className="text-slate-500 text-sm flex gap-4">
                                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">Ticket #{ticket.ticketNumber}</span>
                                        <span>Value: <strong className="text-slate-800">₹{ticket.chitValue?.toLocaleString()}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Upcoming Auctions */}
                <Card className="shadow-sm border-0 rounded-xl h-full" styles={{ body: { padding: '2rem' } }}>
                    <Title level={3} className="!mb-6 text-slate-700 flex items-center gap-2">
                        <Clock size={24} className="text-amber-600" /> Upcoming Auctions
                    </Title>

                    {!data.upcomingAuctions || data.upcomingAuctions.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
                            No upcoming auctions.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {data.upcomingAuctions.map(auction => (
                                <div key={auction.auctionId} className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center">
                                    <div className="bg-amber-100 p-3 rounded-full mr-4 text-amber-700">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-slate-800 mb-1">{auction.groupName}</div>
                                        <div className="text-slate-600 font-medium">
                                            {new Date(auction.date).toLocaleDateString()} • Installment #{auction.installment}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PortalDashboard;
