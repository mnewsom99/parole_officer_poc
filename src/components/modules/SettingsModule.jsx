import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Shield, Database, FileText, Plus, Trash2, Calendar, Building } from 'lucide-react';
import axios from 'axios';
import SchemaViewer from './SchemaViewer';
import UserManagement from './settings/UserManagement';
import { useUser } from '../../context/UserContext';

const SettingsModule = () => {
    const { hasPermission, currentUser } = useUser();
    const [activeView, setActiveView] = useState('profile');
    const [noteTypes, setNoteTypes] = useState([]);
    const [newType, setNewType] = useState('');
    const [newColor, setNewColor] = useState('bg-slate-100 text-slate-700');

    // Appointment Settings State
    const [apptTypes, setApptTypes] = useState([]);
    const [newApptType, setNewApptType] = useState('');
    const [apptLocations, setApptLocations] = useState([]);
    const [newApptLocation, setNewApptLocation] = useState('');

    const colorOptions = [
        { label: 'Gray', value: 'bg-slate-100 text-slate-700' },
        { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
        { label: 'Green', value: 'bg-green-100 text-green-700' },
        { label: 'Red', value: 'bg-red-100 text-red-700' },
        { label: 'Yellow', value: 'bg-yellow-100 text-yellow-700' },
        { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
    ];

    // System Data State
    const [locations, setLocations] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [newLocation, setNewLocation] = useState({ name: '', address: '', type: 'Field Office' });

    useEffect(() => {
        fetchNoteTypes();
        fetchAppointmentSettings();
        fetchSystemData();
    }, []);

    const fetchNoteTypes = async () => {
        try {
            const response = await axios.get('http://localhost:8000/settings/note-types');
            setNoteTypes(response.data);
        } catch (error) {
            console.error("Error fetching note types:", error);
        }
    };

    const fetchAppointmentSettings = async () => {
        try {
            const [typesRes, locsRes] = await Promise.all([
                axios.get('http://localhost:8000/settings/appointment-types'),
                axios.get('http://localhost:8000/settings/appointment-locations')
            ]);
            setApptTypes(typesRes.data);
            setApptLocations(locsRes.data);
        } catch (error) {
            console.error("Error fetching appointment settings:", error);
        }
    };

    const fetchSystemData = async () => {
        try {
            const [locRes, offRes] = await Promise.all([
                axios.get('http://localhost:8000/locations'),
                axios.get('http://localhost:8000/officers')
            ]);
            setLocations(locRes.data);
            setSupervisors(offRes.data);
        } catch (error) {
            console.error("Error fetching system data:", error);
        }
    };

    const handleAddType = () => {
        if (newType && !noteTypes.some(t => t.name === newType)) {
            setNoteTypes([...noteTypes, { name: newType, color: newColor }]);
            setNewType('');
            setNewColor('bg-slate-100 text-slate-700');
        }
    };

    const handleAddApptType = () => {
        if (newApptType && !apptTypes.some(t => t.name === newApptType)) {
            setApptTypes([...apptTypes, { name: newApptType }]);
            setNewApptType('');
        }
    };

    const handleAddApptLocation = () => {
        if (newApptLocation && !apptLocations.some(l => l.name === newApptLocation)) {
            setApptLocations([...apptLocations, { name: newApptLocation }]);
            setNewApptLocation('');
        }
    };

    const handleAddSystemLocation = async () => {
        if (!newLocation.name || !newLocation.address) return;
        try {
            await axios.post('http://localhost:8000/locations', newLocation);
            setNewLocation({ name: '', address: '', type: 'Field Office' });
            fetchSystemData();
        } catch (error) {
            console.error("Error adding location:", error);
            alert("Failed to add location");
        }
    };

    const handleRemoveType = (typeName) => {
        if (window.confirm("Removing this type will remove the color coding from any existing notes of this type. Are you sure?")) {
            setNoteTypes(noteTypes.filter(t => t.name !== typeName));
        }
    };

    const handleRemoveApptType = (typeName) => {
        setApptTypes(apptTypes.filter(t => t.name !== typeName));
    };

    const handleRemoveApptLocation = (locName) => {
        setApptLocations(apptLocations.filter(l => l.name !== locName));
    };

    const handleRemoveSystemLocation = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`http://localhost:8000/locations/${id}`);
            fetchSystemData();
        } catch (error) {
            console.error("Error removing location:", error);
            alert("Failed to remove location (it may be in use)");
        }
    };


    // Profile State
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        locationId: '',
        supervisorId: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                locationId: currentUser.locationId || '',
                supervisorId: currentUser.supervisorId || ''
            });
        }
    }, [currentUser]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveSettings = async () => {
        try {
            const promises = [
                axios.put('http://localhost:8000/settings/note-types', { types: noteTypes }),
                axios.put('http://localhost:8000/settings/appointment-types', { types: apptTypes }),
                axios.put('http://localhost:8000/settings/appointment-locations', { locations: apptLocations })
            ];

            // Add profile update if we have an officer ID
            if (currentUser?.officerId && hasPermission('manage_settings')) {
                promises.push(
                    axios.put(`http://localhost:8000/officers/${currentUser.officerId}`, {
                        first_name: profileData.firstName,
                        last_name: profileData.lastName,
                        email: profileData.email,
                        phone_number: profileData.phone || undefined,
                        location_id: profileData.locationId || undefined,
                        supervisor_id: profileData.supervisorId || undefined
                    })
                );
            }

            await Promise.all(promises);
            alert('Settings saved successfully! You may need to refresh the page to see changes in the header.');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save settings.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                    <p className="text-slate-500">Manage your account and preferences</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="p-4 border-b border-slate-100 font-medium text-slate-800">General</div>
                    <nav className="p-2 space-y-1">
                        <button
                            onClick={() => setActiveView('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Bell className="w-4 h-4" />
                            Notifications
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Shield className="w-4 h-4" />
                            Security
                        </button>
                        {hasPermission('manage_users') && (
                            <button
                                onClick={() => setActiveView('users')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'users' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <User className="w-4 h-4" />
                                Users Management
                            </button>
                        )}

                        <div className="my-2 border-t border-slate-100"></div>
                        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">System</div>

                        <button
                            onClick={() => setActiveView('notes')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'notes' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Case Notes
                        </button>

                        <button
                            onClick={() => setActiveView('locations')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'locations' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Building className="w-4 h-4" />
                            Office Locations
                        </button>

                        <button
                            onClick={() => setActiveView('appointments')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'appointments' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Calendar className="w-4 h-4" />
                            Appointments
                        </button>

                        <button
                            onClick={() => setActiveView('data')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'data' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Database className="w-4 h-4" />
                            Data Architecture
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {activeView === 'data' ? (
                        <SchemaViewer />
                    ) : activeView === 'users' ? (
                        <UserManagement />
                    ) : activeView === 'locations' ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Office Locations</h3>
                            <p className="text-sm text-slate-500 mb-6">Manage the official office locations for the agency.</p>

                            <div className="flex gap-2 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <input placeholder="Name" className="p-2 border rounded text-sm flex-1" value={newLocation.name} onChange={e => setNewLocation({ ...newLocation, name: e.target.value })} />
                                <input placeholder="Address" className="p-2 border rounded text-sm flex-2" value={newLocation.address} onChange={e => setNewLocation({ ...newLocation, address: e.target.value })} />
                                <select className="p-2 border rounded text-sm" value={newLocation.type} onChange={e => setNewLocation({ ...newLocation, type: e.target.value })}>
                                    <option>Field Office</option>
                                    <option>HQ</option>
                                </select>
                                <button onClick={handleAddSystemLocation} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700">Add</button>
                            </div>

                            <div className="space-y-2">
                                {locations.map(loc => (
                                    <div key={loc.location_id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                        <div>
                                            <div className="font-medium text-slate-800">{loc.name}</div>
                                            <div className="text-xs text-slate-500">{loc.address} ({loc.type})</div>
                                        </div>
                                        <button onClick={() => handleRemoveSystemLocation(loc.location_id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {locations.length === 0 && <p className="text-slate-500 text-sm">No locations found.</p>}
                            </div>
                        </div>
                    ) : activeView === 'appointments' ? (
                        <div className="space-y-6">
                            {/* Appointment Types */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Appointment Configuration</h3>
                                <p className="text-sm text-slate-500 mb-6">Manage the standard types of appointments available for scheduling.</p>

                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={newApptType}
                                        onChange={(e) => setNewApptType(e.target.value)}
                                        placeholder="Enter new appointment type..."
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={handleAddApptType}
                                        disabled={!newApptType}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {apptTypes.map((type, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-sm font-medium text-slate-700">{type.name}</span>
                                            <button
                                                onClick={() => handleRemoveApptType(type.name)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {apptTypes.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-4">No appointment types configured.</p>
                                    )}
                                </div>
                            </div>

                            {/* Appointment Locations */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Location Presets</h3>
                                <p className="text-sm text-slate-500 mb-6">Manage common locations used for appointments.</p>

                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={newApptLocation}
                                        onChange={(e) => setNewApptLocation(e.target.value)}
                                        placeholder="Enter new location preset..."
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={handleAddApptLocation}
                                        disabled={!newApptLocation}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {apptLocations.map((loc, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-sm font-medium text-slate-700">{loc.name}</span>
                                            <button
                                                onClick={() => handleRemoveApptLocation(loc.name)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {apptLocations.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-4">No locations configured.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeView === 'notes' ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Case Note Configuration</h3>
                            <p className="text-sm text-slate-500 mb-6">Manage the types of case notes available when documenting offender interactions.</p>

                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    placeholder="Enter new note type..."
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                />
                                <select
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                >
                                    {colorOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddType}
                                    disabled={!newType}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>

                            <div className="space-y-3">
                                {noteTypes.map((type, index) => (
                                    <div key={index} className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <input
                                            type="text"
                                            value={type.name}
                                            onChange={(e) => {
                                                const newTypes = [...noteTypes];
                                                newTypes[index].name = e.target.value;
                                                setNoteTypes(newTypes);
                                            }}
                                            className="flex-1 p-2 border border-slate-200 rounded text-sm"
                                        />
                                        <select
                                            value={type.color}
                                            onChange={(e) => {
                                                const newTypes = [...noteTypes];
                                                newTypes[index].color = e.target.value;
                                                setNoteTypes(newTypes);
                                            }}
                                            className="p-2 border border-slate-200 rounded text-sm bg-white w-32"
                                        >
                                            {colorOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className={`w-8 h-8 rounded border border-slate-200 ${type.color.split(' ').find(c => c.startsWith('bg-'))}`}></div>
                                        <button
                                            onClick={() => handleRemoveType(type.name)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                            title="Remove Type"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {noteTypes.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-4">No note types configured.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Profile Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Profile Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 mb-6">
                                        <img
                                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt="Profile"
                                            className="w-20 h-20 rounded-full border-4 border-slate-50"
                                        />
                                        {hasPermission('manage_settings') && (
                                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Change Photo</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={profileData.firstName}
                                                onChange={handleProfileChange}
                                                readOnly={!hasPermission('manage_settings')}
                                                className={`w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 ${!hasPermission('manage_settings') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={profileData.lastName}
                                                onChange={handleProfileChange}
                                                readOnly={!hasPermission('manage_settings')}
                                                className={`w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 ${!hasPermission('manage_settings') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Badge ID</label>
                                            <input type="text" value={currentUser?.badgeId || ''} readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-slate-500 cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleProfileChange}
                                                readOnly={!hasPermission('manage_settings')}
                                                className={`w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 ${!hasPermission('manage_settings') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
                                            <select
                                                name="supervisorId"
                                                value={profileData.supervisorId}
                                                onChange={handleProfileChange}
                                                disabled={!hasPermission('manage_settings')}
                                                className={`w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 ${!hasPermission('manage_settings') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                                            >
                                                <option value="">Select Supervisor</option>
                                                {supervisors.map(s => (
                                                    <option key={s.officer_id} value={s.officer_id}>{s.first_name} {s.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Office Location</label>
                                            <select
                                                name="locationId"
                                                value={profileData.locationId}
                                                onChange={handleProfileChange}
                                                disabled={!hasPermission('manage_settings')}
                                                className={`w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 ${!hasPermission('manage_settings') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                                            >
                                                <option value="">Select Location</option>
                                                {locations.map(l => (
                                                    <option key={l.location_id} value={l.location_id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Preferences</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Email Notifications</p>
                                            <p className="text-sm text-slate-500">Receive daily summaries and alerts</p>
                                        </div>
                                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-blue-600">
                                            <span className="absolute left-6 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform"></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Dark Mode</p>
                                            <p className="text-sm text-slate-500">Use dark theme for the interface</p>
                                        </div>
                                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-slate-200">
                                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModule;
