import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Tag, Button, Typography, Modal, Descriptions, Space, App, Input, Spin, Divider, Alert } from 'antd';
import { CheckCircle, AlertTriangle, Eye, IndianRupee, User, Calendar, MapPin, Camera } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

import { Tabs, Segmented } from 'antd';
import { Activity, Archive, Map as MapIcon, List as ListIcon, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { semanticColors } from '../../theme/tokens';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371e3; // metres
    const f1 = (lat1 * Math.PI) / 180;
    const f2 = (lat2 * Math.PI) / 180;
    const df = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(df / 2) * Math.sin(df / 2) +
            Math.cos(f1) * Math.cos(f2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in metres
};

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

    const { data: fieldEntries = [], isLoading: loadingEntries } = useQuery({
        queryKey: ['field-entries'],
        queryFn: async () => {
            const res = await api.get('/Collections/field-entries');
            return res.data.data || res.data;
        },
        refetchInterval: 10000 // 10 second live poll
    });

    const { data: activeAgents = [] } = useQuery({
        queryKey: ['active-agents'],
        queryFn: async () => {
            const res = await api.get('/Collections/active-agents');
            return res.data.data || res.data;
        },
        refetchInterval: 10000 
    });

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    // ... rest of details and verify mutation ...

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

    const fieldEntryColumns = [
        {
            title: 'Ref',
            dataIndex: 'id',
            key: 'id',
            render: id => <Text strong>#{id}</Text>
        },
        {
            title: 'Agent',
            dataIndex: 'agentName',
            key: 'agentName',
            render: name => <Tag color="blue">{name}</Tag>
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: date => dayjs(date).format('DD MMM HH:mm')
        },
        {
            title: 'Subscriber',
            dataIndex: 'memberName',
            key: 'memberName'
        },
        {
            title: 'Payment',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: mode => <Tag color={mode === 'Cash' ? 'green' : 'blue'}>{mode}</Tag>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: val => <Text strong className="text-blue-600">₹{val.toLocaleString()}</Text>
        },
        {
            title: 'Distance',
            key: 'distance',
            render: (_, r) => {
                const dist = calculateDistance(r.latitude, r.longitude, r.memberLatitude, r.memberLongitude);
                if (dist === null) return <Text type="secondary">-</Text>;
                const isFar = dist > 300; // Flag collections > 300m away
                return (
                    <Tag color={isFar ? 'error' : 'success'} className="font-bold">
                        {dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`}
                    </Tag>
                );
            }
        },
        {
            title: 'Status',
            key: 'liveStatus',
            render: () => <Tag icon={<Spin size="small" className="mr-1" />} color="processing">In Field</Tag>
        }
    ];

    // Group field entries by agent for map polylines
    const agentsOnMap = fieldEntries.reduce((acc, entry) => {
        if (!entry.latitude || !entry.longitude) return acc;
        if (!acc[entry.agentName]) acc[entry.agentName] = [];
        acc[entry.agentName].push(entry);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                   <Title level={2}>Agent Collection & Audit</Title>
                   <Text className="text-slate-500">Monitor live field activity and verify pending agent submissions.</Text>
                </div>
            </div>

            <Tabs
                defaultActiveKey="1"
                type="card"
                className="custom-tabs"
                items={[
                    {
                        key: '1',
                        label: <span className="flex items-center gap-2"><Archive size={16}/> Closed Sessions</span>,
                        children: (
                            <div className="space-y-6">
                                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-orange-100 p-3 rounded-2xl">
                                             <AlertTriangle className="text-orange-500" size={32} />
                                        </div>
                                        <div>
                                            <Title level={4} className="!mb-0 !text-orange-700">{submissions.length} Sessions</Title>
                                            <Text className="text-orange-600 text-xs font-bold uppercase tracking-wider">Awaiting Verification & Ledger Posting</Text>
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
                                        scroll={{ x: 'max-content' }}
                                    />
                                </Card>
                            </div>
                        )
                    },
                    {
                        key: '2',
                        label: <span className="flex items-center gap-2"><Activity size={16}/> Live Field Activity</span>,
                        children: (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-3xl border border-blue-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <Title level={5} className="!mb-0">Live Stream Tracking</Title>
                                            <Text className="text-slate-500 text-xs">Real-time GPS correlation and geofencing enabled.</Text>
                                        </div>
                                    </div>
                                    <Segmented
                                        value={viewMode}
                                        onChange={setViewMode}
                                        options={[
                                            { label: 'List View', value: 'list', icon: <ListIcon size={14} /> },
                                            { label: 'Map View', value: 'map', icon: <MapIcon size={14} /> }
                                        ]}
                                        className="p-1 bg-white shadow-sm rounded-xl"
                                    />
                                </div>

                                {viewMode === 'map' ? (
                                    <Card className="shadow-lg border-0 rounded-3xl overflow-hidden h-[600px] p-0" styles={{ body: { padding: 0, height: '100%' } }}>
                                        <MapContainer center={[10.938, 77.01]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                                            {Object.keys(agentsOnMap).map(agentName => {
                                                const path = agentsOnMap[agentName]
                                                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                                                    .map(e => [e.latitude, e.longitude]);
                                                
                                                const heartbeat = activeAgents.find(a => a.agentName === agentName);
                                                const latestEntry = agentsOnMap[agentName][0]; 
                                                const currentPos = heartbeat ? [heartbeat.lastLatitude, heartbeat.lastLongitude] : (latestEntry ? [latestEntry.latitude, latestEntry.longitude] : null);

                                                if (!currentPos) return null;

                                                return (
                                                    <div key={agentName}>
                                                        <Polyline positions={path} color={semanticColors.infoBlue} weight={3} opacity={0.6} dashArray="5, 10" />
                                                        {agentsOnMap[agentName].map(entry => {
                                                             const dist = calculateDistance(entry.latitude, entry.longitude, entry.memberLatitude, entry.memberLongitude);
                                                             const isFar = dist > 300;
                                                             
                                                             return (
                                                                <div key={entry.id}>
                                                                    {/* Agent Pickup Point */}
                                                                    <Marker position={[entry.latitude, entry.longitude]} icon={L.divIcon({
                                                                        className: 'custom-div-icon',
                                                                        html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-lg ${isFar ? 'bg-rose-500' : 'bg-blue-600'}"></div>`
                                                                    })}>
                                                                        <Popup className="rounded-2xl">
                                                                            <div className="p-2">
                                                                                <Tag color="blue" className="mb-2">{entry.agentName}</Tag>
                                                                                <Title level={5} className="!mb-1">₹{entry.amount.toLocaleString()}</Title>
                                                                                <Text strong className="block">{entry.memberName}</Text>
                                                                                <Text type="secondary" className="text-xs">{dayjs(entry.date).format('HH:mm')}</Text>
                                                                                {isFar && (
                                                                                    <Alert 
                                                                                        message="Geofence Breach" 
                                                                                        type="error" 
                                                                                        size="small" 
                                                                                        className="mt-2 py-1 px-2 text-[10px]" 
                                                                                        description={`Collected ${Math.round(dist)}m away from home.`} 
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </Popup>
                                                                    </Marker>
                                                                    {/* Member Home Reference if far */}
                                                                    {isFar && entry.memberLatitude && (
                                                                        <Circle center={[entry.memberLatitude, entry.memberLongitude]} radius={300} pathOptions={{ color: semanticColors.danger, fillColor: semanticColors.danger, fillOpacity: 0.1 }}>
                                                                            <Popup>
                                                                                <div className="p-2">
                                                                                    <Tag color="error" className="mb-2 uppercase font-black text-[9px]">Geofence Zone</Tag>
                                                                                    <Title level={5} className="!mb-0 text-slate-800 text-sm">Member Home Zone</Title>
                                                                                    <Text className="text-slate-500 text-[11px] block mt-0.5">Scheduled for <b>{entry.memberName}</b></Text>
                                                                                    
                                                                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                                                                        <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Breached By</Text>
                                                                                        <Text strong className="text-slate-800 text-xs">{entry.agentName}</Text>
                                                                                    </div>
                                                                                    
                                                                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                                                                        <Text className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                                                                                            <Activity size={10} /> {dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`} Deviation
                                                                                        </Text>
                                                                                    </div>
                                                                                </div>
                                                                            </Popup>
                                                                        </Circle>
                                                                    )}
                                                                </div>
                                                             );
                                                        })}
                                                        {/* Latest Agent Pulse Pin */}
                                                        <Marker position={currentPos} icon={L.divIcon({
                                                            className: 'agent-pulse-icon',
                                                            html: `
                                                                <div class="relative">
                                                                    <div class="absolute -top-10 -left-5 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-xl whitespace-nowrap border border-white/20">
                                                                        ${agentName} ${heartbeat ? '(Live)' : ''}
                                                                    </div>
                                                                    <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
                                                                        <div class="w-3 h-3 bg-white rounded-full"></div>
                                                                    </div>
                                                                </div>
                                                            `
                                                        })} />
                                                    </div>
                                                );
                                            })}
                                            {/* Show agents that have heartbeats but no collections today */}
                                            {activeAgents.filter(a => !agentsOnMap[a.agentName]).map(agent => (
                                                 <Marker key={agent.agentName} position={[agent.lastLatitude, agent.lastLongitude]} icon={L.divIcon({
                                                    className: 'agent-pulse-icon',
                                                    html: `
                                                        <div class="relative">
                                                            <div class="absolute -top-10 -left-5 bg-slate-400 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-xl whitespace-nowrap border border-white/20">
                                                                ${agent.agentName} (Idle/Starting)
                                                            </div>
                                                            <div class="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center border-4 border-white shadow-2xl">
                                                                <div class="w-3 h-3 bg-white rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    `
                                                })} />
                                            ))}
                                        </MapContainer>
                                    </Card>
                                ) : (
                                    <Card className="shadow-lg border-0 rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                                        <Table 
                                            columns={fieldEntryColumns} 
                                            dataSource={fieldEntries} 
                                            rowKey="id" 
                                            loading={loadingEntries}
                                            pagination={{ pageSize: 10 }}
                                            scroll={{ x: 'max-content' }}
                                        />
                                    </Card>
                                )}
                            </div>
                        )
                    }
                ]}
            />

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
                                <Text className="!text-white/50 font-black uppercase tracking-[0.2em] text-[10px] block mb-1">Submission Review</Text>
                                <Title level={2} className="!text-white !mb-0 font-black">Batch #{details?.id}</Title>
                                <div className="flex gap-4 mt-2">
                                   <Text className="!text-blue-100 flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider"><User size={12}/> {details?.agentName}</Text>
                                   <Text className="!text-blue-100 flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider"><Calendar size={12}/> {dayjs(details?.submissionDate).format('DD MMM YYYY')}</Text>
                                </div>
                            </div>
                            <div className="text-right">
                                <Text className="!text-white/50 font-black uppercase text-[10px] tracking-[0.2em] block mb-1">Total Verified Value</Text>
                                <Title level={2} className="!text-white !mb-0 font-black">₹{details?.totalAmount.toLocaleString()}</Title>
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
                                scroll={{ x: 'max-content' }}
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
                    border-bottom: 2px solid ${semanticColors.borderSoft};
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: ${semanticColors.textMuted};
                }
                .details-table .ant-table-tbody > tr > td {
                    padding: 16px 8px;
                }
            `}</style>
        </div>
    );
};

export default SubmissionReconciliation;
