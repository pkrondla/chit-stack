import { useState, useEffect } from 'react';
import {
    Steps, Form, Input, Select, Button, Card, Typography, Alert, Space,
    Checkbox, InputNumber, Divider, Tag, Spin, Tooltip
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShoppingCart, CheckCircle, Info } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const STATES = [
    'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana',
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi', 'West Bengal'
];

function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

const PRICING_LABELS = {
    License: { label: 'One-Time', color: 'purple' },
    Annual:  { label: 'Annual',   color: 'blue'   },
    PerDay:  { label: 'Per Day',  color: 'orange' },
};

export default function Subscribe() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [components, setComponents] = useState([]);
    const [componentsLoading, setComponentsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [dayInputs, setDayInputs] = useState({});   // componentId -> number of days
    const [orderResult, setOrderResult] = useState(null);
    const [amcPct, setAmcPct] = useState(25);

    useEffect(() => {
        setComponentsLoading(true);
        Promise.all([
            api.get('/Catalog/components'),
            api.get('/Settings/amc-percentage').catch(() => ({ data: { data: 25 } }))
        ])
            .then(([compRes, amcRes]) => {
                setComponents(compRes.data.data || []);
                setAmcPct(Number(amcRes.data.data) || 25);
            })
            .catch(() => {})
            .finally(() => setComponentsLoading(false));
    }, []);

    // Auto-select mandatory items
    useEffect(() => {
        const mandatory = components.filter(c => c.isMandatory).map(c => c.id);
        setSelectedIds(prev => [...new Set([...prev, ...mandatory])]);
    }, [components]);

    // Group components by pricingType
    const grouped = components.reduce((acc, c) => {
        if (!acc[c.pricingType]) acc[c.pricingType] = [];
        acc[c.pricingType].push(c);
        return acc;
    }, {});

    const selected = components.filter(c => selectedIds.includes(c.id));
    const licenseTotal  = selected.filter(c => c.pricingType === 'License').reduce((s, c) => s + c.licensePrice, 0);
    const annualTotal   = selected.filter(c => c.pricingType === 'Annual').reduce((s, c) => s + c.annualPrice, 0);
    const trainingTotal = selected.filter(c => c.pricingType === 'PerDay').reduce((s, c) => s + c.dailyPrice * (dayInputs[c.id] || 1), 0);
    const amcAmount     = Math.round(licenseTotal * (amcPct / 100));
    const grandTotal    = licenseTotal + annualTotal + trainingTotal + amcAmount;

    const handleLookup = async () => {
        try {
            await form.validateFields(['contactEmail']);
            setStep(1);
        } catch { }
    };

    const handleSubmit = async () => {
        try { await form.validateFields(); } catch { return; }
        setLoading(true);
        setError('');
        try {
            const v = form.getFieldsValue(true);
            const items = selectedIds.map(id => {
                const c = components.find(x => x.id === id);
                return { componentId: id, quantity: c?.pricingType === 'PerDay' ? (dayInputs[id] || 1) : 1 };
            });
            const res = await api.post('/Orders', {
                contactEmail: v.contactEmail,
                companyName:  v.companyName,
                tenantKey:    v.tenantKey,
                adminName:    v.adminName,
                adminEmail:   v.adminEmail,
                adminPhone:   v.adminPhone,
                state:        v.state || 'Karnataka',
                items,
            });
            setOrderResult(res.data.data);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.errors?.[0] || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { title: 'Email' },
        { title: 'Details' },
        { title: 'Components' },
        { title: 'Review' },
        { title: 'Payment' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">CS</div>
                    <Title level={2} className="m-0 text-white">Subscribe to ChitStack</Title>
                    <Text className="text-slate-400">Get your dedicated portal in 1–2 business days</Text>
                </div>

                <Card className="shadow-2xl rounded-2xl border-0">
                    <Steps current={step} items={steps} size="small" className="mb-8" />
                    {error && <Alert message={error} type="error" showIcon className="mb-4" />}

                    <Form form={form} layout="vertical" size="large">

                        {/* Step 0 — Email */}
                        {step === 0 && (
                            <>
                                <Title level={4}>Enter your registered email</Title>
                                <Form.Item name="contactEmail" label="Email used during registration"
                                    rules={[{ required: true }, { type: 'email' }]}>
                                    <Input placeholder="your@email.com" />
                                </Form.Item>
                                <Text type="secondary">
                                    Not registered yet?{' '}
                                    <Button type="link" className="p-0" onClick={() => navigate('/register')}>Register here</Button>
                                </Text>
                            </>
                        )}

                        {/* Step 1 — Tenant Details */}
                        {step === 1 && (
                            <>
                                <Title level={4}>Your new portal details</Title>
                                <Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}>
                                    <Input placeholder="Lakshmi Chit Funds Pvt Ltd" />
                                </Form.Item>
                                <Form.Item name="tenantKey" label="Portal Subdomain"
                                    rules={[
                                        { required: true },
                                        { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' },
                                        { min: 3, message: 'Min 3 characters' }
                                    ]}>
                                    <Input placeholder="lakshmi-chits" addonBefore="https://" addonAfter=".chitstack.com" />
                                </Form.Item>
                                <Form.Item name="adminName" label="Admin Full Name" rules={[{ required: true }]}>
                                    <Input placeholder="Rajesh Kumar" />
                                </Form.Item>
                                <Form.Item name="adminEmail" label="Admin Email" rules={[{ required: true }, { type: 'email' }]}>
                                    <Input placeholder="admin@yourcompany.com" />
                                </Form.Item>
                                <Form.Item name="adminPhone" label="Admin Phone">
                                    <Input placeholder="9876543210" />
                                </Form.Item>
                                <Form.Item name="state" label="State" initialValue="Karnataka">
                                    <Select>{STATES.map(s => <Option key={s} value={s}>{s}</Option>)}</Select>
                                </Form.Item>
                            </>
                        )}

                        {/* Step 2 — Component Selector */}
                        {step === 2 && (
                            <>
                                <Title level={4}>Select software & services</Title>
                                {componentsLoading ? <Spin /> : (
                                    <>
                                        {['License', 'Annual', 'PerDay'].map(type => {
                                            const items = grouped[type] || [];
                                            if (!items.length) return null;
                                            const { label, color } = PRICING_LABELS[type] || { label: type, color: 'default' };
                                            return (
                                                <div key={type} className="mb-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                                                            {type === 'License' ? 'Core & Add-Ons' : type === 'Annual' ? 'Annual Services' : 'Training'}
                                                        </span>
                                                        <Tag color={color}>{label}</Tag>
                                                    </div>
                                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                        {items.map((comp, idx) => {
                                            const price = type === 'License' ? comp.licensePrice
                                                        : type === 'Annual'  ? comp.annualPrice
                                                        : comp.dailyPrice;
                                                            const isChecked = selectedIds.includes(comp.id);
                                                            return (
                                                                <div key={comp.id}
                                                                    className={`flex items-center gap-3 p-3 ${idx > 0 ? 'border-t border-slate-100' : ''} ${comp.isMandatory ? 'bg-indigo-50' : ''}`}>
                                                                    {/* Checkbox */}
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        disabled={comp.isMandatory}
                                                                        onChange={e => {
                                                                            if (e.target.checked) setSelectedIds(p => [...p, comp.id]);
                                                                            else setSelectedIds(p => p.filter(x => x !== comp.id));
                                                                        }}
                                                                    />
                                                                    {/* Name + description — fills all remaining space */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-slate-800 flex items-center gap-2 flex-wrap">
                                                                            {comp.name}
                                                                            {comp.isMandatory && <Tag color="geekblue" className="text-xs">Required</Tag>}
                                                                        </div>
                                                                        {comp.description && (
                                                                            <div className="text-xs text-slate-500 mt-0.5">{comp.description}</div>
                                                                        )}
                                                                    </div>
                                                                    {/* Day input for training */}
                                                                    {isChecked && type === 'PerDay' && (
                                                                        <InputNumber
                                                                            min={1} max={30}
                                                                            value={dayInputs[comp.id] || 1}
                                                                            onChange={v => setDayInputs(p => ({ ...p, [comp.id]: v }))}
                                                                            size="small"
                                                                            addonAfter="days"
                                                                            className="w-28 shrink-0"
                                                                        />
                                                                    )}
                                                                    {/* Price — fixed width, never shrinks */}
                                                                    <div className="text-right w-20 shrink-0">
                                                                        <div className="font-semibold text-indigo-700">{formatINR(price)}</div>
                                                                        <div className="text-xs text-slate-400">
                                                                            {type === 'License' ? 'one-time' : type === 'Annual' ? '/year' : '/day'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* AMC info box */}
                                        {licenseTotal > 0 && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                                <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="font-semibold text-amber-800">
                                                        Annual Maintenance Contract (AMC) — {formatINR(amcAmount)}/year
                                                    </div>
                                                    <div className="text-xs text-amber-700 mt-1">
                                                        {amcPct}% of your license cost ({formatINR(licenseTotal)}) added as annual AMC —
                                                        covers bug fixes, version upgrades, and technical support. Renews every year.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* Step 3 — Review */}
                        {step === 3 && (
                            <>
                                <Title level={4}>Review your order</Title>

                                {/* One-Time License */}
                                {licenseTotal > 0 && (
                                    <>
                                        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">One-Time License</div>
                                        {selected.filter(c => c.pricingType === 'License').map(c => (
                                            <div key={c.id} className="flex justify-between py-1 text-sm">
                                                <span>{c.name}</span>
                                                <span className="font-medium">{formatINR(c.licensePrice)}</span>
                                            </div>
                                        ))}
                                        <Divider className="my-2" />
                                        <div className="flex justify-between font-semibold text-purple-700 mb-4">
                                            <span>License Total</span><span>{formatINR(licenseTotal)}</span>
                                        </div>
                                    </>
                                )}

                                {/* Annual (Cloud Infra + AMC) */}
                                {(annualTotal > 0 || amcAmount > 0) && (
                                    <>
                                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Annual Recurring</div>
                                        {selected.filter(c => c.pricingType === 'Annual').map(c => (
                                            <div key={c.id} className="flex justify-between py-1 text-sm">
                                                <span>{c.name}</span>
                                                <span className="font-medium">{formatINR(c.annualPrice)}<span className="text-slate-400 text-xs">/yr</span></span>
                                            </div>
                                        ))}
                                        {amcAmount > 0 && (
                                            <div className="flex justify-between py-1 text-sm">
                                                <span>AMC ({amcPct}% of license)</span>
                                                <span className="font-medium">{formatINR(amcAmount)}<span className="text-slate-400 text-xs">/yr</span></span>
                                            </div>
                                        )}
                                        <Divider className="my-2" />
                                        <div className="flex justify-between font-semibold text-blue-700 mb-4">
                                            <span>Annual Total</span><span>{formatINR(annualTotal + amcAmount)}<span className="font-normal text-slate-400 text-xs">/yr</span></span>
                                        </div>
                                    </>
                                )}

                                {/* Training */}
                                {trainingTotal > 0 && (
                                    <>
                                        <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Training</div>
                                        {selected.filter(c => c.pricingType === 'PerDay').map(c => {
                                            const days = dayInputs[c.id] || 1;
                                            const price = c.dailyPrice;
                                            return (
                                                <div key={c.id} className="flex justify-between py-1 text-sm">
                                                    <span>{c.name} × {days} day{days > 1 ? 's' : ''}</span>
                                                    <span className="font-medium">{formatINR(price * days)}</span>
                                                </div>
                                            );
                                        })}
                                        <Divider className="my-2" />
                                        <div className="flex justify-between font-semibold text-orange-600 mb-4">
                                            <span>Training Total</span><span>{formatINR(trainingTotal)}</span>
                                        </div>
                                    </>
                                )}

                                <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center mb-2">
                                    <span className="text-lg font-bold text-slate-800">Due Now</span>
                                    <span className="text-2xl font-bold text-indigo-700">{formatINR(grandTotal)}</span>
                                </div>
                                <p className="text-xs text-slate-500 text-center">
                                    Annual items (AMC + Cloud Infrastructure) renew every year. One-time licenses are yours to keep.
                                </p>
                            </>
                        )}

                        {/* Step 4 — Payment Instructions */}
                        {step === 4 && orderResult && (
                            <div className="text-center">
                                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                <Title level={3}>Order Submitted!</Title>
                                <div className="bg-slate-50 rounded-xl p-4 text-left mb-4">
                                    <p><strong>Order Reference:</strong> {orderResult.orderReference}</p>
                                    <p><strong>Amount Due:</strong> {formatINR(orderResult.totalAmount)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 text-left mb-6">
                                    <p className="font-semibold mb-2">Payment Instructions</p>
                                    <p><strong>UPI ID:</strong> {orderResult.paymentUpiId}</p>
                                    <p><strong>Bank:</strong> {orderResult.paymentBankName}</p>
                                    <p><strong>A/C:</strong> {orderResult.paymentAccountNumber}</p>
                                    <p><strong>IFSC:</strong> {orderResult.paymentIfsc}</p>
                                </div>
                                <Paragraph type="secondary">
                                    After transferring the amount, click below to enter your transaction details.
                                </Paragraph>
                                <Button
                                    type="primary"
                                    size="large"
                                    className="bg-indigo-600 w-full"
                                    onClick={() => navigate(`/orders/${orderResult.orderReference}/payment`)}
                                >
                                    I have paid — Enter Transaction Details
                                </Button>
                            </div>
                        )}
                    </Form>

                    {step < 4 && (
                        <Space className="w-full justify-between mt-6">
                            {step > 0 ? (
                                <Button icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)}>Back</Button>
                            ) : <span />}
                            {step < 3 ? (
                                <Button
                                    type="primary"
                                    className="bg-indigo-600"
                                    icon={<ArrowRight size={16} />}
                                    loading={loading}
                                    onClick={() => step === 0 ? handleLookup() : setStep(s => s + 1)}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    className="bg-green-600"
                                    icon={<ShoppingCart size={16} />}
                                    loading={loading}
                                    onClick={handleSubmit}
                                >
                                    Submit Order
                                </Button>
                            )}
                        </Space>
                    )}
                </Card>
            </div>
        </div>
    );
}
