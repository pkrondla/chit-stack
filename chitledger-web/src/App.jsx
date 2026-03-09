import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Layout from './components/Layout';

import Groups from './pages/Groups/GroupList';
import CreateGroup from './pages/Groups/CreateGroup';
import EditGroup from './pages/Groups/EditGroup';
import EnrollMember from './pages/Groups/EnrollMember';
import GroupTickets from './pages/Groups/GroupTickets';
import Members from './pages/Members/MemberList';
import RegisterMember from './pages/Members/RegisterMember';
import MemberDetails from './pages/Members/MemberDetails';
import EditMember from './pages/Members/EditMember';
import Auctions from './pages/Auctions/AuctionList';
import AuctionConsole from './pages/Auctions/AuctionConsole';
import LiveAuction from './pages/Auctions/LiveAuction';
import CollectionEntry from './pages/Finance/CollectionEntry';
import Payouts from './pages/Finance/Payouts';
import FinancialReports from './pages/Reports/FinancialReports';
import UserManagement from './pages/Admin/UserManagement';
import PortalDashboard from './pages/Portal/PortalDashboard';

// Placeholder Pages
const Dashboard = () => <div><h2>Welcome to Dashboard</h2><p>Select a module from the sidebar.</p></div>;

import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/new" element={<CreateGroup />} />
          <Route path="groups/:id/edit" element={<EditGroup />} />
          <Route path="groups/enroll" element={<EnrollMember />} />
          <Route path="groups/:groupId/tickets" element={<GroupTickets />} />
          <Route path="members" element={<Members />} />
          <Route path="members/new" element={<RegisterMember />} />
          <Route path="members/:id" element={<MemberDetails />} />
          <Route path="members/:id/edit" element={<EditMember />} />
          <Route path="auctions" element={<Auctions />} />
          <Route path="auctions/console/:auctionId" element={<AuctionConsole />} />
          <Route path="auctions/live/:auctionId" element={<LiveAuction />} />
          <Route path="finance" element={<CollectionEntry />} />
          <Route path="finance/payouts" element={<Payouts />} />
          <Route path="reports" element={<FinancialReports />} />
          {/* Admin */}
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="portal" element={<PortalDashboard />} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
