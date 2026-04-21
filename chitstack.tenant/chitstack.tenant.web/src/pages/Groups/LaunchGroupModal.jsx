import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Alert, Typography, Tag, Space } from 'antd';
import { Rocket, CalendarClock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Text } = Typography;

/**
 * LaunchGroupModal — confirms launch after checking that the auction schedule is complete.
 * If schedule is missing, shows a button to navigate to the Auction Scheduler page.
 */
const LaunchGroupModal = ({ group, open, onClose }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);

    const launchMutation = useMutation({
        mutationFn: () => api.post(`/ChitGroups/${group.id}/launch`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['auctions'] });
            onClose();
            setError(null);
        },
        onError: (err) => {
            setError(err.response?.data?.errors?.[0] || err.message || 'Launch failed.');
        }
    });

    const handleLaunch = () => {
        setError(null);
        launchMutation.mutate();
    };

    const handleGoToScheduler = () => {
        onClose();
        navigate(`/groups/${group?.id}/scheduler`);
    };

    const isScheduleError = error?.includes('schedule') || error?.includes('Auction');

    return (
        <Modal
            open={open}
            onCancel={() => { onClose(); setError(null); }}
            footer={null}
            title={
                <div className="flex items-center gap-2">
                    <Rocket size={18} className="text-slate-600" />
                    <span>Launch Group</span>
                </div>
            }
            width={480}
        >
            <div className="py-3 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800 mb-2">{group?.groupName}</p>
                    <Space wrap size={8}>
                        <Tag>{group?.durationMonths} months</Tag>
                        <Tag color="blue">₹{group?.chitValue?.toLocaleString('en-IN')}</Tag>
                        <Tag color={group?.status === 'Proposed' ? 'orange' : 'green'}>{group?.status}</Tag>
                    </Space>
                </div>

                <div className="text-sm text-slate-600 space-y-2">
                    <div className="flex items-start gap-2">
                        <CheckCircle size={15} className="text-green-500 mt-0.5 shrink-0" />
                        <span>All {group?.durationMonths} subscriber tickets must be enrolled.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CalendarClock size={15} className="text-violet-500 mt-0.5 shrink-0" />
                        <span>All {group?.durationMonths} auction dates must be set in the <strong>Auction Scheduler</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        <span>Once launched, the group status changes to <Tag color="green">Active</Tag> and cannot be undone.</span>
                    </div>
                </div>

                {error && (
                    <Alert
                        type={isScheduleError ? 'warning' : 'error'}
                        showIcon
                        message={error}
                        action={
                            isScheduleError ? (
                                <Button
                                    size="small"
                                    icon={<CalendarClock size={13} />}
                                    onClick={handleGoToScheduler}
                                >
                                    Open Auction Scheduler
                                </Button>
                            ) : null
                        }
                    />
                )}

                <div className="flex justify-end gap-3 pt-1">
                    <Button onClick={() => { onClose(); setError(null); }}>Cancel</Button>
                    <Button
                        type="primary"
                        danger
                        icon={<Rocket size={15} />}
                        size="large"
                        loading={launchMutation.isPending}
                        onClick={handleLaunch}
                    >
                        Confirm &amp; Launch
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default LaunchGroupModal;
