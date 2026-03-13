import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Typography, Button, Form, Input, InputNumber,
    Spin, message, Alert, DatePicker, TimePicker, Select, Radio, Divider
} from 'antd';
import { ArrowLeft, BarChart3, CalendarClock, ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';
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

const EditGroup = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [scheduleMode, setScheduleMode] = useState('FixedDay');

    const { data: group, isLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => {
            const res = await api.get('/ChitGroups');
            const allGroups = res.data.data || [];
            return allGroups.find(g => g.id.toString() === id);
        },
        enabled: !!id
    });

    const isRunning = group?.status !== 'Proposed';

    useEffect(() => {
        if (group) {
            const mode = group.auctionScheduleMode || 'FixedDay';
            setScheduleMode(mode);
            form.setFieldsValue({
                // Core
                groupName: group.groupName,
                chitValue: group.chitValue,
                durationMonths: group.durationMonths,
                installmentAmount: group.installmentAmount || (group.chitValue / group.durationMonths),
                commissionPercentage: group.foremanCommissionPercent || 5,
                // Schedule
                auctionScheduleMode: mode,
                auctionDayOfMonth: group.auctionDayOfMonth,
                auctionWeekNumber: group.auctionWeekNumber,
                auctionDayOfWeek: group.auctionDayOfWeek,
                auctionTime: group.auctionTime ? dayjs(group.auctionTime, 'HH:mm') : null,
                // Statutory
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
    }, [group, form]);

    const handleValuesChange = (changedValues, allValues) => {
        if (isRunning) return;

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

    const updateMutation = useMutation({
        mutationFn: (payload) => api.put(`/ChitGroups/${id}`, { id: parseInt(id), ...payload }).then(r => r.data),
    });

    const updateStatutoryMutation = useMutation({
        mutationFn: (payload) => api.put(`/ChitGroups/${id}/statutory`, payload).then(r => r.data),
    });

    const handleFinish = async (values) => {
        try {
            await updateMutation.mutateAsync({
                groupName: values.groupName,
                chitValue: isRunning ? group.chitValue : parseFloat(values.chitValue),
                durationMonths: isRunning ? group.durationMonths : parseInt(values.durationMonths),
                installmentAmount: isRunning ? group.installmentAmount : parseFloat(values.installmentAmount),
                foremanCommissionPercent: parseFloat(values.commissionPercentage),
                auctionScheduleMode: values.auctionScheduleMode || null,
                auctionDayOfMonth: values.auctionScheduleMode === 'FixedDay' ? values.auctionDayOfMonth : null,
                auctionWeekNumber: values.auctionScheduleMode === 'SameWeekday' ? values.auctionWeekNumber : null,
                auctionDayOfWeek: values.auctionScheduleMode === 'SameWeekday' ? values.auctionDayOfWeek : null,
                auctionTime: values.auctionTime ? values.auctionTime.format('HH:mm') : null,
            });

            await updateStatutoryMutation.mutateAsync({
                id: parseInt(id),
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
            });

            message.success('Chit Group Updated!');
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            navigate('/groups');
        } catch (error) {
            message.error('Failed to update: ' + (error.response?.data?.errors?.[0] || error.message));
        }
    };

    const isSaving = updateMutation.isPending || updateStatutoryMutation.isPending;

    if (isLoading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (!group) return <div className="text-center p-12 text-slate-500">Group not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Button
                type="text"
                icon={<ArrowLeft size={16} />}
                onClick={() => navigate('/groups')}
                className="mb-6 font-semibold text-slate-500 hover:text-slate-800"
            >
                Back to Groups
            </Button>

            <Title level={2} className="!mb-6 text-slate-800">Edit Chit Group</Title>

            {isRunning && (
                <Alert
                    message="Group is Active — some fields are locked"
                    description="Chit Value and Duration cannot be changed after launch to keep auction maths consistent."
                    type="warning"
                    showIcon
                    className="mb-5"
                />
            )}

            <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={handleValuesChange}>

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
                                label={
                                    <span className="font-medium text-slate-700 flex items-center gap-2">
                                        Chit Value (₹)
                                        {isRunning && <Text type="secondary" className="text-xs font-normal">Locked</Text>}
                                    </span>
                                }
                                rules={[{ required: true, message: 'Required' }]}
                                className="!mb-0"
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    disabled={isRunning}
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
                                label={
                                    <span className="font-medium text-slate-700 flex items-center gap-2">
                                        Monthly Due (₹)
                                        {isRunning && <Text type="secondary" className="text-xs font-normal">Locked</Text>}
                                    </span>
                                }
                                rules={[{ required: true, message: 'Required' }]}
                                className="!mb-0"
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    disabled={isRunning}
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
                                label={
                                    <span className="font-medium text-slate-700 flex items-center gap-2">
                                        Duration (Months)
                                        {isRunning && <Text type="secondary" className="text-xs font-normal">Locked</Text>}
                                    </span>
                                }
                                rules={[{ required: true, message: 'Required' }]}
                                className="!mb-0"
                            >
                                <InputNumber size="large" style={{ width: '100%' }} disabled={isRunning} min={1} placeholder="20" />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        name="commissionPercentage"
                        label={<span className="font-medium text-slate-700">Commission (%)</span>}
                        rules={[{ required: true, message: 'Required' }]}
                        className="max-w-xs mt-4"
                    >
                        <InputNumber size="large" style={{ width: '100%' }} step={0.1} min={0} max={100} placeholder="5.0" />
                    </Form.Item>
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
                    >
                        <Radio.Group onChange={e => setScheduleMode(e.target.value)}>
                            <Radio value="FixedDay">Fixed Day of Month (e.g. every 15th)</Radio>
                            <Radio value="SameWeekday">Same Weekday (e.g. every 3rd Saturday)</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {scheduleMode === 'FixedDay' ? (
                        <Form.Item
                            name="auctionDayOfMonth"
                            label={<span className="font-medium text-slate-700">Day of Month</span>}
                            help="If it falls on a Sunday or holiday, it shifts to the next workday."
                            className="max-w-xs"
                        >
                            <InputNumber min={1} max={28} placeholder="e.g. 15" size="large" className="w-full" />
                        </Form.Item>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            <Form.Item
                                name="auctionWeekNumber"
                                label={<span className="font-medium text-slate-700">Which Week</span>}
                            >
                                <Select size="large" placeholder="Select week" options={WEEK_NUMBERS} />
                            </Form.Item>
                            <Form.Item
                                name="auctionDayOfWeek"
                                label={<span className="font-medium text-slate-700">Day of Week</span>}
                            >
                                <Select size="large" placeholder="Select day" options={DAYS_OF_WEEK} />
                            </Form.Item>
                        </div>
                    )}

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
                        subtitle="(auto-fills statutory PDF forms)"
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
                        Save Changes
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditGroup;
