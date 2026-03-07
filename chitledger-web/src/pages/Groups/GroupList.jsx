import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Tag, Space, Spin, message, Divider, Modal } from 'antd';
import { Plus, Users, Play, FileText, Gavel } from 'lucide-react';
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

            {isLoading ? <div className="flex justify-center p-12"><Spin size="large" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groups.map(group => (
                        <Card
                            key={group.id}
                            className="shadow-sm border-0 rounded-xl hover:shadow-md transition-shadow"
                            styles={{ body: { padding: '1.5rem' } }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Title level={4} className="!mb-1 text-slate-800">{group.groupName}</Title>
                                    <Tag
                                        color={group.status === 'Running' ? 'success' : 'default'}
                                        className="rounded-full px-3 py-0.5 font-bold m-0"
                                    >
                                        {group.status}
                                    </Tag>
                                </div>
                                <div className="text-right">
                                    <Text className="text-slate-500 block text-xs uppercase font-bold tracking-wider">Chit Value</Text>
                                    <Text className="text-green-700 text-xl font-bold font-mono">
                                        ₹{group.chitValue?.toLocaleString()}
                                    </Text>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <Text className="text-slate-500 block text-sm">Duration</Text>
                                    <Text strong className="text-base text-slate-800">{group.durationMonths} Months</Text>
                                </div>
                                <div>
                                    <Text className="text-slate-500 block text-sm">Monthly Due</Text>
                                    <Text strong className="text-base text-slate-800">₹{(group.chitValue / group.durationMonths)?.toLocaleString()}</Text>
                                </div>
                            </div>

                            <Space className="w-full flex" size="small">
                                <Button
                                    icon={<Users size={16} />}
                                    onClick={() => navigate(`/groups/${group.id}/tickets`)}
                                    className="flex-1 border-slate-300 font-semibold text-slate-700"
                                >
                                    Members
                                </Button>
                                <Button
                                    icon={<Gavel size={16} />}
                                    onClick={() => navigate(`/auctions`)}
                                    className="flex-1 border-slate-300 font-semibold text-slate-700"
                                >
                                    Auctions
                                </Button>
                                <Button
                                    icon={<Plus size={16} />}
                                    onClick={() => navigate(`/groups/enroll?groupId=${group.id}`)}
                                    title="Enroll Member"
                                    className="border-slate-300 text-slate-700"
                                />
                                <Button
                                    icon={<FileText size={16} />}
                                    onClick={() => downloadFile(`/forms/sanction/${group.id}`, `Form_I_${group.groupName.replace(/\s+/g, '_')}.pdf`)}
                                    title="Download Sanction Form"
                                    className="border-slate-300 text-slate-700"
                                />
                            </Space>

                            {group.status === 'Proposed' && (
                                <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                    <Button
                                        type="primary"
                                        block
                                        icon={<Play size={16} />}
                                        onClick={(e) => handleLaunch(group.id, e)}
                                        className="bg-slate-900 font-bold shadow-sm"
                                        loading={launchMutation.isPending && launchMutation.variables === group.id}
                                    >
                                        Launch Group
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
export default Groups;
