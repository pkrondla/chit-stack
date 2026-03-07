import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { Card, Typography, Input, Button, Spin, Tag, message } from 'antd';
import { Gavel, Send } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const { Title, Text } = Typography;

const LiveAuction = () => {
    const { auctionId } = useParams();
    const userStore = useAuthStore(state => state.user);
    const username = userStore?.fullName || `Bidder_${Math.floor(Math.random() * 1000)}`;

    const [connection, setConnection] = useState(null);
    const [bids, setBids] = useState([]);
    const [currentBid, setCurrentBid] = useState(0);
    const [inputBid, setInputBid] = useState('');
    const [participants, setParticipants] = useState(0); // Mock participant count
    const [timer, setTimer] = useState(300); // 5 minutes mock timer
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        // SignalR Connection
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
                    console.log('Connected to Auction Hub');
                    connection.invoke("JoinAuction", auctionId);
                    setIsConnecting(false);

                    connection.on("ReceiveBid", (user, amount) => {
                        setBids(prev => [{ user, amount, time: new Date() }, ...prev]);
                        setCurrentBid(amount);
                    });

                    connection.on("UserJoined", () => {
                        setParticipants(p => p + 1);
                    });

                    connection.on("UserLeft", () => {
                        setParticipants(p => p > 0 ? p - 1 : 0);
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
        const amount = parseInt(inputBid);
        if (!amount || amount <= currentBid) {
            message.warning("Bid must be higher than the current bid");
            return;
        }

        try {
            await connection.invoke("PlaceBid", auctionId, amount, username);
            setInputBid('');
        } catch (e) {
            console.error(e);
            message.error("Failed to place bid");
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
                        <Text className="text-slate-500 block mb-12">Auction ID: {auctionId}</Text>

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
                        />
                        <Button
                            type="primary"
                            onClick={handleBid}
                            className="h-16 px-10 text-xl font-bold bg-slate-900 border-none rounded-xl hover:bg-slate-800 flex items-center shadow-lg"
                            icon={<Gavel size={24} />}
                            disabled={isConnecting}
                        >
                            PLACE BID
                        </Button>
                    </div>
                </div>

                {/* Sidebar: Bids Log */}
                <Card
                    className="shadow-lg rounded-2xl border-0 h-[600px] flex flex-col relative"
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
                                    className={`flex items-center gap-4 p-4 rounded-xl shadow-sm transition-all ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-100'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex justify-center items-center font-bold text-lg ${i === 0 ? 'bg-green-200 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                        {bid.user.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-800 text-base">{bid.user}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-1">{bid.time.toLocaleTimeString()}</div>
                                    </div>
                                    <div className={`font-bold text-lg tracking-tight ${i === 0 ? 'text-green-700' : 'text-slate-600'}`}>
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
