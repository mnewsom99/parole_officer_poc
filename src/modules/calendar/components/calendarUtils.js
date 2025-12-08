import { useUser } from '../../../core/context/UserContext';

export const APPOINTMENT_COLOR_THEMES = {
    'blue': { label: 'Blue', bg: 'bg-blue-400', border: 'border-l-blue-500', text: 'text-blue-700', bgSoft: 'bg-blue-50' },
    'purple': { label: 'Purple', bg: 'bg-purple-400', border: 'border-l-purple-500', text: 'text-purple-700', bgSoft: 'bg-purple-50' },
    'red': { label: 'Red', bg: 'bg-red-400', border: 'border-l-red-500', text: 'text-red-700', bgSoft: 'bg-red-50' },
    'green': { label: 'Green', bg: 'bg-green-400', border: 'border-l-green-500', text: 'text-green-700', bgSoft: 'bg-green-50' },
    'yellow': { label: 'Yellow', bg: 'bg-yellow-400', border: 'border-l-yellow-500', text: 'text-yellow-700', bgSoft: 'bg-yellow-50' },
    'slate': { label: 'Gray', bg: 'bg-slate-400', border: 'border-l-slate-500', text: 'text-slate-700', bgSoft: 'bg-slate-50' },
};

export const getAppointmentStyle = (typeName, settings) => {
    const typeSetting = settings?.types.find(t => t.name === typeName);
    const colorName = typeSetting?.color || 'slate';
    return APPOINTMENT_COLOR_THEMES[colorName] || APPOINTMENT_COLOR_THEMES['slate'];
};
