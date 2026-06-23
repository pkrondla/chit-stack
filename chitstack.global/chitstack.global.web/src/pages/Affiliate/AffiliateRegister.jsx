import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Result, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

export default function AffiliateRegister() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/Affiliates/register', {
                name: values.name,
                email: values.email,
                phone: values.phone,
                companyName: values.companyName,
                password: values.password
            });
            if (res.data.succeeded) {
                setSuccess(res.data.data);
            } else {
                setError(res.data.errors?.[0] || 'Registration failed.');
            }
        } catch (err) {
            setError(err.response?.data?.errors?.[0] || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8fafc' }}>
                <Card className="w-full max-w-md shadow-lg border-0">
                    <Result
                        status="success"
                        title="Registration Successful!"
                        subTitle={
                            <div className="text-center">
                                <p>Your affiliate application has been received.</p>
                                <p className="mt-2">
                                    Your affiliate code: <strong className="text-indigo-600 text-lg">{success.code}</strong>
                                </p>
                                <p className="text-slate-500 text-sm mt-2">You will receive an email once your account is approved by our team.</p>
                            </div>
                        }
                        extra={[
                            <Link key="login" to="/affiliate/login">
                                <Button type="primary" className="bg-indigo-600">Go to Login</Button>
                            </Link>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8fafc' }}>
            <Card className="w-full max-w-lg shadow-lg border-0">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-3">
                        <Handshake size={28} className="text-indigo-600" />
                    </div>
                    <Title level={3} className="m-0">Become an Affiliate</Title>
                    <Text type="secondary">Earn commissions by referring new ChitStack customers</Text>
                </div>

                {error && <Alert message={error} type="error" showIcon className="mb-4" />}

                <Form layout="vertical" onFinish={onFinish} size="large">
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                        <Input placeholder="Your full name" />
                    </Form.Item>
                    <Form.Item name="companyName" label="Company / Business Name">
                        <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input placeholder="you@example.com" />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
                        <Input placeholder="+91 XXXXX XXXXX" />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
                        <Input.Password placeholder="At least 6 characters" />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label="Confirm Password"
                        dependencies={['password']}
                        rules={[{ required: true },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                return Promise.reject('Passwords do not match');
                            }
                        })]}>
                        <Input.Password placeholder="Re-enter password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block className="bg-indigo-600 h-11">
                        Submit Application
                    </Button>
                </Form>

                <Divider />
                <div className="text-center text-sm text-slate-500">
                    Already registered? <Link to="/affiliate/login" className="text-indigo-600 font-medium">Sign in</Link>
                </div>
            </Card>
        </div>
    );
}
