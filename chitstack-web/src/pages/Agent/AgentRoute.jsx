import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Spin, Alert, App, Button } from 'antd';
import { Navigation, MapPin, IndianRupee } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const { Title, Text } = Typography;

const AgentRoute = () => {
    const navigate = useNavigate();

    const { data: routeMembers = [], isLoading, error } = useQuery({
        queryKey: ['agent-route-map'],
        queryFn: async () => {
            const res = await api.get('/Collections/route-members');
            return res.data.data || res.data;
        }
    });

    const locations = routeMembers.filter(m => m.latitude && m.longitude);
    const center = locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : [13.0827, 80.2707]; // Chennai default

    if (isLoading) return <div className="p-12 text-center"><Spin size="large" /></div>;

    return (
        <div className="space-y-6">
            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden p-0" styles={{ body: { padding: 0 } }}>
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <Title level={4} className="!text-white !mb-0">Route Visualization</Title>
                        <Text className="text-slate-400">Sequence of {locations.length} collection points</Text>
                    </div>
                    <Button 
                        type="primary" 
                        size="large" 
                        className="bg-blue-600 border-none font-bold rounded-xl"
                        icon={<Navigation size={18} />}
                        onClick={() => navigate('/agent/dashboard')}
                    >
                        Back to List
                    </Button>
                </div>

                <div className="h-[70vh] w-full">
                    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {locations.map((m) => (
                            <Marker key={m.memberId} position={[m.latitude, m.longitude]}>
                                <Popup>
                                    <div className="p-2">
                                        <Text strong className="block text-base">{m.fullName}</Text>
                                        <Text className="text-xs text-slate-500 mb-2 block">{m.address}</Text>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                            <span className="text-rose-600 font-bold">₹{m.totalOutstanding.toLocaleString()}</span>
                                            <Button size="small" type="primary" className="bg-slate-900" onClick={() => navigate(`/agent/collect/${m.memberId}`)}>Collect</Button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert
                    message="Optimized Route Flow"
                    description="Points are ordered by walking distance if GPS sequence is enabled in settings."
                    type="info"
                    showIcon
                    className="rounded-2xl"
                />
                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl items-center text-slate-500 border border-dashed border-slate-300">
                    <MapPin size={24} className="text-blue-500" />
                    <Text className="text-xs">GPS access is required for real-time navigation and point-of-receipt checkins.</Text>
                </div>
            </div>
        </div>
    );
};

export default AgentRoute;
