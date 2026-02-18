# Required Assessments Feature - Design Document

**Feature**: Required/Mandatory Assessments
**Branch**: `assessment-handling-first-time`
**Date**: 2026-02-03
**Status**: Design Review

---

## Problem Statement

Currently, assessments in the chatbot are "open-ended" - when a user's response fails validation, the message escapes to the QnA/LLM handler for general FAQ answering. This allows users to effectively abandon assessments mid-flow.

A client requires **mandatory assessments** where users MUST complete the assessment before proceeding with any other interaction.

---

## Design Decisions

The following decisions were made through collaborative brainstorming:

| # | Question | Options Considered | Decision | Rationale |
|---|----------|-------------------|----------|-----------|
| 1 | When the user sends an invalid response during a required assessment, what should happen? | (a) Re-prompt the same question (b) Re-prompt with hints (c) Allow limited retries (d) Something else | **Re-prompt with hints** | Better UX - uses LLM to generate helpful clarification based on what the user said |
| 2 | How should an assessment be marked as "required" vs "optional"? | (a) Per-tenant configuration (b) Per-assessment configuration (c) Per-trigger configuration (d) Combination | **Per-assessment configuration** | Granular control - each assessment can be individually marked as required or optional |
| 3 | Where should the "required" flag be stored? | (a) In REAN Care service (b) In bot wrapper database (c) In intent metadata | **In REAN Care service** | Single source of truth, manageable through REAN Care admin, keeps bot wrapper focused on behavior |
| 4 | How should the system handle timeout or abandonment scenarios? | (a) No escape at all (b) Time-based expiry (c) Explicit exit command (d) Admin override only | **No escape at all** | Strict requirement - user must complete the assessment even across sessions/days |
| 5 | When a user with an active required assessment tries a different intent, what should happen? | (a) Block and redirect (b) Queue the intent (c) Allow priority intents only | **Queue the intent** | Acknowledges the user's request without ignoring them - "I'll help with that after you complete this assessment" |
| 6 | For queued intents, how many should the system remember? | (a) Only the last one (b) Queue all of them (c) Queue with limit | **Only the last one** | Simpler and less confusing - if user clicks multiple buttons, only the most recent is queued |

---

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| Configuration scope | Per-assessment (not per-tenant) |
| Configuration storage | REAN Care service (assessment template) |
| On validation failure | Re-prompt with LLM-generated hints |
| Escape mechanism | None - user must complete |
| Session persistence | Across sessions/days until completion |
| Other intents during assessment | Queue the last intent, process after completion |
| Tenant compatibility | Must be tenant-agnostic (SaaS) |

---

## Current Assessment Flow

```
User Message
    │
    ▼
DecisionRouter.getDecision()
    │
    ├─► checkCareplanEnrollment()
    ├─► checkFeedback()
    │
    ▼
checkAssessment()
    │
    ├─► Check for active session (NextQuestionFlag in cache)
    ├─► Validate user response against expected type
    │       │
    │       ├─► Valid: AssessmentFlag = true → Assessment Handler
    │       │
    │       └─► Invalid: AssessmentFlag = false → Falls through to DialogFlow/QnA
    │                    ▲
    │                    │
    │               THE ESCAPE HATCH (problem)
    │
    ▼
checkDFIntent() → NLP/QnA Handler
```

**Key Issue**: Line 275-276 in `decision.router.service.ts`:
```typescript
if (!validationFlag) {
    assessmentData.AssessmentFlag = false;  // User escapes assessment
    ...
}
```

---

## Proposed Approaches

### Approach 1: Assessment Lock Service (Recommended)

#### Concept

Create a dedicated "lock" mechanism that intercepts ALL messages when a required assessment is active. The lock check happens at the very top of the routing flow, before any other checks.

#### Architecture

```
User Message
    │
    ▼
DecisionRouter.getDecision()
    │
    ▼
┌─────────────────────────────────────┐
│  NEW: checkRequiredAssessmentLock() │  ◄── First check, before everything
│                                     │
│  • Query assessment_locks table     │
│  • If locked:                       │
│    - Route ALL messages to          │
│      RequiredAssessmentHandler      │
│    - No escape possible             │
└─────────────────────────────────────┘
    │
    │ (only if not locked)
    ▼
checkCareplanEnrollment() → checkFeedback() → checkAssessment() → ...
```

#### New Components

