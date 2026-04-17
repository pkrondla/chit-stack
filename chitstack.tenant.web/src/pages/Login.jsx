import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Tabs, App } from 'antd';
import { User, Lock, Smartphone, ShieldCheck, ArrowRight, Shield, Landmark } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';

const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
    const [otpSent, setOtpSent] = useState(false);
    const [mobile, setMobile] = useState(''); // Store mobile between steps
    const user = useAuthStore(state => state.user);
    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();
    const { message } = App.useApp();

    useEffect(() => {
        if (user) {
            let redirectPath = '/dashboard';
            if (user.role === 'Subscriber') redirectPath = '/portal';
            else if (user.role === 'Agent') redirectPath = '/agent';
            navigate(redirectPath);
        }
    }, [user, navigate]);

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        if (loginMode === 'password') {
            const res = await login(values.username, values.password, 'Password');
            setLoading(false);
            if (res.success) {
                let redirectPath = '/dashboard';
                if (res.user.role === 'Subscriber') redirectPath = '/portal';
                else if (res.user.role === 'Agent') redirectPath = '/agent';
                navigate(redirectPath);
            } else {
                setError(res.message);
            }
        } else {
            const targetMobile = values.mobile || mobile;

            if (!otpSent) {
                try {
                    const res = await api.post('/Auth/send-otp', { mobileNumber: targetMobile });
                    if (res.data.succeeded) {
                        setOtpSent(true);
                        setMobile(targetMobile); // Save for next step
                        message.success('OTP sent to your registered mobile number. (Hint: 123456)');
                    } else {
                        setError(res.data.message || 'Failed to send OTP');
                    }
                } catch (e) {
                    setError('Unable to send OTP. Please check your network or try again later.');
                } finally {
                    setLoading(false);
                }
            } else {
                const res = await login(targetMobile, '', 'OTP', values.otp);
                setLoading(false);
                if (res.success) {
                    let redirectPath = '/dashboard';
                    if (res.user.role === 'Subscriber') redirectPath = '/portal';
                    else if (res.user.role === 'Agent') redirectPath = '/agent';
                    navigate(redirectPath);
                } else {
                    setError(res.message || 'Invalid OTP. Please try again.');
                }
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative" style={{ backgroundColor: 'var(--bg-base)' }}>
            {/* Subtle Brand Accents */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-40"></div>

            <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 mb-6">
                        <Landmark size={32} />
                    </div>
                    <Title level={2} className="!m-0 !font-black tracking-tight text-slate-900">
                        ChitStack
                    </Title>
                    <Text className="text-slate-500 font-medium">Enterprise Chit Fund Management</Text>
                </div>

                <Card className="shadow-2xl shadow-indigo-100/50 rounded-[32px] border-0 overflow-hidden bg-white">
                    <Tabs
                        activeKey={loginMode}
                        centered
                        onChange={v => { setLoginMode(v); setOtpSent(false); setError(''); }}
                        className="login-tabs mb-2"
                        items={[
                            { key: 'password', label: <span className="px-4 font-bold">Standard</span> },
                            { key: 'otp', label: <span className="px-4 font-bold">OTP Login</span> }
                        ]}
                    />

                    <div className="p-8">
                        {error && (
                            <Alert
                                title={error}
                                type="error"
                                showIcon
                                className="mb-6 rounded-2xl font-medium !bg-red-50 !border-red-100"
                            />
                        )}

                        <Form
                            name="login"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                            requiredMark={false}
                        >
                            {loginMode === 'password' ? (
                                <>
                                    <Form.Item
                                        name="username"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input
                                            prefix={<User size={18} className="text-slate-400 mr-2" />}
                                            placeholder="Username or Email"
                                            className="rounded-2xl h-14 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white transition-all px-4"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: 'Required' }]}
                                        className="mb-3"
                                    >
                                        <Input.Password
                                            prefix={<Lock size={18} className="text-slate-400 mr-2" />}
                                            placeholder="Password"
                                            className="rounded-2xl h-14 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white transition-all px-4"
                                        />
                                    </Form.Item>
                                </>
                            ) : (
                                <>
                                    <Form.Item
                                        name="mobile"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input
                                            prefix={<Smartphone size={18} className="text-slate-400 mr-2" />}
                                            placeholder="Mobile Number"
                                            className="rounded-2xl h-14 bg-slate-50 border-0"
                                            disabled={otpSent}
                                        />
                                    </Form.Item>

                                    {otpSent && (
                                        <Form.Item
                                            name="otp"
                                            rules={[{ required: true, message: 'Required' }]}
                                        >
                                            <Input
                                                prefix={<ShieldCheck size={18} className="text-slate-400 mr-2" />}
                                                placeholder="6-digit OTP"
                                                maxLength={6}
                                                className="rounded-2xl h-14 bg-slate-50 border-0 animate-in slide-in-from-top-2 duration-300"
                                            />
                                        </Form.Item>
                                    )}
                                </>
                            )}

                            <div className="flex justify-end mb-8">
                                <Text className="text-indigo-600 font-bold text-xs cursor-pointer hover:underline">
                                    {loginMode === 'password' ? 'Forgot Password?' : otpSent ? 'Resend OTP' : 'Help?'}
                                </Text>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full h-14 bg-indigo-600 hover:!bg-indigo-700 border-0 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                loading={loading}
                            >
                                {loginMode === 'otp' && !otpSent ? 'Get OTP' : 'Sign In'}
                                {!loading && <ArrowRight size={20} />}
                            </Button>
                        </Form>
                    </div>
                </Card>

                <div className="mt-10 text-center flex flex-col gap-2">
                    <Text className="text-slate-400 font-medium">
                        Don't have an account? <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Contact Branch</span>
                    </Text>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-40 grayscale">
                        <Shield size={14} />
                        <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Access Protocol</Text>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
