import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Form, InputNumber, Select, Tag, message, Spin, Divider, Tabs, List, Switch, Avatar } from 'antd';
import { Calculator, ArrowLeft, CheckCircle, FileText, UserCheck, Users, Gavel, Activity, Globe, Smartphone, Building2, Clock } from 'lucide-react';
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

    const [attendance, setAttendance] = useState([]);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [duration, setDuration] = useState(5);
    const [isEditing, setIsEditing] = useState(false);
    const [bidHistory, setBidHistory] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const startMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Auctions/start', payload);
            return res.data;
        },
        onSuccess: () => {
            message.success('Auction Started!');
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        },
        onError: (err) => {
            message.error(err.response?.data?.error || 'Failed to start auction');
        }
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

    const { data: settings } = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data || res.data;
        }
    });

    const maxCapPercent = settings?.maxBiddingDiscountPercent || 40;

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

    const updateMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.put('/Auctions/update-payout', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Auction Results Updated!');
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        },
        onError: (err) => {
            message.error(err.response?.data?.error || 'Failed to update results');
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

    const fetchAttendance = async () => {
        setIsAttendanceLoading(true);
        try {
            const res = await api.get(`/Auctions/${auctionId}/attendance`);
            setAttendance(res.data.data || []);
        } catch (e) {
            console.error("Failed to fetch attendance", e);
        } finally {
            setIsAttendanceLoading(false);
        }
    };

    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await api.get(`/Auctions/${auctionId}/bids`);
            setBidHistory(res.data.data || []);
        } catch (e) {
            console.error("Failed to fetch bids", e);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (auctionId) {
            fetchAttendance();
            fetchHistory();
        }
    }, [auctionId]);

    const handleAttendanceToggle = async (ticketId, isPresent) => {
        try {
            await api.post('/Auctions/attendance', {
                auctionId: parseInt(auctionId),
                ticketId,
                isPresent
            });
            setAttendance(prev => prev.map(a => a.ticketId === ticketId ? { ...a, isPresent } : a));
            // Show message only if it's a manual toggle
            message.success(`${isPresent ? 'Present' : 'Absent'} marked`);
        } catch (e) {
            message.error("Failed to update attendance");
        }
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
        form.validateFields(['winningTicketId', 'bidAmount', 'source']).then(values => {
            const ticket = tickets.find(t => t.ticketNumber === values.winningTicketId);
            bidMutation.mutate({
                auctionId: parseInt(auctionId),
                ticketId: ticket ? ticket.id : parseInt(values.winningTicketId),
                bidAmount: parseFloat(values.bidAmount),
                source: values.source || "Office"
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
                onClick={() => isEditing ? setIsEditing(false) : navigate('/auctions')}
                className="mb-4 text-slate-500 hover:text-slate-800 flex items-center"
            >
                {isEditing ? 'Cancel Edit' : 'Back to Board'}
            </Button>

            <Card className="shadow-md border-0 rounded-xl" styles={{ body: { padding: '1.5rem' } }}>
                <div className="flex justify-between items-start mb-6 px-4">
                    <div>
                        <Title level={2} className="!mb-1 text-slate-800">{auction.groupName}</Title>
                        <Text className="text-slate-500 text-base">
                            Installment #{auction.installmentNumber} • {new Date(auction.auctionDate).toLocaleDateString()}
                        </Text>
                    </div>
                    <Tag
                        color={isClosed ? 'success' : (auction.auctionStatus === 'Live' ? 'processing' : 'warning')}
                        className="px-4 py-2 rounded-full font-bold text-sm m-0"
                    >
                        {auction.auctionStatus === 'Live' ? '🔴 LIVE' : auction.auctionStatus}
                    </Tag>
                </div>

                <Tabs defaultActiveKey="2" className="px-4" items={[
                    {
                        key: '1',
                        label: <span className="flex items-center gap-2 px-2"><Calculator size={18} /> Auction Control</span>,
                        children: (
                            <div className="pt-4">
                                {auction.auctionStatus === 'Scheduled' || auction.auctionStatus === 'Open' ? (
                                    <div className="text-center p-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <Gavel size={64} className="text-slate-300 mx-auto mb-4" />
                                        <Title level={3} className="text-slate-400">Auction Not Started</Title>
                                        <Text className="text-slate-400 block mb-6 px-12">
                                            Please complete physical attendance check-in and click "Start Auction" from the Attendance tab to begin the bidding process.
                                        </Text>
                                    </div>
                                ) : isClosed && !isEditing ? (
                                    <div className="max-w-2xl mx-auto">
                                        <Card className="bg-slate-50 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="bg-green-700 p-6 text-center text-white">
                                                <CheckCircle size={48} className="mx-auto mb-3" />
                                                <Title level={3} className="!text-white !mb-0">Auction Completed</Title>
                                                <Text className="text-green-100 italic">Financial settlement finalized</Text>
                                            </div>

                                            <div className="p-8">
                                                <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-200">
                                                    <Text className="text-slate-400 uppercase font-bold text-[10px] tracking-widest mb-2">Auction Winner</Text>
                                                    <Title level={4} className="!mb-1">{auction.winnerName || 'Unknown'}</Title>
                                                    <Tag color="blue" className="px-4 py-1 rounded-full font-bold">Ticket #{auction.winningTicketNumber || auction.winningTicketId}</Tag>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 mb-10">
                                                    <div className="text-center">
                                                        <Text className="text-slate-400 block mb-1 text-xs">Winning Bid (Discount)</Text>
                                                        <Text className="text-xl font-bold">₹{auction.winningBidAmount?.toLocaleString()}</Text>
                                                    </div>
                                                    <div className="text-center">
                                                        <Text className="text-slate-400 block mb-1 text-xs">Foreman Commission</Text>
                                                        <Text className="text-xl font-bold">₹{auction.foremanCommissionAmount?.toLocaleString()}</Text>
                                                    </div>
                                                    <div className="text-center">
                                                        <Text className="text-slate-400 block mb-1 text-xs">Total Dividend pool</Text>
                                                        <Text className="text-xl font-bold text-green-700">₹{(auction.winningBidAmount - auction.foremanCommissionAmount).toLocaleString()}</Text>
                                                    </div>
                                                    <div className="text-center">
                                                        <Text className="text-slate-400 block mb-1 text-xs">Dividend / Member</Text>
                                                        <Tag color="success" className="font-bold text-sm">₹{auction.dividendAmount?.toLocaleString()}</Tag>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center mb-10">
                                                    <Text className="text-slate-400 block mb-1 text-sm font-semibold uppercase tracking-wider">Net Payable to Winner</Text>
                                                    <div className="text-4xl font-black text-slate-800">
                                                        ₹{auction.netPayableAmount?.toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <Button
                                                        type="primary"
                                                        icon={<FileText size={18} />}
                                                        size="large"
                                                        className="h-12 font-bold bg-slate-800"
                                                        onClick={() => downloadFile(`/forms/minutes/${auction.id}`, `Form_VIII_Auction_${auction.id}.pdf`)}
                                                    >
                                                        Download Minutes (Form VIII)
                                                    </Button>
                                                    <Button
                                                        icon={<Calculator size={18} />}
                                                        size="large"
                                                        className="h-12 font-bold border-slate-200 text-slate-600"
                                                        onClick={() => {
                                                            setIsEditing(true);
                                                            const ticket = tickets.find(t => t.id === auction.winningTicketId);
                                                            form.setFieldsValue({
                                                                memberTicketId: auction.winningTicketId,
                                                                winningTicketId: ticket ? ticket.ticketNumber : null,
                                                                bidAmount: auction.winningBidAmount
                                                            });
                                                            calculate(auction.winningBidAmount);
                                                        }}
                                                    >
                                                        Edit Completion Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Input Section */}
                                        <div>
                                            <Title level={4} className="flex items-center gap-2 !mb-6 text-slate-700">
                                                <Calculator size={22} /> {isEditing ? 'Correct Auction Results' : 'Proxy Bidding & Closing'}
                                            </Title>

                                            <Card className="bg-slate-50 border-slate-200 mb-8 shadow-none" styles={{ body: { padding: '1.5rem' } }}>
                                                <Title level={5} className="!mb-4">{isEditing ? 'Winner Details' : 'Place Proxy Bid'}</Title>
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
                                                                {tickets
                                                                    .filter(t => !t.isPrized || (isEditing && t.id === auction?.winningTicketId))
                                                                    .map(t => (
                                                                        <Select.Option key={t.id} value={t.id}>
                                                                            {t.memberName} (#{t.ticketNumber}) {t.isForeman && " [FOREMAN]"}
                                                                        </Select.Option>
                                                                    ))}
                                                            </Select>
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="winningTicketId"
                                                            label="Ticket #"
                                                            rules={[
                                                                { required: true, message: 'Required' },
                                                                {
                                                                    validator: (_, value) => {
                                                                        if (!value) return Promise.resolve();
                                                                        const ticket = tickets.find(t => t.ticketNumber === value);
                                                                        if (ticket && ticket.isPrized && !(isEditing && ticket.id === auction?.winningTicketId)) {
                                                                            return Promise.reject('This ticket is already prized!');
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                }
                                                            ]}
                                                        >
                                                            <InputNumber className="w-full" size="large" placeholder="Ticket #" />
                                                        </Form.Item>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Form.Item
                                                            name="bidAmount"
                                                            label="Bid Amount (Discount)"
                                                            rules={[
                                                                { required: true, message: 'Required' },
                                                                {
                                                                    validator: (_, value) => {
                                                                        if (value === undefined || value === null) return Promise.resolve();
                                                                        const chitValue = auction?.chitValue || 0;
                                                                        const maxBid = chitValue * (maxCapPercent / 100);
                                                                        const foremanComm = chitValue * (auction?.foremanCommissionPercent / 100);

                                                                        if (value > maxBid) {
                                                                            return Promise.reject(`Bid exceeds the maximum allowed discount of ${maxCapPercent}% (₹${maxBid.toLocaleString()})`);
                                                                        }
                                                                        if (value < foremanComm && auction?.installmentNumber > 1) {
                                                                            return Promise.reject(`Bid must be at least the Foreman Commission of ₹${foremanComm.toLocaleString()}`);
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                }
                                                            ]}
                                                        >
                                                            <InputNumber
                                                                className="w-full"
                                                                size="large"
                                                                placeholder="0.00"
                                                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                parser={value => value?.replace(/\₹\s?|(,*)/g, '')}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="source"
                                                            label="Bid Method"
                                                            initialValue="Office"
                                                        >
                                                            <Select size="large">
                                                                <Select.Option value="Office">Physical (Office)</Select.Option>
                                                                <Select.Option value="Web">Web Portal</Select.Option>
                                                                <Select.Option value="Mobile">Mobile App</Select.Option>
                                                            </Select>
                                                        </Form.Item>
                                                    </div>
                                                    {!isEditing && (
                                                        <Button
                                                            block
                                                            size="large"
                                                            onClick={handleProxyBid}
                                                            loading={bidMutation.isPending}
                                                            className="font-semibold text-slate-800 border-slate-800"
                                                        >
                                                            Place Proxy Bid
                                                        </Button>
                                                    )}
                                                </Form>
                                            </Card>

                                            <div>
                                                <Title level={5} className={`!mb-2 ${isEditing ? 'text-blue-700' : 'text-red-700'}`}>{isEditing ? 'Save Corrections' : 'Close Auction'}</Title>
                                                <Text className="text-slate-500 block mb-6">
                                                    {isEditing
                                                        ? 'This will update the winning bid and winner for this installment.'
                                                        : 'Finalizes the auction with the Current Winner. Ensure all bids are in.'}
                                                </Text>
                                                <Button
                                                    type="primary"
                                                    danger={!isEditing}
                                                    block
                                                    size="large"
                                                    onClick={() => {
                                                        if (isEditing) {
                                                            const values = form.getFieldsValue();
                                                            updateMutation.mutate({
                                                                auctionId: parseInt(auctionId),
                                                                winningTicketId: values.memberTicketId,
                                                                winningBidAmount: values.bidAmount
                                                            });
                                                        } else {
                                                            handleCloseAuction();
                                                        }
                                                    }}
                                                    loading={closeMutation.isPending || updateMutation.isPending}
                                                    className="font-bold h-12 text-lg"
                                                >
                                                    {isEditing ? 'Update Auction Results' : 'Confirm & Close Auction'}
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
                                                <Text className="text-slate-500">Distributable Dividend (Gross)</Text>
                                                <Text strong className="text-blue-600">₹{calculations.distributable.toLocaleString()}</Text>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-slate-200">
                                                <Text className="text-slate-500">TDS Deduction ({settings?.tdsPercent || 0}%)</Text>
                                                <Text strong className="text-red-500">-₹{((calculations.distributable * (settings?.tdsPercent || 0)) / 100).toLocaleString()}</Text>
                                            </div>

                                            <div className="flex justify-between py-4">
                                                <Text className="text-slate-500">Net Dividend / Member</Text>
                                                <Tag color="success" className="m-0 text-base py-1 px-3 font-bold rounded-lg">
                                                    ₹{((calculations.distributable * (1 - (settings?.tdsPercent || 0) / 100)) / (tickets.length || 1)).toLocaleString()}
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
                            </div>
                        )
                    },
                    {
                        key: '2',
                        label: (
                            <span className="flex items-center gap-2 px-2">
                                <UserCheck size={18} />
                                Attendance ({attendance.length > 0 ? attendance.filter(a => a.isPresent).length : 0}/{attendance.length > 0 ? attendance.length : tickets.length})
                            </span>
                        ),
                        children: (
                            <div className="pt-4 max-w-2xl mx-auto">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex-1">
                                        <Title level={4} className="!mb-1">Auction Setup</Title>
                                        <Text className="text-slate-500">Set duration and start bidding for all participants.</Text>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Duration (Min)</div>
                                            <div className="flex items-center gap-2">
                                                <InputNumber
                                                    min={1}
                                                    max={60}
                                                    value={duration}
                                                    onChange={setDuration}
                                                    className="w-16 font-bold"
                                                    size="large"
                                                />
                                                <Button
                                                    onClick={() => setDuration(prev => prev + 5)}
                                                    size="small"
                                                    className="text-[10px] h-6 px-1"
                                                >+5m</Button>
                                            </div>
                                        </div>
                                        <Divider type="vertical" className="h-10 m-0" />
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<Gavel size={18} />}
                                            className="h-12 px-8 font-bold bg-green-700 border-none hover:!bg-green-600 shadow-lg"
                                            onClick={() => startMutation.mutate({ auctionId: parseInt(auctionId), durationMinutes: duration })}
                                            loading={startMutation.isPending}
                                            disabled={auction.auctionStatus === 'Live' || isClosed}
                                        >
                                            {auction.auctionStatus === 'Live' ? 'AUCTION LIVE' : 'START AUCTION'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <Title level={4} className="!mb-1">Physical Attendance</Title>
                                        <Text className="text-slate-500">Mark members who are physically present at the venue.</Text>
                                    </div>
                                    <Button icon={<Users size={16} />} onClick={fetchAttendance} loading={isAttendanceLoading}>Refresh</Button>
                                </div>
                                <List
                                    loading={isAttendanceLoading || (attendance.length === 0 && isLoadingTickets)}
                                    dataSource={attendance.length > 0 ? attendance : tickets.map(t => ({
                                        ticketId: t.id,
                                        ticketNumber: t.ticketNumber,
                                        memberName: t.memberName,
                                        photoUrl: t.photoUrl,
                                        isForeman: t.isForeman || t.ticketNumber === 1,
                                        isPresent: t.isForeman || t.ticketNumber === 1,
                                        isPrized: t.isPrized,
                                        prizedInstallment: t.prizedInstallment
                                    }))}
                                    className="bg-white rounded-xl border border-slate-100"
                                    renderItem={(item) => (
                                        <List.Item
                                            key={item.ticketId}
                                            actions={[
                                                <Switch
                                                    checked={item.isPresent}
                                                    onChange={(checked) => handleAttendanceToggle(item.ticketId, checked)}
                                                    checkedChildren="Present"
                                                    unCheckedChildren="Absent"
                                                />
                                            ]}
                                            className="px-6 py-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.photoUrl} icon={<Users size={20} />} size="large" />}
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800">{item.memberName}</span>
                                                        {item.isForeman && <Tag color="gold" className="m-0 text-[10px] leading-4 h-4 uppercase">Foreman</Tag>}
                                                        {item.isPrized && (
                                                            <Tag color="success" className="m-0 text-[10px] leading-4 h-4 uppercase">
                                                                PRIZED {item.prizedInstallment ? `(Inst. ${item.prizedInstallment})` : ''}
                                                            </Tag>
                                                        )}
                                                    </div>
                                                }
                                                description={
                                                    <div className="flex items-center gap-2">
                                                        <Tag color="blue" className="m-0">Ticket #{item.ticketNumber}</Tag>
                                                        {item.isPrized && <span className="text-[10px] text-slate-400 italic">Not eligible for future bidding</span>}
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        )
                    },
                    {
                        key: '3',
                        label: (
                            <span className="flex items-center gap-2 px-2">
                                <Activity size={18} />
                                Bidding History
                            </span>
                        ),
                        children: (
                            <div className="pt-4 max-w-2xl mx-auto">
                                <div className="mb-6 flex justify-between items-center">
                                    <div>
                                        <Title level={4} className="!mb-1">Bid Sequence</Title>
                                        <Text className="text-slate-500">Full audit trail of all bids placed during this auction.</Text>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Gavel size={16} />
                                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">{auction.winningBidAmount ? 'Auction Finalized' : 'Live Sequence'}</Text>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {isHistoryLoading ? (
                                        <div className="flex justify-center py-12"><Spin size="small" /></div>
                                    ) : bidHistory.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <Gavel size={40} className="text-slate-200 mx-auto mb-4" />
                                            <Text className="text-slate-400 italic">No bids were recorded for this auction.</Text>
                                        </div>
                                    ) : (
                                        bidHistory.map((bid, i) => (
                                            <div
                                                key={bid.id || i}
                                                className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border transition-all ${i === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}
                                            >
                                                <Avatar
                                                    src={bid.photoUrl}
                                                    size={48}
                                                    className={i === 0 ? 'border-2 border-green-500 bg-green-100' : 'border border-slate-200 bg-slate-100'}
                                                >
                                                    {bid.memberName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || "?"}
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-slate-800 text-base">{bid.memberName}</div>
                                                        <Tag className="m-0 text-[9px] uppercase font-black px-1.5 leading-4 h-4">Ticket #{bid.ticketNumber}</Tag>
                                                        {bid.source?.toLowerCase() === 'web' && <Globe size={14} className="text-green-500" />}
                                                        {bid.source?.toLowerCase() === 'mobile' && <Smartphone size={14} className="text-purple-500" />}
                                                        {bid.source?.toLowerCase() === 'office' && <Building2 size={14} className="text-blue-500" />}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                                        <Clock size={12} />
                                                        {new Date(bid.bidTime).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <div className={`font-black text-xl ${i === 0 ? 'text-green-700' : 'text-slate-600'}`}>
                                                    ₹{bid.bidAmount.toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    }
                ]} />
            </Card>
        </div>
    );
};

export default AuctionConsole;
