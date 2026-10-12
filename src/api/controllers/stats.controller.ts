import { inject, scoped, Lifecycle } from "tsyringe";
import { ErrorHandler } from "../../utils/error.handler";
import { ResponseHandler } from "../../utils/response.handler";
import { ApiError } from "../../common/api.error";
import { ChatStatsQueryService } from "../../services/stats/chat.stats.query.service";
import { DEFAULT_CONTENT_FREQUENCY_LIMIT } from "../../services/stats/stats.constants";

@scoped(Lifecycle.ContainerScoped)
export class StatsController {

    constructor(
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
    ) {}

    getDailySeries = async (request, response) => {
        try {
            const { range, startDate, endDate } = request.query;
            const result = await ChatStatsQueryService.getDailySeries(
                request.container, range as string, startDate as string, endDate as string
            );
            this.responseHandler.sendSuccessResponse(response, 200, 'Daily stats series retrieved successfully', result);
        } catch (error) {
            this.handleError(error, response, request);
        }
    };

    getContentFrequency = async (request, response) => {
        try {
            const { range, startDate, endDate, limit } = request.query;
            const parsedLimit = limit ? parseInt(limit as string, 10) : DEFAULT_CONTENT_FREQUENCY_LIMIT;
            const result = await ChatStatsQueryService.getContentFrequency(
                request.container, range as string, startDate as string, endDate as string, parsedLimit
            );
            this.responseHandler.sendSuccessResponse(response, 200, 'Content frequency retrieved successfully', result);
        } catch (error) {
            this.handleError(error, response, request);
        }
    };

    getLifetimeStats = async (request, response) => {
        try {
            const result = await ChatStatsQueryService.getLifetimeStats(request.container);
            this.responseHandler.sendSuccessResponse(response, 200, 'Lifetime stats retrieved successfully', result);
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
