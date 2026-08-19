-- P08-B1.1 Guide Direct Insert Lockdown
-- 1. 移除 authenticated 直接 INSERT public.guides 的 RLS policy
DROP POLICY IF EXISTS "guides_insert_own" ON public.guides;

-- 2. 撤銷 anon 與 authenticated 對 public.guides 的寫入權限
-- 保留 SELECT；service_role 與 database owner 權限不受影響
REVOKE INSERT, UPDATE, DELETE ON public.guides FROM anon, authenticated;

-- 3. 確保 RPC 僅由 authenticated / service_role 執行，移除 anon / public 的執行權（若存在）
REVOKE EXECUTE ON FUNCTION public.create_guide_for_event(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_guide_for_event(uuid) TO authenticated, service_role;