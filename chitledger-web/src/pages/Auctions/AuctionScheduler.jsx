import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Button, DatePicker, TimePicker, Table, Tag, Typography,
    Alert, Spin, Tooltip, message, Space, Select, Popconfirm
} from 'antd';
import {
    CalendarClock, Save, Wand2, ArrowLeft, CheckCircle,
    Clock, AlertTriangle, Lock, Trash2
} from 'lucide-react';
import api from '../../api/axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchGroups = () => api.get('/ChitGroups').then(r => r.data?.data || []);
const fetchSchedule = (id) => api.get(`/ChitGroups/${id}/schedule`).then(r => r.data?.data || []);
const fetchAllAuctions = () => api.get('/Auctions').then(r => r.data?.data || []);
const fetchPreview = (id, firstDate) =>
    api.get(`/ChitGroups/${id}/schedule-preview?firstAuctionDate=${firstDate}`).then(r => r.data?.data || []);

// ── Component ─────────────────────────────────────────────────────────────────
const AuctionScheduler = () => {
    const { groupId: routeGroupId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedGroupId, setSelectedGroupId] = useState(routeGroupId ? parseInt(routeGroupId) : null);
    const [localSlots, setLocalSlots] = useState(null);   // null = not loaded yet
    const [firstDate, setFirstDate] = useState(null);
    const [firstTime, setFirstTime] = useState(dayjs('16:00', 'HH:mm'));
    const [generating, setGenerating] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Groups list for selector
    const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });
    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    // All scheduled auctions to check for clashes
    const { data: allAuctions = [] } = useQuery({ queryKey: ['all-auctions'], queryFn: fetchAllAuctions });

    // ── Auto-fill defaults from group preferences ─────────────────────────────
    useEffect(() => {
        if (selectedGroup) {
            // 1. Default Time
            if (selectedGroup.auctionTime) {
                // Backend might return "HH:mm:ss" or "HH:mm"
                const t = dayjs(selectedGroup.auctionTime, ['HH:mm:ss', 'HH:mm', 'HH:mm A']);
                if (t.isValid()) {
                    setFirstTime(t);
                }
            }

            // 2. Default Date (suggested based on preference)
            if (!firstDate && selectedGroup.status === 'Proposed') {
                let suggested = dayjs().add(10, 'day'); // Start looking 10 days from now

                if (selectedGroup.auctionScheduleMode === 'FixedDay' && selectedGroup.auctionDayOfMonth) {
                    suggested = dayjs().date(selectedGroup.auctionDayOfMonth);
                    if (suggested.isBefore(dayjs().add(2, 'day'))) {
                        suggested = suggested.add(1, 'month');
                    }
                } else if (selectedGroup.auctionScheduleMode === 'SameWeekday' &&
                    selectedGroup.auctionDayOfWeek !== null && selectedGroup.auctionWeekNumber) {
                    // Find next occurrence (simplified: just start of next month for now)
                    suggested = dayjs().add(1, 'month').startOf('month');
                    // Actual logic to find Nth weekday could go here if needed
                }
                setFirstDate(suggested);
            }
        }
    }, [selectedGroupId, selectedGroup]);

    // Load saved schedule for selected group
    const { data: serverSlots, isLoading: scheduleLoading } = useQuery({
        queryKey: ['group-schedule', selectedGroupId],
        queryFn: () => fetchSchedule(selectedGroupId),
        enabled: !!selectedGroupId,
    });

    // Sync server data to local state
    useEffect(() => {
        if (serverSlots) {
            setLocalSlots(serverSlots);
            setDirty(false);
        }
    }, [serverSlots]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (slots) => api.post(`/ChitGroups/${selectedGroupId}/schedule`, {
            groupId: selectedGroupId,
            slots: slots.map(s => ({
                installmentNumber: s.installmentNumber,
                date: s.scheduledDate || null,
                time: s.scheduledTime || '16:00',
            }))
        }),
        onSuccess: () => {
            message.success('Schedule saved!');
            queryClient.invalidateQueries({ queryKey: ['group-schedule', selectedGroupId] });
            setDirty(false);
        },
        onError: () => message.error('Failed to save schedule'),
    });

    // Auto-generate preview
    const getClashInfo = (date, time, groupTitle) => {
        if (!date || !time) return null;
        const targetDateTime = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm');

        // Find other auctions at the exact same time
        const clash = allAuctions.find(a =>
            a.chitGroupId !== selectedGroupId &&
            dayjs(a.auctionDate).isSame(targetDateTime, 'minute')
        );

        if (clash) {
            return { type: 'error', message: `Clash with ${clash.groupName}` };
        }

        // Check for other auctions on the same day (busy day)
        const sameDay = allAuctions.filter(a =>
            a.chitGroupId !== selectedGroupId &&
            dayjs(a.auctionDate).isSame(targetDateTime, 'day')
        );

        if (sameDay.length > 0) {
            return { type: 'warning', message: `${sameDay.length} other auction(s) on this day` };
        }

        return null;
    };

    const handleGenerate = async () => {
        if (!firstDate || !selectedGroupId) return;
        setGenerating(true);
        try {
            const preview = await fetchPreview(selectedGroupId, firstDate.format('YYYY-MM-DD'));
            // Merge: keep existing closed auction dates, override pending ones
            const merged = (localSlots || []).map(existing => {
                const preview_slot = preview.find(p => p.installmentNumber === existing.installmentNumber);
                if (!preview_slot) return existing;
                if (existing.auctionStatus === 'Closed') return existing; // don't touch completed
                return {
                    ...existing,
                    scheduledDate: preview_slot.scheduledDate,
                    scheduledTime: firstTime ? firstTime.format('HH:mm') : (existing.scheduledTime || '16:00'),
                    adjustmentReason: preview_slot.adjustmentReason,
                    isAdjusted: preview_slot.isAdjusted
                };
            });
            // Fill any slots that had no existing record
            const defaultTime = firstTime ? firstTime.format('HH:mm') : '16:00';
            if (!localSlots || localSlots.length === 0) {
                const fresh = preview.map(p => ({
                    installmentNumber: p.installmentNumber,
                    scheduledDate: p.scheduledDate,
                    scheduledTime: defaultTime,
                    auctionStatus: 'Pending',
                    auctionId: null,
                    adjustmentReason: p.adjustmentReason,
                    isAdjusted: p.isAdjusted
                }));
                setLocalSlots(fresh);
            } else {
                setLocalSlots(merged);
            }
            setDirty(true);
        } catch {
            message.error('Failed to generate schedule preview');
        } finally {
            setGenerating(false);
        }
    };

    const handleClear = () => {
        if (!localSlots) return;
        const cleared = localSlots.map(s => {
            if (s.auctionStatus === 'Closed') return s;
            return {
                ...s,
                scheduledDate: null,
                scheduledTime: '16:00',
                auctionStatus: 'Pending',
                isAdjusted: false,
                adjustmentReason: null
            };
        });
        setLocalSlots(cleared);
        setDirty(true);
        message.info('Schedule cleared (unsaved)');
    };

    const updateSlot = (installmentNumber, field, value) => {
        setLocalSlots(prev => prev.map(s =>
            s.installmentNumber === installmentNumber ? { ...s, [field]: value } : s
        ));
        setDirty(true);
    };

    // Stats
    const totalSlots = localSlots?.length || 0;
    const filledSlots = localSlots?.filter(s => s.scheduledDate).length || 0;
    const completedSlots = localSlots?.filter(s => s.auctionStatus === 'Closed').length || 0;
    const pendingSlots = totalSlots - filledSlots;

    const columns = [
        {
            title: '#',
            dataIndex: 'installmentNumber',
            width: 44,
            render: (n) => <span className="font-bold text-slate-400 text-sm">{n}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'auctionStatus',
            width: 110,
            render: (status) => {
                const map = {
                    Closed: { color: 'success', label: 'Completed' },
                    Open: { color: 'processing', label: 'In Progress' },
                    Scheduled: { color: 'blue', label: 'Scheduled' },
                    Pending: { color: 'default', label: 'Not Set' },
                };
                const s = map[status] || map.Pending;
                return <Tag color={s.color}>{s.label}</Tag>;
            }
        },
        {
            title: 'Auction Date',
            key: 'date',
            render: (_, slot) => {
                const clash = getClashInfo(slot.scheduledDate, slot.scheduledTime);
                const isClosed = slot.auctionStatus === 'Closed';

                return (
                    <div className="flex flex-col">
                        <Space size={4} className="items-center">
                            {isClosed ? (
                                <Space size={6}>
                                    <Lock size={13} className="text-slate-400" />
                                    <Text className="text-slate-500">
                                        {slot.scheduledDate ? dayjs(slot.scheduledDate).format('ddd, DD MMM YYYY') : '—'}
                                    </Text>
                                </Space>
                            ) : (
                                <DatePicker
                                    value={slot.scheduledDate ? dayjs(slot.scheduledDate) : null}
                                    format="ddd, DD MMM YYYY"
                                    size="middle"
                                    disabledDate={(d) => d.day() === 0}
                                    onChange={(val) => updateSlot(slot.installmentNumber, 'scheduledDate', val ? val.format('YYYY-MM-DD') : null)}
                                    allowClear
                                    placeholder="Pick date"
                                    status={clash?.type === 'error' ? 'error' : (clash?.type === 'warning' ? 'warning' : '')}
                                    className={slot.isAdjusted ? "border-amber-200 bg-amber-50" : ""}
                                    style={{ width: 200 }}
                                />
                            )}

                            {clash && (
                                <Tooltip title={clash.message}>
                                    {clash.type === 'error' ? (
                                        <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                                    ) : (
                                        <Clock size={16} className="text-amber-500" />
                                    )}
                                </Tooltip>
                            )}
                        </Space>

                        {slot.adjustmentReason && (
                            <Text type="warning" className="text-[10px] mt-0.5 ml-1 flex items-center gap-1">
                                <AlertTriangle size={10} /> {slot.adjustmentReason}
                            </Text>
                        )}

                        {clash && !isClosed && (
                            <Text type={clash.type === 'error' ? 'danger' : 'warning'} className="text-[10px] mt-0.5 ml-1">
                                {clash.message}
                            </Text>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Time',
            key: 'time',
            width: 140,
            render: (_, slot) => {
                const clash = getClashInfo(slot.scheduledDate, slot.scheduledTime);
                const isClosed = slot.auctionStatus === 'Closed';

                if (isClosed) {
                    return <Text className="text-slate-400">{slot.scheduledTime || '—'}</Text>;
                }
                return (
                    <TimePicker
                        value={slot.scheduledTime ? dayjs(slot.scheduledTime, 'HH:mm') : dayjs('16:00', 'HH:mm')}
                        format="hh:mm A"
                        minuteStep={15}
                        size="middle"
                        allowClear={false}
                        status={clash?.type === 'error' ? 'error' : ''}
                        onChange={(val) => updateSlot(slot.installmentNumber, 'scheduledTime', val ? val.format('HH:mm') : '16:00')}
                        style={{ width: 120 }}
                    />
                );
            }
        },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    icon={<ArrowLeft size={16} />}
                    onClick={() => navigate('/groups')}
                    type="text"
                    className="text-slate-500"
                />
                <CalendarClock size={24} className="text-slate-600" />
                <Title level={2} className="!mb-0 text-slate-800">Auction Scheduler</Title>
            </div>

            {/* Group Selector */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1" style={{ minWidth: 240 }}>
                        <div className="text-xs font-semibold text-slate-500 mb-1">Chit Group</div>
                        <Select
                            value={selectedGroupId}
                            onChange={(val) => { setSelectedGroupId(val); setLocalSlots(null); setDirty(false); }}
                            placeholder="Select a chit group"
                            size="large"
                            style={{ width: '100%' }}
                            options={groups.map(g => ({
                                value: g.id,
                                label: `${g.groupName}  (${g.durationMonths} months — ${g.status})`
                            }))}
                        />
                    </div>

                    {selectedGroupId && (
                        <>
                            <div>
                                <div className="text-xs font-semibold text-slate-500 mb-1">First Auction Date</div>
                                <DatePicker
                                    value={firstDate}
                                    onChange={setFirstDate}
                                    format="DD MMM YYYY"
                                    size="large"
                                    disabledDate={(d) => d.day() === 0}
                                    placeholder="Pick start date"
                                />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-slate-500 mb-1">First Auction Time</div>
                                <TimePicker
                                    value={firstTime}
                                    onChange={(val) => setFirstTime(val || dayjs('16:00', 'HH:mm'))}
                                    format="hh:mm A"
                                    minuteStep={15}
                                    size="large"
                                    allowClear={false}
                                    placeholder="Select time"
                                />
                            </div>
                            <Tooltip title={!firstDate ? 'Select a first auction date to auto-generate' : ''}>
                                <Button
                                    icon={<Wand2 size={16} />}
                                    size="large"
                                    onClick={handleGenerate}
                                    loading={generating}
                                    disabled={!firstDate}
                                >
                                    Auto-Generate
                                </Button>
                            </Tooltip>

                            <Popconfirm
                                title="Clear all scheduled dates?"
                                description="This will reset all non-completed auction dates. You will need to click 'Save Schedule' to persist this change."
                                onConfirm={handleClear}
                                okText="Yes, Clear"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    icon={<Trash2 size={16} />}
                                    size="large"
                                    danger
                                    disabled={!localSlots || localSlots.every(s => s.auctionStatus === 'Closed')}
                                >
                                    Clear
                                </Button>
                            </Popconfirm>
                        </>
                    )}
                </div>

                {/* Schedule mode info */}
                {selectedGroup?.auctionScheduleMode && (
                    <div className="mt-3 text-sm text-slate-500 bg-blue-50 rounded-lg px-3 py-2">
                        <strong>Schedule mode:</strong>{' '}
                        {selectedGroup.auctionScheduleMode === 'FixedDay'
                            ? `Every ${selectedGroup.auctionDayOfMonth}${['th', 'st', 'nd', 'rd'][Math.min(selectedGroup.auctionDayOfMonth % 10, 3)] || 'th'} of the month`
                            : `${['Last', '1st', '2nd', '3rd', '4th'][selectedGroup.auctionWeekNumber] || '#'} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedGroup.auctionDayOfWeek] || ''} of each month`
                        }
                        {selectedGroup.auctionTime && <> · <strong>{selectedGroup.auctionTime}</strong></>}
                    </div>
                )}
            </div>

            {/* Schedule Table */}
            {selectedGroupId && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                    {/* Stats bar */}
                    {localSlots && localSlots.length > 0 && (
                        <div className="flex items-center gap-6 px-5 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle size={15} className="text-green-500" />
                                <span>{filledSlots} / {totalSlots} dates set</span>
                            </div>
                            {completedSlots > 0 && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Lock size={14} className="text-slate-400" />
                                    <span>{completedSlots} completed</span>
                                </div>
                            )}
                            {pendingSlots > 0 && (
                                <div className="flex items-center gap-2 text-sm text-amber-600">
                                    <AlertTriangle size={14} />
                                    <span>{pendingSlots} not set</span>
                                </div>
                            )}
                            <div className="flex-1" />
                        </div>
                    )}

                    {scheduleLoading ? (
                        <div className="flex justify-center p-12"><Spin size="large" /></div>
                    ) : !localSlots || localSlots.length === 0 ? (
                        <div className="p-12 text-center">
                            <CalendarClock size={40} className="text-slate-300 mx-auto mb-3" />
                            <Text className="text-slate-400 block mb-2">No schedule yet for this group.</Text>
                            <Text className="text-slate-400 text-sm block">
                                Pick a first auction date above and click <strong>Auto-Generate</strong>, or manually set each date below.
                            </Text>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={localSlots}
                            rowKey="installmentNumber"
                            pagination={false}
                            size="middle"
                            rowClassName={(s) => s.auctionStatus === 'Closed' ? 'opacity-60' : ''}
                            footer={() => (
                                <div className="flex justify-end gap-3 pt-1">
                                    <Button
                                        type="primary"
                                        icon={<Save size={15} />}
                                        size="large"
                                        className="bg-slate-900"
                                        loading={saveMutation.isPending}
                                        disabled={!dirty}
                                        onClick={() => saveMutation.mutate(localSlots)}
                                    >
                                        Save Schedule
                                    </Button>
                                </div>
                            )}
                        />
                    )}
                </div>
            )}

            {/* Launch readiness hint */}
            {localSlots && pendingSlots > 0 && selectedGroup?.status === 'Proposed' && (
                <Alert
                    className="mt-4"
                    type="warning"
                    showIcon
                    message={`${pendingSlots} month(s) still have no date set. Set all dates before launching the group.`}
                />
            )}
            {localSlots && pendingSlots === 0 && totalSlots > 0 && selectedGroup?.status === 'Proposed' && (
                <Alert
                    className="mt-4"
                    type="success"
                    showIcon
                    message="All auction dates are set! You can now launch this group from Chit Groups → ⋮ Actions → Launch Group."
                />
            )}
        </div>
    );
};

export default AuctionScheduler;
