import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Card, Alert } from 'antd';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';
import Passbook from '../../components/Passbook';

const { Title, Text } = Typography;

const PortalPassbook = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <Button 
                    icon={<ChevronLeft size={18} />} 
                    size="large" 
                    shape="round" 
                    className="font-bold border-none bg-slate-100 flex items-center justify-center gap-2 self-start"
                    onClick={() => navigate('/portal/my-chits')}
                >
                    Back to My Chits
                </Button>
                <div className="text-left md:text-right">
                    <Title level={2} className="!mb-0 text-slate-800">My Digital Passbook</Title>
                    <Text className="text-slate-500 font-medium">Real-time status of your participation.</Text>
                </div>
            </div>

            <Passbook ticketId={ticketId} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-3xl border-0 shadow-lg bg-indigo-600 text-white p-2">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Info size={24} />
                        </div>
                        <div>
                            <Title level={5} className="!text-white !mb-1">Payment Status</Title>
                            <Text className="text-indigo-100 text-xs">
                                Recent collections by agents will show as "Pending" until verified by the office staff. Verified payments are instantly credited to your ticket.
                            </Text>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-3xl border-0 shadow-lg bg-slate-100 p-2">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-white text-slate-600">
                            <HelpCircle size={24} />
                        </div>
                        <div>
                            <Title level={5} className="!mb-1 text-slate-800">Need Help?</Title>
                            <Text className="text-slate-500 text-xs">
                                If you find any discrepancy in the passbook, please contact your collection agent or visit the branch office.
                            </Text>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PortalPassbook;
