import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';

const ProfileSettings = ({ currentUser, hasPermission }) => {
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        cellPhone: '',
        supervisorId: '',
        locationId: ''
    });
    const [locations, setLocations] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                cellPhone: currentUser.cellPhone || '',
                supervisorId: currentUser.supervisorId || '',
                locationId: currentUser.locationId || ''
            });
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchSystemData = async () => {
            try {
                const [locRes, offRes] = await Promise.all([
                    axios.get('http://localhost:8000/locations'),
                    axios.get('http://localhost:8000/officers')
                ]);
                setLocations(locRes.data || []);
                setSupervisors(offRes.data || []);
            } catch (error) {
                console.error("Error fetching system data:", error);
            }
        };
        fetchSystemData();
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        if (!currentUser?.user_id && !currentUser?.officerId) return;

        if (!currentUser.officerId) {
            alert("No officer profile linked to this user.");
            return;
        }

        try {
            await axios.put(`http://localhost:8000/officers/${currentUser.officerId}`, {
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email: profileData.email,
                phone_number: profileData.phone || undefined,
                cell_phone: profileData.cellPhone || undefined,
                location_id: profileData.locationId || undefined,
                supervisor_id: profileData.supervisorId || undefined
            });
            alert("Profile updated successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        }
    };

    return (
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Office Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            placeholder="555-0100"
                            readOnly={!hasPermission('manage_settings')}
                            className={`w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-700 ${!hasPermission('manage_settings') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cell Phone</label>
                        <input
                            type="tel"
                            name="cellPhone"
                            value={profileData.cellPhone || ''}
                            onChange={handleProfileChange}
                            placeholder="555-0199"
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
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveProfile}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
