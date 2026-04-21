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
import { semanticColors } from "../theme/tokens";

const { Title, Text } = Typography;
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

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
          <Text strong style={{ color: semanticColors.textStrong }}>{text}</Text>
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
            <Text strong style={{ color: semanticColors.danger }}>
              {formatCurrency(
                record.installmentAmount - record.dividend + record.penalty
              )}
            </Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {formatCurrency(record.installmentAmount)} - {formatCurrency(record.dividend)} + {formatCurrency(record.penalty)}
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
            <Text strong style={{ color: semanticColors.success }}>
              {formatCurrency(val)}
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
        <Text strong style={{ color: val > 0 ? semanticColors.warning : semanticColors.success }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: '28px', boxShadow: '0 6px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ background: semanticColors.navBg, padding: '36px', color: 'white' }}>
        <Row justify="space-between" align="top" style={{ marginBottom: '32px' }}>
          <Col>
            <Space size={16} align="center">
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '14px', color: semanticColors.infoAccent }}>
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
              ₹{formatCurrency(passbook.totalDue)}
            </Title>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: 'Chit Value', value: `₹${formatCurrency(passbook.chitValue)}`, color: 'white' },
            { label: 'Duration', value: `${passbook.duration} Months`, color: 'white' },
            { label: 'Total Paid', value: `₹${formatCurrency(passbook.totalPaid)}`, color: semanticColors.successAccent },
            { label: 'Advance Balance', value: `₹${formatCurrency(passbook.advanceBalance)}`, color: semanticColors.infoAccent },
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
        style={{ borderTop: `1px solid ${semanticColors.borderSoft}` }}
      />

      <div style={{ padding: '22px 32px', background: semanticColors.appBg, borderTop: `1px solid ${semanticColors.borderSoft}`, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <Space size={24}>
          <Space size={8}>
            <CheckCircle2 size={16} style={{ color: semanticColors.success }} />
            <Text style={{ fontSize: '11px', color: semanticColors.textSecondary, fontWeight: 600 }}>CONFIRMED</Text>
          </Space>
          <Space size={8} style={{ background: semanticColors.warningSoftBg, padding: '4px 12px', borderRadius: '8px', border: `1px solid ${semanticColors.warningBorder}` }}>
            <Clock size={16} style={{ color: semanticColors.amber }} />
            <Text style={{ fontSize: '11px', color: semanticColors.warningStrong, fontWeight: 600 }}>OFFICE VERIFICATION PENDING</Text>
          </Space>
        </Space>
        <Text style={{ fontSize: '11px', color: semanticColors.textMuted, fontStyle: 'italic' }}>
          Generated: {dayjs().format("DD MMM YYYY, HH:mm")}
        </Text>
      </div>
    </Card>
  );
};

export default Passbook;
