
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, AlertTriangle, ChevronRight, User, Plus, Calendar, Edit2, X, Info, FileText } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const FieldModeModule = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [offenders, setOffenders] = useState([]);
    const [selectedOffender, setSelectedOffender] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [editForm, setEditForm] = useState({ phone: '', address: '' });

    // Notes State
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ content: '', type: 'General' });
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);

    // Mock Mugshots (using placeholders for now)
    const getMugshotUrl = (id) => `https://i.pravatar.cc/150?u=${id}`;

    useEffect(() => {
        searchOffenders('');
    }, []);

    useEffect(() => {
        if (selectedOffender) {
            fetchNotes(selectedOffender.id);
        }
    }, [selectedOffender]);

    const [error, setError] = useState(null);

    const searchOffenders = async (term) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log(`Searching: ${term}`); // Debug log
            const response = await axios.get(`http://localhost:8000/offenders?search=${term}&limit=50`);
            console.log('Search Response:', response.data); // Debug log
            if (response.data && Array.isArray(response.data.data)) {
                setOffenders(response.data.data);
            } else {
                console.error("Unexpected API response format:", response.data);
                setError("Invalid server response format");
                setOffenders([]);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError(err.message || "Failed to load offenders");
            setOffenders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 0 || term.length === 0) {
            searchOffenders(term);
        }
    };

    const openEditModal = () => {
        setEditForm({
            phone: selectedOffender.phone || '',
            address: selectedOffender.address || ''
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            // Update Phone
            if (editForm.phone !== selectedOffender.phone) {
                await axios.put(`http://localhost:8000/offenders/${selectedOffender.id}`, { phone: editForm.phone });

                // Create System Audit Note
                try {
                    await axios.post(`http://localhost:8000/offenders/${selectedOffender.id}/notes`, {
                        content: `Phone number changed from "${selectedOffender.phone || 'N/A'}" to "${editForm.phone}" via Field Mode.`,
                        type: 'System'
                    });
                    // Refresh notes if modal is open/cached
                    fetchNotes(selectedOffender.id);
                } catch (noteError) {
                    console.error("Failed to create audit note:", noteError);
                }
            }

            // Note: Address update requires the 'Move' endpoint, omitted here for simplicity 
            // of this specific "Edit" button request unless user moves.
            // But we will update the UI state to reflect changes instantly.

            setSelectedOffender(prev => ({ ...prev, phone: editForm.phone }));
            setShowEditModal(false);
        } catch (error) {
            console.error("Failed to update:", error);
            alert("Failed to save changes.");
        }
    };

    const fetchNotes = async (offenderId) => {
        setIsLoadingNotes(true);
        try {
            const response = await axios.get(`http://localhost:8000/offenders/${offenderId}/notes`);
            setNotes(response.data || []);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            setIsLoadingNotes(false);
        }
    };

    const handleOpenNotes = () => {
        if (selectedOffender) {
            fetchNotes(selectedOffender.id);
            setShowNotesModal(true);
        }
    };

    const handleSaveNote = async () => {
        if (!newNote.content.trim()) return;
        try {
            await axios.post(`http://localhost:8000/offenders/${selectedOffender.id}/notes`, newNote);
            setNewNote({ content: '', type: 'General' });
            fetchNotes(selectedOffender.id); // Refresh list
        } catch (error) {
            console.error("Failed to save note:", error);
            alert("Failed to save note.");
        }
    };

    const RiskBadge = ({ level }) => {
        const colors = {
            'High': 'bg-red-100 text-red-800 border-red-200',
            'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Low': 'bg-green-100 text-green-800 border-green-200'
        };
        const defaultColor = 'bg-slate-100 text-slate-800 border-slate-200';

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || defaultColor}`}>
                {level || 'Unknown'} Risk
            </span>
        );
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20 relative">
            {/* Sticky Search Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search Name or Badge #..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-4">
                {selectedOffender ? (
                    // --- Detailed Snapshot Card ---
                    // --- Detailed Snapshot Card ---
                    <>
                        <div className="animate-in slide-in-from-right duration-200">
                            <button
                                onClick={() => setSelectedOffender(null)}
                                className="text-sm text-slate-500 mb-2 flex items-center hover:text-blue-600"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" /> Back to List
                            </button>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                                {/* Safety Alerts Banner */}
                                {selectedOffender.isSexOffender && (
                                    <div className="bg-red-500 text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 fill-white" />
                                        SEX OFFENDER REGISTRY
                                    </div>
                                )}

                                <button
                                    onClick={openEditModal}
                                    className="absolute top-16 right-4 p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 z-10"
                                >
                                    <Edit2 size={18} />
                                </button>

                                <div className="p-6">
                                    {/* Header: Mugshot & Identity */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <img
                                            src={getMugshotUrl(selectedOffender.id)}
                                            alt="Mugshot"
                                            className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-sm bg-slate-200"
                                        />
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">{selectedOffender.last_name}, {selectedOffender.first_name}</h2>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-slate-500 font-mono">#{selectedOffender.offender_number || '000000'}</span>
                                            </div>
                                            <RiskBadge level={selectedOffender.risk_level} />
                                        </div>
                                    </div>

                                    {/* Quick Contact Actions */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <a
                                            href={`tel:${selectedOffender.phone || selectedOffender.phone_number || selectedOffender.cell_phone}`}
                                            className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all"
                                        >
                                            <Phone className="w-5 h-5 text-blue-600" />
                                            Call
                                        </a>
                                        <a
                                            href={`https://maps.google.com/?q=${selectedOffender.address}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all"
                                        >
                                            <MapPin className="w-5 h-5 text-red-500" />
                                            Map
                                        </a>
                                    </div>

                                    {/* Key Field Info */}
                                    <div className="space-y-4 divide-y divide-slate-100">
                                        <div className="pt-2 first:pt-0">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Address</label>
                                            <p className="text-base font-medium text-slate-800">{selectedOffender.address || 'No Address Listed'}</p>
                                        </div>
                                        <div className="pt-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                                            <p className="text-base font-medium text-slate-800">{selectedOffender.phone || selectedOffender.phone_number || selectedOffender.cell_phone || 'No Phone Listed'}</p>
                                        </div>
                                        <div className="pt-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Program</label>
                                            <div
                                                onClick={() => setShowProgramModal(true)}
                                                className="flex items-center gap-2 cursor-pointer group"
                                            >
                                                <p className="text-base font-medium text-blue-600 group-hover:underline">{selectedOffender.program || 'None Assigned'}</p>
                                                <Info size={14} className="text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <div className="flex justify-between">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last UA</label>
                                                    <p className="text-base font-medium text-slate-800">12/01/2025 <span className="text-green-600 text-sm">(Negative)</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</label>
                                                    <p className="text-base font-bold text-slate-800">$120.00</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Case Plan Box */}
                                    <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="text-blue-600 w-4 h-4" />
                                            <h3 className="font-bold text-blue-900 text-sm">Case Plan Goals</h3>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                            <p className="text-sm text-slate-600 font-medium">Current Goal:</p>
                                            <p className="text-sm text-slate-800 mt-1">"Maintain stable employment for 90 days."</p>
                                        </div>
                                    </div>


                                    {/* Full Profile Link */}
                                    <Link
                                        to={`/offenders/${selectedOffender.id}`}
                                        className="block w-full text-center mt-6 py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        View Full Profile
                                    </Link>

                                    {/* Recent Notes Preview */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="text-slate-400 w-4 h-4" />
                                                <h3 className="font-bold text-slate-700 text-sm">Recent Notes</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {isLoadingNotes ? (
                                                <p className="text-xs text-center text-slate-400 py-2">Loading notes...</p>
                                            ) : notes.length > 0 ? (
                                                notes.slice(0, 5).map(note => (
                                                    <div key={note.note_id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${note.type === 'Violation' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {note.type}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(note.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-700 line-clamp-2">{note.content}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400">No notes found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>

                        {/* Floating Action Button (FAB) replacement for bottom bar */}
                        {/* Floating Action Button (FAB) replacement for bottom bar */}
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-[99]">
                            <div className="flex flex-col gap-3 items-end pointer-events-auto">
                                <button
                                    onClick={handleOpenNotes}
                                    title="Add Case Note"
                                    className="p-4 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-90 transition-all flex items-center gap-2"
                                >
                                    <FileText className="w-6 h-6" />
                                    <span className="font-bold pr-2">Add Note</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    // --- Search List View ---
                    <div className="space-y-3">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
                                <p className="font-bold">Error loading data</p>
                                <p className="text-sm">{error}</p>
                                <button onClick={() => searchOffenders(searchTerm)} className="mt-2 text-sm underline">Retry</button>
                            </div>
                        )}
                        {isLoading && <p className="text-center text-slate-400 py-4">Searching database...</p>}

                        {!isLoading && !error && offenders.map(offender => (
                            <div
                                key={offender.id}
                                onClick={() => setSelectedOffender(offender)}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4"
                            >
                                <img
                                    src={getMugshotUrl(offender.id)}
                                    alt=""
                                    className="w-12 h-12 rounded-full object-cover bg-slate-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 truncate">{offender.last_name}, {offender.first_name}</h3>
                                    <p className="text-xs text-slate-500 truncate">{offender.address || 'No Address'}</p>
                                </div>
                                <div className="text-right">
                                    <RiskBadge level={offender.risk_level} />
                                </div>
                            </div>
                        ))}

                        {!isLoading && !error && offenders.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No offenders found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Contact Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Contact Info</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-lg"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Current Address</label>
                                    <textarea
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        rows={3}
                                        value={editForm.address}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Enter new address..."
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Program Details Popup */}
            {
                showProgramModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
                            <button
                                onClick={() => setShowProgramModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Info size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Program Details</h3>
                                <p className="text-slate-500">{selectedOffender.program || 'General Supervision'}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                                    <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Attendance</p>
                                        <p className="text-lg font-bold text-slate-800">95%</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Sessions</p>
                                        <p className="text-lg font-bold text-slate-800">12/30</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Next Session</p>
                                    <p className="text-sm font-medium text-slate-800">Dec 12, 2025 - 6:00 PM</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowProgramModal(false)}
                                className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Case Notes Modal */}
            {
                showNotesModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-slate-800">Case Notes</h3>
                                <button
                                    onClick={() => setShowNotesModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Add New Note */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Add New Note</h4>
                                <div className="space-y-3">
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium"
                                        value={newNote.type}
                                        onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                                    >
                                        <option value="General">General</option>
                                        <option value="Home Visit">Home Visit</option>
                                        <option value="Office Visit">Office Visit</option>
                                        <option value="Phone Call">Phone Call</option>
                                        <option value="Violation">Violation</option>
                                    </select>
                                    <textarea
                                        className="w-full p-3 border border-slate-200 rounded-xl min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Type note content here..."
                                        value={newNote.content}
                                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={!newNote.content.trim()}
                                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Save Note
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Notes */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Recent Notes</h4>
                                <div className="space-y-3">
                                    {isLoadingNotes ? (
                                        <p className="text-center text-slate-400 py-4">Loading notes...</p>
                                    ) : notes.length > 0 ? (
                                        notes.slice(0, 5).map(note => ( // Show last 5
                                            <div key={note.note_id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${note.type === 'Violation' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {note.type}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(note.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    By: {note.author ? `${note.author.last_name}, ${note.author.first_name}` : 'Unknown Officer'}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-400 py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            No notes found.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default FieldModeModule;

