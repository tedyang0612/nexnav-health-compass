import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_public/login")({
  head: () => ({
    meta: [
      { title: "登入 — NexNav" },
      { name: "description", content: "登入 NexNav 健康導航平台。" },
      { property: "og:title", content: "登入 — NexNav" },
      { property: "og:description", content: "登入 NexNav 健康導航平台。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "請輸入電子郵件。";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "電子郵件格式不正確。";
    if (!password) next.password = "請輸入密碼。";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials")) {
          setFormError("電子郵件或密碼不正確，請再試一次。");
        } else if (msg.includes("email not confirmed")) {
          setFormError("此帳號尚未完成驗證，請先前往信箱點擊驗證信。");
        } else if (msg.includes("too many")) {
          setFormError("嘗試次數過多，請稍後再試。");
        } else {
          setFormError("登入時發生問題，請稍後再試。");
        }
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setFormError("登入時發生問題，請稍後再試。");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        navigate({ to: "/onboarding", replace: true });
      }
    } catch {
      setFormError("網路連線異常，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            登入 NexNav
          </h1>
          <p className="text-sm text-muted-foreground">
            使用您的電子郵件與密碼登入。
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              aria-invalid={!!errors.email}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              密碼
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "登入中…" : "登入"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          還沒有帳號？{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            註冊
          </Link>
        </p>
      </div>
    </div>
  );
}
