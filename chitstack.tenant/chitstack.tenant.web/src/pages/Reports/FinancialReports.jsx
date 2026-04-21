import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, Typography, Tabs, DatePicker, Button, Select, Table, Space, message, Spin, Divider, TreeSelect } from 'antd';
import { FileText, Download } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const FinancialReports = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'DayBook');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (key) => {
        setActiveTab(key);
        if (key === 'DayBook') {
            setSearchParams({});
        } else {
            setSearchParams({ tab: key });
        }
    };

    // Day Book State
    const [dayBookDates, setDayBookDates] = useState([dayjs(), dayjs()]);
    const [dayBookTrigger, setDayBookTrigger] = useState(0);

    // Ledger State
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [ledgerDates, setLedgerDates] = useState([dayjs().startOf('month'), dayjs()]);
    const [ledgerTrigger, setLedgerTrigger] = useState(0);

    // GSTR State
    const [gstrDates, setGstrDates] = useState([dayjs().startOf('month'), dayjs()]);
    const [gstrTrigger, setGstrTrigger] = useState(0);

    // Filters
    const { user, activeBranch } = useAuthStore();
    const isAdmin = user?.role === 'Admin';
    const [selectedBranch, setSelectedBranch] = useState(activeBranch?.id || null);

    // Reset triggers on branch change
    useEffect(() => {
        setDayBookTrigger(0);
        setLedgerTrigger(0);
        setGstrTrigger(0);
    }, [selectedBranch]);

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await api.get('/Reporting/branches');
            return res.data.data || res.data;
        }
    });

    // Handle initial branch selection and synchronization
    useEffect(() => {
        if (branches.length > 0 && !selectedBranch) {
            if (activeBranch && branches.some(b => b.id === activeBranch.id)) {
                setSelectedBranch(activeBranch.id);
            } else if (!isAdmin) {
                setSelectedBranch(branches[0].id);
            }
        }
    }, [branches, activeBranch, isAdmin, selectedBranch]);

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const { data: dayBookEntries = [], isFetching: isLoadingDayBook } = useQuery({
        queryKey: ['daybook', dayBookDates?.[0]?.format('YYYY-MM-DD'), dayBookDates?.[1]?.format('YYYY-MM-DD'), dayBookTrigger, selectedBranch],
        queryFn: async () => {
            if (!dayBookDates?.[0] || !dayBookDates?.[1]) return [];
            const res = await api.get(`/Reporting/daybook?date=${dayBookDates[0].format('YYYY-MM-DD')}&endDate=${dayBookDates[1].format('YYYY-MM-DD')}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'DayBook' && dayBookTrigger > 0 && !!dayBookDates?.[0] && !!dayBookDates?.[1]
    });

    const { data: members = [] } = useQuery({
        queryKey: ['members-list', selectedBranch],
        queryFn: async () => {
            const res = await api.get(`/Members${selectedBranch ? `?branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        }
    });

    const { data: ledgerEntries = [], isFetching: isLoadingLedger } = useQuery({
        queryKey: ['ledger', selectedAccount, selectedMember, selectedGroup, ledgerDates?.[0]?.format('YYYY-MM-DD'), ledgerDates?.[1]?.format('YYYY-MM-DD'), ledgerTrigger, selectedBranch],
        queryFn: async () => {
            if (!selectedAccount && !selectedMember && !selectedGroup) return [];
            if (!ledgerDates?.[0] || !ledgerDates?.[1]) return [];
            
            let url = `/Reporting/ledger/${selectedAccount || 0}?startDate=${ledgerDates[0].format('YYYY-MM-DD')}&endDate=${ledgerDates[1].format('YYYY-MM-DD')}`;
            if (selectedBranch) url += `&branchId=${selectedBranch}`;
            if (selectedMember) url += `&memberId=${selectedMember}`;
            if (selectedGroup) url += `&chitGroupId=${selectedGroup}`;
            
            const res = await api.get(url);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'Ledger' && (!!selectedAccount || !!selectedMember || !!selectedGroup) && ledgerTrigger > 0 && !!ledgerDates?.[0] && !!ledgerDates?.[1]
    });

    const { data: gstrData = [], isFetching: isLoadingGSTR } = useQuery({
        queryKey: ['gstr1', gstrDates?.[0]?.format('YYYY-MM-DD'), gstrDates?.[1]?.format('YYYY-MM-DD'), gstrTrigger, selectedBranch],
        queryFn: async () => {
            if (!gstrDates?.[0] || !gstrDates?.[1]) return [];
            const res = await api.get(`/Finance/gstr1-data?from=${gstrDates[0].format('YYYY-MM-DD')}&to=${gstrDates[1].format('YYYY-MM-DD')}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'GSTR' && gstrTrigger > 0 && !!gstrDates?.[0] && !!gstrDates?.[1]
    });

    const { data: plData, isFetching: isLoadingPL } = useQuery({
        queryKey: ['profit-loss', ledgerDates[0]?.format('YYYY-MM-DD'), ledgerDates[1]?.format('YYYY-MM-DD'), selectedBranch],
        queryFn: async () => {
            const res = await api.get(`/Reporting/profit-loss?start=${ledgerDates[0].format('YYYY-MM-DD')}&end=${ledgerDates[1].format('YYYY-MM-DD')}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'ProfitLoss'
    });

    const { data: trialBalance } = useQuery({
        queryKey: ['trial-balance', dayBookDates?.[1]?.format('YYYY-MM-DD'), selectedBranch],
        queryFn: async () => {
            if (!dayBookDates?.[1]) return null;
            const res = await api.get(`/Reporting/trial-balance?asOfDate=${dayBookDates[1].format('YYYY-MM-DD')}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'TrialBalance' && !!dayBookDates?.[1]
    });

    const { data: cashBookEntries = [], isFetching: isLoadingCashBook } = useQuery({
        queryKey: ['cash-book', dayBookDates?.[0]?.format('YYYY-MM-DD'), dayBookDates?.[1]?.format('YYYY-MM-DD'), selectedBranch],
        queryFn: async () => {
            if (!dayBookDates?.[0] || !dayBookDates?.[1]) return [];
            const res = await api.get(`/Reporting/cash-book?from=${dayBookDates[0].format('YYYY-MM-DD')}&to=${dayBookDates[1].format('YYYY-MM-DD')}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'CashBook' && !!dayjs(dayBookDates?.[0]) && !!dayjs(dayBookDates?.[1])
    });

    const downloadGstr1 = async () => {
        try {
            const from = gstrDates[0].format('YYYY-MM-DD');
            const to = gstrDates[1].format('YYYY-MM-DD');
            const branchParam = selectedBranch ? `&branchId=${selectedBranch}` : '';
            const res = await api.get(`/Finance/gstr1?from=${from}&to=${to}${branchParam}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GSTR1_${from}_${to}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error('Failed to download GSTR-1 report');
        }
    };

    const dayBookColumns = [
        { title: 'Voucher No', dataIndex: 'voucherNumber', key: 'voucherNumber' },
        { title: 'Date & Time', dataIndex: 'transactionDate', key: 'time', render: (date) => dayjs(date).format('DD-MM-YYYY hh:mm A') },
        {
            title: 'Particulars',
            key: 'particulars',
            render: (_, record) => (
                <div>
                    <div className="font-bold text-slate-800">{record.accountName}</div>
                    <div className="text-xs text-slate-500">{record.narration}</div>
                </div>
            )
        },
        {
            title: 'Debit',
            dataIndex: 'debitAmount',
            key: 'debitAmount',
            align: 'right',
            render: (val) => val > 0 ? <span className="text-red-600 font-semibold">{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : '-'
        },
        {
            title: 'Credit',
            dataIndex: 'creditAmount',
            key: 'creditAmount',
            align: 'right',
            render: (val) => val > 0 ? <span className="text-green-700 font-semibold">{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : '-'
        }
    ];

    const ledgerColumns = [
        { title: 'Date', dataIndex: 'transactionDate', key: 'date', render: (date) => dayjs(date).format('DD-MM-YYYY') },
        { title: 'Particulars (Narration)', dataIndex: 'narration', key: 'narration', render: (text) => <span className="text-slate-700">{text}</span> },
        {
            title: 'Debit',
            dataIndex: 'debitAmount',
            key: 'debitAmount',
            align: 'right',
            render: (val) => val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
        },
        {
            title: 'Credit',
            dataIndex: 'creditAmount',
            key: 'creditAmount',
            align: 'right',
            render: (val) => val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
        },
        {
            title: 'Balance',
            dataIndex: 'runningBalance',
            key: 'balance',
            align: 'right',
            render: (val) => <span className="font-bold text-slate-800">{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        }
    ];

    const gstrColumns = [
        { title: 'Invoice No', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
        { title: 'Date', dataIndex: 'invoiceDate', key: 'invoiceDate', render: (date) => dayjs(date).format('DD-MM-YYYY') },
        { title: 'Receiver', dataIndex: 'receiverName', key: 'receiverName' },
        { title: 'Taxable Value', dataIndex: 'taxableValue', key: 'taxableValue', align: 'right', render: (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        { title: 'CGST (9%)', dataIndex: 'centralTax', key: 'centralTax', align: 'right', render: (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        { title: 'SGST (9%)', dataIndex: 'stateTax', key: 'stateTax', align: 'right', render: (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        { title: 'Total Value', dataIndex: 'invoiceValue', key: 'invoiceValue', align: 'right', render: (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
    ];

    // Helper to build TreeSelect data with Virtual Sub-ledgers
    const buildAccountTree = (data, pid = null) => {
        return data
            .filter(a => (a.parentId || (pid === null ? null : 0)) === pid)
            .map(node => {
                const children = buildAccountTree(data, node.id);
                
                // Inject virtual members under Member Receivables
                if (node.systemRole === 'MemberReceivable' && members.length > 0) {
                    members.forEach(m => {
                        children.push({
                            title: <span className="text-indigo-600 font-medium">{m.fullName} <small className="opacity-60">({m.phoneNumber})</small></span>,
                            value: `M-${node.id}-${m.id}`, // Format: Kind-ParentID-ActualID
                            key: `m-${m.id}`,
                            selectable: true,
                            isSubLedger: true
                        });
                    });
                }

                return {
                    title: node.isGroup ? <span className="font-bold text-slate-500 uppercase">{node.accountName}</span> : <span>{node.accountName} <small className="text-slate-400">({node.accountCode})</small></span>,
                    value: node.id.toString(),
                    key: node.id,
                    selectable: !node.isGroup,
                    children: children.length > 0 ? children : undefined
                };
            });
    };

    const handleAccountSelect = (val) => {
        if (!val) {
            setSelectedAccount(null);
            setSelectedMember(null);
            setSelectedGroup(null);
            return;
        }

        if (typeof val === 'string' && val.startsWith('M-')) {
            const [, parentId, memberId] = val.split('-');
            setSelectedAccount(parseInt(parentId));
            setSelectedMember(parseInt(memberId));
            setSelectedGroup(null);
        } else if (typeof val === 'string' && val.startsWith('G-')) {
            const [, parentId, groupId] = val.split('-');
            setSelectedAccount(parseInt(parentId));
            setSelectedGroup(parseInt(groupId));
            setSelectedMember(null);
        } else {
            setSelectedAccount(parseInt(val));
            setSelectedMember(null);
            setSelectedGroup(null);
        }
    };

    const tabItems = [
        {
            key: 'DayBook',
            label: <span className="text-lg font-semibold px-4">Day Book</span>,
            children: (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Range</div>
                            <RangePicker
                                size="large"
                                value={dayBookDates}
                                onChange={(dates) => setDayBookDates(dates)}
                                className="w-full md:w-80"
                            />
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setDayBookTrigger(t => t + 1)}
                            className="bg-slate-900 font-bold px-8"
                            loading={isLoadingDayBook}
                        >
                            View Report
                        </Button>
                    </div>

                    <Table
                        columns={dayBookColumns}
                        dataSource={dayBookTrigger > 0 ? dayBookEntries : []}
                        rowKey="id"
                        loading={{ indicator: <Spin />, spinning: isLoadingDayBook }}
                        pagination={false}
                        bordered
                        size="middle"
                        locale={{ emptyText: 'Click "View Report" to fetch data for the selected branch.' }}
                    />
                </div>
            )
        },
        {
            key: 'Ledger',
            label: <span className="text-lg font-semibold px-4">General Ledger</span>,
            children: (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="lg:col-span-4">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Account</div>
                            <TreeSelect
                                showSearch
                                size="large"
                                className="w-full"
                                value={selectedMember ? `M-${selectedAccount}-${selectedMember}` : selectedGroup ? `G-${selectedAccount}-${selectedGroup}` : selectedAccount?.toString()}
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                placeholder="-- Select Account --"
                                allowClear
                                treeNodeFilterProp="title"
                                treeDefaultExpandAll={false}
                                onChange={handleAccountSelect}
                                treeData={buildAccountTree(accounts)}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <div className="text-sm font-semibold text-slate-600 mb-2 flex justify-between">
                                <span>OR Search Member</span>
                                {selectedMember && <a className="text-xs text-indigo-600" onClick={() => setSelectedMember(null)}>Clear</a>}
                            </div>
                            <Select
                                size="large"
                                className="w-full"
                                placeholder="Type Member Name..."
                                value={selectedMember}
                                onChange={(val) => {
                                    const memberAcc = accounts.find(a => a.systemRole === 'MemberReceivable');
                                    if (memberAcc) setSelectedAccount(memberAcc.id);
                                    setSelectedMember(val);
                                    setSelectedGroup(null);
                                }}
                                showSearch
                                optionFilterProp="children"
                                allowClear
                            >
                                {members.map(m => (
                                    <Select.Option key={m.id} value={m.id}>
                                        {m.fullName} <span className="text-slate-400 text-xs ml-1">({m.phoneNumber})</span>
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div className="lg:col-span-3">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Date Range</div>
                            <RangePicker
                                size="large"
                                className="w-full"
                                value={ledgerDates}
                                onChange={setLedgerDates}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => setLedgerTrigger(t => t + 1)}
                                disabled={!selectedAccount && !selectedMember && !selectedGroup}
                                loading={isLoadingLedger}
                                className="bg-slate-900 font-bold w-full"
                            >
                                Generate Ledger
                            </Button>
                        </div>
                    </div>

                    {(selectedMember || selectedGroup) && (
                        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center">
                            <span className="text-indigo-800 font-semibold flex items-center gap-2">
                                <FileText size={16} /> 
                                Viewing Sub-ledger for {selectedMember ? 'Specific Member' : 'Specific Group'} 
                                <span className="text-xs font-normal opacity-75">(Main Account: {accounts.find(a => a.id === selectedAccount)?.accountName})</span>
                            </span>
                            <Button size="small" type="link" className="text-indigo-600 font-bold" onClick={() => {
                                setSelectedMember(null);
                                setSelectedGroup(null);
                                setLedgerTrigger(t => t + 1);
                            }}>
                                Show Full Account
                            </Button>
                        </div>
                    )}

                    <Table
                        columns={ledgerColumns}
                        dataSource={ledgerTrigger > 0 ? ledgerEntries : []}
                        rowKey="id"
                        loading={{ indicator: <Spin />, spinning: isLoadingLedger }}
                        pagination={false}
                        bordered
                        size="middle"
                        locale={{ emptyText: 'Click "Generate Ledger" to fetch records for the selected branch.' }}
                    />
                </div>
            )
        },
        {
            key: 'ProfitLoss',
            label: <span className="text-lg font-semibold px-4">Profit & Loss</span>,
            children: (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex-none">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Period</div>
                            <RangePicker
                                size="large"
                                className="w-full md:w-80"
                                value={ledgerDates}
                                onChange={setLedgerDates}
                            />
                        </div>
                        <Button type="primary" size="large" onClick={() => setActiveTab('ProfitLoss')} loading={isLoadingPL} className="bg-slate-900 font-bold px-8">
                            Refresh
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <Title level={4}>Income</Title>
                            <Table
                                columns={[{ title: 'Account', dataIndex: 'accountName' }, { title: 'Amount', dataIndex: 'amount', align: 'right', render: v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }]}
                                dataSource={plData?.income || []}
                                pagination={false}
                                size="small"
                                rowKey="accountName"
                            />
                        </div>
                        <div>
                            <Title level={4}>Expense</Title>
                            <Table
                                columns={[{ title: 'Account', dataIndex: 'accountName' }, { title: 'Amount', dataIndex: 'amount', align: 'right', render: v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }]}
                                dataSource={plData?.expense || []}
                                pagination={false}
                                size="small"
                                rowKey="accountName"
                            />
                        </div>
                    </div>
                    <Divider />
                    <div className="flex justify-between text-xl font-bold">
                        <span>Net Profit:</span>
                        <span className={plData?.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                            ₹{plData?.netProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'TrialBalance',
            label: <span className="text-lg font-semibold px-4">Trial Balance</span>,
            children: (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <Table
                        columns={[
                            { 
                                title: 'Account', 
                                dataIndex: 'accountName',
                                render: (text, record) => (
                                    record.isGroup ? 
                                    <span className="font-bold text-slate-700">{text}</span> : 
                                    <a 
                                        className={`${record.isSubLedgerLine ? 'text-indigo-600' : 'text-blue-600'} hover:underline font-medium`}
                                        onClick={() => {
                                            if (record.isSubLedgerLine) {
                                                setSelectedAccount(record.parentId);
                                                setSelectedMember(record.memberId);
                                                setSelectedGroup(record.chitGroupId);
                                            } else {
                                                setSelectedAccount(record.id);
                                                setSelectedMember(null);
                                                setSelectedGroup(null);
                                            }
                                            setLedgerTrigger(t => t + 1);
                                            handleTabChange('Ledger');
                                        }}
                                    >
                                        {text} {record.isSubLedgerLine && <span className="text-[10px] bg-indigo-50 px-1 rounded uppercase">Sub</span>}
                                    </a>
                                )
                            },
                            { title: 'Debit', dataIndex: 'debitBalance', align: 'right', render: v => v > 0 ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00' },
                            { title: 'Credit', dataIndex: 'creditBalance', align: 'right', render: v => v > 0 ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00' }
                        ]}
                        dataSource={trialBalance?.lines || []}
                        pagination={false}
                        rowKey="id"
                        expandable={{
                            childrenColumnName: 'children',
                            defaultExpandAllRows: true
                        }}
                        summary={() => (
                            <Table.Summary fixed>
                                <Table.Summary.Row className="bg-slate-50 font-bold">
                                    <Table.Summary.Cell index={0}>Total (Root Levels)</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">₹{trialBalance?.totalDebit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="right">₹{trialBalance?.totalCredit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        )}
                    />
                </div>
            )
        },
        {
            key: 'GSTR',
            label: <span className="text-lg font-semibold px-4">GSTR-1</span>,
            children: (
                <Card className="border border-slate-200 shadow-sm" styles={{ body: { padding: '2rem' } }}>
                    <Title level={3} className="!mb-2 text-slate-800">GSTR-1 Export (B2C)</Title>
                    <div className="text-slate-500 mb-8 border-b border-slate-100 pb-4">
                        Exports Commission & Fee entries in standard GSTR-1 CSV format.
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-end bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
                        <div className="flex-none">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Filing Period</div>
                            <RangePicker
                                size="large"
                                className="w-full md:w-80"
                                value={gstrDates}
                                onChange={setGstrDates}
                            />
                        </div>
                        <Space>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => setGstrTrigger(t => t + 1)}
                                loading={isLoadingGSTR}
                                className="bg-slate-900 font-bold px-8 h-10 shadow-sm"
                            >
                                View Report
                            </Button>
                            <Button
                                size="large"
                                icon={<Download size={18} />}
                                onClick={downloadGstr1}
                                disabled={gstrData.length === 0}
                                className="font-bold px-8 h-10 shadow-sm border-slate-300"
                            >
                                Download CSV
                            </Button>
                        </Space>
                    </div>

                    <Table
                        columns={gstrColumns}
                        dataSource={gstrData}
                        rowKey="invoiceNumber"
                        loading={isLoadingGSTR}
                        pagination={false}
                        bordered
                        size="middle"
                        locale={{ emptyText: 'Click "View Report" to fetch GSTR-1 data.' }}
                        summary={pageData => {
                            let totalTaxable = 0;
                            let totalCGST = 0;
                            let totalSGST = 0;
                            let totalInvoice = 0;

                            pageData.forEach(({ taxableValue, centralTax, stateTax, invoiceValue }) => {
                                totalTaxable += taxableValue;
                                totalCGST += centralTax;
                                totalSGST += stateTax;
                                totalInvoice += invoiceValue;
                            });

                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row className="bg-slate-50 font-bold">
                                        <Table.Summary.Cell index={0} colSpan={3}>Total</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">₹{totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} align="right">₹{totalCGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} align="right">₹{totalSGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} align="right">₹{totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                    />
                </Card>
            )
        },
        {
            key: 'CashBook',
            label: <span className="text-lg font-semibold px-4">Cash Book</span>,
            children: (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex-1 max-w-md">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Range</div>
                            <RangePicker
                                size="large"
                                value={dayBookDates}
                                onChange={(dates) => setDayBookDates(dates)}
                                className="w-full"
                            />
                        </div>
                        <Space>
                            <Button
                                type="primary"
                                size="large"
                                icon={<Download size={18} />}
                                onClick={async () => {
                                    const from = dayBookDates[0].format('YYYY-MM-DD');
                                    const to = dayBookDates[1].format('YYYY-MM-DD');
                                    const branchParam = selectedBranch ? `&branchId=${selectedBranch}` : '';
                                    const response = await api.get(`/Reporting/cash-book/pdf?from=${from}&to=${to}${branchParam}`, { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `Form_IX_CashBook_${from}_to_${to}.pdf`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                }}
                                className="bg-green-700 hover:bg-green-800 border-none px-6"
                            >
                                Export PDF (Form IX)
                            </Button>
                        </Space>
                    </div>

                    <Table
                        columns={[
                            { title: 'Date', dataIndex: 'transactionDate', width: 110, render: d => dayjs(d).format('DD-MM-YY') },
                            { title: 'Particulars', dataIndex: 'narration' },
                            { title: 'Voucher', dataIndex: 'voucherNumber', width: 100 },
                            { title: 'Receipts (Dr)', dataIndex: 'debitAmount', align: 'right', render: v => v > 0 ? v.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-' },
                            { title: 'Payments (Cr)', dataIndex: 'creditAmount', align: 'right', render: v => v > 0 ? v.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-' }
                        ]}
                        dataSource={cashBookEntries}
                        rowKey="id"
                        loading={isLoadingCashBook}
                        pagination={false}
                        bordered
                    />
                </div>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <Title level={2} className="!mb-0 text-slate-800 flex items-center gap-3">
                    <FileText size={32} className="text-slate-600" /> Financial Reports
                </Title>

                <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm font-semibold text-slate-500">Branch:</span>
                    <Select
                        placeholder={isAdmin ? "All Branches" : "Select Branch"}
                        allowClear={isAdmin}
                        className="w-48"
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                    >
                        {branches.map(b => (
                            <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                        ))}
                    </Select>
                </div>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={tabItems}
                className="custom-tabs"
            />
        </div>
    );
};

export default FinancialReports;
