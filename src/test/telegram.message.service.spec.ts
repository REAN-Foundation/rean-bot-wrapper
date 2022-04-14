import { TelegramMessageServiceFunctionalities } from '../services/telegram.message.service.functionalities';
import { Speechtotext } from '../services/speech.to.text.service';
// import * as abcd from '../services/speech.to.text.service';

// jest.mock('../services/telegram.message.service.functionalities');

describe("describe 1st block", () => {
    it('testing text format', () => {
        const player = new TelegramMessageServiceFunctionalities();
        const message = {
            message_id : 1,
            from       : {
                id            : 27,
                is_bot        : false,
                first_name    : 'John',
                language_code : 'en'
            },
            chat : { id: 27, first_name: 'John', type: 'private' },
            date : 1637836821,
            text : 'Hi'
        };
        const expectedResult = {
            name            : "John",
            platform        : "Telegram",
            chat_message_id : 1,
            direction       : "In",
            messageBody     : "Hi",
            sessionId       : "27",
            replyPath       : null,
            latlong         : null,
            type            : "text"
        };

        // container.resolve(testClass);
        // const obj = new testClass();
        // obj.testMethod(message);
        // expect(obj.testMethod(message)).resolves.toStrictEqual(expectedResult);

        player.textMessageFormat(message);
        expect(player.textMessageFormat(message)).resolves.toStrictEqual(expectedResult);

    });
});

describe("describe 2nd block", () => {
    it('testing location format', () => {
        const player = new TelegramMessageServiceFunctionalities();
        const message = {
            message_id : 1,
            from       : {
                id            : 27,
                is_bot        : false,
                first_name    : 'John',
                language_code : 'en'
            },
            chat     : { id: 27, first_name: 'John', type: 'private' },
            date     : 1637836887,
            location : { latitude: 2.8, longitude: 9.8 }
        };
        const expectedResult = {
            name            : "John",
            platform        : "Telegram",
            chat_message_id : 1,
            direction       : "In",
            messageBody     : "latlong:2.8-9.8",
            sessionId       : "27",
            replyPath       : null,
            latlong         : "latlong:2.8-9.8",
            type            : "location"
        };
        player.locationMessageFormat(message);
        expect(player.locationMessageFormat(message)).resolves.toStrictEqual(expectedResult);

    });
});

describe("describe 3rd block", () => {
    it('voice format', () => {
        const player = new TelegramMessageServiceFunctionalities();
        const spyGetTelegramMedia = jest.spyOn(player, 'GetTelegramMedia').mockImplementation(() => {
            return new Promise((resolve) => {
                resolve({result:{file_path: "file_21"}});
            });
        });
        const obj = new Speechtotext();
        const spy = jest.spyOn(obj, 'SendSpeechRequest').mockImplementation(() => {
            return new Promise((resolve) => {
                resolve("Testing Mock");
            });
        });
        const message = {
            message_id : 589,
            from       : {
                id            : 27,
                is_bot        : false,
                first_name    : 'Jane',
                language_code : 'en'
            },
            chat  : { id: 27, first_name: 'Jane', type: 'private' },
            date  : 1637837023,
            voice : {
                duration       : 2,
                mime_type      : 'audio/ogg',
                file_id        : 'AwACAgUAAxkBAAICTWGfaN-kNxFtRSUQGAALHAwACjtr5VOULfErhk3buIgQ',
                file_unique_id : 'AgADxwMAAo7a-VQ',
                file_size      : 10882
            }
        };
        const expectedResult = {
            name            : "Jane",
            platform        : "Telegram",
            chat_message_id : 1,
            direction       : "In",
            messageBody     : "Hi",
            sessionId       : "27",
            replyPath       : null,
            latlong         : null,
            type            : "voice"
        };
        player.voiceMessageFormat(message);
        expect(player.GetTelegramMedia("skjdf")).resolves.toBeDefined();
        expect(player.GetTelegramMedia("skjdf")).resolves.toStrictEqual({result:{file_path: "file_21"}});
        // expect(obj.SendSpeechRequest("Testing Mock")).resolves.toStrictEqual("Testing Mock");
        // expect(player.voiceMessageFormat(message)).resolves.toStrictEqual(expectedResult);

    });
});
