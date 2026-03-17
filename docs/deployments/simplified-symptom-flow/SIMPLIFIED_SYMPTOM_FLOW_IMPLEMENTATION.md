# Simplified Symptom Flow Implementation Plan

**Date**: 2026-03-16
**Status**: Draft
**Objective**: Simplify symptom reporting flow using existing kerotoplasty.service infrastructure

---

## 1. Overview

### Current Problem
- Complex multi-entity collection with conditionIdentification, MoreSymptoms, etc.
- Dialogflow intents are overly complicated
- Not leveraging existing kerotoplasty.service logic properly

### Solution
Simplify to a linear flow using existing kerotoplasty.service methods:
1. Hello → Welcome with buttons
2. Report Symptoms → Symptom collection prompt
3. Free text → Risk assessment + Image request
4. Image submission → Quality check + Medication question
5. Medication response → Completion

---

## 2. Conversation Flow

```
User: Hello
Bot:  Welcome! How can I help you today?
      [Ask Questions] [Report Symptoms] [Find Nearest Location]

User: [Clicks "Report Symptoms"]
Bot:  Please describe the symptoms you are experiencing.

User: I am having pain and redness
Bot:  Your case seems critical. Please consult the doctor immediately.

      Would you be able to provide an image of your affected eye?
      [Yes] [No]

User: [Clicks "Yes"]
Bot:  Please send a clear photo of your operated eye.
      Make sure there's good lighting and the image is focused.

User: [Sends image]
Bot:  [Quality check runs]
      - If PASS: "We've successfully received your photo. The quality looks good for further assessment.

                  Are you taking your prescribed medications regularly?"
                  [Yes] [No]

      - If FAIL: "The image quality is not sufficient for assessment. Please retake the photo ensuring:
                  - Good lighting
                  - Clear focus on the affected area
                  - No blur or glare"

User: [Clicks "Yes"]
Bot:  That's great to hear! Consistent medication is important for your recovery.
      Our team will review your case and reach out if needed. Take care!

User: [Clicks "No"] (alternate path)
Bot:  Thank you for the information. If you experience any changes or new symptoms,
      please don't hesitate to reach out. Take care!
```

---

## 3. Intent Structure

### Simplified Intents Required:

| Intent Code | Type | Purpose | Entities |
|-------------|------|---------|----------|
| `Default Welcome Intent` | static | Welcome message with 3 buttons | None |
| `reportSymptoms` | listener | Prompt for symptom description | None |
| `symptomAnalysis` | listener | Analyze symptoms, show risk, ask for image | `symptoms` (array) |
| `provideImageYes` | listener | Prompt user to send image | None |
| `provideImageNo` | listener | Completion without image | None |
| `eyeImage` | listener | Process image + quality check | `imageUrl`, `medicalRecordNumber` (optional) |
| `medicationYes` | listener | Positive response to medication question | None |
| `medicationNo` | listener | Negative response to medication question | None |

### Buttons Mapping:

```json
{
  "welcomeButtons": [
    { "text": "Ask Questions", "intentCode": "fallback" },
    { "text": "Report Symptoms", "intentCode": "reportSymptoms" },
    { "text": "Find Nearest Location", "intentCode": "findNearestLocation" }
  ],
  "imageRequestButtons": [
    { "text": "Yes", "intentCode": "provideImageYes" },
    { "text": "No", "intentCode": "provideImageNo" }
  ],
  "medicationButtons": [
    { "text": "Yes", "intentCode": "medicationYes" },
    { "text": "No", "intentCode": "medicationNo" }
  ]
}
```

---

## 4. Technical Implementation

### 4.1 Reuse Existing kerotoplasty.service Methods

**Available Methods:**
- `identifyCondition(eventObj)` → Returns [symptoms, message, priority]
- `symptomByUser(parameters)` → Formats symptom list
- `postingOnClickup(intent, eventObj, severityGrade)` → Creates/updates ClickUp task
- `postingImage(eventObj)` → Attaches image to ClickUp task

