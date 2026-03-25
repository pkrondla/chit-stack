import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, Select, InputNumber, App, Upload, Modal, Spin, Alert, Divider } from 'antd';
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
            const res = await api.get('/Settings/tenant');
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
        <div className="max-w-md mx-auto pb-24">
            <div className="mb-8 flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                   {dues?.memberName?.charAt(0)}
               </div>
               <div className="flex-1">
                   <Title level={4} className="!mb-0">{dues?.memberName}</Title>
                   <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                       <User size={12} /> Subscriber Details
                   </div>
               </div>
               {coords && <Tag color="blue" className="m-0 border-none rounded-md flex items-center gap-1"><MapPin size={10}/> GPS On</Tag>}
            </div>

            <Card className="shadow-2xl border-0 rounded-3xl mb-8 bg-rose-50 border-l-8 border-rose-500" styles={{ body: { padding: '1.5rem' } }}>
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-rose-900 font-bold uppercase text-[10px] tracking-[0.2em] block mb-1">Total Outstanding</Text>
                        <Title level={2} className="!text-rose-600 !mb-0 font-black">
                            ₹{dues?.totalDue?.toLocaleString()}
                        </Title>
                    </div>
                    <div className="bg-rose-200/50 p-2 rounded-xl text-rose-600">
                        <Calculator size={24} />
                    </div>
                </div>
            </Card>

            <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ paymentMode: 'Cash', amount: dues?.totalDue }}>
                <Card className="shadow-xl border-0 rounded-3xl mb-8">
                    <Form.Item 
                        label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Amount to Collect</span>} 
                        name="amount" 
                        rules={[{ required: true, message: 'Please enter amount' }]}
                    >
                        <InputNumber 
                            className="w-full text-2xl font-black h-14 rounded-xl flex items-center bg-slate-50" 
                            size="large" 
                            prefix="₹" 
                            formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={val => val.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item 
                        label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Payment Mode</span>} 
                        name="paymentMode" 
                        rules={[{ required: true }]}
                    >
                        <Select size="large" className="h-14 rounded-xl collection-select" dropdownStyle={{ borderRadius: '12px' }}>
                            <Select.Option value="Cash">💵 &nbsp; Cash Payment</Select.Option>
                            <Select.Option value="UPI">📱 &nbsp; UPI / PhonePe / GPay</Select.Option>
                            <Select.Option value="Cheque">📄 &nbsp; Bank Cheque</Select.Option>
                        </Select>
                    </Form.Item>

                    {paymentMode === 'UPI' && (
                        <div className="mb-6 bg-slate-900 p-6 rounded-2xl shadow-indigo-200 shadow-lg animate-in fade-in zoom-in duration-300">
                            <Button 
                                type="primary" 
                                icon={<ScanQrCode size={18} />} 
                                block 
                                size="large" 
                                className="bg-blue-600 border-none h-14 font-black mb-4 shadow-xl hover:scale-105 transition-transform"
                                onClick={() => setShowQr(true)}
                            >
                                Show Payment QR
                            </Button>
                            {!settings?.companyUpiId && <Alert message="Company UPI not set in settings" type="warning" showIcon className="bg-white/10 text-white border-0 mb-4" />}
                            <Form.Item 
                                label={<span className="font-bold text-blue-200 uppercase text-[10px] tracking-widest pl-1">Transaction Ref No.</span>} 
                                name="referenceNumber" 
                                rules={[{ required: true, message: 'Reference is required for UPI' }]}
                            >
                                <Input size="large" placeholder="UTR / Ref ID" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                            </Form.Item>
                        </div>
                    )}

                    {paymentMode === 'Cheque' && (
                         <Form.Item 
                            label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Cheque Number</span>} 
                            name="referenceNumber" 
                            rules={[{ required: true, message: 'Cheque number is required' }]}
                         >
                            <Input size="large" className="h-14 rounded-xl" placeholder="6-digit bank cheque number" maxLength={6} />
                        </Form.Item>
                    )}

                    <Form.Item label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Capture Proof (Optional)</span>} name="photo">
                        <Upload 
                            beforeUpload={() => false} 
                            maxCount={1} 
                            accept="image/*"
                            capture="camera"
                        >
                            <Button icon={<Camera size={20} />} size="large" block className="h-16 border-2 border-dashed border-slate-200 rounded-2xl font-bold text-slate-400 bg-slate-50/50">
                                Open Camera
                            </Button>
                        </Upload>
                    </Form.Item>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large" 
                        block 
                        className="bg-slate-900 h-16 text-lg font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        loading={collectMutation.isPending}
                    >
                        {collectMutation.isPending ? 'Processing...' : <><CheckCircle size={20}/> Confirm Collection</>}
                    </Button>
                </div>
            </Form>

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
