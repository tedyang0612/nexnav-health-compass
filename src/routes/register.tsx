import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "註冊 — NexNav" },
      { name: "description", content: "註冊 NexNav 健康導航平台帳號。" },
      { property: "og:title", content: "註冊 — NexNav" },
      { property: "og:description", content: "註冊 NexNav 健康導航平台帳號。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "請輸入電子郵件。";
    else if (!EMAIL_RE.test(email.trim())) next.email = "電子郵件格式不正確。";
    if (!password) next.password = "請輸入密碼。";
    else if (password.length < 8) next.password = "密碼至少需要 8 個字元。";
    if (!confirmPassword) next.confirmPassword = "請再次輸入密碼。";
    else if (confirmPassword !== password)
      next.confirmPassword = "兩次輸入的密碼不一致。";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already been")) {
          setFormError("此電子郵件已註冊，請直接登入。");
        } else if (msg.includes("password")) {
          setFormError("密碼不符合安全需求，請改用更強的密碼。");
        } else {
          setFormError("註冊時發生問題，請稍後再試。");
        }
        return;
      }

      setSent(true);
    } catch {
      setFormError("網路連線異常，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            請確認您的信箱
          </h1>
          <p className="text-sm text-muted-foreground">
            我們已寄出一封驗證信到 <span className="font-medium text-foreground">{email.trim()}</span>
            。請點擊信中的連結完成帳號驗證，之後即可登入 NexNav。
          </p>
          <p className="text-sm text-muted-foreground">
            沒有收到？請檢查垃圾郵件匣，或稍候幾分鐘再試一次。
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            註冊 NexNav
          </h1>
          <p className="text-sm text-muted-foreground">
            建立帳號後，我們會寄送驗證信給您。
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 個字元"
              aria-invalid={!!errors.password}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground"
            >
              確認密碼
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入密碼"
              aria-invalid={!!errors.confirmPassword}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "註冊中…" : "註冊"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          已經有帳號？{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
