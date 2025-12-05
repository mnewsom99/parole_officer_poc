import React, { useState } from 'react';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import CaseloadDashboard from './components/dashboard/CaseloadDashboard';
import OffenderProfile from './components/profile/OffenderProfile';
import TasksModule from './components/modules/TasksModule';
import CalendarModule from './components/modules/CalendarModule';
import ReportsModule from './components/modules/ReportsModule';
import SettingsModule from './components/modules/SettingsModule';
import OfficeModule from './components/modules/OfficeModule';
import Dashboard from './components/Dashboard';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AppShell onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/caseload" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/caseload" element={<CaseloadDashboard />} />
        <Route path="/offenders/:offenderId" element={<OffenderProfile />} />
        <Route path="/office" element={<OfficeModule />} />
        <Route path="/tasks" element={<TasksModule />} />
        <Route path="/calendar" element={<CalendarModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/settings" element={<SettingsModule />} />
      </Routes>
    </AppShell>
  );
}

export default App;
