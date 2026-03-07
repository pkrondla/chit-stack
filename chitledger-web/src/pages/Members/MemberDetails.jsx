import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Spin, Avatar, Descriptions, Tag, Divider, Table } from 'antd';
import { User, ArrowLeft, Phone, Mail, Hash, FileText, Edit } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title } = Typography;

const MemberDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: member, isLoading } = useQuery({
        queryKey: ['member', id],
        queryFn: async () => {
            const res = await api.get(`/Members/${id}`);
            return res.data.data || res.data;
        },
        enabled: !!id
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
                                <div className="flex gap-2">
                                    <Tag color={isVerified ? 'success' : 'warning'} className="rounded-full px-3 py-1 font-bold border-0">
                                        {isVerified ? 'KYC Verified' : 'KYC Pending'}
                                    </Tag>
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

                <Title level={4} className="mb-4 text-slate-700">Contact Information</Title>
                <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} className="mb-8">
                    <Descriptions.Item label={<div className="flex items-center gap-2"><Phone size={14} /> Mobile</div>}>
                        <span className="font-medium text-slate-800">{member.phoneNumber || 'Not Provided'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label={<div className="flex items-center gap-2"><Mail size={14} /> Email</div>}>
                        <span className="font-medium text-slate-800">{member.email || 'Not Provided'}</span>
                    </Descriptions.Item>
                </Descriptions>

                <Title level={4} className="mb-4 text-slate-700">Identity Documents</Title>
                <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} className="mb-8">
                    <Descriptions.Item label={<div className="flex items-center gap-2"><Hash size={14} /> PAN Number</div>}>
                        <div className="flex flex-col gap-1">
                            <span className="font-mono font-medium text-slate-800">{member.panNumber || 'Pending'}</span>
                            {member.panDocumentUrl && (
                                <a href={`http://localhost:5045${member.panDocumentUrl}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <FileText size={12} /> View Document
                                </a>
                            )}
                        </div>
                    </Descriptions.Item>
                    <Descriptions.Item label={<div className="flex items-center gap-2"><Hash size={14} /> Aadhaar Number</div>}>
                        <div className="flex flex-col gap-1">
                            <span className="font-mono font-medium text-slate-800">{member.aadhaarNumber || 'Pending'}</span>
                            {member.aadhaarDocumentUrl && (
                                <a href={`http://localhost:5045${member.aadhaarDocumentUrl}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
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
