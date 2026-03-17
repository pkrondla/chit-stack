import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Tag, Spin, Result, Button, Row, Col, Space } from 'antd';
import {
    ChevronRight,
    Gavel,
    ShieldCheck,
    CreditCard,
    PlayCircle,
    History as HistoryIcon,
    Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text } = Typography;

const PortalDashboard = () => {
    const navigate = useNavigate();

    const { data = null, isLoading, error } = useQuery({
        queryKey: ['portalDashboard'],
        queryFn: async () => {
            const res = await api.get('/Customer/dashboard');
            return res.data.data || res.data;
        },
        retry: 1
    });

    if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>;

    if (error || !data) {
        return (
            <div className="p-4">
                <Result
                    status="403"
                    title="Access Restricted"
                    subTitle="Please ensure you are logged in as a Member."
                    extra={<Button type="primary" onClick={() => navigate('/login')}>Back to Login</Button>}
                />
            </div>
        );
    }

    const { totalLiability = 0, myTickets = [], upcomingAuctions = [] } = data;

    // Filter auctions for the next 30 days
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const filteredAuctions = upcomingAuctions.filter(auction => {
        const auctionDate = new Date(auction.date);
        return auctionDate >= today && auctionDate <= thirtyDaysFromNow;
    });

    return (
        <div className="max-w-7xl mx-auto py-6 animate-in fade-in duration-700" style={{ paddingLeft: '5px', paddingRight: '5px' }}>

            {/* Minimal Header Section */}
            <div className="mb-6">
                <Text className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em] mb-1 block">Account Insights</Text>
                <Title level={3} className="!m-0 !font-black tracking-tight text-slate-900">Member Portal</Title>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '30px', paddingLeft: '20px', paddingRight: '20px' }}>
                {/* 1. Outstanding & Payments */}
                <Col xs={24} lg={12}>
                    <div
                        className="h-full border border-slate-200 shadow-sm rounded-3xl overflow-hidden relative bg-white"
                    >
                        <div className="relative z-10 h-full flex flex-col justify-between" style={{ padding: '20px' }}>
                            <div>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1 block m-0">Total Outstanding</p>
                                <h2 className="text-slate-900 m-0 font-black tracking-tighter text-4xl md:text-5xl">
                                    ₹{totalLiability.toLocaleString()}
                                </h2>
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-emerald-700 font-bold text-[9px] uppercase tracking-widest leading-none">Healthy Account status</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={() => navigate('/portal/payments')}
                                    className="h-12 rounded-xl bg-indigo-600 text-white border-none font-black text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={18} /> Pay Outstanding
                                </Button>
                            </div>
                        </div>
                    </div>
                </Col>

                {/* 2. Upcoming Auctions & Live Room */}
                <Col xs={24} lg={12}>
                    <Card
                        className="h-full border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white"
                        styles={{ body: { padding: '30px' } }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 block">Auction Schedule</Text>
                                <Title level={4} className="!m-0 !font-black tracking-tight text-slate-900">Next 30 Days</Title>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                                <Gavel size={20} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredAuctions.length === 0 ? (
                                <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Text type="secondary" className="text-xs font-medium italic">No pending auctions in next 30 days</Text>
                                </div>
                            ) : (
                                filteredAuctions.slice(0, 1).map((auction) => (
                                    <div
                                        key={auction.auctionId}
                                        className="rounded-2xl border border-slate-200 relative overflow-hidden group bg-slate-50 hover:bg-white transition-all mb-3 last:mb-0"
                                        style={{ padding: '16px' }}
                                    >
                                        <div className="relative z-10 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Date Badge */}
                                                <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm text-slate-900">
                                                    <span className="text-[8px] font-black uppercase text-slate-900 leading-none mb-0.5">
                                                        {new Date(auction.date).toLocaleDateString(undefined, { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-black leading-none">
                                                        {new Date(auction.date).toLocaleDateString(undefined, { day: 'numeric' })}
                                                    </span>
                                                </div>

                                                {/* Group Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-slate-900 m-0 font-black tracking-tight truncate mb-1 text-sm">
                                                        {auction.groupName}
                                                    </h4>
                                                    <Tag color="blue" className="m-0 border-0 rounded-full font-black text-[7px] uppercase px-2 py-0">
                                                        Inst. #{auction.installment}
                                                    </Tag>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                type="primary"
                                                size="middle"
                                                onClick={() => navigate(`/portal/auctions/live/${auction.auctionId}`)}
                                                icon={auction.status === 'Closed' ? <HistoryIcon size={14} /> : <PlayCircle size={14} />}
                                                className={`h-9 px-6 rounded-lg border-none font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center shrink-0 ${auction.status === 'Closed' ? 'bg-slate-500 hover:bg-slate-600' : 'bg-indigo-600 hover:bg-indigo-700'
                                                    }`}
                                            >
                                                {auction.status === 'Closed' ? 'Room' : 'Join'}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            <div className="space-y-4" style={{ marginBottom: '30px', paddingLeft: '25px', paddingRight: '25px' }}>
                <Card
                    className="border border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden"
                    styles={{ body: { padding: '20px' } }}
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 block">Enrollment Portfolio</Text>
                            <Title level={4} className="!m-0 !font-black tracking-tight text-slate-900">Active Subscriptions</Title>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                            <HistoryIcon size={20} />
                        </div>
                    </div>

                    <Row gutter={[16, 16]}>
                        {myTickets.length === 0 ? (
                            <Col span={24}>
                                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Text type="secondary" className="text-xs">No active chits found</Text>
                                </div>
                            </Col>
                        ) : (
                            myTickets.map(ticket => (
                                <Col xs={24} sm={12} lg={8} xl={6} key={ticket.ticketId}>
                                    <div
                                        onClick={() => navigate('/portal/my-chits')}
                                        className="rounded-2xl border border-slate-200 flex flex-col transition-all cursor-pointer group hover:border-slate-300 hover:shadow-md bg-white h-full relative"
                                        style={{ padding: '20px' }}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-slate-900 font-black text-sm">
                                                #{ticket.ticketNumber}
                                            </div>
                                            <Tag color={ticket.isPrized ? "gold" : "blue"} className="m-0 border-0 rounded-full font-black text-[7px] uppercase px-2 py-0">
                                                {ticket.isPrized ? "Prized" : "Active"}
                                            </Tag>
                                        </div>

                                        <div className="flex-1 flex flex-col mb-4">
                                            <h4 className="text-slate-900 m-0 font-black tracking-tight truncate mb-1 text-base">
                                                {ticket.groupName}
                                            </h4>
                                            <Text className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Subscriber ID: {String(ticket.ticketId).slice(0, 8)}</Text>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wallet size={14} className="text-slate-900" />
                                                <span className="text-slate-900 font-black text-base">₹{ticket.chitValue?.toLocaleString()}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Col>
                            ))
                        )}
                    </Row>
                </Card>
            </div>



        </div>
    );
};

export default PortalDashboard;