**Risk Classification (from ADDITIONAL_INFO config):**
```javascript
RISK_CLASSIFICATION: {
  EMERGENCY: {
    SYMPTOMS: ["severe pain", "sudden vision loss", ...],
    MESSAGE: "⚠️ Your symptoms require immediate medical attention..."
  },
  ATTENTION_NEEDED: {
    SYMPTOMS: ["redness", "mild pain", ...],
    MESSAGE: "Your symptoms need medical evaluation..."
  },
  NORMAL: {
    SYMPTOMS: ["slight discomfort", "dryness", ...],
    MESSAGE: "Thank you for sharing. These are common..."
  }
}
```

**Cache Key:** `SymptomsStorage:${userPlatformId}`

### 4.2 Image Quality Check

**Endpoint**: (To be confirmed from existing implementation)
- Check if quality check endpoint exists
- If yes: Integrate in eyeImage listener
- If no: Skip quality check for now, add TODO

---

## 5. File Changes Required

### 5.1 Database Changes

#### A. Update/Create Intents (SQL)

```sql
-- 1. Ensure Default Welcome Intent exists with buttons
UPDATE intents
SET
    staticResponse = JSON_OBJECT(
        'message', 'Welcome! How can I help you today?',
        'buttons', JSON_ARRAY(
            JSON_OBJECT('text', 'Ask Questions', 'type', 'intent', 'value', 'fallback'),
            JSON_OBJECT('text', 'Report Symptoms', 'type', 'intent', 'value', 'reportSymptoms'),
            JSON_OBJECT('text', 'Find Nearest Location', 'type', 'intent', 'value', 'findNearestLocation')
        )
    ),
    responseType = 'static',
    active = 1
WHERE code = 'Default Welcome Intent';

-- 2. Create/Update reportSymptoms intent
INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
VALUES (
    UUID(),
    'reportSymptoms',
    'Report Symptoms',
    'listener',
    1,
    1,
    NULL,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    responseType = 'listener',
    llmEnabled = 1,
    active = 1,
    entitySchema = NULL;

-- 3. Create/Update symptomAnalysis intent
INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
VALUES (
    UUID(),
    'symptomAnalysis',
    'Symptom Analysis',
    'listener',
    1,
    1,
    JSON_OBJECT(
        'symptoms', JSON_OBJECT(
            'type', 'array',
            'required', true,
            'description', 'User reported symptoms'
        )
    ),
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    responseType = 'listener',
    llmEnabled = 1,
    active = 1;

-- 4. Create provideImageYes intent
INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
VALUES (
    UUID(),
    'provideImageYes',
    'Provide Image Yes',
    'listener',
    1,
    1,
    NULL,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE responseType = 'listener', active = 1;

-- 5. Create provideImageNo intent
INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
VALUES (
    UUID(),
    'provideImageNo',
    'Provide Image No',
    'listener',
    1,
    1,
    NULL,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE responseType = 'listener', active = 1;

-- 6. Update eyeImage intent (should already exist)
UPDATE intents
SET
    responseType = 'listener',
    llmEnabled = 1,
    active = 1,
    entitySchema = JSON_OBJECT(
        'imageUrl', JSON_OBJECT(
            'type', 'array',
            'required', true,
            'description', 'Eye image URL'
        ),
        'medicalRecordNumber', JSON_OBJECT(
            'type', 'array',
            'required', false,
            'description', 'Medical record number'
        )
    )
WHERE code = 'eyeImage';

-- 7. Create medicationYes intent
INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
VALUES (
    UUID(),
    'medicationYes',
    'Medication Yes',
    'listener',
    1,
    1,
    NULL,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE responseType = 'listener', active = 1;

-- 8. Create medicationNo intent
INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
VALUES (
    UUID(),
    'medicationNo',
    'Medication No',
    'listener',
    1,
    1,
    NULL,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE responseType = 'listener', active = 1;

-- 9. DISABLE old Dialogflow intents (cleanup)
UPDATE intents
SET active = 0
WHERE code IN (
    'conditionIdentification',
    'MoreSymptoms',
    'KerotoplastyFollowUp',
    'responseYes',
    'responseNo'
);
```

