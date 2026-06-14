import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Form, Input, InputNumber, Switch, Button, Tabs,
  Typography, Space, Alert, Spin, message, Divider, Badge
} from 'antd';
import { Save, Settings2, Mail, Server, CreditCard } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;
const SECRET_MASK = '••••••••';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const byGroup = (settings, group) =>
  settings.filter(s => s.group === group);

const toFormValues = (settings, group) =>
  Object.fromEntries(byGroup(settings, group).map(s => [s.key, s.value ?? '']));

const buildPayload = (group, changed, original) =>
  Object.entries(changed).map(([key, value]) => {
    const orig = original.find(s => s.group === group && s.key === key);
    // Do not send masked placeholder back for secret fields
    if (orig?.isSecret && value === SECRET_MASK) return null;
    return { group, key, value: value === '' ? null : String(value) };
  }).filter(Boolean);

// ──────────────────────────────────────────────────────────────────────────────
// Reusable group panel
// ──────────────────────────────────────────────────────────────────────────────
function SettingsPanel({ group, settings, onSave, saving }) {
  const [form] = Form.useForm();
  const groupSettings = byGroup(settings, group);

  const initialValues = useMemo(() => toFormValues(settings, group), [settings, group]);

  const handleSave = async () => {
    const values = await form.validateFields();
    const items = buildPayload(group, values, settings);
    await onSave(items);
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      {groupSettings.map(s => (
        <Form.Item
          key={s.key}
          name={s.key}
          label={
            <Space size={4}>
              <span>{formatLabel(s.key)}</span>
              {s.isSecret && <Badge color="gold" text="Secret" />}
            </Space>
          }
          extra={s.description}
          valuePropName={s.key === 'SmtpUseSsl' ? 'checked' : undefined}
        >
          {s.key === 'SmtpPort' || s.key === 'TrialDays' || s.key === 'DemoTenantId' || s.key === 'DemoBranchId' ? (
            <InputNumber min={1} style={{ width: 120 }} />
          ) : s.key === 'SmtpUseSsl' ? (
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          ) : s.isSecret ? (
            <Input.Password
              placeholder={s.value == null ? 'Not set' : SECRET_MASK}
              autoComplete="new-password"
            />
          ) : (
            <Input />
          )}
        </Form.Item>
      ))}
      <Divider />
      <Button
        type="primary"
        icon={<Save size={14} />}
        loading={saving}
        onClick={handleSave}
      >
        Save {group} Settings
      </Button>
    </Form>
  );
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────────────
export default function Settings() {
  const qc = useQueryClient();
  const [savingGroup, setSavingGroup] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['global-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: items =>
      api.put('/admin/settings', { settings: items, updatedBy: 'Admin' }),
    onSuccess: () => {
      message.success('Settings saved successfully.');
      qc.invalidateQueries({ queryKey: ['global-settings'] });
    },
    onError: () => message.error('Failed to save settings.'),
    onSettled: () => setSavingGroup(null),
  });

  const handleSave = async (group, items) => {
    if (!items.length) { message.info('No changes to save.'); return; }
    setSavingGroup(group);
    mutation.mutate(items);
  };

  if (isLoading) return <Spin className="m-8" />;
  if (error) return <Alert type="error" message="Failed to load settings." className="m-8" />;

  const settings = data ?? [];

  const tabs = [
    {
      key: 'DemoStamp',
      label: <Space><Server size={14} />Demo Stamp</Space>,
      children: (
        <SettingsPanel
          group="DemoStamp"
          settings={settings}
          onSave={items => handleSave('DemoStamp', items)}
          saving={savingGroup === 'DemoStamp' && mutation.isPending}
        />
      ),
    },
    {
      key: 'Platform',
      label: <Space><CreditCard size={14} />Platform & Payments</Space>,
      children: (
        <SettingsPanel
          group="Platform"
          settings={settings}
          onSave={items => handleSave('Platform', items)}
          saving={savingGroup === 'Platform' && mutation.isPending}
        />
      ),
    },
    {
      key: 'Email',
      label: <Space><Mail size={14} />Email / SMTP</Space>,
      children: (
        <SettingsPanel
          group="Email"
          settings={settings}
          onSave={items => handleSave('Email', items)}
          saving={savingGroup === 'Email' && mutation.isPending}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <Space direction="vertical" className="w-full" size={16}>
        <div className="flex items-center gap-3">
          <Settings2 size={24} className="text-indigo-600" />
          <div>
            <Title level={4} className="!mb-0">Platform Settings</Title>
            <Text type="secondary">
              Manage demo stamp, payment, and email configuration. Changes take effect within 5 minutes.
            </Text>
          </div>
        </div>

        <Alert
          type="info"
          showIcon
          message="Secret fields"
          description="Fields marked as Secret are write-only — their current values are never sent to the browser. Enter a new value to update, or leave blank to keep the existing value unchanged."
        />

        <Card>
          <Tabs items={tabs} />
        </Card>
      </Space>
    </div>
  );
}
