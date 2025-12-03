import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const AppShell = ({ children, activeView, setActiveView, onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 ml-64">
                <Header onLogout={onLogout} />
                <main className="pt-16 min-h-screen">
                    <div className="p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppShell;
