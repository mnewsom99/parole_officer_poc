import React, { useState } from 'react';
import { MoreHorizontal, AlertTriangle, CheckCircle, Clock, ChevronRight, Search } from 'lucide-react';

const CaseloadDashboard = ({ onSelectOffender }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const offenders = [
        { id: '1', name: 'Doe, John', badgeId: '88392', risk: 'High', status: 'Active', nextCheck: 'Today, 2:00 PM', compliance: 65, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', address: '123 Main St, Springfield', phone: '555-0101' },
        { id: '2', name: 'Smith, Sarah', badgeId: '99210', risk: 'Medium', status: 'Active', nextCheck: 'Tomorrow, 9:00 AM', compliance: 88, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', address: '456 Oak Ave, Springfield', phone: '555-0102' },
        { id: '3', name: 'Johnson, Michael', badgeId: '77219', risk: 'Low', status: 'Active', nextCheck: 'Dec 12, 10:30 AM', compliance: 95, image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', address: '789 Pine Ln, Springfield', phone: '555-0103' },
        { id: '4', name: 'Williams, David', badgeId: '66210', risk: 'High', status: 'Absconded', nextCheck: 'Overdue', compliance: 12, image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', address: 'Unknown', phone: 'Disconnected' },
        { id: '5', name: 'Brown, Jessica', badgeId: '55102', risk: 'Medium', status: 'Active', nextCheck: 'Dec 14, 3:00 PM', compliance: 78, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', address: '321 Elm St, Springfield', phone: '555-0104' },
    ];

    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'High': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">High Risk</span>;
            case 'Medium': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Medium Risk</span>;
            case 'Low': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Low Risk</span>;
            default: return null;
        }
    };

    const filteredOffenders = offenders.filter(offender =>
        offender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offender.badgeId.includes(searchQuery)
    );

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            const exactMatch = offenders.find(o => o.badgeId === searchQuery);
            if (exactMatch) {
                onSelectOffender(exactMatch);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Caseload</h2>
                    <p className="text-slate-500">Active Offenders: {filteredOffenders.length}</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 pl-10 p-2.5"
                            placeholder="Search by Name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                    <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                        <option>All Risks</option>
                        <option>High Risk</option>
                        <option>Medium Risk</option>
                        <option>Low Risk</option>
                    </select>
                    <button className="bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all">
                        + Add Offender
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Offender</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Level</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Next Check-in</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOffenders.map((offender) => (
                            <tr
                                key={offender.id}
                                onClick={() => onSelectOffender(offender)}
                                className="hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src={offender.image} alt="" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{offender.name}</div>
                                            <div className="text-xs text-slate-500">ID: {offender.badgeId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getRiskBadge(offender.risk)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offender.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline truncate max-w-[150px] block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {offender.address}
                                    </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <a
                                        href={`tel:${offender.phone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {offender.phone}
                                    </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 w-24">
                                        <div
                                            className={`h-2.5 rounded-full ${offender.compliance > 80 ? 'bg-green-500' : offender.compliance > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${offender.compliance}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1 block">{offender.compliance}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">{offender.nextCheck}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CaseloadDashboard;
