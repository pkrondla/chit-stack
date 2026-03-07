import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Typography, Tag, Space, Spin } from 'antd';
import { Gavel, Play, Eye } from 'lucide-react';
import api from '../../api/axios';

const { Title, Text } = Typography;

const Auctions = () => {
    const navigate = useNavigate();

    const { data: auctions = [], isLoading } = useQuery({
        queryKey: ['auctions'],
        queryFn: async () => {
            const res = await api.get('/Auctions');
            return res.data.data || res.data;
        }
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="!mb-0 text-slate-800">Auction Board</Title>
            </div>

            {isLoading ? <div className="flex justify-center p-12"><Spin size="large" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {auctions.map(auction => (
                        <Card
                            key={auction.id}
                            className={`shadow-sm border-l-4 ${auction.auctionStatus === 'Closed' ? 'border-l-green-700' : 'border-l-yellow-500'}`}
                            styles={{ body: { padding: '1.5rem' } }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <Text className="font-bold text-slate-500 text-sm">
                                    {new Date(auction.auctionDate).toLocaleDateString()}
                                </Text>
                                <Tag color={auction.auctionStatus === 'Closed' ? 'success' : 'warning'} className="rounded-full font-bold px-3 m-0">
                                    {auction.auctionStatus}
                                </Tag>
                            </div>

                            <Title level={4} className="!mb-1 text-slate-800">{auction.groupName}</Title>
                            <div className="mb-4 text-sm text-slate-500">Installment #{auction.installmentNumber}</div>

                            {auction.auctionStatus === 'Closed' ? (
                                <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm">
                                    <div className="flex justify-between mb-2">
                                        <Text>Winning Bid:</Text>
                                        <Text strong>₹{auction.winningBidAmount?.toLocaleString()}</Text>
                                    </div>
                                    <div className="flex justify-between">
                                        <Text>Dividend:</Text>
                                        <Text strong className="text-green-700">₹{auction.dividendAmount?.toLocaleString()}</Text>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 italic text-slate-400 text-sm">
                                    Ready to conduct auction.
                                </div>
                            )}

                            <Space direction="vertical" className="w-full">
                                <Button
                                    type={auction.auctionStatus === 'Closed' ? 'default' : 'primary'}
                                    className={`w-full ${auction.auctionStatus !== 'Closed' ? 'bg-slate-900 border-none flex items-center justify-center' : 'flex items-center justify-center'}`}
                                    size="large"
                                    icon={auction.auctionStatus === 'Closed' ? <Eye size={18} /> : <Play size={18} />}
                                    onClick={() => navigate(`/auctions/console/${auction.id}`)}
                                >
                                    {auction.auctionStatus === 'Closed' ? 'View Details' : 'Start Console'}
                                </Button>

                                {auction.auctionStatus !== 'Closed' && (
                                    <Button
                                        type="primary"
                                        danger
                                        className="w-full flex items-center justify-center"
                                        size="large"
                                        icon={<Gavel size={18} />}
                                        onClick={() => navigate(`/auctions/live/${auction.id}`)}
                                    >
                                        Enter Live Room
                                    </Button>
                                )}
                            </Space>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Auctions;
