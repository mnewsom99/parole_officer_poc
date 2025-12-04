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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('caseload');
  const [selectedOffender, setSelectedOffender] = useState(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedOffender(null);
    setActiveView('caseload');
  };

  const handleSelectOffender = (offender) => {
    setSelectedOffender(offender);
    setActiveView('profile');
  };

  const handleBackToDashboard = () => {
    setSelectedOffender(null);
    setActiveView('caseload');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'caseload':
        return <CaseloadDashboard onSelectOffender={handleSelectOffender} />;
      case 'profile':
        return <OffenderProfile offender={selectedOffender} onBack={handleBackToDashboard} />;
      case 'office':
        return <OfficeModule />;
      case 'tasks':
        return <TasksModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <CaseloadDashboard onSelectOffender={handleSelectOffender} />;
    }
  };

  return (
    <AppShell activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout}>
      {renderContent()}
    </AppShell>
  );
}

export default App;
