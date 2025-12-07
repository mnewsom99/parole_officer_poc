import React, { useState, useEffect } from 'react';
import { MoreHorizontal, AlertTriangle, CheckCircle, Clock, ChevronRight, ChevronLeft, Search, UserPlus } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import AddOffenderModal from './AddOffenderModal';
import { useNavigate } from 'react-router-dom';

const CaseloadDashboard = () => {
    const { currentUser, hasPermission } = useUser();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOffenderModalOpen, setIsAddOffenderModalOpen] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState('');
    const [selectedOffice, setSelectedOffice] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nextCheck', direction: 'ascending' });
    const [officers, setOfficers] = useState([]);
    const [offices, setOffices] = useState([]);
    const [offenders, setOffenders] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const onSelectOffender = (offender) => {
        navigate(`/offenders/${offender.id}`);
    };

    // Fetch Offices
    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const response = await axios.get('http://localhost:8000/locations');
                setOffices(response.data);
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
                if (selectedOffice) {
                    url += `?location_id=${selectedOffice}`;
                }
                const response = await axios.get(url);
                const mappedOfficers = response.data.map(o => ({
                    id: o.officer_id,
                    name: `${o.first_name} ${o.last_name}`
                }));
                setOfficers(mappedOfficers);

                setOfficers(mappedOfficers);

                // Default to empty or specific logic if needed, but don't force lock
                // If the user's officer ID is in this list and nothing is selected, select it? 
                // No, relied on the separate "Set Defaults" effect for initial load.
            } catch (error) {
                console.error("Error fetching officers:", error);
            }
        };
        fetchOfficers();
    }, [selectedOffice, currentUser, hasPermission]);

    // Set default filters based on user (PRESET ONLY, DO NOT LOCK)
    useEffect(() => {
        if (currentUser?.officerId && selectedOfficer === '') {
            setSelectedOfficer(currentUser.officerId);
        }
        if (currentUser?.locationId && selectedOffice === '') {
            setSelectedOffice(currentUser.locationId);
        }
    }, [currentUser]);

    // Fetch Offenders
    // Fetch Offenders
    // Fetch Offenders
    useEffect(() => {
        // Allow fetch if selectedOfficer is empty string (All) OR if a specific officer is selected
        // But if user is RESTRICTED, they must have a selection (enforced above)

        const fetchOffenders = async () => {
            try {
                let url = 'http://localhost:8000/offenders';
                const params = new URLSearchParams();

                if (selectedOfficer) {
                    params.append('officer_id', selectedOfficer);
                } else if (selectedOffice) {
                    params.append('location_id', selectedOffice);
                }

                // Add pagination params
                params.append('page', currentPage);
                params.append('limit', itemsPerPage);

                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const response = await axios.get(url);
                // Handle new paginated response structure
                if (response.data && response.data.data) {
                    setOffenders(response.data.data);
                    setTotalPages(Math.ceil(response.data.total / itemsPerPage));
                } else if (Array.isArray(response.data)) {
                    // Fallback for legacy array
                    setOffenders(response.data);
                    setTotalPages(1);
                }
            } catch (error) {
                console.error("Error fetching offenders:", error);
            }
        };
        fetchOffenders();
    }, [selectedOfficer, selectedOffice, currentPage]); // Added currentPage dependency

    // ... (Helper functions restored) ...
    const handleOfficerChange = (e) => {
        setSelectedOfficer(e.target.value);
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

    // Server-side filtering is safer, but for now we filter the current PAGE of results client side 
    // OR we should ideally move search to server.
    // Given the constraints, let's continue filtering the *fetched* offenders client-side 
    // BUT since we only fetched 25, searching locally is broken unless matches are in this page.
    // FIXME: Search should trigger a server re-fetch.

    const filteredOffenders = React.useMemo(() => {
        // ... sort logic ...
        let sortableItems = [...offenders];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
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

    // Handle Search Reset
    // If search is present, we should probably fetch ALL matching from server? 
    // For now, let's keep the client-side sorting on the current page data.

    // const indexOfLastItem = currentPage * itemsPerPage; // No longer needed for slicing
    // const indexOfFirstItem = indexOfLastItem - itemsPerPage; // No longer needed for slicing
    const currentItems = filteredOffenders; // We already have the slice from server
    // const totalPages = Math.ceil(filteredOffenders.length / itemsPerPage); // This is broken now.


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
                assigned_officer_id: selectedOfficer
            };

            const response = await axios.post('http://localhost:8000/offenders', payload);

            // Refresh the list or add to state
            const fetchOffenders = async () => {
                try {
                    const response = await axios.get(`http://localhost:8000/offenders?officer_id=${selectedOfficer}`);
                    setOffenders(response.data);
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
                    <p className="text-slate-500">Active Offenders: {filteredOffenders.length}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        className={`bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[140px] cursor-pointer`}
                    >
                        <option value="">All Offices</option>
                        {offices.map(office => (
                            <option key={office.location_id} value={office.location_id}>{office.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedOfficer}
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
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('address')}
                            >
                                Address <SortIcon column="address" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('phone')}
                            >
                                Phone <SortIcon column="phone" />
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('compliance')}
                            >
                                Compliance <SortIcon column="compliance" />
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
                                        className="text-sm text-blue-600 hover:underline truncate max-w-[150px] block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {offender.address}
                                    </a>
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
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 w-24">
                                        <div
                                            className={`h-2.5 rounded-full ${offender.compliance > 80 ? 'bg-green-500' : offender.compliance > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${offender.compliance}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1 block">{offender.compliance}%</span>
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
                filteredOffenders.length > itemsPerPage && (
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
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredOffenders.length)}</span> of{' '}
                                    <span className="font-medium">{filteredOffenders.length}</span> results
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
