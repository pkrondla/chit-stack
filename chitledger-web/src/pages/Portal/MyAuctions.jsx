import React, { useState } from 'react';
import { Typography, Card, Table, Tag, Spin, Result, Button, Select } from 'antd';
import { Gavel, Calendar, Clock, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text } = Typography;

const MyAuctions = () => {
    const navigate = useNavigate();
    const { data: auctions = [], isLoading, error } = useQuery({
        queryKey: ['myAuctions'],
        queryFn: async () => {
            const res = await api.get('/Customer/my-auctions');
            return res.data.data || res.data;
        }
    });

    const [selectedGroup, setSelectedGroup] = useState('All');
    const uniqueGroups = Array.from(new Set(auctions.map(a => a.groupName)));

    const filteredAuctions = selectedGroup === 'All'
        ? auctions
        : auctions.filter(a => a.groupName === selectedGroup);

    const columns = [
        {
            title: 'Group',
            dataIndex: 'groupName',
            key: 'groupName',
            render: (text) => <span className="font-bold text-slate-800">{text}</span>
        },
        {
            title: 'Installment',
            dataIndex: 'installmentNumber',
            key: 'installmentNumber',
            render: (val) => <Tag color="blue">#{val}</Tag>
        },
        {
            title: 'Auction Date',
            dataIndex: 'auctionDate',
            key: 'auctionDate',
            sorter: (a, b) => new Date(a.auctionDate) - new Date(b.auctionDate),
            defaultSortOrder: 'ascend',
            render: (date) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} />
                    <span>{new Date(date).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    'Scheduled': 'processing',
                    'Open': 'success',
                    'Closed': 'default',
                    'Cancelled': 'error'
                };
                return <Tag color={colors[status] || 'default'} className="rounded-full px-3">{status}</Tag>;
            }
        },
        {
            title: 'Winning Bid',
            dataIndex: 'winningBidAmount',
            key: 'winningBidAmount',
            render: (val) => val ? <span className="font-mono font-bold text-slate-700">₹{val.toLocaleString()}</span> : '-'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div className="flex gap-2">
                    {record.status === 'Open' ? (
                        <Button
                            type="primary"
                            size="small"
                            className="bg-indigo-600 hover:bg-indigo-700 border-0 rounded-lg font-bold"
                            onClick={() => navigate(`/portal/auctions/live/${record.auctionId}`)}
                        >
                            Join Auction
                        </Button>
                    ) : record.status === 'Closed' ? (
                        <Button
                            size="small"
                            className="border-slate-200 text-slate-600 rounded-lg font-bold"
                            onClick={() => navigate(`/portal/auctions/live/${record.auctionId}`)}
                        >
                            View Room
                        </Button>
                    ) : null}
                </div>
            )
        }
    ];

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (error) return <Result status="error" title="Failed to load auctions" />;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-100">
                        <Gavel size={28} />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">Auctions</Title>
                        <Text className="text-slate-500 font-medium">Participate in live bidding and view auction history.</Text>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Text className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Filter By Group:</Text>
                    <Select
                        className="w-64"
                        value={selectedGroup}
                        onChange={setSelectedGroup}
                        options={[
                            { label: 'All Groups', value: 'All' },
                            ...uniqueGroups.map(g => ({ label: g, value: g }))
                        ]}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {filteredAuctions.filter(a => a.status === 'Open').map(auction => (
                    <Card key={auction.auctionId} className="border-0 shadow-md rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <Tag color="orange" className="mb-4 border-0 font-bold uppercase text-[10px]">Live Auction</Tag>
                            <Title level={3} className="!text-white !m-0 mb-1">{auction.groupName}</Title>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span className="font-medium">Ends in 2h 45m</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} />
                                    <span className="font-medium">Current: ₹15,000</span>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate(`/portal/auctions/live/${auction.auctionId}`)}
                                className="mt-6 bg-white text-slate-900 border-0 font-bold h-10 px-8 rounded-xl hover:!bg-slate-100 hover:!text-slate-800"
                            >
                                Join Live Room
                            </Button>
                        </div>
                        <Gavel className="absolute -bottom-8 -right-8 text-white/10 w-48 h-48" />
                    </Card>
                ))}
            </div>

            <Card className="shadow-xl shadow-slate-200/50 border-0 rounded-3xl overflow-hidden p-2">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <Title level={4} className="!m-0 text-slate-700">Auction History</Title>
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredAuctions}
                    rowKey="auctionId"
                    pagination={{ pageSize: 10 }}
                    className="member-portal-table"
                />
            </Card>
        </div >
    );
};

export default MyAuctions;
