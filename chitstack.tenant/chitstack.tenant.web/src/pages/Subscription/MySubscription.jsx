import { useEffect, useState } from 'react';
import { Card, Tag, Button, Spin, Alert, Divider, Tooltip } from 'antd';
import { ExternalLink, RefreshCw, ShieldCheck, Calendar, Award } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const GLOBAL_API    = import.meta.env.VITE_GLOBAL_API_URL    || 'http://localhost:5062/api';
const GLOBAL_PORTAL = import.meta.env.VITE_GLOBAL_PORTAL_URL || 'http://localhost:5062';

function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount ?? 0);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DaysTag({ days }) {
    if (days === undefined || days === null) return null;
    if (days < 0)   return <Tag color="red">Expired {Math.abs(days)}d ago</Tag>;
    if (days <= 30) return <Tag color="red">Expires in {days}d</Tag>;
    if (days <= 60) return <Tag color="orange">Expires in {days}d</Tag>;
    return <Tag color="green">Expires in {days}d</Tag>;
}

export default function MySubscription() {
    const user = useAuthStore(s => s.user);
    const [order, setOrder]       = useState(null);
    const [renewals, setRenewals] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    const email = user?.username;

    const fetchData = () => {
        if (!email) { setLoading(false); return; }
        setLoading(true);
        Promise.all([
            fetch(`${GLOBAL_API}/Orders/my-order?email=${encodeURIComponent(email)}`).then(r => r.json()),
            fetch(`${GLOBAL_API}/Subscriptions/renewals?email=${encodeURIComponent(email)}`).then(r => r.json()),
        ])
            .then(([orderRes, renewalRes]) => {
                setOrder(orderRes?.data ?? null);
                setRenewals(renewalRes?.data ?? []);
            })
            .catch(() => setError('Unable to load subscription details. Please try again.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [email]);

    if (loading) return (
        <div className="flex items-center justify-center py-20"><Spin size="large" /></div>
    );

    if (error) return (
        <Alert type="error" showIcon message={error} className="mb-4"
            action={<Button size="small" icon={<RefreshCw size={14} />} onClick={fetchData}>Retry</Button>}
        />
    );

    if (!order) return (
        <Alert
            type="info" showIcon
            message="No subscription order found"
            description="Your subscription details will appear here once an order has been placed."
        />
    );

    const licenseItems  = order.items?.filter(i => i.pricingType === 'License') ?? [];
    const annualItems   = order.items?.filter(i => i.pricingType === 'Annual' || i.pricingType === 'AMC') ?? [];
    const trainingItems = order.items?.filter(i => i.pricingType === 'PerDay') ?? [];

    // Merge renewal data (has daysUntilExpiry) into annual items by componentName
    const renewalMap = Object.fromEntries(renewals.map(r => [r.componentName, r]));

    const renewUrl = (item) => {
        const params = new URLSearchParams({
            email:   email,
            renew:   'true',
            orderRef: order.orderReference,
            amc:     item.unitPrice,        // pass stored unit price for ExplicitAmcAmount
        });
        return `${GLOBAL_PORTAL}/subscribe?${params.toString()}`;
    };

    const trackUrl = `${GLOBAL_PORTAL}/orders/${order.orderReference}`;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header row */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold m-0">My Subscription</h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Order {order.orderReference} · {formatDate(order.createdAt)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="small" icon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>
                    <Button size="small" icon={<ExternalLink size={14} />} href={trackUrl} target="_blank">
                        View Order
                    </Button>
                </div>
            </div>

            {/* ── License components (permanent) ─────────────────────── */}
            {licenseItems.length > 0 && (
                <Card
                    title={
                        <span className="flex items-center gap-2">
                            <Award size={16} className="text-purple-600" />
                            <span>Software Licenses</span>
                            <Tag color="purple" className="ml-1">One-Time · Permanent</Tag>
                        </span>
                    }
                    className="mb-4 shadow-sm rounded-xl"
                    size="small"
                >
                    {licenseItems.map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between py-2 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                            <div>
                                <div className="font-medium text-slate-800 text-sm">{item.componentName}</div>
                                <div className="text-xs text-slate-400">Purchased {formatDate(order.createdAt)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-700">{formatINR(item.lineTotal)}</span>
                                <Tag color="green">Active</Tag>
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {/* ── Annual subscriptions (AMC + Cloud Infra) ───────────── */}
            {annualItems.length > 0 && (
                <Card
                    title={
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-blue-600" />
                            <span>Annual Subscriptions</span>
                            <Tag color="blue" className="ml-1">Renews Yearly</Tag>
                        </span>
                    }
                    className="mb-4 shadow-sm rounded-xl"
                    size="small"
                >
                    {annualItems.map((item, idx) => {
                        const renewal = renewalMap[item.componentName];
                        const days    = renewal?.daysUntilExpiry;
                        const needsRenewal = days !== undefined && days <= 60;

                        return (
                            <div key={idx} className={`flex items-center justify-between py-2 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-800 text-sm">{item.componentName}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                        <Calendar size={12} />
                                        <span>Expires {formatDate(item.expiryDate)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                    <span className="text-sm font-semibold text-slate-700">{formatINR(item.unitPrice)}/yr</span>
                                    <DaysTag days={days} />
                                    {needsRenewal && (
                                        <Button
                                            size="small"
                                            type="primary"
                                            danger={days < 0}
                                            icon={<RefreshCw size={13} />}
                                            href={renewUrl(item)}
                                            target="_blank"
                                        >
                                            Renew
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </Card>
            )}

            {/* ── Training ────────────────────────────────────────────── */}
            {trainingItems.length > 0 && (
                <Card
                    title={
                        <span className="flex items-center gap-2">
                            <span>Training</span>
                            <Tag color="orange" className="ml-1">Per Day</Tag>
                        </span>
                    }
                    className="mb-4 shadow-sm rounded-xl"
                    size="small"
                >
                    {trainingItems.map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between py-2 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                            <div>
                                <div className="font-medium text-slate-800 text-sm">{item.componentName}</div>
                                <div className="text-xs text-slate-400">
                                    {item.quantity} day{item.quantity > 1 ? 's' : ''} purchased
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{formatINR(item.lineTotal)}</span>
                        </div>
                    ))}
                </Card>
            )}

            {/* ── Total ───────────────────────────────────────────────── */}
            <div className="bg-indigo-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Order Total</span>
                <span className="text-xl font-bold text-indigo-700">{formatINR(order.totalAmount)}</span>
            </div>
        </div>
    );
}
