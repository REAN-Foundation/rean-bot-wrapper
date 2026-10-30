import { APIRequestContext, APIResponse } from '@playwright/test';
import { BotClient } from '../config/clients';

///////////////////////////////////////////////////////////////////////////

export type ApiChannelUser = {
    platformId: string;
    name: string;
};


const REQUEST_TIMEOUT_MS = 100000;

const receivePath = (botClient: BotClient) =>
    `${botClient.client}/api/${botClient.client}/receive`;

export function buildTextMessageBody(user: ApiChannelUser, text: string) {
    return {
        channel  : 'api',
        contacts : [{ id: user.platformId, profile: { name: user.name } }],
        messages : [{
            id   : `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type : 'text',
            text : { body: text },
        }],
    };
}

export async function sendTextMessage(
    apiContext: APIRequestContext,
    botClient: BotClient,
    user: ApiChannelUser,
    text: string
): Promise<APIResponse> {
    return apiContext.post(receivePath(botClient), {
        data    : buildTextMessageBody(user, text),
        timeout : REQUEST_TIMEOUT_MS,
    });
}

// The body is empty when the bot hands the message to the Workflow service,
// so parse defensively instead of calling response.json().
export async function readReply(response: APIResponse): Promise<any> {
    const raw = await response.text();
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

export function replyText(reply: any): string {
    if (reply === null) {
        return '<empty body>';
    }
    if (reply?.responses?.length) {
        return reply.responses.map((r: any) => r.text ?? '<no text>').join('\n');
    }
    if (reply?.answer !== undefined) {
        return reply.answer;
    }
    if (typeof reply === 'string') {
        // Gateway error pages (e.g. Cloudflare 502) are full HTML documents;
        // the <title> is enough to tell what happened.
        const title = reply.match(/<title>([^<]*)<\/title>/i);
        return title ? `<html> ${title[1].trim()}` : reply;
    }
    return JSON.stringify(reply);
}
