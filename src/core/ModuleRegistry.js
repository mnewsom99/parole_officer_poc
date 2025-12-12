import React from 'react';
import { FileText, Beaker, Activity, DollarSign } from 'lucide-react';

// Lazy load modules to improve performance and true isolation
// Note: In a real dynamic system, these might not even be imported here but registered at runtime.
import DocumentsTab from '../modules/documents/DocumentsTab';
import UATab from '../modules/urinalysis/UATab';
import RiskTab from '../modules/assessments/RiskTab';
import FeesTab from '../modules/finance/FeesTab';

export const ModuleRegistry = {
    tabs: [
        {
            id: 'documents',
            label: 'Documents',
            icon: FileText,
            component: DocumentsTab
        },
        {
            id: 'ua',
            label: 'Urinalysis',
            icon: Beaker,
            component: UATab
        },
        {
            id: 'risk',
            label: 'Risk Assessment',
            icon: Activity,
            component: RiskTab
        },
        {
            id: 'finance',
            label: 'Fees & Finance',
            icon: DollarSign,
            component: FeesTab
        }
    ],

    getTabs: () => ModuleRegistry.tabs
};

export default ModuleRegistry;
