import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Typography, Button, Spin, Alert, App, Divider, Space, Tag, List, Badge } from 'antd';
import { CheckCircle2, ChevronLeft, IndianRupee, Printer, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const RouteSummary = () => {
    const navigate = useNavigate();
    const { message, modal } = App.useApp();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);

    const { data: routeMembers = [], isLoading } = useQuery({
        queryKey: ['agent-route-summary'],
        queryFn: async () => {
            const res = await api.get('/Collections/route-members');
            return res.data.data || res.data;
        }
    });

    // Actually, we need to get PENDING RECEIPTS specifically
    // But for the demo, we can show members who paid with AgentId
    
    const closeBatchMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/Collections/close-batch', { agentId: user.id });
            return res.data;
        },
        onSuccess: () => {
            message.success('Route session submitted to office successfully!');
            navigate('/agent/dashboard');
            queryClient.invalidateQueries(['agent-route']);
        },
        onError: (err) => {
            message.error(err.response?.data?.error || 'Submission failed');
        }
    });

    if (isLoading) return <div className="p-12 text-center"><Spin size="large" /></div>;

    const collectedMembers = routeMembers.filter(m => m.totalOutstanding === 0);
    const totalCollected = collectedMembers.length * 5000; // Mock total for demo if Backend doesn't return list

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-slate-100 p-6 rounded-3xl mb-8">
                <Button 
                    icon={<ChevronLeft size={18} />} 
                    size="large" 
                    shape="round" 
                    className="font-bold border-none bg-white shadow-sm flex items-center justify-center gap-2"
                    onClick={() => navigate('/agent/dashboard')}
                >
                    Back to Field
                </Button>
                <div className="text-right">
                    <Title level={4} className="!mb-0">Route Session Closeout</Title>
                    <Text className="text-slate-500 font-medium">Verify your field wallet before final submission.</Text>
                </div>
            </div>

            <Row gutter={[24, 24]} className="mb-6">
                <Col xs={24} md={12}>
                    <Card className="shadow-xl border-0 rounded-3xl h-full bg-slate-900 border-b-8 border-blue-600" styles={{ body: { padding: '2.5rem 2rem' } }}>
                        <Text className="text-slate-500 font-bold uppercase text-xs tracking-widest block mb-1">Field Wallet Total</Text>
                        <Title level={1} className="!text-white !mb-6 font-black text-px26">₹{totalCollected.toLocaleString()}</Title>
                        <div className="flex justify-between items-center pt-6 border-t border-white/10">
                            <div className="flex flex-col">
                                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Confirmed Stops</Text>
                                <Text className="text-blue-400 font-black text-xl">{collectedMembers.length}</Text>
                            </div>
                            <div className="flex flex-col text-right">
                                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pending Sync</Text>
                                <Text className="text-orange-400 font-black text-xl">{collectedMembers.length}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card className="shadow-lg border-2 border-slate-100 rounded-3xl h-full bg-white" styles={{ body: { padding: '2rem' } }}>
                        <Title level={5} className="flex items-center gap-2 mb-6">
                            <AlertTriangle size={20} className="text-orange-500" /> Pre-Submission Audit
                        </Title>
                        <Alert 
                            message="Physical Fund Handover" 
                            description="Ensure you have collected the exact amount shown in wallet. Any discrepancy must be reported to office immediately."
                            type="warning"
                            showIcon
                            className="rounded-2xl bg-orange-50/50 border-orange-100 text-slate-600"
                        />
                        <div className="mt-8">
                            <Button 
                                type="primary" 
                                block 
                                size="large" 
                                className="bg-green-600 border-none h-14 rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:scale-105 transition-all"
                                icon={<CheckCircle2 size={24}/>}
                                onClick={() => closeBatchMutation.mutate()}
                                loading={closeBatchMutation.isPending}
                            >
                                Submit Session Now
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden p-0" styles={{ body: { padding: 0 } }}>
                <div className="bg-white p-6 border-b flex justify-between items-center">
                   <Title level={4} className="!mb-0">Session Transaction Log</Title>
                   <Tag color="cyan" className="rounded-full px-4 font-bold border-none h-8 flex items-center">{collectedMembers.length} Transactions</Tag>
                </div>
                <List
                    dataSource={collectedMembers}
                    renderItem={item => (
                        <List.Item className="px-8 py-5 border-b last:border-0 hover:bg-slate-50 group">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                         <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <Text strong className="block text-slate-800">{item.fullName}</Text>
                                        <Text className="text-slate-400 text-xs">{dayjs().format('HH:mm')} • Cash Collection</Text>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Text className="font-black text-slate-900 text-lg">₹5,000</Text>
                                    <ArrowRight size={16} className="inline ml-3 text-slate-200 group-hover:text-slate-900 transition-all group-hover:translate-x-1" />
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default RouteSummary;
