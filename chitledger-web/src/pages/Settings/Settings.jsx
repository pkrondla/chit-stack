import { Typography, Tabs } from 'antd';
import CompanySettings from './CompanySettings';
import HolidaySettings from './HolidaySettings';
import AuctionSettings from './AuctionSettings';
import NotificationSettings from './NotificationSettings';
import { Building2, CalendarX2, SlidersHorizontal, Gavel, Bell } from 'lucide-react';

const { Title, Text } = Typography;

const tabs = [
    {
        key: 'company',
        label: (
            <span className="flex items-center gap-2">
                <Building2 size={15} />
                Company Profile
            </span>
        ),
        children: <CompanySettings />,
    },
    {
        key: 'holidays',
        label: (
            <span className="flex items-center gap-2">
                <CalendarX2 size={15} />
                Holidays
            </span>
        ),
        children: <HolidaySettings />,
    },
    {
        key: 'auctions',
        label: (
            <span className="flex items-center gap-2">
                <Gavel size={15} />
                Auctions
            </span>
        ),
        children: <AuctionSettings />,
    },
    {
        key: 'notifications',
        label: (
            <span className="flex items-center gap-2">
                <Bell size={15} />
                Notifications
            </span>
        ),
        children: <NotificationSettings />,
    },
];

const Settings = () => {
    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-3 mb-6">
                <SlidersHorizontal size={28} className="text-slate-700" />
                <div>
                    <Title level={2} className="!mb-0 text-slate-800">Settings</Title>
                    <Text className="text-slate-500">Manage your company profile and application preferences.</Text>
                </div>
            </div>

            <Tabs
                defaultActiveKey="company"
                items={tabs}
                type="card"
                className="settings-tabs"
            />
        </div>
    );
};

export default Settings;
