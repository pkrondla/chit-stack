import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Button, Tag, Space, Spin, message, Modal, Table, Dropdown } from 'antd';
import { Plus, Users, Play, FileText, Gavel, Edit, MoreVertical } from 'lucide-react';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title, Text } = Typography;

const Groups = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data.data || [];
        }
    });

    const launchMutation = useMutation({
        mutationFn: async (groupId) => {
            const res = await api.post(`/ChitGroups/${groupId}/launch`);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success("Group Launched Successfully!");
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
        onError: (error) => {
            message.error("Launch Failed: " + (error.response?.data?.error || error.message));
        }
    });

    const handleLaunch = (groupId, e) => {
        e.stopPropagation();
        Modal.confirm({
            title: 'Launch Group',
            content: 'Are you sure? This will Activate the group and schedule the first auction. Ensure all tickets are subscribed.',
            okText: 'Yes, Launch',
            cancelText: 'Cancel',
            onOk: () => launchMutation.mutate(groupId)
        });
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
                                    key: 'sanction',
                                    label: 'Download Sanction Form',
                                    icon: <FileText size={16} />,
                                    onClick: () => downloadFile(`/forms/sanction/${group.id}`, `Form_I_${group.groupName.replace(/\s+/g, '_')}.pdf`)
                                },
                                ...(group.status === 'Proposed' ? [{
                                    type: 'divider'
                                },
                                {
                                    key: 'launch',
                                    label: <span className="text-green-600 font-semibold">Launch Group</span>,
                                    icon: <Play size={16} className="text-green-600" />,
                                    onClick: (e) => handleLaunch(group.id, e.domEvent)
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
                        spinning: isLoading || launchMutation.isPending
                    }}
                    pagination={{ pageSize: 12 }}
                    className="w-full"
                />
            </div>
        </div>
    );
};
export default Groups;
