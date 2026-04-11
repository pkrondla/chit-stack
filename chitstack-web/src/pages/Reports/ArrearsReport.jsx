import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Select, App, Row, Col, Statistic, Divider, Modal, Spin, List } from 'antd';
import { FileText, Download, Users, AlertCircle, Phone, Info, Calendar, CircleDollarSign, MapPin } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ArrearsReport = () => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [chitGroups, setChitGroups] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [filters, setFilters] = useState({
        branchId: null,
        chitGroupId: null,
        routeId: null
    });
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedArrears, setSelectedArrears] = useState(null);
    const [selectedTicketDues, setSelectedTicketDues] = useState(null);

    useEffect(() => {
        fetchGroups();
        fetchRoutes();
        fetchReport();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await api.get('/Collections/routes');
            setRoutes(res.data.data || res.data || []);
        } catch (error) {
            message.error("Failed to load routes");
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/ChitGroups');
            setChitGroups(res.data.data || res.data || []);
        } catch (error) {
            message.error("Failed to load groups");
        }
    };

    const fetchReport = async (appliedFilters = filters) => {
        try {
            setLoading(true);
            let url = '/Reporting/arrears';
            const params = new URLSearchParams();
            if (appliedFilters.chitGroupId) params.append('chitGroupId', appliedFilters.chitGroupId);
            if (appliedFilters.routeId) params.append('routeId', appliedFilters.routeId);
            
            const res = await api.get(`${url}?${params.toString()}`);
            setData(res.data.data || res.data || []);
        } catch (error) {
            message.error("Failed to load arrears report");
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.chitGroupId) params.append('chitGroupId', filters.chitGroupId);
            if (filters.routeId) params.append('routeId', filters.routeId);
            
            const response = await api.get(`/Reporting/arrears/pdf?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Arrears_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error("Error downloading PDF");
        } finally {
            setLoading(false);
        }
    };

    const handleShowDetails = async (record) => {
        setSelectedArrears(record);
        setDetailModalVisible(true);
        setDetailsLoading(true);
        setSelectedTicketDues(null);
        
        try {
            const res = await api.get(`/Members/${record.memberId}/dues`);
            const allDues = res.data.data || res.data;
            
            // Find the specific ticket dues from the member's aggregated dues
            if (allDues && allDues.ticketDues) {
                const ticketInfo = allDues.ticketDues.find(t => t.ticketNumber === record.ticketNumber);
                setSelectedTicketDues(ticketInfo);
            }
        } catch (error) {
            message.error("Failed to load details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const columns = [
        {
            title: 'Subscriber',
            key: 'subscriber',
            render: (_, record) => (
                <div>
                    <div className="font-bold text-slate-800">{record.memberName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={10} /> {record.phoneNumber}
                    </div>
                    {record.routeName && (
                        <div className="text-[10px] text-indigo-500 flex items-center gap-1 mt-1">
                            <MapPin size={10} /> {record.routeName}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Chit Group / Ticket',
            key: 'group',
            render: (_, record) => (
                <div>
                    <div className="text-sm">{record.groupName}</div>
                    <Tag color="blue">Ticket #{record.ticketNumber}</Tag>
                </div>
            )
        },
        {
            title: 'Pending Inst.',
            dataIndex: 'totalPendingInstallments',
            key: 'inst',
            align: 'center',
            render: (val) => <Tag color={val > 3 ? 'red' : 'orange'}>{val}</Tag>
        },
        {
            title: 'Last Due Date',
            dataIndex: 'maxDueDate',
            key: 'dueDate',
            render: (date) => date ? new Date(date).toLocaleDateString() : '—'
        },
        {
            title: 'Outstanding Balance',
            dataIndex: 'totalBalance',
            key: 'balance',
            align: 'right',
            render: (val) => <span className="font-bold text-red-600">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button size="small" type="link" onClick={() => handleShowDetails(record)} className="font-semibold">Details</Button>
            )
        }
    ];

    const totalArrears = data.reduce((sum, item) => sum + item.totalBalance, 0);
    const totalMembers = new Set(data.map(d => d.memberId)).size;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Row gutter={[16, 16]} align="middle" className="mb-6">
                <Col flex="auto">
                    <Title level={2} className="!mb-0 flex items-center gap-3">
                        <AlertCircle size={32} className="text-red-500" /> Arrears Report
                    </Title>
                    <Text type="secondary">Comprehensive list of all outstanding member dues across all active chit groups.</Text>
                </Col>
                <Col>
                    <Space>
                        <Select
                            placeholder="All Groups"
                            style={{ width: 220 }}
                            allowClear
                            onChange={(val) => {
                                const newFilters = { ...filters, chitGroupId: val };
                                setFilters(newFilters);
                                fetchReport(newFilters);
                            }}
                        >
                            {chitGroups.map(g => (
                                <Option key={g.id} value={g.id}>{g.groupName}</Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="All Routes"
                            style={{ width: 180 }}
                            allowClear
                            onChange={(val) => {
                                const newFilters = { ...filters, routeId: val };
                                setFilters(newFilters);
                                fetchReport(newFilters);
                            }}
                        >
                            {routes.map(r => (
                                <Option key={r.id} value={r.id}>{r.routeName}</Option>
                            ))}
                        </Select>
                        <Button 
                            type="primary" 
                            icon={<Download size={18} />}
                            onClick={downloadPdf}
                            disabled={data.length === 0}
                            loading={loading}
                        >
                            Export PDF
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Row gutter={16} className="mb-6">
                <Col span={8}>
                    <Card className="shadow-sm border-slate-200">
                        <Statistic 
                            title="Total Outstanding" 
                            value={totalArrears} 
                            precision={2} 
                            prefix="₹" 
                            styles={{ content: { color: '#cf1322', fontWeight: 'bold' } }} 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm border-slate-200">
                        <Statistic title="Defaulting Members" value={totalMembers} prefix={<Users size={20} className="mr-2" />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm border-slate-200">
                        <Statistic title="Total Tickets in Arrears" value={data.length} prefix={<FileText size={20} className="mr-2" />} />
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-md border-slate-200" styles={{ body: { padding: 0 } }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey={(record) => `${record.memberId}-${record.groupName}-${record.ticketNumber}`}
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    size="middle"
                />
            </Card>
            
            <div className="mt-4 text-xs text-slate-400 italic">
                * This report includes all minor outstanding amounts as per recent policy updates.
            </div>

            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <Info size={20} className="text-indigo-600" />
                        <span>Arrears Breakdown - {selectedArrears?.memberName}</span>
                    </div>
                }
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)} className="rounded-lg">
                        Close
                    </Button>
                ]}
                width={650}
                className="top-20"
            >
                {detailsLoading ? (
                    <div className="py-12 text-center">
                        <Spin size="large" />
                        <div className="mt-4 text-slate-500">Fetching installment history...</div>
                    </div>
                ) : selectedTicketDues ? (
                    <div className="py-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex justify-between items-center">
                            <div>
                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ticket Context</Text>
                                <Title level={5} className="!mb-0">{selectedArrears?.groupName} - #{selectedArrears?.ticketNumber}</Title>
                            </div>
                            <div className="text-right">
                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Due</Text>
                                <span className="text-xl font-black text-red-600">₹{(selectedTicketDues.pendingPrincipal + selectedTicketDues.pendingPenalty).toLocaleString()}</span>
                            </div>
                        </div>

                        <Title level={5} className="mb-4 text-slate-700 flex items-center gap-2">
                            <Calendar size={16} /> Unpaid Installments
                        </Title>
                        
                        <List
                            itemLayout="horizontal"
                            dataSource={selectedTicketDues.installments}
                            renderItem={(inst) => (
                                <List.Item className="bg-white border rounded-xl p-4 mb-3 shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                                {inst.installmentNumber}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">
                                                    Installment #{inst.installmentNumber}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Due: {new Date(inst.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-rose-600 text-lg">
                                                ₹{inst.totalDue.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-slate-400 italic">
                                                ₹{inst.grossPrincipal.toLocaleString()} (G) - ₹{inst.dividend.toLocaleString()} (D) {inst.pendingPenalty > 0 && `+ ₹${inst.pendingPenalty.toLocaleString()} (P)`}
                                            </div>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                            locale={{ emptyText: <div className="py-8 text-center text-slate-400">No pending installments found.</div> }}
                        />

                        {selectedTicketDues.advanceBalance > 0 && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-2 text-green-700 font-bold">
                                    <CircleDollarSign size={18} />
                                    <span>Available Advance Balance</span>
                                </div>
                                <span className="text-lg font-black text-green-700">₹{selectedTicketDues.advanceBalance.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-slate-500">
                        <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                        <div>Could not retrieve detailed breakdown for this ticket.</div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ArrearsReport;
