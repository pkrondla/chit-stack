import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { Card, Typography, Input, Button, Spin, Tag, App, Avatar, Tooltip, Tabs, Result } from 'antd';
import { Gavel, Globe, Smartphone, Building2, User as UserIcon, Users, Activity, Trophy, Volume2, VolumeX } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import { LiveRoomVoiceQueue } from '../../utils/liveRoomVoiceQueue';
import { semanticColors } from '../../theme/tokens';

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
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const { message } = App.useApp();

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
    const [lotteryData, setLotteryData] = useState(null); // { participants: [], winnerTicketId: null }
    const [isLotteryVisible, setIsLotteryVisible] = useState(false);
    const isLotteryVisibleRef = useRef(false);
    const [lotteryFinished, setLotteryFinished] = useState(false);
    const [pendingClosure, setPendingClosure] = useState(null);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [tieBreakerTimer, setTieBreakerTimer] = useState(null);
    const [lastWinnerTicketId, setLastWinnerTicketId] = useState(null);
    const [isTenantTtsEnabled, setIsTenantTtsEnabled] = useState(false);
    const [preferredVoiceLanguage, setPreferredVoiceLanguage] = useState('en');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('activity');
    const hasShownVoiceUnlockPromptRef = useRef(false);
    const voiceQueueRef = useRef(null);
    const isVoiceEnabledRef = useRef(false);
    const isTenantTtsEnabledRef = useRef(false);
    const preferredVoiceLanguageRef = useRef('en');
    const voiceUserKey = user?.id || user?.memberId || user?.username || 'anonymous';
    const normalizedStatus = (auctionStatus || '').toLowerCase();
    const isLive = normalizedStatus === 'live';
    const isClosed = normalizedStatus === 'closed';
    const isAwaitingCoordinator = ['scheduled', 'open', 'pending'].includes(normalizedStatus);

    const handleFinalClosure = (data) => {
        setAuctionStatus("Closed");
        setCurrentBid(data.winningBid);
        setTimer(0);
        fetchData();
        message.info(`Auction closed. Winner: ${data.winnerName} (Ticket #${data.winningTicketId})`);
        voiceQueueRef.current?.enqueue({
            eventType: "AuctionClosed",
            text: buildVoiceText("AuctionClosed", data),
            priority: 'high'
        });
    };

    useEffect(() => {
        if (lotteryFinished && pendingClosure) {
            handleFinalClosure(pendingClosure);
            setPendingClosure(null);
            // Wait another few seconds then hide lottery
            setTimeout(() => {
                setIsLotteryVisible(false);
                isLotteryVisibleRef.current = false;
                setLotteryFinished(false);
            }, 5000);
        }
    }, [lotteryFinished, pendingClosure]);

    // Use Refs for timer logic to avoid Interval clearing on every bid
    const bidsRef = useRef([]);
    const auctionDataRef = useRef(null);
    useEffect(() => { bidsRef.current = bids; }, [bids]);
    useEffect(() => { auctionDataRef.current = auctionData; }, [auctionData]);
    useEffect(() => { isVoiceEnabledRef.current = isVoiceEnabled; }, [isVoiceEnabled]);
    useEffect(() => { isTenantTtsEnabledRef.current = isTenantTtsEnabled; }, [isTenantTtsEnabled]);
    useEffect(() => { preferredVoiceLanguageRef.current = preferredVoiceLanguage; }, [preferredVoiceLanguage]);

    useEffect(() => {
        voiceQueueRef.current = new LiveRoomVoiceQueue({
            auctionId,
            getLanguageCode: () => preferredVoiceLanguageRef.current,
            getEnabled: () => isTenantTtsEnabledRef.current && isVoiceEnabledRef.current,
            onUserGestureRequired: () => {
                if (hasShownVoiceUnlockPromptRef.current) return;
                hasShownVoiceUnlockPromptRef.current = true;
                message.info('Tap the speaker icon to enable live announcements.');
            },
            onVoiceUnlocked: () => {
                hasShownVoiceUnlockPromptRef.current = false;
            }
        });

        return () => {
            voiceQueueRef.current?.destroy();
            voiceQueueRef.current = null;
        };
    }, [auctionId]);

    useEffect(() => {
        const key = `liveRoomVoiceEnabled:${auctionId}:${voiceUserKey}`;
        localStorage.setItem(key, isVoiceEnabled ? '1' : '0');
    }, [isVoiceEnabled, auctionId, voiceUserKey]);

    useEffect(() => {
        if (isTenantTtsEnabled) return;
        setIsVoiceEnabled(false);
        voiceQueueRef.current?.clear();
    }, [isTenantTtsEnabled]);

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const buildVoiceText = (eventType, payload = {}) => {
        const lang = (preferredVoiceLanguageRef.current || 'en').toLowerCase();
        const isTamil = lang === 'ta' || lang === 'ta-in' || lang === 'tamil';

        if (isTamil) {
            switch (eventType) {
                case "AuctionClosed":
                    return `ஏலம் முடிவடைந்தது. வெற்றியாளர் ${payload.winnerName}. டிக்கெட் எண் ${payload.winningTicketId}. இறுதி ஏலத் தொகை ${Math.round(payload.winningBid || 0).toLocaleString()} ரூபாய்.`;
                case "ReceiveBid":
                    return `${payload.userName} ${Math.round(payload.amount || 0).toLocaleString()} ரூபாய் ஏலம் போட்டார்.`;
                case "AuctionStarted":
                    return `ஏலம் தொடங்கியுள்ளது. நேரம் ${payload.durationMinutes} நிமிடங்கள்.`;
                case "LotteryStarted":
                    return `சமநிலை குலுக்கல் தொடங்கியது. பங்கேற்பாளர்கள் ${payload.participantCount}.`;
                case "TieBreakerDetected":
                    return `அதிகபட்ச ஏலத்தில் சமநிலை. குலுக்கல் ${payload.seconds} விநாடிகளில் தொடங்கும்.`;
                default:
                    return payload.fallbackText || "";
            }
        }

        switch (eventType) {
            case "AuctionClosed":
                return `Auction closed. Winner is ${payload.winnerName}. Ticket number ${payload.winningTicketId}. Final bid ${Math.round(payload.winningBid || 0).toLocaleString()} rupees.`;
            case "ReceiveBid":
                return `${payload.userName} bids ${Math.round(payload.amount || 0).toLocaleString()} rupees.`;
            case "AuctionStarted":
                return `Auction is now live. ${payload.durationMinutes} minutes on the clock.`;
            case "LotteryStarted":
                return `Tie breaker lottery started for ${payload.participantCount} participants.`;
            case "TieBreakerDetected":
                return `Tie detected at maximum bid. Lottery starts in ${payload.seconds} seconds.`;
            default:
                return payload.fallbackText || "";
        }
    };

    const fetchData = async () => {
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
                setIsTenantTtsEnabled(settings?.liveRoomTtsEnabled ?? false);
                setPreferredVoiceLanguage(settings?.preferredAuctionVoiceLanguage || 'en');
                const tenantEnabled = settings?.liveRoomTtsEnabled ?? false;
                // Start OFF; user must click icon to enable/unlock.
                setIsVoiceEnabled(false);
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
                        let found = tickets.find(t => t.memberId === user?.memberId);

                        // If no specific ticket for the user, check if they are admin/staff and assign foreman ticket
                        if (!found && user?.role !== 'Subscriber') {
                            found = tickets.find(t => t.isForeman || t.ticketNumber === 1);
                        }

                        if (found) setMyTicket(found);

                        // Attendance
                        setAttendance(attRes.data.data || []);

                        // Bids
                        const initialBids = (bidsRes.data.data || []).map(b => ({
                            user: b.memberName,
                            amount: b.bidAmount,
                            photoUrl: b.photoUrl,
                            source: b.source,
                            time: new Date(b.bidTime),
                            isLotteryWinner: b.isLotteryWinner,
                            ticketId: b.ticketId
                        }));
                        setBids(initialBids);

                        // If auction is LIVE, resume timer
                        if (auction.auctionStatus === 'Live' && auction.sessionStartedAt) {
                            // Ensure the browser interprets the date as UTC if it doesn't already have a 'Z' or offset
                            let rawStart = auction.sessionStartedAt;
                            if (typeof rawStart === 'string' && !rawStart.endsWith('Z') && !rawStart.includes('+')) {
                                rawStart += 'Z';
                            }

                            const startTime = new Date(rawStart).getTime();
                            const durationSeconds = (auction.sessionDurationMinutes || 5) * 60;
                            const now = new Date().getTime();
                            const elapsedSeconds = Math.floor((now - startTime) / 1000);
                            const remaining = Math.max(0, durationSeconds - elapsedSeconds);

                            setTimer(remaining);
                        }
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

    // Fetch initial data
    useEffect(() => {
        if (user) fetchData();
    }, [auctionId, user, voiceUserKey]);

    useEffect(() => {
        let isStopped = false;
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5045/auctionHub")
            .withAutomaticReconnect()
            .build();

        const start = async () => {
            try {
                await newConnection.start();
                if (isStopped) {
                    newConnection.stop();
                    return;
                }

                // Initial Join
                if (myTicket) {
                    newConnection.invoke("JoinAuction", auctionId, myTicket.id, user?.fullName, "Web");
                } else {
                    newConnection.invoke("JoinAuction", auctionId, 0, "Guest", "Web");
                }

                setIsConnecting(false);
                setConnection(newConnection);

                // Setup Handlers
                newConnection.on("ReceiveBid", (userName, amount, photoUrl, source, ticketId) => {
                    setBids(prev => [{
                        user: userName,
                        amount,
                        photoUrl,
                        source,
                        time: new Date(),
                        ticketId // Store it in the local bid object as well
                    }, ...prev]);
                    setCurrentBid(amount);
                    setLastWinnerTicketId(ticketId);
                    voiceQueueRef.current?.enqueue({
                        eventType: "ReceiveBid",
                        text: buildVoiceText("ReceiveBid", { userName, amount }),
                        priority: 'medium',
                        coalesceKey: 'latest-bid'
                    });
                });

                newConnection.on("ReceiveAttendance", (ticketId, memberName, isPresent) => {
                    setAttendance(prev => prev.map(a => a.ticketId === ticketId ? { ...a, isPresent } : a));
                });

                newConnection.on("UserJoined", (ticketId, memberName, source) => {
                    if (ticketId) {
                        setOnlineUsers(prev => {
                            const next = new Map(prev);
                            next.set(ticketId, source);
                            return next;
                        });
                    }
                    setParticipants(p => p + 1);
                });

                newConnection.on("UserLeft", (ticketId, memberName) => {
                    if (ticketId) {
                        setOnlineUsers(prev => {
                            const next = new Map(prev);
                            next.delete(ticketId);
                            return next;
                        });
                    }
                    setParticipants(p => p > 0 ? p - 1 : 0);
                });

                newConnection.on("AuctionStarted", (durationMinutes) => {
                    setTimer(durationMinutes * 60);
                    setAuctionStatus("Live");
                    message.success("Auction is now LIVE!");
                    voiceQueueRef.current?.enqueue({
                        eventType: "AuctionStarted",
                        text: buildVoiceText("AuctionStarted", { durationMinutes }),
                        priority: 'high'
                    });
                });

                newConnection.on("AuctionClosed", (winningTicketId, winnerName, winningBid) => {
                    // Buffer the closure if a lottery is currently spinning
                    const closureData = { winningTicketId, winnerName, winningBid };

                    if (isLotteryVisibleRef.current) {
                        setPendingClosure(closureData);
                    } else {
                        handleFinalClosure(closureData);
                    }
                });

                newConnection.on("LotteryStarted", (participants, winnerTicketId) => {
                    const winnerIndex = participants.findIndex(p => p.ticketId === winnerTicketId);
                    const sliceSize = 360 / participants.length;
                    // Rotate 10 times + calculated offset to land winner at the top (0 deg)
                    const targetRotation = 3600 - (winnerIndex * sliceSize) - (sliceSize / 2);

                    setLotteryData({ participants, winnerTicketId });
                    setIsLotteryVisible(true);
                    isLotteryVisibleRef.current = true;
                    setTieBreakerTimer(null);

                    // Trigger rotation after a brief delay
                    setTimeout(() => {
                        setWheelRotation(targetRotation);
                    }, 100);

                    // Set a timer to reveal the result after animation completes (6s + buffer)
                    setTimeout(() => {
                        setLotteryFinished(true);
                    }, 7000);
                    voiceQueueRef.current?.enqueue({
                        eventType: "LotteryStarted",
                        text: buildVoiceText("LotteryStarted", { participantCount: participants.length }),
                        priority: 'high'
                    });
                });

                newConnection.on("TieBreakerDetected", (seconds) => {
                    setTieBreakerTimer(seconds);
                    voiceQueueRef.current?.enqueue({
                        eventType: "TieBreakerDetected",
                        text: buildVoiceText("TieBreakerDetected", { seconds }),
                        priority: 'high'
                    });
                });

            } catch (err) {
                if (!isStopped) {
                    console.error('Connection failed: ', err);
                    setIsConnecting(false);
                    message.error("Failed to connect to Live Auction server.");
                }
            }
        };

        start();

        return () => {
            isStopped = true;
            if (newConnection.state !== signalR.HubConnectionState.Disconnected) {
                if (myTicket) {
                    newConnection.invoke("LeaveAuction", auctionId, myTicket.id, user?.fullName).catch(() => { });
                }
                newConnection.stop();
            }
        };
    }, [auctionId, myTicket?.id]);

    // Timer Logic - Keep it simple so it doesn't clear on every bid
    useEffect(() => {
        const interval = setInterval(() => {
            if (isLive) {
                setTimer(t => (t > 0 ? t - 1 : 0));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isLive]);

    // Timer Expiration Trigger
    useEffect(() => {
        if (timer === 0 && isLive) {
            const chitValue = auctionDataRef.current?.chitValue || 0;
            const maxBidAmount = Math.round(chitValue * (maxCapPercent / 100));

            // Calculate current ties at max bid
            const tiedCount = new Set(
                bidsRef.current
                    .filter(b => Math.round(b.amount) === maxBidAmount)
                    .map(b => b.ticketId)
            ).size;

            if (tiedCount >= 2) {
                // Automatically start the 15s Tie-Breaker countdown
                api.post(`/Auctions/${auctionId}/start-tiebreaker`).catch(() => { });
            }
        }
    }, [timer, isLive, auctionId, maxCapPercent]);

    // lottery Cleanup
    useEffect(() => {
        if (isLotteryVisible) {
            const timer = setTimeout(() => {
                setIsLotteryVisible(false);
                setLotteryData(null);
                setWheelRotation(0);
                fetchData();
            }, 8500);
            return () => clearTimeout(timer);
        }
    }, [isLotteryVisible]);

    // Tie-Breaker countdown display (server orchestrates lottery trigger).
    useEffect(() => {
        let interval;
        if (tieBreakerTimer !== null && tieBreakerTimer > 0) {
            interval = setInterval(() => {
                setTieBreakerTimer(t => {
                    if (t <= 1) {
                        return null;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [tieBreakerTimer]);

    const handleBid = async () => {
        const amount = parseFloat(inputBid);

        const chitValue = auctionData?.chitValue || 0;
        const maxBid = chitValue * (maxCapPercent / 100);
        const foremanComm = chitValue * (auctionData?.foremanCommissionPercent / 100);

        if (!amount) return;

        if (amount < currentBid) {
            message.warning("Bid must be higher than the current bid");
            return;
        }

        if (amount === currentBid && amount !== maxBid) {
            message.warning("Bid must be strictly higher than current bid unless it is the maximum statutory bid.");
            return;
        }

        if (amount === currentBid && amount === maxBid && (lastWinnerTicketId === myTicket?.id || auctionData?.winningTicketId === myTicket?.id)) {
            message.warning("You are already the current winner at the maximum bid.");
            return;
        }

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

    // Keep member room status in sync even if the start event was missed.
    useEffect(() => {
        if (!auctionId) return;

        const syncAuctionStatus = async () => {
            try {
                const res = await api.get('/Auctions');
                const auctionsList = res.data.data || res.data || [];
                const latest = auctionsList.find(a => String(a.id) === String(auctionId));
                if (!latest) return;

                setAuctionStatus(latest.auctionStatus || "");
                if (typeof latest.winningBidAmount === 'number') {
                    setCurrentBid(latest.winningBidAmount);
                }
            } catch {
                // Best-effort sync; keep existing state on transient failures.
            }
        };

        syncAuctionStatus();
        const intervalId = setInterval(syncAuctionStatus, 5000);
        return () => clearInterval(intervalId);
    }, [auctionId]);

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

    const chitValue = auctionData?.chitValue || 0;
    const maxBidAmount = Math.round(chitValue * (maxCapPercent / 100));
    const tiedBidsHistory = (bids || []).filter(h => Math.abs(Number(h.amount) - maxBidAmount) < 1);
    const uniqueTiedMembersCount = new Set(tiedBidsHistory.map(h => Number(h.ticketId))).size;
    const isStatutoryMaxReached = Math.round(currentBid) >= maxBidAmount;
    const isTieBreakerActive = isStatutoryMaxReached && uniqueTiedMembersCount > 1;
    const visibleMembers = attendance.filter(item => item.isPresent || onlineUsers.has(item.ticketId));

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Auction Area */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg rounded-2xl border-0 mb-8 text-center relative overflow-hidden" styles={{ body: { padding: '3rem' } }}>
                        {isClosed && (
                            <div className="absolute top-0 right-0 p-4">
                                <Tag color="success" className="font-bold uppercase">Completed</Tag>
                            </div>
                        )}

                        <Title level={2} className="!mb-2 text-slate-800">Live Auction Room</Title>
                        <div className="absolute left-4 top-4 flex items-center gap-2">
                            {isTenantTtsEnabled ? (
                                <Button
                                    type={isVoiceEnabled ? "primary" : "default"}
                                    shape="circle"
                                    icon={isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                    onClick={() => {
                                        if (!isVoiceEnabled) {
                                            voiceQueueRef.current?.setUserInteracted?.();
                                            setIsVoiceEnabled(true);
                                            return;
                                        }
                                        setIsVoiceEnabled(false);
                                    }}
                                />
                            ) : (
                                <Tooltip title="Voice announcements are disabled by tenant settings">
                                    <Button
                                        shape="circle"
                                        icon={<VolumeX size={16} />}
                                        disabled
                                    />
                                </Tooltip>
                            )}
                        </div>
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
                                {isClosed ? 'Final Winning Bid' : 'Current Highest Bid'}
                            </Text>
                            <div className={`text-6xl md:text-7xl font-bold font-mono tracking-tight ${isClosed ? 'text-slate-800' : 'text-green-700'}`}>
                                ₹{currentBid.toLocaleString()}
                            </div>
                            {isTieBreakerActive && !isClosed && (
                                <Tag color="warning" className="mt-4 px-4 py-1.5 rounded-full font-black border-amber-200 uppercase tracking-wider shadow-sm animate-pulse">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} />
                                        TIE DETECTED: {uniqueTiedMembersCount} Members at Max
                                    </div>
                                </Tag>
                            )}
                        </div>

                        <div className="flex justify-center items-center gap-4 text-red-600 font-bold text-2xl mb-8">
                            <span className={isLive ? "animate-pulse" : ""}>
                                {isLive ? `⏳ Closing in: ${formatTime(timer)}` : (isClosed ? '✅ Auction Finished' : 'Pending Start')}
                            </span>
                        </div>

                        {isAwaitingCoordinator && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-20 flex flex-col justify-center items-center rounded-2xl">
                                <Gavel size={80} className="text-slate-200 mb-4 animate-bounce" />
                                <Title level={3} className="text-slate-400 !mb-1">Waiting for Coordinator</Title>
                                <Text className="text-slate-400">Bidding will start shortly after attendance check-in.</Text>
                                {isTenantTtsEnabled && !isVoiceEnabled && (
                                    <Button
                                        type="primary"
                                        className="mt-4"
                                        onClick={() => {
                                            voiceQueueRef.current?.setUserInteracted?.();
                                            setIsVoiceEnabled(true);
                                        }}
                                    >
                                        Enable Voice
                                    </Button>
                                )}
                            </div>
                        )}

                        {isClosed && auctionData && (
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
                    {user?.role === 'Subscriber' && myTicket && !myTicket.isPrized && !isClosed && (
                        <Card className="shadow-lg rounded-2xl border-0 relative" styles={{ body: { padding: '1.25rem' } }}>
                            <div className="flex items-center justify-between mb-3">
                                <Text className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Bid Entry</Text>
                                {!isLive && (
                                    <Tag color="default" className="bg-slate-100 border-none px-3 py-0.5 text-slate-400 font-semibold shadow-sm m-0">
                                        Bidding Disabled
                                    </Tag>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <Input
                                    type="number"
                                    step="1"
                                    prefix={<span className="text-slate-500 font-semibold">₹</span>}
                                    value={inputBid}
                                    onKeyDown={(e) => {
                                        if (e.key === '.' || e.key === 'e' || e.key === '+' || e.key === '-') {
                                            e.preventDefault();
                                        }
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setInputBid(val);
                                        }
                                    }}
                                    onPressEnter={handleBid}
                                    placeholder="Enter Bid Amount..."
                                    style={{ height: 64 }}
                                    className="text-xl rounded-xl shadow-sm border-2 border-slate-200 focus:border-slate-800 [&_.ant-input]:text-right"
                                />
                                <Button
                                    type="primary"
                                    onClick={handleBid}
                                    className="h-16 min-h-16 px-10 text-xl font-bold border-none rounded-xl flex items-center shadow-lg bg-slate-900 hover:bg-slate-800"
                                    icon={<Gavel size={24} />}
                                    disabled={isConnecting || !isLive}
                                    loading={isBidding}
                                >
                                    PLACE BID
                                </Button>
                            </div>
                        </Card>
                    )}
                    {user?.role === 'Subscriber' && myTicket?.isPrized && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-700 text-center font-medium">
                            <Gavel size={20} className="inline-block mr-2 mb-1 opacity-50" />
                            Your subscription is prized. You are eligible for dividends but cannot place further bids.
                        </div>
                    )}
                </div>

                <Card
                    className="shadow-lg rounded-2xl border-0 min-h-[520px] h-full flex flex-col relative overflow-hidden"
                    styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
                >
                    <Tabs
                        activeKey={sidebarTab}
                        onChange={setSidebarTab}
                        className="h-full live-room-sidebar-tabs"
                        tabBarGutter={8}
                        tabBarStyle={{ padding: '0.75rem 0.75rem 0 0.75rem', marginBottom: 0 }}
                        items={[
                            {
                                key: 'activity',
                                label: (
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                        <Activity size={14} />
                                        Live Activity
                                    </div>
                                ),
                                children: (
                                    <div className="live-room-scroll-panel bg-slate-50/50">
                                        <div className="sticky top-0 z-10 p-4 bg-white/95 backdrop-blur-sm border-b border-slate-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Activity size={18} className="text-slate-400" />
                                                <span className="font-bold text-slate-700 uppercase tracking-wider text-sm">Live Activity</span>
                                            </div>
                                            <Tag color={auctionStatus === 'Closed' ? 'default' : (isConnecting ? 'warning' : 'success')} className="rounded-full px-2 text-xs m-0 border-0">
                                                {auctionStatus === 'Closed' ? 'AUCTION ARCHIVE' : (isConnecting ? '...' : `${participants} ONLINE`)}
                                            </Tag>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {isConnecting ? (
                                                <div className="flex justify-center py-12"><Spin size="small" /></div>
                                            ) : bids.length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 italic text-sm">Waiting for first bid...</div>
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
                                                                <div className="font-bold text-slate-800 truncate text-sm">{bid.user}</div>
                                                                <SourceIcon source={bid.source} />
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-mono">{bid.time.toLocaleTimeString()}</div>
                                                        </div>
                                                        <div className="flex flex-col items-end shrink-0">
                                                            <div className={`font-bold text-sm ${i === 0 ? 'text-green-700' : 'text-slate-600'}`}>
                                                                ₹{bid.amount.toLocaleString()}
                                                            </div>
                                                            {bid.isLotteryWinner && (
                                                                <Tag color="gold" className="m-0 text-xs leading-4 h-4 uppercase px-1 font-bold border-amber-200">
                                                                    Lottery Winner
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'members',
                                label: (
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                        <Users size={14} />
                                        Members ({visibleMembers.length})
                                    </div>
                                ),
                                children: (
                                    <div className="live-room-scroll-panel bg-white">
                                        <div className="sticky top-0 z-10 p-4 bg-white/95 backdrop-blur-sm flex items-center gap-2 border-b border-slate-100">
                                            <Users size={18} className="text-slate-400" />
                                            <span className="font-bold text-slate-700 uppercase tracking-wider text-sm">
                                                {auctionStatus === 'Closed' ? 'Attendees' : 'Group Members'}
                                            </span>
                                            <span className="text-xs text-slate-400 font-normal">({visibleMembers.length})</span>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {visibleMembers.length === 0 ? (
                                                <div className="text-center py-12 text-slate-300 italic text-sm">
                                                    No members present yet.
                                                </div>
                                            ) : (
                                                visibleMembers.map((item) => (
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
                                                                <div className="font-semibold text-slate-800 truncate text-sm leading-tight">{item.memberName}</div>
                                                                {item.isForeman && <Tag color="gold" className="m-0 text-xs leading-4 h-4 uppercase px-1 shrink-0">Foreman</Tag>}
                                                            </div>
                                                            <div className="text-xs text-slate-400">Ticket #{item.ticketNumber}</div>
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
                                )
                            }
                        ]}
                    />
                </Card>

            </div>

            <style>{`
                .live-room-sidebar-tabs {
                    display: flex;
                    flex-direction: column;
                }
                .live-room-sidebar-tabs > .ant-tabs-nav {
                    margin-bottom: 0 !important;
                }
                .live-room-sidebar-tabs > .ant-tabs-content-holder {
                    flex: 1;
                    min-height: 0;
                }
                .live-room-sidebar-tabs .ant-tabs-content {
                    height: 100%;
                }
                .live-room-sidebar-tabs .ant-tabs-tabpane {
                    height: 100%;
                }
                .live-room-scroll-panel {
                    height: 100%;
                    overflow-y: auto;
                }
            `}</style>

            {/* Tie-Breaker Detection Countdown Overlay */}
            {tieBreakerTimer !== null && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-500"></div>
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border-t-8 border-amber-500">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                            <Gavel size={32} className="text-amber-600 animate-bounce" />
                        </div>
                        <Title level={3} className="!mb-2 uppercase tracking-tight">Tie-Breaker Draw!</Title>
                        <div className="bg-amber-50 px-4 py-2 rounded-full border border-amber-200 mb-6 font-bold text-amber-700 text-sm">
                            {uniqueTiedMembersCount} members have hit the maximum discount limit
                        </div>
                        <Text className="text-slate-500 block mb-8 text-base leading-relaxed">
                            Statutory maximum reached. Everyone wishing to participate in the lottery must enter the
                            <Text strong className="text-amber-600"> max bid now</Text> before the timer expires.
                        </Text>

                        <div className="relative w-32 h-32 mb-8">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="364.4"
                                    strokeDashoffset={364.4 - (tieBreakerTimer / 15 * 364.4)}
                                    className="text-amber-500 transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-black text-slate-800">{tieBreakerTimer}s</span>
                            </div>
                        </div>

                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                            Closing Bidding Window...
                        </Text>
                    </div>
                </div>
            )}

            {/* Lottery Overlay - Elegant Modal Style */}
            {isLotteryVisible && lotteryData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500"></div>

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header Gradient */}
                        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

                        <div className="p-8 pb-12 flex flex-col items-center overflow-hidden">
                            <div className="text-center mb-16">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 mb-3">
                                    <Trophy size={14} className="text-amber-600" />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Statutory Draw</span>
                                </div>
                                <Title level={3} className="!mb-1 !text-slate-800">Final Tie-Breaker</Title>
                                <Text className="text-slate-500 text-sm">Selecting a winner from {lotteryData.participants.length} tied members</Text>
                            </div>

                            {/* The Wheel Container */}
                            <div className="relative w-80 h-80 mb-6">
                                {/* Indicator Plate (Decorative Back) */}
                                <div className="absolute -inset-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner"></div>

                                {/* The Physical Wheel */}
                                <div
                                    className="absolute inset-0 rounded-full border-[8px] border-slate-800 shadow-2xl overflow-hidden z-10 transition-transform cubic-bezier(0.15, 0, 0.15, 1)"
                                    style={{
                                        transform: `rotate(${wheelRotation}deg)`,
                                        transitionDuration: '6s',
                                        background: `conic-gradient(${lotteryData.participants.map((p, i) => {
                                            const start = (i / lotteryData.participants.length) * 360;
                                            const end = ((i + 1) / lotteryData.participants.length) * 360;
                                            return `${semanticColors.lotteryPalette[i % semanticColors.lotteryPalette.length]} ${start}deg ${end}deg`;
                                        }).join(', ')
                                            })`
                                    }}
                                >
                                    {/* Slice Dividers and Names */}
                                    {lotteryData.participants.map((p, i) => {
                                        const sliceAngle = 360 / lotteryData.participants.length;
                                        const angle = i * sliceAngle;
                                        return (
                                            <div key={p.ticketId}>
                                                {/* Divider Line */}
                                                <div
                                                    className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-white/20 origin-bottom"
                                                    style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
                                                ></div>

                                                {/* Name Label Container - Unified radial alignment with divider lines */}
                                                <div
                                                    className="absolute top-0 left-1/2 w-0 h-1/2 origin-bottom select-none pointer-events-none flex justify-center"
                                                    style={{ transform: `translateX(-50%) rotate(${angle + sliceAngle / 2}deg)` }}
                                                >
                                                    <div
                                                        className="absolute top-8 flex flex-col items-center justify-center w-32 text-center"
                                                    >
                                                        <div className="text-white font-black text-[10px] leading-tight drop-shadow-[1px_2px_3px_rgba(0,0,0,1)] uppercase tracking-tight px-1">
                                                            {p.memberName}
                                                        </div>
                                                        <div className="text-white/80 font-bold text-[9px] mt-0.5 tracking-widest drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)]">
                                                            {p.ticketNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Center Hub */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-slate-800 shadow-lg z-20 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
                                </div>

                                {/* Pointer / Ticker - Repositioned and resized */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                                    <div className="w-8 h-8 bg-amber-500 rounded-b-lg shadow-lg flex items-start justify-center pt-0.5 border-x-4 border-b-4 border-white">
                                        <div className="w-1.5 h-2.5 bg-white/80 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Result Area */}
                            <div className="w-full text-center relative h-16">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 animate-[fade-in_0.5s_ease-out_6s_forwards]">
                                    <div className="flex flex-col items-center">
                                        <div className="text-amber-600 font-black text-xs uppercase tracking-[0.2em] mb-1 italic">Winner Declared</div>
                                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                                            {lotteryData.participants.find(p => p.ticketId === lotteryData.winnerTicketId)?.memberName}
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center animate-[fade-out_0.5s_ease-out_5.8s_forwards]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                            <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Randomized Server-Side • Compliance Verified</Text>
                        </div>
                    </div>

                    <style>{`
                        @keyframes fade-in {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        @keyframes fade-out {
                            from { opacity: 1; transform: scale(1); }
                            to { opacity: 0; transform: scale(0.9); }
                        }
                        .cubic-bezier(0.15, 0, 0.15, 1) {
                            transition-timing-function: cubic-bezier(0.15, 0, 0.15, 1);
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default LiveAuction;
