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
    const [selectedLines, setSelectedLines] = useState([]);

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/Reporting/accounts');
            return (res.data.data || res.data).filter(a => a.accountCode.includes('BANK'));
        }
    });

    const { data: pendingEntries = [], isLoading } = useQuery({
        queryKey: ['unreconciled', selectedBank],
        queryFn: async () => {
            const res = await api.get(`/Reporting/ledger/${selectedBank}?unreconciledOnly=true`);
            return res.data.data || res.data;
        },
        enabled: !!selectedBank
    });

    const reconcileMutation = useMutation({
        mutationFn: async () => {
            return api.post('/Finance/reconcile', {
                journalEntryLineIds: selectedLines,
                reconciliationDate: reconcileDate.format('YYYY-MM-DD')
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
    ];

    const rowSelection = {
        selectedRowKeys: selectedLines,
        onChange: setSelectedLines,
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <Title level={2} className="mb-8">Bank Reconciliation</Title>

            <Card className="mb-8 shadow-sm">
                <div className="flex gap-6 items-end">
                    <div className="flex-1">
                        <Text strong className="block mb-2">Select Bank Account</Text>
                        <Select
                            className="w-full"
                            size="large"
                            placeholder="Select Bank"
                            value={selectedBank}
                            onChange={setSelectedBank}
                        >
                            {accounts.map(a => <Select.Option key={a.id} value={a.id}>{a.accountName}</Select.Option>)}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Text strong className="block mb-2">Statement Date</Text>
                        <DatePicker
                            className="w-full"
                            size="large"
                            value={reconcileDate}
                            onChange={setReconcileDate}
                        />
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCheck size={18} />}
                        disabled={selectedLines.length === 0}
                        onClick={() => reconcileMutation.mutate()}
                        loading={reconcileMutation.isPending}
                        className="bg-indigo-600 h-10 px-8"
                    >
                        Mark as Reconciled
                    </Button>
                </div>
            </Card>

            <Card title={`Unreconciled Transactions (${pendingEntries.length})`} className="shadow-sm rounded-xl">
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={pendingEntries}
                    rowKey="id"
                    loading={isLoading}
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default BankReconciliation;
