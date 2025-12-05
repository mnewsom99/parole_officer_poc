import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../../context/UserContext';
import { User, Shield, Edit, Save, X } from 'lucide-react';

const UserManagement = () => {
    const { availableRoles } = useUser();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);

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
    }, []);

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
            setSupervisors(offRes.data); // Filter for supervisors if needed, or backend handles it? 
            // Ideally frontend filters or backend endpoint provides specific list.
            // Using all officers as potential supervisors for simplicity/flexibility
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };

    const handleOpenInvite = () => {
        if (locations.length === 0) fetchFormData();
        setIsInviteModalOpen(true);
    };

    const handleEditClick = (user) => {
        setEditingUserId(user.user_id);
        setSelectedRole(user.role_id);
    };

    const handleSaveRole = async (userId) => {
        if (!selectedRole) return;
        try {
            await axios.put(`http://localhost:8000/users/${userId}/role`, { role_id: selectedRole });
            fetchUsers();
            setEditingUserId(null);
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role");
        }
    };

    const handleToggleStatus = async (user) => {
        if (user.role?.role_name === 'Admin') return; // Prevent deactivating last admin if we had logic, unsafe generally

        try {
            await axios.put(`http://localhost:8000/users/${user.user_id}/status`, {
                is_active: !user.is_active
            });
            fetchUsers();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
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

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">User Management</h3>
                    <p className="text-sm text-slate-500">Manage system users and their role assignments.</p>
                </div>
                <button
                    onClick={handleOpenInvite}
                    className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-700"
                >
                    + Invite User
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.user_id} className={`hover:bg-slate-50 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <User size={16} className="text-slate-500" />
                                        </div>
                                        <span className="font-medium text-slate-800">{user.username}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                                <td className="px-4 py-3">
                                    {editingUserId === user.user_id ? (
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                                            className="p-1 border border-slate-300 rounded text-sm bg-white"
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRoleColor(user.role?.role_name)}`}>
                                            {user.role?.role_name || 'No Role'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleToggleStatus(user)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {editingUserId === user.user_id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleSaveRole(user.user_id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16} /></button>
                                            <button onClick={() => setEditingUserId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEditClick(user)} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><Edit size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invite User Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
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
                                    {availableRoles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                                </select>
                                <select required className="border p-2 rounded" value={newUser.location_id} onChange={e => setNewUser({ ...newUser, location_id: e.target.value })}>
                                    <option value="">Select Office</option>
                                    {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.name}</option>)}
                                </select>
                            </div>
                            <select className="w-full border p-2 rounded" value={newUser.supervisor_id} onChange={e => setNewUser({ ...newUser, supervisor_id: e.target.value })}>
                                <option value="">Select Supervisor (Optional)</option>
                                {supervisors.map(s => <option key={s.officer_id} value={s.officer_id}>{s.first_name} {s.last_name} ({s.badge_number})</option>)}
                            </select>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
