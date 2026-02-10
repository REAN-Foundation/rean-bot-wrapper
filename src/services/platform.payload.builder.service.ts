/**
 * Platform Payload Builder Service
 *
 * Converts IntentResponseService button output to Dialogflow-compatible payload format.
 * This ensures LLM-native intents produce the same payload structure as Dialogflow,
 * allowing existing WhatsApp/Telegram button services to work without modification.
 */

export interface FormattedButton {
    text: string;
    type: 'intent' | 'url' | 'text';
    value?: string;
}

/**
 * Platform Payload Builder
 *
 * Builds Dialogflow-compatible payloads for platform-specific message types.
 * Currently supports interactive buttons (WhatsApp, Telegram).
 */
export class PlatformPayloadBuilder {

    /**
     * Build interactive-buttons payload from FormattedButton array
     *
     * Output matches Dialogflow's custom payload structure:
     * {
     *   fields: {
     *     messagetype: { stringValue: "interactive-buttons" },
     *     buttons: {
     *       listValue: {
     *         values: [
     *           {
     *             structValue: {
     *               fields: {
     *                 type: { stringValue: "reply" },
     *                 reply: {
     *                   structValue: {
     *                     fields: {
     *                       id: { stringValue: "intent.code" },
     *                       title: { stringValue: "Button Text" }
     *                     }
     *                   }
     *                 }
     *               }
     *             }
     *           }
     *         ]
     *       }
     *     }
     *   }
     * }
     *
     * @param buttons - Array of FormattedButton objects from IntentResponseService
     * @returns Dialogflow-compatible payload structure
     */
    static buildButtonPayload(buttons: FormattedButton[]): any {
        if (!buttons || buttons.length === 0) {
            return null;
        }

        // Build button objects in Dialogflow format
        const buttonObjects = buttons.map(btn => ({
            structValue: {
                fields: {
                    "type": {
                        "stringValue": "reply",
                        "kind": "stringValue"
                    },
                    "reply": {
                        "structValue": {
                            "fields": {
                                "id": {
                                    "stringValue": btn.value || btn.text,
                                    "kind": "stringValue"
                                },
                                "title": {
                                    "stringValue": btn.text,
                                    "kind": "stringValue"
                                }
                            }
                        },
                        "kind": "structValue"
                    }
                }
            },
            kind: "structValue"
        }));

        // Return Dialogflow-compatible payload
        return {
            "fields": {
                "buttons": {
                    "listValue": {
                        "values": buttonObjects
                    },
                    "kind": "listValue"
                },
                "messagetype": {
                    "stringValue": "interactive-buttons",
                    "kind": "stringValue"
                }
            }
        };
    }

    /**
     * Build interactive-list payload from FormattedButton array
     * (Future implementation for list-style menus)
     *
     * @param buttons - Array of FormattedButton objects
     * @param description - Optional description for list items
     * @returns Dialogflow-compatible list payload structure
     */
    static buildListPayload(buttons: FormattedButton[], description?: boolean): any {
        if (!buttons || buttons.length === 0) {
            return null;
        }

        const buttonObjects = buttons.map(btn => ({
            structValue: {
                fields: {
                    "id": {
                        "stringValue": btn.value || btn.text,
                        "kind": "stringValue"
                    },
                    "title": {
                        "stringValue": btn.text,
                        "kind": "stringValue"
                    }
                }
            },
            kind: "structValue"
        }));

        return {
            "fields": {
                "buttons": {
                    "listValue": {
                        "values": buttonObjects
                    },
                    "kind": "listValue"
                },
                "messagetype": {
                    "stringValue": "interactive-list",
                    "kind": "stringValue"
                }
            }
        };
    }

    /**
     * Build message payload for platforms
     * Adds message text to payload if needed
     *
     * @param message - Message text
     * @param buttons - Optional buttons
     * @returns Combined payload with message and buttons
     */
    static buildMessagePayload(message: string, buttons?: FormattedButton[]): any {
        const buttonPayload = buttons && buttons.length > 0
            ? PlatformPayloadBuilder.buildButtonPayload(buttons)
            : null;

        if (!buttonPayload) {
            return null;
        }

        // Add message field to payload
        return {
            ...buttonPayload,
            fields: {
                ...buttonPayload.fields,
                message: {
                    stringValue: message,
                    kind: "stringValue"
                }
            }
        };
    }
}
