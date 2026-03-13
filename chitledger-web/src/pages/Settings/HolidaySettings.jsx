import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Input, Switch, Table, Popconfirm, Typography, Tag, Space, message } from 'antd';
import { CalendarX2, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Text } = Typography;

const fetchHolidays = () => api.get('/settings/holidays').then(r => r.data);

const HolidaySettings = () => {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(null);
    const [description, setDescription] = useState('');
    const [recurring, setRecurring] = useState(false);

    const { data: holidays = [], isLoading } = useQuery({
        queryKey: ['holidays'],
        queryFn: fetchHolidays,
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/settings/holidays', data).then(r => r.data),
        onSuccess: () => {
            message.success('Holiday added');
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            setDate(null);
            setDescription('');
            setRecurring(false);
        },
        onError: () => message.error('Failed to add holiday'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/settings/holidays/${id}`),
        onSuccess: () => {
            message.success('Holiday removed');
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
    });

    const handleAdd = () => {
        if (!date || !description.trim()) {
            message.warning('Please select a date and enter a description.');
            return;
        }
        addMutation.mutate({
            date: date.format('YYYY-MM-DD'),
            description: description.trim(),
            isRecurringYearly: recurring,
        });
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (d) => dayjs(d).format('DD MMM YYYY'),
            sorter: (a, b) => a.date.localeCompare(b.date),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Type',
            dataIndex: 'isRecurringYearly',
            key: 'recurring',
            render: (v) => v
                ? <Tag color="blue">Recurring Yearly</Tag>
                : <Tag color="default">One-off</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 60,
            render: (_, record) => (
                <Popconfirm
                    title="Remove this holiday?"
                    onConfirm={() => deleteMutation.mutate(record.id)}
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                >
                    <Button icon={<Trash2 size={14} />} size="small" danger type="text" />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <CalendarX2 size={16} className="text-slate-500" />
                <Text className="text-slate-500">
                    Auction dates that fall on a holiday are automatically shifted to the next available weekday.
                </Text>
            </div>

            {/* Add Holiday Form */}
            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-100">
                <Text strong className="text-slate-700 block mb-4">Add Holiday</Text>
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <div className="text-xs text-slate-500 mb-1 font-medium">Date</div>
                        <DatePicker
                            value={date}
                            onChange={setDate}
                            format="DD MMM YYYY"
                            size="large"
                            style={{ width: 180 }}
                        />
                    </div>
                    <div className="flex-1" style={{ minWidth: 220 }}>
                        <div className="text-xs text-slate-500 mb-1 font-medium">Description</div>
                        <Input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Pongal, Diwali, Republic Day"
                            size="large"
                        />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1 font-medium">Recurring Yearly?</div>
                        <div className="flex items-center gap-2 h-10">
                            <Switch checked={recurring} onChange={setRecurring} />
                            <Text className="text-slate-600 text-sm">{recurring ? 'Yes' : 'No'}</Text>
                        </div>
                    </div>
                    <Button
                        type="primary"
                        icon={<Plus size={16} />}
                        size="large"
                        className="bg-slate-900"
                        onClick={handleAdd}
                        loading={addMutation.isPending}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* Holiday List */}
            <Table
                columns={columns}
                dataSource={holidays}
                rowKey="id"
                loading={isLoading}
                size="middle"
                pagination={false}
                locale={{ emptyText: 'No holidays added yet. Sundays are automatically excluded from auction scheduling.' }}
            />
        </div>
    );
};

export default HolidaySettings;
