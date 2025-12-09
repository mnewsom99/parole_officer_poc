export interface RiskAssessmentQuestion {
    universal_tag: string;
    question_text: string;
    input_type: 'date' | 'select' | 'integer' | 'boolean' | 'scale_0_3';
    source_type: 'static' | 'dynamic';
    options?: { label: string; value: any }[]; // Derived from parsing rules
    value?: any; // The current answer (for form state)
}

export interface OffenderProfile {
    // Subset of offender data mapped to universals
    dob?: string;
    gender?: string;
    // ... potentially other static fields
}

export interface AssessmentSession {
    assessment_id?: string;
    offender_id: string;
    type: string; // 'ORAS', 'Static-99R'
    date: string;
    status: 'Draft' | 'Completed';
    answers: Record<string, AnswerData>; // Keyed by universal_tag
}

export interface AnswerData {
    value: any;
    is_imported: boolean;
    source?: string; // e.g., "Imported from Assessment on 12/01"
}
