import { useEffect, useState } from 'react';
import { Alert, Button, Space, Tag } from 'antd';
import { RefreshCw } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const GLOBAL_API = import.meta.env.VITE_GLOBAL_API_URL || 'http://localhost:5062/api';
const SUBSCRIBE_URL = import.meta.env.VITE_GLOBAL_PORTAL_URL || 'http://localhost:5062';

function daysLabel(days) {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    return `Expires in ${days} day${days === 1 ? '' : 's'}`;
}

export default function RenewalsBanner() {
    const user = useAuthStore(s => s.user);
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!user?.username) return;        // username = email claim from JWT
        fetch(`${GLOBAL_API}/Subscriptions/renewals?email=${encodeURIComponent(user.username)}`)
            .then(r => r.json())
            .then(d => {
                const data = d.data || [];
                // Show only items expiring within 60 days or already expired
                setItems(data.filter(i => i.daysUntilExpiry <= 60));
            })
            .catch(() => {});
    }, [user?.username]);

    if (!items.length) return null;

    const expired  = items.filter(i => i.isExpired);
    const expiring = items.filter(i => !i.isExpired);

    return (
        <div className="mb-6 flex flex-col gap-2">
            {expired.length > 0 && (
                <Alert
                    type="error"
                    showIcon
                    message={
                        <span className="font-semibold">
                            {expired.length === 1
                                ? `Your ${expired[0].componentName} has expired`
                                : `${expired.length} annual subscriptions have expired`}
                        </span>
                    }
                    description={
                        <Space direction="vertical" size={4} className="mt-1 w-full">
                            {expired.map(i => (
                                <div key={i.componentName} className="flex items-center justify-between">
                                    <span className="text-sm">{i.componentName}</span>
                                    <Space>
                                        <Tag color="red">Expired {new Date(i.expiryDate).toLocaleDateString('en-IN')}</Tag>
                                        <Tag color="default">₹{i.annualAmount.toLocaleString('en-IN')}/yr</Tag>
                                    </Space>
                                </div>
                            ))}
                            <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<RefreshCw size={13} />}
                                href={`${SUBSCRIBE_URL}/subscribe`}
                                target="_blank"
                                className="mt-1"
                            >
                                Renew Now
                            </Button>
                        </Space>
                    }
                />
            )}
            {expiring.map(i => (
                <Alert
                    key={i.componentName}
                    type="warning"
                    showIcon
                    message={
                        <div className="flex items-center justify-between">
                            <span>
                                <strong>{i.componentName}</strong> — {daysLabel(i.daysUntilExpiry)}{' '}
                                <span className="text-slate-500 text-xs">
                                    ({new Date(i.expiryDate).toLocaleDateString('en-IN')})
                                </span>
                            </span>
                            <Button
                                size="small"
                                icon={<RefreshCw size={13} />}
                                href={`${SUBSCRIBE_URL}/subscribe`}
                                target="_blank"
                            >
                                Renew
                            </Button>
                        </div>
                    }
                />
            ))}
        </div>
    );
}
