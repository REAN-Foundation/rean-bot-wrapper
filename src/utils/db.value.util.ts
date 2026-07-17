export function toDbString(value: unknown): string | null | undefined {
    if (value === null || value === undefined) {
        return value as null | undefined;
    }
    return String(value);
}
