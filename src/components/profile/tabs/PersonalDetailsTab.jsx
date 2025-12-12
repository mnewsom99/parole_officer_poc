import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../../core/context/UserContext'; // path adjusted: src/components/profile/tabs -> ../../../core/context
import Modal from '../../../components/common/Modal'; // path adjusted: src/components/profile/tabs -> ../../../components/common
import {
    Phone, Mail, Calendar, MapPin, Briefcase, FileText, AlertTriangle
} from 'lucide-react';

const PersonalDetailsTab = ({ offender, onRefresh }) => {
    const { currentUser } = useContext(UserContext);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Employment State
    const [showEmploymentModal, setShowEmploymentModal] = useState(false);
    const [employmentStatus, setEmploymentStatus] = useState('Unemployed');
    const [unemployableReason, setUnemployableReason] = useState('');
    const [newEmployment, setNewEmployment] = useState({
        employer_name: '',
        address_line_1: '',
        supervisor: '',
        phone: '',
        pay_rate: '',
        is_current: true
    });

    // Housing / Move State
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveForm, setMoveForm] = useState({
        address_line_1: '',
        city: '',
        state: 'AZ',
        zip_code: '',
        start_date: new Date().toISOString().split('T')[0],
        housing_type: 'Residence',
        notes: ''
    });

    // Initialize State from Props
    useEffect(() => {
        if (offender) {
            setEmploymentStatus(offender.employment_status || 'Unemployed');
            setUnemployableReason(offender.unemployable_reason || '');
        }
    }, [offender]);

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    // --- HANDLERS ---

    const handleSaveChanges = async () => {
        try {
            const changes = [];
            const fieldLabels = {
                phone: 'Phone Number',
                email: 'Email Address',
                gender: 'Gender',
                releaseType: 'Release Type',
                releaseDate: 'Start Date',
                address: 'Current Address',
                reversionDate: 'Reversion Date',
                gangAffiliation: 'Gang Affiliation',
                risk: 'Risk Level',
                employment_status: 'Employment Status',
                unemployable_reason: 'Unemployable Reason'
            };

            const officerName = currentUser?.name || 'Officer';
            let addressChanged = false;

            // 1. Identify Changes
            Object.keys(editForm).forEach(key => {
                // Skip complex objects or arrays
                if (typeof offender[key] === 'object' && offender[key] !== null) return;

                if (offender[key] !== editForm[key] && fieldLabels[key]) {
                    const oldVal = offender[key] || 'empty';
                    const newVal = editForm[key] || 'empty';

                    if (key === 'address' || key === 'city' || key === 'state' || key === 'zip') {
                        addressChanged = true;
                    }

                    changes.push({
                        field: fieldLabels[key],
                        oldVal,
                        newVal
                    });
                }
            });

            // 2. Handle Address Change (Move)
            if (addressChanged) {
                const movePayload = {
                    address_line_1: editForm.address,
                    city: editForm.city || offender.city || 'Phoenix',
                    state: editForm.state || offender.state || 'AZ',
                    zip_code: editForm.zip_code || editForm.zip || offender.zip || '85000',
                    start_date: new Date().toISOString().split('T')[0],
                    housing_type: offender.housingType || 'Private',
                    notes: 'Address corrected via profile edit.'
                };
                await axios.post(`http://localhost:8000/offenders/${offender.id || offender.offender_id}/residences/move`, movePayload);
            }

            // 3. Handle General Updates
            const generalUpdates = {};
            if (editForm.phone !== offender.phone) generalUpdates.phone = editForm.phone;
            if (editForm.email !== offender.email) generalUpdates.email = editForm.email;
            if (editForm.gender !== offender.gender) generalUpdates.gender = editForm.gender;
            if (editForm.releaseType !== offender.releaseType) generalUpdates.release_type = editForm.releaseType;
            if (editForm.gangAffiliation !== offender.gangAffiliation) generalUpdates.gang_affiliation = editForm.gangAffiliation;
            if (editForm.employment_status !== offender.employment_status) generalUpdates.employment_status = editForm.employment_status;
            if (editForm.unemployable_reason !== offender.unemployable_reason) generalUpdates.unemployable_reason = editForm.unemployable_reason;

            if (Object.keys(generalUpdates).length > 0) {
                await axios.put(`http://localhost:8000/offenders/${offender.id || offender.offender_id}`, generalUpdates);
            }

            // 4. Create System Audit Note for non-address changes
            const nonAddressChanges = changes.filter(c => c.field !== 'Current Address');
            if (nonAddressChanges.length > 0) {
                const noteContent = nonAddressChanges.map(c => `${c.field}: "${c.oldVal}" -> "${c.newVal}"`).join(', ');
                await axios.post(`http://localhost:8000/offenders/${offender.id || offender.offender_id}/notes`, {
                    content: `Profile Updated by ${officerName}: ${noteContent}`,
                    type: 'System'
                });
            }

            if (onRefresh) await onRefresh();
            setIsEditing(false);

        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save changes. Please try again.");
        }
    };

    const handleAddEmployment = async () => {
        try {
            await axios.put(`http://localhost:8000/offenders/${offender.id || offender.offender_id}`, {
                employment_status: employmentStatus,
                unemployable_reason: employmentStatus === 'Unemployable' ? unemployableReason : null
            });

            if (employmentStatus === 'Employed' && newEmployment.employer_name) {
                await axios.post(`http://localhost:8000/offenders/${offender.id || offender.offender_id}/employment`, newEmployment);
            }

            setShowEmploymentModal(false);
            if (onRefresh) onRefresh();

            setNewEmployment({
                employer_name: '',
                address_line_1: '',
                city: '',
                state: '',
                zip_code: '',
                supervisor: '',
                phone: '',
                pay_rate: '',
                is_current: true
            });
        } catch (error) {
            console.error("Error managing employment:", error);
        }
    };

    const handleMoveOffender = async () => {
        try {
            await axios.post(`http://localhost:8000/offenders/${offender.id || offender.offender_id}/residences/move`, moveForm);
            setShowMoveModal(false);
            if (onRefresh) onRefresh();
            setMoveForm({
                address_line_1: '',
                city: '',
                state: 'AZ',
                zip_code: '',
                start_date: new Date().toISOString().split('T')[0],
                housing_type: 'Residence',
                notes: ''
            });
        } catch (error) {
            console.error("Error moving offender:", error);
        }
    };

    if (!offender) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        Personal & Supervision Details
                    </h3>
                    {!isEditing ? (
                        <button
                            onClick={() => {
                                setEditForm(JSON.parse(JSON.stringify(offender)));
                                setIsEditing(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded font-medium"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {/* GRID SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* DEMOGRAPHICS */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Demographics & Contact</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Phone size={18} /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 font-medium">Primary Phone</p>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editForm.phone || ''}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-800 border-b border-blue-500 focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-800">{offender.phone}</p>
                                    )}
                                    <p className="text-xs text-slate-400">Mobile</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Mail size={18} /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 font-medium">Email Address</p>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editForm.email || ''}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-800 border-b border-blue-500 focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-800">{offender.email || `${offender.first_name}123@email.com`}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar size={18} /></div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Age</p>
                                    <p className="text-sm font-semibold text-slate-800">39</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-xs text-slate-500">Gender</p>
                                    {isEditing ? (
                                        <select
                                            value={editForm.gender || ''}
                                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                            className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none bg-transparent"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-800">{offender.gender || 'Not Specified'}</p>
                                    )}
                                </div>
                                {offender.isSexOffender && (
                                    <div className="col-span-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                            Sex Offender Registry
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SUPERVISION STATUS */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Supervision Status</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Release Type</p>
                                    {isEditing ? (
                                        <select
                                            value={editForm.releaseType || ''}
                                            onChange={(e) => setEditForm({ ...editForm, releaseType: e.target.value })}
                                            className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none bg-transparent"
                                        >
                                            <option value="Parole">Parole</option>
                                            <option value="Probation">Probation</option>
                                            <option value="Mandatory Supervision">Mandatory Supervision</option>
                                            <option value="Transition">Transition</option>
                                        </select>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-800">{offender.releaseType || 'Parole'}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Start Date</p>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            value={editForm.releaseDate || ''}
                                            onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                                            className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-800">{offender.releaseDate || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500">Current Address</p>
                                        {!isEditing && (
                                            <button
                                                onClick={() => setShowMoveModal(true)}
                                                className="text-[10px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <MapPin size={10} />
                                                Move
                                            </button>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                placeholder="Street"
                                                value={editForm.address || ''}
                                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{offender.address || 'N/A'}</p>
                                            {offender.housingType && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mt-1">
                                                    {offender.housingType}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {offender.releaseType === 'Transition' && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold text-orange-600">Reversion Date</p>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.reversionDate || ''}
                                                onChange={(e) => setEditForm({ ...editForm, reversionDate: e.target.value })}
                                                className="w-full text-sm font-bold text-orange-700 border-b border-orange-500 focus:outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-orange-700">{offender.reversionDate || 'TBD'}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {offender.isGangMember && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        <span className="text-xs font-bold text-slate-700">Gang Affiliation</span>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.gangAffiliation || ''}
                                            onChange={(e) => setEditForm({ ...editForm, gangAffiliation: e.target.value })}
                                            className="w-full text-sm font-medium text-slate-800 border-b border-amber-500 focus:outline-none bg-transparent"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-800">{offender.gangAffiliation}</p>
                                    )}
                                </div>
                            )}

                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-slate-500">Employment</p>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setShowEmploymentModal(true)}
                                            className="text-[10px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                                        >
                                            <Briefcase size={10} />
                                            Manage
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${offender.employment_status === 'Employed' ? 'bg-green-500' :
                                        offender.employment_status === 'Unemployed' ? 'bg-orange-500' :
                                            'bg-slate-400'
                                        }`}></div>
                                    <p className="text-sm font-medium text-slate-800">
                                        {offender.employment_status || 'Unemployed'}
                                    </p>
                                </div>
                                {offender.employment_status === 'Employed' && offender.employments?.some(e => e.is_current) ? (
                                    (() => {
                                        const activeEmp = offender.employments.find(e => e.is_current);
                                        return (
                                            <div className="mt-1 pl-4 border-l-2 border-slate-100">
                                                <p className="text-sm font-bold text-slate-800">{activeEmp.employer_name}</p>
                                                <p className="text-xs text-slate-500">{activeEmp.position}</p>
                                            </div>
                                        );
                                    })()
                                ) : offender.employment_status === 'Unemployable' ? (
                                    <p className="text-xs text-slate-500 italic mt-1 pl-4">
                                        Reason: {offender.unemployable_reason || 'Not Specified'}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROGRAMS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase size={18} className="text-blue-600" />
                        Programs & Interventions
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Program</button>
                </div>
                {/* Programs Placeholder */}
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-sm text-slate-500">No active programs or interventions.</p>
                </div>
            </div>

            {/* EMPLOYMENT DETAILS CARD */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase size={18} className="text-blue-600" />
                    Employment Details
                </h3>

                {/* Current Employment Card */}
                {offender.employments && offender.employments.find(e => e.is_current) ? (
                    (() => {
                        const currentEmp = offender.employments.find(e => e.is_current);
                        return (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-slate-800">
                                        {currentEmp.employer_name}
                                    </span>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                                        Active
                                    </span>
                                </div>
                                <div className="font-medium text-slate-700 text-sm mb-1">{currentEmp.position}</div>
                                <p className="text-sm text-slate-600 mb-1">
                                    {currentEmp.address_line_1}, {currentEmp.city}, {currentEmp.state}
                                </p>
                                {currentEmp.supervisor && <p className="text-xs text-slate-500 mt-2">Supervisor: {currentEmp.supervisor} • {currentEmp.phone}</p>}
                            </div>
                        );
                    })()
                ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-center">
                        {offender.employment_status === 'Unemployable' ? (
                            <div>
                                <p className="text-sm font-bold text-slate-700">Unemployable</p>
                                <p className="text-xs text-slate-500 mt-1">Reason: {offender.unemployable_reason || 'Not Specified'}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No current employment record.</p>
                        )}
                    </div>
                )}

                {/* HISTORY TABLE */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Employment History</h4>
                    <div className="overflow-x-auto border rounded-t-lg rounded-b-lg border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employer</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {offender.employments && offender.employments.length > 0 ? (
                                    offender.employments.map(emp => (
                                        <tr key={emp.employment_id}>
                                            <td className="px-4 py-2 text-xs font-semibold">
                                                {emp.is_current ? (
                                                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Current</span>
                                                ) : (
                                                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Previous</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-slate-700 font-medium">{emp.employer_name}</td>
                                            <td className="px-4 py-2 text-xs text-slate-600">{emp.position || 'N/A'}</td>
                                            <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                                                {emp.start_date || 'N/A'} - {emp.is_current ? 'Present' : emp.end_date || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center text-xs text-slate-400 italic">
                                            No employment history recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* HOUSING TABLE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />
                    Housing Details
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-slate-800">
                            {offender.housingType} Residence
                        </span>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                            Approved
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{offender.address}</p>
                    {offender.city && <p className="text-sm text-slate-600">{offender.city}, {offender.state} {offender.zip}</p>}
                </div>
                {/* HOUSING HISTORY TABLE */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Housing History</h4>
                    <div className="overflow-x-auto border rounded-t-lg rounded-b-lg border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {offender.residenceHistory && offender.residenceHistory.map(res => (
                                    <tr key={res.residence_id}>
                                        <td className="px-4 py-2 text-xs font-semibold">
                                            {res.isCurrent ? (
                                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Current</span>
                                            ) : (
                                                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Previous</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-slate-700">{res.housingType}</td>
                                        <td className="px-4 py-2 text-xs text-slate-600">{res.address}, {res.city}</td>
                                        <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                                            {res.startDate || 'N/A'} - {res.isCurrent ? 'Present' : res.endDate || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <Modal
                isOpen={showEmploymentModal}
                onClose={() => setShowEmploymentModal(false)}
                title="Manage Employment Details"
            >
                <div className="space-y-4">
                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employment Status</label>
                        <select
                            value={employmentStatus}
                            onChange={(e) => setEmploymentStatus(e.target.value)}
                            className="w-full p-2 border rounded-lg outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="Unemployed">Unemployed</option>
                            <option value="Employed">Employed</option>
                            <option value="Unemployable">Unemployable</option>
                        </select>
                    </div>

                    {employmentStatus === 'Unemployable' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                            <select
                                value={unemployableReason}
                                onChange={(e) => setUnemployableReason(e.target.value)}
                                className="w-full p-2 border rounded-lg outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="">Select Reason...</option>
                                <option value="Medical">Medical Disability</option>
                                <option value="Mental Health">Mental Health</option>
                                <option value="SSI/SSDI">SSI/SSDI Recipient</option>
                                <option value="Age">Age / Elderly</option>
                                <option value="Retired">Retired</option>
                                <option value="Incarcerated">Incarcerated</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    )}

                    {employmentStatus === 'Employed' && (
                        <div className="space-y-3 border-t pt-3 mt-3">
                            <p className="text-xs font-bold text-slate-500 uppercase">New Employer Details</p>
                            <input
                                type="text"
                                placeholder="Employer Name"
                                value={newEmployment.employer_name}
                                onChange={(e) => setNewEmployment({ ...newEmployment, employer_name: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="Position/Title"
                                value={newEmployment.position || ''}
                                onChange={(e) => setNewEmployment({ ...newEmployment, position: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={newEmployment.phone}
                                    onChange={(e) => setNewEmployment({ ...newEmployment, phone: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Supervisor"
                                    value={newEmployment.supervisor}
                                    onChange={(e) => setNewEmployment({ ...newEmployment, supervisor: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Address"
                                value={newEmployment.address_line_1}
                                onChange={(e) => setNewEmployment({ ...newEmployment, address_line_1: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={newEmployment.city}
                                    onChange={(e) => setNewEmployment({ ...newEmployment, city: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={newEmployment.state}
                                    onChange={(e) => setNewEmployment({ ...newEmployment, state: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Zip"
                                    value={newEmployment.zip_code}
                                    onChange={(e) => setNewEmployment({ ...newEmployment, zip_code: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={() => setShowEmploymentModal(false)}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddEmployment}
                            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                        >
                            Update Employment
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                title="Log Offender Move"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">New Address</label>
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={moveForm.address_line_1}
                            onChange={e => setMoveForm({ ...moveForm, address_line_1: e.target.value })}
                            className="w-full p-2 border rounded mb-2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="City"
                                value={moveForm.city}
                                onChange={e => setMoveForm({ ...moveForm, city: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                value={moveForm.state}
                                onChange={e => setMoveForm({ ...moveForm, state: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Zip"
                                value={moveForm.zip_code}
                                onChange={e => setMoveForm({ ...moveForm, zip_code: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Details</label>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">Move Date</span>
                                <input
                                    type="date"
                                    value={moveForm.start_date}
                                    onChange={e => setMoveForm({ ...moveForm, start_date: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">Housing Type</span>
                                <select
                                    value={moveForm.housing_type}
                                    onChange={e => setMoveForm({ ...moveForm, housing_type: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option>Residence</option>
                                    <option>Transient</option>
                                    <option>Halfway House</option>
                                    <option>Facility</option>
                                </select>
                            </div>
                        </div>
                        <textarea
                            placeholder="Notes about move..."
                            value={moveForm.notes}
                            onChange={e => setMoveForm({ ...moveForm, notes: e.target.value })}
                            className="w-full p-2 border rounded h-20"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowMoveModal(false)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMoveOffender}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Confirm Move
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PersonalDetailsTab;
