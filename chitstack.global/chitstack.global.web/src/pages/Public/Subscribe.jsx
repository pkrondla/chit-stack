import { useState, useEffect } from 'react';
import {
    Steps, Form, Input, Select, Button, Card, Typography, Alert, Space,
    Checkbox, InputNumber, Divider, Radio, Tag, Spin
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const STATES = [
    'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana',
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi', 'West Bengal'
];

const BILLING_OPTIONS = [
    { value: 'Monthly', label: 'Monthly', savings: '' },
    { value: 'HalfYearly', label: 'Half-Yearly', savings: 'Save ~17%' },
    { value: 'Annual', label: 'Annual', savings: 'Save ~25%' },
];

function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getUnitPrice(comp, billingPeriod) {
    if (comp.pricingType === 'License') return comp.licensePrice;
    if (comp.pricingType === 'Hourly') return comp.hourlyPrice;
    if (billingPeriod === 'HalfYearly') return comp.halfYearlyPrice;
    if (billingPeriod === 'Annual') return comp.annualPrice;
    return comp.monthlyPrice;
}

export default function Subscribe() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [components, setComponents] = useState([]);
    const [componentsLoading, setComponentsLoading] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState('Monthly');
    const [selectedIds, setSelectedIds] = useState([]);
    const [hourlyInputs, setHourlyInputs] = useState({});
    const [orderResult, setOrderResult] = useState(null);
    const [tenantInfo, setTenantInfo] = useState(null);

    useEffect(() => {
        setComponentsLoading(true);
        api.get('/Catalog/components')
            .then(r => setComponents(r.data.data || []))
            .catch(() => {})
            .finally(() => setComponentsLoading(false));
    }, []);

    // Auto-select mandatory items
    useEffect(() => {
        const mandatory = components.filter(c => c.isMandatory).map(c => c.id);
        setSelectedIds(prev => [...new Set([...prev, ...mandatory])]);
    }, [components]);

    const grouped = components.reduce((acc, c) => {
        const key = `${c.category}__${c.pricingType}`;
        if (!acc[key]) acc[key] = { category: c.category, pricingType: c.pricingType, items: [] };
        acc[key].items.push(c);
        return acc;
    }, {});

    const totals = components.filter(c => selectedIds.includes(c.id)).reduce(
        (acc, c) => {
            const hours = hourlyInputs[c.id] || 1;
            const price = getUnitPrice(c, billingPeriod);
            const lineTotal = c.pricingType === 'Hourly' ? price * hours : price;
            if (c.pricingType === 'License') acc.oneTime += lineTotal;
            else if (c.pricingType === 'Hourly') acc.service += lineTotal;
            else if (c.category === 'Service') acc.service += lineTotal;
            else acc.recurring += lineTotal;
            return acc;
        },
        { recurring: 0, oneTime: 0, service: 0 }
    );
    const grandTotal = totals.recurring + totals.oneTime + totals.service;

    const handleLookup = async () => {
        try {
            await form.validateFields(['contactEmail']);
            const email = form.getFieldValue('contactEmail');
            setLoading(true);
            // Just proceed to next step — server validates email at submission
            setTenantInfo({ contactEmail: email });
            setStep(1);
        } catch { }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
        } catch { return; }

        setLoading(true);
        setError('');
        try {
            const v = form.getFieldsValue(true);
            const items = selectedIds.map(id => {
                const c = components.find(x => x.id === id);
                return { componentId: id, estimatedHours: c?.pricingType === 'Hourly' ? (hourlyInputs[id] || 1) : null };
            });
            const res = await api.post('/Orders', {
                contactEmail: v.contactEmail,
                companyName: v.companyName,
                tenantKey: v.tenantKey,
                adminName: v.adminName,
                adminEmail: v.adminEmail,
                adminPhone: v.adminPhone,
                state: v.state || 'Karnataka',
                billingPeriod,
                items,
            });
            setOrderResult(res.data.data);
            setStep(5);
        } catch (err) {
            setError(err.response?.data?.errors?.[0] || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { title: 'Email' },
        { title: 'Details' },
        { title: 'Billing' },
        { title: 'Components' },
        { title: 'Review' },
        { title: 'Payment' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 py-8 px-4">
            <div className="max-w-2xl mx-auto">
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
                                <Text type="secondary">Not registered yet? <Button type="link" className="p-0" onClick={() => navigate('/register')}>Register here</Button></Text>
                            </>
                        )}

                        {/* Step 1 — Tenant Details */}
                        {step === 1 && (
                            <>
                                <Title level={4}>Your new portal details</Title>
                                <Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}>
                                    <Input placeholder="Lakshmi Chit Funds Pvt Ltd" />
                                </Form.Item>
                                <Form.Item name="tenantKey" label="Portal Subdomain / Tenant Key"
                                    rules={[
                                        { required: true },
                                        { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers and hyphens' },
                                        { min: 3, message: 'Min 3 characters' }
                                    ]}>
                                    <Input placeholder="lakshmi-chits" addonBefore="https://" addonAfter=".chitstack.com" />
                                </Form.Item>
                                <Form.Item name="adminName" label="Admin User Full Name" rules={[{ required: true }]}>
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

                        {/* Step 2 — Billing Period */}
                        {step === 2 && (
                            <>
                                <Title level={4}>Choose billing period</Title>
                                <Paragraph type="secondary">
                                    License and hourly items are not affected by billing period.
                                </Paragraph>
                                <Radio.Group
                                    value={billingPeriod}
                                    onChange={e => setBillingPeriod(e.target.value)}
                                    className="w-full"
                                >
                                    <Space direction="vertical" className="w-full">
                                        {BILLING_OPTIONS.map(opt => (
                                            <Radio.Button key={opt.value} value={opt.value}
                                                className="w-full text-left h-auto py-3 px-4 rounded-lg">
                                                <Space>
                                                    <span className="font-semibold">{opt.label}</span>
                                                    {opt.savings && <Tag color="green">{opt.savings}</Tag>}
                                                </Space>
                                            </Radio.Button>
                                        ))}
                                    </Space>
                                </Radio.Group>
                            </>
                        )}

                        {/* Step 3 — Component Selector */}
                        {step === 3 && (
                            <>
                                <Title level={4}>Select software & services</Title>
                                {componentsLoading ? <Spin /> : Object.values(grouped).map(group => (
                                    <div key={`${group.category}-${group.pricingType}`} className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                                                {group.category}
                                            </span>
                                            <Tag color={group.pricingType === 'License' ? 'purple' : group.pricingType === 'Hourly' ? 'orange' : 'blue'}>
                                                {group.pricingType === 'Monthly' ? `${billingPeriod}` : group.pricingType}
                                            </Tag>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            {group.items.map((comp, idx) => {
                                                const price = getUnitPrice(comp, billingPeriod);
                                                const isMandatory = comp.isMandatory;
                                                const isChecked = selectedIds.includes(comp.id);
                                                return (
                                                    <div key={comp.id}
                                                        className={`flex items-center justify-between p-3 ${idx > 0 ? 'border-t border-slate-100' : ''} ${isMandatory ? 'bg-indigo-50' : ''}`}>
                                                        <Space>
                                                            <Checkbox
                                                                checked={isChecked}
                                                                disabled={isMandatory}
                                                                onChange={e => {
                                                                    if (e.target.checked) setSelectedIds(p => [...p, comp.id]);
                                                                    else setSelectedIds(p => p.filter(x => x !== comp.id));
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="font-medium text-slate-800">{comp.name}</div>
                                                                {comp.description && <div className="text-xs text-slate-500">{comp.description}</div>}
                                                            </div>
                                                        </Space>
                                                        <Space align="center">
                                                            {isChecked && comp.pricingType === 'Hourly' && (
                                                                <InputNumber
                                                                    min={1} max={500}
                                                                    value={hourlyInputs[comp.id] || 1}
                                                                    onChange={v => setHourlyInputs(p => ({ ...p, [comp.id]: v }))}
                                                                    size="small"
                                                                    addonAfter="hrs"
                                                                    className="w-28"
                                                                />
                                                            )}
                                                            <div className="text-right min-w-[80px]">
                                                                <div className="font-semibold text-indigo-700">
                                                                    {formatINR(price)}
                                                                </div>
                                                                <div className="text-xs text-slate-400">
                                                                    {comp.pricingType === 'License' ? 'once' : comp.pricingType === 'Hourly' ? '/hr' : '/period'}
                                                                </div>
                                                            </div>
                                                        </Space>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Step 4 — Review */}
                        {step === 4 && (
                            <>
                                <Title level={4}>Review your order</Title>
                                {totals.recurring > 0 && (
                                    <>
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                            Recurring ({billingPeriod})
                                        </div>
                                        {components.filter(c => selectedIds.includes(c.id) && c.pricingType === 'Monthly' && c.category !== 'Service').map(c => (
                                            <div key={c.id} className="flex justify-between py-1 text-sm">
                                                <span>{c.name}</span>
                                                <span className="font-medium">{formatINR(getUnitPrice(c, billingPeriod))}</span>
                                            </div>
                                        ))}
                                        <Divider className="my-2" />
                                        <div className="flex justify-between font-semibold text-indigo-700 mb-4">
                                            <span>Recurring Total</span><span>{formatINR(totals.recurring)}</span>
                                        </div>
                                    </>
                                )}
                                {totals.oneTime > 0 && (
                                    <>
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">One-Time License</div>
                                        {components.filter(c => selectedIds.includes(c.id) && c.pricingType === 'License').map(c => (
                                            <div key={c.id} className="flex justify-between py-1 text-sm">
                                                <span>{c.name}</span><span className="font-medium">{formatINR(c.licensePrice)}</span>
                                            </div>
                                        ))}
                                        <Divider className="my-2" />
                                        <div className="flex justify-between font-semibold text-purple-700 mb-4">
                                            <span>One-Time Total</span><span>{formatINR(totals.oneTime)}</span>
                                        </div>
                                    </>
                                )}
                                {totals.service > 0 && (
                                    <>
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Services</div>
                                        {components.filter(c => selectedIds.includes(c.id) && (c.pricingType === 'Hourly' || (c.pricingType === 'Monthly' && c.category === 'Service'))).map(c => (
                                            <div key={c.id} className="flex justify-between py-1 text-sm">
                                                <span>{c.name}{c.pricingType === 'Hourly' ? ` (${hourlyInputs[c.id] || 1} hrs)` : ''}</span>
                                                <span className="font-medium">{formatINR(c.pricingType === 'Hourly' ? c.hourlyPrice * (hourlyInputs[c.id] || 1) : getUnitPrice(c, billingPeriod))}</span>
                                            </div>
                                        ))}
                                        <Divider className="my-2" />
                                        <div className="flex justify-between font-semibold text-orange-600 mb-4">
                                            <span>Service Total</span><span>{formatINR(totals.service)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-800">Due Now</span>
                                    <span className="text-2xl font-bold text-indigo-700">{formatINR(grandTotal)}</span>
                                </div>
                            </>
                        )}

                        {/* Step 5 — Payment Instructions */}
                        {step === 5 && orderResult && (
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

                    {step < 5 && (
                        <Space className="w-full justify-between mt-6">
                            {step > 0 ? (
                                <Button icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)}>Back</Button>
                            ) : <span />}
                            {step < 4 ? (
                                <Button
                                    type="primary"
                                    className="bg-indigo-600"
                                    icon={<ArrowRight size={16} />}
                                    loading={loading}
                                    onClick={() => {
                                        if (step === 0) handleLookup();
                                        else setStep(s => s + 1);
                                    }}
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
