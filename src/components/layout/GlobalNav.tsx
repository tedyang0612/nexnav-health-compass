import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import nexnavLogo from "@/assets/nexnav-logo.png.asset.json";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { to: "/dashboard", label: "狀況總覽" },
  { to: "/events/new", label: "新增狀況追蹤" },
] as const;

export function BrandMark({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center gap-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <img
        src={nexnavLogo.url}
        alt="NexNav"
        width={48}
        height={36}
        className="h-9 w-12 object-contain"
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        NexNav
      </span>
    </Link>
  );
}


export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/login", replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return { signOut, signingOut };
}

export function GlobalNav({
  displayName,
}: {
  displayName?: string | null | undefined;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, signingOut } = useSignOut();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-surface/90 backdrop-blur-md print:hidden">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark to="/dashboard" />

        {/* Desktop */}
        <nav aria-label="主導覽" className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" }}
              className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="ml-1 min-h-11 gap-2"
                aria-label="個人選單"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {(displayName?.trim()?.[0] ?? "N").toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-sm">
                  {displayName?.trim() || "我的帳號"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>個人選單</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">健康檔案</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={signingOut}
                onSelect={(e) => {
                  e.preventDefault();
                  void signOut();
                }}
              >
                {signingOut ? "登出中…" : "登出"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 sm:hidden"
              aria-label="開啟選單"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm">
            <SheetHeader>
              <SheetTitle>選單</SheetTitle>
            </SheetHeader>
            <nav aria-label="主導覽" className="flex flex-col gap-1 px-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  activeProps={{ className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" }}
                  className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                activeProps={{ className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" }}
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                健康檔案
              </Link>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {signingOut ? "登出中…" : "登出"}
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
