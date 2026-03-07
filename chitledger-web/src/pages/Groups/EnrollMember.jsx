import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, Typography, Button, Form, InputNumber, Select, message, Spin } from 'antd';
import { UserPlus } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const EnrollMember = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const groupId = searchParams.get('groupId');
    const [form] = Form.useForm();

    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data.data || res.data;
        }
    });

    useEffect(() => {
        if (groupId) {
            form.setFieldsValue({ chitGroupId: parseInt(groupId) });
        }
    }, [groupId, form]);

    const enrollMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Members/allocate-ticket', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Member successfully enrolled!');
            navigate('/groups');
        },
        onError: (error) => {
            message.error(error.response?.data?.error || 'Failed to enroll member');
        }
    });

    const handleFinish = (values) => {
        enrollMutation.mutate({
            chitGroupId: parseInt(values.chitGroupId),
            memberId: parseInt(values.memberId),
            ticketNumber: parseInt(values.ticketNumber)
        });
    };

    if (isLoadingMembers || isLoadingGroups) {
        return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800 flex items-center gap-2">
                <UserPlus size={28} className="text-slate-600" /> Enroll Member
            </Title>

            <Card className="shadow-sm border-0 rounded-xl" styles={{ body: { padding: '2.5rem' } }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                >
                    <Form.Item
                        name="chitGroupId"
                        label={<span className="font-semibold text-slate-700">Select Chit Group</span>}
                        rules={[{ required: true, message: 'Group is required' }]}
                    >
                        <Select size="large" placeholder="-- Select Group --" showSearch optionFilterProp="children">
                            {groups.map(g => (
                                <Select.Option key={g.id} value={g.id}>
                                    {g.groupName} (₹{g.chitValue.toLocaleString()})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="memberId"
                        label={<span className="font-semibold text-slate-700">Select Member</span>}
                        rules={[{ required: true, message: 'Member is required' }]}
                    >
                        <Select size="large" placeholder="-- Select Member --" showSearch optionFilterProp="children">
                            {members.map(m => (
                                <Select.Option key={m.id} value={m.id}>
                                    {m.fullName} ({m.phoneNumber})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ticketNumber"
                        label={<span className="font-semibold text-slate-700">Assign Ticket Number</span>}
                        rules={[{ required: true, message: 'Ticket number is required' }]}
                        help={<Text className="text-slate-500 text-xs">Note: Ticket 1 is typically reserved for the Foreman.</Text>}
                        className="mb-8"
                    >
                        <InputNumber size="large" className="w-full" placeholder="e.g. 1" min={1} />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button size="large" onClick={() => navigate('/groups')} className="font-semibold">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="bg-slate-900 font-bold px-8 shadow-sm"
                            loading={enrollMutation.isPending}
                        >
                            Enroll Member
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default EnrollMember;
