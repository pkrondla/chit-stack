import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Row, Col, Button, List, Tag, Spin } from 'antd';
import { MapPin, Users, IndianRupee, ChevronRight, UserPlus, CheckCircle2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import { semanticColors } from '../../theme/tokens';

const { Title, Text } = Typography;

const AgentDashboard = () => {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    // Heartbeat: Send location every 1 minute
    useEffect(() => {
        const sendLocation = () => {
            if ("geolocation" in navigator && user?.id) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    api.post('/Collections/update-location', {
                        userId: user.id,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }).catch(err => console.error("Heartbeat failed", err));
                }, null, { enableHighAccuracy: true });
            }
        };

        sendLocation(); // Initial
        const interval = setInterval(sendLocation, 60000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const { data: routeMembers = [], isLoading } = useQuery({
        queryKey: ['agent-route'],
        queryFn: async () => {
            const res = await api.get('/Collections/route-members');
            return res.data.data || res.data;
        }
    });

    const memberList = Array.isArray(routeMembers) ? routeMembers : [];
    const collectedMembers = memberList.filter(m => m.totalOutstanding <= 0).length;
    const pendingMembers = memberList.filter(m => m.totalOutstanding > 0).length;
    const totalOutstanding = memberList.reduce((acc, m) => acc + (m.totalOutstanding || 0), 0);

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;

    if (!Array.isArray(routeMembers)) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
                <Title level={4} className="text-slate-800">No Route Assigned</Title>
                <Text className="text-slate-500 block mb-6">Please contact your administrator to assign a collection route to your account.</Text>
                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <Text type="secondary" italic>An active route is required to view member collection status.</Text>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div 
                className="flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden"
                style={{ paddingTop: '35px', paddingBottom: '35px', paddingLeft: '30px', paddingRight: '30px' }}
            >
                <div className="relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="uppercase tracking-[0.2em] text-[10px] mb-2 font-bold" style={{ color: semanticColors.textMuted }}>Assigned Route</div>
                    <Title level={2} className="!text-white !mb-1 text-2xl md:text-3xl tracking-tight">Active Collection Route</Title>
                    <div className="flex items-center gap-2 font-bold" style={{ color: semanticColors.navActive }}>
                        <MapPin size={16} /> <span className="text-sm">{pendingMembers} Stops Remaining</span>
                    </div>
                </div>
                <div className="text-left md:text-right relative z-10 w-full md:w-auto">
                    <div className="uppercase font-bold tracking-[0.2em] mb-2 text-[10px]" style={{ color: semanticColors.textMuted }}>Expected Collection</div>
                    <Title level={1} className="!text-white !mb-4 font-black text-3xl md:text-4xl tracking-tighter">
                        ₹{totalOutstanding.toLocaleString()}
                    </Title>
                    <Button 
                        size="small" 
                        shape="round" 
                        icon={<History size={14}/>} 
                        className="bg-white/10 border-white/20 text-white font-bold hover:bg-white hover:text-slate-900 transition-all"
                        onClick={() => navigate('/agent/summary')}
                    >
                        View Collection Log
                    </Button>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-slate-700/30 rounded-full blur-2xl"></div>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card className="shadow-md border-0 rounded-2xl text-center bg-blue-50/50" styles={{ body: { padding: '1.5rem' } }}>
                        <Users className="mx-auto text-blue-600 mb-2" size={28} />
                        <Title level={3} className="!mb-0 !text-slate-800">{routeMembers.length}</Title>
                        <Text className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Total Members</Text>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="shadow-md border-0 rounded-2xl text-center bg-orange-50/50" styles={{ body: { padding: '1.5rem' } }}>
                        <History className="mx-auto text-orange-600 mb-2" size={28} />
                        <Title level={3} className="!mb-0 !text-slate-800">{pendingMembers}</Title>
                        <Text className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Awaiting Payment</Text>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="shadow-md border-0 rounded-2xl text-center bg-green-50/50" styles={{ body: { padding: '1.5rem' } }}>
                        <CheckCircle2 className="mx-auto text-green-600 mb-2" size={28} />
                        <Title level={3} className="!mb-0 !text-slate-800">{collectedMembers}</Title>
                        <Text className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Fully Collected</Text>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden pt-2" styles={{ body: { padding: 0 } }}>
                <div className="flex items-center justify-between p-6 border-b bg-white">
                    <Title level={4} className="!mb-0 flex items-center gap-2">
                        <MapPin size={20} className="text-slate-400" /> Route Stops
                    </Title>
                    <Button type="primary" shape="round" color="default" variant="filled" className="font-bold px-6" onClick={() => navigate('/agent/route')}>
                        Map View
                    </Button>
                </div>
                
                <List
                    dataSource={routeMembers}
                    renderItem={(item) => (
                        <List.Item 
                            className={`px-6 py-5 hover:bg-slate-50 cursor-pointer transition-all border-b group ${item.totalOutstanding === 0 ? 'bg-green-50/20 opacity-60' : ''}`}
                            onClick={() => navigate(`/agent/collect/${item.memberId}`)}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${item.totalOutstanding === 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                        {item.totalOutstanding === 0 ? <CheckCircle2 size={24} /> : item.fullName.charAt(0)}
                                    </div>
                                     <div className="flex-1">
                                         <Title level={5} className="!mb-0">{item.fullName}</Title>
                                         <Text className="text-slate-400 text-[11px] block mt-0.5 leading-tight">{item.address || 'No address specified'}</Text>
                                     </div>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div className="hidden sm:block">
                                        <Text className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Balance</Text>
                                        <Text className={`font-black text-lg ${item.totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                            ₹{item.totalOutstanding.toLocaleString()}
                                        </Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.overdueDays > 0 && <Tag color="error" className="m-0 border-none rounded-md px-2 py-0.5 text-[10px] uppercase font-black">Late {item.overdueDays}d</Tag>}
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-all translate-x-0 group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
                
                <div className="p-8 text-center bg-slate-50 border-t border-dashed border-slate-200">
                    <Button 
                        type="dashed" 
                        size="large" 
                        icon={<UserPlus size={18} />} 
                        className="h-14 px-8 rounded-2xl font-bold text-slate-600 border-2"
                        onClick={() => navigate('/agent/vacancies')}
                    >
                        New Recruitment Prospect
                    </Button>
                </div>
            </Card>

            <Card 
                className="border-0 rounded-3xl shadow-lg shadow-blue-200"
                style={{ background: semanticColors.infoBlue }}
                styles={{ body: { padding: '1.5rem 2rem', background: 'transparent' } }}
            >
                <div className="flex flex-col sm:flex-row items-center justify-between text-white gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                            <IndianRupee size={24} className="text-white" />
                        </div>
                        <div>
                            <Text className="!text-white/60 block text-[10px] font-bold uppercase tracking-widest mb-1">End of Route Submission</Text>
                            <Title level={4} className="!text-white !mb-0">Submit Day's Collections</Title>
                        </div>
                    </div>
                    <Button 
                        ghost 
                        size="large" 
                        shape="round" 
                        className="border-2 font-black px-10 h-14 bg-white/10 hover:bg-white text-white hover:text-blue-600 border-white/50"
                        onClick={() => navigate('/agent/summary')}
                    >
                        Close Batch
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AgentDashboard;