#### B. Clean up old intent_listeners

```sql
-- Remove old Dialogflow listener mappings
DELETE FROM intent_listeners
WHERE listenerCode IN (
    'conditionIdentification',
    'MoreSymptoms',
    'KerotoplastyFollowUp',
    'responseYes',
    'responseNo'
);
```

### 5.2 Create New Listener File

**File**: `src/intentEmitters/llm/listeners/simplified.symptom.listener.ts`

**Content**: (See Section 6 below)

### 5.3 Update LLM Listener Registry

**File**: `src/intentEmitters/llm/llm.listener.register.ts`

```typescript
// Add import
import {
    ReportSymptomsListener,
    SymptomAnalysisListener,
    ProvideImageYesListener,
    ProvideImageNoListener,
    EyeImageListener,
    MedicationYesListener,
    MedicationNoListener
} from './listeners/simplified.symptom.listener';

// Add to listenerClasses array
const listenerClasses: ListenerClass[] = [
    // ... existing listeners

    // Simplified symptom flow
    ReportSymptomsListener,
    SymptomAnalysisListener,
    ProvideImageYesListener,
    ProvideImageNoListener,
    EyeImageListener,
    MedicationYesListener,
    MedicationNoListener,
];
```

### 5.4 Create Seeder for intent_listeners

**File**: `src/database/seeders/20260316120000-simplified-symptom-listeners.js`

**Content**: (See Section 7 below)

---

## 6. Listener Implementation

### File: `src/intentEmitters/llm/listeners/simplified.symptom.listener.ts`

```typescript
import { Lifecycle, scoped } from 'tsyringe';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { kerotoplastyService } from '../../../services/kerotoplasty.service';
import { CacheMemory } from '../../../services/cache.memory.service';

/**
 * Simplified Symptom Flow Listeners
 *
 * Linear flow:
 * 1. reportSymptoms → Prompt for symptoms
 * 2. symptomAnalysis → Risk assessment + image request
 * 3. provideImageYes → Prompt for image
 * 4. provideImageNo → Completion
 * 5. eyeImage → Quality check + medication question
 * 6. medicationYes/No → Completion
 */

// ============================================
// 1. REPORT SYMPTOMS LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ReportSymptomsListener extends BaseLLMListener {

    readonly intentCode = 'reportSymptoms';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Report symptoms triggered for user: ${event.userId}`);

        return this.success(
            'Please describe the symptoms you are experiencing in your operated eye.'
        );
    }
}

// ============================================
// 2. SYMPTOM ANALYSIS LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class SymptomAnalysisListener extends BaseLLMListener {

    readonly intentCode = 'symptomAnalysis';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Analyzing symptoms for user: ${event.userId}`);

        try {
            // Get kerotoplasty service
            const kerotoplastyServiceObj = this.resolve(event, kerotoplastyService);

            // Extract symptoms
            const symptoms = this.normalizeToArray(this.getEntity(event, 'symptoms'));

            if (!symptoms || symptoms.length === 0) {
                return this.success('Please describe the symptoms you are experiencing.');
            }

            // Create mock eventObj for kerotoplasty service compatibility
            const mockEventObj = {
                body: {
                    queryResult: {
                        parameters: { symptoms }
                    },
                    originalDetectIntentRequest: {
                        payload: { userId: event.userId }
                    }
                },
                container: event.container
            };

            // Use existing kerotoplasty.service logic
            const [extractedSymptoms, message, priority] = await kerotoplastyServiceObj.identifyCondition(mockEventObj);

            // Post to ClickUp async
            this.postToClickUpAsync(kerotoplastyServiceObj, mockEventObj, priority);

            this.log(`Risk assessment: Priority ${priority}`);

            // Return risk message with image request
            return {
                success: true,
                message,
                data: {
                    symptoms: extractedSymptoms,
                    priority,
                    followUpMessage: 'Would you be able to provide an image of your affected eye?',
                    followUpButtons: [
                        { text: 'Yes', intentCode: 'provideImageYes' },
                        { text: 'No', intentCode: 'provideImageNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error analyzing symptoms', error);
            return this.error('I apologize, but I encountered an issue processing your symptoms. Please try again.');
        }
    }

    /**
     * Post to ClickUp asynchronously
     */
    private postToClickUpAsync(service: kerotoplastyService, eventObj: any, priority: number): void {
        service.postingOnClickup('symptomAnalysis', eventObj, priority)
            .catch(err => this.logError('Error posting to ClickUp', err));
    }

    private normalizeToArray(value: any): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
    }
}

// ============================================
// 3. PROVIDE IMAGE YES LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ProvideImageYesListener extends BaseLLMListener {

    readonly intentCode = 'provideImageYes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Image consent received for user: ${event.userId}`);

        return this.success(
            'Please send a clear photo of your operated eye. Make sure there\'s good lighting and the image is focused.'
        );
    }
}

