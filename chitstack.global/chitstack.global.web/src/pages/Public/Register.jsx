import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Steps, Form, Input, Select, Button, Card, Typography, Alert,
    Result, Space
} from 'antd';
import { Building2, User, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const STATES = [
    'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana',
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh',
    'Delhi', 'West Bengal', 'Bihar', 'Odisha', 'Punjab', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Goa'
];

export default function Register() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const steps = [
        { title: 'Company', icon: <Building2 size={16} /> },
        { title: 'Contact', icon: <User size={16} /> },
        { title: 'Done', icon: <CheckCircle size={16} /> },
    ];

    const handleNext = async () => {
        try {
            await form.validateFields();
            if (currentStep === 1) {
                await handleSubmit();
            } else {
                setCurrentStep(s => s + 1);
            }
        } catch {
            // validation error shown inline
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const values = form.getFieldsValue(true);
            const res = await api.post('/Registration', {
                companyName: values.companyName,
                state: values.state,
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone,
                adminFullName: values.adminFullName,
                password: values.password,
                affiliateCode: values.affiliateCode || undefined,
            });
            setResult(res.data.data);
            setCurrentStep(2);
        } catch (err) {
            setError(err.response?.data?.errors?.[0] || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                        CS
                    </div>
                    <Title level={2} className="m-0 text-white">Start Your Free Trial</Title>
                    <Text className="text-slate-400">30 days free — no credit card required</Text>
                </div>

                <Card className="shadow-2xl rounded-2xl border-0">
                    <Steps
                        current={currentStep}
                        items={steps}
                        className="mb-8"
                        size="small"
                    />

                    {error && <Alert message={error} type="error" showIcon className="mb-4" />}

                    <Form form={form} layout="vertical" size="large">
                        {/* Step 0 — Company Details */}
                        {currentStep === 0 && (
                            <>
                                <Form.Item
                                    name="companyName"
                                    label="Company / Organisation Name"
                                    rules={[{ required: true, message: 'Company name is required' }]}
                                >
                                    <Input placeholder="e.g. Lakshmi Chit Funds Pvt Ltd" />
                                </Form.Item>
                                <Form.Item
                                    name="state"
                                    label="State"
                                    initialValue="Karnataka"
                                    rules={[{ required: true }]}
                                >
                                    <Select placeholder="Select your state">
                                        {STATES.map(s => <Option key={s} value={s}>{s}</Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name="affiliateCode"
                                    label="Affiliate / Referral Code (optional)"
                                    extra="If a hardware vendor referred you, enter their code here."
                                >
                                    <Input placeholder="e.g. LAK-1234" />
                                </Form.Item>
                            </>
                        )}

                        {/* Step 1 — Contact / Admin User */}
                        {currentStep === 1 && (
                            <>
                                <Form.Item
                                    name="adminFullName"
                                    label="Your Full Name"
                                    rules={[{ required: true, message: 'Full name is required' }]}
                                >
                                    <Input placeholder="e.g. Rajesh Kumar" />
                                </Form.Item>
                                <Form.Item
                                    name="contactEmail"
                                    label="Email Address"
                                    rules={[
                                        { required: true, message: 'Email is required' },
                                        { type: 'email', message: 'Enter a valid email' }
                                    ]}
                                >
                                    <Input placeholder="your@email.com" />
                                </Form.Item>
                                <Form.Item
                                    name="contactPhone"
                                    label="Phone Number"
                                    rules={[{ required: true, message: 'Phone is required' }]}
                                >
                                    <Input placeholder="9876543210" />
                                </Form.Item>
                                <Form.Item
                                    name="password"
                                    label="Create a Password"
                                    rules={[
                                        { required: true, message: 'Password is required' },
                                        { min: 6, message: 'At least 6 characters' }
                                    ]}
                                >
                                    <Input.Password placeholder="Min. 6 characters" />
                                </Form.Item>
                                <Form.Item
                                    name="confirmPassword"
                                    label="Confirm Password"
                                    dependencies={['password']}
                                    rules={[
                                        { required: true },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value)
                                                    return Promise.resolve();
                                                return Promise.reject('Passwords do not match');
                                            }
                                        })
                                    ]}
                                >
                                    <Input.Password placeholder="Re-enter password" />
                                </Form.Item>
                            </>
                        )}

                        {/* Step 2 — Success */}
                        {currentStep === 2 && result && (
                            <Result
                                status="success"
                                title="You're registered!"
                                subTitle={`Your 30-day free trial started. Trial ends on ${new Date(result.trialEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
                                extra={[
                                    <div key="info" className="text-left bg-slate-50 rounded-xl p-4 mb-4 text-sm">
                                        <p className="font-semibold mb-2">Demo Access Details</p>
                                        <p><span className="text-slate-500">Portal:</span>{' '}
                                            <a href={result.demoPortalUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-medium">
                                                {result.demoPortalUrl}
                                            </a>
                                        </p>
                                        <p><span className="text-slate-500">Username:</span> {result.username}</p>
                                        <p className="text-slate-400 text-xs mt-2">
                                            Check your email for full details.
                                        </p>
                                    </div>,
                                    <Button
                                        key="login"
                                        type="primary"
                                        size="large"
                                        icon={<ArrowRight size={16} />}
                                        className="bg-indigo-600 w-full"
                                        href={result.demoPortalUrl}
                                        target="_blank"
                                    >
                                        Go to Demo Portal
                                    </Button>
                                ]}
                            />
                        )}
                    </Form>

                    {currentStep < 2 && (
                        <Space className="w-full justify-between mt-6">
                            {currentStep > 0 ? (
                                <Button onClick={() => setCurrentStep(s => s - 1)}>Back</Button>
                            ) : (
                                <span />
                            )}
                            <Button
                                type="primary"
                                onClick={handleNext}
                                loading={loading}
                                className="bg-indigo-600"
                                icon={<ArrowRight size={16} />}
                            >
                                {currentStep === 1 ? 'Create Trial Account' : 'Next'}
                            </Button>
                        </Space>
                    )}

                    {currentStep === 0 && (
                        <div className="text-center mt-4">
                            <Text type="secondary" className="text-sm">
                                Already registered?{' '}
                                <Button type="link" className="p-0" onClick={() => navigate('/subscribe')}>
                                    Subscribe now
                                </Button>
                            </Text>
                        </div>
                    )}
                </Card>

                <Paragraph className="text-center text-slate-500 text-xs mt-4">
                    By registering you agree to our Terms of Service and Privacy Policy.
                </Paragraph>
            </div>
        </div>
    );
}
