import { TimeHelper, DurationType, DateStringFormat } from '../../common/time.helper';
import { ApiError } from '../../common/api.error';
import { MAX_CUSTOM_RANGE_YEARS } from './stats.constants';

///////////////////////////////////////////////////////////////////////////////

export interface ResolvedDateRange {
    start: string; // YYYY-MM-DD, inclusive
    end: string;   // YYYY-MM-DD, exclusive (the day after the last included day)
}

const toDateString = (date: Date): string => {
    return TimeHelper.getDateString(date, DateStringFormat.YYYY_MM_DD);
};

const addDaysToDateString = (dateStr: string, days: number): string => {
    const asDate = TimeHelper.strToUtc(dateStr);
    const shifted = days >= 0
        ? TimeHelper.addDuration(asDate, days, DurationType.Day)
        : TimeHelper.subtractDuration(asDate, Math.abs(days), DurationType.Day);
    return toDateString(shifted);
};

const pad2 = (n: number): string => n.toString().padStart(2, '0');

const splitYearMonth = (dateStr: string): { year: number; month: number } => {
    const [year, month] = dateStr.split('-');
    return { year: parseInt(year, 10), month: parseInt(month, 10) };
};

export { toDateString, addDaysToDateString };

///////////////////////////////////////////////////////////////////////////////

export class DateRangeResolver {

    static resolve(
        range: string, startDate?: string, endDate?: string, latestAvailableDate?: string
    ): ResolvedDateRange {
        const today = latestAvailableDate || toDateString(TimeHelper.nowUtc());
        const tomorrow = addDaysToDateString(today, 1);
        const { year, month } = splitYearMonth(today);

        switch (range) {
        case 'today':
            return { start: today, end: tomorrow };

        case 'last7days':
            return { start: addDaysToDateString(today, -6), end: tomorrow };

        case 'last30days':
            return { start: addDaysToDateString(today, -29), end: tomorrow };

        case 'thisMonth':
            return { start: `${year}-${pad2(month)}-01`, end: tomorrow };

        case 'lastMonth': {
            const thisMonthStart = `${year}-${pad2(month)}-01`;
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            return { start: `${prevYear}-${pad2(prevMonth)}-01`, end: thisMonthStart };
        }

        case 'yearToDate':
            return { start: `${year}-01-01`, end: tomorrow };

        case 'lastYear':
            return { start: `${year - 1}-01-01`, end: `${year}-01-01` };

        case 'custom': {
            if (!startDate || !endDate) {
                throw new ApiError(400, 'startDate and endDate are required for a custom range.');
            }
            const startAsDate = TimeHelper.strToUtc(startDate);
            const endAsDate = TimeHelper.strToUtc(endDate);
            const rangeDays = TimeHelper.dayDiff(endAsDate, startAsDate);
            if (rangeDays < 0) {
                throw new ApiError(400, 'Invalid custom date range: endDate must be on or after startDate.');
            }
            if (rangeDays > MAX_CUSTOM_RANGE_YEARS * 365) {
                throw new ApiError(400, `Custom range cannot exceed ${MAX_CUSTOM_RANGE_YEARS} years.`);
            }
            return { start: startDate, end: addDaysToDateString(endDate, 1) };
        }

        default:
            throw new ApiError(400, `Unknown range preset: "${range}". Expected one of: today, last7days, ` +
                'last30days, thisMonth, lastMonth, yearToDate, lastYear, custom.');
        }
    }

}
