# Intent Migration Plan: Reminder, Symptom, Delete User

**Branch**: `feature/replace-dialogflow`
**Date**: 2026-02-03
**Status**: In Progress
**Last Updated**: 2026-02-05

---

## Overview

Migrate priority intents from Dialogflow to LLM-based classification and entity collection. These intents will use the existing LLM infrastructure (LLMIntentRegistry, BaseLLMListener, entity collection services).

### Architecture Update (2026-02-05)

The system now supports **database-driven intent responses** with three response types:

| Response Type | Description | Requires Listener |
|---------------|-------------|-------------------|
| `static` | Returns message + buttons directly from database | No |
| `listener` | Executes registered handler for business logic | Yes |
| `hybrid` | Returns static response AND triggers async handler | Yes |

This architecture allows:
- Simple intents (welcome, FAQ) to be fully database-driven without code changes
- Complex intents to still execute business logic via listeners
- Future admin panel control over intent responses

---

## Target Intents

| # | Intent | Complexity | Entities Required | Priority | Status |
|---|--------|------------|-------------------|----------|--------|
| 1 | Delete User | Low | UserResponse (yes/no) | High | ✅ COMPLETED |
| 2 | Delete Reminder | Low | None (uses context) | High | Pending |
| 3 | Create Medication Reminder | Medium | medicineName, time, dayName | High | Pending |
| 4 | General Reminder | Medium | event, date, time, frequency, dayName | Medium | Pending |
| 5 | Symptom Assessment (Keratoplasty) | High | symptoms[] | Medium | ✅ COMPLETED |

---

## Migration Strategy

For each intent, we will:

1. **Create LLM Listener** - New listener extending `BaseLLMListener`
2. **Define Entity Schema** - JSON schema for entity collection
3. **Configure Intent** - Update intents table with LLM settings
4. **Register Listener** - Add to `llm.listener.register.ts`
5. **Add Feature Flag** - Per-intent feature flag for gradual rollout
6. **Test** - Unit and integration tests

---

## Phase 1: Simple Intents (Delete User, Delete Reminder)

### 1.1 Delete User Intent

**Current Implementation**: `src/intentEmitters/intentListeners/user.history.deletion.listener.ts`

**Current Flow**:
```
User: "Delete my data" → Dialogflow → Intent: user_history_deletion
→ Listener extracts UserResponse (yes/no) from parameters
→ If yes: delete user data
→ If no: cancel deletion
```

**Entities Required**:
| Entity | Type | Required | Description |
|--------|------|----------|-------------|
| userConfirmation | boolean/string | Yes | User's yes/no confirmation |

**Entity Schema**:
```json
{
  "userConfirmation": {
    "type": "string",
    "required": true,
    "description": "User confirmation to delete data (yes/no)",
    "validation": {
      "enum": ["yes", "no", "y", "n"]
    },
    "followUpQuestion": "Are you sure you want to delete all your data? This action cannot be undone. Please reply 'yes' to confirm or 'no' to cancel."
  }
}
```

**New File**: `src/intentEmitters/llm/listeners/delete.user.listener.ts`

**Tasks**:
- [x] Create `DeleteUserListener` class
- [ ] Define entity schema in intents table
- [ ] Add intent examples for classification
- [x] Register listener in `llm.listener.register.ts`
- [ ] Add feature flag `llmIntent_user_history_deletion`
- [ ] Write unit tests

**Implementation Notes (2026-02-04)**:
- Created `DeleteUserYesListener` and `DeleteUserNoListener` classes
- Intent codes: `user.history.delete.yes`, `user.history.delete.no`
- Uses button-click confirmation flow (intent code in button payload indicates yes/no)
- Reuses existing `userHistoryDeletionService` for deletion logic
- Reuses `SystemGeneratedMessagesService` for configurable messages

**Tasks**:
- [x] Create `DeleteUserListener` class
- [x] Define entity schema in intents table (via seeder)
- [x] Add intent examples for classification (via seeder)
- [x] Register listener in `llm.listener.register.ts`
- [x] Add feature flag `llmIntent_user_history_delete` (via seeder)
- [ ] Write unit tests

---

### 1.2 Delete Reminder Intent

**Current Implementation**: `src/intentEmitters/intentListeners/medicationReminder/delete.reminder.listener.ts`

