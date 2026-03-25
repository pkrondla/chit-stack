import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Tag, Select, Button, Space, App } from 'antd';
import { MapPin, Users, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const RouteManagement = () => {
    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members-for-route'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    const columns = [
        {
            title: 'Member Name',
            dataIndex: 'fullName',
            key: 'fullName',
            render: name => <Text strong>{name}</Text>
        },
        {
            title: 'Address / Location',
            dataIndex: 'address',
            key: 'address',
            render: addr => <Text className="text-slate-500 text-xs">{addr || 'Not specified'}</Text>
        },
        {
            title: 'Assigned Route',
            key: 'route',
            render: () => (
                <Select defaultValue="North Sector" style={{ width: 200 }} className="rounded-xl">
                    <Select.Option value="North Sector">North Sector</Select.Option>
                    <Select.Option value="East Sector">East Sector</Select.Option>
                    <Select.Option value="Unassigned">Unassigned</Select.Option>
                </Select>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: () => <Button type="link" className="font-bold">Sync GPS</Button>
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                   <Title level={4} className="!mb-1">Geographic Route Assignment</Title>
                   <Text className="text-slate-500">Group members into sectors for optimized field collection.</Text>
                </div>
                <Button type="primary" className="bg-slate-900 rounded-xl h-12 font-black">Save Topology</Button>
            </div>

            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                <Table 
                    dataSource={members} 
                    columns={columns} 
                    rowKey="id" 
                    loading={isLoading}
                    pagination={{ pageSize: 20 }}
                />
            </Card>
        </div>
    );
};

export default RouteManagement;
