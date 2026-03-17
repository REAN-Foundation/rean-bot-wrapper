# Simplified Symptom Flow - Deployment Documentation

**Date**: 2026-03-16
**Status**: ✅ Successfully Deployed

## Overview

This folder contains all documentation related to the simplified symptom flow implementation that replaces the complex Dialogflow entity collection system with a streamlined linear conversation.

## Key Documents

1. **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Complete deployment summary with testing procedures and verification checklist
2. **[SIMPLIFIED_SYMPTOM_FLOW_IMPLEMENTATION.md](./SIMPLIFIED_SYMPTOM_FLOW_IMPLEMENTATION.md)** - Detailed implementation plan with technical specifications
3. **[SIMPLE_SYMPTOM_FLOW_MAPPING.md](./SIMPLE_SYMPTOM_FLOW_MAPPING.md)** - Original flow mapping and design

## Quick Start

### Deploy the Simplified Flow

```bash
node scripts/simplified-symptom-flow.js deploy
```

This will:
- Clean up any existing simplified flow intents
- Create 7 new intents (reportSymptoms, symptomAnalysis, provideImageYes/No, eyeImage, medicationYes/No)
- Disable old Dialogflow intents
- Run the seeder to create listener mappings
- Verify all changes

### Rollback to Old Flow

```bash
node scripts/simplified-symptom-flow.js rollback
```

This will:
- Re-enable old Dialogflow intents
- Disable new simplified intents
- Remove new listeners
- Restore old listener mappings

## After Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Restart the application:**
   ```bash
   npm run start
   ```

3. **Test the flow:**
   - Send "Hello" to get welcome message with buttons
   - Click "Report Symptoms" and follow the flow

## Architecture

### New Intents (7 total)

| Intent Code | Purpose |
|------------|---------|
| `reportSymptoms` | Entry point for symptom reporting |
| `symptomAnalysis` | Risk assessment and symptom classification |
| `provideImageYes` | User agrees to provide image |
| `provideImageNo` | User declines to provide image |
| `eyeImage` | Processes image submission |
| `medicationYes` | Confirms medication adherence |
| `medicationNo` | Reports non-adherence |

### Listeners

All listeners are in: `src/intentEmitters/llm/listeners/simplified.symptom.listener.ts`

- `ReportSymptomsListener`
- `SymptomAnalysisListener`
- `ProvideImageYesListener`
- `ProvideImageNoListener`
- `SimplifiedEyeImageListener`
- `MedicationYesListener`
- `MedicationNoListener`

### Key Features

- **Reuses Existing Infrastructure**: Leverages `kerotoplasty.service.ts` methods
- **Risk Classification**: Config-driven symptom severity assessment
- **ClickUp Integration**: Async task creation and image uploads
- **Cache Management**: Stores conversation state using `SymptomsStorage:${userId}`
- **Linear Flow**: Simple step-by-step progression

## Conversation Flow

```
User: Hello
Bot:  Welcome! [Ask Questions] [Report Symptoms] [Find Nearest Location]

User: [Clicks "Report Symptoms"]
Bot:  Please describe the symptoms you are experiencing...

User: I have pain and redness
Bot:  [Risk assessment message]
      Would you be able to provide an image?
      [Yes] [No]

User: [Clicks "Yes"]
Bot:  Please send a clear photo of your operated eye...

User: [Sends image]
Bot:  We've successfully received your photo.
      Are you taking your prescribed medications regularly?
      [Yes] [No]

User: [Clicks "Yes"]
Bot:  That's great! Consistent medication is important for recovery...
```

## Files Modified/Created

### Created Files:
- `src/intentEmitters/llm/listeners/simplified.symptom.listener.ts`
- `src/database/seeders/20260316120000-simplified-symptom-listeners.js`
- `scripts/simplified-symptom-flow.js` (consolidated deployment script)

### Modified Files:
- `src/intentEmitters/llm/llm.listener.register.ts` (added 7 new listeners)

## Support

For issues or questions, refer to:
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Full deployment details and troubleshooting
- [SIMPLIFIED_SYMPTOM_FLOW_IMPLEMENTATION.md](./SIMPLIFIED_SYMPTOM_FLOW_IMPLEMENTATION.md) - Technical implementation details

## Production Deployment

Before deploying to production:
1. ✅ Test thoroughly on staging
2. ✅ Backup production database
3. ✅ Run `node scripts/simplified-symptom-flow.js deploy`
4. ✅ Monitor logs for first 24 hours
5. ✅ Keep rollback script ready

---

**Deployed By**: Automated Script
**Version**: 1.0
**Last Updated**: 2026-03-16