**Current Flow**:
```
User: "Delete my reminder" → Dialogflow → Intent: delete_reminder
→ Listener calls DeleteReminderService
→ Service deletes reminder from REAN Care
```

**Entities Required**:
| Entity | Type | Required | Description |
|--------|------|----------|-------------|
| reminderName | string | No | Name of reminder to delete (optional - can list all) |

**Entity Schema**:
```json
{
  "reminderName": {
    "type": "string",
    "required": false,
    "description": "Name of the reminder to delete",
    "followUpQuestion": "Which reminder would you like to delete?"
  }
}
```

**New File**: `src/intentEmitters/llm/listeners/delete.reminder.listener.ts`

**Tasks**:
- [ ] Create `DeleteReminderListener` class
- [ ] Define entity schema
- [ ] Add intent examples
- [ ] Register listener
- [ ] Add feature flag `llmIntent_delete_reminder`
- [ ] Write unit tests

---

## Phase 2: Medium Complexity (Create Reminder, General Reminder)

### 2.1 Create Medication Reminder

**Current Implementation**: `src/intentEmitters/intentListeners/medicationReminder/create.reminder.listener.ts`

**Current Flow**:
```
User: "Remind me to take aspirin at 9am daily"
→ Dialogflow extracts: medicineName, time, dayName
→ Creates reminder via REAN Care API
→ Schedules notification
```

**Entities Required**:
| Entity | Type | Required | Description |
|--------|------|----------|-------------|
| medicineName | string | Yes | Name of the medication |
| time | time | Yes | Time for the reminder |
| dayName | string | No | Day(s) of week (for weekly reminders) |

**Entity Schema**:
```json
{
  "medicineName": {
    "type": "string",
    "required": true,
    "description": "Name of the medication",
    "followUpQuestion": "What medication would you like to be reminded about?"
  },
  "reminderTime": {
    "type": "time",
    "required": true,
    "description": "Time for the reminder (e.g., 9:00 AM, 21:00)",
    "validation": {
      "format": "HH:mm"
    },
    "followUpQuestion": "What time should I remind you?"
  },
  "dayName": {
    "type": "string",
    "required": false,
    "description": "Day(s) of the week for weekly reminders",
    "validation": {
      "enum": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "daily", "weekdays"]
    },
    "followUpQuestion": "Which day(s) should I remind you? (e.g., Monday, daily, weekdays)"
  }
}
```

**New File**: `src/intentEmitters/llm/listeners/create.medication.reminder.listener.ts`

**Tasks**:
- [ ] Create `CreateMedicationReminderListener` class
- [ ] Define entity schema with time parsing
- [ ] Add intent examples (various phrasings)
- [ ] Handle time zone conversion
- [ ] Register listener
- [ ] Add feature flag `llmIntent_create_medication_reminder`
- [ ] Write unit tests

---

### 2.2 General Reminder

**Current Implementation**: `src/intentEmitters/intentListeners/medicationReminder/general.reminder.listener.ts`

**Current Flow**:
```
User: "Remind me about my doctor appointment tomorrow at 3pm"
→ Dialogflow extracts: event, date, time, frequency, dayName
→ Creates reminder via GeneralReminderService
```

**Entities Required**:
| Entity | Type | Required | Description |
|--------|------|----------|-------------|
| event | string | Yes | What to be reminded about |
| date | date | Yes | Date of the reminder |
| time | time | Yes | Time of the reminder |
| frequency | string | No | How often (Once, Daily, Weekly, Monthly) |
| dayName | string | No | Day of week for weekly reminders |

**Entity Schema**:
```json
{
  "eventName": {
    "type": "string",
    "required": true,
    "description": "Event or task to be reminded about",
    "followUpQuestion": "What would you like to be reminded about?"
  },
  "reminderDate": {
    "type": "date",
    "required": true,
    "description": "Date for the reminder",
    "validation": {
      "format": "YYYY-MM-DD",
      "minDate": "today"
    },
    "followUpQuestion": "What date should I remind you?"
  },
  "reminderTime": {
    "type": "time",
    "required": true,
    "description": "Time for the reminder",
    "validation": {
      "format": "HH:mm"
    },
    "followUpQuestion": "What time should I remind you?"
  },
  "frequency": {
    "type": "string",
    "required": false,
    "default": "Once",
    "description": "Reminder frequency",
    "validation": {
      "enum": ["Once", "Daily", "Weekly", "Monthly", "Hourly", "Yearly", "Quarterly", "WeekDays"]
    },
    "followUpQuestion": "How often should I remind you? (Once, Daily, Weekly, Monthly)"
  },
  "dayName": {
    "type": "string",
    "required": false,
    "description": "Day of week for weekly reminders",
    "followUpQuestion": "Which day of the week?"
  }
}
```

