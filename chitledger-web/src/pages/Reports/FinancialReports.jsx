import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Tabs, DatePicker, Button, Select, Table, Space, message, Spin } from 'antd';
import { FileText, Download } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const FinancialReports = () => {
    const [activeTab, setActiveTab] = useState('DayBook');

    // Day Book State
    const [dayBookDate, setDayBookDate] = useState(dayjs());
    const [dayBookTrigger, setDayBookTrigger] = useState(0);

    // Ledger State
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [ledgerDates, setLedgerDates] = useState([dayjs().startOf('month'), dayjs()]);
    const [ledgerTrigger, setLedgerTrigger] = useState(0);

    // GSTR State
    const [gstrDates, setGstrDates] = useState([dayjs().startOf('month'), dayjs()]);

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return res.data.data || res.data;
        }
    });

    const { data: dayBookEntries = [], isFetching: isLoadingDayBook } = useQuery({
        queryKey: ['daybook', dayBookDate.format('YYYY-MM-DD'), dayBookTrigger],
        queryFn: async () => {
            const res = await api.get(`/Reporting/daybook?date=${dayBookDate.format('YYYY-MM-DD')}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'DayBook'
    });

    const { data: ledgerEntries = [], isFetching: isLoadingLedger } = useQuery({
        queryKey: ['ledger', selectedAccount, ledgerDates[0]?.format('YYYY-MM-DD'), ledgerDates[1]?.format('YYYY-MM-DD'), ledgerTrigger],
        queryFn: async () => {
            if (!selectedAccount) return [];
            const res = await api.get(`/Reporting/ledger/${selectedAccount}?startDate=${ledgerDates[0].format('YYYY-MM-DD')}&endDate=${ledgerDates[1].format('YYYY-MM-DD')}`);
            return res.data.data || res.data;
        },
        enabled: activeTab === 'Ledger' && !!selectedAccount && ledgerTrigger > 0
    });

    const downloadGstr1 = async () => {
        if (!gstrDates || gstrDates.length !== 2) {
            message.warning("Please select a valid date range");
            return;
        }
        try {
            const start = gstrDates[0].format('YYYY-MM-DD');
            const end = gstrDates[1].format('YYYY-MM-DD');
            const response = await api.get(`/Finance/gstr1?from=${start}&to=${end}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GSTR1_${start}_${end}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            message.success("GSTR-1 Data Exported Successfully");
        } catch (e) {
            message.error("GSTR Download Failed: " + e.message);
        }
    };

    const dayBookColumns = [
        { title: 'Voucher No', dataIndex: 'voucherNumber', key: 'voucherNumber' },
        { title: 'Time', dataIndex: 'transactionDate', key: 'time', render: (date) => new Date(date).toLocaleTimeString() },
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
        { title: 'Date', dataIndex: 'transactionDate', key: 'date', render: (date) => new Date(date).toLocaleDateString() },
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

    const tabItems = [
        {
            key: 'DayBook',
            label: <span className="text-lg font-semibold px-4">Day Book</span>,
            children: (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Date</div>
                            <DatePicker
                                size="large"
                                value={dayBookDate}
                                onChange={(date) => setDayBookDate(date)}
                                className="w-full md:w-64"
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
                        dataSource={dayBookEntries}
                        rowKey={(r, i) => `${r.voucherNumber}-${i}`}
                        loading={{ indicator: <Spin />, spinning: isLoadingDayBook }}
                        pagination={false}
                        bordered
                        size="middle"
                        locale={{ emptyText: 'No transactions found for this date.' }}
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
                        dataSource={ledgerEntries}
                        rowKey={(r, i) => i}
                        loading={{ indicator: <Spin />, spinning: isLoadingLedger }}
                        pagination={false}
                        bordered
                        size="middle"
                        locale={{ emptyText: 'No records found for the selected criteria.' }}
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

                    <div className="flex flex-col md:flex-row gap-6 items-end bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-600 mb-2">Select Filing Period</div>
                            <RangePicker
                                size="large"
                                className="w-full"
                                value={gstrDates}
                                onChange={setGstrDates}
                            />
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            icon={<Download size={18} />}
                            onClick={downloadGstr1}
                            className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-10 shadow-sm"
                        >
                            Download CSV
                        </Button>
                    </div>
                </Card>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800 flex items-center gap-3">
                <FileText size={32} className="text-slate-600" /> Financial Reports
            </Title>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                className="custom-tabs"
            />
        </div>
    );
};

export default FinancialReports;
