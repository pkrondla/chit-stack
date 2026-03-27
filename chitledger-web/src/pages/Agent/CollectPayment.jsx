import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, Select, InputNumber, App, Upload, Modal, Spin, Alert, Divider, Tag, Row, Col, List, Badge, Space } from 'antd';
import { Camera, MapPin, ScanQrCode, CheckCircle, Calculator, User, IndianRupee } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const { Title, Text } = Typography;

const CollectPayment = () => {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    
    // UI State
    const [showQr, setShowQr] = useState(false);
    const [coords, setCoords] = useState(null);
    const paymentMode = Form.useWatch('paymentMode', form) || 'Cash';
    const amount = Form.useWatch('amount', form) || 0;

    // Auto-capture location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("Location access denied", err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const { data: dues, isLoading } = useQuery({
        queryKey: ['member-dues', memberId],
        queryFn: async () => {
            const res = await api.get(`/Members/${memberId}/dues`);
            return res.data.data || res.data;
        }
    });

    const { data: settings } = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: async () => {
            const res = await api.get('/Settings');
            return res.data.data || res.data;
        }
    });

    const collectMutation = useMutation({
        mutationFn: async (payload) => {
            // Enhancement: Currently payload is JSON. If image upload needed, use FormData.
            // For now, we support standard pay endpoint which we enhanced to accept AgentId
            const res = await api.post('/Finance/pay', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Payment recorded successfully!');
            navigate('/agent/dashboard');
            queryClient.invalidateQueries(['agent-route']);
        },
        onError: (error) => {
            message.error('Selection failed: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleFinish = (values) => {
        const payload = {
            memberId: parseInt(memberId),
            amount: values.amount,
            paymentMode: values.paymentMode,
            referenceNumber: values.referenceNumber || '',
            agentId: user.id, // Current Agent ID
            latitude: coords?.lat,
            longitude: coords?.lng,
            paymentDate: new Date().toISOString()
        };
        collectMutation.mutate(payload);
    };

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;

    const upiLink = settings?.companyUpiId 
        ? `upi://pay?pa=${settings.companyUpiId}&pn=${encodeURIComponent(settings.companyUpiName || 'ChitLedger')}&am=${amount}&cu=INR`
        : null;

    return (
        <div className="max-w-5xl mx-auto pb-12 px-4 md:px-6 animate-fade-in">
            <div className="mb-8 flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-slate-200">
                       {dues?.memberName?.charAt(0)}
                   </div>
                   <div>
                       <Title level={3} className="!mb-0 !text-slate-800 tracking-tight">{dues?.memberName}</Title>
                       <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">
                           <User size={12} className="text-slate-300" /> Subscriber Account
                       </div>
                   </div>
               </div>
               {coords && <Tag color="blue" className="m-0 border-none rounded-xl px-4 py-1.5 h-auto text-[10px] uppercase font-black tracking-widest flex items-center gap-2 bg-blue-50 text-blue-600 shadow-sm"><MapPin size={12} fill="currentColor" fillOpacity={0.2}/> GPS Active</Tag>}
            </div>

            <Row gutter={[32, 32]}>
                {/* Left Column: Breakdowns - Expanded width to prevent truncation */}
                <Col xs={24} lg={15}>
                    <div className="mb-6 px-1">
                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 block ml-2">Outstanding Breakdown</Text>
                        <div className="flex flex-col gap-3">
                            {dues?.ticketDues?.map(ticket => (
                                <div key={ticket.ticketId} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-8">
                                    <div className="bg-slate-50 pt-12 pb-8 flex justify-between items-center border-b border-slate-100" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                        <Space size="middle">
                                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-slate-200">
                                                #{ticket.ticketNumber}
                                            </div>
                                            <div className="flex flex-col ml-3">
                                                <Title level={4} className="!mb-0 !text-slate-800 leading-tight tracking-tight">{ticket.groupName}</Title>
                                                <Text className="text-xs text-slate-400 font-black uppercase tracking-widest mt-2 opacity-60">Ticket Reference ID # {ticket.ticketNumber}</Text>
                                            </div>
                                        </Space>
                                        <Text className="font-black text-slate-900 text-2xl tracking-tighter shrink-0">₹{(ticket.totalDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </div>

                                    <List
                                        className="py-6"
                                        dataSource={ticket.installments}
                                        renderItem={(inst) => (
                                            <List.Item className="py-10 hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0 rounded-3xl group" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                                <div className="flex items-center justify-between w-full gap-8">
                                                    {/* Left: Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Text strong className="text-slate-700 text-base">Installment #{inst.installmentNumber}</Text>
                                                            <Badge status="processing" text={<Text type="secondary" className="text-[11px] font-medium ml-1">Due {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>} />
                                                        </div>
                                                        <div className="inline-flex items-center bg-slate-100/60 px-4 py-1.5 rounded-xl border border-slate-200/50">
                                                            <Text className="text-[11px] text-slate-500 font-bold tracking-tight">
                                                                ₹{inst.grossPrincipal.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase ml-0.5">(G)</span>
                                                                <span className="mx-2 text-slate-300">-</span>
                                                                {inst.dividend.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase ml-0.5">(D)</span>
                                                                <span className="mx-2 text-slate-300">+</span>
                                                                {inst.pendingPenalty.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase ml-0.5">(P)</span>
                                                            </Text>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Right: Amount - Fixed right alignment */}
                                                    <div className="text-right shrink-0">
                                                        <Text className="font-black text-slate-900 text-xl block mb-1 group-hover:scale-110 transition-transform origin-right">
                                                            ₹{inst.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </Text>
                                                        <Tag color="success" className="mr-0 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 bg-green-50 text-green-600 rounded-md">Pending Due</Tag>
                                                    </div>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Col>

                {/* Right Column: Summaries - Slightly narrower for balance */}
                <Col xs={24} lg={9}>
                    <div className="sticky top-6 flex flex-col gap-3">
                        <Card className="shadow-2xl border-0 rounded-[2.5rem] mb-8 bg-rose-50 border-l-[10px] border-rose-500 overflow-hidden" styles={{ body: { padding: '1rem 1rem' } }}>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center px-1">
                                    <Text className="text-rose-900/60 font-black text-[11px] uppercase tracking-widest">Gross Principal</Text>
                                    <Text className="font-black text-rose-900 text-base">₹{(dues?.totalGrossPrincipal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <Text className="text-green-600 font-black text-[11px] uppercase tracking-widest">Earned Dividend</Text>
                                    <Text className="font-black text-green-600 text-base">- ₹{(dues?.totalDividend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </div>
                                <div className="flex justify-between items-center pb-6 border-b border-rose-200/50 px-1">
                                    <Text className="text-rose-900/60 font-black text-[11px] uppercase tracking-widest">Late Fees (Penalty)</Text>
                                    <Text className="font-black text-rose-900 text-base">+ ₹{(dues?.totalPendingPenalty || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </div>
                                
                                <div className="flex justify-end pt-4 px-1">
                                    <Title level={1} className="!text-rose-600 !mb-0 font-black !text-5xl tracking-tighter shadow-rose-100 drop-shadow-sm">
                                        ₹{dues?.totalDue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Title>
                                </div>
                            </div>
                        </Card>

                        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ paymentMode: 'Cash', amount: dues?.totalDue }}>
                            <Card className="shadow-xl border-0 rounded-[2.5rem] p-6 bg-white/60 backdrop-blur-xl border border-white/40">
                                <div className="space-y-5 mb-8">
                                    <Form.Item 
                                        label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Amount to Collect</span>} 
                                        name="amount" 
                                        rules={[{ required: true, message: 'Required' }]}
                                        className="!mb-0"
                                    >
                                        <InputNumber 
                                            className="text-2xl font-black h-16 rounded-2xl flex items-center bg-white shadow-inner border-slate-100" 
                                            style={{ width: '100%', textAlign: 'right' }}
                                            controls={false}
                                            size="large" 
                                            prefix={<span className="text-slate-300 font-normal text-xs uppercase italic tracking-widest">INR</span>}
                                            formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>

                                    <Form.Item 
                                        label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Payment Mode</span>} 
                                        name="paymentMode" 
                                        rules={[{ required: true }]}
                                        className="!mb-0"
                                    >
                                        <Select size="large" className="h-16 rounded-2xl" dropdownStyle={{ borderRadius: '16px' }}>
                                            <Select.Option value="Cash">💵 &nbsp; Cash Payment</Select.Option>
                                            <Select.Option value="UPI">📱 &nbsp; Online UPI / QR</Select.Option>
                                            <Select.Option value="Cheque">📄 &nbsp; Bank Cheque</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </div>

                                {paymentMode === 'UPI' && (
                                    <div className="mb-6 bg-slate-900 p-6 rounded-[2rem] shadow-indigo-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                                        <Button 
                                            type="primary" 
                                            icon={<ScanQrCode size={20} />} 
                                            block 
                                            size="large" 
                                            className="bg-blue-600 border-none h-14 font-black mb-4 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            onClick={() => setShowQr(true)}
                                        >
                                            Generate Payment QR
                                        </Button>
                                        {!settings?.companyUpiId && <Alert message="Merchant UPI not configured" type="warning" showIcon className="bg-white/10 text-white border-0 mb-4 py-2" />}
                                        <Form.Item 
                                            label={<span className="font-bold text-blue-200 uppercase text-[10px] tracking-widest pl-1">UTR / Transaction ID</span>} 
                                            name="referenceNumber" 
                                            rules={[{ required: true, message: 'Required' }]}
                                            className="!mb-0"
                                        >
                                            <Input size="large" placeholder="Transaction Reference" className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl" />
                                        </Form.Item>
                                    </div>
                                )}

                                {paymentMode === 'Cheque' && (
                                    <Form.Item 
                                        label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Cheque Info</span>} 
                                        name="referenceNumber" 
                                        rules={[{ required: true, message: 'Required' }]}
                                        className="mb-6 px-1"
                                    >
                                        <Input size="large" className="h-16 rounded-2xl bg-white" placeholder="6-digit Cheque Number" maxLength={6} />
                                    </Form.Item>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    <Form.Item label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Image Proof (Optional)</span>} name="photo" className="!mb-2">
                                        <Upload beforeUpload={() => false} maxCount={1} accept="image/*" capture="camera">
                                            <Button icon={<Camera size={20} />} size="large" block className="h-16 border-2 border-dashed border-slate-200 rounded-2xl font-bold text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                                                Activate Camera
                                            </Button>
                                        </Upload>
                                    </Form.Item>

                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        size="large" 
                                        block
                                        icon={!collectMutation.isPending && <CheckCircle size={22} />}
                                        className="bg-slate-900 h-16 text-lg font-black rounded-2xl shadow-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                                        loading={collectMutation.isPending}
                                    >
                                        {collectMutation.isPending ? 'Processing Payment...' : 'Complete Collection'}
                                    </Button>
                                </div>
                            </Card>
                        </Form>
                    </div>
                </Col>
            </Row>

            <Modal
                open={showQr}
                onCancel={() => setShowQr(false)}
                footer={null}
                centered
                styles={{ content: { borderRadius: '32px', padding: 0, overflow: 'hidden' } }}
            >
                <div className="text-center bg-white">
                    <div className="bg-slate-900 p-8 text-white">
                        <Title level={4} className="!text-white !mb-2 flex items-center justify-center gap-2">
                             <ScanQrCode size={24} className="text-blue-400" /> UPI QR Code
                        </Title>
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Amount to Pay: ₹{amount.toLocaleString()}</Text>
                    </div>

                    <div className="p-8">
                        <div className="bg-white p-6 inline-block rounded-3xl shadow-inner border-2 border-slate-100 mb-6">
                            <QRCode value={upiLink || ''} size={220} />
                        </div>
                        
                        <div className="text-slate-500">
                            <Text className="block text-[8px] uppercase font-black tracking-[0.3em] text-slate-300 mb-1">Registered Merchant</Text>
                            <Title level={3} className="!mt-0 !mb-1 text-slate-900 font-bold">{settings?.companyUpiName || 'ChitLedger'}</Title>
                            <Text strong className="text-blue-600 block text-lg font-mono tracking-widest border-2 border-blue-50 py-2 rounded-xl bg-blue-50/30">{settings?.companyUpiId}</Text>
                            
                            <Divider plain className="border-slate-100 my-8 italic text-slate-400 text-xs">Verify after payment</Divider>
                            
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <span className="text-slate-500 font-bold uppercase text-[10px]">Settlement Amount</span>
                                <span className="font-black text-slate-900 text-2xl">₹{amount.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <Button 
                            type="primary" 
                            block 
                            size="large" 
                            className="bg-slate-900 h-16 mt-8 rounded-2xl font-black text-lg shadow-xl"
                            onClick={() => setShowQr(false)}
                        >
                            Confirm Payment Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CollectPayment;