**New File**: `src/intentEmitters/llm/listeners/general.reminder.listener.ts`

**Tasks**:
- [ ] Create `GeneralReminderListener` class
- [ ] Define entity schema with date/time parsing
- [ ] Handle relative dates ("tomorrow", "next Monday")
- [ ] Add intent examples
- [ ] Register listener
- [ ] Add feature flag `llmIntent_general_reminder`
- [ ] Write unit tests

---

## Phase 3: Complex Intent (Symptom Assessment)

### 3.1 Symptom Assessment (Keratoplasty Flow) ✅ COMPLETED

**Current Implementation**: `src/intentEmitters/intentListeners/kerotoplasty.bot.condition.Identification.listener.ts`

**Original Flow**:
```
User: Reports symptoms (free text or button)
→ Dialogflow extracts: symptoms array
→ System classifies severity (Emergency/Attention/Normal) based on ADDITIONAL_INFO config
→ Posts to ClickUp for tracking
→ Asks follow-up questions via buttons
```

**Entities Required**:
| Entity | Type | Required | Description |
|--------|------|----------|-------------|
| symptoms | string[] | Yes | Array of symptom strings |
| imageUrl | string | No | Eye image URL for assessment |

**New File**: `src/intentEmitters/llm/listeners/keratoplasty.listener.ts`

**Implementation Notes (2026-02-04)**:

Created 6 listener classes to handle the complete keratoplasty symptom flow.
All intent codes are namespaced with `keratoplasty.*` prefix to allow future symptom flows (e.g., COVID) to have their own namespace.

| Listener Class | Intent Code | Purpose |
|----------------|-------------|---------|
| `KeratoplastySymptomAnalysisListener` | `keratoplasty.symptom.analysis` | Main symptom analysis, severity classification |
| `KeratoplastyMoreSymptomsListener` | `keratoplasty.symptom.more` | Handles "I have more symptoms" button |
| `KeratoplastyFollowupListener` | `keratoplasty.followup` | Handles "That's all" button, shows cached message |
| `KeratoplastyEyeImageListener` | `keratoplasty.eye.image` | Handles eye image submission |
| `KeratoplastyResponseNoListener` | `keratoplasty.response.no` | Handles negative responses |
| `KeratoplastyResponseYesListener` | `keratoplasty.response.yes` | Handles affirmative responses |

**Key Features**:
- Severity classification based on `ADDITIONAL_INFO.RISK_CLASSIFICATION` config
- Priority levels: 1 (Emergency), 2 (Attention Needed), 3 (Normal)
- Cache-based symptom accumulation across multiple turns
- Async ClickUp posting (fire and forget)
- Button-based follow-up flow
- Compatible with existing `kerotoplastyService`

**Flow Diagram**:
```
User reports symptoms
    │
    ▼
KeratoplastySymptomAnalysisListener (keratoplasty.symptom.analysis)
    │
    ├── Priority 1 (Emergency) → Ask for image
    │   └── Buttons: "Yes, I can provide an image" | "No"
    │
    └── Priority 2-3 (Non-emergency) → Ask for more symptoms
        └── Buttons: "Yes, I have more symptoms" | "No, that's all"
            │
            ├── "More symptoms" → KeratoplastyMoreSymptomsListener → Re-prompt
            │
            └── "That's all" → KeratoplastyFollowupListener
                └── Ask for image
                    │
                    ├── "Yes" → KeratoplastyEyeImageListener → Process image
                    │   └── Ask about medications
                    │       ├── "Yes" → KeratoplastyResponseYesListener
                    │       └── "No" → KeratoplastyResponseNoListener
                    │
                    └── "No" → KeratoplastyResponseNoListener → End
```

**Tasks**:
- [x] Create `KeratoplastySymptomAnalysisListener` class
- [x] Migrate symptom classification logic
- [x] Handle symptom caching across turns
- [x] Integrate with existing kerotoplastyService
- [x] Create follow-up button handlers
- [x] Register all listeners
- [x] Add database entries (via seeder)
- [x] Add feature flags `llmIntent_keratoplasty_flow` (via seeder)
- [ ] Write unit tests