##### 1. Database Table: `assessment_locks`

```sql
CREATE TABLE assessment_locks (
    id                      INT PRIMARY KEY AUTO_INCREMENT,
    user_platform_id        VARCHAR(255) NOT NULL,
    assessment_id           VARCHAR(255) NOT NULL,
    assessment_template_id  VARCHAR(255) NOT NULL,
    assessment_name         VARCHAR(255),
    current_node_id         VARCHAR(255),
    current_question        TEXT,
    queued_intent           VARCHAR(255),      -- Last intent user tried during lock
    queued_intent_payload   JSON,              -- Payload for queued intent
    retry_count             INT DEFAULT 0,     -- Times user gave invalid response
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_lock (user_platform_id),  -- One lock per user
    INDEX idx_user_platform (user_platform_id)
);
```

##### 2. Service: `RequiredAssessmentLockService`

**File**: `src/services/assessment/required.assessment.lock.service.ts`

```typescript
@scoped(Lifecycle.ContainerScoped)
export class RequiredAssessmentLockService {

    /**
     * Check if user has an active required assessment lock
     */
    async checkLock(userPlatformId: string): Promise<AssessmentLock | null>;

    /**
     * Create a lock when required assessment starts
     */
    async createLock(userPlatformId: string, assessmentData: AssessmentLockData): Promise<AssessmentLock>;

    /**
     * Update lock (current question, retry count, etc.)
     */
    async updateLock(userPlatformId: string, updates: Partial<AssessmentLock>): Promise<void>;

    /**
     * Queue an intent that user tried during locked assessment
     */
    async queueIntent(userPlatformId: string, intentCode: string, payload?: any): Promise<void>;

    /**
     * Release lock and return queued intent (if any)
     */
    async releaseLock(userPlatformId: string): Promise<QueuedIntent | null>;

    /**
     * Check if assessment template is marked as required in REAN Care
     */
    async isAssessmentRequired(assessmentTemplateId: string): Promise<boolean>;
}
```

##### 3. Service: `RequiredAssessmentHandler`

**File**: `src/services/assessment/required.assessment.handler.service.ts`

```typescript
@scoped(Lifecycle.ContainerScoped)
export class RequiredAssessmentHandler {

    /**
     * Handle user message when locked in required assessment
     */
    async handleMessage(
        messageBody: Imessage,
        lock: AssessmentLock,
        platformService: platformServiceInterface
    ): Promise<AssessmentHandlerResult>;

    /**
     * Validate response and either proceed or generate hint
     */
    async validateAndProceed(
        messageBody: Imessage,
        lock: AssessmentLock
    ): Promise<ValidationResult>;

    /**
     * Generate helpful hint using LLM when validation fails
     */
    async generateHint(
        userMessage: string,
        expectedResponseType: string,
        currentQuestion: string,
        identifier: string
    ): Promise<string>;

    /**
     * Handle intent that user tried during assessment
     */
    async handleQueuedIntent(
        userPlatformId: string,
        queuedIntent: QueuedIntent,
        platformService: platformServiceInterface
    ): Promise<void>;
}
```

##### 4. LLM Prompt for Hint Generation

```typescript
const HINT_GENERATION_PROMPT = `
You are helping a user complete a required health assessment. They provided an invalid response.

Current Question: {current_question}
Expected Response Type: {expected_type}
Field Being Collected: {identifier}
User's Invalid Response: {user_response}

Generate a friendly, helpful hint that:
1. Acknowledges what they said
2. Explains what kind of response is expected
3. Provides an example if appropriate
4. Keeps the tone supportive, not frustrated

Keep the response under 2 sentences. Be conversational.

Examples of good hints:
- "I see you said 'okay', but I need your actual blood pressure reading. Please enter it like '120/80'."
- "That doesn't look like a weight measurement. Could you enter your weight in kg, like '68.5'?"
- "I need a number for your pulse rate. For example, '72' or '72 bpm'."
`;
```

#### Modified DecisionRouter Flow

**File**: `src/services/langchain/decision.router.service.ts`

