import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Button, Tag, Modal, Form, Input, DatePicker, Select, message, Spin, Table, Dropdown, Space } from 'antd';
import { UserMinus, UserPlus, Users, FileText, CheckCircle, Clock, MoreVertical, ShieldAlert } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title, Text } = Typography;

const GroupTickets = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Modals state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const [assignForm] = Form.useForm();
    const [nomineeForm] = Form.useForm();

    const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
        queryKey: ['tickets', groupId],
        queryFn: async () => {
            const res = await api.get(`/ChitGroups/${groupId}/tickets`);
            return res.data.data || [];
        },
        enabled: !!groupId
    });

    const { data: availableMembers = [] } = useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    const enrolledMemberIds = tickets.map(t => t.memberId).filter(id => id !== null);

    const assignMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Tickets/assign-vacancy', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Ticket assigned successfully!');
            setIsAssignModalOpen(false);
            assignForm.resetFields();
            queryClient.invalidateQueries({ queryKey: ['tickets', groupId] });
        },
        onError: (error) => {
            const errData = error.response?.data;
            const errMsg = errData?.errors?.[0] || errData?.error || 'Failed to assign ticket';
            message.error(errMsg);
        }
    });

    const removeSubscriberMutation = useMutation({
        mutationFn: async (ticketId) => {
            const res = await api.post('/Tickets/remove', { ticketId, reason: 'Removed by Admin' });
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Subscriber removed successfully!');
            queryClient.invalidateQueries({ queryKey: ['tickets', groupId] });
        },
        onError: (error) => {
            const errData = error.response?.data;
            const errMsg = errData?.errors?.[0] || errData?.error || 'Failed to remove subscriber';
            message.error(errMsg);
        }
    });

    const nomineeMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Nominees', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Nominee saved successfully!');
            setIsNomineeModalOpen(false);
            nomineeForm.resetFields();
        },
        onError: (error) => {
            message.error('Failed to save nominee: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleAssignClick = (ticket) => {
        setSelectedTicket(ticket);
        setIsAssignModalOpen(true);
    };

    const handleNomineeClick = async (ticket) => {
        setSelectedTicket(ticket);
        setIsNomineeModalOpen(true);
        nomineeForm.resetFields();

        try {
            const res = await api.get(`/Nominees/${ticket.id}`);
            if (res.data.data) {
                const n = res.data.data;
                nomineeForm.setFieldsValue({
                    fullName: n.fullName,
                    relationship: n.relationship,
                    dateOfBirth: n.dateOfBirth ? dayjs(n.dateOfBirth) : null,
                    aadhaarNumber: n.aadhaarNumber,
                    phoneNumber: n.phoneNumber,
                    guardianName: n.guardianName
                });
            }
        } catch (e) {
            // Ignore 404s if nominee doesn't exist yet
            console.log("No existing nominee found");
        }
    };

    const handleAssignFinish = (values) => {
        assignMutation.mutate({
            ticketId: selectedTicket.id,
            newMemberId: parseInt(values.memberId)
        });
    };

    const handleNomineeFinish = (values) => {
        nomineeMutation.mutate({
            ticketId: selectedTicket.id,
            ...values,
            dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null
        });
    };

    const confirmRemove = (ticketId) => {
        Modal.confirm({
            title: 'Remove Subscriber',
            content: 'Are you sure you want to remove this subscriber? The ticket will become vacant.',
            okText: 'Yes, Remove',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => removeSubscriberMutation.mutate(ticketId)
        });
    };

    if (isLoadingTickets) {
        return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    }

    const columns = [
        {
            title: 'Ticket No.',
            dataIndex: 'ticketNumber',
            key: 'ticketNumber',
            render: (text) => <span className="font-mono text-lg font-bold text-slate-800">#{text}</span>,
            sorter: (a, b) => a.ticketNumber - b.ticketNumber,
        },
        {
            title: 'Subscriber',
            key: 'subscriber',
            render: (_, ticket) => (
                <div className="flex items-center gap-2">
                    <Text className={`font-semibold ${ticket.isForeman ? 'text-blue-700' : 'text-slate-800'}`}>
                        {ticket.memberName || <span className="text-slate-400 italic">Not Assigned</span>}
                    </Text>
                    {ticket.isForeman && (
                        <Tag color="blue" className="rounded-full px-2 py-0 border-0 font-bold m-0 uppercase text-[10px]">Foreman</Tag>
                    )}
                    {ticket.isPrized && (
                        <Tag color="purple" className="rounded-full px-2 py-0 border-0 font-bold m-0 text-[10px]">Prized</Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag
                    color={status === 'Active' ? 'success' : status === 'Vacant' ? 'warning' : 'default'}
                    className="rounded-full px-3 py-1 font-bold m-0 text-sm flex items-center gap-1 border-0 w-max"
                >
                    {status === 'Active' ? <CheckCircle size={14} /> : status === 'Vacant' ? <Clock size={14} /> : <ShieldAlert size={14} />}
                    {status}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, ticket) => (
                <Space size="small">
                    {ticket.status === 'Active' && !ticket.isForeman && (
                        <>
                            <Button
                                size="small"
                                type="text"
                                icon={<UserPlus size={16} className="text-slate-600" />}
                                onClick={() => handleNomineeClick(ticket)}
                                title="Manage Nominee"
                            />
                            <Button
                                size="small"
                                type="text"
                                icon={<FileText size={16} className="text-slate-600" />}
                                onClick={() => downloadFile(`/forms/subscriber-agreement/${ticket.id}`, `Agreement_${ticket.id}.pdf`)}
                                title="Download Agreement"
                            />
                            {!ticket.isPrized && (
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: 'details',
                                                label: <span className="font-semibold text-slate-700">Member Details</span>,
                                                icon: <Users size={16} className="text-slate-600" />,
                                                onClick: () => navigate(`/members/${ticket.memberId}`)
                                            },
                                            { type: 'divider' },
                                            {
                                                key: 'remove',
                                                label: <span className="text-red-600 font-semibold">Remove Subscriber</span>,
                                                icon: <UserMinus size={16} className="text-red-600" />,
                                                onClick: () => confirmRemove(ticket.id)
                                            }
                                        ]
                                    }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                >
                                    <Button size="small" type="text" icon={<MoreVertical size={16} className="text-slate-600" />} />
                                </Dropdown>
                            )}
                        </>
                    )}
                    {ticket.isForeman && (
                        <Text type="secondary" className="text-xs italic px-2">System Reserved</Text>
                    )}
                    {ticket.status === 'Vacant' && (
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleAssignClick(ticket)}
                            className="bg-blue-600 font-semibold"
                        >
                            Assign Subscriber
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12" >
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!m-0 text-slate-800">Ticket Management</Title>
                <Button
                    type="primary"
                    icon={<UserPlus size={18} />}
                    onClick={() => navigate(`/groups/enroll?groupId=${groupId}`)}
                    size="large"
                    className="bg-slate-900 border-none font-semibold shadow-sm hover:!bg-slate-800"
                >
                    Enroll Member
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <Table
                    columns={columns}
                    dataSource={tickets}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    loading={{
                        indicator: <Spin size="large" />,
                        spinning: isLoadingTickets
                    }}
                    rowClassName={(record) => record.status === 'Active' ? 'bg-green-50/20' : record.status === 'Vacant' ? 'bg-amber-50/20' : ''}
                />
            </div>

            {/* Assign Modal */}
            <Modal
                title={`Assign Vacant Ticket #${selectedTicket?.ticketNumber}`}
                open={isAssignModalOpen}
                onCancel={() => setIsAssignModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={assignForm} layout="vertical" onFinish={handleAssignFinish} className="mt-4">
                    <Form.Item
                        name="memberId"
                        label="Select New Member"
                        rules={[{ required: true, message: 'Please select a member' }]}
                    >
                        <Select size="large" placeholder="-- Choose Member --" showSearch optionFilterProp="children">
                            {availableMembers.map(m => {
                                const isEnrolled = enrolledMemberIds.includes(m.id);
                                return (
                                    <Select.Option key={m.id} value={m.id} disabled={isEnrolled}>
                                        {m.fullName} ({m.phoneNumber}) {isEnrolled && " - Already Enrolled"}
                                    </Select.Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                    <div className="flex gap-4 mt-8">
                        <Button size="large" onClick={() => setIsAssignModalOpen(false)} className="flex-1 font-semibold">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="bg-slate-900 flex-1 font-bold shadow-md"
                            loading={assignMutation.isPending}
                        >
                            Assign
                        </Button>
                    </div>
                </Form>
            </Modal >

            {/* Nominee Modal */}
            < Modal
                title={`Nominee Details for Ticket #${selectedTicket?.ticketNumber}`}
                open={isNomineeModalOpen}
                onCancel={() => setIsNomineeModalOpen(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form form={nomineeForm} layout="vertical" onFinish={handleNomineeFinish} className="mt-4">
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="relationship" label="Relationship" rules={[{ required: true }]}>
                            <Input size="large" />
                        </Form.Item>
                        <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
                            <DatePicker size="large" className="w-full" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="aadhaarNumber" label="Aadhaar Number">
                            <Input size="large" />
                        </Form.Item>
                        <Form.Item name="phoneNumber" label="Phone Number">
                            <Input size="large" />
                        </Form.Item>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <Form.Item name="guardianName" label="Guardian (If Nominee is Minor)" className="mb-0">
                            <Input size="large" placeholder="Guardian Name" />
                        </Form.Item>
                    </div>

                    <div className="flex gap-4">
                        <Button size="large" onClick={() => setIsNomineeModalOpen(false)} className="flex-1 font-semibold">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="bg-slate-900 flex-1 font-bold shadow-md"
                            loading={nomineeMutation.isPending}
                        >
                            Save Nominee
                        </Button>
                    </div>
                </Form>
            </Modal >
        </div >
    );
};

export default GroupTickets;
