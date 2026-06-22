import { useState, useEffect } from 'react';
import {
    Steps, Form, Input, Select, Button, Card, Typography, Alert, Space,
    Checkbox, InputNumber, Divider, Tag, Spin,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShoppingCart, CheckCircle, Info, Receipt } from 'lucide-react';
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

// ─── Sticky order summary panel ─────────────────────────────────────────────
function OrderSummary({ selected, licenseTotal, annualTotal, trainingTotal, amcAmount, amcPct, grandTotal, dayInputs }) {
    const hasItems = selected.length > 0;
    return (
        <Card className="shadow-xl rounded-2xl border-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Receipt size={18} className="text-indigo-600" />
                <span className="font-bold text-slate-800 text-base">Order Summary</span>
            </div>

            {!hasItems && (
                <p className="text-sm text-slate-400 text-center py-4">Select items on the left to see your total.</p>
            )}

            {/* License items */}
            {licenseTotal > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-2">One-Time License</div>
                    {selected.filter(c => c.pricingType === 'License').map(c => (
                        <div key={c.id} className="flex justify-between text-sm py-0.5">
                            <span className="text-slate-600 truncate pr-2">{c.name}</span>
                            <span className="font-medium text-slate-800 shrink-0">{formatINR(c.licensePrice)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold text-purple-700 mt-1 pt-1 border-t border-purple-100">
                        <span>Subtotal</span><span>{formatINR(licenseTotal)}</span>
                    </div>
                </div>
            )}

            {/* Annual items */}
            {(annualTotal > 0 || amcAmount > 0) && (
                <div className="mb-4">
                    <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-2">Annual Recurring</div>
                    {selected.filter(c => c.pricingType === 'Annual').map(c => (
                        <div key={c.id} className="flex justify-between text-sm py-0.5">
                            <span className="text-slate-600 truncate pr-2">{c.name}</span>
                            <span className="font-medium text-slate-800 shrink-0">{formatINR(c.annualPrice)}<span className="text-slate-400 text-xs">/yr</span></span>
                        </div>
                    ))}
                    {amcAmount > 0 && (
                        <div className="flex justify-between text-sm py-0.5">
                            <span className="text-slate-600 truncate pr-2">AMC ({amcPct}%)</span>
                            <span className="font-medium text-slate-800 shrink-0">{formatINR(amcAmount)}<span className="text-slate-400 text-xs">/yr</span></span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-blue-700 mt-1 pt-1 border-t border-blue-100">
                        <span>Subtotal</span><span>{formatINR(annualTotal + amcAmount)}<span className="font-normal text-xs text-slate-400">/yr</span></span>
                    </div>
                </div>
            )}

            {/* Training */}
            {trainingTotal > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider mb-2">Training</div>
                    {selected.filter(c => c.pricingType === 'PerDay').map(c => {
                        const days = dayInputs[c.id] || 1;
                        return (
                            <div key={c.id} className="flex justify-between text-sm py-0.5">
                                <span className="text-slate-600 truncate pr-2">{c.name} × {days}d</span>
                                <span className="font-medium text-slate-800 shrink-0">{formatINR(c.dailyPrice * days)}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {hasItems && <Divider className="my-3" />}

            {/* Grand total */}
            <div className="bg-indigo-50 rounded-xl p-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Due Now</span>
                <span className="text-xl font-bold text-indigo-700">{formatINR(grandTotal)}</span>
            </div>

            {amcAmount > 0 && (
                <div className="mt-3 flex gap-2 bg-amber-50 rounded-lg p-2.5">
                    <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                        AMC of {formatINR(amcAmount)}/yr is included above and renews every year.
                    </p>
                </div>
            )}
        </Card>
    );
}

const GLOBAL_PORTAL = import.meta.env.VITE_GLOBAL_PORTAL_URL || 'http://localhost:5062';

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Subscribe() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [components, setComponents] = useState([]);
    const [componentsLoading, setComponentsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [dayInputs, setDayInputs] = useState({});
    const [orderResult, setOrderResult] = useState(null);
    const [amcPct, setAmcPct] = useState(25);
    const [existingOrder, setExistingOrder] = useState(null); // set when email already has an active order

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

    useEffect(() => {
        const mandatory = components.filter(c => c.isMandatory).map(c => c.id);
        setSelectedIds(prev => [...new Set([...prev, ...mandatory])]);
    }, [components]);

    const grouped = components.reduce((acc, c) => {
        if (!acc[c.pricingType]) acc[c.pricingType] = [];
        acc[c.pricingType].push(c);
        return acc;
    }, {});

    const selected      = components.filter(c => selectedIds.includes(c.id));
    const licenseTotal  = selected.filter(c => c.pricingType === 'License').reduce((s, c) => s + c.licensePrice, 0);
    const annualTotal   = selected.filter(c => c.pricingType === 'Annual').reduce((s, c) => s + c.annualPrice, 0);
    const trainingTotal = selected.filter(c => c.pricingType === 'PerDay').reduce((s, c) => s + c.dailyPrice * (dayInputs[c.id] || 1), 0);
    const amcAmount     = Math.round(licenseTotal * (amcPct / 100));
    const grandTotal    = licenseTotal + annualTotal + trainingTotal + amcAmount;

    const summaryProps  = { selected, licenseTotal, annualTotal, trainingTotal, amcAmount, amcPct, grandTotal, dayInputs };

    // Two-column layout on components + review steps
    const isTwoCol = step === 2 || step === 3;

    const handleLookup = async () => {
        try {
            await form.validateFields(['contactEmail']);
        } catch {
            return;
        }

        setLoading(true);
        setExistingOrder(null);
        try {
            const email = form.getFieldValue('contactEmail');
            const res = await api.get(`/Orders/my-order?email=${encodeURIComponent(email)}`);
            const order = res.data?.data;

            if (order && order.orderStatus !== 'Cancelled') {
                // Active order found — stop here and show the user their existing order
                setExistingOrder(order);
                return;
            }

            // No active order — proceed normally
            setStep(1);
        } catch {
            // If the check fails (e.g. network error), allow the user to proceed;
            // the backend will be the authoritative guard.
            setStep(1);
        } finally {
            setLoading(false);
        }
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
            const d = err.response?.data;
            // handles our Result<T> shape ({ errors: [...] }) and ASP.NET validation shape ({ title, errors: {...} })
            const msg = d?.errors?.[0]
                ?? (typeof d?.errors === 'object' ? Object.values(d.errors).flat()[0] : null)
                ?? d?.title
                ?? d?.message
                ?? 'Submission failed. Please try again.';
            setError(msg);
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

    // ── Form card content ──────────────────────────────────────────────────
    const formCard = (
        <Card className="shadow-2xl rounded-2xl border-0 h-full">
            <Steps current={step} items={steps} size="small" className="mb-8" />
            {error && <Alert message={error} type="error" showIcon className="mb-4" />}

            <Form form={form} layout="vertical" size="large">

                        {/* Step 0 — Email */}
                        {step === 0 && (
                            <>
                                <Title level={4}>Enter your registered email</Title>
                                <Form.Item name="contactEmail" label="Email used during registration"
                                    rules={[{ required: true }, { type: 'email' }]}>
                                    <Input
                                        placeholder="your@email.com"
                                        onChange={() => setExistingOrder(null)}
                                    />
                                </Form.Item>

                                {existingOrder && (() => {
                                    const isProvisioned = existingOrder.orderStatus === 'Provisioned';
                                    const trackUrl = `${GLOBAL_PORTAL}/orders/${existingOrder.orderReference}`;
                                    const portalUrl = `https://${existingOrder.tenantKey}.chitstack.com`;
                                    return (
                                        <Alert
                                            type={isProvisioned ? 'success' : 'warning'}
                                            showIcon
                                            className="mb-4"
                                            message={
                                                isProvisioned
                                                    ? 'Your portal is already provisioned'
                                                    : `You already have an active order (${existingOrder.orderReference})`
                                            }
                                            description={
                                                <div className="flex flex-col gap-2 mt-1">
                                                    <span className="text-sm">
                                                        {isProvisioned
                                                            ? 'Your dedicated ChitStack portal is ready. You cannot place a duplicate order.'
                                                            : `Status: ${existingOrder.orderStatus} · ₹${existingOrder.totalAmount?.toLocaleString('en-IN')}`}
                                                    </span>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {isProvisioned ? (
                                                            <Button size="small" type="primary" className="bg-green-600"
                                                                href={portalUrl} target="_blank">
                                                                Go to your portal
                                                            </Button>
                                                        ) : (
                                                            <Button size="small" type="primary" className="bg-indigo-600"
                                                                href={trackUrl} target="_blank">
                                                                Track existing order
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    );
                                })()}

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
                            ['License', 'Annual', 'PerDay'].map(type => {
                                const items = grouped[type] || [];
                                if (!items.length) return null;
                                const { label, color } = PRICING_LABELS[type];
                                return (
                                    <div key={type} className="mb-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                                                {type === 'License' ? 'Core & Add-Ons' : type === 'Annual' ? 'Annual Services' : 'Training'}
                                            </span>
                                            <Tag color={color}>{label}</Tag>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            {items.map((comp, idx) => {
                                                const price     = type === 'License' ? comp.licensePrice : type === 'Annual' ? comp.annualPrice : comp.dailyPrice;
                                                const isChecked = selectedIds.includes(comp.id);
                                                return (
                                                    <div key={comp.id}
                                                        className={`flex items-center gap-3 p-3 ${idx > 0 ? 'border-t border-slate-100' : ''} ${comp.isMandatory ? 'bg-indigo-50' : ''}`}>
                                                        <Checkbox
                                                            checked={isChecked}
                                                            disabled={comp.isMandatory}
                                                            onChange={e => {
                                                                if (e.target.checked) setSelectedIds(p => [...p, comp.id]);
                                                                else setSelectedIds(p => p.filter(x => x !== comp.id));
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-slate-800 flex items-center gap-2 flex-wrap">
                                                                {comp.name}
                                                                {comp.isMandatory && <Tag color="geekblue" className="text-xs">Required</Tag>}
                                                            </div>
                                                            {comp.description && (
                                                                <div className="text-xs text-slate-500 mt-0.5">{comp.description}</div>
                                                            )}
                                                        </div>
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
                            })
                        )}
                    </>
                )}

                {/* Step 3 — Review */}
                {step === 3 && (
                    <>
                        <Title level={4}>Review your order</Title>

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
                                    <span>Annual Total</span>
                                    <span>{formatINR(annualTotal + amcAmount)}<span className="font-normal text-slate-400 text-xs">/yr</span></span>
                                </div>
                            </>
                        )}

                        {trainingTotal > 0 && (
                            <>
                                <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Training</div>
                                {selected.filter(c => c.pricingType === 'PerDay').map(c => {
                                    const days = dayInputs[c.id] || 1;
                                    return (
                                        <div key={c.id} className="flex justify-between py-1 text-sm">
                                            <span>{c.name} × {days} day{days > 1 ? 's' : ''}</span>
                                            <span className="font-medium">{formatINR(c.dailyPrice * days)}</span>
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

                {/* Step 4 — Payment */}
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
                        <Button type="primary" size="large" className="bg-indigo-600 w-full"
                            onClick={() => navigate(`/orders/${orderResult.orderReference}/payment`)}>
                            I have paid — Enter Transaction Details
                        </Button>
                    </div>
                )}
            </Form>

                    {step < 4 && (
                        <Space className="w-full justify-between mt-6">
                            {step > 0
                                ? <Button icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)}>Back</Button>
                                : <span />}
                            {step < 3
                                ? <Button type="primary" className="bg-indigo-600" icon={<ArrowRight size={16} />}
                                    loading={loading}
                                    disabled={step === 0 && existingOrder !== null}
                                    onClick={() => step === 0 ? handleLookup() : setStep(s => s + 1)}>
                                    Next
                                  </Button>
                                : <Button type="primary" className="bg-green-600" icon={<ShoppingCart size={16} />}
                                    loading={loading} onClick={handleSubmit}>
                                    Submit Order
                                  </Button>}
                        </Space>
                    )}
        </Card>
    );

    // ── Page shell ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center">
            {/* Branding header */}
            <div className={`w-full ${isTwoCol ? 'max-w-5xl' : 'max-w-2xl'} transition-all duration-300`}>
                <div className="text-center mb-8">
                    <div className="mx-auto bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">CS</div>
                    <Title level={2} className="m-0 text-white">Subscribe to ChitStack</Title>
                    <Text className="text-slate-400">Get your dedicated portal in 1–2 business days</Text>
                </div>

                {isTwoCol ? (
                    /* Two-column: form left, summary right */
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 min-w-0">{formCard}</div>
                        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-8">
                            <OrderSummary {...summaryProps} />
                        </div>
                    </div>
                ) : (
                    /* Single column: centered narrow card */
                    formCard
                )}
            </div>
        </div>
    );
}
