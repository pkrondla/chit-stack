import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Card, Alert } from 'antd';
import { ChevronLeft, Info } from 'lucide-react';
import Passbook from '../../components/Passbook';

const { Title, Text } = Typography;

const AgentPassbook = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <Button 
                    icon={<ChevronLeft size={18} />} 
                    size="large" 
                    shape="round" 
                    className="font-bold border-none bg-slate-100 flex items-center justify-center gap-2"
                    onClick={() => navigate(-1)}
                >
                    Back to Field
                </Button>
                <div className="text-right">
                    <Title level={4} className="!mb-0">Member Passbook</Title>
                    <Text className="text-slate-500 font-medium">Full Transaction Audit</Text>
                </div>
            </div>

            <Passbook ticketId={ticketId} />

            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col items-center text-center">
                <div className="bg-white/10 p-4 rounded-full mb-6">
                    <Info className="text-blue-400" size={32} />
                </div>
                <Title level={3} className="!text-white !mb-2">Need a Physical Copy?</Title>
                <Text className="!text-white/60 max-w-md mx-auto mb-8 font-medium italic block">
                    This digital passbook is real-time and legally compliant. You can share this screen with the member or print it from the office portal.
                </Text>
                <Button 
                    ghost 
                    size="large" 
                    shape="round" 
                    className="border-2 font-black px-12 h-14 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white transition-all shadow-lg"
                    onClick={() => window.print()}
                >
                    Generate PDF / Print
                </Button>
            </div>

            <style>{`
                @media print {
                    .ant-layout-sider, .ant-layout-header, .ant-btn, .bg-slate-900.p-8 {
                        display: none !important;
                    }
                    .ant-layout-content {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .ant-card {
                        box-shadow: none !important;
                        border: 1px solid #eee !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AgentPassbook;
