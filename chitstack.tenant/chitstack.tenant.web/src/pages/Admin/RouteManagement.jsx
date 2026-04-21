import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Typography, Tag, Select, Button, Space, Modal, Form, Input, message, Divider } from 'antd';
import { MapPin, Users, Plus, Save } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const RouteManagement = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    
    // Filtering states
    const [nameFilter, setNameFilter] = useState('');
    const [routeFilter, setRouteFilter] = useState('all'); // all, unassigned, or routeId

    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: ['members-for-route'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: ['all-routes'],
        queryFn: async () => {
            const res = await api.get('/Collections/routes');
            return res.data.data || res.data;
        }
    });

    // ... createRouteMutation and assignMemberMutation remain the same ...
    const createRouteMutation = useMutation({
        mutationFn: async (values) => {
            const res = await api.post('/Collections/routes', values);
            return res.data;
        },
        onSuccess: () => {
            message.success('Route created successfully');
            setIsModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['all-routes'] });
        }
    });

    const assignMemberMutation = useMutation({
        mutationFn: async ({ memberId, routeId }) => {
            const res = await api.post('/Collections/assign-member-route', { memberId, routeId });
            return res.data;
        },
        onSuccess: () => {
            message.success('Assignment updated');
            queryClient.invalidateQueries({ queryKey: ['members-for-route'] });
            queryClient.invalidateQueries({ queryKey: ['all-routes'] });
        }
    });

    const filteredMembers = members.filter(m => {
        const matchesName = m.fullName?.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesRoute = routeFilter === 'all' ? true :
                             routeFilter === 'unassigned' ? !m.collectionRouteId :
                             m.collectionRouteId === parseInt(routeFilter);
        return matchesName && matchesRoute;
    });

    const columns = [
        {
            title: 'Member Details',
            key: 'member',
            render: (_, record) => (
                <div>
                    <Text strong className="block">{record.fullName}</Text>
                    <Text className="text-slate-500 text-xs block">{record.phoneNumber}</Text>
                </div>
            )
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: addr => <Text className="text-slate-500 text-xs">{addr || 'Not specified'}</Text>
        },
        {
            title: 'Assigned Route',
            dataIndex: 'collectionRouteId',
            key: 'route',
            render: (routeId, record) => (
                <Select 
                    value={routeId || undefined} 
                    placeholder="Choose Route"
                    style={{ width: 220 }} 
                    className="rounded-xl"
                    onChange={(val) => assignMemberMutation.mutate({ memberId: record.id, routeId: val || null })}
                    allowClear
                >
                    {routes.map(r => (
                        <Select.Option key={r.id} value={r.id}>{r.routeName}</Select.Option>
                    ))}
                </Select>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 gap-4">
                <div>
                   <Title level={4} className="!mb-1">Route & Topology Management</Title>
                   <Text className="text-slate-500">Create collection sectors and assign members to optimize agent visits.</Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<Plus size={18} />}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 rounded-xl h-12 font-bold flex items-center gap-2"
                    size="large"
                >
                    Create New Route
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
                <Input 
                    placeholder="Filter by Member Name" 
                    value={nameFilter} 
                    onChange={e => setNameFilter(e.target.value)}
                    className="rounded-xl h-10"
                    allowClear
                />
                <Select 
                    value={routeFilter} 
                    onChange={setRouteFilter}
                    className="rounded-xl h-10 w-full"
                    placeholder="Filter by Route"
                >
                    <Select.Option value="all">All Members</Select.Option>
                    <Select.Option value="unassigned">Not Assigned</Select.Option>
                    {routes.map(r => (
                        <Select.Option key={r.id} value={r.id.toString()}>{r.routeName}</Select.Option>
                    ))}
                </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 rounded-3xl shadow-sm border-slate-100">
                    <Title level={5}>Active Routes</Title>
                    <Divider className="my-3" />
                    <div className="space-y-3">
                        {routes.length === 0 && <Text className="text-slate-400 italic">No routes defined yet.</Text>}
                        {routes.map(r => (
                            <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <div>
                                    <Text strong className="block">{r.routeName}</Text>
                                    <Tag color="blue" className="rounded-full text-[10px] uppercase font-black">{r.memberCount} Members</Tag>
                                </div>
                                <MapPin size={16} className="text-slate-300" />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-3 rounded-3xl shadow-sm border-0 overflow-hidden p-0" styles={{ body: { padding: 0 } }}>
                    <Table 
                        dataSource={filteredMembers} 
                        columns={columns} 
                        rowKey="id" 
                        loading={membersLoading || routesLoading}
                        pagination={{ pageSize: 15 }}
                        className="custom-table"
                    />
                </Card>
            </div>

            <Modal
                title={<Title level={4}>Define Collection Route</Title>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                className="rounded-3xl"
            >
                <Form layout="vertical" form={form} onFinish={(v) => createRouteMutation.mutate(v)} className="mt-4">
                    <Form.Item name="routeName" label="Route Name" rules={[{ required: true, message: 'Please enter route name' }]}>
                        <Input placeholder="e.g. North Sector, Mount Road Area" size="large" className="rounded-xl" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Optional details..." rows={3} className="rounded-xl" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)} size="large" className="rounded-xl">Cancel</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-slate-900 rounded-xl font-bold" loading={createRouteMutation.isPending}>
                            Create Route
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default RouteManagement;
