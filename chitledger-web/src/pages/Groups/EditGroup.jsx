import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, InputNumber, Spin, message, Alert } from 'antd';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const EditGroup = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const { data: group, isLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            const allGroups = res.data.data || [];
            return allGroups.find(g => g.id.toString() === id);
        },
        enabled: !!id
    });

    const isRunning = group?.status !== 'Proposed';

    useEffect(() => {
        if (group) {
            form.setFieldsValue({
                groupName: group.groupName,
                chitValue: group.chitValue,
                durationMonths: group.durationMonths,
                commissionPercentage: group.foremanCommissionPercent || group.commissionPercentage || 5
            });
        }
    }, [group, form]);

    const updateMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.put(`/ChitGroups/${id}`, { id: parseInt(id), ...payload });
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Chit Group Updated Successfully!');
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            navigate('/groups');
        },
        onError: (error) => {
            message.error('Failed to update group: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleFinish = (values) => {
        updateMutation.mutate({
            groupName: values.groupName,
            chitValue: isRunning ? group.chitValue : parseFloat(values.chitValue),
            durationMonths: isRunning ? group.durationMonths : parseInt(values.durationMonths),
            foremanCommissionPercent: parseFloat(values.commissionPercentage)
        });
    };

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (!group) return <div className="text-center p-12 text-slate-500">Group not found</div>;

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <Button
                type="text"
                icon={<ArrowLeft size={16} />}
                onClick={() => navigate('/groups')}
                className="mb-6 font-semibold text-slate-500 hover:text-slate-800"
            >
                Back to Groups
            </Button>

            <Title level={2} className="!mb-6 text-slate-800">Edit Chit Group</Title>

            {isRunning && (
                <Alert
                    message="Group is Active"
                    description="This group has already been launched. You cannot change the Chit Value or Duration to ensure auction mathematics remain valid."
                    type="warning"
                    showIcon
                    className="mb-6 font-medium border-warning-200"
                />
            )}

            <Card className="shadow-sm border-0 rounded-xl" styles={{ body: { padding: '2rem' } }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                >
                    <Form.Item
                        name="groupName"
                        label={<span className="font-semibold text-slate-700">Group Name</span>}
                        rules={[{ required: true, message: 'Please enter a group name' }]}
                    >
                        <Input size="large" placeholder="e.g. Gold Saver 2026" className="w-full" />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="chitValue"
                            label={
                                <span className="font-semibold text-slate-700 flex justify-between w-full">
                                    Chit Value (₹) {isRunning && <Text type="secondary" className="text-xs font-normal">Locked</Text>}
                                </span>
                            }
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber
                                size="large"
                                className="w-full"
                                disabled={isRunning}
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\₹\s?|(,*)/g, '')}
                                placeholder="100000"
                            />
                        </Form.Item>

                        <Form.Item
                            name="durationMonths"
                            label={
                                <span className="font-semibold text-slate-700 flex justify-between w-full">
                                    Duration (Months) {isRunning && <Text type="secondary" className="text-xs font-normal">Locked</Text>}
                                </span>
                            }
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber size="large" className="w-full" disabled={isRunning} placeholder="20" min={1} />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="commissionPercentage"
                            label={<span className="font-semibold text-slate-700">Commission (%)</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber size="large" className="w-full" placeholder="5.0" step={0.1} />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button size="large" onClick={() => navigate('/groups')} className="font-semibold">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="bg-slate-900 font-bold px-8 shadow-sm"
                            loading={updateMutation.isPending}
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default EditGroup;
