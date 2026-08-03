# Migrating the Nearest-Location Feature from OpenStreetMap to Google Maps

**Date:** 2026-07-22
**Status:** Draft spec — decisions pending (see Open Questions)
**Author:** Engineering
**Branch:** `new_location_flow`

---

## 1. Background & Current Flow

The bot has a "find nearest center" feature. When a user asks for the nearest location,
the bot needs the user's coordinates, then ranks the organization's own curated centers
(loaded from a CSV in S3) by distance.

### 1.1 How coordinates are obtained today

The only external map provider call in the active path is a **forward-geocoding**
request to OpenStreetMap's **Nominatim** service. It runs in exactly one place:

- [`src/utils/find.nearest.centers.ts`](../../../src/utils/find.nearest.centers.ts) →
  `NearestLocation.getLatLong(value)` (lines 89–114).

The method has two branches:

1. **User shared a GPS pin** — the incoming value is prefixed `latlong:` (built by the
   channel formatters, e.g. WhatsApp `locationMessageFormat`, Telegram, mock). In this
   branch **no external API is called** — the coordinates are simply parsed. This is the
   common case when a user taps "share location."
2. **User typed an address / zipcode / district** — the value is free text. Only in this
   branch is Nominatim called:

   ```ts
   const response = await fetch(
       `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
       { headers: { "User-Agent": "ReanBotWrapper/1.0 (services@reanfoundation.org)" } }
   );
   const data = await response.json();
   const latitude  = data[0].lat;   // Nominatim field
   const longitude = data[0].lon;   // Nominatim field
   return `${latitude}|${longitude}`;
   ```

### 1.2 What happens after geocoding (provider-independent)

Everything downstream is local and does **not** change with the provider:

- `findLocations()` loads the centers CSV from S3 (key = client env var
  `CenterLocationFileKey`) via `AwsS3manager`.
- `readCsv()` parses columns: `Latitude, Longitude, Center_Name, Postal_Address,
  Prefered_Center, Severity, Priority, Pincode`.
- `calculateDistance()` uses the `haversine-distance` library to compute km between the
  user and each center.
- `filterCentersOnTags()`, `sortCentersOnPriority()`, `getFinalLocation()` filter/rank.
- `formatLoctionResponse()` renders the top 4 centers as a chat message.

### 1.3 Wiring

- Dialogflow intent **`findNearestLocation`** → registered in
  [`intent.register.ts:273`](../../../src/intentEmitters/intent.register.ts#L273) →
  [`nearest.location.listner.ts`](../../../src/intentEmitters/intentListeners/nearest.location.listner.ts).
- The listener pulls `Location.latlong`, `Location.zipcode`, or `Location.District` from
  the Dialogflow parameters and calls `NearestLocation.findLocations(...)`.

### 1.4 Related code that is NOT OSM (context, may need decisions)

- **Alternate/legacy path:** `GetLocation` in
  [`src/services/find.nearest.location.service.ts`](../../../src/services/find.nearest.location.service.ts)
  POSTs to an external microservice (`NEAREST_LOCATION_SERVICE_URL`) via `needle`. It does
  not call OSM directly (the microservice might, but that is out of this repo). Appears
  largely unused/leftover — confirm before touching.
- **Emergency workflow:**
  [`workflow.event.listener.ts:241-246`](../../../src/services/emergency/workflow.event.listener.ts#L241-L246)
  forwards raw shared coordinates to the workflow engine. No geocoding — no change needed.
- **Prior Google reference (commented out):**
  [`covid.vaccination.service.ts:92-95`](../../../src/services/covid.vaccination.service.ts#L92-L95)
  already sketches `https://maps.googleapis.com/maps/api/geocode/json?...&key=GEO_API_KEY`
  (reverse geocoding). Useful template; not active.

### 1.5 Key takeaway

The migration is **surgical**: swapping the provider is a change to a single method
(`getLatLong`). The scope options below determine whether we do only that, or expand the
feature's capabilities using Google's richer APIs.

