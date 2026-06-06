import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Dashboard from './features/dashboard/Dashboard';
import VendorsPage from './features/vendors/VendorsPage';
import RFQCreate from './features/rfqs/RFQCreate';
import QuotationSubmit from './features/quotations/QuotationSubmit';
import QuotationCompare from './features/quotations/QuotationCompare';
import ApprovalWorkflow from './features/approvals/ApprovalWorkflow';
import POInvoiceDetail from './features/invoices/POInvoiceDetail';
import ActivityLogs from './features/activity/ActivityLogs';
import ReportsAnalytics from './features/reports/ReportsAnalytics';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Dashboard / Workspace App Routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR']}><Dashboard /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']}><VendorsPage /></ProtectedRoute>} />
            <Route path="/rfqs/create" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER']}><RFQCreate /></ProtectedRoute>} />
            <Route path="/quotations/submit" element={<ProtectedRoute allowedRoles={['VENDOR']}><QuotationSubmit /></ProtectedRoute>} />
            <Route path="/quotations/compare" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']}><QuotationCompare /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']}><ApprovalWorkflow /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR']}><POInvoiceDetail /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']}><ActivityLogs /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']}><ReportsAnalytics /></ProtectedRoute>} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
