import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { Card, Typography, Input, Button, Spin, Tag, message, Avatar, Tooltip } from 'antd';
import { Gavel, Globe, Smartphone, Building2, User as UserIcon } from 'lucide-react';
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

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Get Auction Details
                const auctionRes = await api.get('/Auctions');
                const auctionsList = auctionRes.data.data || auctionRes.data || [];
                const auction = auctionsList.find(a => String(a.id) === String(auctionId));

                if (auction) {
                    setCurrentBid(auction.winningBidAmount || 0);
                    setVenue(auction.auctionVenueAddress || "");

                    // Get My Ticket for this group
                    const ticketsRes = await api.get(`/ChitGroups/${auction.chitGroupId}/tickets`);
                    const tickets = ticketsRes.data.data || [];
                    const found = tickets.find(t => t.memberId === user?.memberId);
                    if (found) setMyTicket(found);
                }
            } catch (error) {
                console.error("Failed to load auction data", error);
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
                    connection.invoke("JoinAuction", auctionId);
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

                    connection.on("UserJoined", () => setParticipants(p => p + 1));
                    connection.on("UserLeft", () => setParticipants(p => p > 0 ? p - 1 : 0));
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
                connection.off("UserJoined");
                connection.off("UserLeft");
                connection.stop();
            }
        };
    }, [connection, auctionId]);

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(t => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleBid = async () => {
        const amount = parseFloat(inputBid);
        if (!amount || amount <= currentBid) {
            message.warning("Bid must be higher than the current bid");
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

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Auction Area */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg rounded-2xl border-0 mb-8 text-center" styles={{ body: { padding: '3rem' } }}>
                        <Title level={2} className="!mb-2 text-slate-800">Live Auction Room</Title>
                        <Text className="text-slate-500 block mb-1">
                            {myTicket ? `Bidding as: ${user?.fullName} (Ticket #${myTicket.ticketNumber})` : "Viewing Mode Only"}
                        </Text>
                        {venue && (
                            <Text className="text-slate-400 text-xs block mb-10 flex items-center justify-center gap-1">
                                <Building2 size={12} /> Venue: {venue}
                            </Text>
                        )}

                        <div className="mb-16">
                            <Text className="text-slate-500 font-semibold mb-2 block text-lg">Current Highest Bid</Text>
                            <div className="text-6xl md:text-7xl font-bold text-green-700 font-mono tracking-tight">
                                ₹{currentBid.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-4 text-red-600 font-bold text-2xl mb-8">
                            <span className="animate-pulse">⏳ Closing in: {formatTime(timer)}</span>
                        </div>
                    </Card>

                    {/* Bidding Controls */}
                    <div className="flex gap-4">
                        <Input
                            type="number"
                            value={inputBid}
                            onChange={(e) => setInputBid(e.target.value)}
                            onPressEnter={handleBid}
                            placeholder="Enter Bid Amount..."
                            size="large"
                            className="text-xl h-16 rounded-xl shadow-sm border-2 border-slate-200 focus:border-slate-800"
                            disabled={!myTicket}
                        />
                        <Button
                            type="primary"
                            onClick={handleBid}
                            className="h-16 px-10 text-xl font-bold bg-slate-900 border-none rounded-xl hover:bg-slate-800 flex items-center shadow-lg"
                            icon={<Gavel size={24} />}
                            disabled={isConnecting || !myTicket}
                            loading={isBidding}
                        >
                            PLACE BID
                        </Button>
                    </div>
                </div>

                {/* Sidebar: Bids Log */}
                <Card
                    className="shadow-lg rounded-2xl border-0 h-[650px] flex flex-col relative"
                    styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-2xl">
                        <Title level={4} className="!mb-0 text-slate-800">Live Activity</Title>
                        <Tag color={isConnecting ? 'warning' : 'success'} className="flex items-center gap-2 rounded-full px-3 py-1 font-bold m-0 border-0">
                            <span className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                            {isConnecting ? 'Connecting...' : `${participants} Online`}
                        </Tag>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
                        {isConnecting ? (
                            <div className="flex-1 flex justify-center items-center">
                                <Spin size="large" />
                            </div>
                        ) : bids.length === 0 ? (
                            <div className="flex-1 flex justify-center items-center text-slate-400 italic">
                                Waiting for first bid...
                            </div>
                        ) : (
                            bids.map((bid, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-4 p-3 rounded-xl shadow-sm transition-all ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-100'}`}
                                >
                                    <Avatar
                                        src={bid.photoUrl}
                                        icon={<UserIcon size={20} />}
                                        size={48}
                                        className={i === 0 ? 'border-2 border-green-500' : 'border border-slate-200'}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-slate-800 truncate text-sm">{bid.user}</div>
                                            <SourceIcon source={bid.source} />
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">{bid.time.toLocaleTimeString()}</div>
                                    </div>
                                    <div className={`font-bold text-base tracking-tight ${i === 0 ? 'text-green-700' : 'text-slate-600'}`}>
                                        ₹{bid.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default LiveAuction;
