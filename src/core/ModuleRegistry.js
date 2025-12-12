import React from 'react';
import { FileText, Beaker, Activity, DollarSign } from 'lucide-react';

// Lazy load modules to improve performance and true isolation
// Note: In a real dynamic system, these might not even be imported here but registered at runtime.
import DocumentsTab from '../modules/documents/DocumentsTab';
import DrugTestingTab from '../modules/drug-testing/DrugTestingTab';
import RiskTab from '../modules/assessments/RiskTab';
import FeesTab from '../modules/finance/FeesTab';

export const ModuleRegistry = {
    tabs: [
        {
            id: 'drug_testing',
            label: 'Drug Testing',
            icon: Beaker,
            component: DrugTestingTab
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
        },
        {
            id: 'documents',
            label: 'Documents',
            icon: FileText,
            component: DocumentsTab
        }
    ],

    getTabs: () => ModuleRegistry.tabs
};

export default ModuleRegistry;
