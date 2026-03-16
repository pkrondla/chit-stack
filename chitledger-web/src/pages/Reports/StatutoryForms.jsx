import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Select, message, Tooltip, Row, Col, Divider } from 'antd';
import { FileText, Download, FileArchive, ArrowLeft, Search, Building2, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const StatutoryForms = () => {
    const [loading, setLoading] = useState(false);
    const [chitGroups, setChitGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [auctions, setAuctions] = useState([]);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/chitgroup');
            const data = res.data.data || res.data;
            setChitGroups(Array.isArray(data) ? data : []);
            if (Array.isArray(data) && data.length > 0) {
                setSelectedGroup(data[0].id);
            }
        } catch (error) {
            message.error("Failed to load chit groups");
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            fetchAuctions(selectedGroup);
        }
    }, [selectedGroup]);

    const fetchAuctions = async (groupId) => {
        try {
            const res = await api.get(`/auctions/group/${groupId}`);
            const data = res.data.data || res.data;
            setAuctions(Array.isArray(data) ? data : []);
        } catch (error) {
            message.error("Failed to load auctions");
        }
    };

    const downloadPdf = async (endpoint, fileName) => {
        try {
            setLoading(true);
            const response = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error("Error downloading file");
        } finally {
            setLoading(false);
        }
    };

    const formsList = [
        { key: 'form1', name: 'Form I - Application for Prior Sanction', section: 'Section 4', description: 'Application to Registrar before starting a new chit group.', category: 'Registration' },
        { key: 'form2', name: 'Form II - Application for Registration', section: 'Section 8', description: 'Request to register the chit agreement.', category: 'Registration' },
        { key: 'byelaws', name: 'Bye-Laws', section: 'Rule 5', description: 'Detailed rules and conduct of the chit group.', category: 'Company Document' },
        { key: 'security', name: 'Security Deposit Letter', section: 'Section 20', description: 'Proof of deposit with the Registrar.', category: 'Registration' },
        { key: 'form5', name: 'Form V - Declaration of Full Subscription', section: 'Section 9(1)', description: 'Confirmation that all tickets are filled.', category: 'Post-Registration' },
        { key: 'form6', name: 'Form VI - Commencement Request', section: 'Section 10', description: 'Final request to start the first auction.', category: 'Post-Registration' },
        { key: 'form7', name: 'Form VII - Agreements Distributed', section: 'Section 11', description: 'Certificate that all members got their agreement copies.', category: 'Post-Registration' },
        { key: 'balance', name: 'Form XI - Balance Sheet', section: 'Section 24', description: 'Annual financial snapshot of the chit.', category: 'Accounting' }
    ];

    const columns = [
        {
            title: 'Form Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" className="text-xs">{record.description}</Text>
                </Space>
            )
        },
        {
            title: 'Section',
            dataIndex: 'section',
            key: 'section',
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            filters: [
                { text: 'Registration', value: 'Registration' },
                { text: 'Post-Registration', value: 'Post-Registration' },
                { text: 'Accounting', value: 'Accounting' },
            ],
            onFilter: (value, record) => record.category === value,
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<Download size={16} />}
                    size="small"
                    onClick={() => {
                        let endpoint = '';
                        switch (record.key) {
                            case 'form1': endpoint = `/forms/sanction/${selectedGroup}`; break;
                            case 'form2': endpoint = `/forms/agreement/${selectedGroup}`; break;
                            case 'byelaws': endpoint = `/forms/byelaws/${selectedGroup}`; break;
                            case 'security': endpoint = `/forms/security-deposit/${selectedGroup}`; break;
                            case 'form5': endpoint = `/forms/form-v/${selectedGroup}`; break;
                            case 'form6': endpoint = `/forms/form-vi/${selectedGroup}`; break;
                            case 'form7': endpoint = `/forms/form-vii/${selectedGroup}`; break;
                            case 'balance': endpoint = `/forms/balancesheet`; break;
                            default: break;
                        }
                        downloadPdf(endpoint, `${record.name.split(' ')[0]}_${selectedGroup}.pdf`);
                    }}
                    disabled={!selectedGroup}
                >
                    PDF
                </Button>
            )
        }
    ];

    const auctionColumns = [
        {
            title: 'Inst #',
            dataIndex: 'installmentNumber',
            key: 'installmentNumber',
        },
        {
            title: 'Auction Date',
            dataIndex: 'auctionDate',
            key: 'auctionDate',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Status',
            dataIndex: 'auctionStatus',
            key: 'auctionStatus',
            render: (status) => <Tag color={status === 'Closed' ? 'green' : 'gold'}>{status}</Tag>
        },
        {
            title: 'Minutes (Form VIII)',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="default"
                    icon={<Download size={16} />}
                    size="small"
                    disabled={record.auctionStatus !== 'Closed'}
                    onClick={() => downloadPdf(`/forms/minutes/${record.id}`, `Form_VIII_Auction_${record.installmentNumber}.pdf`)}
                >
                    Download PDF
                </Button>
            )
        }
    ];

    return (
        <div className="p-6">
            <Row gutter={[16, 16]} align="middle" className="mb-6">
                <Col flex="auto">
                    <Title level={2}>Statutory Forms Repository</Title>
                    <Text type="secondary">Centralized access to all regulatory forms required under the Chit Funds Act, 1982.</Text>
                </Col>
                <Col>
                    <Space>
                        <Select
                            style={{ width: 250 }}
                            placeholder="Select Chit Group"
                            value={selectedGroup}
                            onChange={(val) => setSelectedGroup(val)}
                        >
                            {Array.isArray(chitGroups) && chitGroups.map(g => (
                                <Option key={g.id} value={g.id}>{g.groupName}</Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            ghost
                            icon={<FileArchive size={18} />}
                            disabled={!selectedGroup}
                            onClick={() => downloadPdf(`/forms/statutory/${selectedGroup}`, `Statutory_Forms_${selectedGroup}.zip`)}
                        >
                            Download All (ZIP)
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={16}>
                    <Card title={<Space><FileText size={20} /><span>Group Statutory Forms</span></Space>}>
                        <Table
                            columns={columns}
                            dataSource={formsList}
                            pagination={false}
                            size="middle"
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title={<Space><Building2 size={20} /><span>Auction Minutes (Form VIII)</span></Space>}>
                        <Table
                            columns={auctionColumns}
                            dataSource={auctions}
                            pagination={{ pageSize: 5 }}
                            size="small"
                            loading={loading}
                        />
                    </Card>

                    <Card className="mt-4" title={<Space><UserIcon size={20} /><span>Member Specific Forms</span></Space>}>
                        <Text type="secondary" block className="mb-4">Individual member forms can be downloaded from the Member Directory.</Text>
                        <ul className="list-disc pl-5 text-sm space-y-2">
                            <li>Subscriber Agreement (Section 6)</li>
                            <li>KYC Verification Form</li>
                            <li>Payment Receipts</li>
                            <li>Demand Notices</li>
                        </ul>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StatutoryForms;