```typescript
async getDecision(messageBody: Imessage, channel: string) {
    try {
        // NEW: Check for required assessment lock FIRST
        const assessmentLock = await this.requiredAssessmentLockService.checkLock(
            messageBody.platformId
        );

        if (assessmentLock) {
            console.log(`User ${messageBody.platformId} is locked in required assessment`);

            // Check if this is an intent attempt (button click)
            if (messageBody.intent) {
                // Queue the intent for later
                await this.requiredAssessmentLockService.queueIntent(
                    messageBody.platformId,
                    messageBody.intent,
                    messageBody
                );

                // Return acknowledgment + continue assessment
                this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.RequiredAssessment;
                this.outgoingMessage.RequiredAssessment = {
                    lock: assessmentLock,
                    intentQueued: true,
                    queuedIntentName: messageBody.intent
                };
                return this.outgoingMessage;
            }

            // Regular message - route to required assessment handler
            this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.RequiredAssessment;
            this.outgoingMessage.RequiredAssessment = {
                lock: assessmentLock,
                intentQueued: false
            };
            return this.outgoingMessage;
        }

        // Existing flow continues...
        const workflowMode = this.environmentProviderService.getClientEnvironmentVariable("WORK_FLOW_MODE");
        // ...
    }
}
```

#### Starting a Required Assessment

When an assessment is triggered, check if it's required and create lock:

```typescript
// In AssessmentHandlingService.initialiseAssessment()

async initialiseAssessment(input: OutgoingMessage, assessmentDisplayCode, eventObj) {
    // ... existing code to get assessment template ...

    // NEW: Check if this assessment is required
    const isRequired = await this.requiredAssessmentLockService.isAssessmentRequired(
        assessmentDetails.id
    );

    if (isRequired) {
        // Create lock for this user
        await this.requiredAssessmentLockService.createLock(
            input.MetaData.platformId,
            {
                assessmentId: assessmentData.Data.Assessment.id,
                assessmentTemplateId: assessmentDetails.id,
                assessmentName: assessmentDetails.Title,
                currentNodeId: firstQuestion.nodeId,
                currentQuestion: firstQuestion.text
            }
        );
    }

    // ... continue with existing flow ...
}
```

#### Completing a Required Assessment

When assessment completes, release lock and process queued intent:

```typescript
// In assessment completion handler

async completeAssessment(userPlatformId: string, platformService) {
    // Release lock and get queued intent
    const queuedIntent = await this.requiredAssessmentLockService.releaseLock(userPlatformId);

    // Send completion message
    await this.sendCompletionMessage(userPlatformId, platformService);

    // Process queued intent if any
    if (queuedIntent) {
        await this.requiredAssessmentHandler.handleQueuedIntent(
            userPlatformId,
            queuedIntent,
            platformService
        );
    }
}
```

#### Pros and Cons

**Pros:**
- Clean separation of concerns - required assessment logic is isolated
- Lock check happens first, guaranteeing no escape
- Easy to understand and debug
- Lock state is explicit and visible (easy to query/debug)
- Minimal changes to existing assessment flow
- Easy to add features later (e.g., admin unlock, timeout)
- Performance: single cached DB lookup

**Cons:**
- New database table to maintain
- New services to create
- Slightly more code overall

---

### Approach 2: Enhance Existing Assessment Flow

#### Concept

Modify the existing `checkAssessment()` method and related services to handle required mode inline, without creating new tables or services.

#### Architecture

```
User Message
    │
    ▼
DecisionRouter.getDecision()
    │
    ├─► checkCareplanEnrollment()
    ├─► checkFeedback()
    │
    ▼
checkAssessment() [ENHANCED]
    │
    ├─► Check for active session
    ├─► Fetch assessment template from REAN Care
    ├─► Check if isRequired = true
    │
    ├─► Validate user response
    │       │
    │       ├─► Valid: Continue to next question
    │       │
    │       └─► Invalid + Required:
    │               │
    │               ├─► Generate hint with LLM
    │               ├─► Re-prompt same question with hint
    │               └─► AssessmentFlag stays TRUE (no escape)
    │
    ▼
(Only reaches here if no active required assessment)
checkDFIntent() → NLP/QnA Handler
```

#### Database Changes

Add columns to existing `assessment_session_logs` table:

```sql
ALTER TABLE assessment_session_logs ADD COLUMN is_required BOOLEAN DEFAULT FALSE;
ALTER TABLE assessment_session_logs ADD COLUMN queued_intent VARCHAR(255);
ALTER TABLE assessment_session_logs ADD COLUMN queued_intent_payload JSON;
ALTER TABLE assessment_session_logs ADD COLUMN retry_count INT DEFAULT 0;
ALTER TABLE assessment_session_logs ADD COLUMN current_question TEXT;
```

