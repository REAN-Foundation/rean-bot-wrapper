///////////////////////////////////////////////////////////////////////////////

export const CATEGORY_OTHERS = 'Others';

export const LOVE_MATTERS_CATEGORIES = [
    'Love and Relationships',
    'Making Love',
    'Our Bodies',
    'Safe Sex',
    'Birth Control',
    'Pregnancy',
    'Sexual Diversity',
    'Small Talk'
];

export const CATEGORY_KEYS = [...LOVE_MATTERS_CATEGORIES, CATEGORY_OTHERS];

export const BOT_FLOW_INTENTS = [
    'Default Welcome Intent',
    'UserInfo',
    'PositiveFeedback',
    'NegativeFeedback',
    'StartAssessment',
    'AssessmentReprompt',
    'WelcomeMessage',
    'deleteHistory',
    'deleteHistory - custom',
    'Age Restriction',
    'No info'
];

export const FEEDBACK_KEYS = ['Positive Feedback', 'Negative Feedback'];

export const SENSITIVITY_KEYS = ['Not sensitive', 'Sensitive but Safe', 'High Sensitivity', 'Critical / Urgent'];

export const UNKNOWN = 'Unknown';

export const GENDER_KEYS = ['Male', 'Female', 'Other', 'Prefer not to say', UNKNOWN];

export const AGE_GROUPS: { label: string; min: number; max: number }[] = [
    { label: '<18', min: 1, max: 17 },
    { label: '18-21', min: 18, max: 21 },
    { label: '22-25', min: 22, max: 25 },
    { label: '26-34', min: 26, max: 34 },
    { label: '35-44', min: 35, max: 44 },
    { label: '45+', min: 45, max: 120 }
];

export const AGE_GROUP_KEYS = [...AGE_GROUPS.map((g) => g.label), UNKNOWN];

///////////////////////////////////////////////////////////////////////////////

export interface LoveMattersCustomStats {
    usersWithInfo: number;
    feedback: Record<string, number>;
    categoryInteractions: Record<string, number>;
    gender: Record<string, number>;
    ageGroup: Record<string, number>;
    hour: Record<string, number>;
    sensitivity: Record<string, number>;
}

const zeros = (keys: string[]): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const key of keys) {
        result[key] = 0;
    }
    return result;
};

export const HOUR_KEYS = Array.from({ length: 24 }, (_, h) => String(h));

export const emptyCustomStats = (): LoveMattersCustomStats => ({
    usersWithInfo        : 0,
    feedback             : zeros(FEEDBACK_KEYS),
    categoryInteractions : zeros(CATEGORY_KEYS),
    gender               : zeros(GENDER_KEYS),
    ageGroup             : zeros(AGE_GROUP_KEYS),
    hour                 : zeros(HOUR_KEYS),
    sensitivity          : zeros(SENSITIVITY_KEYS)
});

///////////////////////////////////////////////////////////////////////////////

const categoryByKey = new Map<string, string>(LOVE_MATTERS_CATEGORIES.map((c) => [c.toLowerCase(), c]));

export const toCategory = (intent?: string | null): string => {
    const key = intent?.trim().toLowerCase();
    return (key && categoryByKey.get(key)) || CATEGORY_OTHERS;
};

const GENDER_LABELS: Record<string, string> = {
    'male'              : 'Male',
    'female'            : 'Female',
    'other'             : 'Other',
    'prefer not to say' : 'Prefer not to say',
    'unknown'           : UNKNOWN,
    'null'              : UNKNOWN
};

const toTitleCase = (value: string): string => {
    return value.toLowerCase().replace(/(^|[^a-z0-9])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
};

export const toGender = (value?: string | null): string => {
    const trimmed = value?.trim();
    if (!trimmed) {
        return UNKNOWN;
    }
    return GENDER_LABELS[trimmed.toLowerCase()] ?? toTitleCase(trimmed);
};

export const toAgeGroup = (value?: number | string | null): string => {
    const age = value === null || value === undefined || value === '' ? NaN : Number(value);
    if (!Number.isFinite(age) || age <= 0 || age > 120) {
        return UNKNOWN;
    }
    const group = AGE_GROUPS.find((g) => age >= g.min && age <= g.max);
    return group ? group.label : UNKNOWN;
};
