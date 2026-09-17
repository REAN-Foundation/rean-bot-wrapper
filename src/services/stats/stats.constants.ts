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
