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

    const selectedGroupId = Form.useWatch('chitGroupId', form);

    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data.data || res.data;
        }
    });

    const { data: currentGroupTickets = [] } = useQuery({
        queryKey: ['tickets', selectedGroupId],
        queryFn: async () => {
            if (!selectedGroupId) return [];
            const res = await api.get(`/ChitGroups/${selectedGroupId}/tickets`);
            return res.data.data || [];
        },
        enabled: !!selectedGroupId
    });

    // Extract member IDs already enrolled in the selected group
    const enrolledMemberIds = currentGroupTickets.map(t => t.memberId);

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
            const errData = error.response?.data;
            const errMsg = errData?.errors?.[0] || errData?.error || 'Failed to enroll member';
            message.error(errMsg);
        }
    });

    const handleFinish = (values) => {
        enrollMutation.mutate({
            chitGroupId: parseInt(values.chitGroupId),
            memberIds: values.memberIds.map(id => parseInt(id))
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
                        name="memberIds"
                        label={<span className="font-semibold text-slate-700">Select Members</span>}
                        rules={[{ required: true, message: 'Please select at least one member' }]}
                        help={<Text className="text-slate-500 text-xs">Selected members will automatically be assigned the next available Ticket Numbers in sequence.</Text>}
                        className="mb-8"
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="-- Select Members --"
                            showSearch
                            optionFilterProp="children"
                            maxTagCount="responsive"
                        >
                            {members.map(m => {
                                const isEnrolled = enrolledMemberIds.includes(m.id);
                                return (
                                    <Select.Option key={m.id} value={m.id} disabled={isEnrolled}>
                                        {m.fullName} ({m.phoneNumber}) {isEnrolled && " - Already Enrolled"}
                                    </Select.Option>
                                );
                            })}
                        </Select>
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
