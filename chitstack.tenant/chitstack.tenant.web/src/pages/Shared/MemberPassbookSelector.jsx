import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Input, List, Avatar, Button, Spin, Empty, Tag, Divider, Row, Col, Tooltip } from 'antd';
import { Search, User, BookOpen, ChevronRight, History, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Title, Text } = Typography;

const MemberPassbookSelector = ({ role = 'admin' }) => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);

    // Fetch all members for selection
    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ['members-for-passbook'],
        queryFn: async () => {
            const res = await api.get('/Members');
            return res.data.data || res.data;
        }
    });

    // Fetch tickets for the selected member
    const { data: memberDues, isLoading: loadingDues } = useQuery({
        queryKey: ['member-tickets-passbook', selectedMember?.id],
        queryFn: async () => {
            const res = await api.get(`/Members/${selectedMember.id}/dues`);
            return res.data.data || res.data;
        },
        enabled: !!selectedMember
    });

    const filteredMembers = members.filter(m => 
        !searchText || 
        m.fullName?.toLowerCase().includes(searchText.toLowerCase()) || 
        m.phoneNumber?.includes(searchText)
    );

    const handleSelectMember = (member) => {
        setSelectedMember(member);
        setSearchText(''); // Clear search after selection
    };

    const handleViewPassbook = (ticketId) => {
        const path = role === 'agent' ? `/agent/passbook/${ticketId}` : `/members/passbook/${ticketId}/view`;
        navigate(path);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in p-4 md:p-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">Passbook Ledger</Title>
                        <Text className="text-slate-500 font-medium">Select a subscriber to view their historical transaction history.</Text>
                    </div>
                </div>
                {selectedMember && (
                    <Button 
                        type="dashed" 
                        icon={<History size={16} />} 
                        onClick={() => setSelectedMember(null)}
                        className="rounded-xl font-bold h-10 px-6 border-slate-300 text-slate-500"
                    >
                        Change Member
                    </Button>
                )}
            </div>

            {!selectedMember ? (
                <Card className="shadow-xl border-0 rounded-3xl overflow-hidden p-4">
                    <div className="p-8 border-b border-slate-50">
                        <Input
                            size="large"
                            placeholder="Type name or phone number to find member..."
                            prefix={<Search className="text-slate-400 mr-2" size={20} />}
                            className="h-14 rounded-2xl shadow-sm border-slate-100 hover:border-indigo-400 focus:border-indigo-500"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {loadingMembers ? (
                            <div className="p-12 text-center"><Spin size="large" /></div>
                        ) : filteredMembers.length > 0 ? (
                            <List
                                dataSource={filteredMembers}
                                renderItem={(member) => (
                                    <List.Item 
                                        className="px-6 py-4 hover:bg-slate-50 transition-all cursor-pointer group"
                                        onClick={() => handleSelectMember(member)}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <Avatar size={48} icon={<User size={20} />} className="bg-indigo-100 text-indigo-700" />
                                                <div>
                                                    <Tooltip title={member.fullName}>
                                                        <Title level={5} className="!m-0 group-hover:text-indigo-600 transition-colors truncate max-w-[260px] md:max-w-[340px]">
                                                            {member.fullName}
                                                        </Title>
                                                    </Tooltip>
                                                    <Text type="secondary" className="text-xs font-medium italic">{member.phoneNumber}</Text>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all transform group-hover:translate-x-1" />
                                        </div>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <div className="p-12"><Empty description="No subscribers found matches your search" /></div>
                        )}
                    </div>
                </Card>
            ) : (
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                        <Card className="shadow-lg border-0 rounded-3xl bg-slate-900 border-b-[6px] border-indigo-500 overflow-hidden">
                            <div className="p-8 text-center text-white">
                                <Avatar size={80} icon={<User size={36} />} className="bg-white/10 text-white border-2 border-white/20 mb-4" />
                                <Title level={3} className="!text-white !mb-1 tracking-tight">{selectedMember.fullName}</Title>
                                <Text className="text-indigo-300 font-bold tracking-widest uppercase text-[10px] block mb-6">{selectedMember.phoneNumber}</Text>
                                
                                <div className="space-y-4 pt-6 border-t border-white/10 text-left">
                                    <div className="flex justify-between items-center px-1">
                                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Enrollment Date</Text>
                                        <Text className="text-white text-xs">{new Date(selectedMember.joinedDate).toLocaleDateString()}</Text>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Active Tickets</Text>
                                        <Tag color="indigo" className="m-0 border-0 font-bold px-3">
                                            {memberDues?.ticketDues?.length || 0}
                                        </Tag>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} md={16}>
                        <Card className="shadow-2xl border-0 rounded-[2.5rem] overflow-hidden h-auto" styles={{ body: { padding: 0 } }}>
                            <div className="p-10 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <Title level={4} className="!mb-0 !text-slate-800 tracking-tight">Select Chit Group</Title>
                                    <Text className="text-slate-400 text-xs">Choose a group to open the transaction digital passbook</Text>
                                </div>
                                <MoreHorizontal size={20} className="text-slate-400" />
                            </div>
                            
                            {loadingDues ? (
                                <div className="p-20 text-center"><Spin size="large" /></div>
                            ) : memberDues?.ticketDues?.length > 0 ? (
                                <List
                                    dataSource={memberDues.ticketDues}
                                    renderItem={(ticket) => (
                                        <List.Item 
                                            className="px-8 py-6 hover:bg-slate-50/80 cursor-pointer transition-all border-b border-slate-50 group last:border-0"
                                            onClick={() => handleViewPassbook(ticket.ticketId)}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-900 text-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 transition-all">
                                                        #{ticket.ticketNumber}
                                                    </div>
                                                    <div>
                                                        <Tooltip title={ticket.groupName}>
                                                            <Title level={5} className="!mb-0 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate max-w-[260px] md:max-w-[360px]">
                                                                {ticket.groupName}
                                                            </Title>
                                                        </Tooltip>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest opacity-60">Total Outstanding:</Text>
                                                            <Text className={`font-black text-xs ${ticket.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                ₹{ticket.totalDue.toLocaleString()}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    type="primary" 
                                                    shape="round" 
                                                    className="bg-slate-900 border-none font-bold shadow-md h-10 px-8 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 transition-all duration-300"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewPassbook(ticket.ticketId);
                                                    }}
                                                >
                                                    Open Ledger
                                                </Button>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <div className="p-20 text-center">
                                    <Empty 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                        description="No active tickets found for this member" 
                                    />
                                    <Button type="dashed" className="mt-4" onClick={() => setSelectedMember(null)}>Back to Search</Button>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default MemberPassbookSelector;
