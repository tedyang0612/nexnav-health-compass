import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_public/register")({
  head: () => ({
    meta: [
      { title: "建立帳號 — NexNav" },
      { name: "description", content: "建立 NexNav 健康導航平台帳號。" },
      { property: "og:title", content: "建立帳號 — NexNav" },
      { property: "og:description", content: "建立 NexNav 健康導航平台帳號。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INPUT_CLASS =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive";

const GENERIC_ERROR = "目前無法建立帳號，請稍後再試一次。";

type Field = "email" | "password" | "confirmPassword";
type Values = { email: string; password: string; confirmPassword: string };
type Errors = Partial<Record<Field, string>>;

function validateField(field: Field, v: Values) {
  if (field === "email") {
    const value = v.email.trim();
    if (!value) return "請輸入 Email。";
    if (!EMAIL_RE.test(value)) return "Email 格式不正確。";
    return undefined;
  }
  if (field === "password") {
    if (!v.password) return "請輸入密碼。";
    if (v.password.length < 8) return "密碼至少需要 8 個字元。";
    return undefined;
  }
  if (!v.confirmPassword) return "請再次輸入密碼。";
  if (v.confirmPassword !== v.password) return "兩次輸入的密碼不一致。";
  return undefined;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const submitting = useRef(false);
  const refs = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  };

  const values: Values = { email, password, confirmPassword };

  function handleBlur(field: Field) {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  }

  function clearFieldError(field: Field) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError(null);

    const next: Errors = {
      email: validateField("email", values),
      password: validateField("password", values),
      confirmPassword: validateField("confirmPassword", values),
    };
    setErrors(next);
    const firstInvalid = (["email", "password", "confirmPassword"] as Field[]).find(
      (f) => next[f],
    );
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      // Profile 由既有 Auth Trigger 建立，前端不做任何 profiles 寫入。
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already been")) {
          setFormError("此 Email 已無法用於建立帳號，請改用其他 Email 或直接登入。");
        } else if (msg.includes("password")) {
          setFormError("密碼不符合安全需求，請改用更強的密碼。");
        } else {
          setFormError(GENERIC_ERROR);
        }
        setPassword("");
        setConfirmPassword("");
        return;
      }

      if (data.session) {
        // Email Confirmation 已關閉：註冊後直接取得 session。
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      // 未取得 session（Email Confirmation 仍啟用）：保留安全提示，不修改任何設定。
      setPendingConfirmation(true);
    } catch {
      setFormError(GENERIC_ERROR);
      setPassword("");
      setConfirmPassword("");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            請確認您的信箱
          </h1>
          <p className="text-sm text-muted-foreground">
            我們已寄出一封驗證信到{" "}
            <span className="font-medium text-foreground">{email.trim()}</span>
            。請點擊信中的連結完成帳號驗證，之後即可登入 NexNav。
          </p>
          <p className="text-sm text-muted-foreground">
            沒有收到？請檢查垃圾郵件匣，或稍候幾分鐘再試一次。
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
            建立 NexNav 帳號
          </h1>
          <p className="text-sm text-muted-foreground">
            使用 Email 與密碼建立帳號。
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span aria-hidden="true">⚠</span>
            <span>{formError}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              ref={refs.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              onBlur={() => handleBlur("email")}
              placeholder="hello@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                <span aria-hidden="true">⚠ </span>
                {errors.email}
              </p>
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
              ref={refs.password}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              onBlur={() => handleBlur("password")}
              placeholder="至少 8 個字元"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error password-hint" : "password-hint"
              }
              className={INPUT_CLASS}
            />
            <p id="password-hint" className="text-xs text-muted-foreground">
              密碼至少需要 8 個字元。
            </p>
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                <span aria-hidden="true">⚠ </span>
                {errors.password}
              </p>
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
              ref={refs.confirmPassword}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
              onBlur={() => handleBlur("confirmPassword")}
              placeholder="再次輸入密碼"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              className={INPUT_CLASS}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-xs text-destructive">
                <span aria-hidden="true">⚠ </span>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner />
                <span>{"<建立帳號中>"}</span>
              </>
            ) : (
              "建立帳號"
            )}
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

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}
