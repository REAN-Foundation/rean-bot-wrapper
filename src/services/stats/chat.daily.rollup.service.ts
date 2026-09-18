import { DependencyContainer } from 'tsyringe';
import { TimeHelper, DurationType, DateStringFormat } from '../../common/time.helper';
import { ChatMessageRepo } from '../../database/repositories/chat.message/chat.message.repo';
import { ContactListRepo } from '../../database/repositories/contact.list/contact.list.repo';
import { ChatDailyStatRepo } from '../../database/repositories/chat.daily.stat/chat.daily.stat.repo';
import { ChatDailyContentStatRepo } from '../../database/repositories/chat.daily.content.stat/chat.daily.content.stat.repo';
import { TenantService } from '../tenant/tenant.service';
import { ContainerService } from '../container/container.service';
import { Logger } from '../../common/logger';
import { MAX_CONTENT_NORMALIZED_LENGTH } from './stats.constants';

///////////////////////////////////////////////////////////////////////////////

export class ChatDailyRollupService {

    static computeAndUpsertDailyStats = async (container: DependencyContainer, targetDate: string): Promise<void> => {

        const dayStart = TimeHelper.strToUtc(targetDate);
        const nextDayStart = TimeHelper.addDuration(dayStart, 1, DurationType.Day);

        const messagesReceived = await ChatMessageRepo.countByDirectionInRange(container, 'In', dayStart, nextDayStart);
        const messagesSent = await ChatMessageRepo.countByDirectionInRange(container, 'Out', dayStart, nextDayStart);
        const newUsersCount = await ContactListRepo.countInRange(container, dayStart, nextDayStart);
        const questionsAskedCount =
            await ChatMessageRepo.countQuestionsAskedInRange(container, dayStart, nextDayStart);

        const inboundContents =
        await ChatMessageRepo.findInboundMessageContentInRange(container, dayStart, nextDayStart);

        const contentGroups = new Map<string, { sample: string; count: number }>();
        for (const raw of inboundContents) {
            if (!raw) {
                continue;
            }
            const normalized = raw.trim().replace(/\s+/g, ' ')
                .toLowerCase()
                .slice(0, MAX_CONTENT_NORMALIZED_LENGTH);
            if (!normalized) {
                continue;
            }
            const existing = contentGroups.get(normalized);
            if (existing) {
                existing.count += 1;
            } else {
                contentGroups.set(normalized, { sample: raw, count: 1 });
            }
        }

        await ChatDailyStatRepo.upsertDailyStat(container, {
            statDate                    : targetDate,
            messagesReceived,
            messagesSent,
            uniqueMessagesReceivedCount : contentGroups.size,
            newUsersCount,
            questionsAskedCount
        });

        for (const [normalized, { sample, count }] of contentGroups.entries()) {
            await ChatDailyContentStatRepo.upsertContentStat(container, {
                statDate                 : targetDate,
                messageContentNormalized : normalized,
                messageContentSample     : sample,
                occurrenceCount          : count
            });
        }
    };

    static runForYesterday = async (): Promise<void> => {

        const yesterday = TimeHelper.subtractDuration(TimeHelper.nowUtc(), 1, DurationType.Day);
        const targetDate = TimeHelper.getDateString(yesterday, DateStringFormat.YYYY_MM_DD);
        console.log(`ChatDailyRollupService.runForYesterday: computing daily stats for ${targetDate}...`);
        const apiKey = process.env.REANCARE_API_KEY;
        const baseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
        const tenants = await TenantService.getAllTenants(apiKey, baseUrl);

        if (!tenants || tenants.length === 0) {
            Logger.instance().log('ChatDailyRollupService.runForYesterday: no tenants found to process.');
            return;
        }

        for (const tenant of tenants) {
            if (tenant.Code === 'default') {
                continue;
            }
            try {
                const childContainer = ContainerService.createChildContainer(tenant.Code);
                await ChatDailyRollupService.computeAndUpsertDailyStats(childContainer, targetDate);
                Logger.instance().log(
                    `ChatDailyRollupService: computed daily stats for tenant "${tenant.Code}", date ${targetDate}.`
                );
            } catch (error) {
                Logger.instance().log(
                    `ChatDailyRollupService: failed for tenant "${tenant.Code}", date ${targetDate}: ${error.message}`
                );
            }
        }
    };

}
