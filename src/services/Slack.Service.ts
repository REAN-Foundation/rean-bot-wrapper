import { Logger } from '../common/logger';
import { WebClient } from '@slack/web-api';

// Slack Setup
const slackClient = new WebClient(process.env.SLACK_TOKEN);
const slackChannel = process.env.SLACK_CHANNEL_ID;

// Slack Service to Send Message to Slack Channel
//
export const send_message = async (message, failureReason, params, eventObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Sending message to Slack Channel: ${message}`);

            const message_blocks = [
                { type: "divider" },
                {
                    type : "section",
                    text : {
                        type : "mrkdwn", text : `:warning: *${message}*`
                    }
                },
                { type: "divider" },
                {
                    type : "section",
                    text : {
                        type : "mrkdwn", text : ":bulb: *Reason/Response*\n```" + JSON.stringify(failureReason) + "```"
                    }
                },
                {
                    type : "section",
                    text : {
                        type : "mrkdwn", text : ":incoming_envelope: *Parameters*\n```" + JSON.stringify(params) + "```"
                    }
                },
                {
                    type : "section",
                    text : {
                        type : "mrkdwn", text : `:vertical_traffic_light: Env: ${process.env.ENVIRONMENT.toLocaleLowerCase()}`
                    }
                }
            ];

            const result = await slackClient.chat.postMessage({
                text    : `*${message}*`,
                blocks  : message_blocks,
                channel : slackChannel
            });

            Logger.instance().log(`Slack Message Sent: ${result.ok}`);
            resolve(true);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Slack Service Error!");
            reject(error.message);
        }
    });
};
