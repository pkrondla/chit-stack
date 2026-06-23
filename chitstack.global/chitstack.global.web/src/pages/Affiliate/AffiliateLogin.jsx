import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';
import useAffiliateAuthStore from '../../store/useAffiliateAuthStore';

const { Title, Text } = Typography;

export default function AffiliateLogin() {
    const navigate = useNavigate();
    const { login, loading, affiliate } = useAffiliateAuthStore();
    const [error, setError] = useState('');

    useEffect(() => {
        if (affiliate) navigate('/affiliate/dashboard');
    }, [affiliate, navigate]);

    const onFinish = async (values) => {
        setError('');
        const result = await login(values.email, values.password);
        if (result.success) {
            navigate('/affiliate/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8fafc' }}>
            <Card className="w-full max-w-md shadow-lg border-0">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-3">
                        <Handshake size={28} className="text-indigo-600" />
                    </div>
                    <Title level={3} className="m-0">Affiliate Portal</Title>
                    <Text type="secondary">Sign in to track your commissions</Text>
                </div>

                {error && <Alert message={error} type="error" showIcon className="mb-4" />}

                <Form layout="vertical" onFinish={onFinish} size="large">
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input placeholder="you@example.com" />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password placeholder="••••••••" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block className="bg-indigo-600 h-11">
                        Sign In
                    </Button>
                </Form>

                <Divider />
                <div className="text-center text-sm text-slate-500">
                    Not yet an affiliate?{' '}
                    <Link to="/affiliate/register" className="text-indigo-600 font-medium">Register here</Link>
                </div>
            </Card>
        </div>
    );
}