#### Modified checkAssessment()

**File**: `src/services/langchain/decision.router.service.ts`

```typescript
async checkAssessment(messageBody: Imessage, channel: string) {
    try {
        const assessmentData = {
            AssessmentId: '',
            AssessmentName: '',
            TemplateId: '',
            CurrentNodeId: '',
            Question: '',
            AssessmentFlag: false,
            IsRequired: false,           // NEW
            HintMessage: null,           // NEW
            IntentQueued: false,         // NEW
            MetaData: {
                assessmentStart: false,
                askQuestionAgain: false
            }
        };

        // ... existing session lookup code ...

        if (assessmentResponse) {
            // NEW: Check if this is a required assessment
            const isRequired = assessmentResponse.is_required;
            assessmentData.IsRequired = isRequired;

            // NEW: If required and user is trying another intent, queue it
            if (isRequired && messageBody.intent && !this.isAssessmentIntent(messageBody.intent)) {
                await this.queueIntentForLater(
                    assessmentResponse.autoIncrementalID,
                    messageBody.intent,
                    messageBody
                );
                assessmentData.IntentQueued = true;
                assessmentData.AssessmentFlag = true;  // Stay in assessment
                return assessmentData;
            }
        }

        // ... existing validation code ...

        if (assessmentData.AssessmentFlag && !assessmentData.MetaData.assessmentStart) {
            // ... existing identifier lookup ...

            const validationFlag = await this.assessmentService.validateAssessmentResponse(
                assessmentResponseType,
                assessmentIdentifierString,
                messageBody,
                assessmentResponse.dataValues
            );

            if (!validationFlag) {
                // NEW: Check if required
                if (assessmentResponse.is_required) {
                    // Don't escape! Generate hint and re-prompt
                    assessmentData.AssessmentFlag = true;  // STAY in assessment
                    assessmentData.MetaData.askQuestionAgain = true;
                    assessmentData.HintMessage = await this.generateValidationHint(
                        messageBody.messageBody,
                        assessmentResponseType,
                        assessmentResponse.current_question,
                        assessmentIdentifierString
                    );

                    // Increment retry count
                    await this.incrementRetryCount(assessmentResponse.autoIncrementalID);

                    return assessmentData;
                } else {
                    // Existing behavior - allow escape
                    assessmentData.AssessmentFlag = false;
                    // ... existing fallback logic ...
                }
            }
        }

        return assessmentData;
    } catch (error) {
        console.log('Error in checkAssessment:', error);
        // ... error handling ...
    }
}

private async generateValidationHint(
    userMessage: string,
    expectedType: string,
    currentQuestion: string,
    identifier: string
): Promise<string> {
    const promptTemplate = PromptTemplate.fromTemplate(`
        You are helping a user complete a health assessment. They provided an invalid response.

        Current Question: {current_question}
        Expected Response Type: {expected_type}
        Field: {identifier}
        User's Response: {user_response}

        Generate a friendly 1-2 sentence hint explaining what's expected.
        Be supportive and provide an example if helpful.
    `);

    const model = new ChatOpenAI({ temperature: 0.3, modelName: "gpt-4o-mini" });
    const chain = promptTemplate.pipe(model);

    const result = await chain.invoke({
        current_question: currentQuestion,
        expected_type: expectedType,
        identifier: identifier,
        user_response: userMessage
    });

    return result.lc_kwargs.content;
}
```

#### Modified Assessment Handler

Update the assessment message handler to include hints:

```typescript
// In handle.request.service.ts or assessment handler

case MessageHandlerType.Assessments: {
    if (outgoingMessage.Assessment.MetaData?.askQuestionAgain) {
        // Re-prompt with hint
        const hint = outgoingMessage.Assessment.HintMessage;
        const question = outgoingMessage.Assessment.Question;

        const message = `${hint}\n\n${question}`;
        // Send message...
    }

    if (outgoingMessage.Assessment.IntentQueued) {
        // Acknowledge queued intent
        const ackMessage = `I'll help you with that after you complete this assessment. `;
        // Prepend to next question...
    }

    // ... existing assessment handling ...
}
```

#### Starting a Required Assessment

```typescript
// In AssessmentHandlingService or ServeAssessmentService

