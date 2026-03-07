import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Tag, Modal, Form, Input, DatePicker, Select, message, Spin } from 'antd';
import { UserMinus, UserPlus, FileText, CheckCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { downloadFile } from '../../utils/downloadHelper';

const { Title, Text } = Typography;

const GroupTickets = () => {
    const { groupId } = useParams();
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

    const assignMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Members/allocate-ticket', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Ticket assigned successfully!');
            setIsAssignModalOpen(false);
            assignForm.resetFields();
            queryClient.invalidateQueries({ queryKey: ['tickets', groupId] });
        },
        onError: (error) => {
            message.error(error.response?.data?.error || 'Failed to assign ticket');
        }
    });

    const removeSubscriberMutation = useMutation({
        mutationFn: async (ticketId) => {
            // Need a real endpoint here, assuming something like this:
            // return await api.post(`/Tickets/${ticketId}/remove-subscriber`);
            throw new Error("Endpoint not implemented in backend yet");
        },
        onSuccess: () => {
            message.success('Subscriber removed successfully!');
            queryClient.invalidateQueries({ queryKey: ['tickets', groupId] });
        },
        onError: (error) => {
            message.warning("Simulated Removal (API not ready): " + error.message);
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
            chitGroupId: parseInt(groupId),
            memberId: parseInt(values.memberId),
            ticketNumber: selectedTicket.ticketNumber
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

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800">Ticket Management</Title>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tickets.map(ticket => (
                    <Card
                        key={ticket.id}
                        className={`shadow-sm border-0 rounded-xl hover:shadow-md transition-all ${ticket.status === 'Active' ? 'border-l-4 border-l-green-600' : 'border-l-4 border-l-amber-500'
                            }`}
                        styles={{ body: { padding: '1.5rem' } }}
                    >
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                            <span className="font-mono text-2xl font-bold text-slate-800">#{ticket.ticketNumber}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="text"
                                    icon={<UserPlus size={18} />}
                                    onClick={() => handleNomineeClick(ticket)}
                                    title="Manage Nominee"
                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                />
                                <Button
                                    type="text"
                                    icon={<FileText size={18} />}
                                    onClick={() => downloadFile(`/forms/subscriber-agreement/${ticket.id}`, `Agreement_${ticket.id}.pdf`)}
                                    title="Download Agreement"
                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                />
                                <Tag
                                    color={ticket.status === 'Active' ? 'success' : 'warning'}
                                    className="rounded-full px-3 py-1 font-bold m-0 text-sm flex items-center gap-1 border-0"
                                >
                                    {ticket.status === 'Active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                    {ticket.status}
                                </Tag>
                            </div>
                        </div>

                        <div className="mb-6">
                            <Text className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Subscriber</Text>
                            <div className="flex items-center gap-2">
                                <Text className="text-slate-800 font-semibold text-lg">{ticket.memberName || 'Not Assigned'}</Text>
                                {ticket.isPrized && (
                                    <Tag color="purple" className="rounded-full px-2 py-0 border-0 font-bold m-0">Prized</Tag>
                                )}
                            </div>
                        </div>

                        {ticket.status === 'Active' && !ticket.isPrized && (
                            <Button
                                danger
                                icon={<UserMinus size={16} />}
                                onClick={() => confirmRemove(ticket.id)}
                                className="w-full flex justify-center items-center bg-red-50 hover:bg-red-100 border-red-200 font-semibold"
                            >
                                Remove Subscriber
                            </Button>
                        )}

                        {ticket.status === 'Vacant' && (
                            <Button
                                type="primary"
                                icon={<UserPlus size={16} />}
                                onClick={() => handleAssignClick(ticket)}
                                className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 font-bold shadow-sm"
                            >
                                Assign Vacancy
                            </Button>
                        )}
                    </Card>
                ))}
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
                            {availableMembers.map(m => (
                                <Select.Option key={m.id} value={m.id}>{m.fullName} ({m.phoneNumber})</Select.Option>
                            ))}
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
            </Modal>

            {/* Nominee Modal */}
            <Modal
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
            </Modal>
        </div>
    );
};

export default GroupTickets;
