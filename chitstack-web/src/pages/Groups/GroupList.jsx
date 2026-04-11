import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Button, Tag, Space, Spin, message, Modal, Table, Dropdown } from 'antd';
import { Plus, Users, Play, FileText, Gavel, Edit, MoreVertical, CalendarClock } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';
import LaunchGroupModal from './LaunchGroupModal';

const { Title, Text } = Typography;

const Groups = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [launchingGroup, setLaunchingGroup] = useState(null);

    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data.data || [];
        }
    });

    const handleLaunch = (group, e) => {
        e.stopPropagation();
        setLaunchingGroup(group);
    };

    const columns = [
        {
            title: 'Group Name',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <span className="font-semibold text-slate-800 text-base">{text}</span>,
        },
        {
            title: 'Chit Value',
            dataIndex: 'chitValue',
            key: 'chitValue',
            render: (val) => <span className="font-bold text-green-700">₹{val?.toLocaleString()}</span>,
        },
        {
            title: 'Duration',
            dataIndex: 'durationMonths',
            key: 'durationMonths',
            render: (val) => `${val} Months`,
        },
        {
            title: 'Monthly Due',
            key: 'monthlyDue',
            render: (_, record) => `₹${(record.chitValue / record.durationMonths)?.toLocaleString()}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Running' ? 'success' : status === 'Completed' ? 'blue' : 'default'} className="rounded-full px-3 py-0.5 font-bold m-0">
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, group) => (
                <Space size="small">
                    <Button
                        size="small"
                        type="text"
                        icon={<Users size={16} className="text-slate-600" />}
                        onClick={() => navigate(`/groups/${group.id}/tickets`)}
                        title="Members"
                    />
                    <Button
                        size="small"
                        type="text"
                        icon={<Gavel size={16} className="text-slate-600" />}
                        onClick={() => navigate(`/auctions`)}
                        title="Auctions"
                    />
                    <Button
                        size="small"
                        type="text"
                        icon={<Edit size={16} className="text-blue-600" />}
                        onClick={() => navigate(`/groups/${group.id}/edit`)}
                        title="Edit Group"
                    />
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'enroll',
                                    label: 'Enroll Member',
                                    icon: <Plus size={16} />,
                                    onClick: () => navigate(`/groups/enroll?groupId=${group.id}`)
                                },
                                {
                                    key: 'auction-scheduler',
                                    label: 'Auction Scheduler',
                                    icon: <CalendarClock size={16} className="text-violet-600" />,
                                    onClick: () => navigate(`/groups/${group.id}/scheduler`)
                                },
                                {
                                    key: 'statutory',
                                    label: 'Statutory Forms',
                                    icon: <FileText size={16} />,
                                    children: [
                                        {
                                            key: 'download-all',
                                            label: <span className="font-semibold text-blue-700">⬇ Download All (ZIP)</span>,
                                            onClick: () => downloadFile(`/forms/statutory/${group.id}`, `Statutory_Forms_${group.groupName.replace(/\s+/g, '_')}.zip`)
                                        },
                                        { type: 'divider' },
                                        {
                                            key: 'form-i',
                                            label: 'Form I — Application for Sanction',
                                            onClick: () => downloadFile(`/forms/sanction/${group.id}`, `Form_I_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                        {
                                            key: 'form-ii',
                                            label: 'Form II — Application for Registration',
                                            onClick: () => downloadFile(`/forms/agreement/${group.id}`, `Form_II_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                        {
                                            key: 'byelaws',
                                            label: 'Bye-Laws of the Chit Group',
                                            onClick: () => downloadFile(`/forms/byelaws/${group.id}`, `ByeLaws_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                        {
                                            key: 'security',
                                            label: 'Security Deposit Letter',
                                            onClick: () => downloadFile(`/forms/security-deposit/${group.id}`, `SecurityDeposit_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                        {
                                            key: 'form-v',
                                            label: 'Form V — Declaration of Full Subscription',
                                            onClick: () => downloadFile(`/forms/form-v/${group.id}`, `Form_V_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                        {
                                            key: 'form-vi',
                                            label: 'Form VI — Commencement Request',
                                            onClick: () => downloadFile(`/forms/form-vi/${group.id}`, `Form_VI_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                        {
                                            key: 'form-vii',
                                            label: 'Form VII — Agreements to Subscribers',
                                            onClick: () => downloadFile(`/forms/form-vii/${group.id}`, `Form_VII_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                        },
                                    ]
                                },
                                ...(group.status === 'Proposed' ? [{
                                    type: 'divider'
                                },
                                {
                                    key: 'launch',
                                    label: <span className="text-green-600 font-semibold">Launch Group</span>,
                                    icon: <Play size={16} className="text-green-600" />,
                                    onClick: (e) => handleLaunch(group, e.domEvent)
                                }] : [])

                            ]
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button size="small" type="text" icon={<MoreVertical size={16} className="text-slate-600" />} />
                    </Dropdown>
                </Space>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">Active Chit Groups</Title>
                <Button
                    type="primary"
                    size="large"
                    icon={<Plus size={18} />}
                    onClick={() => navigate('/groups/new')}
                    className="bg-slate-900 shadow-md font-bold"
                >
                    New Chit Group
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={groups}
                    rowKey="id"
                    loading={{
                        indicator: <Spin size="large" />,
                        spinning: isLoading
                    }}
                    pagination={{ pageSize: 12 }}
                    className="w-full"
                />
            </div>


            <LaunchGroupModal
                group={launchingGroup}
                open={!!launchingGroup}
                onClose={() => setLaunchingGroup(null)}
            />
        </div>
    );
};
export default Groups;
