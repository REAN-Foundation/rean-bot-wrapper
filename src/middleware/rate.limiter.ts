import rateLimit from 'express-rate-limit';

const ONE_MINUTE_MS = 60 * 1000;

const createRateLimiter = (maxRequestsPerMinute: number) => rateLimit({
    windowMs        : ONE_MINUTE_MS,
    max             : maxRequestsPerMinute,
    standardHeaders : true,
    legacyHeaders   : false,
    message         : {
        Status   : 'failure',
        Message  : 'Too many requests, please try again later.',
        HttpCode : 429
    }
});

export const userRegistrationRateLimiter = createRateLimiter(100);

export const userDeletionRateLimiter = createRateLimiter(20);
