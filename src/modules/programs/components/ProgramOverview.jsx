
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatusMultiSelect = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = ['Enrolled', 'Attending', 'Discharged', 'Completed'];

    const toggleOption = (option) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-transparent text-slate-700 text-sm font-medium py-1.5 px-3 hover:bg-slate-100 rounded-md"
            >
                Status {selected.length > 0 && <span className="bg-slate-200 text-xs px-1.5 rounded-full">{selected.length}</span>}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-2">
                        {options.map(option => (
                            <label key={option} className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option)}
                                    onChange={() => toggleOption(option)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                                />
                                <span className="text-sm text-slate-700">{option}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ProgramOverview = () => {
    const navigate = useNavigate();
    // Filter States
    const [filters, setFilters] = useState({
        provider: '',
        program: '',
        office: '',
        officer: '',
        startDate: '',
        endDate: '',
        status: []
    });

    // Data States
    const [enrollments, setEnrollments] = useState([]);
    const [providers, setProviders] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [offices, setOffices] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Fetch Filter Options
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Providers
                const provRes = await fetch('http://localhost:8000/programs/providers');
                if (provRes.ok) {
                    const provData = await provRes.json();
                    setProviders([...new Set(provData.map(p => p.name))]);
                }

                // Programs (from Catalog)
                const progRes = await fetch('http://localhost:8000/programs/catalog');
                if (progRes.ok) {
                    const progData = await progRes.json();
                    setPrograms([...new Set(progData.map(p => p.program_name))]);
                }

                // Offices (Locations)
                const locRes = await fetch('http://localhost:8000/settings/locations');
                if (locRes.ok) {
                    const officeData = await locRes.json();
                    setOffices(officeData.map(l => l.name));
                }

                // Officers
                const offRes = await fetch('http://localhost:8000/users/officers');
                if (offRes.ok) {
                    const offData = await offRes.json();
                    setOfficers(offData.map(o => `${o.last_name}, ${o.first_name}`));
                }

            } catch (error) {
                console.error("Error fetching filters:", error);
            }
        };
        fetchFilters();
    }, []);

    // Fetch Enrollments
    useEffect(() => {
        const fetchEnrollments = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.provider) params.append('provider_name', filters.provider);
                if (filters.program) params.append('program_name', filters.program);
                if (filters.office) params.append('office', filters.office);
                if (filters.officer) params.append('officer_name_part', filters.officer.split(',')[0]);
                if (filters.startDate) params.append('start_date', filters.startDate);
                if (filters.endDate) params.append('end_date', filters.endDate);
                filters.status.forEach(s => params.append('status', s));

                const response = await fetch(`http://localhost:8000/programs/enrollments?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setEnrollments(data);
                }
            } catch (error) {
                console.error("Error fetching enrollments:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceFetch = setTimeout(fetchEnrollments, 300);
        return () => clearTimeout(debounceFetch);
    }, [filters]);

    // Pagination Logic
    const totalPages = Math.ceil(enrollments.length / itemsPerPage);
    const currentData = enrollments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Enrolled':
            case 'Active':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">{status}</span>;
            case 'Attending':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">{status}</span>;
            case 'Discharged':
            case 'Completed':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">{status}</span>;
        }
    };

    const getRiskBadge = (offender) => {
        // Mock risk logic
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Medium Risk</span>;
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <Filter size={16} className="text-slate-400 ml-2" />

                    {/* Provider Filter */}
                    <div className="relative">
                        <select
                            value={filters.provider}
                            onChange={(e) => handleFilterChange('provider', e.target.value)}
                            className="bg-transparent border-none text-slate-700 text-sm font-medium focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32"
                        >
                            <option value="">Provider: All</option>
                            {providers.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>

                    {/* Program Filter */}
                    <div className="relative">
                        <select
                            value={filters.program}
                            onChange={(e) => handleFilterChange('program', e.target.value)}
                            className="bg-transparent border-none text-slate-700 text-sm font-medium focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32"
                        >
                            <option value="">Program: All</option>
                            {programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>

                    {/* Office Filter */}
                    <div className="relative">
                        <select
                            value={filters.office}
                            onChange={(e) => handleFilterChange('office', e.target.value)}
                            className="bg-transparent border-none text-slate-700 text-sm font-medium focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-24"
                        >
                            <option value="">Office: All</option>
                            {offices.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>

                    {/* Officer Filter */}
                    <div className="relative">
                        <select
                            value={filters.officer}
                            onChange={(e) => handleFilterChange('officer', e.target.value)}
                            className="bg-transparent border-none text-slate-700 text-sm font-medium focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-28"
                        >
                            <option value="">Officer: All</option>
                            {officers.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>

                    {/* Multi-Select Status */}
                    <StatusMultiSelect
                        selected={filters.status}
                        onChange={(newStatus) => handleFilterChange('status', newStatus)}
                    />
                </div>

                {/* Date Filters */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                            placeholder="Start Date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="relative">
                        <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                            placeholder="End Date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Offender</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Program</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason for Discharge</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                                    Loading enrollments...
                                </td>
                            </tr>
                        ) : currentData.length > 0 ? (
                            currentData.map((item) => (
                                <tr key={item.enrollment_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline"
                                            onClick={() => navigate(`/offenders/${item.offender_id}`)}
                                        >
                                            {item.offender?.last_name}, {item.offender?.first_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRiskBadge(item.offender)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600">{item.offering?.provider?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 max-w-[200px] truncate" title={item.offering?.program_name}>{item.offering?.program_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600">{item.discharge_reason || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {item.start_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {item.scheduled_end_date}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                                    No records found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {enrollments.length > itemsPerPage && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, enrollments.length)}</span> of <span className="font-medium">{enrollments.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgramOverview;
