import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Typography, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import api from '../../api/axios';

const { Title } = Typography;

const UserManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/Users');
            return res.data.data || res.data;
        }
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await api.get('/Reporting/branches');
            return res.data.data || res.data;
        }
    });

    const { data: routes = [] } = useQuery({
        queryKey: ['routesByBranch'],
        queryFn: async () => {
            const res = await api.get('/Collections/routes');
            return res.data.data || res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await api.post('/Users', formData);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('User Created Successfully');
            setIsModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            message.error("Creation failed: " + (error.response?.data?.error || error.message));
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await api.put(`/Users/${editingUser.id}`, formData);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('User Updated Successfully');
            setIsModalOpen(false);
            setEditingUser(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            message.error("Update failed: " + (error.response?.data?.error || error.message));
        }
    });

    const handleSubmit = (values) => {
        if (editingUser) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: user.role,
            branchIds: user.branchIds || [],
            assignedRouteId: user.assignedRouteId
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const columns = [
        { title: 'Name', dataIndex: 'fullName', key: 'fullName', className: 'font-semibold' },
        { title: 'Username', dataIndex: 'username', key: 'username' },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'Admin' ? 'orange' : 'blue'} className="px-3 py-1 rounded-full font-bold">
                    {role}
                </Tag>
            )
        },
        { title: 'Email', dataIndex: 'email', key: 'email', className: 'text-slate-500' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="link"
                    onClick={() => openEditModal(record)}
                    className="p-0 h-auto"
                >
                    Edit
                </Button>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">User Management</Title>
                <Button
                    type="primary"
                    icon={<Plus size={18} />}
                    onClick={openCreateModal}
                    size="large"
                    className="bg-slate-900"
                >
                    Add User
                </Button>
            </div>

            <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                className="shadow-sm rounded-lg overflow-hidden bg-white"
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={<Title level={4}>{editingUser ? 'Edit User' : 'Create New User'}</Title>}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ role: 'Staff' }}
                    className="mt-6"
                >
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input size="large" disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                        rules={[{ required: !editingUser }]}
                    >
                        <Input.Password size="large" placeholder={editingUser ? "••••••••" : ""} />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select size="large">
                            <Select.Option value="Staff">Staff</Select.Option>
                            <Select.Option value="Manager">Manager</Select.Option>
                            <Select.Option value="Agent">Agent</Select.Option>
                            <Select.Option value="Auditor">Auditor</Select.Option>
                            <Select.Option value="Admin">Admin</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
                        {({ getFieldValue }) => getFieldValue('role') === 'Agent' && (
                            <Form.Item name="assignedRouteId" label="Assigned Route" rules={[{ required: true }]}>
                                <Select size="large" placeholder="Select Route">
                                    {routes.map(r => (
                                        <Select.Option key={r.id} value={r.id}>{r.routeName}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                    </Form.Item>
                    <Form.Item
                        name="branchIds"
                        label="Mapped Branches"
                        extra="Users will only be able to view data for selected branches (except Admins)"
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Select Branches"
                            className="w-full"
                        >
                            {branches.map(b => (
                                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => {
                            setIsModalOpen(false);
                            setEditingUser(null);
                            form.resetFields();
                        }} size="large">Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="bg-slate-900"
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingUser ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