async startAssessmentAndUpdate(input: AssessmentRequest, platformMessageService) {
    // ... existing code ...

    // NEW: Fetch isRequired from REAN Care
    const templateUrl = `clinical/assessment-templates/${input.Body.AssessmentTemplateId}`;
    const templateResponse = await this.needleService.needleRequestForREAN("get", templateUrl);
    const isRequired = templateResponse.Data?.AssessmentTemplate?.IsRequired ?? false;

    // Store in session log
    assessmentSessionLogs.is_required = isRequired;
    assessmentSessionLogs.current_question = updatedPayload.messageText;

    // ... continue existing code ...
}
```

#### Pros and Cons

**Pros:**
- No new tables (extends existing)
- Builds on existing code patterns
- Fewer new files to create

**Cons:**
- Makes `checkAssessment()` even more complex (already 200+ lines)
- Required assessment check happens mid-flow, after other checks
- Edge cases harder to reason about
- Mixing concerns: routing logic + hint generation + queue management
- Harder to test in isolation
- Future features (admin unlock, timeout) harder to add

---

## Comparison Matrix

| Aspect | Approach 1: Lock Service | Approach 2: Enhance Existing |
|--------|-------------------------|------------------------------|
| **Complexity** | Moderate (new service) | High (complex existing code) |
| **Code Clarity** | High - explicit lock state | Medium - implicit in flow |
| **Testing** | Easy - isolated services | Hard - intertwined logic |
| **Check Priority** | First (guaranteed) | Mid-flow (after careplan, feedback) |
| **New Tables** | 1 new table | 0 (extends existing) |
| **New Services** | 2 new services | 0 (extends existing) |
| **Future Extensibility** | Easy to add features | Harder to extend |
| **Debug/Monitor** | Easy - query lock table | Harder - logs scattered |
| **Performance** | Single cached lookup | Similar |
| **Risk to Existing** | Low - additive changes | Medium - modifies core flow |

---

## Recommendation

**Approach 1: Assessment Lock Service** is recommended because:

1. **Reliability**: Lock check happens FIRST, before any other routing. There's no way to escape.

2. **Clarity**: The "locked" state is explicit and queryable. Easy to debug and monitor.

3. **Separation of Concerns**: Required assessment logic is isolated from existing assessment flow.

4. **Testability**: New services can be unit tested in isolation.

5. **Extensibility**: Easy to add features later:
   - Admin unlock capability
   - Timeout with notification
   - Retry limits with escalation
   - Analytics on stuck users

6. **Safety**: Minimal changes to existing working code.

---

## Implementation Estimate

### Approach 1: Lock Service

| Task | Files |
|------|-------|
| Create migration for `assessment_locks` table | 1 |
| Create `AssessmentLock` model | 1 |
| Create `AssessmentLockRepo` repository | 1 |
| Create `RequiredAssessmentLockService` | 1 |
| Create `RequiredAssessmentHandler` | 1 |
| Add `MessageHandlerType.RequiredAssessment` | 1 |
| Modify `DecisionRouter` - add lock check | 1 |
| Modify `handle.request.service` - add handler case | 1 |
| Modify `AssessmentHandlingService` - create lock on start | 1 |
| Modify assessment completion - release lock | 1 |
| Add hint generation prompt | 1 |
| Unit tests | 2-3 |

### Approach 2: Enhance Existing

| Task | Files |
|------|-------|
| Create migration to add columns | 1 |
| Modify `checkAssessment()` - add required logic | 1 |
| Add hint generation in `DecisionRouter` | 1 |
| Modify assessment handler for re-prompt | 1 |
| Modify assessment start for isRequired | 1 |
| Modify assessment completion for queued intent | 1 |
| Unit tests | 2-3 |

---

## Open Questions

1. **REAN Care API**: Does the assessment template API already have an `isRequired` field, or does it need to be added on the REAN Care side?

2. **Existing Assessments**: Should running assessments be migrated to required mode, or only new ones?

3. **Queued Intent Acknowledgment**: What message should be shown when an intent is queued?
   - Example: "I'll help you with [intent name] after you complete this assessment."

4. **Multiple Assessments**: Can a user be in multiple required assessments simultaneously? (Probably no - one lock per user)

---

## Next Steps

1. Review this document and confirm approach selection
2. Confirm REAN Care API has/will have `isRequired` field
3. Create implementation plan with detailed tasks
4. Begin implementation

---

**Document Version**: 1.0
**Author**: Development Team
**Review Status**: Awaiting Review
