import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Typography, Button, Spin, Alert, App, Divider, Space, Tag, List, Badge, Row, Col } from 'antd';
import { CheckCircle2, ChevronLeft, IndianRupee, Printer, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import dayjs from 'dayjs';
import { semanticColors } from '../../theme/tokens';

const { Title, Text } = Typography;

const RouteSummary = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);

    const { data: receipts = [], isLoading } = useQuery({
        queryKey: ['agent-receipts'],
        queryFn: async () => {
            const res = await api.get('/Collections/agent-receipts');
            return res.data.data || [];
        }
    });

    const totalCollected = receipts.reduce((acc, r) => acc + (r.amount || 0), 0);
    const cashTotal = receipts.filter(r => r.paymentMode === 'Cash').reduce((acc, r) => acc + (r.amount || 0), 0);
    const chequeTotal = receipts.filter(r => r.paymentMode === 'Cheque').reduce((acc, r) => acc + (r.amount || 0), 0);
    const digitalTotal = totalCollected - cashTotal - chequeTotal;

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
                    <Card 
                        className="shadow-xl border-0 rounded-3xl h-full border-b-8 border-blue-600" 
                        style={{ background: semanticColors.navBg }}
                        styles={{ body: { padding: '2.5rem 2rem', background: 'transparent' } }}
                    >
                        <Text className="!text-white/50 font-black uppercase text-[10px] tracking-[0.2em] block mb-2">Field Wallet Total</Text>
                        <Title level={1} className="!text-white !mb-4 font-black !text-4xl tracking-tighter">₹{totalCollected.toLocaleString()}</Title>
                        
                        <div className="grid grid-cols-3 gap-2 mb-8">
                            <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10 text-center">
                                <Text className="!text-white/40 text-[8px] uppercase font-bold block mb-1">Physical Cash</Text>
                                <Text className="!text-green-400 font-bold text-sm">₹{cashTotal.toLocaleString()}</Text>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10 text-center">
                                <Text className="!text-white/40 text-[8px] uppercase font-bold block mb-1">Cheques</Text>
                                <Text className="!text-orange-400 font-bold text-sm">₹{chequeTotal.toLocaleString()}</Text>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10 text-center">
                                <Text className="!text-white/40 text-[8px] uppercase font-bold block mb-1">Digital/UPI</Text>
                                <Text className="!text-blue-400 font-bold text-sm">₹{digitalTotal.toLocaleString()}</Text>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-white/10">
                            <div className="flex flex-col">
                                <Text className="!text-white/50 font-bold uppercase text-[9px] tracking-[0.15em]">Total Collections</Text>
                                <Text className="!text-blue-400 font-black text-2xl">{receipts.length}</Text>
                            </div>
                            <div className="flex flex-col text-right">
                                <Text className="!text-white/50 font-bold uppercase text-[9px] tracking-[0.15em]">Unverified</Text>
                                <Text className="!text-orange-400 font-black text-2xl">{receipts.length}</Text>
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
                   <Tag color="cyan" className="rounded-full px-4 font-bold border-none h-8 flex items-center">{receipts.length} Transactions</Tag>
                </div>
                <List
                    dataSource={receipts}
                    renderItem={item => (
                        <List.Item className="px-8 py-5 border-b last:border-0 hover:bg-slate-50 group">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                         <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <Text strong className="block text-slate-800">{item.memberName}</Text>
                                        <Text className="text-slate-400 text-xs">{dayjs(item.date).format('HH:mm')} • {item.paymentMode}</Text>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Text className="font-black text-slate-900 text-lg">₹{(item.amount || 0).toLocaleString()}</Text>
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
