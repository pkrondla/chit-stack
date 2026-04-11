import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Typography, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import api from '../../api/axios';

const { Title } = Typography;

const UserManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/Users');
            return res.data.data || [];
        }
    });

    const createMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await api.post('/Users', formData);
            return res.data;
        },
        onSuccess: () => {
            message.success('User Created Successfully');
            setIsModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            message.error("Failed: " + (error.response?.data?.error || error.message));
        }
    });

    const handleCreate = (values) => {
        createMutation.mutate(values);
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
        { title: 'Email', dataIndex: 'email', key: 'email', className: 'text-slate-500' }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">User Management</Title>
                <Button
                    type="primary"
                    icon={<Plus size={18} />}
                    onClick={() => setIsModalOpen(true)}
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
                title={<Title level={4}>Create New User</Title>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    initialValues={{ role: 'Staff' }}
                    className="mt-6"
                >
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password size="large" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select size="large">
                            <Select.Option value="Staff">Staff</Select.Option>
                            <Select.Option value="Manager">Manager</Select.Option>
                            <Select.Option value="Admin">Admin</Select.Option>
                        </Select>
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsModalOpen(false)} size="large">Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="bg-slate-900"
                            loading={createMutation.isPending}
                        >
                            Create
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
