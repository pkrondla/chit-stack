import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { Card, Typography, Input, Button, Spin, Tag, message, Avatar, Tooltip, Tabs, List } from 'antd';
import { Gavel, Globe, Smartphone, Building2, User as UserIcon, Users, Activity } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';

const { Title, Text } = Typography;

const SourceIcon = ({ source }) => {
    switch (source?.toLowerCase()) {
        case 'office': return <Tooltip title="Physically in Office"><Building2 size={16} className="text-blue-600" /></Tooltip>;
        case 'mobile': return <Tooltip title="Via Mobile App"><Smartphone size={16} className="text-purple-600" /></Tooltip>;
        case 'web': return <Tooltip title="Via Web Portal"><Globe size={16} className="text-green-600" /></Tooltip>;
        default: return null;
    }
};

const LiveAuction = () => {
    const { auctionId } = useParams();
    const user = useAuthStore(state => state.user);

    const [connection, setConnection] = useState(null);
    const [bids, setBids] = useState([]);
    const [currentBid, setCurrentBid] = useState(0);
    const [inputBid, setInputBid] = useState('');
    const [participants, setParticipants] = useState(0);
    const [timer, setTimer] = useState(300);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isBidding, setIsBidding] = useState(false);
    const [myTicket, setMyTicket] = useState(null);
    const [venue, setVenue] = useState("");
    const [attendance, setAttendance] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Map()); // Map<TicketId, Source>
    const [auctionData, setAuctionData] = useState(null);
    const [auctionStatus, setAuctionStatus] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [maxCapPercent, setMaxCapPercent] = useState(40);

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch basic data
                const [auctionRes, settingsRes] = await Promise.allSettled([
                    api.get('/Auctions'),
                    api.get('/settings')
                ]);

                // Handle Settings
                if (settingsRes.status === 'fulfilled') {
                    const settings = settingsRes.value.data.data || settingsRes.value.data;
                    if (settings?.maxBiddingDiscountPercent) {
                        setMaxCapPercent(settings.maxBiddingDiscountPercent);
                    }
                }

                // Handle Auction List
                if (auctionRes.status === 'fulfilled') {
                    const auctionsList = auctionRes.value.data.data || auctionRes.value.data || [];
                    const auction = auctionsList.find(a => String(a.id) === String(auctionId));

                    if (auction) {
                        setAuctionData(auction);
                        setCurrentBid(auction.winningBidAmount || 0);
                        setVenue(auction.auctionVenueAddress || "");
                        setAuctionStatus(auction.auctionStatus);

                        // Fetch dependent data (tickets, attendance, bids)
                        try {
                            const [ticketsRes, attRes, bidsRes] = await Promise.all([
                                api.get(`/ChitGroups/${auction.chitGroupId}/tickets`),
                                api.get(`/Auctions/${auctionId}/attendance`),
                                api.get(`/Auctions/${auctionId}/bids`)
                            ]);

                            // Tickets
                            const tickets = ticketsRes.data.data || [];
                            const found = tickets.find(t => t.memberId === user?.memberId);
                            if (found) setMyTicket(found);

                            // Attendance
                            setAttendance(attRes.data.data || []);

                            // Bids
                            const initialBids = (bidsRes.data.data || []).map(b => ({
                                user: b.memberName,
                                amount: b.bidAmount,
                                photoUrl: b.photoUrl,
                                source: b.source,
                                time: new Date(b.bidTime)
                            }));
                            setBids(initialBids);

                        } catch (depError) {
                            console.error("Failed to load dependent auction data", depError);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load auction data", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchInitialData();
    }, [auctionId, user]);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5045/auctionHub")
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [auctionId]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    // Custom Join with details if we have a ticket
                    if (myTicket) {
                        connection.invoke("JoinAuction", auctionId, myTicket.id, user?.fullName, "Web");
                    } else {
                        connection.invoke("JoinAuction", auctionId, 0, "Guest", "Web");
                    }

                    setIsConnecting(false);

                    connection.on("ReceiveBid", (userName, amount, photoUrl, source) => {
                        setBids(prev => [{
                            user: userName,
                            amount,
                            photoUrl,
                            source,
                            time: new Date()
                        }, ...prev]);
                        setCurrentBid(amount);
                    });

                    connection.on("ReceiveAttendance", (ticketId, memberName, isPresent) => {
                        setAttendance(prev => prev.map(a => a.ticketId === ticketId ? { ...a, isPresent } : a));
                    });

                    connection.on("UserJoined", (ticketId, memberName, source) => {
                        if (ticketId) {
                            setOnlineUsers(prev => {
                                const next = new Map(prev);
                                next.set(ticketId, source);
                                return next;
                            });
                        }
                        setParticipants(p => p + 1);
                    });

                    connection.on("UserLeft", (ticketId, memberName) => {
                        if (ticketId) {
                            setOnlineUsers(prev => {
                                const next = new Map(prev);
                                next.delete(ticketId);
                                return next;
                            });
                        }
                        setParticipants(p => p > 0 ? p - 1 : 0);
                    });

                    connection.on("AuctionStarted", (durationMinutes, endTime) => {
                        setTimer(durationMinutes * 60);
                        setAuctionStatus("Live");
                        message.success("Auction is now LIVE!");
                    });

                    connection.on("AuctionClosed", (winningTicketId, winnerName, winningBid) => {
                        setAuctionStatus("Closed");
                        setCurrentBid(winningBid);
                        setTimer(0);
                        message.info(`Auction closed. Winner: ${winnerName} (Ticket #${winningTicketId})`);
                    });
                })
                .catch(e => {
                    console.log('Connection failed: ', e);
                    setIsConnecting(false);
                    message.error("Failed to connect to Live Auction server.");
                });
        }

        return () => {
            if (connection) {
                connection.off("ReceiveBid");
                connection.off("ReceiveAttendance");
                connection.off("UserJoined");
                connection.off("UserLeft");
                connection.off("AuctionStarted");
                if (myTicket) {
                    connection.invoke("LeaveAuction", auctionId, myTicket.id, user?.fullName);
                }
                connection.stop();
            }
        };
    }, [connection, auctionId, myTicket]);

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (auctionStatus === 'Live') {
                setTimer(t => (t > 0 ? t - 1 : 0));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [auctionStatus]);

    const handleBid = async () => {
        const amount = parseFloat(inputBid);
        if (!amount || amount <= currentBid) {
            message.warning("Bid must be higher than the current bid");
            return;
        }

        const chitValue = auctionData?.chitValue || 0;
        const maxBid = chitValue * (maxCapPercent / 100);
        const foremanComm = chitValue * (auctionData?.foremanCommissionPercent / 100);

        if (amount > maxBid) {
            message.error(`Bid exceeds the maximum allowed discount of ${maxCapPercent}% (₹${maxBid.toLocaleString()})`);
            return;
        }

        if (amount < foremanComm && auctionData?.installmentNumber > 1) {
            message.error(`Bid must be at least the Foreman Commission of ₹${foremanComm.toLocaleString()}`);
            return;
        }

        if (!myTicket) {
            message.error("You don't have an active ticket in this group to bid.");
            return;
        }

        setIsBidding(true);
        try {
            await api.post('/Auctions/bid', {
                auctionId: parseInt(auctionId),
                bidderTicketId: myTicket.id,
                bidAmount: amount,
                source: "Web" // Detect mobile via UA if needed
            });
            setInputBid('');
        } catch (e) {
            message.error(e.response?.data?.error || "Failed to place bid");
        } finally {
            setIsBidding(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
                <Spin size="large" />
                <Text className="text-slate-400 animate-pulse">Entering Auction Room...</Text>
            </div>
        );
    }

    if (!auctionData) {
        const backPath = user?.role === 'Subscriber' ? '/portal/auctions' : '/auctions';
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <Result
                    status="404"
                    title="Auction Not Found"
                    subTitle="The auction you are looking for does not exist or you do not have permission to view it."
                    extra={<Button type="primary" onClick={() => navigate(backPath)}>Back to Auctions</Button>}
                />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Auction Area */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg rounded-2xl border-0 mb-8 text-center relative overflow-hidden" styles={{ body: { padding: '3rem' } }}>
                        {auctionStatus === 'Closed' && (
                            <div className="absolute top-0 right-0 p-4">
                                <Tag color="success" className="font-bold uppercase">Completed</Tag>
                            </div>
                        )}

                        <Title level={2} className="!mb-2 text-slate-800">Live Auction Room</Title>
                        <Text className="text-slate-500 block mb-1">
                            {myTicket ? `Identified as: ${user?.fullName} (Ticket #${myTicket.ticketNumber})` : "Viewing Mode Only"}
                        </Text>
                        {venue && (
                            <Text className="text-slate-400 text-xs block mb-10 flex items-center justify-center gap-1">
                                <Building2 size={12} /> Venue: {venue}
                            </Text>
                        )}

                        <div className="mb-16">
                            <Text className="text-slate-500 font-semibold mb-2 block text-lg">
                                {auctionStatus === 'Closed' ? 'Final Winning Bid' : 'Current Highest Bid'}
                            </Text>
                            <div className={`text-6xl md:text-7xl font-bold font-mono tracking-tight ${auctionStatus === 'Closed' ? 'text-slate-800' : 'text-green-700'}`}>
                                ₹{currentBid.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-4 text-red-600 font-bold text-2xl mb-8">
                            <span className={auctionStatus === 'Live' ? "animate-pulse" : ""}>
                                {auctionStatus === 'Live' ? `⏳ Closing in: ${formatTime(timer)}` : (auctionStatus === 'Closed' ? '✅ Auction Finished' : 'Pending Start')}
                            </span>
                        </div>

                        {(auctionStatus === 'Scheduled' || auctionStatus === 'Open') && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-20 flex flex-col justify-center items-center rounded-2xl">
                                <Gavel size={80} className="text-slate-200 mb-4 animate-bounce" />
                                <Title level={3} className="text-slate-400 !mb-1">Waiting for Coordinator</Title>
                                <Text className="text-slate-400">Bidding will start shortly after attendance check-in.</Text>
                            </div>
                        )}

                        {auctionStatus === 'Closed' && auctionData && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                                    <div className="flex flex-col items-center mb-6">
                                        <Text className="text-slate-400 uppercase font-bold text-[10px] tracking-widest mb-2">Final Winner</Text>
                                        <Title level={4} className="!mb-1 text-slate-800">{auctionData.winnerName || 'Subscriber'}</Title>
                                        <Tag color="blue" className="px-4 py-0.5 rounded-full font-bold">Ticket #{auctionData.winningTicketNumber || auctionData.winningTicketId}</Tag>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="text-center">
                                            <Text className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Discount Bid</Text>
                                            <Text className="text-lg font-bold text-slate-700">₹{auctionData.winningBidAmount?.toLocaleString()}</Text>
                                        </div>
                                        <div className="text-center">
                                            <Text className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Foreman Fee</Text>
                                            <Text className="text-lg font-bold text-slate-700">₹{auctionData.foremanCommissionAmount?.toLocaleString()}</Text>
                                        </div>
                                        <div className="text-center">
                                            <Text className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Your Dividend</Text>
                                            <Text className="text-lg font-bold text-green-600">₹{auctionData.dividendAmount?.toLocaleString()}</Text>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <Text className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Net Payable to Winner</Text>
                                        <div className="text-3xl font-black text-slate-800">
                                            ₹{auctionData.netPayableAmount?.toLocaleString()}
                                        </div>
                                    </div>

                                    <Text className="text-[11px] text-slate-400 italic block mt-4">
                                        This auction is finalized. Financial settlement will be processed for the next installment.
                                    </Text>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Bidding Controls */}
                    <div className="flex gap-4">
                        <Input
                            type="number"
                            value={inputBid}
                            onChange={(e) => setInputBid(e.target.value)}
                            onPressEnter={handleBid}
                            placeholder={myTicket?.isPrized ? "Already Prized" : "Enter Bid Amount..."}
                            size="large"
                            className="text-xl h-16 rounded-xl shadow-sm border-2 border-slate-200 focus:border-slate-800"
                            disabled={!myTicket || myTicket.isPrized}
                        />
                        <Button
                            type="primary"
                            onClick={handleBid}
                            className={`h-16 px-10 text-xl font-bold border-none rounded-xl flex items-center shadow-lg ${myTicket?.isPrized ? 'bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'}`}
                            icon={<Gavel size={24} />}
                            disabled={isConnecting || !myTicket || myTicket.isPrized}
                            loading={isBidding}
                        >
                            {myTicket?.isPrized ? 'PRIZED' : 'PLACE BID'}
                        </Button>
                        {(auctionStatus !== 'Live' || myTicket?.isPrized) && (
                            <div className="absolute inset-x-0 -top-2 flex justify-center pointer-events-none">
                                <Tag color="default" className="bg-slate-100 border-none px-4 py-1 text-slate-400 font-semibold shadow-sm">
                                    {myTicket?.isPrized ? 'Subscription Already Prized' : 'Bidding Disabled'}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>

                <Card
                    className="shadow-lg rounded-2xl border-0 h-[650px] flex flex-col relative"
                    styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
                >
                    {/* Activity Section (Top 60%) */}
                    <div className="flex-[3] flex flex-col min-h-0 border-b border-slate-100">
                        <div className="p-4 bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-slate-400" />
                                <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Live Activity</span>
                            </div>
                            <Tag color={auctionStatus === 'Closed' ? 'default' : (isConnecting ? 'warning' : 'success')} className="rounded-full px-2 text-[10px] m-0 border-0">
                                {auctionStatus === 'Closed' ? 'AUCTION ARCHIVE' : (isConnecting ? '...' : `${participants} ONLINE`)}
                            </Tag>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                            {isConnecting ? (
                                <div className="flex justify-center py-12"><Spin size="small" /></div>
                            ) : bids.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 italic text-xs">Waiting for first bid...</div>
                            ) : (
                                bids.map((bid, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 p-3 rounded-xl shadow-sm transition-all ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-100'}`}
                                    >
                                        <Avatar
                                            src={bid.photoUrl}
                                            size={40}
                                            className={i === 0 ? 'border-2 border-green-500 bg-green-100' : 'border border-slate-200 bg-slate-100'}
                                        >
                                            {getInitials(bid.user)}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-800 truncate text-xs">{bid.user}</div>
                                                <SourceIcon source={bid.source} />
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-mono">{bid.time.toLocaleTimeString()}</div>
                                        </div>
                                        <div className={`font-bold text-sm ${i === 0 ? 'text-green-700' : 'text-slate-600'}`}>
                                            ₹{bid.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Members Section (Bottom 40%) */}
                    <div className="flex-[2] flex flex-col min-h-0 bg-white rounded-b-2xl">
                        <div className="p-4 bg-white flex items-center gap-2 shrink-0 border-b border-slate-50">
                            <Users size={18} className="text-slate-400" />
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                                {auctionStatus === 'Closed' ? 'Attendees' : 'Group Members'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">({attendance.filter(a => a.isPresent || onlineUsers.has(a.ticketId)).length})</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {attendance.filter(item => item.isPresent || onlineUsers.has(item.ticketId)).length === 0 ? (
                                <div className="text-center py-12 text-slate-300 italic text-[11px]">
                                    No members present yet.
                                </div>
                            ) : (
                                attendance.filter(item => item.isPresent || onlineUsers.has(item.ticketId)).map((item) => (
                                    <div key={item.ticketId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                        <div className="relative">
                                            <Avatar src={item.photoUrl} size={32} className="bg-slate-100">
                                                {getInitials(item.memberName)}
                                            </Avatar>
                                            {onlineUsers.has(item.ticketId) && (
                                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <div className="font-semibold text-slate-800 truncate text-[11px] leading-tight">{item.memberName}</div>
                                                {item.isForeman && <Tag color="gold" className="m-0 text-[7px] leading-[10px] h-3 uppercase px-1 shrink-0">Foreman</Tag>}
                                            </div>
                                            <div className="text-[9px] text-slate-400">Ticket #{item.ticketNumber}</div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {item.isPresent && <Building2 size={12} className="text-blue-500" />}
                                            {onlineUsers.has(item.ticketId) && (
                                                onlineUsers.get(item.ticketId)?.toLowerCase() === 'mobile'
                                                    ? <Smartphone size={12} className="text-purple-500" />
                                                    : <Globe size={12} className="text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default LiveAuction;
