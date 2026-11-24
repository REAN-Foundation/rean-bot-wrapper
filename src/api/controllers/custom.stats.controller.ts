import { inject, scoped, Lifecycle } from "tsyringe";
import { ErrorHandler } from "../../utils/error.handler";
import { ResponseHandler } from "../../utils/response.handler";
import { ResponseHandler as CommonResponseHandler } from "../../common/response.handler";
import { ApiError } from "../../common/api.error";
import { CustomStatsQueryService } from "../../services/stats/custom/custom.stats.query.service";
import { CustomStatsRollupService } from "../../services/stats/custom/custom.stats.rollup.service";
import {
    DEFAULT_CUSTOM_USERS_PAGE_SIZE,
    MAX_CUSTOM_USERS_PAGE_SIZE,
    isCustomStatsTenant
} from "../../services/stats/stats.constants";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@scoped(Lifecycle.ContainerScoped)
export class CustomStatsController {

    constructor(
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
    ) {}

    // Middleware: only tenants configured in the CUSTOM_STATS_TENANTS env may use /stats/custom/*.
    requireCustomStats = (request, response, next) => {
        if (!isCustomStatsTenant(request.params?.client)) {
            CommonResponseHandler.failure(request, response, 'Custom statistics are not available for this client.', 404);
            return;
        }
        next();
    };

    getSummary = async (request, response) => {
        try {
            const { range, startDate, endDate } = request.query;
            const result = await CustomStatsQueryService.getSummary(
                request.container, range as string, startDate as string, endDate as string
            );
            this.responseHandler.sendSuccessResponse(response, 200, 'Custom stats summary retrieved successfully', result);
        } catch (error) {
            this.handleError(error, response, request);
        }
    };

    getUsers = async (request, response) => {
        try {
            const { range, startDate, endDate, page, pageSize, sortBy, order } = request.query;

            const parsedPage = page ? parseInt(page as string, 10) : 1;
            const parsedPageSize = pageSize ? parseInt(pageSize as string, 10) : DEFAULT_CUSTOM_USERS_PAGE_SIZE;
            if (!Number.isInteger(parsedPage) || parsedPage < 1) {
                throw new ApiError(400, 'page must be a positive integer.');
            }
            const pageSizeInvalid = !Number.isInteger(parsedPageSize) || parsedPageSize < 1;
            if (pageSizeInvalid || parsedPageSize > MAX_CUSTOM_USERS_PAGE_SIZE) {
                throw new ApiError(400, `pageSize must be between 1 and ${MAX_CUSTOM_USERS_PAGE_SIZE}.`);
            }
            const parsedSortBy = (sortBy as string) || 'interactions';
            if (!['interactions', 'firstMessageOn'].includes(parsedSortBy)) {
                throw new ApiError(400, 'sortBy must be one of: interactions, firstMessageOn.');
            }
            const parsedOrder = ((order as string) || 'desc').toLowerCase();
            if (!['asc', 'desc'].includes(parsedOrder)) {
                throw new ApiError(400, 'order must be one of: asc, desc.');
            }

            const result = await CustomStatsQueryService.getUserDetails(
                request.container, range as string, startDate as string, endDate as string,
                parsedPage, parsedPageSize, parsedSortBy as 'interactions' | 'firstMessageOn', parsedOrder as 'asc' | 'desc'
            );
            this.responseHandler.sendSuccessResponse(response, 200, 'Custom stats user details retrieved successfully', result);
        } catch (error) {
            this.handleError(error, response, request);
        }
    };

    backfill = async (request, response) => {
        try {
            const startDate = (request.body?.startDate ?? request.query?.startDate) as string;
            const endDate = (request.body?.endDate ?? request.query?.endDate) as string;
            if (!startDate || !endDate || !DATE_ONLY_REGEX.test(startDate) || !DATE_ONLY_REGEX.test(endDate)) {
                throw new ApiError(400, 'startDate and endDate are required in YYYY-MM-DD format.');
            }
            const result = await CustomStatsRollupService.backfill(request.container, startDate, endDate);
            this.responseHandler.sendSuccessResponse(response, 200, 'Custom stats backfill completed', {
                processedCount          : result.processed.length,
                skippedNoDailyStatCount : result.skippedNoDailyStat.length,
                failedCount             : result.failed.length,
                skippedNoDailyStat      : result.skippedNoDailyStat,
                failed                  : result.failed
            });
        } catch (error) {
            this.handleError(error, response, request);
        }
    };

    private handleError(error: any, response, request) {
        if (error instanceof ApiError) {
            this.responseHandler.sendFailureResponse(response, error.httpErrorCode, error.errorMessage, request);
        } else {
            this.errorHandler.handleControllerError(error, response, request);
        }
    }

}
