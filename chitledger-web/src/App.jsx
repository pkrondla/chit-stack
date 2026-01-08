import LiveAuction from './pages/Auctions/LiveAuction';

// ... (existing imports)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* ... existing routes ... */}
            <Route path="auctions" element={<Auctions />} />
            <Route path="auctions/console/:auctionId" element={<AuctionConsole />} />
            <Route path="auctions/live/:auctionId" element={<LiveAuction />} />
            <Route path="finance" element={<CollectionEntry />} />
            {/* ... */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

import Groups from './pages/Groups/GroupList';
import CreateGroup from './pages/Groups/CreateGroup';
import EnrollMember from './pages/Groups/EnrollMember';
import GroupTickets from './pages/Groups/GroupTickets';
import Members from './pages/Members/MemberList';
import RegisterMember from './pages/Members/RegisterMember';
import Auctions from './pages/Auctions/AuctionList';
import AuctionConsole from './pages/Auctions/AuctionConsole';
import LiveAuction from './pages/Auctions/LiveAuction';
import CollectionEntry from './pages/Finance/CollectionEntry';
import Payouts from './pages/Finance/Payouts';
import FinancialReports from './pages/Reports/FinancialReports';
import UserManagement from './pages/Admin/UserManagement';
import Tenants from './pages/Admin/Tenants';
import PortalDashboard from './pages/Portal/PortalDashboard';

// Placeholder Pages
const Dashboard = () => <div><h2>Welcome to Dashboard</h2><p>Select a module from the sidebar.</p></div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/new" element={<CreateGroup />} />
            <Route path="groups/enroll" element={<EnrollMember />} />
            <Route path="groups/:groupId/tickets" element={<GroupTickets />} />
            <Route path="members" element={<Members />} />
            <Route path="members/new" element={<RegisterMember />} />
            <Route path="auctions" element={<Auctions />} />
            <Route path="auctions/console/:auctionId" element={<AuctionConsole />} />
            <Route path="auctions/live/:auctionId" element={<LiveAuction />} />
            <Route path="finance" element={<CollectionEntry />} />
            <Route path="finance/payouts" element={<Payouts />} />
            <Route path="reports" element={<FinancialReports />} />
            {/* Admin */}
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/tenants" element={<Tenants />} />
            <Route path="portal" element={<PortalDashboard />} />
            {/* Add more routes here */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
