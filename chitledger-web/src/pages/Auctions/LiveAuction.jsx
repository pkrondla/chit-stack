import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import api from '../../api/axios';
import { Gavel, Send, Users, AlertOctagon } from 'lucide-react';

const LiveAuction = () => {
    const { auctionId } = useParams();
    const [connection, setConnection] = useState(null);
    const [bids, setBids] = useState([]);
    const [currentBid, setCurrentBid] = useState(0);
    const [inputBid, setInputBid] = useState('');
    const [auctionData, setAuctionData] = useState(null);
    const [participants, setParticipants] = useState(0); // Mock participant count
    const [timer, setTimer] = useState(300); // 5 minutes mock timer

    // Mock User for now (In real app, get from Context/Token)
    const [username, setUsername] = useState(`Bidder_${Math.floor(Math.random() * 1000)}`);

    useEffect(() => {
        const fetchAuction = async () => {
            try {
                // Fetch basic auction details (assuming backend has this endpoint)
                // For demo, we might fail if endpoint doesn't return exactly what we need, 
                // but let's try grabbing the specific auction.
                // const res = await api.get(`/Auctions/upcoming`); 
                // Assuming we passed auctionId, we can get it via standard endpoint
                // Real implementation might need a specific GetAuctionById
                setAuctionData({ id: auctionId, chitValue: 500000, currentBid: 0 }); // Placeholder
            } catch (e) { console.error(e); }
        };
        fetchAuction();

        // SignalR Connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7191/auctionHub")
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

                    connection.on("ReceiveBid", (user, amount) => {
                        console.log("Bid Received", user, amount);
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
                .catch(e => console.log('Connection failed: ', e));
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

    const handleBid = async (e) => {
        e.preventDefault();
        const amount = parseInt(inputBid);
        if (!amount || amount <= currentBid) {
            alert("Bid must be higher than current bid");
            return;
        }

        // Invoke Hub Method
        try {
            await connection.invoke("PlaceBid", auctionId, amount, username);
            setInputBid('');
        } catch (e) { console.error(e); }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Main Auction Area */}
                <div>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>Live Auction Room</h2>
                        <p style={{ color: '#64748b' }}>Auction ID: {auctionId}</p>

                        <div style={{ margin: '3rem 0' }}>
                            <div style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>Current Highest Bid</div>
                            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#166534' }}>
                                ₹{currentBid.toLocaleString()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', color: '#ef4444', fontWeight: 'bold', fontSize: '1.5rem' }}>
                            <span>Closing in: {formatTime(timer)}</span>
                        </div>
                    </div>

                    {/* Bidding Controls */}
                    <form onSubmit={handleBid} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="number"
                            value={inputBid}
                            onChange={(e) => setInputBid(e.target.value)}
                            placeholder="Enter Bid Amount..."
                            style={{ flex: 1, padding: '1rem', fontSize: '1.25rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                        />
                        <button
                            type="submit"
                            style={{ padding: '0 2rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', borderRadius: '8px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Gavel /> PLACE BID
                        </button>
                    </form>
                </div>

                {/* Sidebar: Bids Log */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '1.5rem', height: '600px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Live Activity</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                            {participants} Online
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {bids.map((bid, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', backgroundColor: i === 0 ? '#f0fdf4' : 'transparent', borderRadius: '6px' }}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#64748b' }}>
                                    {bid.user.substring(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{bid.user}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{bid.time.toLocaleTimeString()}</div>
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#166534' }}>
                                    ₹{bid.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {bids.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>No bids yet</div>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LiveAuction;
