import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useUser } from '../../../core/context/UserContext';
import { User, Shield, Edit, Save, X, Search } from 'lucide-react';

const UserManagement = () => {
    const { } = useUser();
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedOfficer, setSelectedOfficer] = useState(null); // Full officer details
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form Data - Merged User + Officer fields
    const [editFormData, setEditFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        cell_phone: '',
        role_id: '',
        location_id: '',
        supervisor_id: '',
        is_active: true,
        new_password: ''
    });

    // Invite User State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [locations, setLocations] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        badge_number: '',
        role_id: '',
        location_id: '',
        supervisor_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchFormData(); // Ensure locations/supervisors are loaded for the modal
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await axios.get('http://localhost:8000/roles');
            setAvailableRoles(response.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:8000/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const [locRes, offRes] = await Promise.all([
                axios.get('http://localhost:8000/locations'),
                axios.get('http://localhost:8000/officers')
            ]);
            setLocations(locRes.data);
            setSupervisors(offRes.data);
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };

    const fetchOfficerDetails = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:8000/users/${userId}/officer`);
            return response.data;
        } catch (error) {
            console.error("Error fetching officer details:", error);
            return null;
        }
    };

    const handleOpenInvite = () => {
        if (locations.length === 0) fetchFormData();
        setIsInviteModalOpen(true);
    };

    //Filter Users
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Modal Handlers ---

    const prepareModalData = async (user, editMode = false) => {
        setSelectedUser(user);
        setIsEditMode(editMode);

        // Fetch full details
        const officer = await fetchOfficerDetails(user.user_id);
        setSelectedOfficer(officer);

        // Populate Form Data
        setEditFormData({
            first_name: officer?.first_name || '',
            last_name: officer?.last_name || '',
            email: user.email,
            phone_number: officer?.phone_number || '',
            cell_phone: officer?.cell_phone || '',
            role_id: user.role_id,
            location_id: officer?.location_id || '',
            supervisor_id: officer?.supervisor_id || '',
            is_active: user.is_active,
            new_password: ''
        });

        setIsDetailModalOpen(true);
    };

    const handleUserClick = (user) => {
        prepareModalData(user, false);
    };

    const handleEditClick = (user, e) => {
        e.stopPropagation();
        prepareModalData(user, true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            const updates = [];

            // 1. User Updates (Role, Status, Password)
            if (editFormData.role_id !== selectedUser.role_id) {
                updates.push(axios.put(`http://localhost:8000/users/${selectedUser.user_id}/role`, { role_id: editFormData.role_id }));
            }
            if (editFormData.is_active !== selectedUser.is_active) {
                updates.push(axios.put(`http://localhost:8000/users/${selectedUser.user_id}/status`, { is_active: editFormData.is_active }));
            }
            if (editFormData.new_password && editFormData.new_password.trim() !== '') {
                updates.push(axios.put(`http://localhost:8000/users/${selectedUser.user_id}/reset-password`, { new_password: editFormData.new_password }));
            }

            // 2. Officer Updates (Profile Info)
            if (selectedOfficer) {
                const officerUpdate = {
                    first_name: editFormData.first_name,
                    last_name: editFormData.last_name,
                    email: editFormData.email, // Backend syncs user email too
                    phone_number: editFormData.phone_number,
                    cell_phone: editFormData.cell_phone,
                    location_id: editFormData.location_id || null,
                    supervisor_id: editFormData.supervisor_id || null
                };
                updates.push(axios.put(`http://localhost:8000/officers/${selectedOfficer.officer_id}`, officerUpdate));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                alert("User profile updated successfully");
                fetchUsers(); // Refresh list to see Role/Status changes
                setIsDetailModalOpen(false);
            } else {
                setIsDetailModalOpen(false); // No changes
            }

        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/users/create', {
                ...newUser,
                role_id: parseInt(newUser.role_id),
                location_id: newUser.location_id || null,
                supervisor_id: newUser.supervisor_id || null
            });
            setIsInviteModalOpen(false);
            setNewUser({
                username: '', email: '', password: '', first_name: '', last_name: '', badge_number: '', role_id: '', location_id: '', supervisor_id: ''
            });
            fetchUsers();
            alert("User created successfully!");
        } catch (error) {
            console.error("Error creating user:", error);
            alert(error.response?.data?.detail || "Failed to create user");
        }
    };

    const getRoleName = (roleId) => {
        const role = availableRoles.find(r => r.role_id === roleId);
        return role ? role.role_name : 'Unknown';
    };

    const getRoleColor = (roleName) => {
        switch (roleName) {
            case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Supervisor': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Officer': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getUserName = (user) => {
        const officer = supervisors.find(o => o.user_id === user.user_id);
        return officer ? `${officer.first_name} ${officer.last_name}` : user.username;
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">User Management</h3>
                    <p className="text-sm text-slate-500">Manage system users and their role assignments.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 w-64"
                        />
                    </div>
                    <button
                        onClick={handleOpenInvite}
                        className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-700"
                    >
                        + Invite User
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Full Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr
                                key={user.user_id}
                                className={`hover:bg-slate-50 transition-colors cursor-pointer ${!user.is_active ? 'opacity-50' : ''}`}
                            >
                                <td className="px-4 py-3" onClick={() => handleUserClick(user)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <User size={16} className="text-slate-500" />
                                        </div>
                                        <span className="font-medium text-slate-800 hover:text-blue-600 underline-offset-4 hover:underline">
                                            {getUserName(user)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600" onClick={() => handleUserClick(user)}>{user.email}</td>
                                <td className="px-4 py-3" onClick={() => handleUserClick(user)}>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRoleColor(user.role?.role_name)}`}>
                                        {user.role?.role_name || 'No Role'}
                                    </span>
                                </td>
                                <td className="px-4 py-3" onClick={() => handleUserClick(user)}>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={(e) => handleEditClick(user, e)}
                                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                                        title="Edit User"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Detail / Edit Modal --- */}
            {isDetailModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {isEditMode ? 'Edit User' : 'User Details'}
                            </h3>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="p-8">
                            <div className="flex gap-6 mb-6">
                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <User size={40} className="text-slate-400" />
                                </div>
                                <div className="flex items-center">
                                    <h4 className="text-xl font-bold text-slate-800">{selectedUser.username}</h4>
                                    {isEditMode && <span className="ml-2 text-xs text-blue-600 cursor-pointer">Change Photo</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                                    <input
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.first_name}
                                        onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                    />
                                </div>
                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                                    <input
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.last_name}
                                        onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                    <input
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.email}
                                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                    />
                                </div>
                                {/* Office Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Office Phone</label>
                                    <input
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.phone_number}
                                        onChange={e => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                    />
                                </div>

                                {/* Cell Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cell Phone</label>
                                    <input
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.cell_phone}
                                        onChange={e => setEditFormData({ ...editFormData, cell_phone: e.target.value })}
                                    />
                                </div>
                                {/* Supervisor */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Supervisor</label>
                                    <select
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.supervisor_id}
                                        onChange={e => setEditFormData({ ...editFormData, supervisor_id: e.target.value })}
                                    >
                                        <option value="">Select Supervisor</option>
                                        {supervisors.map(s => (
                                            <option key={s.officer_id} value={s.officer_id}>{s.first_name} {s.last_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Office Location - Full Width */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Office Location</label>
                                    <select
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.location_id}
                                        onChange={e => setEditFormData({ ...editFormData, location_id: e.target.value })}
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(l => (
                                            <option key={l.location_id} value={l.location_id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <hr className="my-6 border-slate-200" />

                            {/* Role and Status */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                                    <select
                                        disabled={!isEditMode}
                                        className="w-full p-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                        value={editFormData.role_id}
                                        onChange={e => setEditFormData({ ...editFormData, role_id: parseInt(e.target.value) })}
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                    <div className="flex h-10 items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                disabled={!isEditMode}
                                                name="status"
                                                checked={editFormData.is_active === true}
                                                onChange={() => setEditFormData({ ...editFormData, is_active: true })}
                                            />
                                            <span className="text-sm text-slate-700">Active</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                disabled={!isEditMode}
                                                name="status"
                                                checked={editFormData.is_active === false}
                                                onChange={() => setEditFormData({ ...editFormData, is_active: false })}
                                            />
                                            <span className="text-sm text-slate-700">Inactive</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Password Reset - Only in Edit Mode */}
                            {isEditMode && (
                                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Reset Password</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                        <input
                                            type="password"
                                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm"
                                            placeholder="Enter new password to reset (leave blank to keep current)"
                                            value={editFormData.new_password}
                                            onChange={e => setEditFormData({ ...editFormData, new_password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 flex justify-end gap-3">
                                {!isEditMode ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditMode(true)}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setIsDetailModalOpen(false)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                                        >
                                            <Save size={16} />
                                            Save Changes
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite User Modal */}
            {isInviteModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden relative z-[10000]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Invite New User</h3>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input required placeholder="First Name" className="border p-2 rounded" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} />
                                <input required placeholder="Last Name" className="border p-2 rounded" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input required placeholder="Username" className="border p-2 rounded" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                                <input required placeholder="Badge Number" className="border p-2 rounded" value={newUser.badge_number} onChange={e => setNewUser({ ...newUser, badge_number: e.target.value })} />
                            </div>
                            <input required type="email" placeholder="Email Address" className="w-full border p-2 rounded" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            <input required type="password" placeholder="Temporary Password" className="w-full border p-2 rounded" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />

                            <div className="grid grid-cols-2 gap-4">
                                <select required className="border p-2 rounded" value={newUser.role_id} onChange={e => setNewUser({ ...newUser, role_id: e.target.value })}>
                                    <option value="">Select Role</option>
                                    {availableRoles?.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                                </select>
                                <select required className="border p-2 rounded" value={newUser.location_id} onChange={e => setNewUser({ ...newUser, location_id: e.target.value })}>
                                    <option value="">Select Office</option>
                                    {locations?.map(l => <option key={l.location_id} value={l.location_id}>{l.name}</option>)}
                                </select>
                            </div>
                            <select className="w-full border p-2 rounded" value={newUser.supervisor_id} onChange={e => setNewUser({ ...newUser, supervisor_id: e.target.value })}>
                                <option value="">Select Supervisor (Optional)</option>
                                {supervisors?.map(s => <option key={s.officer_id} value={s.officer_id}>{s.first_name} {s.last_name} ({s.badge_number})</option>)}
                            </select>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
};

export default UserManagement;
