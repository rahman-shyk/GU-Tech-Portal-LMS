import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Megaphone,
  LogOut,
  KeyRound,
  BarChart3,
  MessageSquareWarning,
  ChevronRight,
} from "lucide-react";
import logo from "@/assets/images.png";
import { supabase } from "@/integrations/supabase/client";
import { meQuery, useMe } from "@/lib/me";
import { Loading } from "@/components/States";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (me?.profile?.must_change_password && location.pathname !== "/change-password") {
      throw redirect({ to: "/change-password" });
    }
  },
  component: Shell,
});

function Shell() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const loc = useLocation();
  if (!me) return <Loading />;
  const role = me.role;
  const initials =
    me.profile?.full_name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "GU";
  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    {
      to: "/courses",
      label: role === "admin" ? "Courses" : role === "teacher" ? "My Classes" : "My Courses",
      icon: BookOpen,
      show: true,
    },
    { to: "/users", label: "Users", icon: Users, show: role === "admin" },
    {
      to: "/grades",
      label: role === "student" ? "My Grades" : "Gradebook",
      icon: BarChart3,
      show: true,
    },
    { to: "/announcements", label: "Announcements", icon: Megaphone, show: true },
    { to: "/complaints", label: "Complaints", icon: MessageSquareWarning, show: true },
    { to: "/change-password", label: "Password", icon: KeyRound, show: true },
  ] as const;
  const activePage = nav.find((item) => loc.pathname.startsWith(item.to));

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 z-20 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <img
            src={logo}
            alt="GU Tech — Ghazali University School of Technology"
            className="h-auto w-full rounded-md"
          />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50">
            Learning portal
          </p>
        </div>
        <div className="px-5 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          Workspace
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3">
          {nav
            .filter((n) => n.show)
            .map((n) => {
              const active = activePage?.to === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                >
                  <n.icon
                    className={`h-4 w-4 ${active ? "" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground"}`}
                  />
                  <span className="flex-1">{n.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                </Link>
              );
            })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/70 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {me.profile?.full_name || me.user.email}
              </p>
              <p className="mt-0.5 text-[11px] capitalize text-sidebar-foreground/55">{role}</p>
            </div>
            <button
              aria-label="Sign out"
              onClick={signOut}
              className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <p className="px-3 pt-3 text-[10px] text-sidebar-foreground/40">
            Ghazali University · GU Tech
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 hidden h-[72px] items-center justify-between border-b bg-card/95 px-8 backdrop-blur md:flex">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              GU Tech · Learning portal
            </p>
            <p className="mt-0.5 text-sm font-semibold">{activePage?.label ?? "Portal"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold">{me.profile?.full_name || "GU Tech User"}</p>
              <p className="text-[11px] capitalize text-muted-foreground">{role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-accent text-xs font-bold text-primary">
              {initials}
            </div>
          </div>
        </header>
        <header className="border-b bg-card px-4 pb-0 pt-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="GU Tech"
                className="h-9 w-12 rounded object-cover object-center"
              />
              <div>
                <p className="text-xs font-bold">GU Tech</p>
                <p className="text-[10px] text-muted-foreground">
                  {activePage?.label ?? "Learning portal"}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
          <nav aria-label="Main navigation" className="mt-3 flex gap-1 overflow-x-auto pb-2">
            {nav
              .filter((n) => n.show)
              .map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${activePage?.to === n.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <n.icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 md:p-8 lg:px-10 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