---

### 3.2 Symptom Assessment (COVID) - Future

**Current Implementation**: `src/intentEmitters/intentListeners/symptom.listener.ts`

**Status**: Not yet migrated

**Current Flow**:
```
User: Triggers symptom assessment
→ Dialogflow collects: age, exposure, symptoms, livingCondition, healthcare, conditions
→ Complex decision tree generates health recommendations
```

**Entities Required**:
| Entity | Type | Required | Description |
|--------|------|----------|-------------|
| age | number | Yes | User's age |
| exposure | string | Yes | COVID exposure (yes/no) |
| symptoms | array | Yes | List of symptoms (Primary/Secondary) |
| livingCondition | string | Yes | Lives in care facility (yes/no) |
| healthcare | string | Yes | Is healthcare worker (yes/no) |
| conditions | array | No | Pre-existing conditions |

**New File**: `src/intentEmitters/llm/listeners/covid.symptom.assessment.listener.ts` (To be created)

**Tasks**:
- [ ] Create `CovidSymptomAssessmentListener` class
- [ ] Migrate symptom classification logic
- [ ] Define entity schema
- [ ] Handle symptom categorization (Primary vs Secondary)
- [ ] Add intent examples
- [ ] Register listener
- [ ] Add feature flag `llmIntent_covid_symptom_assessment`
- [ ] Write unit tests for decision tree

---

## Implementation Order

### Week 1: Simple Intents
1. **Day 1-2**: Delete User Intent
   - Create listener
   - Configure intent
   - Write tests
   - Enable feature flag for testing

2. **Day 3-4**: Delete Reminder Intent
   - Create listener
   - Configure intent
   - Write tests

### Week 2: Medium Complexity
3. **Day 1-3**: Create Medication Reminder
   - Create listener with time parsing
   - Handle scheduling logic
   - Write tests

4. **Day 4-5**: General Reminder
   - Create listener
   - Handle date/time/frequency combinations
   - Write tests

### Week 3: Complex Intent
5. **Day 1-4**: Symptom Assessment
   - Create listener
   - Migrate decision tree logic
   - Handle multi-select symptoms
   - Write comprehensive tests

---

## Database Updates

### Schema Changes (2026-02-05)

**New Columns on `intents` table:**

| Column | Type | Description |
|--------|------|-------------|
| `responseType` | ENUM('static', 'listener', 'hybrid') | How to process this intent |
| `staticResponse` | JSON | Static response config (message + buttons) |

**Migration:** `20260205000001-add-intent-response-config.js`

**UUID Migration:** `20260205000002-fix-intents-id-to-uuid.js` - Converts `intents.id` from INT to VARCHAR(36) for UUID support

### Database Files Created

| File | Type | Purpose |
|------|------|---------|
| `src/database/migrations/20260205000001-add-intent-response-config.js` | Migration | Adds responseType and staticResponse columns |
| `src/database/migrations/20260205000002-fix-intents-id-to-uuid.js` | Migration | Converts intents.id to UUID |
| `src/database/seeders/20260205000002-llm-intent-entries.js` | Seeder | Inserts intents and intent_listeners entries |
| `src/database/seeders/20260205000003-llm-intent-feature-flags.js` | Seeder | Inserts feature flags for gradual rollout |

### Running Migrations and Seeders

```bash
# Run migrations
npx sequelize-cli db:migrate

# Run specific seeders
npx sequelize-cli db:seed --seed 20260205000002-llm-intent-entries.js
npx sequelize-cli db:seed --seed 20260205000003-llm-intent-feature-flags.js
```

### Intent Entries Created

#### Static Intents (No listener required)

| Intent Code | Name | Response Type | Description |
|-------------|------|---------------|-------------|
| `default.welcome` | Default Welcome | static | Welcome message with buttons |
| `faq.general` | FAQ General | static | General FAQ response |
| `user.history.delete.confirm` | Delete User Confirmation | static | Confirmation prompt with yes/no buttons |

#### Listener Intents (Business logic required)

