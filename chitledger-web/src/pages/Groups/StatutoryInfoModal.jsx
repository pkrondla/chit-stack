import { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Descriptions, Space, Typography, Divider, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Text } = Typography;

const updateStatutoryInfo = ({ groupId, data }) =>
    api.put(`/chitgroups/${groupId}/statutory`, data).then(r => r.data);

const StatutoryInfoModal = ({ group, open, onClose }) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (group && open) {
            form.setFieldsValue({
                id: group.id,
                sanctionNumber: group.sanctionNumber || '',
                sanctionDate: group.sanctionDate ? dayjs(group.sanctionDate) : null,
                registrationNumber: group.registrationNumber || '',
                registrationDate: group.registrationDate ? dayjs(group.registrationDate) : null,
                auctionVenueAddress: group.auctionVenueAddress || '',
                securityDepositBankName: group.securityDepositBankName || '',
                securityDepositBankBranch: group.securityDepositBankBranch || '',
                securityDepositFdrNumber: group.securityDepositFdrNumber || '',
                securityDepositDate: group.securityDepositDate ? dayjs(group.securityDepositDate) : null,
                filingFees: group.filingFees || 0,
            });
        }
    }, [group, open, form]);

    const mutation = useMutation({
        mutationFn: updateStatutoryInfo,
        onSuccess: () => {
            message.success('Statutory info updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            onClose();
        },
        onError: (err) => {
            message.error(err.response?.data?.errors?.[0] || 'Failed to update statutory info.');
        },
    });

    const onFinish = (values) => {
        mutation.mutate({
            groupId: group.id,
            data: {
                id: group.id,
                sanctionNumber: values.sanctionNumber,
                sanctionDate: values.sanctionDate?.toISOString() || null,
                registrationNumber: values.registrationNumber,
                registrationDate: values.registrationDate?.toISOString() || null,
                auctionVenueAddress: values.auctionVenueAddress,
                securityDepositBankName: values.securityDepositBankName,
                securityDepositBankBranch: values.securityDepositBankBranch,
                securityDepositFdrNumber: values.securityDepositFdrNumber,
                securityDepositDate: values.securityDepositDate?.toISOString() || null,
                filingFees: values.filingFees || 0,
            }
        });
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <Space>
                    <ShieldCheck size={18} className="text-blue-600" />
                    <span>Statutory Info — {group?.groupName}</span>
                </Space>
            }
            width={700}
            okText="Save"
            confirmLoading={mutation.isPending}
            onOk={() => form.submit()}
            okButtonProps={{ className: 'bg-slate-900' }}
            destroyOnClose
        >
            <Text className="text-slate-500 block mb-4">
                Update the Registrar-assigned numbers and other statutory details. This data is used to fill the statutory forms automatically.
            </Text>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Divider orientation="left" orientationMargin={0} className="!text-sm !text-slate-600">
                    Form I / Sanction
                </Divider>
                <div className="grid grid-cols-2 gap-x-4">
                    <Form.Item name="sanctionNumber" label="Sanction Number (allotted by Registrar)">
                        <Input placeholder="e.g., RC/TN/2024/001" />
                    </Form.Item>
                    <Form.Item name="sanctionDate" label="Date of Sanction">
                        <DatePicker className="w-full" format="DD-MM-YYYY" />
                    </Form.Item>
                </div>

                <Divider orientation="left" orientationMargin={0} className="!text-sm !text-slate-600">
                    Form II / Registration
                </Divider>
                <div className="grid grid-cols-2 gap-x-4">
                    <Form.Item name="registrationNumber" label="Chit Registration Number">
                        <Input placeholder="e.g., RC/REG/TN/2024/001" />
                    </Form.Item>
                    <Form.Item name="registrationDate" label="Date of Registration">
                        <DatePicker className="w-full" format="DD-MM-YYYY" />
                    </Form.Item>
                </div>

                <Divider orientation="left" orientationMargin={0} className="!text-sm !text-slate-600">
                    Auction Details
                </Divider>
                <Form.Item name="auctionVenueAddress" label="Auction Venue Address">
                    <Input.TextArea rows={2} placeholder="Full address where monthly auctions are held" />
                </Form.Item>

                <Divider orientation="left" orientationMargin={0} className="!text-sm !text-slate-600">
                    Security Deposit
                </Divider>
                <div className="grid grid-cols-2 gap-x-4">
                    <Form.Item name="securityDepositBankName" label="Bank Name">
                        <Input placeholder="e.g., State Bank of India" />
                    </Form.Item>
                    <Form.Item name="securityDepositBankBranch" label="Branch Name">
                        <Input placeholder="e.g., Anna Nagar Branch, Chennai" />
                    </Form.Item>
                    <Form.Item name="securityDepositFdrNumber" label="FDR / Deposit Account Number">
                        <Input placeholder="e.g., FDR000123456" />
                    </Form.Item>
                    <Form.Item name="securityDepositDate" label="Date of Deposit">
                        <DatePicker className="w-full" format="DD-MM-YYYY" />
                    </Form.Item>
                </div>

                <Divider orientation="left" orientationMargin={0} className="!text-sm !text-slate-600">
                    Filing Fees
                </Divider>
                <Form.Item name="filingFees" label="Filing Fees Paid to Registrar (₹)">
                    <InputNumber min={0} prefix="₹" className="w-full" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default StatutoryInfoModal;
