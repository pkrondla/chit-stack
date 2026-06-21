import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Loading from './components/Loading';

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const TrialExpired = lazy(() => import('./pages/TrialExpired'));

// Feature Pages
const Groups = lazy(() => import('./pages/Groups/GroupList'));
const CreateGroup = lazy(() => import('./pages/Groups/CreateGroup'));
const EditGroup = lazy(() => import('./pages/Groups/EditGroup'));
const EnrollMember = lazy(() => import('./pages/Groups/EnrollMember'));
const GroupTickets = lazy(() => import('./pages/Groups/GroupTickets'));
const Members = lazy(() => import('./pages/Members/MemberList'));
const RegisterMember = lazy(() => import('./pages/Members/RegisterMember'));
const MemberDetails = lazy(() => import('./pages/Members/MemberDetails'));
const EditMember = lazy(() => import('./pages/Members/EditMember'));
const Auctions = lazy(() => import('./pages/Auctions/AuctionList'));
const AuctionConsole = lazy(() => import('./pages/Auctions/AuctionConsole'));
const LiveAuction = lazy(() => import('./pages/Auctions/LiveAuction'));
const AuctionScheduler = lazy(() => import('./pages/Auctions/AuctionScheduler'));
const CollectionEntry = lazy(() => import('./pages/Finance/CollectionEntry'));
const Payouts = lazy(() => import('./pages/Finance/Payouts'));
const VoucherEntry = lazy(() => import('./pages/Finance/VoucherEntry'));
const ChartOfAccounts = lazy(() => import('./pages/Finance/ChartOfAccounts'));
const BankReconciliation = lazy(() => import('./pages/Finance/BankReconciliation'));
const FinancialReports = lazy(() => import('./pages/Reports/FinancialReports'));
const StatutoryForms = lazy(() => import('./pages/Reports/StatutoryForms'));
const ArrearsReport = lazy(() => import('./pages/Reports/ArrearsReport'));
const AgentPerformance = lazy(() => import('./pages/Reports/AgentPerformance'));

// Member Portal
import MemberPassbookSelector from './pages/Shared/MemberPassbookSelector';
import AgentPassbook from './pages/Agent/AgentPassbook';
import MyPayments from './pages/Portal/MyPayments';
const PortalDashboard = lazy(() => import('./pages/Portal/PortalDashboard'));
const MyChits = lazy(() => import('./pages/Portal/MyChits'));
const MyAuctions = lazy(() => import('./pages/Portal/MyAuctions'));
const PortalPassbook = lazy(() => import('./pages/Portal/PortalPassbook'));
import MemberLayout from './components/MemberLayout';
const UserProfile = lazy(() => import('./pages/Shared/UserProfile'));
import AutomationRules from './pages/Settings/AutomationRules';

const AgentDashboard = lazy(() => import('./pages/Agent/AgentDashboard'));
const AgentRoute = lazy(() => import('./pages/Agent/AgentRoute'));
const CollectPayment = lazy(() => import('./pages/Agent/CollectPayment'));

// Admin Pages
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const AuditorDashboard = lazy(() => import('./pages/Admin/AuditorDashboard'));
const SubmissionReconciliation = lazy(() => import('./pages/Admin/SubmissionReconciliation'));
const RouteManagement = lazy(() => import('./pages/Admin/RouteManagement'));
const AdminNotifications = lazy(() => import('./pages/Admin/Notifications'));
const BroadcastCenter = lazy(() => import('./pages/Admin/BroadcastCenter'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const MySubscription = lazy(() => import('./pages/Subscription/MySubscription'));
const MessageTemplates = lazy(() => import('./pages/Settings/MessageTemplates'));
const NotificationSettings = lazy(() => import('./pages/Settings/NotificationSettings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/trial-expired" element={<TrialExpired />} />
          
          {/* Main App Layout */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['Admin', 'Staff', 'Manager', 'Auditor']}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="notifications" element={<AdminNotifications />} />
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
            <Route path="reports/arrears" element={<ArrearsReport />} />
            <Route path="reports/agent-performance" element={<AgentPerformance />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/auditor" element={<AuditorDashboard />} />
            <Route path="admin/reconciliation" element={<SubmissionReconciliation />} />
            <Route path="admin/routes" element={<RouteManagement />} />
            <Route path="admin/notifications" element={<AdminNotifications />} />
            <Route path="admin/broadcast" element={<BroadcastCenter />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/templates" element={<MessageTemplates />} />
            <Route path="settings/notifications" element={<NotificationSettings />} />
            <Route path="settings/automation" element={<AutomationRules />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="subscription" element={<MySubscription />} />
          </Route>

          {/* Member Portal Routes */}
          <Route path="/portal" element={<ProtectedRoute allowedRoles={['Subscriber']}><MemberLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="my-chits" element={<MyChits />} />
            <Route path="auctions" element={<MyAuctions />} />
            <Route path="auctions/live/:auctionId" element={<LiveAuction />} />
            <Route path="payments" element={<MyPayments />} />
            <Route path="passbook/:ticketId" element={<PortalPassbook />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<UserProfile />} />
          </Route>

          {/* Agent Portal Routes */}
          <Route path="/agent" element={<ProtectedRoute allowedRoles={['Agent', 'Admin', 'Staff']}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="route" element={<AgentRoute />} />
            <Route path="passbook-selector" element={<MemberPassbookSelector role="agent" />} />
            <Route path="collect/:memberId" element={<CollectPayment />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
