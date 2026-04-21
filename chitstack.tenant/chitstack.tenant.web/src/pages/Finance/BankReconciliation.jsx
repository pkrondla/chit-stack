import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Button, DatePicker, Select, Checkbox, message, Typography, Space } from 'antd';
import { CheckCheck, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text } = Typography;

const BankReconciliation = () => {
    const queryClient = useQueryClient();
    const [selectedBank, setSelectedBank] = useState(null);
    const [reconcileDate, setReconcileDate] = useState(dayjs());
    const [filterDates, setFilterDates] = useState([dayjs(), dayjs()]);
    const [viewStatus, setViewStatus] = useState('Pending');
    const [selectedLines, setSelectedLines] = useState([]);

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            const data = res.data.data || res.data;
            return data.filter(a =>
                a.type === 'Asset' && (
                    a.systemRole === 'Bank' ||
                    a.bankDetails ||
                    (a.accountName?.toLowerCase().includes('bank') && !a.accountName?.toLowerCase().includes('charges'))
                )
            );
        }
    });

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['bank-entries', selectedBank, filterDates[0]?.format('YYYY-MM-DD'), filterDates[1]?.format('YYYY-MM-DD'), viewStatus],
        queryFn: async () => {
            const unreconciled = viewStatus === 'Pending' ? '&unreconciledOnly=true' : '';
            const reconciled = viewStatus === 'Reconciled' ? '&reconciledOnly=true' : '';
            const res = await api.get(`/Reporting/ledger/${selectedBank}?startDate=${filterDates[0].format('YYYY-MM-DD')}&endDate=${filterDates[1].format('YYYY-MM-DD')}${unreconciled}${reconciled}`);
            return res.data.data || res.data;
        },
        enabled: !!selectedBank
    });

    const reconcileMutation = useMutation({
        mutationFn: async () => {
            // Combine the selected date with the current time for precise ordering
            const now = dayjs();
            const fullReconcileDate = reconcileDate
                .hour(now.hour())
                .minute(now.minute())
                .second(now.second());

            return api.post('/Finance/reconcile', {
                journalEntryLineIds: selectedLines,
                reconciliationDate: fullReconcileDate.format('YYYY-MM-DDTHH:mm:ss')
            });
        },
        onSuccess: () => {
            message.success('Transactions reconciled successfully');
            setSelectedLines([]);
            queryClient.invalidateQueries(['unreconciled']);
        }
    });

    const columns = [
        { title: 'Date', dataIndex: 'transactionDate', render: d => dayjs(d).format('DD-MM-YYYY') },
        { title: 'Particulars', dataIndex: 'narration' },
        { title: 'Debit', dataIndex: 'debitAmount', align: 'right', render: v => v > 0 ? v.toLocaleString() : '-' },
        { title: 'Credit', dataIndex: 'creditAmount', align: 'right', render: v => v > 0 ? v.toLocaleString() : '-' },
        ...(viewStatus === 'Reconciled' ? [{ title: 'Reconciled Date', dataIndex: 'reconciliationDate', render: d => d ? dayjs(d).format('DD-MM-YYYY hh:mm A') : '-' }] : [])
    ];

    const rowSelection = {
        selectedRowKeys: selectedLines,
        onChange: setSelectedLines,
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <Title level={2} className="mb-8">Bank Reconciliation</Title>

            <Card className="mb-8 shadow-sm">
                <div className="flex flex-wrap gap-6 items-end">
                    <div className="flex-1 min-w-[250px]">
                        <Text strong className="block mb-2">Select Bank Account</Text>
                        <Select
                            className="w-full"
                            size="large"
                            placeholder="Select Bank"
                            value={selectedBank}
                            onChange={setSelectedBank}
                        >
                            {accounts.map(a => <Select.Option key={a.id} value={a.id}>{a.accountName} <span className="text-xs text-slate-400">({a.accountCode})</span></Select.Option>)}
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[250px]">
                        <Text strong className="block mb-2">Filter Period (From - To)</Text>
                        <DatePicker.RangePicker
                            className="w-full"
                            size="large"
                            value={filterDates}
                            onChange={setFilterDates}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Text strong className="block mb-2">View Status</Text>
                        <Select
                            className="w-full"
                            size="large"
                            value={viewStatus}
                            onChange={setViewStatus}
                        >
                            <Select.Option value="Pending">Pending (Unreconciled)</Select.Option>
                            <Select.Option value="Reconciled">Reconciled</Select.Option>
                            <Select.Option value="All">All Transactions</Select.Option>
                        </Select>
                    </div>
                    {viewStatus === 'Pending' && (
                        <div className="flex-1 min-w-[200px]">
                            <Text strong className="block mb-2">Reconciliation Date</Text>
                            <DatePicker
                                className="w-full"
                                size="large"
                                value={reconcileDate}
                                onChange={setReconcileDate}
                            />
                        </div>
                    )}
                    {viewStatus === 'Pending' && (
                        <Button
                            type="primary"
                            size="large"
                            icon={<CheckCheck size={18} />}
                            disabled={selectedLines.length === 0}
                            onClick={() => reconcileMutation.mutate()}
                            loading={reconcileMutation.isPending}
                            className="bg-slate-900 h-10 px-8"
                        >
                            Mark as Reconciled
                        </Button>
                    )}
                </div>
            </Card>

            <Card title={`${viewStatus} Transactions (${entries.length})`} className="shadow-sm rounded-xl">
                <Table
                    rowSelection={viewStatus === 'Pending' ? rowSelection : null}
                    columns={columns}
                    dataSource={entries}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    bordered
                    locale={{ emptyText: selectedBank ? `No ${viewStatus.toLowerCase()} transactions found for this bank.` : 'Please select a bank account to view transactions.' }}
                />
            </Card>
        </div>
    );
};

export default BankReconciliation;
