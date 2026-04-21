import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Button, Table, Tag, Space, Avatar, Spin, Input } from 'antd';
import { Plus, User, Search, Eye, FileText } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title } = Typography;

const Members = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    const columns = [
        {
            title: 'Subscriber Info',
            key: 'info',
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size="large"
                        icon={<User size={18} />}
                        className="bg-indigo-100 text-indigo-700 flex items-center justify-center"
                    />
                    <div>
                        <div className="font-bold text-slate-800 text-base">{record.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {record.id}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Contact Details',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <div className="font-medium text-slate-700">{record.phoneNumber}</div>
                    <div className="text-xs text-slate-500">{record.email || 'N/A'}</div>
                </div>
            )
        },
        {
            title: 'KYC Status',
            key: 'kyc',
            render: (_, record) => {
                const isVerified = Boolean(record.panNumber && record.aadhaarNumber);
                return (
                    <Tag
                        color={isVerified ? 'success' : 'error'}
                        className="rounded-full px-3 py-1 font-bold m-0 border-0"
                    >
                        {isVerified ? 'Verified' : 'Pending'}
                    </Tag>
                );
            }
        },
        {
            title: 'Registered On',
            dataIndex: 'joinedDate',
            key: 'joinedDate',
            render: (date) => (
                <span className="text-slate-600 font-medium whitespace-nowrap">
                    {new Date(date).toLocaleDateString()}
                </span>
            ),
            sorter: (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<Eye size={18} />}
                        onClick={() => navigate(`/members/${record.id}`)}
                        className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        title="View Profile"
                    />
                    <Button
                        type="text"
                        icon={<FileText size={18} />}
                        onClick={() => downloadFile(`/forms/kyc/${record.id}`, `KYC_Form_${record.fullName.replace(/\s+/g, '_')}.pdf`)}
                        className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Download KYC Form"
                    />
                </Space>
            )
        }
    ];

    const filteredMembers = members.filter(member => {
        if (!searchText) return true;
        const lowerSearch = searchText.toLowerCase();
        return (
            member.fullName?.toLowerCase().includes(lowerSearch) ||
            member.phoneNumber?.includes(searchText)
        );
    });

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">Member Directory</Title>
                <Button
                    type="primary"
                    size="large"
                    icon={<Plus size={18} />}
                    onClick={() => navigate('/members/new')}
                    className="bg-slate-900 shadow-md font-bold"
                >
                    Register Member
                </Button>
            </div>

            <div className="mb-6 max-w-md">
                <Input
                    size="large"
                    placeholder="Search by Name or Mobile Number..."
                    prefix={<Search className="text-slate-400 mr-2" size={18} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    className="rounded-lg shadow-sm"
                />
            </div>

            <Card className="shadow-sm border-0 rounded-xl overflow-hidden p-0" styles={{ body: { padding: 0 } }}>
                <Table
                    columns={columns}
                    dataSource={filteredMembers}
                    rowKey="id"
                    loading={{ indicator: <Spin size="large" />, spinning: isLoading }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members`
                    }}
                    rowClassName="hover:bg-slate-50 transition-colors"
                />
            </Card>
        </div>
    );
};

export default Members;
