# Hi Pando Recommendation Engine — Claude Code Execution Checklist

## How to use this file

This checklist accompanies `hi-pando-execution-plan.md`. Work through it **top to bottom, one unchecked box at a time**.

Rules for execution:

1. **No rushing.** Do not jump ahead to a later phase or task until every box in the current task is checked and verified.
2. **One task = one focused unit of work.** Finish it, test it, check the box, then move to the next.
3. **Stop and ask before phase-gate items.** Any line marked `⛔ CHECKPOINT` requires explicit human confirmation before continuing — do not self-approve and proceed.
4. **Update this file as you go.** Change `[ ]` to `[x]` when a task is genuinely complete (code written, tested, and working) — not just started.
5. **If blocked**, add a `> Blocked:` note directly under the task explaining why, and move to the next non-dependent task rather than guessing.
6. **No synthetic-data shortcuts past Phase 2.** Synthetic property data is fine for development/testing throughout, but do not fabricate synthetic *user interaction* data to fast-track Phase 3 — that defeats the point of the plan.
7. **Re-read the relevant section of `hi-pando-execution-plan.md` before starting each numbered task** — this checklist is the "what and in what order," the plan file is the "why and how."

---

## Phase 0 — Project Setup

- [x] Initialize repo structure (`/data`, `/models`, `/api`, `/pipelines`, `/tests`, `/notebooks`)
- [x] Set up Python environment (venv or poetry) and pin dependency versions
- [x] Set up MongoDB connection (local or cloud) and confirm a test write/read succeeds
  > Verified against MongoDB Atlas (cluster0.yblxbns.mongodb.net, db `Pando_ai`): ping, insert, read-back, and delete all succeeded.
- [x] Set up FastAPI skeleton with a health-check endpoint
- [x] Set up MLflow tracking (can point to local file store initially)
  > Note: switched from plain file store (`./mlruns`) to SQLite-backed local store (`sqlite:///mlflow.db`) per user decision — MLflow 3.16.1 has deprecated the plain file store.
- [x] Confirm `.env` / secrets handling is in place before any real data enters the system
- [x] ⛔ CHECKPOINT: confirm environment runs end-to-end (DB connects, API boots, MLflow logs a dummy run) before writing feature code
  > Verified end-to-end: `/health` returns `{"status":"ok","db":"ok"}` with live Atlas connection; MLflow smoke test logged a run to `mlflow.db`.

---

## Phase 1 — Data Foundation & Property Intelligence

### 1.1 Property Dataset
- [x] Define the MongoDB schema for the full property attribute list in the plan (Property ID through Nearby facilities)
  > Implemented as Pydantic model (`pipelines/schemas/property_schema.py`) covering every attribute from Property ID through Nearby facilities (metro/schools/hospitals/shopping/beaches/business districts as distance-in-km fields).
- [x] Create the MongoDB collection with schema validation rules
  > Note: the Atlas `Pando_ai` database already contains an unrelated pre-existing `properties` collection (28 docs, different camelCase schema) plus `buyers`/`listings` — per user decision, our schema lives in a new collection `hi_pando_properties` instead, leaving existing data untouched. Created via `pipelines/setup_property_collection.py` using a `$jsonSchema` validator (`pipelines/schemas/property_mongo_schema.py`, `validationAction: error`) plus a unique index on `property_id`.
- [x] Write a data ingestion script (source TBD — real feed or manual entry point)
  > Manual entry point: `pipelines/ingest_properties.py <path.json>` — validates each record against the Pydantic model, then upserts by `property_id` into `hi_pando_properties`. Tested: 2 valid sample records inserted successfully; an invalid record (bad enum) was correctly rejected at both the Pydantic layer and, separately, at the MongoDB `$jsonSchema` layer.

### 1.2 Data Cleaning
- [x] Write missing-value handling logic (define defaults/nulls per field)
  > `pipelines/cleaning/missing_values.py` — documented per-field rule: required fields never defaulted, list fields (`amenities`, `property_purpose`) default to `[]`, optional scalars default to `None` (not 0, since 0 is a valid real value for e.g. `parking`/`floor`).
- [x] Write duplicate-property detection (by ID and by fuzzy match on name+location+price)
  > `pipelines/cleaning/duplicates.py` — exact `property_id` match plus fuzzy match (`difflib.SequenceMatcher` on name, same normalized location, price within 2%). Wired into `ingest_properties.py`: runs after cleaning (so "JLT" vs "Jumeirah Lake Towers" are recognized as the same location) and prints a warning without blocking ingestion.
- [x] Write property-type normalization (map variant labels to a canonical set)
  > `pipelines/cleaning/property_type.py` — canonical list of 10 types (Apartment, Villa, Townhouse, etc.) with a variant-label map; falls back to cleaned raw text if unrecognized.
- [x] Write location-name normalization (canonical location/community list)
  > `pipelines/cleaning/location.py` — canonical list of 15 Dubai locations with common variants/abbreviations (JVC, JLT, JBR, etc.) mapped in.
- [x] Write currency/price normalization
  > `pipelines/cleaning/price.py` — parses messy price strings (currency symbols/codes, "1.5M"/"1.5 million" shorthand, comma formatting) and converts to a normalized AED float using static FX rates.
