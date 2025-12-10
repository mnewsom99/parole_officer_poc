import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from '../common/Breadcrumbs';

const AppShell = ({ children, onLogout }) => {
    return (
        <div className="flex min-h-screen gradient-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64">
                <Header onLogout={onLogout} />
                <main className="flex-1 p-6 mt-16 font-sans page-enter">
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
