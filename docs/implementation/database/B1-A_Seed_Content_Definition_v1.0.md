# NexNav B1-A — Seed Content Definition

**Version:** v1.0  
**Status:** Locked for B1-B Seed Load  
**Product:** NexNav  
**Scope:** `symptom_catalog` only  
**Decision date:** 2026-08-18  

## 1. Purpose

This document defines the approved P0 symptom taxonomy required by the New Health Event flow. It supplies content for the existing `symptom_catalog` table and does not authorize any schema, RLS, trigger, constraint, index, function, RPC, migration, Auth, or frontend change.

NexNav records user-reported discomfort. These labels are not diagnoses, disease classifications, Safety results, treatment advice, or specialty mappings.

## 2. Locked Product Decisions

- Five user-facing health categories.
- Seven supported Primary Symptoms.
- One active `Other` row.
- One Health Event selects exactly one Primary Symptom.
- Hero options: `頭痛`, `疲倦或精神不濟`, `睡眠困擾`.
- Hero status affects display priority only. It does not indicate severity, urgency, diagnosis, or Safety status.
- Associated Symptoms reuse active catalog rows, excluding the selected Primary Symptom and the `Other` row.
- Custom associated-symptom text is stored only as user input and must not infer a disease, Safety result, Guide, or medical specialty.

## 3. Approved Catalog Rows

| display_order | code | category_code | category_name | display_name | description | is_primary_enabled | is_hero_group | is_other | is_active |
|---:|---|---|---|---|---|---:|---:|---:|---:|
| 10 | `headache` | `head_balance` | 頭部與平衡感受 | 頭痛 | 頭部出現疼痛、緊繃或壓迫等不適感。 | true | true | false | true |
| 20 | `dizziness` | `head_balance` | 頭部與平衡感受 | 頭暈或不穩感 | 感覺頭昏、輕飄、不穩，或周遭有旋轉感。 | true | false | false | true |
| 30 | `fatigue` | `energy_sleep` | 精力與睡眠 | 疲倦或精神不濟 | 感覺容易疲倦、精神不濟，或進行日常活動時比平常更容易感到耗力。 | true | true | false | true |
| 40 | `sleep_difficulty` | `energy_sleep` | 精力與睡眠 | 睡眠困擾 | 包含難以入睡、容易醒來、過早醒來或睡眠品質不佳。 | true | true | false | true |
| 50 | `abdominal_gastrointestinal_discomfort` | `digestive_abdominal` | 消化與腹部 | 腹部或腸胃不適 | 腹部出現疼痛、脹悶、噁心、消化不適或排便狀況改變等感受。 | true | false | false | true |
| 60 | `muscle_joint_discomfort` | `musculoskeletal` | 肌肉與關節 | 肌肉或關節不適 | 肌肉或關節出現痠痛、僵硬、緊繃或活動時不舒服的感受；可在補充描述中記錄部位。 | true | false | false | true |
| 70 | `nose_throat_discomfort` | `nose_throat` | 鼻子與喉嚨 | 鼻子或喉嚨不適 | 包含鼻塞、流鼻水、鼻子不舒服、喉嚨疼痛或刺激感；請以目前最困擾的感受進行評分，其他感受可填入相關症狀。 | true | false | false | true |
| 999 | `other` | `other` | 其他 | 其他不適 | 若上述選項不符合，可自行描述目前最主要的不適。 | true | false | true | true |

## 4. Category Mapping

| category_code | category_name | Included Primary Symptoms |
|---|---|---|
| `head_balance` | 頭部與平衡感受 | 頭痛；頭暈或不穩感 |
| `energy_sleep` | 精力與睡眠 | 疲倦或精神不濟；睡眠困擾 |
| `digestive_abdominal` | 消化與腹部 | 腹部或腸胃不適 |
| `musculoskeletal` | 肌肉與關節 | 肌肉或關節不適 |
| `nose_throat` | 鼻子與喉嚨 | 鼻子或喉嚨不適 |

`other` is a required technical category value for the active `Other` catalog row. It is not counted as one of the five user-facing health categories.

## 5. P05 Display and Selection Rules

1. Step 1 is titled `主要不適症狀`.
2. The user first selects a category using `category_name`.
3. The user then selects one Primary Symptom using `display_name`.
4. `category_code` and `code` remain internal and are never shown to users.
5. Only rows where `is_active = true` and `is_primary_enabled = true` may appear as Primary Symptoms.
6. Hero rows may be shown as priority shortcuts, but the full catalog remains available.
7. Selecting `其他不適` requires `custom_primary_symptom`, trimmed to 1–100 characters.
8. Custom text must not be interpreted as a diagnosis, Safety result, Guide selection, or specialty mapping.
9. Step 2 Associated Symptoms may reuse the six remaining non-Other active rows after excluding the selected Primary Symptom.
10. If catalog loading fails or returns no eligible rows, show a blocked/error state and disable progression. Do not use hardcoded fallback symptoms.

## 6. Content Boundaries

This definition does not include or approve:

- Safety questions, Safety rules, result logic, or rule versions.
- Guide factors, improvement suggestions, observation guidance, or source disclosure content.
- Medical specialty or professional-support mappings.
- Diagnosis, treatment, medication, or provider recommendations.
- Additional associated-symptom-only catalog rows.

Those items require separate approved content definitions.

## 7. Reference Basis

The taxonomy is a P0 product-scope decision, not a claim that medicine has one canonical seven-symptom taxonomy. The following authoritative consumer-health references were used only to verify that the labels and descriptions use recognizable symptom language:

- MedlinePlus — Dizziness and Vertigo: https://medlineplus.gov/dizzinessandvertigo.html
- MedlinePlus — Fatigue: https://medlineplus.gov/fatigue.html
- MedlinePlus — Sleep Disorders: https://medlineplus.gov/sleepdisorders.html
- MedlinePlus — Abdominal Pain: https://medlineplus.gov/ency/article/003120.htm
- MedlinePlus — Back Pain: https://medlineplus.gov/backpain.html
- MedlinePlus — Stuffy or Runny Nose: https://medlineplus.gov/ency/article/003049.htm
- MedlinePlus — Tension Headache: https://medlineplus.gov/ency/article/000797.htm

Source URLs are review evidence only. They are not columns in the existing `symptom_catalog` schema and must not be forced into the database.

## 8. B1-B Acceptance Criteria

B1 may be marked resolved only when all of the following pass:

1. Exactly eight approved active rows are present: seven supported symptoms and one `Other`.
2. All `code` values are unique and match this document.
3. Exactly one active row has `is_other = true`.
4. Exactly three active rows have `is_hero_group = true`, matching the locked Hero options.
5. The seven supported symptoms are primary-enabled.
6. Category codes, names, display names, descriptions, flags, and display order match this document.
7. Authenticated users can read active rows through the existing RLS policy.
8. Ordinary authenticated users cannot insert, update, or delete catalog rows.
9. No schema, RLS, trigger, constraint, index, function, RPC, Auth, or unrelated Seed Content is changed.
10. A rerun of the approved Seed load does not create duplicate rows or produce a second active `Other` row.

---

**B1-A status:** APPROVED AND LOCKED  
**Next step:** B1-B Seed SQL generation, review, controlled deployment, and verification.
