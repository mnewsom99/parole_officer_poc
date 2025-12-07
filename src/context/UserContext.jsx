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

    // eslint-disable-next-line react-refresh/only-export-components
    return (
        <UserContext.Provider value={{ currentUser, login, logout, hasPermission, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(UserContext);
