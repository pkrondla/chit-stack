import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuthStore from '../store/useAuthStore';

const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        const res = await login(values.username, values.password);
        setLoading(false);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-sm shadow-xl rounded-xl border-0">
                <div className="text-center mb-8">
                    <Title level={3} className="m-0 text-slate-800">ChitLedger</Title>
                    <Text type="secondary">Sign in to your account</Text>
                </div>

                {error && <Alert message={error} type="error" showIcon className="mb-6" />}

                <Form
                    name="login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please input your Username!' }]}
                    >
                        <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item className="mt-8 mb-2">
                        <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                            Log in
                        </Button>
                    </Form.Item>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        Demo: admin / admin123
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
