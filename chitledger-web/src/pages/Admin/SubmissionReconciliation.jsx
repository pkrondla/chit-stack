import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Tag, Button, Typography, Modal, Descriptions, Space, App, Input, Spin, Divider, Alert } from 'antd';
import { CheckCircle, AlertTriangle, Eye, IndianRupee, User, Calendar, MapPin, Camera } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SubmissionReconciliation = () => {
    const [selectedSubId, setSelectedSubId] = useState(null);
    const [remarks, setRemarks] = useState('');
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const { data: submissions = [], isLoading } = useQuery({
        queryKey: ['submissions', 'Pending'],
        queryFn: async () => {
            const res = await api.get('/Collections/submissions?status=Pending');
            return res.data.data || res.data;
        }
    });

    const { data: details, isLoading: loadingDetails } = useQuery({
        queryKey: ['submission-details', selectedSubId],
        queryFn: async () => {
            const res = await api.get(`/Collections/submissions/${selectedSubId}`);
            return res.data.data || res.data;
        },
        enabled: !!selectedSubId
    });

    const verifyMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/Collections/verify-submission', { 
                submissionId: selectedSubId, 
                remarks 
            });
            return res.data;
        },
        onSuccess: () => {
            message.success('Submission verified. Receipts are now part of General Ledger.');
            setSelectedSubId(null);
            setRemarks('');
            queryClient.invalidateQueries(['submissions']);
        },
        onError: (err) => {
            message.error(err.response?.data?.error || 'Verification failed');
        }
    });

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: id => <Text strong>#{id}</Text>
        },
        {
            title: 'Agent',
            dataIndex: 'agentName',
            key: 'agentName',
            render: name => (
                <Space>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                        {name.charAt(0)}
                    </div>
                    <Text strong>{name}</Text>
                </Space>
            )
        },
        {
            title: 'Date',
            dataIndex: 'submissionDate',
            key: 'submissionDate',
            render: date => dayjs(date).format('DD MMM YYYY HH:mm')
        },
        {
            title: 'Receipts',
            dataIndex: 'receiptCount',
            key: 'receiptCount',
            align: 'center',
            render: count => <Tag color="blue" className="rounded-full px-3">{count} Collections</Tag>
        },
        {
            title: 'Cash',
            dataIndex: 'totalCash',
            key: 'totalCash',
            align: 'right',
            render: val => <Text className="font-mono">₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Cheque',
            dataIndex: 'totalCheque',
            key: 'totalCheque',
            align: 'right',
            render: val => <Text className="font-mono">₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            align: 'right',
            render: val => <Text strong className="text-blue-600 text-lg">₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => <Tag color="orange" className="uppercase font-bold tracking-wider">{status}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<Eye size={16} />} 
                    className="bg-slate-900 flex items-center gap-2"
                    onClick={() => setSelectedSubId(record.id)}
                >
                    Review & Post
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                   <Title level={2}>Collection Reconciliation</Title>
                   <Text className="text-slate-500">Verify and post field agent collections to the general ledger.</Text>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-4">
                    <AlertTriangle className="text-orange-500" size={32} />
                    <div>
                        <Title level={4} className="!mb-0 !text-orange-700">{submissions.length}</Title>
                        <Text className="text-orange-600 text-xs font-bold uppercase tracking-wider">Pending Batches</Text>
                    </div>
                </div>
            </div>

            <Card className="shadow-lg border-0 rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                <Table 
                    columns={columns} 
                    dataSource={submissions} 
                    rowKey="id" 
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={null}
                open={!!selectedSubId}
                onCancel={() => setSelectedSubId(null)}
                width={1000}
                footer={null}
                centered
                styles={{ content: { borderRadius: '32px', padding: 0, overflow: 'hidden' } }}
            >
                {loadingDetails ? (
                    <div className="p-24 text-center"><Spin size="large" /></div>
                ) : (
                    <div className="flex flex-col h-[85vh]">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-start shrink-0">
                            <div>
                                <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs">Submission Review</Text>
                                <Title level={2} className="!text-white !mb-0 font-black">Batch #{details?.id}</Title>
                                <div className="flex gap-4 mt-2">
                                   <Text className="text-blue-200 flex items-center gap-1"><User size={14}/> {details?.agentName}</Text>
                                   <Text className="text-blue-200 flex items-center gap-1"><Calendar size={14}/> {dayjs(details?.submissionDate).format('DD MMM YYYY')}</Text>
                                </div>
                            </div>
                            <div className="text-right">
                                <Text className="text-slate-500 font-bold uppercase text-[10px] tracking-widest block mb-1">Total Verified Value</Text>
                                <Title level={2} className="!text-white !mb-0">₹{details?.totalAmount.toLocaleString()}</Title>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
                            <Alert 
                                message="Audit Trail" 
                                description="Check GPS locations and payment proof photos to ensure funds are physically collected before posting."
                                type="warning"
                                showIcon
                                className="mb-6 rounded-2xl bg-white border-orange-200"
                            />

                            <Table
                                dataSource={details?.receipts}
                                rowKey="id"
                                pagination={false}
                                className="details-table"
                                columns={[
                                    { title: 'Receipt', dataIndex: 'id', key: 'id', render: id => <Text strong>#{id}</Text> },
                                    { title: 'Subscriber', dataIndex: 'memberName', key: 'memberName' },
                                    { title: 'Mode', dataIndex: 'paymentMode', key: 'paymentMode', render: mode => <Tag color={mode === 'Cash' ? 'green' : 'blue'}>{mode}</Tag> },
                                    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: val => <Text strong>₹{val.toLocaleString()}</Text> },
                                    { title: 'Ref/UTR', dataIndex: 'referenceNumber', key: 'referenceNumber', render: ref => <Text className="font-mono text-xs">{ref || '-'}</Text> },
                                    { 
                                        title: 'Evidence', 
                                        key: 'evidence', 
                                        render: (_, r) => (
                                            <Space>
                                                {r.latitude && <Tag icon={<MapPin size={10}/>} color="default" className="cursor-help" title={`Lat: ${r.latitude}, Lng: ${r.longitude}`}>GPS</Tag>}
                                                {r.photoUrl && <Button size="small" icon={<Camera size={14}/>} onClick={() => window.open(r.photoUrl, '_blank')}>View Proof</Button>}
                                            </Space>
                                        ) 
                                    }
                                ]}
                            />

                            <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <Title level={5}>Staff Verification Remarks</Title>
                                <Input.TextArea 
                                    rows={3} 
                                    placeholder="Add any verification notes or bank reference if applicable..." 
                                    className="rounded-xl mt-2"
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t flex justify-between items-center shrink-0">
                            <Space size="large">
                                <div className="text-slate-400 text-xs">
                                    <div className="font-bold uppercase tracking-widest text-[10px]">Verify Count</div>
                                    <div className="text-slate-900 font-bold">{details?.receipts.length} Transactions</div>
                                </div>
                                <Divider type="vertical" height={40} />
                                <div className="text-slate-400 text-xs">
                                    <div className="font-bold uppercase tracking-widest text-[10px]">Ledger Sync</div>
                                    <div className="text-slate-900 font-bold">Auto-post Enabled</div>
                                </div>
                            </Space>
                            <Space size="middle">
                                <Button size="large" className="rounded-xl px-8" onClick={() => setSelectedSubId(null)}>Cancel</Button>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    icon={<CheckCircle size={20} />}
                                    className="bg-green-600 border-none rounded-xl px-12 h-14 font-black text-lg flex items-center justify-center gap-2"
                                    loading={verifyMutation.isPending}
                                    onClick={() => verifyMutation.mutate()}
                                >
                                    Approve & Post Ledger
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                .details-table .ant-table-thead > tr > th {
                    background: transparent;
                    border-bottom: 2px solid #f1f5f9;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #94a3b8;
                }
                .details-table .ant-table-tbody > tr > td {
                    padding: 16px 8px;
                }
            `}</style>
        </div>
    );
};

export default SubmissionReconciliation;