// ============================================
// 4. PROVIDE IMAGE NO LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ProvideImageNoListener extends BaseLLMListener {

    readonly intentCode = 'provideImageNo';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`User declined image submission: ${event.userId}`);

        // Clear cache
        const cacheKey = `SymptomsStorage:${event.userId}`;
        await CacheMemory.delete(cacheKey);

        return this.success(
            'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!'
        );
    }
}

// ============================================
// 5. EYE IMAGE LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class EyeImageListener extends BaseLLMListener {

    readonly intentCode = 'eyeImage';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing eye image for user: ${event.userId}`);

        try {
            // Extract image URL
            const imageUrl = this.normalizeToArray(this.getEntity(event, 'imageUrl'));

            if (imageUrl.length === 0) {
                return this.success('Please send a clear photo of your operated eye.');
            }

            // Get kerotoplasty service
            const kerotoplastyServiceObj = this.resolve(event, kerotoplastyService);

            // Create mock eventObj
            const mockEventObj = {
                body: {
                    queryResult: {
                        parameters: { imageUrl: imageUrl[0] },
                        queryText: imageUrl[0]
                    },
                    originalDetectIntentRequest: {
                        payload: { userId: event.userId }
                    }
                },
                container: event.container
            };

            // Post image to ClickUp
            await kerotoplastyServiceObj.postingImage(mockEventObj);

            // TODO: Image quality check
            // const qualityCheckResult = await this.checkImageQuality(imageUrl[0]);
            // if (!qualityCheckResult.passed) {
            //     return this.success(
            //         'The image quality is not sufficient for assessment. Please retake the photo ensuring:\n' +
            //         '- Good lighting\n' +
            //         '- Clear focus on the affected area\n' +
            //         '- No blur or glare'
            //     );
            // }

            this.log(`Image received and posted: ${imageUrl[0]}`);

            return {
                success: true,
                message: 'We\'ve successfully received your photo. The quality looks good for further assessment.',
                data: {
                    imageUrl: imageUrl[0],
                    imageReceived: true,
                    followUpMessage: 'Are you taking your prescribed medications regularly?',
                    followUpButtons: [
                        { text: 'Yes', intentCode: 'medicationYes' },
                        { text: 'No', intentCode: 'medicationNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing eye image', error);
            return this.error('I apologize, but I encountered an issue processing your image. Please try again.');
        }
    }

    private normalizeToArray(value: any): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
    }
}

// ============================================
// 6. MEDICATION YES LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class MedicationYesListener extends BaseLLMListener {

    readonly intentCode = 'medicationYes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Medication adherence confirmed for user: ${event.userId}`);

        // Clear cache
        const cacheKey = `SymptomsStorage:${event.userId}`;
        await CacheMemory.delete(cacheKey);

        return this.success(
            'That\'s great to hear! Consistent medication is important for your recovery. ' +
            'Our team will review your case and reach out if needed. Take care!'
        );
    }
}

