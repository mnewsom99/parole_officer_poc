import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';

export const StatCard = ({ title, value, subtext, trend, trendValue, icon: Icon, color }) => {
    const isPositive = trend === 'up';
    const trendColor = isPositive ? 'text-emerald-500' : 'text-rose-500';
    const trendBg = isPositive ? 'bg-emerald-50' : 'bg-rose-50';
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trendValue && (
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendBg} ${trendColor}`}>
                        <TrendIcon className="w-3 h-3 mr-1" />
                        {trendValue}
                    </div>
                )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <div className="flex items-baseline">
                <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
                {subtext && <span className="ml-2 text-xs text-slate-400">{subtext}</span>}
            </div>
        </div>
    );
};

export const ActivityBarChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <RechartsTooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="newCases" name="New Cases" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="closedCases" name="Closed Cases" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const RiskDonutChart = ({ data }) => {
    const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']; // Red, Amber, Green, Blue

    return (
        <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-600 text-sm ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                <div className="text-2xl font-bold text-slate-800">56</div>
                <div className="text-xs text-slate-500">Total</div>
            </div>
        </div>
    );
};

export const EmploymentLineChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNorth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorEast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorWest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSouth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        unit="%"
                    />
                    <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="Main Office" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMain)" />
                    <Area type="monotone" dataKey="North Station" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNorth)" />
                    <Area type="monotone" dataKey="East Side" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorEast)" />
                    <Area type="monotone" dataKey="West End" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorWest)" />
                    <Area type="monotone" dataKey="South Branch" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSouth)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const SectionHeader = ({ title, action }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {action && (
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <MoreVertical size={20} />
            </button>
        )}
    </div>
);
