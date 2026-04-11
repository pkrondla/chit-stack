import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, DatePicker, App, Row, Col, Statistic, Tooltip } from 'antd';
import { Award, Download, Users, TrendingUp, CircleDollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AgentPerformance = () => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ modes: [], agentPerformance: [], grandTotal: 0 });
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async (appliedDates = dates) => {
        try {
            setLoading(true);
            const from = appliedDates[0].format('YYYY-MM-DD');
            const to = appliedDates[1].format('YYYY-MM-DD');
            const res = await api.get(`/Reporting/collection-summary?from=${from}&to=${to}`);
            setData(res.data.data || res.data || { modes: [], agentPerformance: [], grandTotal: 0 });
        } catch (error) {
            message.error("Failed to load collection summary");
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = async () => {
        try {
            setLoading(true);
            const from = dates[0].format('YYYY-MM-DD');
            const to = dates[1].format('YYYY-MM-DD');
            const response = await api.get(`/Reporting/collection-summary/pdf?from=${from}&to=${to}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Agent_Performance_${from}_to_${to}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error("Error downloading PDF");
        } finally {
            setLoading(false);
        }
    };

    const modeColumns = [
        { title: 'Payment Mode', dataIndex: 'mode', key: 'mode', render: (text) => <Tag color="blue">{text}</Tag> },
        { title: 'Receipts', dataIndex: 'receiptCount', key: 'count', align: 'center' },
        { title: 'Total Amount', dataIndex: 'totalAmount', key: 'amount', align: 'right', render: (val) => <span className="font-bold">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> }
    ];

    const agentColumns = [
        {
            title: 'Agent Name',
            dataIndex: 'agentName',
            key: 'agentName',
            render: (text) => <div className="font-bold text-slate-800 flex items-center gap-2"><Users size={16} className="text-slate-400" /> {text}</div>
        },
        {
            title: 'Submissions',
            dataIndex: 'submissionCount',
            key: 'count',
            align: 'center'
        },
        {
            title: 'Total Collected',
            dataIndex: 'totalCollected',
            key: 'total',
            align: 'right',
            render: (val) => <span>₹{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        },
        {
            title: 'Verified Amount',
            dataIndex: 'verifiedCollected',
            key: 'verified',
            align: 'right',
            render: (val) => <span className="text-green-600 font-semibold">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        },
        {
            title: (
                <Tooltip title="1% of Verified Collections (Adjusted against Dividend Rounding Off)">
                    <div className="flex items-center gap-1 cursor-help justify-end">Suggested Bonus <Award size={14} /></div>
                </Tooltip>
            ),
            dataIndex: 'suggestedBonus',
            key: 'bonus',
            align: 'right',
            render: (val) => <Tag color="gold" className="font-bold text-lg p-1 px-3">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Tag>
        }
    ];

    const maxVerified = Math.max(...data.agentPerformance.map(a => a.verifiedCollected), 0);
    const topAgent = data.agentPerformance.find(a => a.verifiedCollected === maxVerified && maxVerified > 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Row gutter={[16, 16]} align="middle" className="mb-6">
                <Col flex="auto">
                    <Title level={2} className="!mb-0 flex items-center gap-3">
                        <TrendingUp size={32} className="text-indigo-600" /> Collection & Agent Performance
                    </Title>
                    <Text type="secondary">Monitor field collection trends and automated bonus calculation based on verified agent submissions.</Text>
                </Col>
                <Col>
                    <Space size="middle">
                        <RangePicker 
                            value={dates} 
                            onChange={(vals) => {
                                setDates(vals);
                                if (vals) fetchReport(vals);
                            }}
                            size="large"
                            className="shadow-sm"
                        />
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<Download size={18} />}
                            onClick={downloadPdf}
                            disabled={data.agentPerformance.length === 0}
                            loading={loading}
                            className="bg-indigo-600 font-semibold h-10"
                        >
                            Export PDF
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Row gutter={16} className="mb-6">
                <Col span={8}>
                    <Card className="shadow-sm border-slate-100 bg-slate-50">
                        <Statistic 
                            title="Grand Total Collected" 
                            value={data.grandTotal} 
                            precision={2} 
                            prefix="₹" 
                            styles={{ content: { color: '#1e293b', fontWeight: 'bold' } }} 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm border-slate-100 bg-indigo-50">
                        <Statistic 
                            title="Total Agent Verified" 
                            value={data.agentPerformance.reduce((s, a) => s + a.verifiedCollected, 0)} 
                            precision={2} 
                            prefix={<CircleDollarSign size={20} className="mr-1 text-indigo-600" />}
                            styles={{ content: { color: '#4f46e5', fontWeight: 'bold' } }} 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm border-slate-100 bg-amber-50">
                        {topAgent ? (
                            <div className="flex justify-between items-center h-[56px]">
                                <div>
                                    <div className="text-slate-500 text-sm">Top Performing Agent</div>
                                    <div className="text-xl font-bold text-amber-700">{topAgent.agentName}</div>
                                </div>
                                <Award size={32} className="text-amber-500" />
                            </div>
                        ) : (
                            <Statistic title="Top Agent" value="—" />
                        )}
                    </Card>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Card title={<Space><CircleDollarSign size={18} /><span>Mode Breakdown</span></Space>} className="shadow-sm">
                        <Table
                            columns={modeColumns}
                            dataSource={data.modes}
                            rowKey="mode"
                            pagination={false}
                            size="small"
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={16}>
                    <Card title={<Space><Award size={18} /><span>Agent Earnings & Performance Metrics</span></Space>} className="shadow-sm">
                        <Table
                            columns={agentColumns}
                            dataSource={data.agentPerformance}
                            rowKey="agentId"
                            loading={loading}
                            pagination={false}
                            size="middle"
                        />
                        <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500 flex items-start gap-2 italic">
                            <Text type="secondary">* Suggested Bonus is calculated as 1% of [Verified Collections]. This amount is not automatically posted and should be reviewed by management before adjusting against "Dividend Rounding Off" account.</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AgentPerformance;
