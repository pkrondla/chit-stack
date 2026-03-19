import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, Typography, Tabs, DatePicker, Button, Select, Table, Space, message, Spin, Divider } from 'antd';
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

    const { data: ledgerEntries = [], isFetching: isLoadingLedger } = useQuery({
        queryKey: ['ledger', selectedAccount, ledgerDates?.[0]?.format('YYYY-MM-DD'), ledgerDates?.[1]?.format('YYYY-MM-DD'), ledgerTrigger, selectedBranch],
        queryFn: async () => {
            if (!selectedAccount || !ledgerDates?.[0] || !ledgerDates?.[1]) return [];
            const branchParam = selectedBranch ? `&branchId=${selectedBranch}` : '';
            const res = await api.get(`/Reporting/ledger/${selectedAccount}?startDate=${ledgerDates[0].format('YYYY-MM-DD')}&endDate=${ledgerDates[1].format('YYYY-MM-DD')}${branchParam}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'Ledger' && !!selectedAccount && ledgerTrigger > 0 && !!ledgerDates?.[0] && !!ledgerDates?.[1]
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

    const { data: trialBalance, isFetching: isLoadingTB } = useQuery({
        queryKey: ['trial-balance', dayBookDates?.[1]?.format('YYYY-MM-DD'), selectedBranch],
        queryFn: async () => {
            if (!dayBookDates?.[1]) return null;
            const res = await api.get(`/Reporting/trial-balance?asOfDate=${dayBookDates[1].format('YYYY-MM-DD')}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'TrialBalance' && !!dayBookDates?.[1]
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
            render: (val) => val > 0 ? <span className="text-red-600 font-semibold">{val.toLocaleString()}</span> : '-'
        },
        {
            title: 'Credit',
            dataIndex: 'creditAmount',
            key: 'creditAmount',
            align: 'right',
            render: (val) => val > 0 ? <span className="text-green-700 font-semibold">{val.toLocaleString()}</span> : '-'
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
            render: (val) => val > 0 ? val.toLocaleString() : '-'
        },
        {
            title: 'Credit',
            dataIndex: 'creditAmount',
            key: 'creditAmount',
            align: 'right',
            render: (val) => val > 0 ? val.toLocaleString() : '-'
        },
        {
            title: 'Balance',
            dataIndex: 'runningBalance',
            key: 'balance',
            align: 'right',
            render: (val) => <span className="font-bold text-slate-800">{val.toLocaleString()}</span>
        }
    ];

    const gstrColumns = [
        { title: 'Invoice No', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
        { title: 'Date', dataIndex: 'invoiceDate', key: 'invoiceDate', render: (date) => dayjs(date).format('DD-MM-YYYY') },
        { title: 'Receiver', dataIndex: 'receiverName', key: 'receiverName' },
        { title: 'Taxable Value', dataIndex: 'taxableValue', key: 'taxableValue', align: 'right', render: (val) => val.toLocaleString() },
        { title: 'CGST (9%)', dataIndex: 'centralTax', key: 'centralTax', align: 'right', render: (val) => val.toLocaleString() },
        { title: 'SGST (9%)', dataIndex: 'stateTax', key: 'stateTax', align: 'right', render: (val) => val.toLocaleString() },
        { title: 'Total Value', dataIndex: 'invoiceValue', key: 'invoiceValue', align: 'right', render: (val) => val.toLocaleString() }
    ];

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
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex-[2]">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Account</div>
                            <Select
                                size="large"
                                className="w-full"
                                placeholder="-- Select Account --"
                                value={selectedAccount}
                                onChange={setSelectedAccount}
                                showSearch
                                optionFilterProp="children"
                            >
                                {accounts.map(acc => (
                                    <Select.Option key={acc.id} value={acc.id}>
                                        {acc.accountName} <span className="text-slate-400 text-xs ml-1">({acc.type})</span>
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex-[2]">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Date Range</div>
                            <RangePicker
                                size="large"
                                className="w-full"
                                value={ledgerDates}
                                onChange={setLedgerDates}
                            />
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setLedgerTrigger(t => t + 1)}
                            disabled={!selectedAccount || !ledgerDates}
                            loading={isLoadingLedger}
                            className="bg-slate-900 font-bold px-8 flex-1 md:flex-none"
                        >
                            Generate Ledger
                        </Button>
                    </div>

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
                                columns={[{ title: 'Account', dataIndex: 'accountName' }, { title: 'Amount', dataIndex: 'amount', align: 'right', render: v => v.toLocaleString() }]}
                                dataSource={plData?.income || []}
                                pagination={false}
                                size="small"
                                rowKey="accountName"
                            />
                        </div>
                        <div>
                            <Title level={4}>Expense</Title>
                            <Table
                                columns={[{ title: 'Account', dataIndex: 'accountName' }, { title: 'Amount', dataIndex: 'amount', align: 'right', render: v => v.toLocaleString() }]}
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
                            ₹{plData?.netProfit?.toLocaleString() || 0}
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
                            { title: 'Account', dataIndex: 'accountName' },
                            { title: 'Debit', dataIndex: 'debitBalance', align: 'right', render: v => v > 0 ? v.toLocaleString() : '-' },
                            { title: 'Credit', dataIndex: 'creditBalance', align: 'right', render: v => v > 0 ? v.toLocaleString() : '-' }
                        ]}
                        dataSource={trialBalance?.lines || []}
                        pagination={false}
                        rowKey="accountCode"
                        summary={() => (
                            <Table.Summary fixed>
                                <Table.Summary.Row className="bg-slate-50 font-bold">
                                    <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">₹{trialBalance?.totalDebit?.toLocaleString()}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="right">₹{trialBalance?.totalCredit?.toLocaleString()}</Table.Summary.Cell>
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
                                        <Table.Summary.Cell index={1} align="right">₹{totalTaxable.toLocaleString()}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} align="right">₹{totalCGST.toLocaleString()}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} align="right">₹{totalSGST.toLocaleString()}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} align="right">₹{totalInvoice.toLocaleString()}</Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                    />
                </Card>
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
