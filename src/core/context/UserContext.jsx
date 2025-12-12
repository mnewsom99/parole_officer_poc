import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(false);

    // Initialize: Check for token and fetch user
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                setIsLoading(true);
                try {
                    // Set default auth header for all axios requests
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await axios.get('http://localhost:8000/users/me');
                    const user = response.data;

                    // Fetch Officer details for all users (if available)
                    let officerDetails = null;

                    try {
                        const officerRes = await axios.get(`http://localhost:8000/users/${user.user_id}/officer`);
                        officerDetails = officerRes.data;
                    } catch (e) {
                        // console.log('No officer details found', e); 
                    }

                    setCurrentUser({
                        ...user,
                        name: officerDetails ? `${officerDetails.first_name} ${officerDetails.last_name}` : user.username,
                        firstName: officerDetails ? officerDetails.first_name : '',
                        lastName: officerDetails ? officerDetails.last_name : '',
                        email: user.email,
                        role: user.role ? user.role.role_name : 'Unknown',
                        badgeId: officerDetails ? officerDetails.badge_number : 'N/A',
                        id: user.user_id,
                        officerId: officerDetails ? officerDetails.officer_id : null,
                        locationId: officerDetails ? officerDetails.location_id : null,
                        supervisorName: officerDetails && officerDetails.supervisor ? `${officerDetails.supervisor.first_name} ${officerDetails.supervisor.last_name}` : '',
                        officeLocation: officerDetails && officerDetails.location ? officerDetails.location.name : '',
                        phone: officerDetails ? officerDetails.phone_number : '',
                        cellPhone: officerDetails ? officerDetails.cell_phone : ''
                    });

                    // Init Settings
                    fetchNoteSettings();
                    fetchOffenderFlagSettings();
                    fetchHousingTypeSettings();
                    fetchTaskSettings();
                } catch (error) {
                    console.error("Failed to restore session:", error);
                    logout();
                }
            } else {
                delete axios.defaults.headers.common['Authorization'];
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post('http://localhost:8000/token', formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);
            setToken(access_token);

            // Explicitly fetch user data immediately to ensure state is updated before returning
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            try {
                const userRes = await axios.get('http://localhost:8000/users/me');
                const user = userRes.data;

                let officerDetails = null;

                try {
                    const officerRes = await axios.get(`http://localhost:8000/users/${user.user_id}/officer`);
                    officerDetails = officerRes.data;
                } catch (e) {
                    // console.log('No officer details found'); 
                }

                setCurrentUser({
                    ...user,
                    name: officerDetails ? `${officerDetails.first_name} ${officerDetails.last_name}` : user.username,
                    firstName: officerDetails ? officerDetails.first_name : '',
                    lastName: officerDetails ? officerDetails.last_name : '',
                    email: user.email,
                    role: user.role ? user.role.role_name : 'Unknown',
                    badgeId: officerDetails ? officerDetails.badge_number : 'N/A',
                    id: user.user_id,
                    officerId: officerDetails ? officerDetails.officer_id : null,
                    locationId: officerDetails ? officerDetails.location_id : null,
                    supervisorName: officerDetails && officerDetails.supervisor ? `${officerDetails.supervisor.first_name} ${officerDetails.supervisor.last_name}` : '',
                    officeLocation: officerDetails && officerDetails.location ? officerDetails.location.name : '',
                    phone: officerDetails ? officerDetails.phone_number : '',
                    cellPhone: officerDetails ? officerDetails.cell_phone : ''
                });

            } catch (fetchError) {
                console.error("Failed to fetch user details after login:", fetchError);
                throw new Error("Login succeeded but failed to load user profile: " + fetchError.message);
            }

            return true;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    // Check if user has permission
    const hasPermission = (permission) => {
        if (!currentUser || !currentUser.role) return false;
        const role = currentUser.role;

        switch (permission) {
            case 'manage_users':
                return role === 'Admin';
            case 'manage_settings':
                return role === 'Admin' || role === 'Manager';
            case 'assign_tasks':
                return true;
            case 'assign_tasks_others':
                return role === 'Admin' || role === 'Manager' || role === 'Supervisor';
            case 'view_all_cases':
                return role !== 'Officer';
            default:
                return false;
        }
    };

    // Global Filter State
    const [globalFilter, setGlobalFilter] = useState({
        office: '',
        officer: ''
    });

    const updateGlobalFilter = (newFilter) => {
        setGlobalFilter(prev => ({
            ...prev,
            ...newFilter
        }));
    };

    // Appointment Settings
    const [appointmentSettings, setAppointmentSettings] = useState({
        types: [
            { name: 'Office Visit', color: 'blue' },
            { name: 'Drug Test', color: 'purple' },
            { name: 'Court Appearance', color: 'red' },
            { name: 'Home Visit', color: 'green' },
            { name: 'Other', color: 'slate' }
        ]
    });

    const updateAppointmentType = (name, newColor) => {
        setAppointmentSettings(prev => ({
            types: prev.types.map(t => t.name === name ? { ...t, color: newColor } : t)
        }));
    };

    const addAppointmentType = (name, color = 'slate') => {
        if (!appointmentSettings.types.find(t => t.name === name)) {
            setAppointmentSettings(prev => ({
                types: [...prev.types, { name, color }]
            }));
        }
    };

    const removeAppointmentType = (name) => {
        setAppointmentSettings(prev => ({
            types: prev.types.filter(t => t.name !== name)
        }));
    };

    // Case Note Settings
    const [caseNoteSettings, setCaseNoteSettings] = useState({ types: [] });

    const fetchNoteSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8000/settings/note-types');
            setCaseNoteSettings({ types: res.data });
        } catch (error) {
            console.error("Error fetching note settings:", error);
        }
    };

    const updateCaseNoteType = async (types) => {
        // Optimistic update
        setCaseNoteSettings({ types });
        try {
            // Persist to backend
            await axios.put('http://localhost:8000/settings/note-types', { types });
        } catch (error) {
            console.error("Error saving note settings:", error);
            fetchNoteSettings(); // Revert on error
        }
    };

    const addCaseNoteType = (name, color) => {
        const newTypes = [...caseNoteSettings.types, { name, color }];
        updateCaseNoteType(newTypes);
    };

    const removeCaseNoteType = (name) => {
        const newTypes = caseNoteSettings.types.filter(t => t.name !== name);
        updateCaseNoteType(newTypes);
    };

    // Offender Flag Settings
    const [offenderFlagSettings, setOffenderFlagSettings] = useState({ types: [] });

    const fetchOffenderFlagSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8000/settings/offender-flags');
            setOffenderFlagSettings({ types: res.data });
        } catch (error) {
            console.error("Error fetching offender flag settings:", error);
        }
    };

    const updateOffenderFlagType = async (types) => {
        // Optimistic update
        setOffenderFlagSettings({ types });
        try {
            // Persist to backend - Key matches schema: "flags"
            await axios.put('http://localhost:8000/settings/offender-flags', { flags: types });
        } catch (error) {
            console.error("Error saving offender flag settings:", error);
            fetchOffenderFlagSettings(); // Revert on error
        }
    };

    const addOffenderFlagType = (name, color) => {
        if (!offenderFlagSettings.types.find(t => t.name === name)) {
            const newTypes = [...offenderFlagSettings.types, { name, color }];
            updateOffenderFlagType(newTypes);
        }
    };

    const removeOffenderFlagType = (name) => {
        const newTypes = offenderFlagSettings.types.filter(t => t.name !== name);
        updateOffenderFlagType(newTypes);
    };

    // Housing Type Settings
    const [housingTypeSettings, setHousingTypeSettings] = useState({ types: [] });

    const fetchHousingTypeSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8000/settings/housing-types');
            setHousingTypeSettings({ types: res.data });
        } catch (error) {
            console.error("Error fetching housing type settings:", error);
        }
    };

    const updateHousingTypeType = async (types) => {
        setHousingTypeSettings({ types });
        try {
            await axios.put('http://localhost:8000/settings/housing-types', { types });
        } catch (error) {
            console.error("Error saving housing type settings:", error);
            fetchHousingTypeSettings();
        }
    };

    const addHousingTypeType = (name, color) => {
        if (!housingTypeSettings.types.find(t => t.name === name)) {
            const newTypes = [...housingTypeSettings.types, { name, color }];
            updateHousingTypeType(newTypes);
        }
    };

    const removeHousingTypeType = (name) => {
        const newTypes = housingTypeSettings.types.filter(t => t.name !== name);
        updateHousingTypeType(newTypes);
    };

    // Task Settings
    const [taskSettings, setTaskSettings] = useState({ categories: [] });

    const fetchTaskSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8000/settings/task-categories');
            setTaskSettings({ categories: res.data });
        } catch (error) {
            console.error("Error fetching task settings:", error);
        }
    };

    const updateTaskSettings = async (categories) => {
        // Optimistic update
        setTaskSettings({ categories });
        try {
            await axios.put('http://localhost:8000/settings/task-categories', { categories });
        } catch (error) {
            console.error("Error saving task settings:", error);
            fetchTaskSettings(); // Revert on error
        }
    };


    // eslint-disable-next-line react-refresh/only-export-components
    return (
        <UserContext.Provider value={{
            currentUser,
            login,
            logout,
            hasPermission,
            isLoading,
            globalFilter,
            updateGlobalFilter,
            appointmentSettings,
            updateAppointmentType,
            addAppointmentType,
            removeAppointmentType,
            caseNoteSettings,
            updateCaseNoteType,
            addCaseNoteType,
            removeCaseNoteType,
            offenderFlagSettings,
            updateOffenderFlagType,
            addOffenderFlagType,
            removeOffenderFlagType,
            housingTypeSettings,
            updateHousingTypeType,
            addHousingTypeType,
            removeHousingTypeType,
            taskSettings,
            updateTaskSettings,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const APPOINTMENT_COLOR_THEMES = {
    'blue': { label: 'Blue', bg: 'bg-blue-400', border: 'border-l-blue-500', text: 'text-blue-700', bgSoft: 'bg-blue-50' },
    'purple': { label: 'Purple', bg: 'bg-purple-400', border: 'border-l-purple-500', text: 'text-purple-700', bgSoft: 'bg-purple-50' },
    'red': { label: 'Red', bg: 'bg-red-400', border: 'border-l-red-500', text: 'text-red-700', bgSoft: 'bg-red-50' },
    'green': { label: 'Green', bg: 'bg-green-400', border: 'border-l-green-500', text: 'text-green-700', bgSoft: 'bg-green-50' },
    'yellow': { label: 'Yellow', bg: 'bg-yellow-400', border: 'border-l-yellow-500', text: 'text-yellow-700', bgSoft: 'bg-yellow-50' },
    'slate': { label: 'Gray', bg: 'bg-slate-400', border: 'border-l-slate-500', text: 'text-slate-700', bgSoft: 'bg-slate-50' },
};

export const NOTE_COLOR_OPTIONS = [
    { label: 'Gray', value: 'bg-slate-100 text-slate-700' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
    { label: 'Green', value: 'bg-green-100 text-green-700' },
    { label: 'Red', value: 'bg-red-100 text-red-700' },
    { label: 'Yellow', value: 'bg-yellow-100 text-yellow-700' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
    { label: 'Cyan', value: 'bg-cyan-100 text-cyan-700' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(UserContext);
