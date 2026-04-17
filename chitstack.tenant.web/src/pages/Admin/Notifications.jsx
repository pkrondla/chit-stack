import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Select, Input, Tag, Space, Typography, message, Badge, Switch, DatePicker } from 'antd';
import { Send, History, Filter, User, Bell, Search, Mail, MessageSquare, Smartphone, Zap, Info, Calendar } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ManageNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [filterDateRange, setFilterDateRange] = useState(null);
    const [filterType, setFilterType] = useState('all');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [notifRes, userRes, memberRes] = await Promise.all([
                api.get('/adminnotification/recent'),
                api.get('/users'),
                api.get('/members')
            ]);
            setNotifications(notifRes.data);
            setUsers(userRes.data?.data || []);
            setMembers(memberRes.data || []);
        } catch (err) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredNotifications = notifications.filter(n => {
        const matchesType = filterType === 'all' || n.templateName === filterType;
        if (!filterDateRange) return matchesType;
        
        const date = new Date(n.createdAt);
        const start = filterDateRange[0].toDate();
        const end = filterDateRange[1].toDate();
        return matchesType && date >= start && date <= end;
    });

    const columns = [
        {
            title: 'User',
            dataIndex: 'userId',
            key: 'userId',
            width: 250,
            render: (_, record) => {
                const userList = Array.isArray(users) ? users : [];
                const memberList = Array.isArray(members) ? members : [];
                
                const user = userList.find(u => u.id === record.userId);
                const member = memberList.find(m => m.id === record.memberId);
                const displayName = user?.username || member?.name || member?.phoneNumber || record.memberId || record.userId;
                const subLabel = user?.role || (member ? 'MEMBER (NO ACCOUNT)' : 'SUBSCRIBER');
                
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                             <User size={14} />
                        </div>
                        <div>
                            <Text strong className="block leading-none text-sm">{displayName}</Text>
                            <Text type="secondary" className="text-xs font-bold uppercase tracking-tight opacity-60">{subLabel}</Text>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Message Content',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-sm text-slate-700">{text}</Text>
                    <Text type="secondary" className="text-xs line-clamp-1 italic">{record.message}</Text>
                </div>
            )
        },
        {
            title: 'Activity Type',
            dataIndex: 'templateName',
            key: 'templateName',
            width: 180,
            render: (name) => (
                <Tag color="purple" className="rounded-xl border-slate-100 bg-slate-50 text-slate-600 font-bold px-3 py-1 flex items-center gap-2 w-fit">
                    <History size={12} className="opacity-40" />
                    <span className="text-xs uppercase tracking-wider">{name?.replace(/([A-Z])/g, ' $1').trim() || 'Custom Manual'}</span>
                </Tag>
            )
        },
        {
            title: 'Delivery Mode',
            dataIndex: 'channelsSent',
            key: 'channelsSent',
            width: 180,
            render: (channels) => {
                const list = channels?.split(', ') || ['Portal'];
                return (
                    <div className="flex flex-wrap gap-1">
                        {list.map(c => {
                            let icon = <Bell size={10} />;
                            let color = 'blue';
                            if (c === 'WhatsApp') { icon = <MessageSquare size={10} />; color = 'green'; }
                            if (c === 'SMS') { icon = <Smartphone size={10} />; color = 'purple'; }
                            if (c === 'Email') { icon = <Mail size={10} />; color = 'orange'; }
                            if (c === 'Telegram') { icon = <Send size={10} />; color = 'cyan'; }
                            
                            return (
                                <Tag key={c} color={color} className="rounded-md border-0 bg-opacity-10 font-bold text-xs px-2 py-0.5 flex items-center gap-1">
                                    {icon} {c.toUpperCase()}
                                </Tag>
                            );
                        })}
                    </div>
                )
            }
        },
        {
            title: 'Read Status',
            dataIndex: 'isRead',
            key: 'isRead',
            width: 120,
            render: (isRead) => isRead ? 
                <Tag color="success" className="rounded-md border-0 bg-green-50 text-green-600 font-bold px-3">READ</Tag> : 
                <Tag color="processing" className="rounded-md border-0 bg-blue-50 text-blue-600 font-bold px-3">DELIVERED</Tag>
        },
        {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 200,
            render: (date) => (
                <div className="text-xs font-mono text-slate-500">
                    {new Date(date).toLocaleDateString()} <span className="opacity-40 ml-1">{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
                <div>
                    <Title level={2} className="!m-0 text-slate-800">Recent Activity</Title>
                    <Text className="text-slate-500 font-medium text-sm">Analyze your alert dispatch history and user read engagement.</Text>
                </div>
                <div className="flex items-center gap-3">
                    <DatePicker.RangePicker 
                        className="rounded-xl h-11 border-slate-200"
                        onChange={setFilterDateRange}
                        value={filterDateRange}
                    />
                    <Select 
                        className="w-48 h-11"
                        value={filterType}
                        onChange={setFilterType}
                        suffixIcon={<Filter size={14} className="text-slate-400" />}
                    >
                        <Option value="all">All Types</Option>
                        {[...new Set(notifications.map(n => n.templateName))].filter(Boolean).map(name => (
                            <Option key={name} value={name}>{name.replace(/([A-Z])/g, ' $1').trim()}</Option>
                        ))}
                    </Select>
                    <Button 
                        icon={<History size={16} />} 
                        onClick={fetchData}
                        className="rounded-xl h-11 border-slate-200 flex items-center justify-center"
                    />
                </div>
            </div>

            <Card className="shadow-sm border-slate-100 rounded-[40px] p-2 mb-10 overflow-hidden">
                <Table 
                    dataSource={filteredNotifications} 
                    columns={columns} 
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 12, placement: 'bottomCenter' }}
                    className="notification-activity-table shadow-none border-0"
                />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-sm border-0 bg-indigo-50/50 rounded-[40px] p-6 text-center hover:shadow-md transition-shadow">
                    <Title level={5} className="!text-indigo-400 uppercase tracking-[0.2em] text-xs mb-4">Total Sent</Title>
                    <Title level={1} className="!m-0 text-indigo-900 font-black tracking-tight">{notifications.length}</Title>
                    <Text className="text-xs uppercase font-bold text-indigo-300 mt-2 block">Messaging Volume</Text>
                </Card>

                <Card className="shadow-sm border-0 bg-green-50/50 rounded-[40px] p-6 text-center hover:shadow-md transition-shadow">
                    <Title level={5} className="!text-green-400 uppercase tracking-[0.2em] text-xs mb-4">Read Rate</Title>
                    <Title level={1} className="!m-0 text-green-700 font-black tracking-tight">
                        {notifications.length > 0 ? Math.round((notifications.filter(n => n.isRead).length / notifications.length) * 100) : 0}%
                    </Title>
                    <Text className="text-xs uppercase font-bold text-green-300 mt-2 block">User Engagement</Text>
                </Card>

                <Card className="shadow-sm border-0 bg-amber-50/50 rounded-[40px] p-6 text-center hover:shadow-md transition-shadow">
                    <Title level={5} className="!text-amber-500 uppercase tracking-[0.2em] text-xs mb-4">Delivery Style</Title>
                    <div className="flex justify-center gap-4 mt-2">
                         <div className="flex flex-col items-center">
                            <Text strong className="text-amber-700 leading-none">{notifications.filter(n => n.type === 2).length}</Text>
                            <Text className="text-xs font-black uppercase text-amber-300">Warnings</Text>
                         </div>
                         <div className="w-[1px] h-8 bg-amber-100" />
                         <div className="flex flex-col items-center">
                            <Text strong className="text-amber-700 leading-none">{notifications.filter(n => n.type === 0).length}</Text>
                            <Text className="text-xs font-black uppercase text-amber-300">Info</Text>
                         </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ManageNotifications;
