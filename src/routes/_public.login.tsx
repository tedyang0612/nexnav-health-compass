import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
const INPUT_CLASS =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive";

type Field = "email" | "password";
type Errors = Partial<Record<Field, string>>;

/** 統一的登入失敗訊息，避免洩漏帳號是否存在。 */
const CREDENTIALS_ERROR = "Email 或密碼不正確，請重新確認。";
const GENERIC_ERROR = "目前無法完成登入，請稍後再試一次。";

function validateField(field: Field, values: { email: string; password: string }) {
  if (field === "email") {
    const value = values.email.trim();
    if (!value) return "請輸入 Email。";
    if (!EMAIL_RE.test(value)) return "Email 格式不正確。";
    return undefined;
  }
  if (!values.password) return "請輸入密碼。";
  return undefined;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function handleBlur(field: Field) {
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, { email, password }),
    }));
  }

  function clearFieldError(field: Field) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError(null);

    const next: Errors = {
      email: validateField("email", { email, password }),
      password: validateField("password", { email, password }),
    };
    setErrors(next);
    if (next.email) {
      emailRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        // 憑證相關錯誤一律使用同一則訊息。
        const msg = (error?.message ?? "").toLowerCase();
        const isCredentialIssue =
          !error ||
          msg.includes("invalid") ||
          msg.includes("credential") ||
          msg.includes("password") ||
          msg.includes("user not found") ||
          msg.includes("email not confirmed");
        setFormError(isCredentialIssue ? CREDENTIALS_ERROR : GENERIC_ERROR);
        setPassword("");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .maybeSingle();

      navigate({
        to: profile?.onboarding_completed ? "/dashboard" : "/onboarding",
        replace: true,
      });
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      submitting.current = false;
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
            使用您的 Email 與密碼登入。
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
              ref={emailRef}
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
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              onBlur={() => handleBlur("password")}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                <span aria-hidden="true">⚠ </span>
                {errors.password}
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
                <span>{"<登入中>"}</span>
              </>
            ) : (
              "登入"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          還沒有帳號？{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            建立帳號
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
