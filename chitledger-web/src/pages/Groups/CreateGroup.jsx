import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, InputNumber, DatePicker, message } from 'antd';
import api from '../../api/axios';

const { Title } = Typography;

const CreateGroup = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/ChitGroups', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Chit Group Created Successfully!');
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            navigate('/groups');
        },
        onError: (error) => {
            message.error('Failed to create group: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleFinish = (values) => {
        createMutation.mutate({
            groupName: values.groupName,
            chitValue: parseFloat(values.chitValue),
            durationMonths: parseInt(values.durationMonths),
            commissionPercentage: parseFloat(values.commissionPercentage),
            startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString()
        });
    };

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800">Create New Chit Group</Title>

            <Card className="shadow-sm border-0 rounded-xl" styles={{ body: { padding: '2rem' } }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{ commissionPercentage: 5, durationMonths: 20 }}
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
                            label={<span className="font-semibold text-slate-700">Chit Value (₹)</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber
                                size="large"
                                className="w-full"
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\₹\s?|(,*)/g, '')}
                                placeholder="100000"
                            />
                        </Form.Item>

                        <Form.Item
                            name="durationMonths"
                            label={<span className="font-semibold text-slate-700">Duration (Months)</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber size="large" className="w-full" placeholder="20" min={1} />
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

                        <Form.Item
                            name="startDate"
                            label={<span className="font-semibold text-slate-700">Start Date</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <DatePicker size="large" className="w-full" />
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
                            loading={createMutation.isPending}
                        >
                            Create Group
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default CreateGroup;