---

## 2. Scope Options

The user asked that all options be documented with descriptions so the choice can be made
deliberately. These are ordered from smallest to largest change.

### Option A — Swap geocoding only (recommended default)

Replace the Nominatim `fetch` call with Google's **Geocoding API**
(`https://maps.googleapis.com/maps/api/geocode/json?address=...&key=...`). Keep the S3
centers CSV and haversine matching exactly as they are.

- **What changes:** only `getLatLong()` (URL, response field mapping `lat/lon` →
  `results[0].geometry.location.lat/lng`, API key, remove hardcoded User-Agent header).
- **Behavior:** identical UX. Better geocoding accuracy/coverage than Nominatim,
  especially for partial or messy addresses, and no Nominatim rate-limit/usage-policy
  constraints (Nominatim's public server forbids heavy use).
- **Results source:** still your curated centers CSV.
- **Cost:** lowest (Geocoding is the cheapest relevant SKU — see §5).
- **Effort:** ~1 method + config + tests. Low risk.
- **Why recommended:** it is a like-for-like provider swap that solves the stated problem
  (move off OSM) with minimal surface area and cost.

### Option B — Geocoding + Google Places Nearby/Text Search

In addition to geocoding, use **Places API (Nearby Search / Text Search)** to discover
facilities dynamically from Google's POI database, potentially replacing or augmenting the
curated CSV.

- **What changes:** `getLatLong()` plus a new service that queries Places, plus a decision
  about whether Places results supplement or replace the CSV. Response shaping and ranking
  logic change materially.
- **Behavior:** returns generic public POIs (e.g. "hospitals near me"), **not** your
  curated, prioritized centers. This is a different product behavior — you lose the
  `Prefered_Center`/`Priority`/`Severity` curation unless you keep the CSV alongside.
- **Cost:** significantly higher — Places Nearby/Text Search is ~6× the price of Geocoding
  per 1,000 requests (see §5).
- **Effort:** medium-high. New code paths, new response model, ranking rework, more tests.
- **When it makes sense:** only if the org actually wants Google's POI catalog rather than
  (or in addition to) its own centers.

### Option C — Geocoding + Places Autocomplete

Swap geocoding (as in Option A) **and** add **Places Autocomplete** so users get
address suggestions as they type, then geocode the selected suggestion.

- **What changes:** Option A changes, plus channel/UI work to present suggestions. Chat
  channels (WhatsApp/Telegram) have limited native autocomplete UI, so this typically means
  interactive list/quick-reply messages or a mini web form — non-trivial channel work.
- **Behavior:** fewer failed geocodes from typos; smoother address entry.
- **Cost:** Autocomplete adds a per-request SKU (cheaper than Places Search but billed per
  keystroke session; use session tokens to control cost).
- **Effort:** high relative to value on chat channels; most useful if there's a web widget.
- **When it makes sense:** if address-typing failure rate is a real pain point and there's
  a UI surface that can host suggestions.

### Recommendation

Start with **Option A**. It removes OSM, improves accuracy, and is cheap and low-risk.
Options B and C can be layered later if product goals require them. The code should be
structured so the geocoding call sits behind a small interface, making a later move to
Places straightforward.

---

## 3. Required Code Changes (for Option A; B/C build on this)

1. **`getLatLong()` in `find.nearest.centers.ts`**
   - Replace the Nominatim URL with the Google Geocoding endpoint.
   - Read the API key from config (see §4).
   - Map `results[0].geometry.location.lat` / `.lng` → the existing `"lat|long"` string.
   - Handle Google's `status` field: `OK`, `ZERO_RESULTS`, `OVER_QUERY_LIMIT`,
     `REQUEST_DENIED`, `INVALID_REQUEST`, `UNKNOWN_ERROR` — throw the existing
     user-facing error ("Unable to get location, try sharing your live location") on
     `ZERO_RESULTS`/empty, and log distinctly on auth/quota errors.
   - Keep the `latlong:` GPS short-circuit branch untouched (no API call for shared pins).
   - Remove the hardcoded Nominatim `User-Agent` header.

2. **HTTP client** — replace the global `fetch` with `axios` (already a dependency, used
   elsewhere) for consistency, timeouts, and error handling. Optional but recommended.

3. **Config plumbing** — add the API-key lookup (§4). No new entity/DTO needed; the
   internal `"lat|long"` contract is unchanged, so downstream code is untouched.

4. **Cleanup** — remove the stale `// import fetch from 'node-fetch';` comment (line 4) and,
   if desired, the commented Google block in `covid.vaccination.service.ts`.

5. **Tests** — the feature currently has **no tests**. Add unit tests for `getLatLong`
   (see §7).

### Optional structural improvement (recommended, low cost)

Extract geocoding into a tiny `GeocodingService` (single method
`geocode(address): Promise<{lat, lng}>`) that `NearestLocation` depends on via DI. This:
- isolates the provider so Option B/C or a future provider swap touches one file,
- makes the network call independently testable/mockable,
- keeps `find.nearest.centers.ts` focused on ranking, not HTTP.

---

## 4. Configuration

### 4.1 New setting

A Google Maps API key must be provided. **How it is stored is an open decision** (see
Open Questions) — the two candidates:

- **Per-tenant client env var** (`GOOGLE_MAPS_API_KEY` via
  `ClientEnvironmentProviderService`, like `CenterLocationFileKey`). Lets each tenant use
  its own key and billing; matches the codebase's dominant pattern.
- **Global `process.env.GOOGLE_MAPS_API_KEY`** (like the old commented `GEO_API_KEY`).
  Simpler, one billing account, no per-tenant isolation.

### 4.2 Google Cloud project setup (regardless of storage choice)

- Create/choose a Google Cloud project; enable the **Geocoding API** (and Places API only
  if Option B/C).
- Create an API key; **restrict it**:
  - **API restriction:** limit to Geocoding API (+ Places if used) only.
  - **Application restriction:** since calls are server-side, restrict by **IP address**
    of the backend hosts (not HTTP referrer).
- Set a **billing budget + alerts** and, if desired, quota caps to prevent runaway cost
  (Google has no hard spend cap by default).
- Store the key in the chosen config store; never commit it. Add to `.env.example` /
  tenant setting docs.

---

## 5. Cost Analysis

Pricing below is Google Maps Platform, current as of 2026 (USD, tiered by monthly volume;
the 0–100k tier applies at our expected scale). Google's legacy flat "$200/month credit"
was replaced (March 2025) by **per-SKU monthly free allotments**.

| API (SKU) | Free / month | Price per 1,000 (0–100k tier) | Relevant to |
|---|---|---|---|
| **Geocoding** | 10,000 | **$5.00** | Options A, B, C |
| Places Nearby Search (Pro) | 5,000 | $32.00 | Option B |
| Places Text Search (Pro) | 5,000 | $32.00 | Option B |
| Places Autocomplete (Essentials) | 10,000 | $2.83 | Option C |

### 5.1 What actually gets billed

**Only typed-address lookups hit the Geocoding API.** Shared GPS pins cost nothing (no API
call). So billable volume = number of "find nearest center" requests where the user typed
an address/zipcode/district, not total location requests.

### 5.2 Illustrative monthly cost — Option A (Geocoding)

Assume every request shown is a billable geocode (worst case; real volume is lower because
many users share a pin):

| Geocode requests / month | Billable after 10k free | Monthly cost |
|---|---|---|
| 1,000 | 0 | **$0** |
| 10,000 | 0 | **$0** |
| 25,000 | 15,000 | **$75** |
| 50,000 | 40,000 | **$200** |
| 100,000 | 90,000 | **$450** |

### 5.3 Illustrative monthly cost — Option B (Places Search), same volumes

| Requests / month | Billable after 5k free | Monthly cost (@ $32/1k) |
|---|---|---|
| 1,000 | 0 | **$0** |
| 10,000 | 5,000 | **$160** |
| 25,000 | 20,000 | **$640** |
| 50,000 | 45,000 | **$1,440** |

Option B is ~6× the cost and changes behavior — reserve for a real product need.

### 5.4 Cost controls

- Prefer GPS-pin sharing in prompts (already the cheap path) to minimize geocodes.
- Cache geocoded results for repeated identical addresses/zipcodes (e.g. a small
  in-memory/Redis TTL cache keyed by normalized address) — zipcodes repeat heavily.
- Set Google Cloud budget alerts and per-API quota caps.
- For Option C, always use **session tokens** so a multi-keystroke autocomplete session is
  billed once with the follow-on geocode.

---

## 6. Error Handling & Behavior Notes

- **`ZERO_RESULTS` / empty:** keep current UX — throw "Unable to get location, try sharing
  your live location"; `findLocations` already catches and returns `[]`.
- **`REQUEST_DENIED` / `INVALID_REQUEST` (bad/missing key):** log clearly (config error),
  return the same user-facing fallback. Should surface loudly in logs/alerts.
- **`OVER_QUERY_LIMIT` (quota/budget hit):** log as an ops alert; user-facing fallback.
- **Network/timeout:** add an axios timeout (e.g. 5s) so a slow geocode doesn't hang the
  chat turn; treat as fallback.
- **Backward compatibility:** the `"lat|long"` return contract is unchanged, so no
  downstream change; the GPS short-circuit path is unaffected.

---

## 7. Testing

The feature has no tests today. Add:

- **Unit — `getLatLong` / `GeocodingService`:**
  - `latlong:` prefix short-circuits and makes **no** HTTP call.
  - Successful geocode maps `geometry.location.lat/lng` → `"lat|long"`.
  - `ZERO_RESULTS` throws the user-facing error.
  - `REQUEST_DENIED` / network error handled and logged, no crash.
  - Mock the HTTP client (axios) — no real API calls in tests.
- **Unit — ranking (regression safety):** feed a known user location + small CSV fixture
  through `calculateDistance` + sort and assert the top-4 order. Protects the untouched
  logic during refactor.
- **Manual/QA:** WhatsApp + Telegram — (a) share GPS pin, (b) type a zipcode, (c) type a
  district name; confirm nearest centers returned in each channel.

---

## 8. Rollout

1. Set up the Google Cloud project, key, restrictions, and billing alerts.
2. Implement Option A behind config; keep the key unset in non-configured environments and
   confirm behavior (should log config error + fallback, not crash).
3. Deploy to staging; run the QA matrix in §7.
4. Monitor logs + Google Cloud usage for a week; verify cost tracks expectations.
5. Remove OSM/Nominatim code and the stale commented references.

---

## 9. Open Questions (to be answered before implementation)

1. **Scope:** Option A (swap only), B (Places search), or C (autocomplete)? *(User asked to
   keep all documented; final choice pending.)*
2. **API key storage:** per-tenant client env var vs global `process.env`? *(Pending.)*
3. **HTTP client:** switch to `axios` (recommended) or keep global `fetch`?
4. **Structural:** extract a `GeocodingService` (recommended) or edit `getLatLong` in
   place?
5. **Caching:** add an address→lat/long cache now, or defer until volume justifies it?
6. **Legacy paths:** does `GetLocation` / `NEAREST_LOCATION_SERVICE_URL` need migration, or
   confirm it's dead and leave/remove it?
7. **Expected volume:** rough monthly count of typed-address lookups, to size cost and
   quota caps?

---

## 10. Non-Goals

- Changing the centers data source (still the S3 CSV) — unless Option B is chosen.
- Changing the distance/ranking algorithm (`haversine`, priority sort) — unchanged.
- Changing the emergency-workflow coordinate passthrough.
- Adding new channels or changing the `findNearestLocation` intent contract.
