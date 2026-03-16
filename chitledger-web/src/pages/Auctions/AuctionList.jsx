import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Typography, Tag, Space, Spin, Alert, DatePicker, Select, Row, Col, Tooltip, Badge, Table } from 'antd';
import { Gavel, Play, Eye, Users, Calendar, Filter, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Auctions = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useState({
        dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
        groupId: null
    });

    // Local state for UI inputs
    const [localDateRange, setLocalDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [localGroupId, setLocalGroupId] = useState(null);

    const { data: groups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            return res.data.data || [];
        }
    });

    const { data: auctions = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['auctions', searchParams],
        queryFn: async () => {
            const params = {
                fromDate: searchParams.dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ss'),
                toDate: searchParams.dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ss'),
                chitGroupId: searchParams.groupId || undefined
            };
            const res = await api.get('/Auctions', { params });
            return res.data.data || res.data;
        }
    });

    const handleSearch = () => {
        setSearchParams({
            dateRange: localDateRange,
            groupId: localGroupId
        });
    };

    const handleToday = () => {
        const today = [dayjs().startOf('day'), dayjs().endOf('day')];
        setLocalDateRange(today);
        setLocalGroupId(null);
        setSearchParams({
            dateRange: today,
            groupId: null
        });
    };

    const handleReset = () => {
        setLocalDateRange(null);
        setLocalGroupId(null);
        setSearchParams({
            dateRange: null,
            groupId: null
        });
    };

    const columns = [
        {
            title: 'Time',
            key: 'time',
            width: 120,
            render: (_, auction) => {
                const date = dayjs(auction.auctionDate);
                const isToday = date.isSame(dayjs(), 'day');
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock size={14} className="text-indigo-500" />
                            {date.format('hh:mm A')}
                        </span>
                        <span className={`text-[10px] uppercase font-bold ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {isToday ? 'Today' : date.format('MMM DD, YYYY')}
                        </span>
                    </div>
                );
            }
        },
        {
            title: 'Chit Group',
            key: 'group',
            render: (_, auction) => (
                <div className="flex flex-col">
                    <span className={`font-semibold text-base ${auction.groupStatus === 'Proposed' ? 'text-slate-400' : 'text-slate-800'}`}>
                        {auction.groupName}
                    </span>
                    <Space size={4}>
                        <Badge status={auction.auctionStatus === 'Closed' ? "success" : auction.groupStatus === 'Proposed' ? "default" : "processing"} />
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Installment #{auction.installmentNumber}</span>
                    </Space>
                </div>
            )
        },
        {
            title: 'Status',
            key: 'status',
            width: 140,
            render: (_, auction) => {
                const isProposed = auction.groupStatus === 'Proposed';
                const isClosed = auction.auctionStatus === 'Closed';
                return (
                    <Tag
                        bordered={false}
                        className={`rounded-full font-bold px-3 m-0 text-[10px] uppercase tracking-wider ${isClosed ? 'bg-green-100 text-green-700' :
                            isProposed ? 'bg-slate-100 text-slate-400' :
                                'bg-amber-100 text-amber-700'
                            }`}
                    >
                        {isClosed ? 'Completed' : isProposed ? 'Not Launched' : 'Scheduled'}
                    </Tag>
                );
            }
        },
        {
            title: 'Result / Info',
            key: 'info',
            render: (_, auction) => {
                if (auction.auctionStatus === 'Closed') {
                    return (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Badge status="success" />
                                <span className="text-sm font-bold text-slate-800">{auction.winnerName || 'N/A'}</span>
                                <Tag color="blue" className="m-0 text-[10px] leading-4 h-4 uppercase">Ticket #{auction.winningTicketNumber}</Tag>
                            </div>
                            <div className="flex gap-4 border-t border-slate-100 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Winning Bid</span>
                                    <span className="text-sm font-mono font-bold text-slate-700">₹{auction.winningBidAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Dividend</span>
                                    <span className="text-sm font-mono font-bold text-green-600">₹{auction.dividendAmount?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                }
                if (auction.groupStatus === 'Proposed') {
                    return <span className="text-xs italic text-slate-400 flex items-center gap-1"><AlertCircle size={12} /> Launch group to start</span>;
                }
                return <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Ready for Auction</span>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            width: 280,
            render: (_, auction) => {
                const isProposed = auction.groupStatus === 'Proposed';
                const isClosed = auction.auctionStatus === 'Closed';
                return (
                    <Space>
                        <Tooltip title={isProposed ? "Group is not launched yet" : ""}>
                            <Button
                                type={isClosed ? 'default' : 'primary'}
                                size="middle"
                                disabled={isProposed}
                                className={`rounded-lg font-bold flex items-center gap-2 border-none ${isClosed ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 shadow-sm'
                                    }`}
                                icon={isClosed ? <Eye size={16} /> : <Play size={16} />}
                                onClick={() => navigate(`/auctions/console/${auction.id}`)}
                            >
                                {isClosed ? 'View' : 'Open Console'}
                            </Button>
                        </Tooltip>
                        <Button
                            size="middle"
                            disabled={isProposed}
                            className="rounded-lg font-bold flex items-center gap-2 border-slate-200 text-slate-600 hover:text-indigo-600"
                            icon={<Gavel size={16} />}
                            onClick={() => navigate(`/auctions/live/${auction.id}`)}
                        >
                            Live Room
                        </Button>
                    </Space>
                );
            }
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} className="!mb-0 text-slate-800">Auction Board</Title>
                    <Text className="text-slate-500">Manage daily chit auctions efficiently</Text>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6 shadow-sm border-slate-200 bg-slate-50/30" styles={{ body: { padding: '1.25rem' } }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={8} lg={7}>
                        <div className="text-slate-500 mb-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} className="text-indigo-500" />
                            Date Range
                        </div>
                        <RangePicker
                            className="w-full h-10 rounded-lg"
                            value={localDateRange}
                            onChange={setLocalDateRange}
                        />
                    </Col>
                    <Col xs={24} md={8} lg={7}>
                        <div className="text-slate-500 mb-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <Filter size={12} className="text-indigo-500" />
                            Chit Group
                        </div>
                        <Select
                            className="w-full h-10"
                            placeholder="All Groups"
                            allowClear
                            value={localGroupId}
                            onChange={setLocalGroupId}
                            options={groups.map(g => ({ label: g.groupName, value: g.id }))}
                        />
                    </Col>
                    <Col xs={24} md={8} lg={10}>
                        <Space size="middle" className="w-full justify-end">
                            <Button
                                onClick={handleToday}
                                className="h-10 rounded-lg px-6 font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                Today
                            </Button>
                            <Button
                                type="primary"
                                icon={<Filter size={16} />}
                                onClick={handleSearch}
                                className="h-10 rounded-lg px-8 font-bold bg-slate-900 shadow-md flex items-center gap-2"
                            >
                                Filter Auctions
                            </Button>
                            <Tooltip title="Clear all filters">
                                <Button
                                    icon={<RotateCcw size={16} />}
                                    onClick={handleReset}
                                    className="h-10 rounded-lg items-center justify-center text-slate-400 hover:text-red-500"
                                />
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={auctions}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        className: "px-6 py-4 border-t border-slate-50"
                    }}
                    rowClassName={(record) => record.groupStatus === 'Proposed' ? 'bg-slate-50/50 opacity-70' : 'hover:bg-indigo-50/30 transition-colors'}
                    locale={{
                        emptyText: (
                            <div className="py-12">
                                <Gavel size={40} className="mx-auto text-slate-200 mb-4" />
                                <Text className="text-slate-400 block mb-4">No auctions found for the selected criteria.</Text>
                                <Button onClick={handleToday} type="link">Show Today's Auctions</Button>
                            </div>
                        )
                    }}
                />
            </div>

            {isError && (
                <Alert
                    type="error"
                    showIcon
                    message="Connection Error"
                    description="Failed to load auctions from the server."
                    className="mt-4 rounded-xl shadow-sm border-red-100"
                />
            )}
        </div>
    );
};


export default Auctions;
