# NexNav B1-B — Symptom Catalog Controlled Deployment Verification

**Version:** v1.0  
**Date:** 2026-08-18  
**Outcome:** RESOLVED

## 1. Deployment Scope

The approved `B1-B_Symptom_Catalog_Seed_v1.0.sql` was executed in the existing NexNav Supabase project. The operation changed rows in `public.symptom_catalog` only.

No schema, RLS policy, trigger, constraint, index, function, RPC, grant, Auth setting, Profile, Event, or unrelated Seed Content was modified.

## 2. Verified Active Catalog

| code | category_name | display_name | Hero | Other |
|---|---|---|---:|---:|
| `headache` | 頭部與平衡感受 | 頭痛 | true | false |
| `dizziness` | 頭部與平衡感受 | 頭暈或不穩感 | false | false |
| `fatigue` | 精力與睡眠 | 疲倦或精神不濟 | true | false |
| `sleep_difficulty` | 精力與睡眠 | 睡眠困擾 | true | false |
| `abdominal_gastrointestinal_discomfort` | 消化與腹部 | 腹部或腸胃不適 | false | false |
| `muscle_joint_discomfort` | 肌肉與關節 | 肌肉或關節不適 | false | false |
| `nose_throat_discomfort` | 鼻子與喉嚨 | 鼻子或喉嚨不適 | false | false |
| `other` | 其他 | 其他不適 | false | true |

## 3. Aggregate Verification

| Check | Result |
|---|---:|
| Active rows | 8 |
| Supported Primary Symptoms excluding Other | 7 |
| Hero rows | 3 |
| Active Other rows | 1 |
| Health categories excluding Other | 5 |

Catalog fingerprint:

`4554a4b0788a11e78927aa7993b418ac`

## 4. Rerun Verification

The controlled SQL was rerun. The ordered eight rows and catalog fingerprint remained unchanged. No duplicate row or second active Other row was created.

## 5. Final Decision

B1 was resolved and the catalog was approved as the Seed-driven source for P05. The content remains a product taxonomy for user-reported discomfort, not a diagnostic taxonomy or Safety rule set.
