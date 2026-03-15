/**
 * Seeder: Dialogflow Intent Migration - lvpei
 *
 * Generated on: 2026-03-11T14:14:07.452Z
 * Source: Dialogflow project
 * Client: lvpei
 * Migration Mode: 100% LLM Enabled
 *
 * This seeder imports 35 intents from Dialogflow.
 * All intents are configured for LLM-based processing with:
 * - llmEnabled: true
 * - llmProvider: 'openai'
 * - fallbackToDialogflow: false
 * - Feature flags enabled at 100% rollout
 *
 * DUPLICATE HANDLING:
 * This seeder is safe to run multiple times. It will:
 * 1. Check for existing intents with the same codes
 * 2. Delete existing intents and their listeners before re-importing
 * 3. Delete existing feature flags with the same names before re-importing
 * 4. Insert fresh data from the latest Dialogflow export
 *
 * After running this seeder, you should:
 * 1. Review the imported intents
 * 2. Review static responses and button configurations
 *    - Verify button types are correct (intent/url/text)
 *    - Update button values to reference proper intent codes
 * 3. Set up intent listeners for webhook-enabled intents
 * 4. Test each intent thoroughly
 * 5. Monitor LLM classification accuracy
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        // =====================================================
        // HANDLE DUPLICATES - DELETE EXISTING INTENTS
        // =====================================================
        const intentCodes = [
            'NegativeFeedback',
            'conditionIdentification',
            'eyeImage',
            'hyperCriticalCondition',
            'Default Welcome Intent',
            'responseNo',
            'criticalCondition',
            'responseYes',
            'consent_no',
            'Reminder_Ask_Frequency',
            'Reminder_Frequency_Weekly',
            'KerotoplastyFollowUp',
            'Change Language',
            'MoreSymptoms',
            'PositiveFeedback',
            'Reminder_Frequency_Daily',
            'readAdditionalInfo',
            'AdditionalInfo',
            'Default Fallback Intent',
            'welcomeYes',
            'Welcome',
            'findNearestLocation',
            'welcomeNo',
            'Feedback - positive',
            'symptomAnalysis',
            'App_Reminder_Yes',
            'consent_yes',
            'Reminder_Reply_No',
            'AskQuestion',
            'General_Reminder',
            'normalCondition',
            'Reminder_Registration',
            'App_Reminder_No',
            'Reminder_Frequency_Once',
            'Feedback'
        ];

        console.log('Checking for existing intents...');

        // Check if any intents with these codes already exist
        const [existingIntents] = await queryInterface.sequelize.query(
            `SELECT code FROM intents WHERE code IN (${intentCodes.map(() => '?').join(',')})`,
            { replacements: intentCodes }
        );

        if (existingIntents.length > 0) {
            console.log(`Found ${existingIntents.length} existing intents - deleting before re-import...`);

            // Delete intent_listeners first (foreign key constraint)
            await queryInterface.bulkDelete('intent_listeners', {
                listenerCode: {
                    [Sequelize.Op.in]: intentCodes
                }
            }, {});

            // Delete existing intents
            await queryInterface.bulkDelete('intents', {
                code: {
                    [Sequelize.Op.in]: intentCodes
                }
            }, {});

            console.log('Existing intents deleted successfully');
        }

        // =====================================================
        // INTENTS TABLE ENTRIES
        // =====================================================
        const intentsData = [
          {
                    "id": "d7bb9d18-7716-45b7-bbf4-ebd557a01cc4",
                    "name": "NegativeFeedback",
                    "code": "NegativeFeedback",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"NegativeFeedback\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/0587e7ca-116b-426b-a4f9-0cd215b8934b\",\"migrationDate\":\"2026-03-11T14:14:07.448Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: NegativeFeedback. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[\"I don't like your response\",\"NegativeFeedback\",\"👎\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"We will get back to you\"}"
          },
          {
                    "id": "537baea2-a6af-4827-940d-3355a189d0f8",
                    "name": "ConditionIdentification",
                    "code": "conditionIdentification",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"conditionIdentification\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/0c54847e-1e00-438c-ae52-397d4cb5030a\",\"migrationDate\":\"2026-03-11T14:14:07.448Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: conditionIdentification. Uses LLM for classification and entity extraction. Collects parameters: complexDropInVision, complexSeverePain, complexNormalSymptoms, medicalRecordNumber. Webhook enabled: true.",
                    "intentExamples": "[\"my medical record number is P89809\",\"i have the reddish eye\",\"A white layered thing formed on the cornea is not reducing since we visited the hospital\",\"i am encoutering pain\",\"Yes my vision dropped\",\"Yes there is pain\",\"Yes there is slight loss in vision\",\"vision is decreased\",\"redness\",\"itching\",\"watering\",\"swelling\",\"pain\",\"drop in vision\",\"I have pain my medical record number is P57879\",\"My medical record number is NP123 and i am feeling severe pain  and itching\",\"My medical record number is NP898090 and i am feeling slight pain and itching\",\"P687989\",\"i have drop in vision and slight pain in my operated eye\",\"I have drop in vision with severe pain\",\"P809090\",\"I am feeling a very sharp pain in my eye\",\"I have swelling in my eye what  to do\",\"I have pain in my eye what to do\",\"yes, some pain from 3 days\",\"yes, drop in vision\",\"I am feeling light sensitivity from 3 days\",\"There is an increase in redness in my eye\",\"There is a white spot in my eye\",\"There is swelling in my eye\",\"I am suffering from severe pain in my eye\",\"I have  drop-in vision from 7 days\",\"water in eye\",\"There is watering in my eye\",\"I have a pain in my eye\",\"I have itching in my right eye\",\"i have slight pain in my eye\",\"pain and drop in vision\",\"i have drop in vision\",\"hi i have drop in vision in my operative eye\",\"hi  i have drop in vision\",\"I have pain my medical record number is N98080\",\"I have pain my medical record number is P8989\",\"Experiencing drop in vision since 2 days.\",\"Experiencing severe pain in the operated eye\",\"I have severe pain in my left eye\",\"I have a drop in vision\",\"There is a watering from the operated eye\",\"My vision has decreased\",\"Loss of vision\",\"Vision loss\",\"my eye is reddish\",\"There is a white layer formed on the eye\",\"White layer formed on the eye\",\"The is a problem in the eye\",\"I have itching\",\"I have cornea problem\",\"My eyes got red\",\"I have burning sensation\",\"I have burning sensation  in my eyes\",\"I have burning sensation in my eye\",\"I have watery eyes\",\"My eye is swollen\",\"P98980\",\"i face it mostly\"]",
                    "entitySchema": "{\"complexDropInVision\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @complexDropInVision\",\"followUpQuestion\":\"Did your operative eye experience any vision loss? We genuinely care about your well-being and are here to help.\"},\"complexSeverePain\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @complexSeverePain\",\"followUpQuestion\":\"Have you been experiencing severe pain in your operative eye? We understand that pain can be distressing, and we're here to assist you in any way we can.\"},\"complexNormalSymptoms\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexNormalSymptoms\",\"followUpQuestion\":\"Please provide complexNormalSymptoms\"},\"medicalRecordNumber\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Please send your Medical Record Number.\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": -1,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "7fddb0b9-acaa-4b80-aec6-a90767974d99",
                    "name": "EyeImage",
                    "code": "eyeImage",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"eyeImage\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/12981df2-02a4-4f11-8a7d-04935ecbd7b1\",\"migrationDate\":\"2026-03-11T14:14:07.448Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: eyeImage. Uses LLM for classification and entity extraction. Collects parameters: medicalRecordNumber, imageUrl, complexSeverePain, complexNormalSymptoms. Webhook enabled: true.",
                    "intentExamples": "[\"want to send image\",\"let me send image\",\"i want to send image\"]",
                    "entitySchema": "{\"medicalRecordNumber\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Could you kindly provide us with your medical record number? We would like to send your details to your doctor for further assistance.\"},\"imageUrl\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @URL\",\"followUpQuestion\":\"📸 Please share a photo of your operated eye so our experts can review and guide you further.\"},\"complexSeverePain\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexSeverePain\",\"followUpQuestion\":\"Please provide complexSeverePain\"},\"complexNormalSymptoms\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexNormalSymptoms\",\"followUpQuestion\":\"Please provide complexNormalSymptoms\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "72f49704-fcec-48ed-aec1-8eb06f9c3baf",
                    "name": "HyperCriticalCondition",
                    "code": "hyperCriticalCondition",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"hyperCriticalCondition\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/1d1972af-7a15-4b0b-9dde-021144003b2d\",\"migrationDate\":\"2026-03-11T14:14:07.449Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: hyperCriticalCondition. Uses LLM for classification and entity extraction. Collects parameters: medicalRecordNumber, image, Location, complexNormalSymptoms, complexSeverePain, complexDropInVision. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": "{\"medicalRecordNumber\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Could you kindly provide us with your medical record number? We would like to send your details to your doctor for further assistance.\"},\"image\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @URL\",\"followUpQuestion\":\"Please send the image of your operated eye expert evaluation and guidance.\"},\"Location\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @Location-v2\",\"followUpQuestion\":\"Please share you Pin-Code, District-Name, or Live Location to find out your Nearest Center\"},\"complexNormalSymptoms\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexNormalSymptoms\",\"followUpQuestion\":\"Please provide complexNormalSymptoms\"},\"complexSeverePain\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexSeverePain\",\"followUpQuestion\":\"Please provide complexSeverePain\"},\"complexDropInVision\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexDropInVision\",\"followUpQuestion\":\"Please provide complexDropInVision\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": -1,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Your situation seems Hyper-Critical, Please Visit the nearest care center as soon as possible.\\nGet the information about the nearest center and book your appointment by calling us at 18002002211\"}"
          },
          {
                    "id": "a4479764-695a-4c7e-b104-1de4a5879799",
                    "name": "Default Welcome Intent",
                    "code": "Default Welcome Intent",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Default Welcome Intent\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/1e4403b9-bc87-4ff9-a8e5-8d40f46a284b\",\"migrationDate\":\"2026-03-11T14:14:07.449Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Default Welcome Intent. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[\"wassup\",\"whats up\",\"sup\",\"good evening\",\"good afternoon\",\"good morning\",\"heeey\",\"heyy\",\"hlo\",\"hllo\",\"helloo\",\"hiiii\",\"howdie\",\"heyaa\",\"heyoo\",\"heyo\",\"just gonna say hi\",\"just going to say hi\",\"heya\",\"hello hi\",\"howdy\",\"hey there\",\"hi there\",\"greetings\",\"hey\",\"long time no see\",\"hello\",\"hy\",\"hii\",\"lovely day isn't it\",\"I greet you\",\"hello again\",\"hi\",\"hello there\",\"a good day\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Welcome to  *LVPEI Post-Operative Eye Care Service*, powered by the REAN Foundation.\\n\\nFeel free to ask any questions related to your surgery.\\n\\nTo learn more about the bot, please refer to this video:\\n https://youtu.be/Syvs7wP3T9A\",\"buttons\":[{\"text\":\"Ask a Question\",\"type\":\"intent\",\"value\":\"AskQuestion\"},{\"text\":\"Report Symptoms\",\"type\":\"intent\",\"value\":\"conditionIdentification\"},{\"text\":\"Find Nearest Center\",\"type\":\"intent\",\"value\":\"nearestLocation\"}]}"
          },
          {
                    "id": "b765da86-51bb-44c1-96a2-4bb922313766",
                    "name": "ResponseNo",
                    "code": "responseNo",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"responseNo\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/1f46ba00-0fcc-4413-a65b-9a81f6c73e89\",\"migrationDate\":\"2026-03-11T14:14:07.450Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: responseNo. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"I can understand your situation. Please let me know how I can help you better.\\n If you’re facing any issues or side effects, call our helpline number: 1800-200-2211 for guidance.\\nFor follow-up appointments, please contact: 080-66202020.\"}"
          },
          {
                    "id": "beb979a0-1ead-46ca-9e2b-9be19f708ecf",
                    "name": "CriticalCondition",
                    "code": "criticalCondition",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"criticalCondition\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/35260897-9300-4a1a-bd2f-69aaf546350e\",\"migrationDate\":\"2026-03-11T14:14:07.450Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: criticalCondition. Uses LLM for classification and entity extraction. Collects parameters: complexDropInVision, medicalRecordNumber, image, Location, complexSeverePain, complexNormalSymptoms. Webhook enabled: true.",
                    "intentExamples": "[\".\"]",
                    "entitySchema": "{\"complexDropInVision\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexDropInVision\",\"followUpQuestion\":\"Please provide complexDropInVision\"},\"medicalRecordNumber\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Could you provide us with your medical record number? We would like to send your details to your doctor for further assistance.\"},\"image\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @URL\",\"followUpQuestion\":\"Please send the image of your operated eye for expert's evaluation and guidance.\"},\"Location\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @Location-v2\",\"followUpQuestion\":\"Please share you Pin-Code, District-Name, or Live Location to find out your Nearest Center\"},\"complexSeverePain\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexSeverePain\",\"followUpQuestion\":\"Please provide complexSeverePain\"},\"complexNormalSymptoms\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexNormalSymptoms\",\"followUpQuestion\":\"Please provide complexNormalSymptoms\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": -1,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Your situation seems critical, Please visit us on the next appointment you can get.\\nGet the information about the nearest center and book your appointment by calling us at 18002002211\"}"
          },
          {
                    "id": "7dcf5203-5575-4476-9ea7-259510986c4d",
                    "name": "ResponseYes",
                    "code": "responseYes",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"responseYes\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/36974bfb-65b5-4cca-8cb1-c6904e348cee\",\"migrationDate\":\"2026-03-11T14:14:07.450Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: responseYes. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"That’s great to hear! Regularly taking your prescribed medicines helps you recover faster and stay healthy. \\n\\nIf you ever have any doubts, you can call our Helpline for doubts – *1800-200-2211*.\\n\\nFor booking a doctor’s visit, please contact Appointment – *080-66202020*.\"}"
          },
          {
                    "id": "e95ed001-4290-4303-9b71-64063ea2f86f",
                    "name": "Consent_no",
                    "code": "consent_no",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"consent_no\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/3f3bf386-af21-44c8-9098-a0a974c24e1b\",\"migrationDate\":\"2026-03-11T14:14:07.450Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: consent_no. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[\"consent_no\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "ea3a63ca-89cc-4421-a38b-0cc580985dbc",
                    "name": "Reminder_Ask_Frequency",
                    "code": "Reminder_Ask_Frequency",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Reminder_Ask_Frequency\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/42787bf1-b581-40eb-9917-a4d98e58698a\",\"migrationDate\":\"2026-03-11T14:14:07.450Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Reminder_Ask_Frequency. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "9db6a922-86fe-47de-b184-2513e150b883",
                    "name": "Reminder_Frequency_Weekly",
                    "code": "Reminder_Frequency_Weekly",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Reminder_Frequency_Weekly\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/456926e0-95a9-481f-b82a-214e2ada70c6\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Reminder_Frequency_Weekly. Uses LLM for classification and entity extraction. Collects parameters: dayNames. Webhook enabled: true.",
                    "intentExamples": "[\"monday friday tuesday\"]",
                    "entitySchema": "{\"dayNames\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @day-name\",\"followUpQuestion\":\"Could you please provide the names of the days for your weekly reminders? Eg: Monday, Friday, etc.\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"I'm sorry, but it seems like there was an error and I couldn't create the reminder.\"}"
          },
          {
                    "id": "63a3e138-4e0d-4912-b0ad-70da1e45c828",
                    "name": "KerotoplastyFollowUp",
                    "code": "KerotoplastyFollowUp",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"KerotoplastyFollowUp\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/4ccfe8ec-8da8-42fa-8837-986b790b1891\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: KerotoplastyFollowUp. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "a87251ee-abfa-4880-b807-5754942f2dd7",
                    "name": "Change Language",
                    "code": "Change Language",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Change Language\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/5c88e8f3-93cf-483c-98c6-eb6ffe9418a2\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Change Language. Uses LLM for classification and entity extraction. Collects parameters: Language. Webhook enabled: true.",
                    "intentExamples": "[\"Set my language to English\",\"I want to change my language to Hindi\",\"Change language to English\",\"Set Language\",\"Need to set language\",\"change language\"]",
                    "entitySchema": "{\"Language\":{\"type\":\"string\",\"required\":true,\"description\":\"Parameter from Dialogflow: @sys.language\",\"followUpQuestion\":\"Please provide the language\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"You preferred language is now $Language\"}"
          },
          {
                    "id": "ffe123ab-684a-4922-a757-c8318a680406",
                    "name": "MoreSymptoms",
                    "code": "MoreSymptoms",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"MoreSymptoms\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/60316757-2363-4daf-b86e-c7a4eb5a2db3\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: MoreSymptoms. Uses LLM for classification and entity extraction. Collects parameters: symptoms. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": "{\"symptoms\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @Symptoms\",\"followUpQuestion\":\"Please mention your other symptom.\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "99a7afd0-71f8-4699-bfc7-f7135c230629",
                    "name": "PositiveFeedback",
                    "code": "PositiveFeedback",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"PositiveFeedback\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/64b9fe5f-8694-415e-ab8e-86ca4f4ff738\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: PositiveFeedback. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[\"thanks for helping\",\"I am very satisfied\",\"I am glad to use it\",\"we are happy to use your bot\",\"i like your bot\",\"I like your idea\",\"PositiveFeedback\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Thank you for the kind words, but as I am a LVPEI Post Operative Eye care service powered by REAN Foundation. Please tell us if you are having any symptoms in your operated eye in future.\"}"
          },
          {
                    "id": "19f3bd74-2f30-4b71-8add-3ae96f001974",
                    "name": "Reminder_Frequency_Daily",
                    "code": "Reminder_Frequency_Daily",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Reminder_Frequency_Daily\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/7538585f-9857-4e90-8383-80110bec5a7e\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Reminder_Frequency_Daily. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "892c153d-180e-44aa-8d17-2337fd2cab49",
                    "name": "ReadAdditionalInfo",
                    "code": "readAdditionalInfo",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"readAdditionalInfo\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/8355f6c9-8713-4230-bfd2-40db43f7b7cc\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: readAdditionalInfo. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[\"mr number\",\"M R number\",\" what is my mr number\",\"my M R number\",\"what is my file number\",\"let me know my MR number\",\"can you please tell me my MR number\",\"I want to know about mr number\",\"can you tell me my MR number\",\"tell me my MR number\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "f21d0ab8-24d3-4de1-89c5-9d2b597946b5",
                    "name": "AdditionalInfo",
                    "code": "AdditionalInfo",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"AdditionalInfo\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/83ab3f00-2a49-4573-9aa8-8dcabfdbe00a\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: AdditionalInfo. Uses LLM for classification and entity extraction. Collects parameters: EHRNumber. Webhook enabled: true.",
                    "intentExamples": "[\"P123455\",\"RSR-PN1806\",\"BEL-PN42970\",\"GMRV-PN98886\",\"VC-NAT-NP1907125\"]",
                    "entitySchema": "{\"EHRNumber\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Can you please Tell me  your MR Number ?\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "7c668ee6-b5be-490e-b05a-63d6a5c16a38",
                    "name": "Default Fallback Intent",
                    "code": "Default Fallback Intent",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Default Fallback Intent\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/8e492300-cea3-4eb3-8ca4-90157acf1458\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":true}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Default Fallback Intent. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"I didn't get that. Can you say it again?\"}"
          },
          {
                    "id": "b4825ca2-1cfc-40c4-898c-319b5c7ddb39",
                    "name": "WelcomeYes",
                    "code": "welcomeYes",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"welcomeYes\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/8fb0a59b-8e60-42b3-b0f0-ea80cbfbc0e5\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: welcomeYes. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[\"I have\",\"i havce symtom\",\"I have symptom\",\"I have symptoooms\",\"I have symptoms\",\"I have some symptoms in my user Eye\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Could you specify the symptoms you're experiencing in your operated eye?\"}"
          },
          {
                    "id": "06726167-0ebf-4898-9a9a-eb1b7226d2c2",
                    "name": "Welcome",
                    "code": "Welcome",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Welcome\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/920f3a08-17d9-48de-8677-229d325cb548\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Welcome. Uses LLM for classification and entity extraction. Collects parameters: medicalrecordnumber. Webhook enabled: false.",
                    "intentExamples": "[\"P897989\",\"hi my MR number is P1236878\",\"helllloooo\",\"/start\",\"just going to say hi\",\"heya\",\"hello hi\",\"howdy\",\"hey there\",\"hi there\",\"greetings\",\"hey\",\"long time no see\",\"hello\",\"lovely day isn't it\",\"I greet you\",\"hello again\",\"hi\",\"hello there\",\"a good day\",\"my medical record number is P89809\",\"P98980\",\"My medical record number is P809090\",\"My medical record number is\",\"my medical record number is P8989\"]",
                    "entitySchema": "{\"medicalrecordnumber\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Please provide medicalrecordnumber\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": -1,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Welcome to  LVPEI Post Operative Eye care service. \\nPlease tell us if you are having any symptoms in your operated eye.\"}"
          },
          {
                    "id": "75aadb9c-cde5-46f6-b57b-f095a6e01932",
                    "name": "FindNearestLocation",
                    "code": "findNearestLocation",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"findNearestLocation\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/98ec5cfb-e4b1-4c80-922d-6b12b02c2335\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: findNearestLocation. Uses LLM for classification and entity extraction. Collects parameters: Location. Webhook enabled: true.",
                    "intentExamples": "[\"Suggest nearest location for me\",\"Where should I go for my stitches or follow-up?\",\"I want to visit an eye doctor after my keratoplasty\",\"Follow-up appointment location, please\",\"Need to consult a doctor after surgery, suggest the nearest centre\",\"Post-op care at the nearest centre?\",\"I had surgery recently. Where can I go for a follow-up?\",\"Closest LVPEI centre available?\",\"Is there an LVPEI close to me?\",\"Nearby LVPEI please\",\"\\\"Where can I go for eye check-up\",\"\\\"Suggest the closest eye care facility\",\"\\\"Help me find an eye hospital near me\",\"\\\"Locate nearby LVPEI hospital\\\"\",\"\\\"Find an LVPEI center near me\",\"\\\"I want to visit the nearest LVPEI\",\"\\\"Where is the nearest eye care center?\",\"Find the Nearest Location\",\"Show me my closest center.\",\"Where is the nearest center?\",\"find nearest center\",\"I want to find LVPEI centers in hyderabad\",\"I need to know my nearest center\"]",
                    "entitySchema": "{\"Location\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @Location-v2\",\"followUpQuestion\":\"Please share your current location (using WhatsApp location feature) or your PIN code so we can find the nearest center for you.\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "b5387e66-97b7-4276-8411-f48227d9d7d3",
                    "name": "WelcomeNo",
                    "code": "welcomeNo",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"welcomeNo\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/aec0b7c8-eaa7-4446-abca-3a727541462c\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: welcomeNo. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[\"thanks but no\",\"no way\",\"no\",\"no no don't\",\"na\",\"no it isn't\",\"don't\",\"nah I'm good\",\"no I cannot\",\"I can't\",\"nothing\",\"no that's okay\",\"no not really\",\"nope not really\",\"nope\",\"thanks but not this time\",\"I don't think so\",\"I disagree\",\"no maybe next time\",\"not this time\",\"no don't\",\"no we are good\",\"don't do it\",\"no that's be all\",\"not right now\",\"nothing else thanks\",\"no thanks\",\"no that's ok\",\"I don't want that\",\"definitely not\",\"nothing else\",\"not\",\"not at all\",\"no never\",\"never\",\"no way no\",\"not really\",\"nah\",\"I don't\",\"I don't want\",\"not today\",\"not interested\",\"no that's fine thank you\",\"I'm not\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": -1,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Your situation seems Normal. Please visit us in our nearest center If their is Drop in vision or severe pain in your operated eye.\\nGet the information about the nearest center and book your appointment by calling us at 18002002211\"}"
          },
          {
                    "id": "5dcd7fb7-aa38-40d2-b905-e3b4521565ab",
                    "name": "Feedback - positive",
                    "code": "Feedback - positive",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Feedback - positive\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/af427e2e-a5ec-436a-9e0a-ac7a95bfc807\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Feedback - positive. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[\"PositiveFeedback\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Thank you for your feedback.\"}"
          },
          {
                    "id": "baa6fd6e-1a5a-4e91-bbb4-ee4d7263a0ec",
                    "name": "SymptomAnalysis",
                    "code": "symptomAnalysis",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"symptomAnalysis\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/b50555c1-c24f-4c02-b206-ed73a76fa176\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: symptomAnalysis. Uses LLM for classification and entity extraction. Collects parameters: symptoms. Webhook enabled: true.",
                    "intentExamples": "[\"I sometimes feel pain\",\"pain sometimes\",\"headache and pain sometimes\",\"I am experiencing pain in my eye is this normal?\",\"I am seeing abnormal shapes\",\"seeing abnormal shapes\",\"eye is watery\",\"difficulty seeing light\",\"my eye is burning\",\"I am feeling dificulty opening my eye\",\"pain\",\"itching and headache\",\"I have pain and itching\",\"Is it dangerous to have white discharge\",\" What should I do for pain in my eye\",\" I have pain\",\"  Today I noticed something in my eye  Since last night\",\"  Can swelling happen after keratoplasty?\",\" Why am I getting white Discharge\",\" Is redness normal after surgery?\",\"Doctor, I feel watering\",\"I have vision loss, pain\",\"Doctor, I feel pain\"]",
                    "entitySchema": "{\"symptoms\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @Symptoms\",\"followUpQuestion\":\"Can you please tell the symptoms you are experiencing?\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": null
          },
          {
                    "id": "11deb73e-0743-4645-9b0f-36836a737e58",
                    "name": "App_Reminder_Yes",
                    "code": "App_Reminder_Yes",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"App_Reminder_Yes\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/b54f9d09-1cb1-4d61-9bca-9e4217ad91bb\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: App_Reminder_Yes. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"It sounds good.\"}"
          },
          {
                    "id": "b7342755-9569-403c-9256-4498a3df12a5",
                    "name": "Consent_yes",
                    "code": "consent_yes",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"consent_yes\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/b6d98ffb-37b9-41ee-828d-f849b4ae6509\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: consent_yes. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Thank you for providing your consent! We're excited to assist you with our chatbot. Your privacy and security are our top priorities.\"}"
          },
          {
                    "id": "549eabfe-247a-430b-b978-891945c5105b",
                    "name": "Reminder_Reply_No",
                    "code": "Reminder_Reply_No",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Reminder_Reply_No\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/b81e9432-516f-438c-ad63-4d1c2f40d9ab\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Reminder_Reply_No. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Thank you for your feedback.\"}"
          },
          {
                    "id": "1413951e-4231-4196-9f30-975074c41c66",
                    "name": "AskQuestion",
                    "code": "AskQuestion",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"AskQuestion\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/bbf025ba-e087-42a5-95b6-9fefbbd78203\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: AskQuestion. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"👋 You can ask me anything related to your eye care.\\nFor example:\\n🔹 “I see some redness in my eye — should I be worried?”\\n🔹 “Can I wash my hair after the surgery?”\\n🔹 “I accidentally missed an eye drop dose — what should I do?”\\n🔹 “When can I start using my phone or watching TV again?”\\n🔹 “Is mild pain on day 3 normal?\\nGo ahead, type your question 👇\"}"
          },
          {
                    "id": "7bdd07af-eef3-4720-9a1e-f3ef5ebea4b1",
                    "name": "General_Reminder",
                    "code": "General_Reminder",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"General_Reminder\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/d083395d-8914-4f5c-b28d-dd82ef7c099b\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: General_Reminder. Uses LLM for classification and entity extraction. Collects parameters: event, time, frequency, dayName, part_of_day, date. Webhook enabled: true.",
                    "intentExamples": "[\"set up a daily medication reminder at 7 pm\",\"create a appointment reminder daily at 10 am from today\",\"Set up a appointment reminder daily at 11:25 am\",\"Please set up a medication reminder for 9 am today\",\"Could you assist me by setting reminders for my medication on weekdays at 11:45 AM?\",\"Could you create a reminder for my medication on the 15th of each month at 7 PM?\",\"I require reminders for my medication every weekday at 3:30 PM. Can you help with that?\",\"Could you assist me with a reminder for my allergy consultation next Friday at 4 PM?\",\"Can you remind me about my flu shot appointment on the 12th at 11:30 AM?\",\"I have an MRI appointment on Wednesday at 2:15 PM; can you set up a reminder for it?\",\"Would you mind scheduling a reminder for my dermatologist appointment on the 18th at 10:45 AM?\",\"I need a reminder for my dentist appointment next Thursday at 1:30 PM; can you arrange that?\",\"Could you set up a reminder for my annual eye check-up on the 5th of next month?\",\"I have a follow-up with my cardiologist on Monday at 9 AM; can you schedule a reminder for me?\",\"Would you mind creating a reminder for my vaccination appointment next Tuesday?\",\"I have a follow-up with my specialist on Friday at 11 AM; can you set up a reminder?\",\"I need assistance in remembering my scheduled medical check-up; could you create a reminder for it?\",\"Could you please set a reminder for my doctor's appointment on the 22nd at 3:30 PM?\",\"I need a reminder for my upcoming medical consultation; could you arrange that for me?\",\"I have a meeting scheduled for Friday at 10 AM; can you set up a reminder for it?\",\"Can you set up a reminder for at 10 AM?\",\"Could you quickly set a reminder for me?\",\"Please set a reminder.\",\"Could you organize a reminder on my behalf?\",\"Can you arrange for a reminder to be made?\",\"Could you set up a reminder on my behalf?\",\"Could you please remind me to go to clinic\",\"I would like to receive a reminder every day for my medication\",\"I need daily notifications to remember my medication schedule\",\"Can you set up a daily reminder for my medication, please?\",\"I require a reminder for my daily medication\",\"I would like to set up reminders for my medication doses\",\"Is it possible for you to schedule a medication reminder for me?\",\"I require a reminder for my medication\",\"Could you schedule a reminder for my medication?\",\"Can you set up a medication reminder for me?\",\"Can you remind me to take my medication?\",\"I need a reminder for my medication\",\"Could you please set up a reminder for me?\",\"Would you be able to set a reminder for me?\",\"Can you schedule a reminder for my medication everyday at 8 AM?\",\"Can you help me schedule a reminder?\",\"Can you create a reminder for me?\",\"set up a medication reminder at 7 pm\",\"remind me go to hospital tomorrow\",\"create a appointment reminder tomorrow at 11 am\",\"set up a hospital reminder on 05 march at 10 am\",\"remind me to go to hospital today at 10 am\",\"create a medicine reminder on 05 march 2024 at 4 pm\",\"remind me to take my medicine today at 4 pm\",\"can i set a reminder?\",\"set up a medication reminder\",\"create a medication reminder\",\"remind me every evening to water the plants at 7 pm\",\"remind me every morning to go to gym at 6:30 am\",\"set up a reminder for yoga class everyday at 6am\",\"create a reminder for meditation at 7 am\",\"Remind me to take my medication at 9 AM and 9 PM daily\",\"Bot, remind me to practice mindfulness meditation every morning at 7 AM\",\"i want to set a reminder to take medicine on wednesday in the evening\",\"Let me know that I need to take medicine on Friday\",\"schedule a reminder at 9 AM on friday for dolo 10mg\",\"set up a reminder on monday at 9 pm of medication paracetamol 500mg\",\"set up a reminder on monday at 9 pm of medication clonazepum\",\"schedule a reminder at 9 AM on friday\",\"set up a reminder on monday at 9 pm of medication\",\"I need a reminder every week on Wednesdays at 10 AM to take my medication.\",\"Set a reminder for my weekly yoga class on Saturdays at 9:30 AM.\",\"Hey bot, remind me to drink water every hour during the workday.\",\"Set a reminder for my daily 30-minute workout session at 6 AM.\"]",
                    "entitySchema": "{\"event\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @event\",\"followUpQuestion\":\"Please specify the type of reminder you need, such as medication or appointment.\"},\"time\":{\"type\":\"string\",\"required\":true,\"description\":\"Parameter from Dialogflow: @sys.time\",\"followUpQuestion\":\"Kindly provide the reminder time ⏰ Eg. 10:00 AM.\"},\"frequency\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @frequency\",\"followUpQuestion\":\"Please tell reminder type once, daily or repeat every weekday\"},\"dayName\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @day-name\",\"followUpQuestion\":\"Please provide dayName\"},\"part_of_day\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @part_of_day\",\"followUpQuestion\":\"Please provide part_of_day\"},\"date\":{\"type\":\"string\",\"required\":true,\"description\":\"Parameter from Dialogflow: @sys.date\",\"followUpQuestion\":\"Kindly provide the reminder starting date. 📅 Eg. 04 March 2024, today, tomorrow, etc.\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"I'm sorry, but it seems like there was an error and I couldn't create the reminder.\"}"
          },
          {
                    "id": "b2339b9a-955a-4026-9661-59697c689ec0",
                    "name": "NormalCondition",
                    "code": "normalCondition",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"normalCondition\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/e1117df9-97b2-4d7d-bb63-14d49e102584\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: normalCondition. Uses LLM for classification and entity extraction. Collects parameters: complexDropInVision, medicalRecordNumber, image, Location, complexSeverePain, complexNormalSymptoms, dropinvision. Webhook enabled: true.",
                    "intentExamples": "[\"my eyes burning and explaining what can I do for this\"]",
                    "entitySchema": "{\"complexDropInVision\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexDropInVision\",\"followUpQuestion\":\"Please provide complexDropInVision\"},\"medicalRecordNumber\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @MedicalRecordNumber\",\"followUpQuestion\":\"Could you kindly provide us with your medical record number? We would like to send your details to your doctor for further assistance.\"},\"image\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @URL\",\"followUpQuestion\":\"Please send the image of your operated eye expert evaluation and guidance.\"},\"Location\":{\"type\":\"array\",\"required\":true,\"description\":\"Parameter from Dialogflow: @Location-v2\",\"followUpQuestion\":\"Please share you Pin-Code, District-Name, or Live Location to find out your Nearest Center\"},\"complexSeverePain\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexSeverePain\",\"followUpQuestion\":\"Please provide complexSeverePain\"},\"complexNormalSymptoms\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @complexNormalSymptoms\",\"followUpQuestion\":\"Please provide complexNormalSymptoms\"},\"dropinvision\":{\"type\":\"array\",\"required\":false,\"description\":\"Parameter from Dialogflow: @DropInVision\",\"followUpQuestion\":\"Please provide dropinvision\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": -1,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Your situation seems Normal. Please visit us in our nearest center If their is Drop in vision or severe pain in your operated eye.\\nGet the information about the nearest center and book your appointment by calling us at 18002002211\"}"
          },
          {
                    "id": "c0d1b02e-62e5-48f6-a8f7-94bfafc516f7",
                    "name": "Reminder_Registration",
                    "code": "Reminder_Registration",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Reminder_Registration\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/e7ca94c6-d40c-45da-9569-ac5f8b5d112d\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Reminder_Registration. Uses LLM for classification and entity extraction. Collects parameters: cityName, timeZone. Webhook enabled: true.",
                    "intentExamples": "[\"Apply the correct time zone\",\"Set local time zone\",\"Select my time zone\",\"Align time zone to my location\",\"Modify the time zone\",\"Configure my time zone\",\"Adjust my time zone\",\"Update my time zone settings\",\"Change the time zone\",\"Set the correct time zone\",\"Set Timezone\",\"change my timezone\",\"change my time zone\",\"set my timezone\",\"set my time zone to +02:00\",\"set my time zone\"]",
                    "entitySchema": "{\"cityName\":{\"type\":\"string\",\"required\":true,\"description\":\"Parameter from Dialogflow: @sys.geo-city\",\"followUpQuestion\":\"Please enter the name of a nearby major city to update your time zone.\"},\"timeZone\":{\"type\":\"string\",\"required\":false,\"description\":\"Parameter from Dialogflow: @sys.any\",\"followUpQuestion\":\"Please provide timeZone\"}}",
                    "conversationConfig": "{\"maxTurns\":5,\"timeoutMinutes\":15,\"followUpStrategy\":\"default\"}",
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"Something went wrong.\"}"
          },
          {
                    "id": "ce60bb6f-b1ed-4578-a7ce-07bd5f903bbc",
                    "name": "App_Reminder_No",
                    "code": "App_Reminder_No",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"App_Reminder_No\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/edd41f3e-6e7a-49c1-9007-3e039e28b6ce\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: App_Reminder_No. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Thank you for your response.\"}"
          },
          {
                    "id": "0e5d3bb1-49db-4f77-b1a5-db1c638fba58",
                    "name": "Reminder_Frequency_Once",
                    "code": "Reminder_Frequency_Once",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Reminder_Frequency_Once\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/ee982276-f8b3-4fe8-bc67-75b14e98e97d\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Reminder_Frequency_Once. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: true.",
                    "intentExamples": "[]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "listener",
                    "staticResponse": "{\"message\":\"One time reminder\"}"
          },
          {
                    "id": "8f75f1a9-b404-41a4-bd05-df793cac9c12",
                    "name": "Feedback",
                    "code": "Feedback",
                    "type": "llm_native",
                    "Metadata": "{\"category\":\"Feedback\",\"source\":\"dialogflow_migration\",\"clientName\":\"lvpei\",\"originalDialogflowId\":\"projects/lvpei-uat-xkia/agent/intents/fb8d8c51-a9bb-45ba-ad5f-7380800fc65c\",\"migrationDate\":\"2026-03-11T14:14:07.451Z\",\"isFallback\":false}",
                    "llmEnabled": true,
                    "llmProvider": "openai",
                    "intentDescription": "Migrated from Dialogflow intent: Feedback. Uses LLM for classification and entity extraction. Collects parameters: none. Webhook enabled: false.",
                    "intentExamples": "[\"suggestions\",\"I want to give a few suggestions\",\"you are useless\",\"this bot is bad\",\"I hate this bot\",\"need improvements\",\"spam\",\"report spam\",\"nice job\",\"didn't like the bot\",\"provide feedback\",\"report an issue\",\"I have suggestions for the bot\",\"Give feedback\",\"This bot is not giving correct answers\",\"Something went wrong\",\"report a problem\"]",
                    "entitySchema": null,
                    "conversationConfig": null,
                    "confidenceThreshold": 0.75,
                    "fallbackToDialogflow": false,
                    "priority": 500000,
                    "active": true,
                    "responseType": "static",
                    "staticResponse": "{\"message\":\"Please give us your feedback by entering 👍 (or)  👎\"}"
          }
];

        // Add timestamps to each intent
        const intents = intentsData.map(intent => ({
            ...intent,
            createdAt: now,
            updatedAt: now
        }));

        // Insert intents
        console.log('Inserting 35 intents...');
        await queryInterface.bulkInsert('intents', intents, {});

        // =====================================================
        // FEATURE FLAGS - 100% ROLLOUT FOR TESTING
        // =====================================================
        const flagNames = [
            'llmIntentResponseEnabled_lvpei',
            'llmEntityCollectionEnabled_lvpei',
            'entityCollection_conditionIdentification',
            'entityCollection_eyeImage',
            'entityCollection_hyperCriticalCondition',
            'entityCollection_criticalCondition',
            'entityCollection_Reminder_Frequency_Weekly',
            'entityCollection_Change Language',
            'entityCollection_MoreSymptoms',
            'entityCollection_AdditionalInfo',
            'entityCollection_Welcome',
            'entityCollection_findNearestLocation',
            'entityCollection_symptomAnalysis',
            'entityCollection_General_Reminder',
            'entityCollection_normalCondition',
            'entityCollection_Reminder_Registration',
            'llmIntent_lvpei_NegativeFeedback_flow',
            'llmIntent_lvpei_conditionIdentification_flow',
            'llmIntent_lvpei_eyeImage_flow',
            'llmIntent_lvpei_hyperCriticalCondition_flow',
            'llmIntent_lvpei_Default Welcome Intent_flow',
            'llmIntent_lvpei_responseNo_flow',
            'llmIntent_lvpei_criticalCondition_flow',
            'llmIntent_lvpei_responseYes_flow',
            'llmIntent_lvpei_consent_no_flow',
            'llmIntent_lvpei_Reminder_Ask_Frequency_flow',
            'llmIntent_lvpei_Reminder_Frequency_Weekly_flow',
            'llmIntent_lvpei_KerotoplastyFollowUp_flow',
            'llmIntent_lvpei_Change Language_flow',
            'llmIntent_lvpei_MoreSymptoms_flow',
            'llmIntent_lvpei_PositiveFeedback_flow',
            'llmIntent_lvpei_Reminder_Frequency_Daily_flow',
            'llmIntent_lvpei_readAdditionalInfo_flow',
            'llmIntent_lvpei_AdditionalInfo_flow',
            'llmIntent_lvpei_Default Fallback Intent_flow',
            'llmIntent_lvpei_welcomeYes_flow',
            'llmIntent_lvpei_Welcome_flow',
            'llmIntent_lvpei_findNearestLocation_flow',
            'llmIntent_lvpei_welcomeNo_flow',
            'llmIntent_lvpei_Feedback - positive_flow',
            'llmIntent_lvpei_symptomAnalysis_flow',
            'llmIntent_lvpei_App_Reminder_Yes_flow',
            'llmIntent_lvpei_consent_yes_flow',
            'llmIntent_lvpei_Reminder_Reply_No_flow',
            'llmIntent_lvpei_AskQuestion_flow',
            'llmIntent_lvpei_General_Reminder_flow',
            'llmIntent_lvpei_normalCondition_flow',
            'llmIntent_lvpei_Reminder_Registration_flow',
            'llmIntent_lvpei_App_Reminder_No_flow',
            'llmIntent_lvpei_Reminder_Frequency_Once_flow',
            'llmIntent_lvpei_Feedback_flow'
        ];

        console.log('Checking for existing feature flags...');

        // Check if any feature flags with these names already exist
        const [existingFlags] = await queryInterface.sequelize.query(
            `SELECT flagName FROM feature_flags WHERE flagName IN (${flagNames.map(() => '?').join(',')})`,
            { replacements: flagNames }
        );

        if (existingFlags.length > 0) {
            console.log(`Found ${existingFlags.length} existing feature flags - deleting before re-import...`);

            // Delete existing feature flags
            await queryInterface.bulkDelete('feature_flags', {
                flagName: {
                    [Sequelize.Op.in]: flagNames
                }
            }, {});

            console.log('Existing feature flags deleted successfully');
        }

        const featureFlagsData = [
          {
                    "id": "13cfc718-4f87-4f70-8ee8-243cc2479eb9",
                    "flagName": "llmIntentResponseEnabled_lvpei",
                    "description": "Master flag: Enable LLM-based intent responses for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": null,
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "f15c6387-d8ed-4661-a19c-119ef16c8c10",
                    "flagName": "llmEntityCollectionEnabled_lvpei",
                    "description": "Master flag: Enable LLM-based entity collection for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": null,
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "69c7db97-c9ef-4d0b-8928-1cbfd6d14c97",
                    "flagName": "entityCollection_conditionIdentification",
                    "description": "Enable entity collection for ConditionIdentification",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"conditionIdentification\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "2f07529f-3274-4489-8b58-4ddb042b4641",
                    "flagName": "entityCollection_eyeImage",
                    "description": "Enable entity collection for EyeImage",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"eyeImage\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "34215952-4037-4c98-a80c-40ca70f7a8f1",
                    "flagName": "entityCollection_hyperCriticalCondition",
                    "description": "Enable entity collection for HyperCriticalCondition",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"hyperCriticalCondition\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "5d7e06b6-0296-4d89-be5e-64ffab5f0a64",
                    "flagName": "entityCollection_criticalCondition",
                    "description": "Enable entity collection for CriticalCondition",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"criticalCondition\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "552204d9-2d66-4235-a80f-05263b0d7e2d",
                    "flagName": "entityCollection_Reminder_Frequency_Weekly",
                    "description": "Enable entity collection for Reminder_Frequency_Weekly",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Frequency_Weekly\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "ff2c3359-6998-4705-94da-dfa520d9d189",
                    "flagName": "entityCollection_Change Language",
                    "description": "Enable entity collection for Change Language",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Change Language\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "40bf25f7-d7bd-4bdd-baea-80e75203e67b",
                    "flagName": "entityCollection_MoreSymptoms",
                    "description": "Enable entity collection for MoreSymptoms",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"MoreSymptoms\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "9eda9599-490a-49d9-89f5-35560145f855",
                    "flagName": "entityCollection_AdditionalInfo",
                    "description": "Enable entity collection for AdditionalInfo",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"AdditionalInfo\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "f37f43e5-d1b2-4bbd-a6d6-e726312472c8",
                    "flagName": "entityCollection_Welcome",
                    "description": "Enable entity collection for Welcome",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Welcome\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "0b448364-0693-4c7b-93e8-ba0a84723e1b",
                    "flagName": "entityCollection_findNearestLocation",
                    "description": "Enable entity collection for FindNearestLocation",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"findNearestLocation\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "072fb4a8-a7db-4a80-9bf3-7c7f98e13c32",
                    "flagName": "entityCollection_symptomAnalysis",
                    "description": "Enable entity collection for SymptomAnalysis",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"symptomAnalysis\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "b1c7dcb3-53e5-4573-94b9-a57bcca77f07",
                    "flagName": "entityCollection_General_Reminder",
                    "description": "Enable entity collection for General_Reminder",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"General_Reminder\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "f4f2cf49-df35-48a7-ae87-4678e0af640d",
                    "flagName": "entityCollection_normalCondition",
                    "description": "Enable entity collection for NormalCondition",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"normalCondition\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "85aa7bea-a9bc-4e7a-b9ac-b6bf1ef1feff",
                    "flagName": "entityCollection_Reminder_Registration",
                    "description": "Enable entity collection for Reminder_Registration",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Registration\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "f1a2c450-b560-4643-add0-cafe4371b73e",
                    "flagName": "llmIntent_lvpei_NegativeFeedback_flow",
                    "description": "Enable all NegativeFeedback flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"NegativeFeedback\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "1a59832f-2fe6-4b35-9c26-5222d7c837de",
                    "flagName": "llmIntent_lvpei_conditionIdentification_flow",
                    "description": "Enable all conditionIdentification flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"conditionIdentification\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "bcc9664e-8775-47d1-a739-aa2cd55d3dbe",
                    "flagName": "llmIntent_lvpei_eyeImage_flow",
                    "description": "Enable all eyeImage flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"eyeImage\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "9d50efb7-21d6-4fe5-a9ac-22c45c11b17e",
                    "flagName": "llmIntent_lvpei_hyperCriticalCondition_flow",
                    "description": "Enable all hyperCriticalCondition flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"hyperCriticalCondition\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "418b42fe-ef2a-489e-9d6a-8d35979c8837",
                    "flagName": "llmIntent_lvpei_Default Welcome Intent_flow",
                    "description": "Enable all Default Welcome Intent flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Default Welcome Intent\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "39f34b9b-4e60-4cc3-a531-644f033789de",
                    "flagName": "llmIntent_lvpei_responseNo_flow",
                    "description": "Enable all responseNo flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"responseNo\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "b9cc0a34-bce7-4890-bdf0-ebf03cb41fa7",
                    "flagName": "llmIntent_lvpei_criticalCondition_flow",
                    "description": "Enable all criticalCondition flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"criticalCondition\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "db4d0fde-da9f-444e-afc0-c9d9230a4ba5",
                    "flagName": "llmIntent_lvpei_responseYes_flow",
                    "description": "Enable all responseYes flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"responseYes\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "9c010ce3-4f47-4d61-afa2-180bbd71112b",
                    "flagName": "llmIntent_lvpei_consent_no_flow",
                    "description": "Enable all consent_no flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"consent_no\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "e3cd75dd-e685-48e2-83cb-8129afc5229b",
                    "flagName": "llmIntent_lvpei_Reminder_Ask_Frequency_flow",
                    "description": "Enable all Reminder_Ask_Frequency flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Ask_Frequency\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "66c65873-ff36-44c0-ab57-f088a9710615",
                    "flagName": "llmIntent_lvpei_Reminder_Frequency_Weekly_flow",
                    "description": "Enable all Reminder_Frequency_Weekly flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Frequency_Weekly\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "cde7e850-bc7b-47bb-86e3-cc686ece9b55",
                    "flagName": "llmIntent_lvpei_KerotoplastyFollowUp_flow",
                    "description": "Enable all KerotoplastyFollowUp flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"KerotoplastyFollowUp\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "ec024d9e-bf7c-44d9-aef4-52e0ca18d76b",
                    "flagName": "llmIntent_lvpei_Change Language_flow",
                    "description": "Enable all Change Language flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Change Language\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "b3b003da-b965-4261-9c81-e4202f613241",
                    "flagName": "llmIntent_lvpei_MoreSymptoms_flow",
                    "description": "Enable all MoreSymptoms flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"MoreSymptoms\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "918e2e02-6877-426d-a1d2-a40c009aff27",
                    "flagName": "llmIntent_lvpei_PositiveFeedback_flow",
                    "description": "Enable all PositiveFeedback flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"PositiveFeedback\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "234fc6eb-ef78-426a-bc3e-6f683dc66c3c",
                    "flagName": "llmIntent_lvpei_Reminder_Frequency_Daily_flow",
                    "description": "Enable all Reminder_Frequency_Daily flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Frequency_Daily\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "7ad6acd9-3f67-4aa4-9c66-2329361ff972",
                    "flagName": "llmIntent_lvpei_readAdditionalInfo_flow",
                    "description": "Enable all readAdditionalInfo flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"readAdditionalInfo\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "157a287f-c25b-4c91-8e45-9ce7ccb0a198",
                    "flagName": "llmIntent_lvpei_AdditionalInfo_flow",
                    "description": "Enable all AdditionalInfo flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"AdditionalInfo\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "95f3b900-f274-4b84-a48c-c93fae131775",
                    "flagName": "llmIntent_lvpei_Default Fallback Intent_flow",
                    "description": "Enable all Default Fallback Intent flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Default Fallback Intent\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "b85b68b9-db19-49f4-9d51-a25b8b33720a",
                    "flagName": "llmIntent_lvpei_welcomeYes_flow",
                    "description": "Enable all welcomeYes flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"welcomeYes\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "7f6bc054-d6a8-4bab-8304-f4d24f44e010",
                    "flagName": "llmIntent_lvpei_Welcome_flow",
                    "description": "Enable all Welcome flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Welcome\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "f7f33d5c-e28f-4437-8065-d152507c047f",
                    "flagName": "llmIntent_lvpei_findNearestLocation_flow",
                    "description": "Enable all findNearestLocation flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"findNearestLocation\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "5b420956-521d-4221-944a-b372001f6ab1",
                    "flagName": "llmIntent_lvpei_welcomeNo_flow",
                    "description": "Enable all welcomeNo flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"welcomeNo\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "0eb5f8f4-af6f-48f4-88ae-42b1afb3f806",
                    "flagName": "llmIntent_lvpei_Feedback - positive_flow",
                    "description": "Enable all Feedback - positive flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Feedback - positive\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "f8a52c65-fb3f-473c-a222-fb01e2ca7f04",
                    "flagName": "llmIntent_lvpei_symptomAnalysis_flow",
                    "description": "Enable all symptomAnalysis flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"symptomAnalysis\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "cb15db2c-1915-421d-93d2-0cca23ce268b",
                    "flagName": "llmIntent_lvpei_App_Reminder_Yes_flow",
                    "description": "Enable all App_Reminder_Yes flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"App_Reminder_Yes\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "c90b028d-6334-404e-9e89-fdceebb4268c",
                    "flagName": "llmIntent_lvpei_consent_yes_flow",
                    "description": "Enable all consent_yes flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"consent_yes\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "24f40d82-71e5-4896-ac32-3e143f9cb12a",
                    "flagName": "llmIntent_lvpei_Reminder_Reply_No_flow",
                    "description": "Enable all Reminder_Reply_No flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Reply_No\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "e5b110f0-91e8-4482-988c-03912b25ed78",
                    "flagName": "llmIntent_lvpei_AskQuestion_flow",
                    "description": "Enable all AskQuestion flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"AskQuestion\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "52f96a5c-c08f-4b13-88d4-71ad32ffa3d8",
                    "flagName": "llmIntent_lvpei_General_Reminder_flow",
                    "description": "Enable all General_Reminder flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"General_Reminder\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "4b0e1f74-9ef6-4d78-b2ff-daec7f82fb0a",
                    "flagName": "llmIntent_lvpei_normalCondition_flow",
                    "description": "Enable all normalCondition flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"normalCondition\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "6a9f9e5b-9302-4acf-bd82-947fc7b253d1",
                    "flagName": "llmIntent_lvpei_Reminder_Registration_flow",
                    "description": "Enable all Reminder_Registration flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Registration\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "c39e840a-6839-4a2e-b232-ad27f3c9e920",
                    "flagName": "llmIntent_lvpei_App_Reminder_No_flow",
                    "description": "Enable all App_Reminder_No flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"App_Reminder_No\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "a27f04d4-0318-4665-a4b0-4043d68c0c38",
                    "flagName": "llmIntent_lvpei_Reminder_Frequency_Once_flow",
                    "description": "Enable all Reminder_Frequency_Once flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Reminder_Frequency_Once\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          },
          {
                    "id": "e71772a4-65a3-40fa-98aa-53596b07d953",
                    "flagName": "llmIntent_lvpei_Feedback_flow",
                    "description": "Enable all Feedback flow intents for lvpei (100% rollout)",
                    "enabled": true,
                    "rolloutPercentage": 100,
                    "targetIntents": "[\"Feedback\"]",
                    "targetUsers": null,
                    "targetPlatforms": null,
                    "environments": "[\"development\",\"staging\",\"production\"]",
                    "expiresAt": null
          }
];

        // Add timestamps to each feature flag
        const featureFlags = featureFlagsData.map(flag => ({
            ...flag,
            createdAt: now,
            updatedAt: now
        }));

        // Insert feature flags
        await queryInterface.bulkInsert('feature_flags', featureFlags, {});

        console.log('');
        console.log('✅ Dialogflow intents for lvpei seeded successfully');
        console.log('  - 35 intents imported');
        console.log('  - 23 webhook-enabled intents');
        console.log('  - 14 intents with entity collection');
        console.log('  - 51 feature flags created (100% rollout)');
    },

    down: async (queryInterface, Sequelize) => {
        // Extract all intent codes
        const intentCodes = [
            'NegativeFeedback',
            'conditionIdentification',
            'eyeImage',
            'hyperCriticalCondition',
            'Default Welcome Intent',
            'responseNo',
            'criticalCondition',
            'responseYes',
            'consent_no',
            'Reminder_Ask_Frequency',
            'Reminder_Frequency_Weekly',
            'KerotoplastyFollowUp',
            'Change Language',
            'MoreSymptoms',
            'PositiveFeedback',
            'Reminder_Frequency_Daily',
            'readAdditionalInfo',
            'AdditionalInfo',
            'Default Fallback Intent',
            'welcomeYes',
            'Welcome',
            'findNearestLocation',
            'welcomeNo',
            'Feedback - positive',
            'symptomAnalysis',
            'App_Reminder_Yes',
            'consent_yes',
            'Reminder_Reply_No',
            'AskQuestion',
            'General_Reminder',
            'normalCondition',
            'Reminder_Registration',
            'App_Reminder_No',
            'Reminder_Frequency_Once',
            'Feedback'
        ];

        // Delete intents
        await queryInterface.bulkDelete('intents', {
            code: {
                [Sequelize.Op.in]: intentCodes
            }
        }, {});

        // Delete feature flags
        const flagNames = [
            'llmIntentResponseEnabled_lvpei',
            'llmEntityCollectionEnabled_lvpei',
            'entityCollection_conditionIdentification',
            'entityCollection_eyeImage',
            'entityCollection_hyperCriticalCondition',
            'entityCollection_criticalCondition',
            'entityCollection_Reminder_Frequency_Weekly',
            'entityCollection_Change Language',
            'entityCollection_MoreSymptoms',
            'entityCollection_AdditionalInfo',
            'entityCollection_Welcome',
            'entityCollection_findNearestLocation',
            'entityCollection_symptomAnalysis',
            'entityCollection_General_Reminder',
            'entityCollection_normalCondition',
            'entityCollection_Reminder_Registration',
            'llmIntent_lvpei_NegativeFeedback_flow',
            'llmIntent_lvpei_conditionIdentification_flow',
            'llmIntent_lvpei_eyeImage_flow',
            'llmIntent_lvpei_hyperCriticalCondition_flow',
            'llmIntent_lvpei_Default Welcome Intent_flow',
            'llmIntent_lvpei_responseNo_flow',
            'llmIntent_lvpei_criticalCondition_flow',
            'llmIntent_lvpei_responseYes_flow',
            'llmIntent_lvpei_consent_no_flow',
            'llmIntent_lvpei_Reminder_Ask_Frequency_flow',
            'llmIntent_lvpei_Reminder_Frequency_Weekly_flow',
            'llmIntent_lvpei_KerotoplastyFollowUp_flow',
            'llmIntent_lvpei_Change Language_flow',
            'llmIntent_lvpei_MoreSymptoms_flow',
            'llmIntent_lvpei_PositiveFeedback_flow',
            'llmIntent_lvpei_Reminder_Frequency_Daily_flow',
            'llmIntent_lvpei_readAdditionalInfo_flow',
            'llmIntent_lvpei_AdditionalInfo_flow',
            'llmIntent_lvpei_Default Fallback Intent_flow',
            'llmIntent_lvpei_welcomeYes_flow',
            'llmIntent_lvpei_Welcome_flow',
            'llmIntent_lvpei_findNearestLocation_flow',
            'llmIntent_lvpei_welcomeNo_flow',
            'llmIntent_lvpei_Feedback - positive_flow',
            'llmIntent_lvpei_symptomAnalysis_flow',
            'llmIntent_lvpei_App_Reminder_Yes_flow',
            'llmIntent_lvpei_consent_yes_flow',
            'llmIntent_lvpei_Reminder_Reply_No_flow',
            'llmIntent_lvpei_AskQuestion_flow',
            'llmIntent_lvpei_General_Reminder_flow',
            'llmIntent_lvpei_normalCondition_flow',
            'llmIntent_lvpei_Reminder_Registration_flow',
            'llmIntent_lvpei_App_Reminder_No_flow',
            'llmIntent_lvpei_Reminder_Frequency_Once_flow',
            'llmIntent_lvpei_Feedback_flow'
        ];
        await queryInterface.bulkDelete('feature_flags', {
            flagName: {
                [Sequelize.Op.in]: flagNames
            }
        }, {});

        console.log('Dialogflow intents for lvpei removed');
    }
};