// ============================================
// 7. MEDICATION NO LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class MedicationNoListener extends BaseLLMListener {

    readonly intentCode = 'medicationNo';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Medication non-adherence reported for user: ${event.userId}`);

        // Clear cache
        const cacheKey = `SymptomsStorage:${event.userId}`;
        await CacheMemory.delete(cacheKey);

        return this.success(
            'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!'
        );
    }
}
```

---

## 7. Seeder Implementation

### File: `src/database/seeders/20260316120000-simplified-symptom-listeners.js`

```javascript
/**
 * Seeder: Add intent_listeners for Simplified Symptom Flow
 *
 * Date: 2026-03-16
 * Purpose: Register simplified symptom flow listeners
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        console.log('[Simplified Symptom Listeners] Starting setup...');

        // Define listener configurations
        const listenerConfigs = [
            {
                intentCode: 'reportSymptoms',
                listenerCode: 'reportSymptoms',
                className: 'ReportSymptomsListener'
            },
            {
                intentCode: 'symptomAnalysis',
                listenerCode: 'symptomAnalysis',
                className: 'SymptomAnalysisListener'
            },
            {
                intentCode: 'provideImageYes',
                listenerCode: 'provideImageYes',
                className: 'ProvideImageYesListener'
            },
            {
                intentCode: 'provideImageNo',
                listenerCode: 'provideImageNo',
                className: 'ProvideImageNoListener'
            },
            {
                intentCode: 'eyeImage',
                listenerCode: 'eyeImage',
                className: 'EyeImageListener'
            },
            {
                intentCode: 'medicationYes',
                listenerCode: 'medicationYes',
                className: 'MedicationYesListener'
            },
            {
                intentCode: 'medicationNo',
                listenerCode: 'medicationNo',
                className: 'MedicationNoListener'
            }
        ];

        // Get intent IDs
        const intentCodes = listenerConfigs.map(c => c.intentCode);
        const placeholders = intentCodes.map(() => '?').join(',');

        const [intents] = await queryInterface.sequelize.query(
            `SELECT id, code FROM intents WHERE code IN (${placeholders})`,
            { replacements: intentCodes }
        );

        console.log(`[Simplified Symptom Listeners] Found ${intents.length} intents`);

        if (intents.length !== listenerConfigs.length) {
            console.error(`Missing intents! Expected ${listenerConfigs.length}, found ${intents.length}`);
            throw new Error('Not all intents found in database');
        }

        const intentMap = {};
        intents.forEach(intent => {
            intentMap[intent.code] = intent.id;
        });

        // Delete existing listeners
        const listenerCodes = listenerConfigs.map(c => c.listenerCode);
        await queryInterface.bulkDelete('intent_listeners', {
            listenerCode: listenerCodes
        }, {});

        // Create new listeners
        const intentListeners = listenerConfigs.map(config => ({
            intentId: intentMap[config.intentCode],
            listenerCode: config.listenerCode,
            sequence: 1,
            handlerType: 'class',
            handlerPath: `src/intentEmitters/llm/listeners/simplified.symptom.listener.ts:${config.className}`,
            handlerConfig: JSON.stringify({ useLLMRegistry: true }),
            enabled: true,
            executionMode: 'sequential',
            createdAt: now,
            updatedAt: now
        }));

        await queryInterface.bulkInsert('intent_listeners', intentListeners, {});

        console.log('[Simplified Symptom Listeners] ✅ Successfully registered all listeners');
    },

    down: async (queryInterface, Sequelize) => {
        console.log('[Simplified Symptom Listeners] Removing listeners...');

        const listenerCodes = [
            'reportSymptoms',
            'symptomAnalysis',
            'provideImageYes',
            'provideImageNo',
            'eyeImage',
            'medicationYes',
            'medicationNo'
        ];

        await queryInterface.bulkDelete('intent_listeners', {
            listenerCode: listenerCodes
        }, {});

        console.log('[Simplified Symptom Listeners] ✅ Listeners removed');
    }
};
```

