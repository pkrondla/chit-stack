import { useMemo } from 'react';
import { Alert, Button } from 'antd';
import { Clock } from 'lucide-react';

const GLOBAL_PORTAL = import.meta.env.VITE_GLOBAL_PORTAL_URL || 'http://localhost:5062';

/**
 * Reads TrialEndDate from the stored JWT and shows a countdown banner.
 * Nothing is rendered if the user does not have a trial.
 */
export default function TrialBanner() {
    const daysLeft = useMemo(() => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.TrialEndDate) return null;
            const end = new Date(payload.TrialEndDate);
            const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
            return diff;
        } catch {
            return null;
        }
    }, []);

    if (daysLeft === null) return null;

    const color = daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'info';

    return (
        <Alert
            banner
            type={color}
            icon={<Clock size={14} />}
            message={
                <span>
                    <strong>Demo trial: {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'expiring today'}</strong>
                    {' — '}
                    <Button
                        type="link"
                        size="small"
                        className="p-0 font-semibold"
                        href={`${GLOBAL_PORTAL}/subscribe`}
                        target="_blank"
                    >
                        Subscribe now →
                    </Button>
                </span>
            }
        />
    );
}
