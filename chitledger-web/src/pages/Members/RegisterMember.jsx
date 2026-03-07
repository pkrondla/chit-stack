import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Form, Input, Divider, message, Upload } from 'antd';
import { UserPlus, ShieldCheck, Upload as UploadIcon } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const RegisterMember = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const registerMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Members', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data.data || res.data;
        },
        onSuccess: () => {
            message.success('Member Registered Successfully!');
            queryClient.invalidateQueries({ queryKey: ['members'] });
            navigate('/members');
        },
        onError: (error) => {
            message.error('Failed to register member: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleFinish = (values) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                if (key === 'panDocument' || key === 'aadhaarDocument') {
                    if (values[key]?.file?.originFileObj) {
                        formData.append(key, values[key].file.originFileObj);
                    } else if (values[key]?.fileList?.[0]?.originFileObj) {
                        formData.append(key, values[key].fileList[0].originFileObj);
                    }
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        registerMutation.mutate(formData);
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Title level={2} className="!mb-8 text-slate-800 flex items-center gap-2">
                <UserPlus size={28} className="text-slate-600" /> Register New Subscriber
            </Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                className="space-y-8"
            >
                <Card className="shadow-sm border-0 rounded-xl" styles={{ body: { padding: '2rem' } }}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                        <UserPlus size={18} className="text-slate-500" />
                        <Title level={4} className="!mb-0 text-slate-700">Basic Information</Title>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Form.Item
                            name="fullName"
                            label={<span className="font-semibold text-slate-700">Full Name</span>}
                            rules={[{ required: true, message: 'Full name is required' }]}
                        >
                            <Input size="large" placeholder="John Doe" />
                        </Form.Item>

                        <Form.Item
                            name="userId"
                            label={<span className="font-semibold text-slate-700">Linked User ID (Optional)</span>}
                            help={<Text className="text-xs text-slate-500">Provide UUID if linking to an existing system login.</Text>}
                        >
                            <Input size="large" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <Form.Item
                            name="phoneNumber"
                            label={<span className="font-semibold text-slate-700">Phone Number</span>}
                            rules={[{ required: true, message: 'Phone number is required' }]}
                        >
                            <Input size="large" placeholder="+91 98765 43210" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<span className="font-semibold text-slate-700">Email Address (Optional)</span>}
                            rules={[{ type: 'email', message: 'Enter a valid email' }]}
                        >
                            <Input size="large" placeholder="john.doe@example.com" />
                        </Form.Item>
                    </div>
                </Card>

                <Card className="shadow-sm border-0 rounded-xl" styles={{ body: { padding: '2rem' } }}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                        <ShieldCheck size={18} className="text-slate-500" />
                        <Title level={4} className="!mb-0 text-slate-700">KYC & Address</Title>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Form.Item
                            name="aadhaarNumber"
                            label={<span className="font-semibold text-slate-700">Aadhaar Number</span>}
                            rules={[{ len: 12, message: 'Aadhaar must be 12 digits' }]}
                        >
                            <Input size="large" placeholder="1234 5678 9012" maxLength={12} />
                        </Form.Item>

                        <Form.Item
                            name="panNumber"
                            label={<span className="font-semibold text-slate-700">PAN Number</span>}
                            rules={[
                                { len: 10, message: 'PAN must be 10 characters' },
                                { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' }
                            ]}
                            normalize={value => (value || '').toUpperCase()}
                        >
                            <Input size="large" placeholder="ABCDE1234F" maxLength={10} />
                        </Form.Item>

                        <Form.Item
                            name="aadhaarDocument"
                            label={<span className="font-semibold text-slate-700">Aadhaar Scanned Copy</span>}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept="image/*,.pdf">
                                <Button icon={<UploadIcon size={16} />}>Select File</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item
                            name="panDocument"
                            label={<span className="font-semibold text-slate-700">PAN Scanned Copy</span>}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept="image/*,.pdf">
                                <Button icon={<UploadIcon size={16} />}>Select File</Button>
                            </Upload>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="address"
                        label={<span className="font-semibold text-slate-700">Residential Address</span>}
                        rules={[{ required: true, message: 'Address is required' }]}
                        className="mt-2"
                    >
                        <Input.TextArea size="large" rows={4} placeholder="Full street address, city, state, pin code" />
                    </Form.Item>
                </Card>

                <div className="flex justify-end gap-4 mt-8">
                    <Button size="large" onClick={() => navigate('/members')} className="font-semibold px-8 h-12">
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        className="bg-slate-900 font-bold px-10 h-12 shadow-md text-lg"
                        loading={registerMutation.isPending}
                    >
                        Register Subscriber
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default RegisterMember;