| Intent Code | Name | Category |
|-------------|------|----------|
| `keratoplasty.symptom.analysis` | Keratoplasty Symptom Analysis | keratoplasty |
| `keratoplasty.symptom.more` | Keratoplasty More Symptoms | keratoplasty |
| `keratoplasty.followup` | Keratoplasty Followup | keratoplasty |
| `keratoplasty.eye.image` | Keratoplasty Eye Image | keratoplasty |
| `keratoplasty.response.no` | Keratoplasty Response No | keratoplasty |
| `keratoplasty.response.yes` | Keratoplasty Response Yes | keratoplasty |
| `user.history.delete.yes` | Delete User Confirm Yes | user_management |
| `user.history.delete.no` | Delete User Confirm No | user_management |

### Feature Flags Created

| Flag Name | Description | Default |
|-----------|-------------|---------|
| `llmIntentResponseEnabled` | Master flag: Enable database-driven intent responses | disabled |
| `llmIntent_default_welcome` | Enable LLM-native welcome intent | disabled |
| `llmIntent_faq_general` | Enable LLM-native FAQ intent | disabled |
| `llmIntent_keratoplasty_flow` | Enable all keratoplasty symptom flow intents | disabled |
| `llmIntent_user_delete_flow` | Enable LLM-native user data deletion flow | disabled |

### Legacy Intent Configuration SQL (Reference)

```sql
-- Delete User Intent
UPDATE intents SET
    llmEnabled = true,
    llmProvider = 'openai',
    intentDescription = 'User wants to delete their chat history and personal data from the system',
    intentExamples = '["delete my data", "remove my account", "erase my history", "delete everything about me", "I want to delete my profile"]',
    entitySchema = '{"userConfirmation": {"type": "string", "required": true, "description": "User confirmation yes/no"}}',
    conversationConfig = '{"maxTurns": 3, "timeoutMinutes": 5}',
    confidenceThreshold = 0.80,
    active = true
WHERE code = 'user_history_deletion';

-- Create Medication Reminder
UPDATE intents SET
    llmEnabled = true,
    llmProvider = 'openai',
    intentDescription = 'User wants to set up a medication reminder',
    intentExamples = '["remind me to take my medicine", "set a medication reminder", "I need a pill reminder", "remind me about aspirin at 9am", "medication reminder for tomorrow"]',
    entitySchema = '{"medicineName": {"type": "string", "required": true}, "reminderTime": {"type": "time", "required": true}, "dayName": {"type": "string", "required": false}}',
    conversationConfig = '{"maxTurns": 5, "timeoutMinutes": 10}',
    confidenceThreshold = 0.75,
    active = true
WHERE code = 'M_Medication_Registration';

-- General Reminder
UPDATE intents SET
    llmEnabled = true,
    llmProvider = 'openai',
    intentDescription = 'User wants to set a general reminder for an event or task',
    intentExamples = '["remind me about my appointment", "set a reminder for tomorrow", "I need a reminder", "remind me to call doctor at 3pm", "create a reminder"]',
    entitySchema = '{"eventName": {"type": "string", "required": true}, "reminderDate": {"type": "date", "required": true}, "reminderTime": {"type": "time", "required": true}, "frequency": {"type": "string", "required": false}}',
    conversationConfig = '{"maxTurns": 6, "timeoutMinutes": 10}',
    confidenceThreshold = 0.75,
    active = true
WHERE code = 'General_Reminder_Add';

-- Symptom Assessment
UPDATE intents SET
    llmEnabled = true,
    llmProvider = 'openai',
    intentDescription = 'User wants to check COVID-19 symptoms and get health recommendations',
    intentExamples = '["I have symptoms", "check my symptoms", "COVID symptom checker", "am I sick", "I feel unwell", "symptom assessment"]',
    entitySchema = '{"age": {"type": "number", "required": true}, "covidExposure": {"type": "string", "required": true}, "symptoms": {"type": "array", "required": true}, "livesInCareFacility": {"type": "string", "required": true}, "isHealthcareWorker": {"type": "string", "required": true}, "preExistingConditions": {"type": "array", "required": false}}',
    conversationConfig = '{"maxTurns": 8, "timeoutMinutes": 15}',
    confidenceThreshold = 0.80,
    active = true
WHERE code = 'symptom_assessment';
```

### Feature Flags SQL

