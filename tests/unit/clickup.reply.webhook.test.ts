// Run with: TS_NODE_TRANSPILE_ONLY=true node -r ts-node/register --test --test-force-exit tests/unit/clickup.reply.webhook.test.ts

import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';

// Loaded with require so tsconfig.tests.json, which has no decorator support, does not compile src
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('reflect-metadata');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ClickUpMessageService } = require('../../src/services/clickup.message.service');

///////////////////////////////////////////////////////////////////////////

const TASK_ID = 'task-1';

const CONTACT = {
    dataValues : { platform: 'whatsappMeta', mobileNumber: '919876543210', username: 'Asha' }
};

const FEEDBACK_MESSAGE = { platform: 'telegram', userPlatformID: '55501' };

const EXPERT_TEXT = 'Response from Expert :  Please take the drops twice a day';

let server: http.Server;
let webhookUrl: string;
let received: { method: string; url: string; contentType: string; body: any }[];

// Each call takes the next status; the last one repeats for any further calls
let webhookStatuses: number[];
let nextCommentId = 1;

before(async () => {
    server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            received.push({
                method      : req.method,
                url         : req.url,
                contentType : req.headers['content-type'],
                body        : JSON.parse(raw)
            });
            res.statusCode = webhookStatuses.length > 1 ? webhookStatuses.shift() : webhookStatuses[0];
            res.end('{}');
        });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    webhookUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/chat-webhook.php?token=secret-token`;
});

after(() => {
    server.close();
});

beforeEach(() => {
    received = [];
    webhookStatuses = [200];
});

const buildService = (
    settings: Record<string, any>,
    lookup: { contact?: any; feedbackMessage?: any } = { contact: CONTACT },
    replyPrefix = ''
) => {
    const sent = { customMessages: [] as any[][], templates: [] as any[][], chatMessages: [] as any[] };

    const repositories = {
        ContactList : {
            findOne : async ({ where }) => (where.cmrChatTaskID === TASK_ID ? lookup.contact ?? null : null)
        },
        ChatMessage : {
            findOne : async ({ where }) => {
                if (where.supportChannelTaskID === TASK_ID) {
                    return lookup.feedbackMessage ?? null;
                }
                return null;
            },
            create : async (row) => { sent.chatMessages.push(row); }
        },
        ChatSession : {
            findOne : async () => ({ autoIncrementalID: 7 })
        }
    };

    const service = new ClickUpMessageService(
        {
            sendCustomMessage   : async (...args) => { sent.customMessages.push(args); },
            sendTemplateMessage : async (...args) => { sent.templates.push(args); }
        },
        { getEntityManager: async () => ({ getRepository: (model) => repositories[model.name] }) },
        { getClientEnvironmentVariable: async (name) => settings[name] },
        { getMessage: async (key) => (key === 'CLICKUP_REPLY_TO_USER_MESSAGE' ? replyPrefix : '') }
    );

    return { service, sent };
};

const taggedComment = (text = '@everyone Please take the drops twice a day') => ({
    event         : 'taskCommentPosted',
    task_id       : TASK_ID,
    history_items : [{
        comment : {
            id           : `9012${nextCommentId++}`,
            text_content : text,
            comment      : [{ type: 'followers_tag', text: '@everyone' }, { text: ' Please take the drops twice a day' }]
        }
    }]
});

///////////////////////////////////////////////////////////////////////////

for (const [label, settings] of [
    ['missing', {}],
    ['an empty string', { ClickupReplyWebhookUrl: '' }],
    ['only whitespace', { ClickupReplyWebhookUrl: '   ' }],
    ['an object with an empty Value', { ClickupReplyWebhookUrl: { Value: '' } }]
] as [string, Record<string, any>][]) {
    test(`sends to the user's channel when the setting is ${label}`, async () => {
        const { service, sent } = buildService(settings);

        await service.clickupEventHandler(taggedComment());

        assert.deepEqual(sent.customMessages, [['whatsappMeta', '919876543210', EXPERT_TEXT]]);
        assert.equal(received.length, 0);
    });
}

test('posts the comment id, platform user id and expert text to the webhook as JSON', async () => {
    const { service } = buildService({ ClickupReplyWebhookUrl: webhookUrl });
    const comment = taggedComment();

    await service.clickupEventHandler(comment);

    assert.equal(received.length, 1);
    assert.equal(received[0].method, 'POST');
    assert.match(received[0].contentType, /application\/json/);
    assert.deepEqual(received[0].body, {
        messageId      : comment.history_items[0].comment.id,
        platformUserId : '919876543210',
        text           : EXPERT_TEXT
    });
});

