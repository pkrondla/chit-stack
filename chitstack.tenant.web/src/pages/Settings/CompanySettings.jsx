import { useEffect } from 'react';
import { Form, Input, InputNumber, Button, Typography, Card, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const fetchSettings = () => api.get('/settings').then(r => r.data);
const upsertSettings = (data) => api.put('/settings', data).then(r => r.data);

const CompanySettings = () => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: settings } = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: fetchSettings,
    });

    useEffect(() => {
        if (settings) {
            form.setFieldsValue(settings);
        }
    }, [settings, form]);

    const mutation = useMutation({
        mutationFn: upsertSettings,
        onSuccess: () => {
            message.success('Company settings saved successfully!');
            queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
        },
        onError: (err) => {
            message.error(err.response?.data?.errors?.[0] || 'Failed to save settings.');
        },
    });

    const onFinish = (values) => {
        const fullData = { ...settings, ...values };
        mutation.mutate(fullData);
    };

    return (
        <div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Card className="mb-6 rounded-xl shadow-sm border-slate-100">
                    <Title level={5} className="!mb-5 text-slate-700">Company Identity</Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                        <Form.Item name="companyName" label="Company / Foreman Name (Legal Name)" rules={[{ required: true }]}>
                            <Input placeholder="e.g., ABC Chit Fund Pvt Ltd" />
                        </Form.Item>
                        <Form.Item name="registrationNumber" label="ROC Registration Number">
                            <Input placeholder="e.g., U67200TN2020PTC000000" />
                        </Form.Item>
                        <Form.Item name="registeredOfficeAddress" label="Registered Office Address" rules={[{ required: true }]} className="md:col-span-2">
                            <Input.TextArea rows={3} placeholder="Full address as on incorporation documents" />
                        </Form.Item>
                        <Form.Item name="gstNumber" label="GST Number">
                            <Input placeholder="e.g., 33AAAAA0000A1Z5" />
                        </Form.Item>
                        <Form.Item name="panNumber" label="PAN Number">
                            <Input placeholder="e.g., AAAAA0000A" />
                        </Form.Item>
                    </div>
                </Card>

                <Card className="mb-6 rounded-xl shadow-sm border-slate-100">
                    <Title level={5} className="!mb-5 text-slate-700">Authorized Signatory / Foreman</Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                        <Form.Item name="foremanName" label="Full Name of Foreman / Authorized Signatory" rules={[{ required: true }]}>
                            <Input placeholder="e.g., Mr. Arjun Krishnamurthy" />
                        </Form.Item>
                        <Form.Item name="foremanDesignation" label="Designation">
                            <Input placeholder="e.g., Managing Director, Authorized Signatory" />
                        </Form.Item>
                        <Form.Item name="phoneNumber" label="Contact Phone Number">
                            <Input placeholder="e.g., +91 98765 43210" />
                        </Form.Item>
                        <Form.Item name="email" label="Email Address">
                            <Input placeholder="e.g., admin@abcchitfund.com" />
                        </Form.Item>
                    </div>
                </Card>

                <Card className="mb-6 rounded-xl shadow-sm border-slate-100">
                    <Title level={5} className="!mb-5 text-slate-700">Statutory Filing & Penalties</Title>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5">
                        <Form.Item name="statutoryFilingFees" label="Default Filing Fees paid to Registrar">
                            <InputNumber
                                min={0}
                                prefix="₹"
                                className="w-full"
                                placeholder="e.g., 500"
                            />
                        </Form.Item>
                        <Form.Item name="defaultLateFeePercent" label="Default Late Fee (%)">
                            <InputNumber
                                min={0}
                                max={100}
                                addonAfter="%"
                                className="w-full"
                                placeholder="e.g., 2"
                            />
                        </Form.Item>
                        <Form.Item name="defaultGracePeriodDays" label="Grace Period (Days)">
                            <InputNumber
                                min={0}
                                addonAfter="Days"
                                className="w-full"
                                placeholder="e.g., 5"
                            />
                        </Form.Item>
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<Save size={16} />}
                        loading={mutation.isPending}
                        className="bg-slate-900 font-semibold shadow-md"
                    >
                        Save Company Profile
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CompanySettings;
