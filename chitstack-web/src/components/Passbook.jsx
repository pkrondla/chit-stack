import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Space,
  Row,
  Col,
} from "antd";
import {
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const Passbook = ({ ticketId }) => {
  const {
    data: passbook,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["passbook", ticketId],
    queryFn: async () => {
      const res = await api.get(`/Reporting/passbook/${ticketId}`);
      return res.data.data || res.data;
    },
    enabled: !!ticketId,
  });

  if (isLoading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
    
  if (error)
    return <Alert type="error" message="Failed to load passbook" showIcon />;
    
  if (!passbook)
    return <Alert type="info" message="No passbook data available" showIcon />;

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1e293b' }}>{text}</Text>
          {record.reference && (
            <Text type="secondary" style={{ fontSize: '11px' }}>{record.reference}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Debit (Dues)",
      key: "debit",
      align: "right",
      render: (_, record) =>
        record.installmentAmount > 0 ? (
          <Space direction="vertical" size={0} align="end">
            <Text strong style={{ color: '#e11d48' }}>
              {(
                record.installmentAmount -
                record.dividend +
                record.penalty
              ).toLocaleString("en-IN")}
            </Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {record.installmentAmount.toLocaleString()} - {record.dividend.toLocaleString()} + {record.penalty.toLocaleString()}
            </Text>
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Credit (Paid)",
      dataIndex: "credit",
      key: "credit",
      align: "right",
      render: (val, record) =>
        val > 0 ? (
          <Space direction="vertical" size={0} align="end">
            <Text strong style={{ color: '#059669' }}>
              {val.toLocaleString("en-IN")}
            </Text>
            {record.status === "Pending" && (
              <Tag color="orange" style={{ margin: 0, marginTop: '4px', fontSize: '10px', borderRadius: '4px' }}>
                Pending Verification
              </Tag>
            )}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      render: (val) => (
        <Text strong style={{ color: val > 0 ? '#e11d48' : '#059669' }}>
          {val.toLocaleString("en-IN")}
        </Text>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', overflow: 'hidden' }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ background: '#0f172a', padding: '40px', color: 'white' }}>
        <Row justify="space-between" align="top" style={{ marginBottom: '32px' }}>
          <Col>
            <Space size={16} align="center">
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px', color: '#60a5fa' }}>
                <FileText size={24} />
              </div>
              <Space direction="vertical" size={0}>
                <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 900 }}>{passbook.groupName}</Title>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Ticket #{passbook.ticketNumber} • {passbook.memberName}</Text>
              </Space>
            </Space>
          </Col>
          <Col style={{ textAlign: 'right' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
              Total Outstanding
            </Text>
            <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 900, fontSize: '36px' }}>
              ₹{passbook.totalDue.toLocaleString()}
            </Title>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: 'Chit Value', value: `₹${passbook.chitValue.toLocaleString()}`, color: 'white' },
            { label: 'Duration', value: `${passbook.duration} Months`, color: 'white' },
            { label: 'Total Paid', value: `₹${passbook.totalPaid.toLocaleString()}`, color: '#4ade80' },
            { label: 'Advance Balance', value: `₹${passbook.advanceBalance.toLocaleString()}`, color: '#60a5fa' },
          ].map((item, idx) => (
            <Col xs={12} md={6} key={idx}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                {item.label}
              </Text>
              <Text strong style={{ color: item.color, fontSize: '16px' }}>{item.value}</Text>
            </Col>
          ))}
        </Row>
      </div>

      <Table
        dataSource={passbook.entries}
        columns={columns}
        rowKey={(record, index) => `${record.date}-${index}`}
        pagination={false}
        scroll={{ x: 800 }}
        style={{ borderTop: '1px solid #f1f5f9' }}
      />

      <div style={{ padding: '24px 40px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <Space size={24}>
          <Space size={8}>
            <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
            <Text style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CONFIRMED</Text>
          </Space>
          <Space size={8} style={{ background: '#fffbeb', padding: '4px 12px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <Clock size={16} style={{ color: '#f59e0b' }} />
            <Text style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>OFFICE VERIFICATION PENDING</Text>
          </Space>
        </Space>
        <Text style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
          Generated: {dayjs().format("DD MMM YYYY, HH:mm")}
        </Text>
      </div>
    </Card>
  );
};

export default Passbook;
