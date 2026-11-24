export const NON_QUESTION_MESSAGE_TYPES = [
    'interactivebuttons',
    'inline_keyboard',
    'interactivelist',
    'template',
    'location',
    'image'
];

export const MAX_CONTENT_NORMALIZED_LENGTH = 300;

export const DATE_RANGE_PRESETS = [
    'today',
    'last7days',
    'last30days',
    'thisMonth',
    'lastMonth',
    'yearToDate',
    'lastYear',
    'custom'
] as const;

export type DateRangePreset = typeof DATE_RANGE_PRESETS[number];

export const MAX_CUSTOM_RANGE_YEARS = 5;

export const DEFAULT_CONTENT_FREQUENCY_LIMIT = 20;

///////////////////////////////////////////////////////////////////////////////
export const CUSTOM_STATS_TIMEZONE = 'Asia/Kolkata';

export const DEFAULT_CUSTOM_USERS_PAGE_SIZE = 50;

export const MAX_CUSTOM_USERS_PAGE_SIZE = 500;

export const CLICKUP_TASK_BASE_URL = 'https://app.clickup.com/t/';

export const GUEST_USER_NAME = 'Guest';

export const PLATFORM_UNKNOWN = 'Unknown';
export const PLATFORM_LABELS: Record<string, string> = {
    whatsappmeta : 'WhatsApp Meta',
    whatsapp     : 'WhatsApp',
    telegram     : 'Telegram',
    api          : 'API',
    website      : 'Website',
    mockchannel  : 'MockChannel'
};

///////////////////////////////////////////////////////////////////////////////

// Temporary default, used only when CUSTOM_STATS_TENANTS is missing or empty in the env.
export const DEFAULT_CUSTOM_STATS_TENANTS = ['Testing30', 'LOVE_MATTERS'];

let parsedFrom: string | null = null;
let parsedTenants: string[] = [];

const parseCustomStatsTenants = (raw: string): string[] => {
    if (!raw.trim()) {
        return [...DEFAULT_CUSTOM_STATS_TENANTS];
    }
    let value: unknown = null;
    try {
        value = JSON.parse(raw);
    } catch {
        value = null;
    }
    if (Array.isArray(value)) {
        return value.filter((code) => typeof code === 'string' && code.length > 0);
    }
    console.warn(`CUSTOM_STATS_TENANTS must be a JSON array of tenant codes, e.g. ["LOVE_MATTERS"]. Got: ${raw}`);
    return [];
};

export const getCustomStatsTenants = (): string[] => {
    const raw = process.env.CUSTOM_STATS_TENANTS ?? '';
    if (raw !== parsedFrom) {
        parsedTenants = parseCustomStatsTenants(raw);
        parsedFrom = raw;
    }
    return parsedTenants;
};

export const isCustomStatsTenant = (clientName?: string): boolean => {
    return !!clientName && getCustomStatsTenants().includes(clientName);
};