---

## 8. Deployment Steps

### Step 1: Backup Current State
```bash
# Backup intents table
mysqldump -u username -p database_name intents > intents_backup_20260316.sql

# Backup intent_listeners table
mysqldump -u username -p database_name intent_listeners > intent_listeners_backup_20260316.sql
```

### Step 2: Run Database Updates
```bash
# Run intent creation/update SQL (from Section 5.1.A)
mysql -u username -p database_name < simplified_intents_setup.sql
```

### Step 3: Create Listener Files
```bash
# Create new listener file
# Copy content from Section 6 to:
# src/intentEmitters/llm/listeners/simplified.symptom.listener.ts
```

### Step 4: Update LLM Registry
```bash
# Update src/intentEmitters/llm/llm.listener.register.ts
# Add imports and register listeners (from Section 5.3)
```

### Step 5: Create and Run Seeder
```bash
# Create seeder file (Section 7)
# Run seeder
npx sequelize-cli db:seed --seed 20260316120000-simplified-symptom-listeners.js
```

### Step 6: Build and Deploy
```bash
# Build TypeScript
npm run build

# Restart application
npm run start
```

### Step 7: Test Flow
```
1. Send "Hello" → Check welcome buttons appear
2. Click "Report Symptoms" → Check prompt appears
3. Send "pain and redness" → Check risk message + image buttons
4. Click "Yes" → Check image prompt
5. Send image → Check medication buttons
6. Click "Yes" → Check completion message
```

---

## 9. Rollback Plan

If issues occur:

```sql
-- Restore from backup
mysql -u username -p database_name < intents_backup_20260316.sql
mysql -u username -p database_name < intent_listeners_backup_20260316.sql

-- Re-enable old Dialogflow intents
UPDATE intents
SET active = 1
WHERE code IN (
    'conditionIdentification',
    'MoreSymptoms',
    'KerotoplastyFollowUp',
    'responseYes',
    'responseNo'
);

-- Restore old listener registry
git checkout HEAD -- src/intentEmitters/llm/llm.listener.register.ts

-- Rebuild and restart
npm run build
npm run start
```

---

## 10. Production Deployment Checklist

- [ ] Backup database tables
- [ ] Test on staging environment
- [ ] Verify all 8 intents created
- [ ] Verify all 7 listeners registered
- [ ] Test complete conversation flow
- [ ] Verify ClickUp integration works
- [ ] Verify cache clearing works
- [ ] Test button navigation
- [ ] Document any issues encountered
- [ ] Get stakeholder approval
- [ ] Schedule production deployment
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Validate production flow

---

## 11. Future Enhancements

### Image Quality Check Integration
```typescript
// Add to EyeImageListener
const qualityCheckResult = await this.checkImageQuality(imageUrl[0]);
if (!qualityCheckResult.passed) {
    return this.success(
        'The image quality is not sufficient for assessment. Please retake the photo ensuring:\n' +
        '- Good lighting\n' +
        '- Clear focus on the affected area\n' +
        '- No blur or glare'
    );
}
```

### Medical Record Number Collection
- Add optional MRN collection in symptomAnalysis
- Store in cache for ClickUp task creation

### Conversation Context Preservation
- Track conversation state across turns
- Allow users to restart flow mid-conversation

---

## 12. Notes

- **Cache Key**: Uses `SymptomsStorage:${userPlatformId}` (same as kerotoplasty.service)
- **Risk Classification**: Pulled from `ADDITIONAL_INFO` environment variable
- **ClickUp Integration**: Async, fire-and-forget pattern
- **Button Format**: Uses `intentCode` property for mapping
- **Entity Normalization**: All entity values normalized to arrays for consistency

---

**Document Version**: 1.0
**Last Updated**: 2026-03-16
**Author**: Claude Code Assistant
