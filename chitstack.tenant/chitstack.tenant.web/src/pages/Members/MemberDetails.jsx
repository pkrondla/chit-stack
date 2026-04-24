import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Spin, Avatar, Descriptions, Tag, Divider, Table, App, Switch } from 'antd';
import { User, ArrowLeft, Phone, Mail, Hash, FileText, Edit, Bell, MessageSquare, Smartphone } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';
import { apiOrigin } from '../../config/apiConfig';

const { Title } = Typography;

const MemberDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    const { data: member, isLoading } = useQuery({
        queryKey: ['member', id],
        queryFn: async () => {
            const res = await api.get(`/Members/${id}`);
            return res.data.data || res.data;
        },
        enabled: !!id
    });

    const { mutate: enablePortal, isLoading: isEnabling } = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/Members/${id}/enable-portal`);
            return res.data;
        },
        onSuccess: (res) => {
            if (res.succeeded) {
                message.success('Portal access enabled successfully.');
                queryClient.invalidateQueries(['member', id]);
            } else {
                message.error(res.message || 'Failed to enable portal access.');
            }
        },
        onError: () => message.error('Server error. Please try again later.')
    });

    if (isLoading) {
        return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    }

    if (!member) {
        return (
            <div className="max-w-4xl mx-auto pb-12 text-center p-12">
                <Title level={3}>Member Not Found</Title>
                <Button onClick={() => navigate('/members')}>Back to Directory</Button>
            </div>
        );
    }

    const isVerified = Boolean(member.panNumber && member.aadhaarNumber);

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Button
                type="text"
                icon={<ArrowLeft size={16} />}
                onClick={() => navigate('/members')}
                className="mb-6 font-semibold text-slate-500 hover:text-slate-800"
            >
                Back to Directory
            </Button>

            <Card className="shadow-sm border-0 rounded-xl overflow-hidden mb-6" styles={{ body: { padding: '2rem' } }}>
                <div className="flex items-start gap-6 mb-8">
                    <Avatar
                        size={84}
                        icon={<User size={40} />}
                        className="bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"
                    />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <Title level={2} className="!mb-1 text-slate-800">{member.fullName}</Title>
                                <div className="text-slate-500 font-mono text-sm mb-3">Subscriber ID: {member.id}</div>
                                <div className="flex gap-2 mb-3">
                                    <Tag color={isVerified ? 'success' : 'warning'} className="rounded-full px-3 py-1 font-bold border-0">
                                        {isVerified ? 'KYC Verified' : 'KYC Pending'}
                                    </Tag>
                                </div>
                                <div className="text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-slate-200">
                                    Registration Branch: <span className="text-slate-800">{member.registrationBranchName || 'Global'}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    icon={<Edit size={16} />}
                                    onClick={() => navigate(`/members/${member.id}/edit`)}
                                    className="font-semibold text-slate-700"
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<FileText size={16} />}
                                    onClick={() => downloadFile(`/forms/kyc/${member.id}`)}
                                    className="bg-slate-900 font-bold"
                                >
                                    Download KYC
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider className="my-6" />

                <Title level={4} className="mb-4 text-slate-700">Communication Preferences</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'In-Portal', key: 'inPortalEnabled', icon: <Bell size={18} />, color: 'blue' },
                        { label: 'WhatsApp', key: 'whatsAppEnabled', icon: <MessageSquare size={18} />, color: 'green' },
                        { label: 'SMS Alert', key: 'smsEnabled', icon: <Smartphone size={18} />, color: 'purple' },
                        { label: 'Email', key: 'emailEnabled', icon: <Mail size={18} />, color: 'orange' }
                    ].map(pref => (
                        <Card key={pref.key} className="bg-slate-50 border-slate-200 rounded-2xl shadow-none">
                            <div className="flex items-center justify-between">
                                <div className={`flex items-center gap-2 text-${pref.color}-600 font-bold text-xs uppercase tracking-tight`}>
                                    {pref.icon} {pref.label}
                                </div>
                                <Switch 
                                    checked={member[pref.key]} 
                                    onChange={(checked) => {
                                        const formData = new FormData();
                                        formData.append(pref.key, checked);
                                        api.put(`/Members/${id}`, formData).then(() => {
                                            message.success(`${pref.label} ${checked ? 'Enabled' : 'Disabled'}`);
                                            queryClient.invalidateQueries(['member', id]);
                                        });
                                    }}
                                />
                            </div>
                        </Card>
                    ))}
                </div>

                <Title level={4} className="mb-4 text-slate-700">Contact Information</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <Descriptions column={1}>
                        <Descriptions.Item label={<div className="flex items-center gap-2"><Phone size={14} /> Mobile</div>}>
                            <span className="font-medium text-slate-800">{member.phoneNumber || 'Not Provided'}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label={<div className="flex items-center gap-2"><Mail size={14} /> Email</div>}>
                            <span className="font-medium text-slate-800">{member.email || 'Not Provided'}</span>
                        </Descriptions.Item>
                    </Descriptions>

                    <Card className="bg-indigo-50 border-0 rounded-2xl p-2 h-fit">
                        <div className="flex items-center justify-between mb-3 px-2">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold">
                                <User size={18} /> Member Portal
                            </div>
                            {member.isPortalEnabled ? (
                                <Tag color="green" className="m-0 rounded-full border-0 font-bold">Enabled</Tag>
                            ) : (
                                <Tag color="default" className="m-0 rounded-full border-0 font-bold">Disabled</Tag>
                            )}
                        </div>
                        {!member.isPortalEnabled ? (
                            <Button
                                type="primary"
                                block
                                className="bg-indigo-600 hover:bg-indigo-700 h-10 font-bold rounded-xl"
                                loading={isEnabling}
                                onClick={() => enablePortal()}
                            >
                                Enable Portal Access
                            </Button>
                        ) : (
                            <div className="text-xs text-indigo-600 font-medium px-2">
                                Member can log in using their credentials.
                            </div>
                        )}
                    </Card>
                </div>

                <Title level={4} className="mb-4 text-slate-700">Identity Documents</Title>
                <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} className="mb-8">
                    <Descriptions.Item label={<div className="flex items-center gap-2"><Hash size={14} /> PAN Number</div>}>
                        <div className="flex flex-col gap-1">
                            <span className="font-mono font-medium text-slate-800">{member.panNumber || 'Pending'}</span>
                            {member.panDocumentUrl && (
                                <a href={`${apiOrigin}${member.panDocumentUrl}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <FileText size={12} /> View Document
                                </a>
                            )}
                        </div>
                    </Descriptions.Item>
                    <Descriptions.Item label={<div className="flex items-center gap-2"><Hash size={14} /> Aadhaar Number</div>}>
                        <div className="flex flex-col gap-1">
                            <span className="font-mono font-medium text-slate-800">{member.aadhaarNumber || 'Pending'}</span>
                            {member.aadhaarDocumentUrl && (
                                <a href={`${apiOrigin}${member.aadhaarDocumentUrl}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <FileText size={12} /> View Document
                                </a>
                            )}
                        </div>
                    </Descriptions.Item>
                </Descriptions>

                <Title level={4} className="mb-4 text-slate-700">Chit Group Participation</Title>
                {member.tickets && member.tickets.length > 0 ? (
                    <Table
                        dataSource={member.tickets}
                        rowKey="ticketNumber"
                        pagination={false}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                        columns={[
                            {
                                title: 'Group Name',
                                dataIndex: 'groupName',
                                key: 'groupName',
                                render: (text) => <span className="font-semibold text-slate-800">{text}</span>
                            },
                            {
                                title: 'Ticket No.',
                                dataIndex: 'ticketNumber',
                                key: 'ticketNumber',
                                render: (text) => <span className="font-mono text-slate-600">#{text}</span>
                            },
                            {
                                title: 'Chit Value',
                                dataIndex: 'chitValue',
                                key: 'chitValue',
                                render: (val) => <span className="font-semibold">₹{val.toLocaleString()}</span>
                            },
                            {
                                title: 'Duration',
                                dataIndex: 'totalMonths',
                                key: 'totalMonths',
                                render: (val) => `${val} Months`
                            },
                            {
                                title: 'Prize Status',
                                key: 'isPrized',
                                render: (_, record) => (
                                    <Tag color={record.isPrized ? 'success' : 'processing'} className="rounded-full px-3 m-0 border-0 font-bold">
                                        {record.isPrized ? 'Prized' : 'Not Prized'}
                                    </Tag>
                                )
                            },
                            {
                                title: 'Ticket Status',
                                dataIndex: 'status',
                                key: 'status',
                                render: (status) => {
                                    const colors = { 0: 'success', 1: 'error', 2: 'warning' };
                                    const labels = { 0: 'Active', 1: 'Removed', 2: 'Vacant' };
                                    return (
                                        <Tag color={colors[status]} className="rounded-full px-3 m-0 border-0 font-bold">
                                            {labels[status]}
                                        </Tag>
                                    );
                                }
                            }
                        ]}
                    />
                ) : (
                    <Card className="bg-slate-50 border border-slate-200 shadow-none text-center p-6 rounded-lg">
                        <div className="text-4xl font-black text-slate-300 mb-2">0</div>
                        <div className="text-slate-500 font-semibold uppercase text-xs tracking-wider">No Active Tickets</div>
                    </Card>
                )}
            </Card>
        </div>
    );
};

export default MemberDetails;
