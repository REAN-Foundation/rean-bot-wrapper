-- Check entity schemas for Dialogflow symptom flow intents

-- 1. Main intent: conditionIdentification
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    JSON_PRETTY(entitySchema) as entitySchema
FROM intents
WHERE code = 'conditionIdentification';

-- 2. More symptoms intent
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    JSON_PRETTY(entitySchema) as entitySchema
FROM intents
WHERE code = 'MoreSymptoms';

-- 3. Followup intent
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    entitySchema
FROM intents
WHERE code = 'KerotoplastyFollowUp';

-- 4. Eye image intent
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    JSON_PRETTY(entitySchema) as entitySchema
FROM intents
WHERE code = 'eyeImage';

-- 5. Response Yes intent
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    entitySchema
FROM intents
WHERE code = 'responseYes';

-- 6. Response No intent
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    entitySchema
FROM intents
WHERE code = 'responseNo';

-- Summary: All 6 intents
SELECT
    code,
    name,
    responseType,
    llmEnabled,
    active,
    CASE
        WHEN entitySchema IS NULL THEN 'No entities'
        ELSE JSON_EXTRACT(entitySchema, '$')
    END as has_entities
FROM intents
WHERE code IN (
    'conditionIdentification',
    'MoreSymptoms',
    'KerotoplastyFollowUp',
    'eyeImage',
    'responseYes',
    'responseNo'
)
ORDER BY
    CASE code
        WHEN 'conditionIdentification' THEN 1
        WHEN 'MoreSymptoms' THEN 2
        WHEN 'KerotoplastyFollowUp' THEN 3
        WHEN 'eyeImage' THEN 4
        WHEN 'responseYes' THEN 5
        WHEN 'responseNo' THEN 6
    END;
