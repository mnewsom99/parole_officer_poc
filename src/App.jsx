import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import CaseloadDashboard from './components/dashboard/CaseloadDashboard';
import OffenderProfile from './components/profile/OffenderProfile';
import TasksModule from './components/modules/TasksModule';
import CalendarModule from './components/modules/CalendarModule';
import ReportsModule from './components/modules/ReportsModule';
import SettingsModule from './components/modules/SettingsModule';
import OfficeModule from './components/modules/OfficeModule';
import WorkflowDashboard from './components/workflow/WorkflowDashboard';
import Dashboard from './components/Dashboard';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

const AppContent = () => {
  const { currentUser, isLoading, logout } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <AppShell onLogout={logout}>

      <Routes>
        <Route path="/" element={<Navigate to="/caseload" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/caseload" element={<CaseloadDashboard />} />
        <Route path="/offenders/:offenderId" element={<OffenderProfile />} />
        <Route path="/office" element={<OfficeModule />} />
        <Route path="/tasks" element={<TasksModule />} />
        <Route path="/calendar" element={<CalendarModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/settings" element={
          <ErrorBoundary>
            <SettingsModule />
          </ErrorBoundary>
        } />
        <Route path="/workflows" element={<WorkflowDashboard />} />
      </Routes>
    </AppShell>
  );
};

export default App;
