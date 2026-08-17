import { useEffect } from "react";
import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfileGate } from "@/hooks/useProfileGate";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { PageContainer, ErrorState, LoadingState } from "@/components/shell";

export const Route = createFileRoute("/_app")({
  // Session 儲存在瀏覽器端，SSR 讀不到；關閉 SSR 可避免 redirect loop。
  ssr: false,
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profileQuery = useProfileGate(user?.id);

  const onboardingCompleted = profileQuery.data?.onboarding_completed ?? null;
  const onOnboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (onboardingCompleted === null) return;

    if (!onboardingCompleted && !onOnboarding) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }

    if (onboardingCompleted && onOnboarding) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, isAuthenticated, onboardingCompleted, onOnboarding, navigate]);

  const gateResolved =
    !loading &&
    isAuthenticated &&
    onboardingCompleted !== null &&
    (onboardingCompleted ? !onOnboarding : onOnboarding);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav displayName={profileQuery.data?.display_name} />
      <main className="flex flex-1 flex-col">
        {profileQuery.isError ? (
          <PageContainer>
            <ErrorState onRetry={() => profileQuery.refetch()} />
          </PageContainer>
        ) : gateResolved ? (
          <Outlet />
        ) : (
          <PageContainer>
            <LoadingState />
          </PageContainer>
        )}
      </main>
    </div>
  );
}
