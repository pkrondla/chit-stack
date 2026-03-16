import { useEffect } from 'react';
import { Form, InputNumber, Button, Typography, Card, message, Alert } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Gavel, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const fetchSettings = () => api.get('/settings').then(r => r.data.data || r.data);
const upsertSettings = (data) => api.put('/settings', data).then(r => r.data);

const AuctionSettings = () => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
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
            message.success('Auction settings saved successfully!');
            queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
        },
        onError: (err) => {
            message.error(err.response?.data?.errors?.[0] || 'Failed to save settings.');
        },
    });

    const onFinish = (values) => {
        // Merge with existing settings to avoid overwriting other fields with undefined
        const fullData = { ...settings, ...values };
        mutation.mutate(fullData);
    };

    return (
        <div>
            <Alert
                message="Statutory Compliance"
                description="The following rules are based on the Chit Funds Act, 1982 and state-specific rules (e.g., Tamil Nadu Chit Funds Rules, 1984)."
                type="info"
                showIcon
                icon={<AlertCircle size={18} />}
                className="mb-6 rounded-xl"
            />

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Card className="mb-6 rounded-xl shadow-sm border-slate-100">
                    <div className="flex items-center gap-2 mb-5">
                        <Gavel size={20} className="text-indigo-600" />
                        <Title level={5} className="!mb-0 text-slate-700">Bidding & Auction Rules</Title>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                        <Form.Item
                            name="maxBiddingDiscountPercent"
                            label="Maximum Bidding Discount (%)"
                            extra="In Tamil Nadu, the legal maximum is 40%."
                            rules={[
                                { required: true, message: 'Please specify the maximum discount.' },
                                { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100.' }
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={100}
                                suffix="%"
                                className="w-full"
                                placeholder="e.g., 40"
                            />
                        </Form.Item>
                    </div>

                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <Title level={5} className="text-[13px] !mb-2 uppercase tracking-wider text-slate-500">How it works</Title>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                            <li>The system will prevent any proxy bid or manual entry that exceeds this percentage of the total chit value.</li>
                            <li>For auctions where multiple people bid the maximum, the winner will be determined by lot.</li>
                            <li>Standard industry practice effectively starts bidding at the Foreman's Commission rate (usually 5%).</li>
                        </ul>
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<Save size={16} />}
                        loading={mutation.isPending || isLoading}
                        className="bg-slate-900 font-semibold shadow-md"
                    >
                        Save Auction Settings
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AuctionSettings;
