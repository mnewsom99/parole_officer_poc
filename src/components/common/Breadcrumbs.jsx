import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on dashboard (root)
    if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
        return null;
    }

    return (
        <nav className="flex items-center text-sm text-slate-500 mb-4 animate-in fade-in slide-in-from-left-2">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors flex items-center">
                <Home size={14} className="mr-1" />
                Home
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;

                // Format the segment name
                let displayName = value.charAt(0).toUpperCase() + value.slice(1);

                // If it's an ID (looks like UUID or number), try to make it more readable or just show "Details"
                // For now, if it's a long string, let's assume it's an ID and maybe show "Offender Profile" if previous was "offenders"
                if (value.length > 20 || !isNaN(value)) {
                    if (pathnames[index - 1] === 'offenders') {
                        displayName = 'Offender Profile';
                    } else {
                        displayName = 'Details';
                    }
                }

                return (
                    <React.Fragment key={to}>
                        <ChevronRight size={14} className="mx-2 text-slate-400" />
                        {isLast ? (
                            <span className="font-medium text-slate-700">{displayName}</span>
                        ) : (
                            <Link to={to} className="hover:text-blue-600 transition-colors">
                                {displayName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
