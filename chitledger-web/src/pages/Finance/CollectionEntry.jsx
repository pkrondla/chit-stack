import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Printer, CheckCircle } from 'lucide-react';

const CollectionEntry = () => {
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Payment State
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [referenceNumber, setReferenceNumber] = useState('');

    // Dues State
    const [duesInfo, setDuesInfo] = useState(null);

    const handleCheckDues = async () => {
        if (!ticketId) return;
        try {
            // Run Penalty Calc first to be fresh?
            // await api.post('/Finance/calc-penalties'); // Optional: Too slow?

            const res = await api.get(`/Tickets/dues/${ticketId}`);
            setDuesInfo(res.data);
            setAmount(res.data.totalDue); // Auto-fill amount
        } catch (e) {
            alert("Ticket not found or error fetching dues.");
            setDuesInfo(null);
        }
    };

    // Receipt State
    const [lastReceiptId, setLastReceiptId] = useState(null);

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                try {
                    // Ideally we search Tickets/Members. For MVP, fetching all members and filtering locally
                    // Or fetching Groups->Tickets.
                    // Let's rely on a hypothetical 'search' API or just fetch tickets.
                    // Accessing Members list for now.
                    const response = await api.get('/Members');
                    const filtered = response.data.filter(m =>
                        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.phoneNumber.includes(searchTerm)
                    );
                    setSearchResults(filtered);
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectMember = async (member) => {
        // Now fetch active tickets for this member
        // We assume we can get this info. For now, let's mock or try to find an endpoint.
        // We lack a 'GetTicketsByMember' endpoint.
        // Workaround: Fetch all Groups, iterate tickets? Too slow.
        // Better: Ask user to select Group first? 
        // Let's Try: Search returns Members. Click Member -> Show their tickets?
        // We need a way to get TicketID. 
        // Let's iterate Groups and find tickets for this member.
        try {
            const groupsRes = await api.get('/ChitGroups');
            const memberTickets = [];

            // This is N+1 and inefficient, but MVP.
            // Ideally: GET /Members/{id}/Tickets
            for (const group of groupsRes.data) {
                // We don't have tickets in Group Summary DTO usually.
                // We need to fetch Group Details?
                // Or maybe we just ask for Ticket Number + Group?
            }
            // Fallback: Simple UI - Select Group, Select Member (like Enrollment).
            // But Collection usually starts with "Who is paying?".

            // Re-design:
            // 1. Select Group (Dropdown)
            // 2. Select Member (Dropdown filtered by Group)
            // 3. Show Due Amount (Call Demand Generation or calc)
            setSelectedTicket({ memberId: member.id, memberName: member.fullName, tickets: [] }); // Placeholder
        } catch (e) {
            console.error(e);
        }
    };

    // Simpler Approach for MVP:
    // Dropdown Group -> Dropdown Member (who has a ticket).
    const [groups, setGroups] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [ticketId, setTicketId] = useState('');

    useEffect(() => {
        const fetchGroups = async () => {
            const res = await api.get('/ChitGroups');
            setGroups(res.data);
        };
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedGroupId) {
            // Fetch members of this group?
            // We need an endpoint to get Tickets of a group.
            // GET /ChitGroups -> returns list. GET /ChitGroups/{id}?
            // Let's assume we can't easily get it without a new endpoint.
            // But we have `EnrollMember` logic... 
            // We'll trust the user to know the Ticket Number or search Member globally?

            // Alternative: Fetch all members.
        }
    }, [selectedGroupId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // We need a TicketID. 
            // If we only have Member + Group, we need to resolve TicketID.
            // Hack for prototype: We will require Ticket ID input or assume 1-1 mapping if we can't resolve.
            // Let's add a "Ticket ID" lookup or just input Ticket ID directly if known?
            // Better: "Find Ticket" button.

            const payload = {
                ticketId: parseInt(ticketId), // User enters Ticket ID directly?
                amount: parseFloat(amount),
                paymentMode,
                referenceNumber
            };

            const response = await api.post('/Finance/pay', payload);
            setLastReceiptId(response.data.data); // Assuming Result<int> returns ID in data
            alert("Payment Recorded!");
            // Reset form partially
            setAmount('');
            setReferenceNumber('');
        } catch (error) {
            alert("Payment Failed: " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Collection Entry</h2>
                <button
                    onClick={async () => {
                        try { await api.post('/Finance/calc-penalties'); alert('Penalties Updated'); }
                        catch (e) { alert('Failed'); }
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.5rem', backgroundColor: '#fcd34d', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#78350f', fontWeight: 'bold' }}
                >
                    Run Late Fee Calc
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Form */}
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSubmit}>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ticket ID</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value)}
                                    placeholder="Enter Ticket ID"
                                    required
                                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleCheckDues}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Check Dues
                                </button>
                            </div>
                            {duesInfo && (
                                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#9a3412' }}>{duesInfo.memberName} ({duesInfo.groupName})</div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span>Principal:</span> <span>₹{duesInfo.pendingPrincipal.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#c2410c' }}>
                                        <span>Penalty:</span> <span>₹{duesInfo.pendingPenalty.toLocaleString()}</span>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #fdba74', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                        <span>Total Due:</span> <span>₹{duesInfo.totalDue.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Amount Received</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payment Mode</label>
                            <select
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer / NEFT</option>
                                <option value="UPI">UPI</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>

                        {paymentMode !== 'Cash' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reference / Cheque No</label>
                                <input
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Record Payment
                        </button>
                    </form>
                </div>

                {/* Receipt Preview / Action */}
                <div>
                    {lastReceiptId ? (
                        <div style={{ backgroundColor: '#f0fdf4', padding: '2rem', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <CheckCircle size={48} color="#166534" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: '#166534', fontWeight: 'bold', marginBottom: '0.5rem' }}>Payment Successful</h3>
                            <p style={{ color: '#15803d', marginBottom: '1.5rem' }}>Receipt #{lastReceiptId} generated.</p>

                            <button
                                onClick={() => window.open(`https://localhost:7191/api/forms/receipt/${lastReceiptId}`, '_blank')}
                                style={{ display: 'inline-flex', alignItems: 'center', padding: '0.75rem 1.5rem', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                <Printer size={18} style={{ marginRight: '0.5rem' }} />
                                Print Receipt
                            </button>

                            <button
                                onClick={() => { setLastReceiptId(null); setTicketId(''); }}
                                style={{ display: 'block', width: '100%', marginTop: '1rem', padding: '0.5rem', background: 'none', border: 'none', color: '#166534', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Make Another Entry
                            </button>
                        </div>
                    ) : (
                        <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                            <Printer size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                            <p>Receipt download will appear here after payment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionEntry;
