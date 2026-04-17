import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Typography, Button, Form, Input, InputNumber,
    DatePicker, TimePicker, Select, Radio, Divider, message
} from 'antd';
import { BarChart3, CalendarClock, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const DAYS_OF_WEEK = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
];

const WEEK_NUMBERS = [
    { label: '1st', value: 1 },
    { label: '2nd', value: 2 },
    { label: '3rd', value: 3 },
    { label: '4th', value: 4 },
    { label: 'Last', value: 5 },
];

const SectionHeader = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-2 mb-5">
        <span className="text-slate-500">{icon}</span>
        <Title level={5} className="!mb-0 text-slate-700">{title}</Title>
        {subtitle && <Text className="text-slate-400 text-xs ml-1">{subtitle}</Text>}
    </div>
);

const CreateGroup = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [scheduleMode, setScheduleMode] = useState('FixedDay');

    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/ChitGroups', payload);
            return res.data.data || res.data;
        },
    });

    const updateStatutoryMutation = useMutation({
        mutationFn: async ({ id, data }) =>
            api.put(`/ChitGroups/${id}/statutory`, data).then(r => r.data),
    });

    const handleFinish = async (values) => {
        const chitValue = parseFloat(values.chitValue);
        const durationMonths = parseInt(values.durationMonths);
        const installmentAmount = parseFloat(values.installmentAmount);

        if (chitValue !== durationMonths * installmentAmount) {
            message.error(
                `Math check: Chit Value (₹${chitValue.toLocaleString('en-IN')}) must equal ` +
                `Duration × Monthly Due = ₹${(durationMonths * installmentAmount).toLocaleString('en-IN')}.`
            );
            return;
        }

        try {
            const newId = await createMutation.mutateAsync({
                groupName: values.groupName,
                chitValue,
                durationMonths,
                installmentAmount,
                foremanCommissionPercent: parseFloat(values.foremanCommissionPercent),
                lateFeePercent: parseFloat(values.lateFeePercent || 2.0),
                gracePeriodDays: parseInt(values.gracePeriodDays || 5),
                auctionScheduleMode: values.auctionScheduleMode || null,
                auctionDayOfMonth: values.auctionScheduleMode === 'FixedDay'
                    ? (Array.isArray(values.auctionDayOfMonth) ? values.auctionDayOfMonth.sort((a, b) => a - b).join(',') : values.auctionDayOfMonth)
                    : null,
                auctionWeekNumber: null,
                auctionDayOfWeek: null,
                auctionTime: values.auctionTime ? values.auctionTime.format('HH:mm') : null,
            });

            // Save statutory info (optional — only if any field is filled)
            const hasStatutory = [
                values.sanctionNumber, values.registrationNumber,
                values.auctionVenueAddress, values.securityDepositBankName,
            ].some(v => v && v.trim && v.trim() !== '');

            if (hasStatutory && newId) {
                await updateStatutoryMutation.mutateAsync({
                    id: newId,
                    data: {
                        id: newId,
                        sanctionNumber: values.sanctionNumber || null,
                        sanctionDate: values.sanctionDate?.toISOString() || null,
                        registrationNumber: values.registrationNumber || null,
                        registrationDate: values.registrationDate?.toISOString() || null,
                        auctionVenueAddress: values.auctionVenueAddress || null,
                        securityDepositBankName: values.securityDepositBankName || null,
                        securityDepositBankBranch: values.securityDepositBankBranch || null,
                        securityDepositFdrNumber: values.securityDepositFdrNumber || null,
                        securityDepositDate: values.securityDepositDate?.toISOString() || null,
                        filingFees: values.filingFees || 0,
                    }
                });
            }

            message.success('Chit Group Created Successfully!');
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            navigate('/groups');
        } catch (error) {
            message.error('Failed to create group: ' + (error.response?.data?.errors?.[0] || error.message));
        }
    };

    const handleValuesChange = (changedValues, allValues) => {
        const { chitValue, installmentAmount, durationMonths } = allValues;

        if ('chitValue' in changedValues) {
            if (chitValue && durationMonths && durationMonths > 0) {
                form.setFieldsValue({ installmentAmount: Math.round(chitValue / durationMonths) });
            }
        } else if ('installmentAmount' in changedValues) {
            if (installmentAmount && durationMonths) {
                form.setFieldsValue({ chitValue: installmentAmount * durationMonths });
            }
        } else if ('durationMonths' in changedValues) {
            if (installmentAmount && durationMonths) {
                form.setFieldsValue({ chitValue: installmentAmount * durationMonths });
            }
        }

        if ('auctionScheduleMode' in changedValues) {
            setScheduleMode(changedValues.auctionScheduleMode);
        }
    };

    const isSaving = createMutation.isPending || updateStatutoryMutation.isPending;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800">New Chit Group</Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                onValuesChange={handleValuesChange}
                initialValues={{ foremanCommissionPercent: 5, lateFeePercent: 2, gracePeriodDays: 5, durationMonths: 20, auctionScheduleMode: 'FixedDay' }}
            >
                {/* ── 1. Group Details ─────────────────────────────────────── */}
                <Card className="shadow-sm border-0 rounded-xl mb-4" styles={{ body: { padding: '1.75rem 2rem' } }}>
                    <SectionHeader icon={<BarChart3 size={17} />} title="Group Details" />

                    <Form.Item
                        name="groupName"
                        label={<span className="font-medium text-slate-700">Group Name</span>}
                        rules={[{ required: true, message: 'Group name is required' }]}
                    >
                        <Input size="large" placeholder="e.g. Gold Saver — Jan 2026" />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 2 }}>
                            <Form.Item
                                name="chitValue"
                                label={<span className="font-medium text-slate-700">Chit Value (₹)</span>}
                                rules={[{ required: true, message: 'Required' }]}
                                className="!mb-0"
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    formatter={v => v ? new Intl.NumberFormat('en-IN').format(v) : ''}
                                    parser={v => v.replace(/\$\s?|(,*)/g, '')}
                                    placeholder="e.g. 1,00,00,000"
                                    min={0}
                                />
                            </Form.Item>
                        </div>

                        <div style={{ flex: 1 }}>
                            <Form.Item
                                name="installmentAmount"
                                label={<span className="font-medium text-slate-700">Monthly Due (₹)</span>}
                                rules={[{ required: true, message: 'Required' }]}
                                className="!mb-0"
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    formatter={v => v ? new Intl.NumberFormat('en-IN').format(v) : ''}
                                    parser={v => v.replace(/\$\s?|(,*)/g, '')}
                                    placeholder="5,000"
                                    min={0}
                                />
                            </Form.Item>
                        </div>

                        <div style={{ flex: 1 }}>
                            <Form.Item
                                name="durationMonths"
                                label={<span className="font-medium text-slate-700">Duration (Months)</span>}
                                rules={[{ required: true, message: 'Required' }]}
                                className="!mb-0"
                            >
                                <InputNumber size="large" style={{ width: '100%' }} min={1} placeholder="20" />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Form.Item
                            name="foremanCommissionPercent"
                            label={<span className="font-medium text-slate-700">Commission (%)</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber size="large" style={{ width: '100%' }} step={0.1} min={0} max={100} placeholder="5.0" />
                        </Form.Item>

                        <Form.Item
                            name="lateFeePercent"
                            label={<span className="font-medium text-slate-700">Late Fee (% / Month)</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber size="large" style={{ width: '100%' }} step={0.5} min={0} placeholder="2.0" />
                        </Form.Item>

                        <Form.Item
                            name="gracePeriodDays"
                            label={<span className="font-medium text-slate-700">Grace Period (Days)</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber size="large" style={{ width: '100%' }} min={0} placeholder="5" />
                        </Form.Item>
                    </div>
                </Card>

                {/* ── 2. Auction Schedule Preference ───────────────────────── */}
                <Card className="shadow-sm border-0 rounded-xl mb-4" styles={{ body: { padding: '1.75rem 2rem' } }}>
                    <SectionHeader
                        icon={<CalendarClock size={17} />}
                        title="Auction Schedule Preference"
                        subtitle="(used in Auction Scheduler to auto-generate dates)"
                    />

                    <Form.Item
                        name="auctionScheduleMode"
                        label={<span className="font-medium text-slate-700">Schedule Type</span>}
                        hidden
                    >
                        <Radio.Group>
                            <Radio value="FixedDay">Fixed Day of Month</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        name="auctionDayOfMonth"
                        label={<span className="font-medium text-slate-700">Day(s) of Month</span>}
                        help="Select one or more days (e.g., 1, 10, 20). If a day falls on a Sunday or holiday, it shifts to the next workday."
                        rules={[{ required: true, message: 'Please select at least one day' }]}
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Select day(s)"
                            style={{ width: '100%' }}
                            options={Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="auctionTime"
                        label={<span className="font-medium text-slate-700">Auction Time</span>}
                        className="max-w-xs"
                    >
                        <TimePicker size="large" format="hh:mm A" minuteStep={15} className="w-full" />
                    </Form.Item>
                </Card>

                {/* ── 3. Statutory Information ─────────────────────────────── */}
                <Card className="shadow-sm border-0 rounded-xl mb-6" styles={{ body: { padding: '1.75rem 2rem' } }}>
                    <SectionHeader
                        icon={<ShieldCheck size={17} className="text-blue-500" />}
                        title="Statutory Information"
                        subtitle="(optional — auto-fills statutory PDF forms)"
                    />

                    <Divider orientation="left" orientationMargin={0} className="!text-xs !text-slate-500 !mt-0">
                        Form I / Sanction
                    </Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="sanctionNumber" label="Sanction Number">
                            <Input placeholder="e.g., RC/TN/2024/001" />
                        </Form.Item>
                        <Form.Item name="sanctionDate" label="Date of Sanction">
                            <DatePicker className="w-full" format="DD-MM-YYYY" />
                        </Form.Item>
                    </div>

                    <Divider orientation="left" orientationMargin={0} className="!text-xs !text-slate-500">
                        Form II / Registration
                    </Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="registrationNumber" label="Chit Registration Number">
                            <Input placeholder="e.g., RC/REG/TN/2024/001" />
                        </Form.Item>
                        <Form.Item name="registrationDate" label="Date of Registration">
                            <DatePicker className="w-full" format="DD-MM-YYYY" />
                        </Form.Item>
                    </div>

                    <Divider orientation="left" orientationMargin={0} className="!text-xs !text-slate-500">
                        Auction Venue
                    </Divider>
                    <Form.Item name="auctionVenueAddress" label="Auction Venue Address">
                        <Input.TextArea rows={2} placeholder="Full address where monthly auctions are held" />
                    </Form.Item>

                    <Divider orientation="left" orientationMargin={0} className="!text-xs !text-slate-500">
                        Security Deposit
                    </Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="securityDepositBankName" label="Bank Name">
                            <Input placeholder="e.g., State Bank of India" />
                        </Form.Item>
                        <Form.Item name="securityDepositBankBranch" label="Bank Branch">
                            <Input placeholder="e.g., Anna Nagar, Chennai" />
                        </Form.Item>
                        <Form.Item name="securityDepositFdrNumber" label="FDR / Account Number">
                            <Input placeholder="e.g., FDR000123456" />
                        </Form.Item>
                        <Form.Item name="securityDepositDate" label="Date of Deposit">
                            <DatePicker className="w-full" format="DD-MM-YYYY" />
                        </Form.Item>
                    </div>

                    <Divider orientation="left" orientationMargin={0} className="!text-xs !text-slate-500">
                        Filing Fees
                    </Divider>
                    <Form.Item name="filingFees" label="Filing Fees Paid to Registrar (₹)" className="max-w-xs">
                        <InputNumber min={0} prefix="₹" className="w-full" />
                    </Form.Item>
                </Card>

                {/* ── Actions ──────────────────────────────────────────────── */}
                <div className="flex justify-end gap-3">
                    <Button size="large" onClick={() => navigate('/groups')}>Cancel</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        className="bg-slate-900 font-bold px-8 shadow-sm"
                        loading={isSaving}
                    >
                        Create Group
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CreateGroup;
