# Share Bot CTA-URL Button on Positive Feedback — Design & Implementation Plan

**Date:** 2026-07-22
**Branch:** `lovematters_share_bot`
**Status:** Draft — awaiting review

## Goal

When a user gives positive feedback, we currently send them a plain **text** message
(the `POSITIVE_FEEDBACK_MESSAGE` system-generated message). We want to optionally attach
a **"Share Bot" CTA-URL button** underneath that message. Tapping the button opens a URL
(a deep link to the bot) so the user can share/forward the bot to others.

To store the button (and room for an image), we add a new table
`system_generated_messages_metadata` linked to a system message. If a metadata row exists
and is active, the positive-feedback message is sent **with** the button; otherwise it is
sent as plain text exactly like today.

## Decisions / assumptions (please confirm on review)

1. **Channel:** `cta_url` is a **WhatsApp Cloud API ("meta")** feature. We implement it in
   the meta message service only. Other channels (360dialog / WATI) fall back to plain text.
   _Assumption: meta is the active channel._
2. **Populating the table:** For now the Share Bot metadata row is **seeded directly in the
   DB** (no new CRUD endpoints). Optional future work: extend the system-messages controller
   with metadata CRUD.
3. **Known caveat — forwarding:** WhatsApp interactive messages (including `cta_url`) usually
   **lose the button when forwarded**. The direct recipient sees a working button; a person
   who receives a *forwarded* copy likely sees only plain content. This must be **verified on
   a real device** after implementation. If forwarding is essential, a follow-up option is to
   also include the URL in the message text (survives forwarding).

## Background — current behavior (verified in code)

- **Model:** `src/models/system.generated.messages.model.ts` — `SystemGeneratedMessages`
  (`id` UUID PK, `messageName`, `messageContent`, `languageCode?`). Table
  `system_generated_messages`, created via Sequelize `sync()` (no migration file).
- **Read:** `src/services/system.generated.message.service.ts` — `getMessage(name)` looks up
  by `messageName`, returns `messageContent`, else falls back to a client env var.
- **Positive feedback send:** `src/services/feedback/feedback.service.ts` — `PositiveFeedback`
  (lines ~155-212). Resolves `POSITIVE_FEEDBACK_MESSAGE` (DB → env → hardcoded fallback),
  routes a support-channel notification, then returns a **text-only** `fulfillmentMessages`
  payload. No buttons today.
- **WhatsApp payload builders:** `src/services/whatsapp.post.response.functionalities.ts` —
  dispatches on `${message_type}ResponseFormat`. Has `text`, `image`, `interactivebuttons`
  (reply buttons, **not** URL buttons), `interactivelist`, `template`, `flow` (`flow_cta`).
  **No `cta_url` builder exists yet.**
- **Response shape:** `src/refactor/interface/message.interface.ts` — `Iresponse` includes an
  optional `buttonMetaData?` field and a `message_type` field we can reuse to carry the button.
- **Model registration:** `src/connection/sequelizeClient.ts` (`addModels([...])`, `sync`).
- **Repo pattern:** static-method repo + mapper, resolving a client-scoped entity manager
  (see `src/database/repositories/system.messages/system.generated.messages.repo.ts`).

## Design

### New table: `system_generated_messages_metadata`

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID v4 PK | standard, matches existing models |
| `systemGeneratedMessageId` | UUID, FK → `system_generated_messages.id` | which message this belongs to |
| `buttonTitle` | STRING(256), nullable | button label, e.g. "Share Bot" |
| `buttonUrl` | TEXT, nullable | URL the button opens |
| `imageUrl` | TEXT, nullable | optional image/header |
| `isActive` | BOOLEAN, default `true` | enable/disable without deleting |
| `createdAt` / `updatedAt` | timestamps | `timestamps: true` |

- **Association:** `SystemGeneratedMessages @HasOne → SystemGeneratedMessagesMetadata`,
  `SystemGeneratedMessagesMetadata @BelongsTo → SystemGeneratedMessages` (via
  `systemGeneratedMessageId`). One message → at most one metadata row.
- Follow existing `sequelize-typescript` decorator style; register in `sequelizeClient.ts`
  alongside the parent model; created via `sync()` (consistent with the parent table).

### New CTA-URL payload builder

Add `cta_urlResponseFormat(response_format, payload)` in
`whatsapp.post.response.functionalities.ts`, matching the existing dispatch pattern, producing:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<recipient>",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "body": { "text": "<positive feedback message>" },
    "action": {
      "name": "cta_url",
      "parameters": { "display_text": "<buttonTitle>", "url": "<buttonUrl>" }
    }
  }
}
```

(Reuse `postDataFormatWhatsapp` for the envelope, consistent with the other builders.)

### Data flow

1. `PositiveFeedback` resolves the message content as today.
2. Look up the metadata row for that message (by the message's `id`).
3. If a row exists, `isActive`, and has `buttonUrl`:
   - set `message_type = 'cta_url'`
   - carry `{ buttonTitle, buttonUrl }` via `Iresponse.buttonMetaData`
4. Else: behave exactly as today (plain text) — no regression.
5. On send (`SendMediaMessage`), the `cta_url` dispatch builds the interactive payload for the
   meta service. On non-meta channels, fall back to `text`.

## Implementation steps

1. **Interface** — add `ISystemGeneratedMessagesMetadata` (mirror existing interface style).
2. **Model** — `src/models/system.generated.messages.metadata.model.ts` with fields above +
   `@BelongsTo` association; add `@HasOne` on `SystemGeneratedMessages`.
3. **Register model** — add to `addModels([...])` in `src/connection/sequelizeClient.ts`.
4. **DTO + mapper** — `SystemGeneratedMessagesMetadataDto` + mapper (mirror the existing
   system-messages mapper; avoid the `parseInt(uuid)` bug present in the existing mapper).
5. **Repository** — `getMetadataByMessageId(messageId)` in the system.messages repo folder.
6. **CTA-URL builder** — `cta_urlResponseFormat` in
   `whatsapp.post.response.functionalities.ts`; ensure `cta_url` maps through
   `whatsapp.common.service.ts` message-type handling if needed.
7. **Feedback wiring** — in `PositiveFeedback`, fetch metadata and set `message_type`/
   `buttonMetaData` when active; otherwise unchanged.
8. **Meta send path** — confirm `SendMediaMessage` dispatch reaches `cta_urlResponseFormat`;
   non-meta services fall back to text.
9. **Seed** — insert the Share Bot metadata row for `POSITIVE_FEEDBACK_MESSAGE`.
10. **Verify on real device** — confirm the button renders and, critically, observe the
    forwarding behavior; document the result.

## Testing

- Unit: `cta_urlResponseFormat` produces the correct interactive JSON given title + URL.
- Unit: repo returns the metadata row / null appropriately.
- Behavior: `PositiveFeedback` sends `cta_url` when active metadata exists; sends plain text
  when metadata is absent or `isActive = false` (no regression).
- Manual: real-device check of button render + forwarding behavior.

## Out of scope (YAGNI)

- Metadata CRUD API endpoints (seed directly in DB for now).
- CTA-URL support on 360dialog / WATI channels (plain-text fallback).
- Multiple buttons / multiple metadata rows per message.
- Rendering the `imageUrl` field (column added for future use; not wired into send yet
  unless you want it now).