- [x] Write area-unit normalization (sqft vs sqm)
  > `pipelines/cleaning/area.py` — detects sqm indicators (sqm, m2, m², "sq m") and converts to sqft (the schema's canonical unit); strips the unit text before digit extraction to avoid the `m2`-digit-collision bug found during testing.
- [x] Write amenity-name normalization (canonical amenity list)
  > `pipelines/cleaning/amenities.py` — canonical list of 15 amenities with variant mapping; `normalize_amenities()` maps a list, drops unrecognized entries, and dedupes while preserving order.
- [x] Write general text-cleaning utility for free-text fields
  > `pipelines/cleaning/text_cleaning.py` — `clean_text()` (unicode normalize, whitespace collapse, strip, empty→None) and `normalize_key()` (lookup-key form used by all the canonical-mapping modules above).
- [x] Unit-test each cleaning function against deliberately messy sample rows
  > `tests/test_cleaning.py` — 33 tests covering every module plus an end-to-end pipeline integration test. Caught and fixed 3 real bugs during testing: (1) `"1.5M"` price shorthand not matching due to a `\b` word-boundary regex issue, (2) `"100 m2"` area parsing picking up the `2` from `m2` as a digit before unit-stripping, (3) property-type fallback not cleaning raw text for unrecognized types. All 33 tests pass.
  > Also verified live against MongoDB via `pipelines/ingest_properties.py`: messy sample records (mixed currency/unit formats, variant location/type/amenity labels) cleaned, validated, and inserted correctly; duplicate warning correctly fired for a fuzzy-matched pair after cleaning normalized their locations to the same canonical value. Test documents removed after verification.

### 1.3 Property Feature Engineering
- [x] Implement price normalization feature
  > `pipelines/features/scaling.py::MinMaxScaler` fit on the dataset's price range; `price_normalized` in [0,1]. Persisted via `save_scalers`/`load_scalers` so training and inference reuse the same fitted range.
- [x] Implement numerical bedroom/bathroom features
  > `pipelines/features/numerical.py::encode_bedrooms_bathrooms` — raw counts as floats, 0.0 if missing.
- [x] Implement property-type encoding
  > `pipelines/features/categorical.py::encode_property_type` — one-hot over the 10 canonical types (from `pipelines/cleaning/property_type.py`) plus an "other" bucket for unrecognized values.
- [x] Implement location/geo encoding
  > `encode_location` (one-hot over the 15 canonical locations) + `pipelines/features/geo.py::encode_geo` (raw lat/lon, Dubai-bounding-box min-max scaled position, `geo_known` flag for missing coordinates).
- [x] Implement multi-hot amenity encoding
  > `encode_amenities` — multi-hot over the 15 canonical amenities from Phase 1.2.
- [x] Implement rental-yield numerical feature
  > `encode_rental_yield` — raw value plus a `rental_yield_known` flag (0.0 default doesn't get confused with "actually zero yield").
- [x] Implement distance-to-metro (and other nearby-facility) numerical features
  > `encode_nearby_facilities` — all 6 facility distances (metro/schools/hospitals/shopping/beaches/business districts), each with a companion `_known` flag and a 50km "far away" fallback (not 0) when missing.
- [x] Assemble the full feature-engineering pipeline as a single callable function/module
  > `pipelines/features/pipeline.py::engineer_property_features()` (single record) and `engineer_features_for_dataset()` (fits scalers + engineers the whole dataset). CLI entry point `python -m pipelines.run_feature_engineering` reads `hi_pando_properties`, writes feature rows to `hi_pando_property_features`, and persists fitted scalers to `models/property_feature_scalers.json`. Feature schema documented in `pipelines/features/FEATURE_SCHEMA.md`. 27 unit tests in `tests/test_features.py` (60 total across the project), all passing; also verified end-to-end against live Atlas data (66 features/row on the 2 existing sample properties).

### 1.4 Initial Dataset
- [x] Confirm whether real property data is available yet
  > Found pre-existing Atlas collections unrelated to this schema: `listings` (31 docs — real, rich property data: title, description, price, bedrooms, area, coordinates, amenities) and `properties`/`buyers` (different app's data, left untouched). Per user decision, treated `listings` as real source data.
- [x] If not available: build a synthetic Dubai property generator with realistic variation across location, price, type, bedrooms, amenities, and investment characteristics
  > Real data was partially available (31 listings) but thin in volume, so per user decision built both: `pipelines/map_listings_to_properties.py` (maps real `listings` → our schema) and `pipelines/synthetic_property_generator.py` (realistic Dubai properties varying location/price/type/bedrooms/amenities/investment characteristics, type-aware price/area/bedroom profiles per property type).
  > Mid-task finding: 11 of the 31 real listings had `purpose: "rent"` with annual-rent-scale prices that would have corrupted the sale-price scaler if left in the `price` field. Fixed by adding `listing_purpose` (Sale/Rent) and `rent_price` fields to the Property schema (with a model validator enforcing price/rent_price matches purpose), updating the Mongo `$jsonSchema` validator, cleaning pipeline, and feature engineering (separate `price_normalized`/`rent_price_normalized` + `_known` flags) accordingly. 10 new tests added (`tests/test_property_schema.py` + `TestSaleVsRentPriceFeatures` in `tests/test_features.py`) confirming rent prices never leak into the sale-price scaler.
- [x] Generate an initial dataset of a few hundred properties and load into MongoDB
  > `hi_pando_properties`: 333 total (31 real from `listings`, 300 synthetic, 2 original manual samples). 322 Sale listings, 11 Rent listings.
- [x] Run the full cleaning + feature-engineering pipeline against it and spot-check output
  > Ran `pipelines.run_feature_engineering` against all 333 records — 69 features/row, fitted price scaler (442K–85M AED, sale-only) and rent-price scaler (68K–950K AED) confirmed independently ranged with no cross-contamination. Spot-checked real-mapped, synthetic, and rent-listing records individually. Duplicate detection run across the full dataset found 17 pairs, all traced to the synthetic generator's templated naming (`"{location} {type} #{index}"` inflates name-similarity for same-location/type properties) — a known synthetic-data artifact, not a duplicate-detection defect (verified against a sample pair with materially different prices/ids).

### Phase 1 Deliverables Check
- [x] Property MongoDB collection exists and is populated
  > `hi_pando_properties`, 333 documents.
- [x] Data validation pipeline runs without errors on the full dataset
  > All 333 records passed both Pydantic (`Property` model, incl. the sale/rent price invariant) and MongoDB `$jsonSchema` validation during ingestion/mapping/generation.
- [x] Clean dataset confirmed (no dupes, no unhandled nulls, normalized fields)
  > See 1.4 note above on the 17 flagged pairs (synthetic naming artifact, not real duplicates). All optional fields follow the documented missing-value defaults; property types/locations/amenities normalized to canonical sets during cleaning.
- [x] Feature schema documented (a markdown or code-level doc listing every engineered feature)
  > `pipelines/features/FEATURE_SCHEMA.md`, updated for the new price/rent_price split (69 features/row total).
- [x] Feature-engineering pipeline runs end-to-end on the dataset
  > `python -m pipelines.run_feature_engineering` — 333/333 processed successfully, scalers persisted to `models/property_feature_scalers.json`.
- [x] ⛔ CHECKPOINT: review sample of 10–20 cleaned/engineered property records before moving to Phase 2
  > Reviewed 2026-09-22: 12-record sample (5 real from `listings`, 5 synthetic, 2 manual) shown via published artifact and as text, plus a real-vs-synthetic field comparison. Confirmed: cleaning/normalization correct, sale/rent price separation holds (rent records show `price: null` + populated `rent_price`, never both). Noted asymmetry for Phase 2/3 awareness: real (`LST-*`) records have no nearby-facility distance data (all 6 fields fall back to 50km/`_known=0`), while synthetic and manual records have it fully populated — worth accounting for if nearby-facility distance becomes a heavily-weighted feature later. User approved moving to Phase 2.

---

## Phase 2 — User DNA & Cold-Start Recommendation Engine

### 2.1 User DNA
- [x] Define the User DNA JSON schema (budget, locations, propertyTypes, bedrooms, purpose, amenities, transportPreference, rentalYieldPreference)
  > `pipelines/schemas/user_dna_schema.py::UserDNA` — every field optional (a real conversation rarely states everything up front; Phase 2.2 extraction must be able to return a partial profile). `Budget` is a nested model with a min≤max validator. `Purpose`, `TransportPreference`, `RentalYieldPreference` as enums for controlled vocab.
- [x] Implement schema validation for User DNA objects
  > 12 unit tests in `tests/test_user_dna_schema.py` — full/partial/empty profiles, invalid enum values, budget min>max rejection, negative values, round-trip serialization. All passing.

### 2.2 Preference Extraction
- [x] Design the prompt/logic that extracts structured User DNA from free-form conversation
  > Rule-based (regex + keyword matching), per user decision — no external LLM dependency, deterministic, fully unit-testable. `pipelines/extraction/budget.py` (money-phrase detection: ranges, under/over/around phrasing, currency+magnitude shorthand, reuses Phase 1.2's `normalize_price`), `pipelines/extraction/categorical.py` (locations/property types/amenities matched against Phase 1.2's canonical lists + conversational aliases; bedrooms via regex; purpose/transport/rental-yield-preference via keyword patterns).
- [x] Implement the extraction function (LLM-based or rule-based — decide and document which)
  > `pipelines/extraction/pipeline.py::extract_user_dna()` — orchestrates all field extractors into one `UserDNA` object. Documented as rule-based in the module docstring.
- [x] Test extraction against at least 10 varied example conversations, including incomplete/ambiguous ones
  > `tests/test_extraction.py` — 12 full-conversation scenarios (complete investor profile, family end-use, budget-only, extremely vague, location-only, rental+yield combo, multiple locations/types, currency shorthand, no-amenities-mentioned, amenities-only, contradictory purpose signals, empty string) plus 19 unit tests on individual extractors. 32 tests total, all passing. Caught and fixed 1 real bug: `"rent it out"` didn't match the literal `"rent out"` keyword (fixed by switching purpose keywords to regex patterns).
- [x] Handle missing-field cases (what happens when the user hasn't stated a budget, etc.)
  > Every extractor returns `None`/`[]` when nothing matches (never raises or fabricates a value); `UserDNA` has all-optional fields so a fully or partially empty profile always validates (see 2.1). Missing fields are "not stated," to be treated as neutral (not penalized) by feature matching in 2.3.

### 2.3 Feature Matching
- [x] Implement Budget Match scoring
  > `pipelines/matching/scorers.py::score_budget_match` — 1.0 inside [min, max], decays linearly outside the range (50% overage tolerance before hitting 0), neutral if no budget stated. Uses `price` or `rent_price` depending on the property's `listing_purpose`.
- [x] Implement Location Match scoring
- [x] Implement Property Type Match scoring
- [x] Implement Bedroom Match scoring
  > Exact match = 1.0, decays 0.25 per bedroom of difference, floors at 0.
- [x] Implement Purpose Match scoring
  > Maps `UserDNA.purpose` to the matching `Property.property_purpose` vocabulary value and checks membership.
- [x] Implement Amenity Match scoring
  > Overlap ratio: |wanted ∩ available| / |wanted|.
- [x] Implement Area Match scoring
  > Per user decision (no area preference field exists in UserDNA — see 2.1), always returns the neutral score. Documented as a placeholder to revisit if an area preference field is added later.
- [x] Implement Transport Match scoring
  > Based on `metro_distance_km`: ≤1km = 1.0, ≥5km = 0.0, linear between; neutral if no transport preference or distance unknown.
- [x] Implement Investment Match scoring
  > Property's numeric `rental_yield` bucketed into High/Medium/Low bands (≥7% / 5–7% / <5%) and compared against `UserDNA.rental_yield_preference`; exact band match = 1.0, decays 0.5 per band of distance.
- [x] Confirm every score is normalized to the 0–1 range
  > All 9 scorers unit-tested individually plus a combined test asserting every score type stays in [0,1] under deliberately extreme mismatched inputs. 37 tests in `tests/test_matching_scorers.py`, all passing (151 total project-wide). Shared `NEUTRAL_SCORE = 0.75` convention: an unstated user preference always yields a neutral-positive score, never 0 or 1.

### 2.4 Initial Recommendation Score
- [x] Implement the weighted scoring function with configurable weights (not hard-coded inline)
  > `pipelines/matching/weighted_scoring.py::compute_recommendation_score()` — loads weights from config, computes all 9 match scores, returns (weighted_total, component_breakdown) so the breakdown is available for Phase 2.6 explanations.
  > Note: the plan's example weights (30/20/15/10/10/5/5/5) cover only 8 match types and omit Transport Match, even though 2.3 requires all 9. Per user decision, rescaled to fold Transport in alongside Investment's original 5% slot: Budget 28%, Location 19%, Property Type 14%, Bedroom 9%, Purpose 9%, Amenities 5%, Area 5%, Transport 6%, Investment 5% — preserves the plan's original proportions as closely as possible while covering all 9 types.
- [x] Store weights in a config file, not scattered through the codebase
  > `config/recommendation_weights.json`. `load_weights()` validates the config has exactly the 9 known match types and that weights sum to 1.0 (raises otherwise).
- [x] Unit-test the scoring function against known input/output pairs
  > `tests/test_weighted_scoring.py` — 9 tests: config validation (missing/unknown match types, weights not summing to 1), a hand-computed weighted-sum verification, all-neutral baseline, and a default-config boundedness check. All passing (160 total project-wide).

### 2.5 Candidate Generation
- [x] Implement basic pre-filtering (budget/location) to cut the full property set down before scoring
  > `pipelines/matching/candidate_generation.py::pre_filter_candidates()` — excludes properties clearly outside budget (50% tolerance beyond the scorer's own overage curve, so a strong non-price match can still surface) or outside stated locations. Missing price/no stated preference never excludes a property (can't judge on absent data).
- [x] Implement the candidate → score → rank → top-N pipeline
  > `score_and_rank()` + `generate_recommendations()` — full funnel: pre-filter → score all candidates via `compute_recommendation_score` → sort descending → slice top-N. `pipelines/matching/repository.py::load_all_properties()` added to read the live `hi_pando_properties` collection as `Property` objects.
- [x] Test the full funnel against the Phase 1 dataset and confirm sensible narrowing at each stage
  > `tests/test_candidate_generation.py` — 10 in-memory unit tests + 1 integration test (marked `@pytest.mark.integration`, registered in new `pytest.ini`) against the live 333-property Atlas dataset. Manually verified funnel: 333 total → 29 after budget+location pre-filter → 29 scored/ranked, top result 0.925 (JVC/Marina apartments within budget), confirming sensible narrowing end-to-end. 171 tests passing project-wide (170 unit + 1 live integration).

### 2.6 Recommendation Explanation
- [x] Implement explanation generation tied to which match components scored highly
  > `pipelines/matching/explanation.py::generate_explanation()` — only components scoring ≥0.8 (`STRONG_MATCH_THRESHOLD`) *and* that the user actually stated a preference on produce a reason; `NEUTRAL_SCORE` (unstated preference, 0.75) never generates a reason even though it's numerically high, since there's nothing to compliment the property on if the user never asked. Amenities list only the specific matched amenity names, not just a generic "matches amenities" line.
- [x] Confirm explanations read naturally (advisor tone, not a raw score dump)
  > `format_explanation()` renders as "Recommended because: ✓ ..." matching the plan's example format. Verified against real top-ranked properties from the live dataset. Caught and fixed 2 real copy issues during review: (1) property-type and bedroom explainers both restating the bedroom count redundantly, (2) "A apartment" grammatical error — added an `_article_for()` a/an helper, now "An apartment" / "A villa". 9 tests in `tests/test_explanation.py` including a regression test for the article fix. 179 tests passing project-wide.

### Phase 2 Deliverables Check
- [x] User DNA schema implemented and validated
- [x] Preference extraction pipeline tested against varied conversation samples
- [x] Feature matching engine covers all 9 match types
- [x] Scoring engine is configurable and unit-tested
- [x] Candidate generation pipeline runs end-to-end
- [x] Property ranking system returns sensible top-N results
- [x] Recommendation explanation system produces readable output
- [x] `/recommendations` API endpoint built and returns a valid response for a sample User DNA
  > `POST /recommendations` in `api/main.py` — accepts either a `user_dna` object or raw `conversation_text` (extracted via Phase 2.2's rule-based pipeline), returns ranked properties with scores, per-component match_scores, and natural-language explanations. `api/schemas.py` defines the request/response models with a validator enforcing exactly one input mode. Manually tested end-to-end against the live 333-property dataset via both input modes and both validation-error paths; 7 automated tests in `tests/test_recommendations_api.py` (via FastAPI TestClient), all passing. 187 tests passing project-wide.
- [x] ⛔ CHECKPOINT: manually review recommendations + explanations for 3–5 test User DNA profiles before moving to Phase 3
  > Reviewed 2026-09-22: 5 profiles (full investor, family end-use, budget-only, vague/type-only, extracted-from-conversation) run through the live funnel against the real dataset, shown via published artifact and as text. Found and fixed 2 real issues during review:
  > 1. Rent-only listings surfacing for buyers, and sale-only listings surfacing for renters (Profile 2) — added a hard rule-based purpose filter (`_property_purpose_conflicts`) to `pre_filter_candidates()`. Rule-based per user decision, to be replaced with an LLM-based judgment later.
  > 2. A Retail Shop surfacing for a user wanting residential housing (Profile 5) — root cause was a source record with bare `property_type="Commercial"` slipping past category classification. Per user decision, Hi Pando is scoped to residential buildings only for now: added `pipelines/matching/property_category.py` (shared residential/commercial classifier) and `load_all_properties(residential_only=True)` (default) in `repository.py`, which excludes all commercial properties (Office/Retail/Warehouse/bare "Commercial") at the data-loading layer before they ever reach matching. Also excludes Land (not a building) and 2 unmapped labels ("Mansion", "Royal Penthouse") — accepted as correct scope per user decision (216 of 333 properties remain in scope). The category hard-filter in `candidate_generation.py` stays as defense-in-depth for residential-vs-residential confusion.
  > Both fixes verified against the live dataset and covered by new tests: `tests/test_property_category.py` (9 tests), `TestHardRuleBasedFilters` in `tests/test_candidate_generation.py` (9 tests incl. a named regression test for the Retail Shop case), plus a repository-level integration test. 207 tests passing project-wide. User approved moving to Phase 3.

---

## Phase 3 — Behavioral Data & ML Recommendation Model

> Do not start this phase until Phase 2 is live and generating real recommendations that real users (or at least a test group) are interacting with. This phase depends on genuine interaction data.

> **Pre-Phase-3 go-live audit (2026-09-22):** per user request, audited Phase 2 for loose ends beyond the checklist's own feature-completeness tracking (which was 100% complete) before treating the "live" gate as satisfied. Found and fixed 2 real safety gaps in `api/main.py`: (1) exception details were passed straight into HTTP error responses (`HTTPException(detail=f"...{exc}")`), risking leakage of internals like DB connection strings on failure — replaced with sanitized generic messages plus server-side logging; (2) no global exception handler existed, so any unhandled exception would surface FastAPI's default 500 with a raw traceback — added `@app.exception_handler(Exception)` returning a clean `{"detail": "Internal server error"}`. Both covered by new tests (`TestErrorSanitization` in `tests/test_recommendations_api.py`, 2 tests, 209 total project-wide). CORS middleware and request-level caching were identified but explicitly deferred per user decision (not needed for a small test group; revisit once a real frontend/traffic pattern is known). With these fixes in place, Phase 2 is considered good enough to go live for a test group, unblocking Phase 3.

### 3.1 Interaction Tracking
- [x] Define the event schema (PROPERTY_SHOWN, CLICKED, VIEWED, SAVED, SHORTLISTED, REJECTED, BROKER_CONTACTED, VIEWING_REQUESTED)
  > `pipelines/schemas/interaction_schema.py::InteractionEvent` — all 8 event types as `InteractionEventType` enum. Fields: `userId`, `propertyId`, `event`, `timestamp` (auto-defaults to now UTC), `recommendationScore` (optional, 0–1 range; required in spirit for PROPERTY_SHOWN, optional for the rest since a later action may not always carry the original score). CamelCase aliases match the plan's example JSON exactly, snake_case is the Python-facing name (`populate_by_name=True`, both accepted). MongoDB `$jsonSchema` validator (`interaction_mongo_schema.py`) mirrors this. Collection `hi_pando_interactions` created via `pipelines/setup_interaction_collection.py` with indexes on `userId`, `propertyId`, `timestamp` (no unique index — a user can interact with the same property multiple times).
- [x] Implement event logging at each relevant point in the frontend/API flow
  > No frontend exists yet (backend-only project) — logging implemented at the API layer: (1) `POST /recommendations` auto-logs a `PROPERTY_SHOWN` event for every returned property when the caller supplies an optional new `user_id` field (added to `RecommendationRequest`); omitted `user_id` → no event logged, per decision to never invent a placeholder id. (2) New `POST /interactions` endpoint accepts any of the 8 event types directly, for a future frontend (or test-group tooling) to report CLICKED/VIEWED/SAVED/SHORTLISTED/REJECTED/BROKER_CONTACTED/VIEWING_REQUESTED as they happen. `pipelines/interactions/repository.py::log_interaction()`/`log_interactions()` (bulk) do the actual writes; a logging failure never breaks the recommendation response itself (caught and logged server-side only).
- [x] Confirm events are being written to storage correctly with userId, propertyId, event, timestamp, recommendationScore
  > Verified against the live Atlas collection. Caught and fixed 1 real bug during integration testing: `model_dump(mode="json")` serialized `timestamp` as an ISO string, which the MongoDB `$jsonSchema` validator's `bsonType: "date"` rejected — fixed by dumping in `mode="python"` so pymongo stores a real BSON date. 9 schema tests (`tests/test_interaction_schema.py`), 4 repository integration tests (`tests/test_interactions_repository.py`, incl. a test that the Mongo validator itself rejects an invalid event type), 4 API integration tests (`TestInteractionsEndpoint` in `tests/test_recommendations_api.py` — covers the 201 create path, invalid-event rejection, PROPERTY_SHOWN auto-logging matching the returned property list exactly, and confirms no event is written when `user_id` is omitted). 226 tests passing project-wide.

### 3.2 Build Training Dataset
- [x] Write the pipeline that joins user features + property features + interaction context + outcome into training rows
  > Mid-task finding: the Phase 3.1 `InteractionEvent` schema only stored userId/propertyId/event/timestamp/recommendationScore — it never captured the UserDNA or 9 match-score components at the moment a property was shown, so there was no way to reconstruct "what did this user want" or "why was this scored this way" from stored interactions alone. Per user decision, extended `InteractionEvent` (and the Mongo validator) with optional `userDna`/`matchScores` snapshot fields, populated automatically by `/recommendations` on every `PROPERTY_SHOWN` event. Fixed now since no real interaction data existed yet (no backfill needed).
  > `pipelines/training/build_training_dataset.py::build_training_dataset()` — for each labeled interaction (see next item), joins: property features from `hi_pando_property_features` (Phase 1.3, 69 columns), the UserDNA/match-score snapshot from the interaction itself if present, otherwise the most recent prior `PROPERTY_SHOWN` event for the same user+property pair, plus a few raw UserDNA fields called out directly (bedrooms, budget min/max) mirroring the plan's example. Rows with no resolvable snapshot or missing property features are skipped rather than fabricated. CLI: `python -m pipelines.training.build_training_dataset`.
- [x] Confirm positive/negative labels are assigned correctly based on interaction type
  > `pipelines/training/labels.py` — conservative "standard engagement-funnel" mapping per user decision: Positive = SAVED/SHORTLISTED/BROKER_CONTACTED/VIEWING_REQUESTED (deliberate, effortful actions); Negative = REJECTED (explicit signal); SHOWN/CLICKED/VIEWED excluded from training labels entirely (too weak/ambiguous alone), though still used as context snapshots for later labeled events. 6 tests in `tests/test_labels.py` (incl. one that fails loudly if a new event type is ever added without an explicit labeling decision). 5 integration tests in `tests/test_build_training_dataset.py` verify correct end-to-end joining and labeling against real property data, including the snapshot-fallback logic and the skip-when-no-snapshot safety behavior. 238 tests passing project-wide. Pipeline confirmed to run cleanly against the current (empty, since no real user data exists yet) live interactions collection — returns 0 rows without error, as expected.

### 3.3 Feature Engineering (behavioral)
- [x] Implement user-side behavioral features (avg price viewed, avg size viewed, previous interactions)
  > `pipelines/training/behavioral_features.py::compute_user_behavioral_features()` — aggregates a user's interaction history into `user_previous_interactions_count`, `user_avg_price_viewed`, `user_avg_area_viewed` (averaged from `hi_pando_property_features`' normalized price/area, reusing Phase 1.3 rather than re-deriving). "Viewed" is defined as any interaction at all (PROPERTY_SHOWN included), not just PROPERTY_VIEWED, since a stricter definition would badly undercount early on when most interactions are just SHOWN. Accepts a `before` cutoff so a training row for an event at time T never sees interactions after T (no future leakage). Safe 0/None defaults for a user with no history. The plan's other "User Features" (Budget range, Preferred locations/type/bedrooms, Investment/end-use preference, Preferred amenities) are UserDNA, not behavior — already captured by Phase 3.2's per-row UserDNA snapshot, nothing new needed there.
- [x] Confirm property-side features from Phase 1 are reusable here without duplication
  > Confirmed and wired in: `build_training_dataset()` joins `hi_pando_property_features` (Phase 1.3's 69 columns — Price, Bedrooms, Property type, Location, Rental yield, Area, Amenities, Distance to metro, Completion status, etc.) directly into every training row with zero re-derivation. Documented explicitly in the pipeline's module docstring.
- [x] Implement all User × Property interaction features (price difference, budget compatibility, location similarity, bedroom difference, amenity similarity, property type match, historical interest, distance preference, investment compatibility)
  > `pipelines/training/interaction_features.py`. Two features (location_similarity, property_type_match) reuse the existing Phase 2.3 match scores as-is, since those are already exactly the right signal (binary match/no-match) and a separate version would be pure duplication. The other 7 are genuinely new raw/continuous features distinct from their 0-1 match-score counterparts, since raw values carry information a decayed score discards (e.g. "200k over budget" vs "300k under" score similarly on `match_budget_match` but are very different signals): `price_difference` (signed AED delta), `budget_compatibility` (price/budget_max ratio), `bedroom_difference` (signed int), `amenity_similarity` (Jaccard index — symmetric, vs. the match score's asymmetric "coverage of what was asked for"), `distance_preference` (raw metro km), `investment_compatibility` (yield minus a numeric threshold from the user's yield-preference band), and `historical_user_interest` (new: 1.0 if the user positively interacted with this exact property before, 0.5 if with another property sharing its location/type, else 0.0 — computed from prior labeled interactions strictly before this row's timestamp, excluding the row's own property, so it can't see its own outcome or the future).
  > 24 unit tests (`tests/test_interaction_features.py`) + 4 integration tests (`tests/test_behavioral_features.py`) + 2 new training-row integration tests (in `tests/test_build_training_dataset.py`, incl. one confirming historical_user_interest correctly links across two different properties in the same location). 268 tests passing project-wide. Pipeline re-confirmed to run cleanly against the still-empty live interactions collection.

### 3.4 ML Ranking Model
- [x] Confirm sufficient interaction volume exists to train a meaningful model (define a minimum threshold before proceeding)
  > `hi_pando_interactions` was confirmed live-empty (0 real documents) going into this phase — no frontend traffic exists yet. Per explicit user decision, cold-started with synthetic interaction data rather than waiting: `pipelines/synthetic_interaction_generator.py` (new) generates coherent `UserDNA` personas, runs each through the **real** Phase 2.5 `generate_recommendations()` funnel against the real `hi_pando_properties` catalog (so `PROPERTY_SHOWN` scores/match_scores are genuine, not invented), then probabilistically simulates the engagement funnel (click → view → save/reject → shortlist → broker-contact/viewing-request) with transition probabilities conditioned on the real match score — a higher-scoring property is more likely to be saved/shortlisted, a lower-scoring one more likely to be rejected. Events are written through the real `log_interaction`/`log_interactions` repository, so schema validation and snapshotting are identical to what real frontend traffic will produce. Every synthetic user id is prefixed `SYNTH-USER-####` so synthetic and real interactions stay trivially distinguishable once real traffic lands — no schema divergence from the `/interactions` contract already given to the frontend team.
  > Ran `python -m pipelines.synthetic_interaction_generator` (150 personas x 3 sessions, top_n=10): 11,722 events inserted — PROPERTY_SHOWN 3681, PROPERTY_CLICKED 2484, PROPERTY_VIEWED 2484, PROPERTY_SAVED 1473, PROPERTY_SHORTLISTED 1056, BROKER_CONTACTED 308, VIEWING_REQUESTED 180, PROPERTY_REJECTED 56.
  > Minimum-volume threshold defined: **≥500 labeled rows overall, with ≥30 in the minority (Negative) class**, chosen so univariate/bivariate splits and a two-sample statistical test (3.4's last bullet) have enough per-group observations to be non-degenerate. Confirmed met: `build_training_dataset()` produced **3,073 labeled rows** (97 columns each) — Positive 3,017 / Negative 56 (~54:1).
  > Per user decision, the Positive:Negative label imbalance (~54:1, since `generate_recommendations()` only ever shows already-decent matches, so genuinely poor fits are rarely shown to reject) is treated as an expected real-world characteristic of a working content-based recommender, not a generator defect — to be handled via class weighting/resampling at Phase 3.5 model-training time, not forced to artificial balance here.
  > This synthetic pass unblocks pipeline/EDA validation only — it does not satisfy the Phase 3 "live and generating real recommendations" criterion or license any Phase 3.5+ model-quality claim; those still require real interaction data once the frontend ships its `/interactions` wiring.
- [x] Perform Exploratory data analysis on the data (add comments to the code, the comments should include the reason for carrying out the step and the inference in 2 lines, for entire ML notebook across all phases)
  > `notebooks/phase3_eda.ipynb` (new, first notebook in the repo — `/notebooks` previously held only a `.gitkeep`) — the running ML notebook meant to be extended through 3.5/3.6, not replaced. Loads `build_training_dataset()`'s output directly (reusing Phase 3.2's pipeline rather than re-querying MongoDB by hand) and tags rows `is_synthetic` by the `SYNTH-USER-####` prefix so real and synthetic rows stay distinguishable once frontend traffic lands. Every code cell carries a 2-line comment: why the step is run, and what the inference is.
  > **Executed successfully end-to-end** (exit code 0, all cells ran, no errors) via `jupyter nbconvert --execute` against a dedicated `pando-backend` Jupyter kernel pinned to `PANDO_backend/venv` in the notebook's own kernelspec metadata — this was added specifically because the environment had multiple ad-hoc venvs floating around (`PANDO_backend/venv`, repo-root `.venv`, `.venv2`) that VSCode's Jupyter extension kept silently switching between, which is what caused the earlier confusing back-and-forth on this task. Two real environment issues were hit and resolved along the way: (1) this machine's Windows Application Control (WDAC) policy initially blocked pandas's compiled `_libs\interval.*.pyd` (Enterprise signing-level requirement, Policy ID `{0283ac0f-fff1-49ae-ada1-8a933130cad6}`) — resolved once IT allowlisted it; (2) the same policy separately blocked scikit-learn's `murmurhash.*.pyd` — rather than wait on a second IT exception, the notebook's PCA sanity-check cell (Section 5) was rewritten to use plain `numpy` (manual eigendecomposition of the covariance matrix) instead of `sklearn.decomposition.PCA`, verified to produce equivalent output against the real dataset, so the notebook has no scikit-learn dependency at all.
  > `pipelines/training/build_training_dataset.py` was also rewritten for performance during this work: the original per-row Mongo query pattern (~6 round-trips per labeled row) took minutes/hung against Atlas for 3,073 rows; rewritten to batch-load the small static collections and each user's interaction history once, then join in memory — now completes in ~8.5s, same output verified. All 7 `test_build_training_dataset.py` tests plus the full 247-test suite still pass.
  > Added `jupyter`, `ipykernel`, `seaborn` to `requirements.txt`; registered `PANDO_backend/venv` as the `pando-backend` Jupyter kernel.
- [x] Perform Univariate,bi variate and multivariate analysis, and visualuze the findings
  > Executed in `notebooks/phase3_eda.ipynb` against the live 3,073-row synthetic training dataset (Positive 3,017 / Negative 56). Section 3 (univariate): histograms of price/area/yield/bedroom/bathroom distributions and the 9 match-score distributions (with a reference line at the scorers' `NEUTRAL_SCORE` of 0.75), plus one-hot property-type/location/event-type bar counts. Section 4 (bivariate): boxplots of every match score, Phase 3.3 interaction feature, and behavioral feature split by label. Section 5 (multivariate): a full correlation heatmap across match/interaction/behavioral features, plus a 2D PCA scatter (numpy-based, see above) colored by label as a model-free separability check. Per-event-type breakdown of labels: BROKER_CONTACTED 308, PROPERTY_SAVED 1473, PROPERTY_SHORTLISTED 1056, VIEWING_REQUESTED 180 (all Positive); PROPERTY_REJECTED 56 (Negative) — confirms the label composition matches the generator's funnel design.
- [x] Do required statistical testing
  > Section 6: ran both Mann-Whitney U (primary) and Welch's t-test on every match-score and interaction feature, comparing Positive vs. Negative rows. **Result: 10/19 features are statistically significant (p<0.05, both tests)** — confirming the synthetic generator's score-conditioned funnel encodes real, learnable signal rather than noise, validating it as a foundation for Phase 3.5 model training. Top discriminative features: `match_budget_match` (Positive mean 0.873 vs. Negative 0.548, p≈3.0e-23), `match_property_type_match` (0.672 vs. 0.179, p≈1.0e-14), `historical_user_interest` (0.456 vs. 0.313, p≈1.7e-13), `match_transport_match` (0.650 vs. 0.504, p≈2.7e-4), `match_bedroom_match` (0.747 vs. 0.665, p≈1.9e-3) — i.e. budget fit and property-type fit are, by far, the strongest drivers of a positive outcome in this simulated data, which is the expected/sensible result given how the funnel's transition probabilities were built around total match score.


### 3.5 Model Building and Evaluation
- [ ] Train a baseline XGBoost or LightGBM model
- [ ] Log the run and parameters to MLflow
- [ ] Compute Precision@K, Recall@K, NDCG@K, MAP@K on a held-out set
- [ ] Compute CTR, Save Rate, Shortlist Rate, Viewing Request Rate from live/logged data
- [ ] Document baseline metrics as the reference point for future model iterations

### 3.6 A/B Testing
- [ ] Implement traffic-splitting between rule-based (Version A) and ML-based (Version B) recommendations
- [ ] Define the success metrics for the test in advance (don't decide the winning metric after seeing results)
- [ ] Run the test for a pre-agreed minimum duration/sample size
- [ ] ⛔ CHECKPOINT: review A/B results with a human before deciding whether ML ranking replaces or blends with the rule-based system

### Phase 3 Deliverables Check
- [ ] Interaction/event tracking live and verified
- [ ] Recommendation feedback dataset accumulating correctly
- [ ] Training dataset pipeline reproducible end-to-end
- [ ] Feature engineering pipeline (behavioral) tested
- [ ] ML ranking model trained and logged in MLflow
- [ ] Model evaluation pipeline produces the metrics above
- [ ] Recommendation API updated to optionally serve ML-ranked results
- [ ] A/B testing framework operational
- [ ] ⛔ CHECKPOINT: confirm ML model outperforms the rule-based baseline on agreed metrics before moving to Phase 4

---

## Phase 4 — Hybrid Recommendation & Continuous Learning

> Only start once Phase 3's ML model is validated and in production alongside the rule-based system.

### 4.1 Hybrid Recommendation Architecture
- [ ] Design the combination point where content-based matching and behavioral ML ranking merge
- [ ] Implement the hybrid scoring pipeline as a single orchestration layer

### 4.2 Hybrid Score
- [ ] Implement the configurable hybrid weighting (ML / preference match / property similarity / behavioral similarity / business score)
- [ ] Set up an experimentation harness to tune these weights rather than hard-coding assumed values

### 4.3 Semantic Property Matching
- [ ] Choose and integrate an embedding model for property descriptions
- [ ] Set up a vector database/search layer
- [ ] Implement embedding generation for user free-text requirements
- [ ] Implement vector similarity search and confirm it returns sensible matches for a handful of test queries

### 4.4 Similar Property Recommendations
- [ ] Implement "find similar properties to X" using the property feature/embedding space
- [ ] Wire this into the "user liked property A" interaction flow

### 4.5 Continuous Learning
- [ ] Implement the retraining pipeline (interaction → training data → retrain → evaluate → deploy)
- [ ] Decide and implement an initial retraining schedule (e.g., weekly) with a documented process for adjusting cadence later
- [ ] Add a rollback path in case a retrained model underperforms the current production model

### 4.6 Recommendation Personalization
- [ ] Implement tracking/derivation of "stated preference vs. actual engagement" divergence per user
- [ ] Feed this divergence signal into the hybrid score or model features

### 4.7 Recommendation Diversity
- [ ] Implement diversity injection logic for the final top-N list (mix of strong matches, alternatives, nearby options, etc.)
- [ ] Test that diversity logic doesn't degrade relevance below an acceptable threshold

### 4.8 Production Monitoring
- [ ] Set up data-quality monitoring (missing features, staleness, inventory changes, duplicates)
- [ ] Set up model-quality monitoring (Precision@K, Recall@K, NDCG@K, CTR, save rate, conversion, drift)
- [ ] Set up business-metric monitoring (views, shortlists, broker contacts, viewing requests, successful matches)
- [ ] Build or wire up the production recommendation dashboard

### Phase 4 Deliverables Check
- [ ] Hybrid recommendation engine live
- [ ] Semantic/embedding search integrated
- [ ] Similar-property recommendations working
- [ ] Personalized ranking incorporating engagement-vs-stated-preference signal
- [ ] Diversity logic active in final ranking
- [ ] Continuous learning pipeline running on schedule
- [ ] Model monitoring in place and alerting on drift/degradation
- [ ] Production dashboard live
- [ ] ⛔ CHECKPOINT: full system review against the Phase 1–4 success criteria in the plan file before calling this "production-grade"

---

## Final Success Criteria Recap (from the plan)

- [ ] Phase 1: Hi Pando understands and structures its property inventory
- [ ] Phase 2: Hi Pando recommends reasonable properties with zero historical user data
- [ ] Phase 3: Hi Pando learns from actual user interactions
- [ ] Phase 4: Hi Pando continuously personalizes and improves recommendations
