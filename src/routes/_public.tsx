import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { BrandMark } from "@/components/layout/GlobalNav";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="nexnav-public-bg flex min-h-[100dvh] flex-col">
      <header className="nexnav-public-header w-full">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark to="/" />
          <nav aria-label="次要導覽" className="flex items-center gap-1">
            <Link
              to="/login"
              activeProps={{ className: "bg-primary text-primary-foreground shadow-brand hover:bg-primary hover:text-primary-foreground" }}
              className="inline-flex min-h-11 min-w-[54px] items-center justify-center rounded-xl px-4 text-sm font-medium text-[#C9D8E8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#040E1E]"
            >
              登入
            </Link>
            <Link
              to="/register"
              activeProps={{ className: "bg-primary text-primary-foreground shadow-brand hover:bg-primary hover:text-primary-foreground" }}
              className="inline-flex min-h-11 min-w-[54px] items-center justify-center rounded-xl px-4 text-sm font-medium text-[#C9D8E8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#040E1E]"
            >
              註冊
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="nexnav-public-footer py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm sm:px-6 lg:px-8">
          © {new Date().getFullYear()} NexNav. 保留所有權利。
        </div>
      </footer>

    </div>
  );
}
