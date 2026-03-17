# Simple Symptom Assessment Flow - Dialogflow Integration

**Purpose:** Map the simplest possible conversation flow using Dialogflow migrated intents
**Date:** 2026-03-13
**Status:** Planning/Documentation Only - NO CODE CHANGES

---

## Flow Overview

This document maps a simplified symptom assessment flow that uses the existing Dialogflow migrated intents with minimal listener implementation.

---

## Conversation Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ USER: "I have pain in my eye"                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ INTENT CLASSIFIED: conditionIdentification              │
│                                                         │
│ ENTITY COLLECTION:                                      │
│ • Bot: "Did your eye experience vision loss?"          │
│ • User: "yes"                                           │
│ • → complexDropInVision = ["yes"]                       │
│                                                         │
│ • Bot: "Have you been experiencing severe pain?"        │
│ • User: "yes"                                           │
│ • → complexSeverePain = ["yes"]                         │
│                                                         │
│ (complexNormalSymptoms optional, skipped if not needed) │
│ (medicalRecordNumber optional, collected if needed)     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ LISTENER: ConditionIdentificationListener               │
│                                                         │
│ LOGIC:                                                  │
│ 1. Extract all entity arrays                           │
│ 2. Classify risk based on symptoms                     │
│ 3. Determine priority level (1=emergency, 2=urgent,    │
│    3=normal)                                            │
│ 4. Show appropriate message                            │
│ 5. Return buttons                                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ BOT RESPONSE:                                           │
│                                                         │
│ "Thank you for sharing your symptoms. Based on what    │
│  you've told me, you have severe pain and vision loss. │
│  This requires immediate attention.                     │
│                                                         │
│  Would you like to report any other symptoms?"         │
│                                                         │
│  [Yes, More Symptoms] [No, that's all]"                │
└─────────────────────────────────────────────────────────┘
                        ↓
                   ┌────┴────┐
                   │         │
          ┌────────▼──┐   ┌──▼──────────┐
          │  User     │   │  User       │
          │  clicks   │   │  clicks     │
          │  "Yes"    │   │  "No"       │
          └────┬──────┘   └──┬──────────┘
               │             │
               │             │
┌──────────────▼──────────────────┐   ┌──▼─────────────────────────────┐
│ INTENT: MoreSymptoms            │   │ INTENT: KerotoplastyFollowUp   │
│                                 │   │                                │
│ ENTITY COLLECTION:              │   │ NO ENTITY COLLECTION           │
│ • Bot: "Please mention your     │   │                                │
│   other symptom"                │   │ LISTENER:                      │
│ • User: "redness and swelling"  │   │ KerotoplastyFollowUpListener   │
│ • → symptoms = ["redness",      │   │                                │
│     "swelling"]                 │   │ LOGIC:                         │
│                                 │   │ • Retrieve cached priority     │
│ LISTENER:                       │   │ • Show final message           │
│ MoreSymptomsListener            │   │ • Ask for eye image            │
│                                 │   │                                │
│ LOGIC:                          │   └────┬───────────────────────────┘
│ 1. Get new symptoms array       │        │
│ 2. OVERRIDE priority to HIGH    │        │
│    (user reported more = worse) │        │
│ 3. Update cache with new data   │        │
│ 4. Show message                 │        │
│ 5. Go to followup automatically │        │
└─────────────────┬───────────────┘        │
                  │                        │
                  │ (automatic transition) │
                  └──────────┬─────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│ BOT RESPONSE:                                           │
│                                                         │
│ "Thank you. Your symptoms require immediate attention.  │
│  Please share a photo of your operated eye so our       │
│  experts can review and guide you further."             │
│                                                         │
│  [Send Photo] [Skip Photo]                             │
└─────────────────────────────────────────────────────────┘
                        ↓
                   ┌────┴────┐
                   │         │
          ┌────────▼──┐   ┌──▼──────────┐
          │  User     │   │  User       │
          │  sends    │   │  clicks     │
          │  photo    │   │  "Skip"     │
          └────┬──────┘   └──┬──────────┘
               │             │
               │             │
┌──────────────▼──────────────────┐   ┌──▼─────────────────────────────┐
│ INTENT: eyeImage                │   │ INTENT: responseNo             │
│                                 │   │                                │
│ ENTITY COLLECTION:              │   │ NO ENTITY COLLECTION           │
│ • imageUrl detected from photo  │   │                                │
│ • medicalRecordNumber asked if  │   │ LISTENER:                      │
│   not already collected         │   │ ResponseNoListener             │
│                                 │   │                                │
│ LISTENER:                       │   │ LOGIC:                         │
│ EyeImageListener                │   │ • Clear cache                  │
│                                 │   │ • End conversation             │
│ LOGIC:                          │   │ • Show help message            │
│ 1. Get imageUrl                 │   │                                │
│ 2. Get medicalRecordNumber      │   └────────────────────────────────┘
│ 3. Post to external system      │
│    (ClickUp/backend service)    │
│ 4. Show confirmation            │
│ 5. Ask medication question      │
└─────────────────┬───────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│ BOT RESPONSE:                                           │
│                                                         │
│ "Thank you for sharing the photo. Your case has been   │
│  sent to our medical team (Case #12345).                │
│                                                         │
│  Are you taking your prescribed medications regularly?" │
│                                                         │
│  [Yes] [No]                                             │
└─────────────────────────────────────────────────────────┘
                        ↓
                   ┌────┴────┐
                   │         │
          ┌────────▼──┐   ┌──▼──────────┐
          │  User     │   │  User       │
          │  clicks   │   │  clicks     │
          │  "Yes"    │   │  "No"       │
          └────┬──────┘   └──┬──────────┘
               │             │
┌──────────────▼──────────────────┐   ┌──▼─────────────────────────────┐
│ INTENT: responseYes             │   │ INTENT: responseNo             │
│                                 │   │                                │
│ LISTENER:                       │   │ LISTENER:                      │
│ ResponseYesListener             │   │ ResponseNoListener             │
│                                 │   │                                │
│ LOGIC:                          │   │ LOGIC:                         │
│ • Clear cache                   │   │ • Clear cache                  │
│ • Show encouragement message    │   │ • Show reminder message        │
│ • End conversation              │   │ • Show helpline number         │
│                                 │   │ • End conversation             │
└─────────────────────────────────┘   └────────────────────────────────┘
```

---

## Intent-to-Listener Mapping

### Required Listeners (5 Total)

| # | Intent Code | Listener Class | Purpose | Entities Collected |
|---|-------------|----------------|---------|-------------------|
| 1 | `conditionIdentification` | ConditionIdentificationListener | Main entry point - collect symptoms and assess risk | `complexDropInVision`, `complexSeverePain`, `complexNormalSymptoms` (arrays) |
| 2 | `MoreSymptoms` | MoreSymptomsListener | User wants to add more symptoms - OVERRIDE to high priority | `symptoms` (array) |
| 3 | `KerotoplastyFollowUp` | KerotoplastyFollowUpListener | User finished reporting symptoms - request eye photo | None |
| 4 | `eyeImage` | EyeImageListener | Process eye photo submission | `imageUrl`, `medicalRecordNumber` (arrays) |
| 5 | `responseYes` / `responseNo` | ResponseYesListener / ResponseNoListener | Final confirmation responses | None |

**Note:** We reuse the Dialogflow intent codes exactly as they are in the migration.

---

## Simplified Implementation Strategy

### Step 1: Entity Collection (Automatic)

The system automatically handles multi-turn entity collection based on `entitySchema` in the intent.

**For `conditionIdentification`:**
```json
{
  "complexDropInVision": {
    "type": "array",
    "required": true,
    "followUpQuestion": "Did your operative eye experience any vision loss?"
  },
  "complexSeverePain": {
    "type": "array",
    "required": true,
    "followUpQuestion": "Have you been experiencing severe pain in your operative eye?"
  }
}
```

**Process:**
1. User says: "I have pain"
2. Bot asks: "Did your operative eye experience any vision loss?"
3. User says: "yes"
4. Bot asks: "Have you been experiencing severe pain in your operative eye?"
5. User says: "yes"
6. **All required entities collected → Listener is called**

### Step 2: Risk Assessment Logic (In Listener)

**Simple Risk Classification:**

```typescript
// Pseudo-code for ConditionIdentificationListener

function assessRisk(entities) {
    const hasSeverePain = entities.complexSeverePain?.length > 0;
    const hasVisionLoss = entities.complexDropInVision?.length > 0;

    if (hasSeverePain && hasVisionLoss) {
        return { priority: 1, level: 'EMERGENCY' }; // Red flag
    } else if (hasSeverePain || hasVisionLoss) {
        return { priority: 2, level: 'URGENT' }; // Yellow flag
    } else {
        return { priority: 3, level: 'NORMAL' }; // Green flag
    }
}
```

### Step 3: Cache the Risk Level

**Why Cache?**
- Need to remember the priority when user clicks buttons
- MoreSymptomsListener needs to know the previous priority
- KerotoplastyFollowUpListener needs to show the final assessment

**Cache Key:** `SymptomAssessment:{userId}`

**Cache Data:**
```json
{
  "priority": 1,
  "level": "EMERGENCY",
  "symptoms": ["severe pain", "vision loss"],
  "timestamp": "2026-03-13T10:30:00Z"
}
```

### Step 4: Return Buttons Based on Priority

**In ConditionIdentificationListener:**

```typescript
function getFollowUpButtons(priority) {
    return [
        { text: 'Yes, More Symptoms', type: 'intent', value: 'MoreSymptoms' },
        { text: 'No, that\'s all', type: 'intent', value: 'KerotoplastyFollowUp' }
    ];
}
```

**Always show the same buttons** - simplicity is key.

### Step 5: Override Priority on "More Symptoms"

**Key Insight:** If user wants to report MORE symptoms after initial assessment, it usually means the situation is worse than initially stated.

**In MoreSymptomsListener:**

```typescript
function handle(event) {
    // Get new symptoms
    const newSymptoms = event.entities.symptoms.value || [];

    // ALWAYS override to HIGH priority
    const priority = 1; // Emergency - user reported additional symptoms

    // Update cache
    cache.set(`SymptomAssessment:${userId}`, {
        priority: 1,
        level: 'EMERGENCY',
        symptoms: [...oldSymptoms, ...newSymptoms],
        overridden: true
    });

    // Automatically transition to followup (ask for photo)
    // This can be done by returning a button or auto-triggering
}
```

**Rationale:** Simplifies logic - any additional symptoms = needs urgent attention.

### Step 6: Ask for Photo in KerotoplastyFollowUp

**In KerotoplastyFollowUpListener:**

```typescript
function handle(event) {
    // Retrieve cached assessment
    const cached = cache.get(`SymptomAssessment:${userId}`);

    // Show final message based on priority
    const message = getMessageForPriority(cached.priority);

    return {
        success: true,
        message: message + "\n\n📸 Please share a photo of your operated eye.",
        data: {
            followUpButtons: [
                { text: 'Send Photo', type: 'intent', value: 'eyeImage' },
                { text: 'Skip Photo', type: 'intent', value: 'responseNo' }
            ]
        }
    };
}
```

### Step 7: Process Photo and Ask Medication Question

**In EyeImageListener:**

```typescript
function handle(event) {
    const imageUrl = event.entities.imageUrl.value;
    const medicalRecordNumber = event.entities.medicalRecordNumber?.value;

    // Post to external system (ClickUp, backend API, etc.)
    await postToExternalSystem({
        userId: event.userId,
        imageUrl,
        medicalRecordNumber,
        symptoms: cached.symptoms,
        priority: cached.priority
    });

    return {
        success: true,
        message: "Thank you! Your case has been sent to our medical team.\n\nAre you taking your prescribed medications regularly?",
        data: {
            followUpButtons: [
                { text: 'Yes', type: 'intent', value: 'responseYes' },
                { text: 'No', type: 'intent', value: 'responseNo' }
            ]
        }
    };
}
```

### Step 8: End Conversation

**In ResponseYesListener:**
```typescript
function handle(event) {
    cache.delete(`SymptomAssessment:${userId}`);

    return {
        success: true,
        message: "Great! Continue taking your medications as prescribed. If symptoms worsen, contact us immediately at 1800-200-2211."
    };
}
```

**In ResponseNoListener:**
```typescript
function handle(event) {
    cache.delete(`SymptomAssessment:${userId}`);

    return {
        success: true,
        message: "Please start taking your medications as prescribed. If you have concerns, call our helpline at 1800-200-2211."
    };
}
```

---

## Data Flow Summary

### 1. Initial Contact
- **User Input:** "I have pain in my eye"
- **Intent:** `conditionIdentification`
- **Entities Collected:** `complexDropInVision`, `complexSeverePain`
- **Output:** Risk assessment + buttons

### 2. More Symptoms Branch (Optional)
- **User Input:** Clicks "Yes, More Symptoms"
- **Intent:** `MoreSymptoms`
- **Entities Collected:** `symptoms` array
- **Output:** **Priority overridden to 1 (Emergency)** + auto-transition to followup

### 3. Followup (Photo Request)
- **User Input:** Clicks "No, that's all" OR auto-triggered after MoreSymptoms
- **Intent:** `KerotoplastyFollowUp`
- **Entities Collected:** None
- **Output:** Final message + photo request buttons

### 4. Photo Submission
- **User Input:** Sends photo OR clicks "Skip Photo"
- **Intent:** `eyeImage` OR `responseNo`
- **Entities Collected:** `imageUrl`, `medicalRecordNumber` (for eyeImage)
- **Output:** Confirmation + medication question

### 5. Medication Confirmation
- **User Input:** Clicks "Yes" or "No"
- **Intent:** `responseYes` OR `responseNo`
- **Entities Collected:** None
- **Output:** Final message + end conversation + clear cache

---

## Database Changes Required

### Change 1: Update responseYes/responseNo to Listener Type

**Current State:**
```sql
SELECT code, responseType FROM intents WHERE code IN ('responseYes', 'responseNo');
-- responseYes  | static
-- responseNo   | static
```

**Required Change:**
```sql
UPDATE intents
SET responseType = 'listener', staticResponse = NULL
WHERE code IN ('responseYes', 'responseNo');
```

**Reason:** We need to execute logic (clear cache, show custom messages), not just return static text.

### Change 2: Verify Entity Schemas

**No changes needed** - use the existing Dialogflow entity schemas as-is:

- `conditionIdentification`: Has `complexDropInVision`, `complexSeverePain`, `complexNormalSymptoms`, `medicalRecordNumber`
- `MoreSymptoms`: Has `symptoms`
- `eyeImage`: Has `imageUrl`, `medicalRecordNumber`, `complexSeverePain`, `complexNormalSymptoms`
- Others: No entities

---

## Conversation Examples

### Example 1: Emergency Case with Additional Symptoms

```
User: "I have pain in my eye"
Bot: "Did your operative eye experience any vision loss?"

User: "yes"
Bot: "Have you been experiencing severe pain in your operative eye?"

User: "yes"
Bot: "Thank you for sharing. You have severe pain and vision loss - this requires immediate attention.

     Would you like to report any other symptoms?
     [Yes, More Symptoms] [No, that's all]"

User: [Clicks "Yes, More Symptoms"]
Bot: "Please mention your other symptom."

User: "redness and swelling"
Bot: "Thank you. Based on all your symptoms, this requires immediate medical attention.

     📸 Please share a photo of your operated eye.
     [Send Photo] [Skip Photo]"

User: [Sends photo]
Bot: "Could you kindly provide us with your medical record number?"

User: "P123456"
Bot: "Thank you! Your case has been sent to our medical team (Priority: EMERGENCY).

     Are you taking your prescribed medications regularly?
     [Yes] [No]"

User: [Clicks "Yes"]
Bot: "Great! Continue taking your medications. If symptoms worsen, contact us immediately at 1800-200-2211."
```

### Example 2: Normal Case, No Additional Symptoms

```
User: "slight redness"
Bot: "Did your operative eye experience any vision loss?"

User: "no"
Bot: "Have you been experiencing severe pain in your operative eye?"

User: "no"
Bot: "Thank you. These symptoms are common post-operative occurrences. Continue your prescribed care.

     Would you like to report any other symptoms?
     [Yes, More Symptoms] [No, that's all]"

User: [Clicks "No, that's all"]
Bot: "These symptoms are common. Continue your prescribed care.

     📸 Please share a photo of your operated eye for our experts to review.
     [Send Photo] [Skip Photo]"

User: [Clicks "Skip Photo"]
Bot: "I understand. If symptoms worsen, please contact our helpline at 1800-200-2211."
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Verify all Dialogflow intents exist in database:
  - `conditionIdentification`
  - `MoreSymptoms`
  - `KerotoplastyFollowUp`
  - `eyeImage`
  - `responseYes`
  - `responseNo`

- [ ] Update `responseYes` and `responseNo` to listener type
- [ ] Verify entity schemas match expected format
- [ ] Verify feature flags are enabled for all intents

### Listener Implementation
- [ ] Create `ConditionIdentificationListener`
  - Extract complex entities
  - Assess risk (priority 1-3)
  - Cache assessment
  - Return buttons

- [ ] Create `MoreSymptomsListener`
  - Extract symptoms array
  - **Override priority to 1**
  - Update cache
  - Auto-transition to followup OR return followup message

- [ ] Create `KerotoplastyFollowUpListener`
  - Retrieve cached assessment
  - Show final message
  - Ask for photo

- [ ] Create `EyeImageListener`
  - Extract imageUrl and medicalRecordNumber
  - Post to external system
  - Ask medication question

- [ ] Create `ResponseYesListener`
  - Clear cache
  - Show encouragement message

- [ ] Create `ResponseNoListener`
  - Clear cache
  - Show reminder/help message

### Testing
- [ ] Test full flow: symptoms → more symptoms → photo → medication
- [ ] Test skip photo branch
- [ ] Test normal symptoms (no emergency)
- [ ] Test emergency symptoms
- [ ] Test yes/no entity extraction in conditionIdentification
- [ ] Verify cache is cleared on conversation end
- [ ] Verify external system receives data
- [ ] Test with real users

---

## Key Simplifications

1. **Use Dialogflow Intent Codes Directly** - No new intent creation needed
2. **Simple Risk Logic** - Just check for severe pain + vision loss
3. **Override on More Symptoms** - Always priority 1 if they report more
4. **Same Buttons for All** - Don't complicate button logic
5. **Linear Flow** - No complex branching, just forward progression
6. **Cache is Temporary** - Clear on end, no permanent storage
7. **5 Listeners Only** - Minimal implementation

---

## Summary

This approach uses the **existing Dialogflow migrated intents** with a **minimal listener implementation** that:

✅ Reuses all Dialogflow intent codes (no new intents)
✅ Uses existing entity schemas (no schema changes)
✅ Implements simple risk assessment (3 priority levels)
✅ Overrides priority when user reports more symptoms
✅ Follows a linear conversation flow (easy to understand)
✅ Caches only what's needed for multi-turn context
✅ Requires only 5 listener classes

**This is the simplest path forward that leverages the Dialogflow migration work.**
