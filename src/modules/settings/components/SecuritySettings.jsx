import React from 'react';

const SecuritySettings = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Security Settings</h3>
            <p className="text-sm text-slate-500 mb-6">Manage your password and account security.</p>
            <div className="max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input type="password" className="w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 bg-slate-50" disabled placeholder="********" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input type="password" className="w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700" placeholder="Enter new password" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input type="password" className="w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700" placeholder="Confirm new password" />
                </div>
                <div className="pt-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Update Password</button>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