```sql
INSERT INTO feature_flags (flagName, description, enabled, rolloutPercentage, targetEnvironments) VALUES
('llmIntent_user_history_deletion', 'Enable LLM for delete user intent', false, 0, '["development"]'),
('llmIntent_delete_reminder', 'Enable LLM for delete reminder intent', false, 0, '["development"]'),
('llmIntent_create_medication_reminder', 'Enable LLM for create medication reminder', false, 0, '["development"]'),
('llmIntent_general_reminder', 'Enable LLM for general reminder intent', false, 0, '["development"]'),
('llmIntent_symptom_assessment', 'Enable LLM for symptom assessment', false, 0, '["development"]');
```

---

## File Structure

```
src/
├── services/llm/
│   ├── intent.response.service.ts  # ✅ NEW - Routes based on responseType (static/listener/hybrid)
│   └── ...
├── database/repositories/intent/
│   ├── intent.listeners.repo.ts    # ✅ NEW - Repository for intent_listeners table
│   └── ...
└── intentEmitters/llm/
    ├── base.llm.listener.ts           # Existing
    ├── llm.intent.registry.ts         # Existing
    ├── llm.listener.register.ts       # Existing - Updated with new listeners
    └── listeners/
        ├── blood.glucose.listener.ts  # Existing (example)
        ├── delete.user.listener.ts    # ✅ CREATED - DeleteUserYesListener, DeleteUserNoListener
        ├── keratoplasty.listener.ts   # ✅ CREATED - 6 listeners for keratoplasty flow
        ├── delete.reminder.listener.ts # Pending
        ├── create.medication.reminder.listener.ts # Pending
        ├── general.reminder.listener.ts # Pending
        └── covid.symptom.listener.ts  # Pending (future - separate namespace)
```

### New Services (2026-02-05)

**IntentResponseService** (`src/services/llm/intent.response.service.ts`):
- Routes intent processing based on `responseType` column
- Handles static responses directly from database
- Delegates to listeners for business logic
- Supports hybrid mode (return response + trigger async processing)

### Naming Convention

Intent codes follow a **namespace.action** pattern:
- `keratoplasty.*` - Keratoplasty eye care symptom flow
- `covid.*` - COVID symptom assessment (future)
- `user.history.*` - User data management
- `blood.glucose.*` - Blood glucose biometrics

This allows different symptom flows to coexist without collision.

### Completed Files Detail

**delete.user.listener.ts**:
- `DeleteUserYesListener` (intent: `user.history.delete.yes`)
- `DeleteUserNoListener` (intent: `user.history.delete.no`)

**keratoplasty.listener.ts**:
- `KeratoplastySymptomAnalysisListener` (intent: `keratoplasty.symptom.analysis`)
- `KeratoplastyMoreSymptomsListener` (intent: `keratoplasty.symptom.more`)
- `KeratoplastyFollowupListener` (intent: `keratoplasty.followup`)
- `KeratoplastyEyeImageListener` (intent: `keratoplasty.eye.image`)
- `KeratoplastyResponseNoListener` (intent: `keratoplasty.response.no`)
- `KeratoplastyResponseYesListener` (intent: `keratoplasty.response.yes`)

---

## Testing Strategy

### Unit Tests
- Test each listener in isolation
- Mock external services (NeedleService, etc.)
- Test entity extraction
- Test validation logic
- Test error handling

### Integration Tests
- Test full flow with entity collection
- Test multi-turn conversations
- Test fallback to Dialogflow

### Manual Testing Checklist
- [ ] Delete user flow works with confirmation
- [ ] Medication reminder creates correctly
- [ ] General reminder with various frequencies
- [ ] Symptom assessment generates correct recommendations
- [ ] Fallback works when LLM fails

---

## Rollout Plan

1. **Development**: Enable all flags, test thoroughly
2. **Staging**: Enable flags, run smoke tests
3. **Production**: Gradual rollout
   - 10% → Monitor for 24h
   - 50% → Monitor for 48h
   - 100% → Full rollout

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Intent Classification Accuracy | > 90% |
| Entity Extraction Accuracy | > 85% |
| Fallback Rate | < 15% |
| User Completion Rate | > 80% |
| Average Response Time | < 3s |

---

## Open Questions

1. Should we migrate all reminder types together or one at a time?
2. Do we need to update the symptom decision tree logic or keep it as-is?
3. What's the expected volume for these intents?

---

## Next Steps

1. Review and approve this plan
2. Start with Delete User intent (simplest)
3. Iterate through remaining intents
4. Enable feature flags incrementally

---

**Document Version**: 1.0
**Author**: Development Team
**Status**: Awaiting Review
