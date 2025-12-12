import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import AppointmentDetailModal from '../../components/modals/AppointmentDetailModal';
import CreateAppointmentModal from '../../components/modals/CreateAppointmentModal';
import CalendarHeader from './components/CalendarHeader';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import UpcomingSidePanel from './components/UpcomingSidePanel';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    isSameDay
} from 'date-fns';

const CalendarModule = () => {
    const { currentUser, globalFilter, updateGlobalFilter, appointmentSettings } = useUser();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', '2week'
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalDate, setCreateModalDate] = useState(null);

    // New State for sidebar selection
    const [selectedDate, setSelectedDate] = useState(null);

    // Filtering State (Local only for status/sort, global for office/officer)
    const [officers, setOfficers] = useState([]);
    const [offices, setOffices] = useState([]);
    const [selectedType, setSelectedType] = useState('');

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
                if (globalFilter.office) {
                    url += `?location_id=${globalFilter.office}`;
                }
                const response = await axios.get(url);
                const mappedOfficers = response.data.map(o => ({
                    id: o.officer_id, // Map to officer_id to match global filter expectation
                    name: `${o.first_name} ${o.last_name}`
                }));
                setOfficers(mappedOfficers);
            } catch (error) {
                console.error("Error fetching officers:", error);
            }
        };
        fetchOfficers();
    }, [globalFilter.office]);

    // Default Filter to Current User
    useEffect(() => {
        if (!currentUser) return;

        const updates = {};
        if (currentUser.officerId && !globalFilter.officer) { // Use officerId
            updates.officer = currentUser.officerId;
        }
        if (currentUser.locationId && !globalFilter.office) {
            updates.office = currentUser.locationId;
        }

        if (Object.keys(updates).length > 0) {
            updateGlobalFilter(updates);
        }
    }, [currentUser]);

    // Fetch Appointments
    const fetchAppointments = async () => {
        try {
            const params = new URLSearchParams();
            if (globalFilter.officer) params.append('officer_id', globalFilter.officer);
            if (globalFilter.office) params.append('location_id', globalFilter.office);
            if (selectedType) params.append('appointment_type', selectedType);

            const response = await axios.get(`http://localhost:8000/appointments?${params.toString()}`);
            setAppointments(response.data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [currentMonth, globalFilter.officer, globalFilter.office, selectedType]);

    const handleNext = () => {
        if (viewMode === 'month') setCurrentMonth(addMonths(currentMonth, 1));
        else if (viewMode === 'week') setCurrentMonth(addWeeks(currentMonth, 1));
        else if (viewMode === '2week') setCurrentMonth(addWeeks(currentMonth, 2));
    };

    const handlePrev = () => {
        if (viewMode === 'month') setCurrentMonth(subMonths(currentMonth, 1));
        else if (viewMode === 'week') setCurrentMonth(subWeeks(currentMonth, 1));
        else if (viewMode === '2week') setCurrentMonth(subWeeks(currentMonth, 2));
    };

    const jumpToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    const handleEventClick = (e, appointment) => {
        e.stopPropagation(); // prevent triggering day click
        setSelectedAppointment(appointment);
        setIsDetailModalOpen(true);
    };

    const handleDayClick = (day) => {
        // Toggle selection
        if (selectedDate && isSameDay(day, selectedDate)) {
            setSelectedDate(null);
        } else {
            setSelectedDate(day);
        }
    };

    const handleAppointmentUpdate = (updatedAppt) => {
        setAppointments(prev => prev.map(a => a.appointment_id === updatedAppt.appointment_id ? updatedAppt : a));
    };

    const handleAppointmentDelete = (id) => {
        setAppointments(prev => prev.filter(a => a.appointment_id !== id));
    };

    const handleAppointmentCreate = (newAppt) => {
        setAppointments(prev => [...prev, newAppt].sort((a, b) => new Date(a.date_time) - new Date(b.date_time)));
    };

    // Generate Calendar Grid
    let startDate, endDate;

    if (viewMode === 'month') {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        startDate = startOfWeek(monthStart);
        endDate = endOfWeek(monthEnd);
    } else if (viewMode === 'week') {
        startDate = startOfWeek(currentMonth);
        endDate = endOfWeek(currentMonth);
    } else if (viewMode === '2week') {
        startDate = startOfWeek(currentMonth);
        endDate = endOfWeek(addWeeks(currentMonth, 1));
    }

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Upcoming List Logic
    const displayedAppointments = selectedDate
        ? appointments.filter(appt => isSameDay(new Date(appt.date_time), selectedDate))
        : appointments
            .filter(appt => new Date(appt.date_time) >= new Date())
            .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
            .slice(0, 10);

    const getDayEvents = (day) => {
        return appointments.filter(appt => isSameDay(new Date(appt.date_time), day));
    };

    return (
        <div className="relative">
            <div className="space-y-6">
                <CalendarHeader
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    currentMonth={currentMonth}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onToday={jumpToToday}
                    globalFilter={globalFilter}
                    updateGlobalFilter={updateGlobalFilter}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    onCreateClick={() => { setCreateModalDate(new Date()); setIsCreateModalOpen(true); }}
                    offices={offices}
                    officers={officers}
                    appointmentSettings={appointmentSettings}
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 bg-white/70 backdrop-blur-xl rounded-xl shadow-sm border border-white/50 flex flex-col h-[1100px] overflow-hidden">
                        {(viewMode === 'month' || viewMode === '2week') && (
                            <MonthView
                                currentMonth={currentMonth}
                                calendarDays={calendarDays}
                                getDayEvents={getDayEvents}
                                selectedDate={selectedDate}
                                onDayClick={handleDayClick}
                                onEventClick={handleEventClick}
                                appointmentSettings={appointmentSettings}
                            />
                        )}

                        {viewMode === 'week' && (
                            <WeekView
                                calendarDays={calendarDays}
                                getDayEvents={getDayEvents}
                                onDayClick={handleDayClick}
                                onEventClick={handleEventClick}
                                appointmentSettings={appointmentSettings}
                            />
                        )}
                    </div>

                    <UpcomingSidePanel
                        selectedDate={selectedDate}
                        onClearDate={() => setSelectedDate(null)}
                        appointments={displayedAppointments}
                        onEventClick={handleEventClick}
                        onCreateForDate={() => { setCreateModalDate(selectedDate); setIsCreateModalOpen(true); }}
                        appointmentSettings={appointmentSettings}
                    />

                    <AppointmentDetailModal
                        isOpen={isDetailModalOpen}
                        onClose={() => setIsDetailModalOpen(false)}
                        appointment={selectedAppointment}
                        onUpdate={handleAppointmentUpdate}
                        onDelete={handleAppointmentDelete}
                    />

                    <CreateAppointmentModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreate={handleAppointmentCreate}
                        initialDate={createModalDate}
                    />
                </div>
            </div>
        </div>
    );
};

export default CalendarModule;
