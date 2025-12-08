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
        if (sortConfig.key !== column) return <span className="ml-1 text-slate-300">↕</span>;
        return sortConfig.direction === 'ascending' ? <span className="ml-1 text-blue-600">↑</span> : <span className="ml-1 text-blue-600">↓</span>;
    };

    return (

        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Caseload</h2>
                    <p className="text-slate-500">Active Offenders: {totalOffenders}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={globalFilter.office}
                        onChange={(e) => {
                            updateGlobalFilter({
                                office: e.target.value,
                                officer: '' // Reset officer when office changes
                            });
                        }}
                        className={`bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[140px] cursor-pointer`}
                    >
                        <option value="">All Offices</option>
                        {offices.map(office => (
                            <option key={office.location_id} value={office.location_id}>{office.name}</option>
                        ))}
                    </select>
                    <select
                        value={globalFilter.officer}
                        onChange={handleOfficerChange}
                        className={`bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[180px] cursor-pointer`}
                    >
                        <option value="">All Officers</option>
                        {officers.map(officer => (
                            <option key={officer.id} value={officer.id}>{officer.name}</option>
                        ))}
                    </select>
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
                    <button
                        onClick={() => setIsAddOffenderModalOpen(true)}
                        className="bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all"
                    >
                        + Add Offender
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th
                                className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('name')}
                            >
                                Offender <SortIcon column="name" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('risk')}
                            >
                                Risk Level <SortIcon column="risk" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors w-1/4"
                                onClick={() => handleSort('address')}
                            >
                                Address <SortIcon column="address" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('zip')}
                            >
                                Zip Code <SortIcon column="zip" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('phone')}
                            >
                                Phone <SortIcon column="phone" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('nextCheck')}
                            >
                                Next Check-in <SortIcon column="nextCheck" />
                            </th>
                            <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentItems.map((offender) => (
                            <tr
                                key={offender.id}
                                onClick={() => onSelectOffender(offender)}
                                className="hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <img className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm" src={offender.image} alt="" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{offender.name}</div>
                                            <div className="text-xs text-slate-500">ID: {offender.badgeId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    {getRiskBadge(offender.risk)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offender.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline truncate max-w-[300px] block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {offender.address}
                                    </a>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">
                                    {offender.zip}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <a
                                        href={`tel:${offender.phone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {offender.phone}
                                    </a>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className={`text-sm ${getDateStatusColor(offender.nextCheck)}`}>
                                            {formatNextCheck(offender.nextCheck)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right">
                                    <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div >

            {/* Pagination Controls */}
            {
                totalOffenders > itemsPerPage && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl shadow-sm">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalOffenders)}</span> of{' '}
                                    <span className="font-medium">{totalOffenders}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    {/* Simple Page X of Y display for simplicity with large numbers, or render page number buttons */}
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )
            }

            <AddOffenderModal
                isOpen={isAddOffenderModalOpen}
                onClose={() => setIsAddOffenderModalOpen(false)}
                onSave={handleAddOffender}
            />
        </div >
    );
};

export default CaseloadDashboard;
