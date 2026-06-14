import { Button, Typography } from 'antd';
import { Clock, ArrowRight, Mail } from 'lucide-react';

const { Title, Paragraph } = Typography;

const GLOBAL_PORTAL = import.meta.env.VITE_GLOBAL_PORTAL_URL || 'http://localhost:5062';

export default function TrialExpired() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                <Clock size={40} className="text-indigo-300" />
            </div>

            <Title level={1} className="text-white m-0 text-center" style={{ color: 'white' }}>
                Your demo trial has ended
            </Title>

            <Paragraph className="text-slate-300 text-lg text-center max-w-md mt-4">
                Subscribe to get your own dedicated ChitStack portal with all your data,
                custom settings, and full administrative control.
            </Paragraph>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRight size={18} />}
                    href={`${GLOBAL_PORTAL}/subscribe`}
                    className="bg-indigo-600 border-indigo-600 px-8"
                >
                    Explore Plans & Subscribe
                </Button>
                <Button
                    size="large"
                    icon={<Mail size={18} />}
                    href="mailto:support@chitstack.com"
                    className="border-slate-400 text-slate-300 hover:text-white hover:border-white"
                >
                    Contact Support
                </Button>
            </div>

            <div className="mt-12 text-center text-slate-500 text-sm">
                <p>Already subscribed? Your dedicated portal link was sent to your email.</p>
            </div>
        </div>
    );
}
