# NexNav Day 4 — P01 App Shell, Routes, and Guards

**Version:** v1.0  
**Final status:** PASS  
**Date:** 2026-08-18

## 1. Delivered Structure

P01 established three layout layers without implementing later feature content:

- Public layout
- Protected application layout
- Event layout with Event Journey navigation

The protected pathless layout uses `ssr: false` so browser session resolution does not create an SSR redirect loop.

## 2. Final Route Foundation

### Public

- `/`
- `/login`
- `/register`

### Protected application

- `/dashboard`
- `/onboarding`
- `/profile`
- `/events/new`

### Event routes

- `/events/:eventId`
- `/events/:eventId/safety`
- `/events/:eventId/edit`
- `/events/:eventId/guide`
- `/events/:eventId/track/today`
- `/events/:eventId/reassess`
- `/events/:eventId/navigate`
- `/events/:eventId/summary/new`
- `/summaries/:summaryId`

Obsolete placeholder aliases were removed rather than preserved as a second route system.

## 3. Route Gates

- Unauthenticated protected access redirects to `/login`.
- Authenticated users with incomplete Onboarding are restricted to `/onboarding`.
- Completed users attempting `/onboarding` are redirected to `/dashboard`.
- Gate resolution displays a Skeleton.
- Profile read failure displays a retryable safe Error State.

The gate reads the existing Profile row and never inserts or upserts a Profile.

## 4. Navigation

Global navigation contains:

- 我的狀況
- 新增狀況追蹤
- 個人選單
  - 健康檔案
  - 登出

Final responsive behavior:

- Widths from the selected breakpoint upward show horizontal navigation.
- Mobile shows a three-line menu button and a right-side Sheet.
- No bottom navigation was added.

Event Journey order:

1. 狀況總覽
2. 改善方向
3. 今日追蹤
4. 追蹤變化
5. 就醫與專業支持方向
6. 摘要

Safety, Edit, and ready Summary routes are intentionally outside the Journey list.

## 5. Shared UI Foundation

P01 added shared Page Container, Page Header, Section Card, Primary CTA, Status Banner, Loading/Empty/Error states, Form Field, and responsive modal primitives using the existing design tokens and shadcn components.

## 6. Acceptance Evidence

- Protected-route unauthenticated redirects passed.
- Completed and incomplete Profile gates were later verified with real accounts during P02/P03.
- Desktop horizontal navigation and Mobile Sheet were manually verified during P05 final acceptance.
- Mobile Wizard rendered as a single column without horizontal overflow.
- Typecheck passed and no JavaScript console error was reported.

## 7. No-change Confirmation

P01 did not modify Supabase schema, RLS, triggers, functions, RPCs, migrations, Seed Content, Auth settings, or Profile creation behavior.
