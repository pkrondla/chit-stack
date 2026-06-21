import { useEffect, useState } from 'react';
import { Alert, Button, Tag, Spin } from 'antd';
import { ExternalLink, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const GLOBAL_API    = import.meta.env.VITE_GLOBAL_API_URL    || 'http://localhost:5062/api';
const GLOBAL_PORTAL = import.meta.env.VITE_GLOBAL_PORTAL_URL || 'http://localhost:5062';

const STATUS_COLOR = {
    Submitted:        'blue',
    PaymentPending:   'orange',
    PaymentConfirmed: 'green',
    Provisioning:     'purple',
    Provisioned:      'success',
    Cancelled:        'red',
};

const STATUS_MESSAGE = {
    Submitted:        'Awaiting payment details',
    PaymentPending:   'Payment under review',
    PaymentConfirmed: 'Provisioning your portal...',
    Provisioning:     'Provisioning your portal...',
    Provisioned:      'Your portal is ready!',
    Cancelled:        'Order cancelled',
};

function alertType(status) {
    if (status === 'Provisioned') return 'success';
    if (status === 'Cancelled')   return 'error';
    if (status === 'PaymentConfirmed' || status === 'Provisioning') return 'warning';
    return 'info';
}

export default function OrderStatusBanner() {
    const user = useAuthStore(s => s.user);
    const [order, setOrder]     = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = () => {
        if (!user?.username) { setLoading(false); return; }
        fetch(`${GLOBAL_API}/Orders/my-order?email=${encodeURIComponent(user.username)}`)
            .then(r => r.json())
            .then(d => setOrder(d?.data ?? null))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrder(); }, [user?.username]);

    // Hide the banner once provisioned — they're already in their own portal
    if (loading || !order || order.orderStatus === 'Provisioned') return null;

    const trackUrl = `${GLOBAL_PORTAL}/orders/${order.orderReference}`;
    const payUrl   = `${GLOBAL_PORTAL}/orders/${order.orderReference}/payment`;

    return (
        <Alert
            type={alertType(order.orderStatus)}
            showIcon
            className="mb-4"
            message={
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Subscription Order {order.orderReference}</span>
                    <Tag color={STATUS_COLOR[order.orderStatus] || 'default'}>
                        {STATUS_MESSAGE[order.orderStatus] || order.orderStatus}
                    </Tag>
                    <span className="text-sm font-normal">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </span>
                </div>
            }
            description={
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Button
                        size="small"
                        icon={<ExternalLink size={13} />}
                        href={trackUrl}
                        target="_blank"
                    >
                        Track Order
                    </Button>
                    {order.orderStatus === 'Submitted' && (
                        <Button
                            size="small"
                            type="primary"
                            className="bg-indigo-600"
                            icon={<ExternalLink size={13} />}
                            href={payUrl}
                            target="_blank"
                        >
                            Submit Payment
                        </Button>
                    )}
                    <Button size="small" icon={<RefreshCw size={13} />} onClick={fetchOrder}>
                        Refresh
                    </Button>
                </div>
            }
        />
    );
}
