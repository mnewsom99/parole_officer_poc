import React, { useState, useEffect } from 'react';
import { MoreHorizontal, AlertTriangle, CheckCircle, Clock, ChevronRight, ChevronLeft, Search, UserPlus } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import AddOffenderModal from './components/AddOffenderModal';
import { useNavigate } from 'react-router-dom';

const CaseloadDashboard = () => {
    const { currentUser, hasPermission, globalFilter, updateGlobalFilter } = useUser();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOffenderModalOpen, setIsAddOffenderModalOpen] = useState(false);
    // Local filter state removed in favor of globalFilter
    const [sortConfig, setSortConfig] = useState({ key: 'nextCheck', direction: 'ascending' });
    const [officers, setOfficers] = useState([]);
    const [offices, setOffices] = useState([]);
    const [offenders, setOffenders] = useState([]);
    const [totalOffenders, setTotalOffenders] = useState(0); // Store server-side total
    const [totalPages, setTotalPages] = useState(1);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const onSelectOffender = (offender) => {
        navigate(`/offenders/${offender.id}`);
    };

    // Fetch Offices
    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const response = await axios.get('http://localhost:8000/locations');
                const sortedOffices = response.data.sort((a, b) => a.name.localeCompare(b.name));
                setOffices(sortedOffices);
            } catch (error) {
                console.error("Error fetching offices:", error);
            }
        };
        fetchOffices();
    }, []);

    // Fetch Officers (filtered by office if selected)
    useEffect(() => {
        const fetchOfficers = async () => {
            try {
                let url = 'http://localhost:8000/officers';
                if (globalFilter.office) {
                    url += `?location_id=${globalFilter.office}`;
                }
                const response = await axios.get(url);
                const mappedOfficers = response.data.map(o => ({
                    id: o.officer_id,
                    name: `${o.first_name} ${o.last_name}`
                }));
                setOfficers(mappedOfficers);

                mappedOfficers.sort((a, b) => a.name.localeCompare(b.name));
                setOfficers(mappedOfficers);
            } catch (error) {
                console.error("Error fetching officers:", error);
            }
        };
        fetchOfficers();
    }, [globalFilter.office, currentUser, hasPermission]);

    // Set default filters based on user (PRESET ONLY, DO NOT LOCK)
    // Only set if global filter is empty (first load) to respect persistence
    useEffect(() => {
        if (!currentUser) return;

        const updates = {};
        if (currentUser.officerId && !globalFilter.officer) {
            updates.officer = currentUser.officerId;
        }
        if (currentUser.locationId && !globalFilter.office) {
            updates.office = currentUser.locationId;
        }

        if (Object.keys(updates).length > 0) {
            updateGlobalFilter(updates);
        }
    }, [currentUser]); // Run when user loads, check global state inside

    // Fetch Offenders
    useEffect(() => {
        const fetchOffenders = async () => {
            try {
                let url = 'http://localhost:8000/offenders';
                const params = new URLSearchParams();

                if (globalFilter.officer) {
                    params.append('officer_id', globalFilter.officer);
                } else if (globalFilter.office) {
                    params.append('location_id', globalFilter.office);
                }

                // Add pagination params
                params.append('page', currentPage);
                params.append('limit', itemsPerPage);

                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const response = await axios.get(url);
                if (response.data && response.data.data) {
                    setOffenders(response.data.data);
                    setTotalOffenders(response.data.total);
                    setTotalPages(Math.ceil(response.data.total / itemsPerPage));
                } else if (Array.isArray(response.data)) {
                    setOffenders(response.data);
                    setTotalOffenders(response.data.length);
                    setTotalPages(1);
                }
            } catch (error) {
                console.error("Error fetching offenders:", error);
            }
        };
        fetchOffenders();
    }, [globalFilter.officer, globalFilter.office, currentPage]);

    // ... (Helper functions restored) ...
    const handleOfficerChange = (e) => {
        updateGlobalFilter({ officer: e.target.value });
    };

    const formatNextCheck = (dateString) => {
        if (!dateString || dateString === 'Pending') return 'Pending';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const getDateStatusColor = (dateString) => {
        if (!dateString || dateString === 'Pending') return 'text-slate-500';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'text-slate-600';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (date < now) return 'text-red-600 font-bold';
        if (checkDate.getTime() === today.getTime()) return 'text-yellow-600 font-bold';
        return 'text-slate-600';
    };

    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'High': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">High Risk</span>;
            case 'Medium': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Medium Risk</span>;
            case 'Low': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Low Risk</span>;
            default: return null;
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredOffenders = React.useMemo(() => {
        let sortableItems = [...offenders];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle strings case-insensitive
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems.filter(offender =>
            offender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offender.badgeId.includes(searchQuery)
        );
    }, [offenders, sortConfig, searchQuery]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOffenders;


    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            const exactMatch = offenders.find(o => o.badgeId === searchQuery);
            if (exactMatch) {
                onSelectOffender(exactMatch);
            }
        }
    };

    const handleAddOffender = async (newOffender) => {
        try {
            // Split name into first and last
            const nameParts = newOffender.name.split(',').map(part => part.trim());
            const lastName = nameParts[0];
            const firstName = nameParts.length > 1 ? nameParts[1] : '';

            const payload = {
                first_name: firstName,
                last_name: lastName,
                badge_id: newOffender.badgeId,
                dob: newOffender.dob,
                image_url: null,
                address_line_1: newOffender.address,
                city: newOffender.city,
                state: newOffender.state,
                zip_code: newOffender.zipCode,
                start_date: newOffender.beginDate,
                end_date: newOffender.endDate || null,
                risk_level: newOffender.risk,
                assigned_officer_id: globalFilter.officer
            };

            const response = await axios.post('http://localhost:8000/offenders', payload);

            // Refresh the list or add to state
            const fetchOffenders = async () => {
                try {
                    const response = await axios.get(`http://localhost:8000/offenders?officer_id=${globalFilter.officer}`);
                    setOffenders(response.data.data || response.data);
                } catch (error) {
                    console.error("Error fetching offenders:", error);
                }
            };
            fetchOffenders();
            setIsAddOffenderModalOpen(false);
        } catch (error) {
            console.error("Error adding offender:", error);
            alert("Failed to add offender. Please check the console for details.");
        }
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span className="ml-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
        return sortConfig.direction === 'ascending' ? <span className="ml-1 text-indigo-600">↑</span> : <span className="ml-1 text-indigo-600">↓</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Caseload</h2>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        Managing <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs border border-indigo-100">{totalOffenders} Active Offenders</span>
                    </p>
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <select
                            value={globalFilter.office}
                            onChange={(e) => {
                                updateGlobalFilter({
                                    office: e.target.value,
                                    officer: '' // Reset officer when office changes
                                });
                            }}
                            className="bg-transparent border-none text-slate-700 text-sm font-medium focus:ring-0 cursor-pointer py-2 pl-3 pr-8"
                        >
                            <option value="">All Offices</option>
                            {offices.map(office => (
                                <option key={office.location_id} value={office.location_id}>{office.name}</option>
                            ))}
                        </select>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <select
                            value={globalFilter.officer}
                            onChange={handleOfficerChange}
                            className="bg-transparent border-none text-slate-700 text-sm font-medium focus:ring-0 cursor-pointer py-2 pl-3 pr-8"
                        >
                            <option value="">All Officers</option>
                            {officers.map(officer => (
                                <option key={officer.id} value={officer.id}>{officer.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-colors group-focus-within:text-indigo-500">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-64 pl-10 p-2.5 shadow-sm transition-all group-hover:border-indigo-300"
                            placeholder="Search Name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>

                    <button
                        onClick={() => setIsAddOffenderModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                    >
                        <UserPlus size={18} />
                        Add Offender
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/40 border-b border-white/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Offender <SortIcon column="name" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('risk')}>
                                    <div className="flex items-center">Risk Level <SortIcon column="risk" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('address')}>
                                    <div className="flex items-center">Address <SortIcon column="address" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('zip')}>
                                    <div className="flex items-center">Zip Code <SortIcon column="zip" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('phone')}>
                                    <div className="flex items-center">Phone <SortIcon column="phone" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('nextCheck')}>
                                    <div className="flex items-center">Next Check-in <SortIcon column="nextCheck" /></div>
                                </th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.map((offender) => (
                                <tr
                                    key={offender.id}
                                    onClick={() => onSelectOffender(offender)}
                                    className="hover:bg-indigo-50/30 cursor-pointer transition-all duration-200 group border-l-4 border-transparent hover:border-indigo-500"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img className="h-10 w-10 rounded-full object-cover border-2 border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors" src={offender.image} alt="" />
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${offender.risk === 'High' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{offender.name}</div>
                                                <div className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-1.5 rounded mt-0.5">ID: {offender.badgeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="transform scale-100 origin-left group-hover:scale-105 transition-transform">
                                            {getRiskBadge(offender.risk)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center max-w-[200px]">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offender.address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-slate-600 hover:text-indigo-600 truncate transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {offender.address}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                        {offender.zip}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={`tel:${offender.phone}`}
                                            className="text-sm text-slate-600 hover:text-indigo-600 font-medium px-2 py-1 rounded transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {offender.phone}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-full bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm transition-all">
                                                <Clock className="w-3.5 h-3.5" />
                                            </div>
                                            <span className={`text-sm font-medium ${getDateStatusColor(offender.nextCheck)}`}>
                                                {formatNextCheck(offender.nextCheck)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-all transform hover:scale-110">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalOffenders > itemsPerPage && (
                    <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalOffenders)}</span> of <span className="font-bold text-slate-700">{totalOffenders}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm bg-white" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-lg px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-600 focus:z-10 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 focus:outline-offset-0 bg-white">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-lg px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-600 focus:z-10 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div >

            <AddOffenderModal
                isOpen={isAddOffenderModalOpen}
                onClose={() => setIsAddOffenderModalOpen(false)}
                onSave={handleAddOffender}
            />
        </div >
    );
};

export default CaseloadDashboard;
