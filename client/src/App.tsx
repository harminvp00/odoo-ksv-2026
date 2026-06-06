import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
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
            
            {/* Dashboard / Workspace App Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/rfqs/create" element={<RFQCreate />} />
            <Route path="/quotations/submit" element={<QuotationSubmit />} />
            <Route path="/quotations/compare" element={<QuotationCompare />} />
            <Route path="/approvals" element={<ApprovalWorkflow />} />
            <Route path="/invoices" element={<POInvoiceDetail />} />
            <Route path="/activity" element={<ActivityLogs />} />
            <Route path="/reports" element={<ReportsAnalytics />} />

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
