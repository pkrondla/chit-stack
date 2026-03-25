import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Descriptions,
  Divider,
} from "antd";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
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
      <div className="flex justify-center p-12">
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
        <div className="flex flex-col">
          <span className="font-semibold">{text}</span>
          {record.reference && (
            <span className="text-xs text-slate-400">{record.reference}</span>
          )}
        </div>
      ),
    },
    {
      title: "Debit (Dues)",
      key: "debit",
      align: "right",
      render: (_, record) =>
        record.installmentAmount > 0 ? (
          <div className="flex flex-col items-end">
            <span className="text-rose-600 font-medium">
              {(
                record.installmentAmount -
                record.dividend +
                record.penalty
              ).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </span>
            <span className="text-[10px] text-slate-400">
              {record.installmentAmount.toLocaleString()} -{" "}
              {record.dividend.toLocaleString()} +{" "}
              {record.penalty.toLocaleString()}
            </span>
          </div>
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
          <div className="flex flex-col items-end">
            <span className="text-green-600 font-bold">
              {val.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </span>
            {record.status === "Pending" && (
              <Tag color="orange" className="mr-0 mt-1">
                Pending Verification
              </Tag>
            )}
          </div>
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
        <span
          className={`font-bold ${val > 0 ? "text-rose-600" : "text-green-600"}`}
        >
          {val.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
        </span>
      ),
    },
  ];

  return (
    <Card
      className="shadow-lg border-0 rounded-2xl overflow-hidden"
      styles={{ body: { padding: 0 } }}
    >
      <div className="bg-slate-900 p-6 text-white">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <FileText className="text-blue-400" size={24} />
            </div>
            <div>
              <Title level={4} className="!text-white !mb-0">
                {passbook.groupName}
              </Title>
              <Text className="text-slate-400">
                Ticket #{passbook.ticketNumber} • {passbook.memberName}
              </Text>
            </div>
          </div>
          <div className="text-right">
            <Text className="text-slate-400 block text-xs uppercase tracking-wider">
              Total Outstanding
            </Text>
            <Title level={2} className="!text-white !mb-0">
              {passbook.totalDue.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </Title>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div>
            <Text className="text-slate-500 block text-[10px] uppercase">
              Chit Value
            </Text>
            <Text className="text-white font-semibold">
              ₹{passbook.chitValue.toLocaleString()}
            </Text>
          </div>
          <div>
            <Text className="text-slate-500 block text-[10px] uppercase">
              Duration
            </Text>
            <Text className="text-white font-semibold">
              {passbook.duration} Months
            </Text>
          </div>
          <div>
            <Text className="text-slate-500 block text-[10px] uppercase">
              Total Paid
            </Text>
            <Text className="text-green-400 font-semibold">
              ₹{passbook.totalPaid.toLocaleString()}
            </Text>
          </div>
          <div>
            <Text className="text-slate-500 block text-[10px] uppercase">
              Advance Balance
            </Text>
            <Text className="text-blue-400 font-semibold">
              ₹{passbook.advanceBalance.toLocaleString()}
            </Text>
          </div>
        </div>
      </div>

      <Table
        dataSource={passbook.entries}
        columns={columns}
        rowKey={(record, index) => `${record.date}-${index}`}
        pagination={false}
        className="passbook-table"
        rowClassName={(record) =>
          record.status === "Pending" ? "bg-orange-50/30" : ""
        }
      />

      <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-xs text-slate-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" /> Confirmed
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-orange-500" /> Pending Office
            Verification
          </span>
        </div>
        <span>Generated on {dayjs().format("DD MMM YYYY HH:mm")}</span>
      </div>
    </Card>
  );
};

export default Passbook;
