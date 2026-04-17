import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, List, Button, Tag, Spin, Modal, Form, Select, App, Input, Space } from 'antd';
import { Users, UserPlus, Info, CheckCircle, Search, IndianRupee, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text } = Typography;

const VacantTickets = () => {
    const navigate = useNavigate();
    const { message, modal } = App.useApp();
    const queryClient = useQueryClient();
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [form] = Form.useForm();

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['vacant-tickets'],
        queryFn: async () => {
            const res = await api.get('/Collections/vacant-tickets');
            return res.data.data || res.data;
        }
    });

    const { data: members = [] } = useQuery({
        queryKey: ['all-members'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    const proposeMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Collections/propose-enrollment', payload);
            return res.data;
        },
        onSuccess: () => {
            message.success('Enrollment proposal submitted to office!');
            setSelectedTicket(null);
            queryClient.invalidateQueries(['vacant-tickets']);
        }
    });

    const handlePropose = (values) => {
        proposeMutation.mutate({
            ticketId: selectedTicket.ticketId,
            memberId: values.memberId
        });
    };

    if (isLoading) return <div className="p-12 text-center"><Spin size="large" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8 flex justify-between items-end">
                <div>
                   <Title level={2} className="!mb-0 flex items-center gap-3"><Gavel className="text-blue-500" /> New Opportunities</Title>
                   <Text className="text-slate-500">Recruit new subscribers for vacant tickets in active groups.</Text>
                </div>
                <div className="text-right">
                    <Title level={4} className="!mb-0 !text-blue-600">{tickets.length}</Title>
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Slots Available</Text>
                </div>
            </div>

            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden p-0" styles={{ body: { padding: 0 } }}>
                <div className="bg-slate-50 p-6 border-b flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <Search className="text-slate-400" size={20} />
                    </div>
                    <Input 
                        placeholder="Search by Group Name or Ticket Number..." 
                        size="large" 
                        variant="borderless" 
                        className="text-lg font-medium p-0"
                    />
                </div>

                <List
                    dataSource={tickets}
                    renderItem={(item) => (
                        <List.Item className="px-8 py-6 hover:bg-slate-50 transition-all border-b last:border-0 group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl border-2 border-blue-100">
                                        #{item.ticketNumber}
                                    </div>
                                    <div>
                                        <Title level={5} className="!mb-0">{item.groupName}</Title>
                                        <Space className="mt-1">
                                            <Tag color="blue" className="rounded-full border-none font-bold uppercase text-[9px] px-2 py-0.5 tracking-wider">
                                                ₹{item.chitValue.toLocaleString()} Value
                                            </Tag>
                                            <Tag color="cyan" className="rounded-full border-none font-bold uppercase text-[9px] px-2 py-0.5 tracking-wider">
                                                {item.duration} Months
                                            </Tag>
                                        </Space>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-right">
                                    <div>
                                        <Text className="text-[10px] uppercase font-black text-slate-400 block mb-0.5 tracking-widest">Monthly Due</Text>
                                        <Text className="text-slate-900 font-black text-xl">₹{item.monthlyInstallment.toLocaleString()}</Text>
                                    </div>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        icon={<UserPlus size={18}/>} 
                                        className="bg-slate-900 h-14 px-8 rounded-2xl font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                        onClick={() => setSelectedTicket(item)}
                                    >
                                        Enroll Subscriber
                                    </Button>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>

            <Modal
                open={!!selectedTicket}
                onCancel={() => setSelectedTicket(null)}
                title={null}
                footer={null}
                centered
                styles={{ content: { borderRadius: '32px', padding: 0, overflow: 'hidden' } }}
            >
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-slate-900 p-2 rounded-xl text-white">
                            <UserPlus size={24} />
                        </div>
                        <div>
                             <Title level={4} className="!mb-0">Ticket Enrollment</Title>
                             <Text className="text-slate-500">Proposing {selectedTicket?.groupName} • Ticket #{selectedTicket?.ticketNumber}</Text>
                        </div>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handlePropose}>
                        <Form.Item 
                            label={<span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-1">Select Member</span>} 
                            name="memberId" 
                            rules={[{ required: true, message: 'Select a member or register them first.' }]}
                        >
                            <Select 
                                size="large" 
                                className="h-14 rounded-xl" 
                                showSearch
                                placeholder="Start typing name or phone..."
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={members.map(m => ({ label: `${m.fullName} - ${m.phoneNumber}`, value: m.id }))}
                            />
                        </Form.Item>

                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4 mb-8">
                            <Info className="text-blue-500 shrink-0" size={24} />
                            <Text className="text-blue-700 text-xs font-medium">
                                Once submitted, office staff will verify and active this enrollment in the next audit cycle.
                            </Text>
                        </div>

                        <div className="flex gap-4">
                            <Button size="large" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setSelectedTicket(null)}>Discard</Button>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                size="large" 
                                className="flex-[2] h-14 bg-slate-900 border-none rounded-2xl font-black text-lg shadow-xl"
                                loading={proposeMutation.isPending}
                            >
                                Submit Proposal
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default VacantTickets;
