import React, { useState } from 'react';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import CaseloadDashboard from './components/dashboard/CaseloadDashboard';
import OffenderProfile from './components/profile/OffenderProfile';

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
      case 'tasks':
        return <div className="p-10 text-center text-slate-500">Tasks Module Placeholder</div>;
      case 'calendar':
        return <div className="p-10 text-center text-slate-500">Calendar Module Placeholder</div>;
      case 'reports':
        return <div className="p-10 text-center text-slate-500">Reports Module Placeholder</div>;
      case 'settings':
        return <div className="p-10 text-center text-slate-500">Settings Module Placeholder</div>;
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
