# NexNav MVP — Entity Relationship Diagram

**Version:** v1.0  
**Status:** Locked for Day 2 MVP Development  
**Source:** `03_Database_Schema.md v1.0`  
**Scope:** P0 Golden Path

---

## 1. Purpose

This document provides the implementation-facing Entity Relationship view of the NexNav P0 database. Field definitions, constraints, RLS, lifecycle rules, derived logic, and transaction boundaries remain governed by `03_Database_Schema.md v1.0`.

## 2. ER Diagram

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
    }

    PROFILES {
        uuid id PK,FK
        text display_name
        smallint birth_year
        text gender
        jsonb health_background
        boolean onboarding_completed
        timestamptz onboarding_completed_at
    }

    SYMPTOM_CATALOG {
        uuid id PK
        text code UK
        text category_code
        text display_name
        boolean is_hero_group
        boolean is_other
        boolean is_active
    }

    HEALTH_EVENTS {
        uuid id PK
        uuid user_id FK
        uuid primary_symptom_id FK
        text custom_primary_symptom
        text status
        date started_on
        timestamptz closed_at
    }

    INITIAL_RECORDS {
        uuid id PK
        uuid user_id FK
        uuid health_event_id FK,UK
        smallint severity
        smallint frequency_level
        integer duration_value
        text duration_unit
        jsonb associated_symptoms
        jsonb life_context
        integer revision
    }

    SAFETY_ASSESSMENTS {
        uuid id PK
        uuid user_id FK
        uuid health_event_id FK
        uuid source_daily_track_id FK
        text trigger_type
        integer record_revision
        text assessment_status
        jsonb answers_snapshot
        text result
        text rule_version
    }

    GUIDES {
        uuid id PK
        uuid user_id FK
        uuid health_event_id FK
        uuid safety_assessment_id FK
        integer record_revision
        integer version_number
        jsonb content_snapshot
        jsonb suggestions_snapshot
    }

    DAILY_TRACKS {
        uuid id PK
        uuid user_id FK
        uuid health_event_id FK
        uuid guide_id FK
        date track_date
        smallint severity
        smallint frequency_level
        text subjective_change
        jsonb life_context
        jsonb suggestion_execution
    }

    NAVIGATION_TEMPLATES {
        uuid id PK
        text code
        uuid symptom_id FK
        text navigation_type
        text safety_context
        jsonb content
        jsonb sources
        boolean is_fallback
        boolean is_active
        integer version
    }

    HEALTH_SUMMARIES {
        uuid id PK
        uuid user_id FK
        uuid health_event_id FK
        text summary_type
        text status
        jsonb snapshot_content
        integer source_record_revision
        date latest_track_date
        timestamptz source_data_updated_at
    }

    AUTH_USERS ||--|| PROFILES : has
    AUTH_USERS ||--o{ HEALTH_EVENTS : owns
    SYMPTOM_CATALOG ||--o{ HEALTH_EVENTS : classifies
    HEALTH_EVENTS ||--|| INITIAL_RECORDS : has
    HEALTH_EVENTS ||--o{ SAFETY_ASSESSMENTS : receives
    HEALTH_EVENTS ||--o{ GUIDES : receives
    HEALTH_EVENTS ||--o{ DAILY_TRACKS : contains
    HEALTH_EVENTS ||--o{ HEALTH_SUMMARIES : produces
    SAFETY_ASSESSMENTS ||--o{ GUIDES : supports
    GUIDES o|--o{ DAILY_TRACKS : applies_to
    DAILY_TRACKS o|--o{ SAFETY_ASSESSMENTS : may_trigger
    SYMPTOM_CATALOG o|--o{ NAVIGATION_TEMPLATES : maps_to
```

## 3. Cardinality Summary

| Parent | Child | Cardinality | Meaning |
|---|---|---|---|
| Auth User | Profile | 1:1 | Auth creation automatically creates one Profile |
| Auth User | Health Event | 1:N | A user may own multiple active and closed Events |
| Symptom Catalog | Health Event | 1:N | Each Event has one immutable Primary Symptom |
| Health Event | Initial Record | 1:1 | Each Event has exactly one editable baseline |
| Health Event | Safety Assessment | 1:N | Each Check/Recheck attempt is retained |
| Health Event | Guide | 1:N | Each refresh creates a new Guide version |
| Health Event | Daily Track | 1:N | Maximum one Track per Event per local day |
| Health Event | Health Summary | 1:N | Multiple historical ready snapshots are allowed |
| Guide | Daily Track | 1:N optional | Priority route may Track without a Guide |
| Daily Track | Safety Assessment | 1:N optional | A Track may trigger Recheck attempts |
| Symptom Catalog | Navigation Template | 1:N optional | Generic fallback may have no symptom |

## 4. Ownership Boundary

User-owned private tables:

- `profiles`
- `health_events`
- `initial_records`
- `safety_assessments`
- `guides`
- `daily_tracks`
- `health_summaries`

System-owned reference tables:

- `symptom_catalog`
- `navigation_templates`

Every private child row stores `user_id` and must match the owner of its referenced Health Event. Supabase RLS additionally requires `auth.uid()` to match that owner.

## 5. Lifecycle Rules

- Closing a Health Event preserves all child data.
- Primary Symptom, custom `Other` description, and Event start date are immutable.
- Initial Record content updates increment `revision` and invalidate older current Safety/Guide assumptions without deleting them.
- Safety and Guide history is append-oriented.
- Today’s Daily Track is editable; historical Tracks are read-only in P0.
- Ready Health Summaries are immutable snapshots.
- Reassess, Timeline, Current Safety, Current Guide, and Summary freshness are derived, not separate tables.

