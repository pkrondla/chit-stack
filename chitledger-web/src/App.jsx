import { lazy, Suspense } from 'react';
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
import AuctionScheduler from './pages/Auctions/AuctionScheduler';
import LiveAuction from './pages/Auctions/LiveAuction';
import CollectionEntry from './pages/Finance/CollectionEntry';
const Payouts = lazy(() => import('./pages/Finance/Payouts'));
const VoucherEntry = lazy(() => import('./pages/Finance/VoucherEntry'));
import StatutoryForms from './pages/Reports/StatutoryForms';
import FinancialReports from './pages/Reports/FinancialReports';
import UserManagement from './pages/Admin/UserManagement';
import Settings from './pages/Settings/Settings';
import ChartOfAccounts from './pages/Finance/ChartOfAccounts';
import BankReconciliation from './pages/Finance/BankReconciliation';
import AuditorDashboard from './pages/Admin/AuditorDashboard';
import PortalDashboard from './pages/Portal/PortalDashboard';
import MyChits from './pages/Portal/MyChits';
import MyAuctions from './pages/Portal/MyAuctions';
import MyPayments from './pages/Portal/MyPayments';
const PortalPassbook = lazy(() => import('./pages/Portal/PortalPassbook'));
import MemberLayout from './components/MemberLayout';

const AgentDashboard = lazy(() => import('./pages/Agent/AgentDashboard'));
const AgentRoute = lazy(() => import('./pages/Agent/AgentRoute'));
const CollectPayment = lazy(() => import('./pages/Agent/CollectPayment'));
const VacantTickets = lazy(() => import('./pages/Agent/VacantTickets'));
const AgentPassbook = lazy(() => import('./pages/Agent/AgentPassbook'));
const RouteSummary = lazy(() => import('./pages/Agent/RouteSummary'));

const SubmissionReconciliation = lazy(() => import('./pages/Admin/SubmissionReconciliation'));
const RouteManagement = lazy(() => import('./pages/Admin/RouteManagement'));
const MemberPassbookSelector = lazy(() => import('./pages/Shared/MemberPassbookSelector'));

// Placeholder Pages
const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'Subscriber') {
    return <Navigate to="/portal" replace />;
  }
  return <div><h2>Welcome to Dashboard</h2><p>Select a module from the sidebar.</p></div>;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Member Portal Routes */}
          <Route path="/portal" element={<ProtectedRoute allowedRoles={['Subscriber']}><MemberLayout /></ProtectedRoute>}>
            <Route index element={<PortalDashboard />} />
            <Route path="my-chits" element={<MyChits />} />
            <Route path="auctions" element={<MyAuctions />} />
            <Route path="auctions/live/:auctionId" element={<LiveAuction />} />
            <Route path="payments" element={<MyPayments />} />
            <Route path="passbook/:ticketId" element={<PortalPassbook />} />
          </Route>

          {/* Staff / Admin Routes */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Staff', 'Auditor']}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/new" element={<CreateGroup />} />
            <Route path="groups/:id/edit" element={<EditGroup />} />
            <Route path="groups/enroll" element={<EnrollMember />} />
            <Route path="groups/:groupId/tickets" element={<GroupTickets />} />
            <Route path="members" element={<Members />} />
            <Route path="members/passbook" element={<MemberPassbookSelector role="admin" />} />
            <Route path="members/passbook/:ticketId/view" element={<AgentPassbook />} />
            <Route path="members/new" element={<RegisterMember />} />
            <Route path="members/:id" element={<MemberDetails />} />
            <Route path="members/:id/edit" element={<EditMember />} />
            <Route path="auctions" element={<Auctions />} />
            <Route path="auctions/console/:auctionId" element={<AuctionConsole />} />
            <Route path="auctions/live/:auctionId" element={<LiveAuction />} />
            <Route path="groups/:groupId/scheduler" element={<AuctionScheduler />} />
            <Route path="finance" element={<CollectionEntry />} />
            <Route path="finance/payouts" element={<Payouts />} />
            <Route path="finance/vouchers" element={<VoucherEntry />} />
            <Route path="finance/accounts" element={<ChartOfAccounts />} />
            <Route path="finance/reconciliation" element={<BankReconciliation />} />
            <Route path="reports" element={<FinancialReports />} />
            <Route path="reports/statutory" element={<StatutoryForms />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/auditor" element={<AuditorDashboard />} />
            <Route path="admin/reconciliation" element={<SubmissionReconciliation />} />
            <Route path="admin/routes" element={<RouteManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Agent Portal Routes */}
          <Route path="/agent" element={<ProtectedRoute allowedRoles={['Agent', 'Admin', 'Staff']}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="route" element={<AgentRoute />} />
            <Route path="passbook-selector" element={<MemberPassbookSelector role="agent" />} />
            <Route path="collect/:memberId" element={<CollectPayment />} />
            <Route path="vacancies" element={<VacantTickets />} />
            <Route path="summary" element={<RouteSummary />} />
            <Route path="passbook/:ticketId" element={<AgentPassbook />} />
        </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
