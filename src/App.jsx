import React, { useState } from 'react';
import { UserProvider, useUser } from './core/context/UserContext';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import CaseloadDashboard from './modules/caseload';
import OffenderProfile from './components/profile/OffenderProfile';
import TasksModule from './modules/tasks';
import CalendarModule from './modules/calendar';
import ReportsModule from './modules/reports';
import SettingsModule from './modules/settings';
import OfficeModule from './modules/office';
import AutomationDashboard from './modules/automation/AutomationDashboard';
import ModernDashboard from './components/dashboard/ModernDashboard';
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ModernDashboard />} />
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
        <Route path="/automations" element={<AutomationDashboard />} />
      </Routes>
    </AppShell>
  );
};

export default App;
