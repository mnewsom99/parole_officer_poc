import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

import { useUser } from '../../core/context/UserContext';

const LoginScreen = () => {
    const { login } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(username, password);
        } catch (err) {
            if (err.response) {
                // Server responded with a status code
                if (err.response.status === 401) {
                    setError('Invalid username or password.');
                } else if (err.response.status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(`An unexpected error occurred. (Status: ${err.response.status})`);
                }
            } else if (err.request) {
                // No response received
                setError('Unable to connect to server. Please check your connection.');
            } else if (err.message) {
                // JS Error or manual throw
                setError(err.message);
            } else {
                // Request setup error
                setError('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center p-4">
            <div className="bg-white/95 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-white/20">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">PAROLE<span className="text-purple-200">OS</span></h1>
                        <p className="text-indigo-100 mt-2 text-sm font-medium">Secure Field Officer Access</p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-medium text-slate-800"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-medium text-slate-800"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Secure Login</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400">
                            Authorized personnel only. All activity is logged and monitored.
                            <br />System Version 2.4.0
                        </p>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default LoginScreen;
