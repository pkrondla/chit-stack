import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, Steps, Tag, Alert, Spin, Divider, Button, Typography, Table, Badge
} from 'antd';
import {
    CheckCircle, Clock, CreditCard, Server, ShieldCheck,
    ExternalLink, ArrowRight, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount ?? 0);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STEP = {
    Submitted:        0,
    PaymentPending:   1,
    PaymentConfirmed: 2,
    Provisioning:     3,
    Provisioned:      4,
    Cancelled:        -1,
};

const STATUS_COLOR = {
    Submitted:        'blue',
    PaymentPending:   'orange',
    PaymentConfirmed: 'green',
    Provisioning:     'purple',
    Provisioned:      'success',
    Cancelled:        'red',
};

const TXN_COLOR = {
    PaymentPending:   'orange',
    PaymentConfirmed: 'green',
    PaymentRejected:  'red',
};

const PRICING_LABEL = {
    License: 'One-Time',
    Annual:  '/yr',
    PerDay:  '/day',
    AMC:     '/yr',
};

const steps = [
    { title: 'Order Placed',      icon: <CheckCircle size={16} /> },
    { title: 'Payment Submitted', icon: <CreditCard size={16} /> },
    { title: 'Payment Confirmed', icon: <ShieldCheck size={16} /> },
    { title: 'Provisioning',      icon: <Server size={16} /> },
    { title: 'Portal Ready',      icon: <CheckCircle size={16} /> },
];

// ─── CTA based on order status ────────────────────────────────────────────────
function StatusCTA({ order, onRefresh }) {
    const navigate = useNavigate();
    const { orderStatus, orderReference, tenantKey } = order;

    if (orderStatus === 'Submitted') return (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
                type="primary"
                size="large"
                className="bg-indigo-600"
                icon={<ArrowRight size={16} />}
                onClick={() => navigate(`/orders/${orderReference}/payment`)}
            >
                Submit Payment Details
            </Button>
            <Button size="large" icon={<RefreshCw size={16} />} onClick={onRefresh}>
                Refresh Status
            </Button>
        </div>
    );

    if (orderStatus === 'PaymentPending') return (
        <Alert
            type="info"
            showIcon
            className="mt-6"
            message="Payment under review"
            description="Our team will verify your payment within 1 business day. You will receive an email confirmation once done."
            action={<Button size="small" icon={<RefreshCw size={14} />} onClick={onRefresh}>Refresh</Button>}
        />
    );

    if (orderStatus === 'PaymentConfirmed' || orderStatus === 'Provisioning') return (
        <Alert
            type="warning"
            showIcon
            className="mt-6"
            message="Provisioning in progress"
            description="Payment confirmed. We are setting up your dedicated portal. This typically takes 1–2 business days."
            action={<Button size="small" icon={<RefreshCw size={14} />} onClick={onRefresh}>Refresh</Button>}
        />
    );

    if (orderStatus === 'Provisioned') {
        const portalUrl = `https://${tenantKey}.chitstack.com`;
        return (
            <Alert
                type="success"
                showIcon
                className="mt-6"
                message="Your portal is ready!"
                description={
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                        <span>Your dedicated ChitStack portal has been provisioned.</span>
                        <Button
                            type="primary"
                            className="bg-green-600"
                            icon={<ExternalLink size={16} />}
                            href={portalUrl}
                            target="_blank"
                        >
                            Go to your portal
                        </Button>
                    </div>
                }
            />
        );
    }

    if (orderStatus === 'Cancelled') return (
        <Alert type="error" showIcon className="mt-6"
            message="Order Cancelled"
            description="This order has been cancelled. Please contact support if you believe this is an error."
        />
    );

    return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrderStatus() {
    const { orderRef } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrder = () => {
        setLoading(true);
        api.get(`/Orders/${orderRef}`)
            .then(r => setOrder(r.data.data))
            .catch(() => setError('Order not found. Please check your order reference.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrder(); }, [orderRef]);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Spin size="large" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center">
            <div className="w-full max-w-2xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                        CS
                    </div>
                    <Title level={2} className="m-0 text-white">Order Status</Title>
                    <Text className="text-slate-400">Reference: {orderRef}</Text>
                </div>

                <Card className="shadow-2xl rounded-2xl border-0">
                    {error && <Alert message={error} type="error" showIcon className="mb-6" />}

                    {order && (
                        <>
                            {/* Company + status badge */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="text-lg font-bold text-slate-800">{order.companyName}</div>
                                    <div className="text-sm text-slate-500 mt-0.5">
                                        Portal: <span className="font-mono">{order.tenantKey}.chitstack.com</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        Ordered {formatDate(order.createdAt)}
                                    </div>
                                </div>
                                <Tag color={STATUS_COLOR[order.orderStatus] || 'default'} className="text-sm px-3 py-0.5">
                                    {order.orderStatus}
                                </Tag>
                            </div>

                            {/* Progress timeline */}
                            <Steps
                                current={STATUS_STEP[order.orderStatus] ?? 0}
                                size="small"
                                items={steps}
                                className="mb-8"
                                status={order.orderStatus === 'Cancelled' ? 'error' : undefined}
                            />

                            {/* Order items */}
                            <div className="mb-6">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                    Order Items
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    {order.items?.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between px-4 py-3 ${idx > 0 ? 'border-t border-slate-100' : ''}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-800 text-sm">{item.componentName}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {item.pricingType === 'PerDay'
                                                        ? `${item.quantity} day${item.quantity > 1 ? 's' : ''}`
                                                        : item.pricingType}
                                                    {item.expiryDate && (
                                                        <span className="ml-2">· Expires {formatDate(item.expiryDate)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <div className="font-semibold text-indigo-700 text-sm">{formatINR(item.lineTotal)}</div>
                                                <div className="text-xs text-slate-400">
                                                    {PRICING_LABEL[item.pricingType] || ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-3 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Total Amount</span>
                                    <span className="text-xl font-bold text-indigo-700">{formatINR(order.totalAmount)}</span>
                                </div>
                            </div>

                            {/* Payment transactions */}
                            {order.paymentTransactions?.length > 0 && (
                                <div className="mb-2">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                        Payment History
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {order.paymentTransactions.map(txn => (
                                            <div key={txn.id}
                                                className="border border-slate-200 rounded-xl px-4 py-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-sm font-semibold text-slate-700">
                                                        {txn.transactionReference}
                                                    </span>
                                                    <Tag color={TXN_COLOR[txn.status] || 'default'}>
                                                        {txn.status}
                                                    </Tag>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                                    <span>{txn.paymentMethod}</span>
                                                    <span>{formatDate(txn.paymentDate)}</span>
                                                    <span className="font-semibold text-slate-700">{formatINR(txn.amount)}</span>
                                                    {txn.bankOrUpiDetails && <span>{txn.bankOrUpiDetails}</span>}
                                                </div>
                                                {txn.rejectionReason && (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        Reason: {txn.rejectionReason}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <StatusCTA order={order} onRefresh={fetchOrder} />
                        </>
                    )}
                </Card>

                <div className="text-center text-slate-500 text-xs mt-4">
                    Questions? Email us at support@chitstack.com
                </div>
            </div>
        </div>
    );
}