test('keeps the token in the webhook url query string', async () => {
    const { service } = buildService({ ClickupReplyWebhookUrl: webhookUrl });

    await service.clickupEventHandler(taggedComment());

    assert.equal(received[0].url, '/chat-webhook.php?token=secret-token');
});

test('uses the client\'s reply prefix in the webhook text when one is configured', async () => {
    const { service } = buildService({ ClickupReplyWebhookUrl: webhookUrl }, { contact: CONTACT }, 'Doctor says');

    await service.clickupEventHandler(taggedComment());

    assert.equal(received[0].body.text, 'Doctor says :  Please take the drops twice a day');
});

test('does not message the user directly when the webhook is set', async () => {
    const { service, sent } = buildService({ ClickupReplyWebhookUrl: webhookUrl, ClickupTemplate: 'reopen_window' });

    await service.clickupEventHandler(taggedComment());

    assert.deepEqual(sent.customMessages, []);
    assert.deepEqual(sent.templates, []);
});

test('reads the webhook url from a setting stored as an object', async () => {
    const { service } = buildService({ ClickupReplyWebhookUrl: { Value: webhookUrl } });

    await service.clickupEventHandler(taggedComment());

    assert.equal(received.length, 1);
});

test('records the forwarded reply in the chat history', async () => {
    const { service, sent } = buildService({ ClickupReplyWebhookUrl: webhookUrl });

    await service.clickupEventHandler(taggedComment());

    assert.deepEqual(sent.chatMessages, [{
        chatSessionID  : 7,
        platform       : 'whatsappMeta',
        direction      : 'Out',
        messageType    : 'text',
        messageContent : EXPERT_TEXT,
        userPlatformID : '919876543210'
    }]);
});

test('uses the platform user id from a feedback message when no contact matches the task', async () => {
    const { service } = buildService({ ClickupReplyWebhookUrl: webhookUrl }, { feedbackMessage: FEEDBACK_MESSAGE });

    await service.clickupEventHandler(taggedComment());

    assert.equal(received[0].body.platformUserId, '55501');
});

test('does not call the webhook when no user matches the task', async () => {
    const { service, sent } = buildService({ ClickupReplyWebhookUrl: webhookUrl }, {});

    await service.clickupEventHandler(taggedComment());

    assert.equal(received.length, 0);
    assert.deepEqual(sent.chatMessages, []);
    assert.deepEqual(sent.customMessages, []);
});

test('retries with the same message id after a 503 and records the reply once accepted', async () => {
    webhookStatuses = [503, 200];
    const { service, sent } = buildService({ ClickupReplyWebhookUrl: webhookUrl });

    await service.clickupEventHandler(taggedComment());

    assert.equal(received.length, 2);
    assert.equal(received[1].body.messageId, received[0].body.messageId);
    assert.equal(sent.chatMessages.length, 1);
});

test('stops after 3 attempts when the webhook keeps answering 429', async () => {
    webhookStatuses = [429];
    const { service, sent } = buildService({ ClickupReplyWebhookUrl: webhookUrl });

    await service.clickupEventHandler(taggedComment());

    assert.equal(received.length, 3);
    assert.deepEqual(sent.customMessages, []);
    assert.deepEqual(sent.chatMessages, []);
});

for (const status of [400, 403]) {
    test(`does not retry or record history when the webhook answers ${status}`, async () => {
        webhookStatuses = [status];
        const { service, sent } = buildService({ ClickupReplyWebhookUrl: webhookUrl });

        await service.clickupEventHandler(taggedComment());

        assert.equal(received.length, 1);
        assert.deepEqual(sent.customMessages, []);
        assert.deepEqual(sent.chatMessages, []);
    });
}

test('does not fall back to the user\'s channel when the webhook is unreachable', async () => {
    const { service, sent } = buildService({ ClickupReplyWebhookUrl: 'http://127.0.0.1:1/chat-webhook.php?token=x' });

    await service.clickupEventHandler(taggedComment());

    assert.deepEqual(sent.customMessages, []);
    assert.deepEqual(sent.chatMessages, []);
});
