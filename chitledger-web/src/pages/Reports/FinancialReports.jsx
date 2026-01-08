import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Calendar, Filter } from 'lucide-react';

const FinancialReports = () => {
    const [activeTab, setActiveTab] = useState('DayBook');
    const [loading, setLoading] = useState(false);

    // Day Book State
    const [dayBookDate, setDayBookDate] = useState(new Date().toISOString().split('T')[0]);
    const [dayBookEntries, setDayBookEntries] = useState([]);

    // Ledger State
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [ledgerStartDate, setLedgerStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // 1st of month
    const [ledgerEndDate, setLedgerEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [ledgerEntries, setLedgerEntries] = useState([]);

    // Fetch Accounts on Load
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await api.get('/Reporting/accounts');
                setAccounts(res.data);
            } catch (e) {
                console.error("Failed to load accounts", e);
            }
        };
        fetchAccounts();
    }, []);

    const fetchDayBook = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/Reporting/daybook?date=${dayBookDate}`);
            setDayBookEntries(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLedger = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const res = await api.get(`/Reporting/ledger/${selectedAccount}?startDate=${ledgerStartDate}&endDate=${ledgerEndDate}`);
            setLedgerEntries(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Financial Reports</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('DayBook')}
                    style={{
                        padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold',
                        color: activeTab === 'DayBook' ? '#0f172a' : '#64748b',
                        borderBottom: activeTab === 'DayBook' ? '2px solid #0f172a' : 'none'
                    }}
                >
                    Day Book
                </button>
                <button
                    onClick={() => setActiveTab('Ledger')}
                    style={{
                        padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold',
                        color: activeTab === 'Ledger' ? '#0f172a' : '#64748b',
                        borderBottom: activeTab === 'Ledger' ? '2px solid #0f172a' : 'none'
                    }}
                >
                    General Ledger
                </button>
            </div>

            {activeTab === 'DayBook' && (
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Select Date</label>
                            <input
                                type="date"
                                value={dayBookDate}
                                onChange={(e) => setDayBookDate(e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <button
                            onClick={fetchDayBook}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            View Report
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '0.75rem' }}>Voucher No</th>
                                <th style={{ padding: '0.75rem' }}>Time</th>
                                <th style={{ padding: '0.75rem' }}>Particulars</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dayBookEntries.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No transactions found for this date.</td></tr>
                            ) : (
                                dayBookEntries.map((entry, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem' }}>{entry.voucherNumber}</td>
                                        <td style={{ padding: '0.75rem' }}>{new Date(entry.transactionDate).toLocaleTimeString()}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{entry.accountName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{entry.narration}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: entry.debitAmount > 0 ? '#dc2626' : 'inherit' }}>
                                            {entry.debitAmount > 0 ? entry.debitAmount.toLocaleString() : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: entry.creditAmount > 0 ? '#166534' : 'inherit' }}>
                                            {entry.creditAmount > 0 ? entry.creditAmount.toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Ledger' && (
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Select Account</label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <option value="">-- Select Account --</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.type})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Start Date</label>
                            <input
                                type="date"
                                value={ledgerStartDate}
                                onChange={(e) => setLedgerStartDate(e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>End Date</label>
                            <input
                                type="date"
                                value={ledgerEndDate}
                                onChange={(e) => setLedgerEndDate(e.target.value)}
                                style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <button
                            onClick={fetchLedger}
                            disabled={!selectedAccount}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: !selectedAccount ? 0.5 : 1 }}
                        >
                            Generate Ledger
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '0.75rem' }}>Date</th>
                                <th style={{ padding: '0.75rem' }}>Particulars (Narration)</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Credit</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgerEntries.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No records found.</td></tr>
                            ) : (
                                ledgerEntries.map((entry, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem' }}>{new Date(entry.transactionDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem' }}>{entry.narration}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.debitAmount > 0 ? entry.debitAmount.toLocaleString() : '-'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.creditAmount > 0 ? entry.creditAmount.toLocaleString() : '-'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{entry.runningBalance.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FinancialReports;
