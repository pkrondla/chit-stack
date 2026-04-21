import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Card, Row, Col, Layout } from 'antd';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';
import Passbook from '../../components/Passbook';
import { semanticColors } from '../../theme/tokens';

const { Title, Text } = Typography;
const { Content } = Layout;

const PortalPassbook = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();

    return (
        <Layout style={{ background: 'transparent' }}>
            <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '0 4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <Button 
                            icon={<ChevronLeft size={18} />} 
                            size="large" 
                            style={{ borderRadius: '24px', fontWeight: 'bold', border: 'none', background: semanticColors.borderSoft, display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => navigate('/portal/my-chits')}
                        >
                            Back to My Chits
                        </Button>
                        <div style={{ textAlign: 'right' }}>
                            <Title level={2} style={{ margin: 0, color: semanticColors.textStrong }}>My Digital Passbook</Title>
                            <Text type="secondary" style={{ fontWeight: 500 }}>Real-time status of your participation.</Text>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <Passbook ticketId={ticketId} />
                </div>

                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Card 
                            bordered={false} 
                            style={{ borderRadius: '24px', background: semanticColors.primary, boxShadow: '0 8px 24px rgba(79,70,229,0.15)' }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Space align="start" size={16}>
                                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '16px', color: 'white' }}>
                                    <Info size={24} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: 'white', margin: '0 0 8px 0' }}>Payment Status</Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: '1.6' }}>
                                        Recent collections by agents will show as "Pending" until verified by the office staff. Verified payments are instantly credited to your ticket.
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card 
                            bordered={false} 
                            style={{ borderRadius: '24px', background: semanticColors.appBg, border: `1px solid ${semanticColors.borderSoft}` }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Space align="start" size={16}>
                                <div style={{ background: semanticColors.surface, padding: '12px', borderRadius: '16px', color: semanticColors.textSecondary, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <Title level={5} style={{ color: semanticColors.textStrong, margin: '0 0 8px 0' }}>Need Help?</Title>
                                    <Text type="secondary" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                        If you find any discrepancy in the passbook, please contact your collection agent or visit the branch office.
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default PortalPassbook;
