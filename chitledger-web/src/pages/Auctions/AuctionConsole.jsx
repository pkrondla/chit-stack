import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Form, InputNumber, Select, Tag, message, Spin, Divider } from 'antd';
import { Calculator, ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title, Text } = Typography;

const AuctionConsole = () => {
    const { auctionId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const [calculations, setCalculations] = useState({
        commission: 0,
        distributable: 0,
        dividend: 0,
        payable: 0
    });

    const { data: auction, isLoading } = useQuery({
        queryKey: ['auction', auctionId],
        queryFn: async () => {
            const response = await api.get('/Auctions');
            const auctionsList = response.data.data || response.data || [];
            return auctionsList.find(a => String(a.id) === String(auctionId));
        }
    });

    const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
        queryKey: ['tickets', auction?.chitGroupId],
        queryFn: async () => {
            const res = await api.get(`/ChitGroups/${auction.chitGroupId}/tickets`);
            return res.data.data || [];
        },
        enabled: !!auction?.chitGroupId
    });

    const closeMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Auctions/close', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Auction Closed Successfully!');
            queryClient.invalidateQueries({ queryKey: ['auctions'] });
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
            navigate('/auctions');
        },
        onError: () => {
            message.error('Failed to close auction');
        }
    });

    const bidMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Auctions/proxy-bid', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success("Bid Placed!");
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        },
        onError: (error) => {
            message.error("Bid Failed: " + (error.response?.data?.error || error.message));
        }
    });

    const calculate = (bidAmount) => {
        if (!auction) return;

        const chitValue = auction.chitValue || 0;
        const totalMembers = auction.durationMonths || 1;
        const commissionRate = (auction.foremanCommissionPercent || 5) / 100;

        const currentBid = parseFloat(bidAmount) || auction.winningBidAmount || 0;
        const commission = chitValue * commissionRate;
        const distributable = currentBid - commission;
        const dividend = distributable > 0 ? (distributable / totalMembers) : 0;
        const payable = chitValue - currentBid;

        setCalculations({ commission, distributable, dividend, payable });
    };

    useEffect(() => {
        if (auction && tickets.length > 0) {
            // Pre-fill for Foreman if it's the first installment and no winner yet
            if (auction.installmentNumber === 1 && !auction.winningTicketId && !form.getFieldValue('winningTicketId')) {
                const foremanTicket = tickets.find(t => t.isForeman || t.ticketNumber === 1);
                if (foremanTicket) {
                    form.setFieldsValue({
                        winningTicketId: foremanTicket.ticketNumber,
                        memberTicketId: foremanTicket.id,
                        bidAmount: 0
                    });
                    calculate(0);
                }
            } else {
                calculate(form.getFieldValue('bidAmount'));
            }
        }
    }, [auction, tickets, form]);

    const handleValuesChange = (changedValues, allValues) => {
        if ('bidAmount' in changedValues) {
            calculate(allValues.bidAmount);
        }

        // Sync ticket number and member selection
        if ('winningTicketId' in changedValues) {
            const ticketId = changedValues.winningTicketId;
            const ticket = tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
            if (ticket && ticket.id !== allValues.memberTicketId) {
                form.setFieldsValue({ memberTicketId: ticket.id });
            } else if (!ticket) {
                form.setFieldsValue({ memberTicketId: null });
            }
        }

        if ('memberTicketId' in changedValues) {
            const ticketId = changedValues.memberTicketId;
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket && ticket.ticketNumber !== allValues.winningTicketId) {
                form.setFieldsValue({ winningTicketId: ticket.ticketNumber });
            }
        }
    };

    const handleProxyBid = () => {
        form.validateFields(['winningTicketId', 'bidAmount']).then(values => {
            const ticket = tickets.find(t => t.ticketNumber === values.winningTicketId);
            bidMutation.mutate({
                auctionId: parseInt(auctionId),
                ticketId: ticket ? ticket.id : parseInt(values.winningTicketId),
                bidAmount: parseFloat(values.bidAmount)
            });
        });
    };

    const handleCloseAuction = () => {
        form.validateFields(['winningTicketId', 'bidAmount']).then(values => {
            const ticket = tickets.find(t => t.ticketNumber === values.winningTicketId);
            closeMutation.mutate({
                auctionId: parseInt(auctionId),
                winningTicketId: ticket ? ticket.id : (values.winningTicketId || 1),
                winningBidAmount: parseFloat(values.bidAmount) || (auction ? auction.winningBidAmount : 0)
            });
        });
    };

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (!auction) return <div className="text-center p-12 text-slate-500">Auction not found</div>;

    const isClosed = auction.auctionStatus === 'Closed';

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <Button
                type="text"
                icon={<ArrowLeft size={18} />}
                onClick={() => navigate('/auctions')}
                className="mb-4 text-slate-500 hover:text-slate-800 flex items-center"
            >
                Back to Board
            </Button>

            <Card className="shadow-md border-0 rounded-xl" styles={{ body: { padding: '2rem' } }}>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Title level={2} className="!mb-1 text-slate-800">{auction.groupName}</Title>
                        <Text className="text-slate-500 text-base">
                            Installment #{auction.installmentNumber} • {new Date(auction.auctionDate).toLocaleDateString()}
                        </Text>
                    </div>
                    <Tag
                        color={isClosed ? 'success' : 'warning'}
                        className="px-4 py-2 rounded-full font-bold text-sm m-0"
                    >
                        {auction.auctionStatus}
                    </Tag>
                </div>

                {isClosed ? (
                    <div className="text-center p-12 bg-slate-50 rounded-xl">
                        <CheckCircle size={56} className="text-green-700 mx-auto mb-4" />
                        <Title level={3} className="!mb-2">Auction Completed</Title>
                        <Text className="text-lg block mb-6">Winning Bid: ₹{auction.winningBidAmount?.toLocaleString()}</Text>
                        <Button
                            icon={<FileText size={18} />}
                            size="large"
                            onClick={() => downloadFile(`/forms/minutes/${auction.id}`, `Form_VIII_Auction_${auction.id}.pdf`)}
                        >
                            Download Minutes (Form VIII)
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Input Section */}
                        <div>
                            <Title level={4} className="flex items-center gap-2 !mb-6 text-slate-700">
                                <Calculator size={22} /> Proxy Bidding & Closing
                            </Title>

                            <Card className="bg-slate-50 border-slate-200 mb-8 shadow-none" styles={{ body: { padding: '1.5rem' } }}>
                                <Title level={5} className="!mb-4">Place Proxy Bid</Title>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onValuesChange={handleValuesChange}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Form.Item
                                            name="memberTicketId"
                                            label="Subscriber Name"
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select Member"
                                                showSearch
                                                optionFilterProp="children"
                                                loading={isLoadingTickets}
                                            >
                                                {tickets.map(t => (
                                                    <Select.Option key={t.id} value={t.id}>
                                                        {t.memberName} (#{t.ticketNumber}) {t.isForeman && " [FOREMAN]"}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            name="winningTicketId"
                                            label="Ticket #"
                                            rules={[{ required: true, message: 'Required' }]}
                                        >
                                            <InputNumber className="w-full" size="large" placeholder="Ticket #" />
                                        </Form.Item>
                                    </div>
                                    <Form.Item
                                        name="bidAmount"
                                        label="Bid Amount (Discount)"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber
                                            className="w-full"
                                            size="large"
                                            placeholder="0.00"
                                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value?.replace(/\₹\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                    <Button
                                        block
                                        size="large"
                                        onClick={handleProxyBid}
                                        loading={bidMutation.isPending}
                                        className="font-semibold text-slate-800 border-slate-800"
                                    >
                                        Place Proxy Bid
                                    </Button>
                                </Form>
                            </Card>

                            <div>
                                <Title level={5} className="!mb-2 text-red-700">Close Auction</Title>
                                <Text className="text-slate-500 block mb-6">
                                    Finalizes the auction with the <strong>Current Winner</strong>. Ensure all bids are in.
                                </Text>
                                <Button
                                    type="primary"
                                    danger
                                    block
                                    size="large"
                                    onClick={handleCloseAuction}
                                    loading={closeMutation.isPending}
                                    className="font-bold h-12 text-lg"
                                >
                                    Confirm & Close Auction
                                </Button>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="bg-slate-100 p-8 rounded-xl border border-slate-200">
                            <Title level={4} className="!mb-6 text-slate-700">Current Status</Title>

                            <div className="text-center p-6 bg-white rounded-xl shadow-sm mb-8">
                                <Text className="text-slate-500 block mb-2">Current Highest Bid</Text>
                                <div className="text-5xl font-bold text-slate-800 mb-2">
                                    ₹{auction.winningBidAmount?.toLocaleString() || '0'}
                                </div>
                                <Text className="text-green-700 font-semibold">
                                    Held by Ticket #{auction.winningTicketId || '-'}
                                </Text>
                            </div>

                            <Title level={5} className="!mb-4">Projected Settlement</Title>

                            <div className="flex justify-between py-2 border-b border-slate-200">
                                <Text className="text-slate-500">Bid Amount (Discount)</Text>
                                <Text strong>₹{(form.getFieldValue('bidAmount') || auction.winningBidAmount || 0).toLocaleString()}</Text>
                            </div>

                            <div className="flex justify-between py-2 border-b border-slate-200">
                                <Text className="text-slate-500">Foreman Commission ({auction.foremanCommissionPercent || 5}%)</Text>
                                <Text strong>₹{calculations.commission.toLocaleString()}</Text>
                            </div>

                            <div className="flex justify-between py-2 border-b border-slate-200">
                                <Text className="text-slate-500">Distributable Dividend</Text>
                                <Text strong className="text-green-700">₹{calculations.distributable.toLocaleString()}</Text>
                            </div>

                            <div className="flex justify-between py-4">
                                <Text className="text-slate-500">Dividend / Member</Text>
                                <Tag color="success" className="m-0 text-base py-1 px-3 font-bold rounded-lg">
                                    ₹{calculations.dividend.toLocaleString()}
                                </Tag>
                            </div>

                            <Divider className="my-4 border-slate-300" />

                            <div className="text-center mt-6">
                                <Text className="text-slate-500 block mb-2">Net Amount Payable to Winner</Text>
                                <div className="text-4xl font-bold text-slate-800">
                                    ₹{calculations.payable.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AuctionConsole;
