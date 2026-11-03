import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen, CalendarDays, Megaphone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/me";
import { Loading, ErrorState, Empty } from "@/components/States";

type DashboardAnnouncement = {
  id: string;
  created_at: string;
  title: string;
  body: string;
  courses: { code: string } | null;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GU Tech LMS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useMe();
  const stats = useQuery({
    queryKey: ["stats", me?.role],
    queryFn: async () => {
      const [c, a] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase
          .from("announcements")
          .select("id,title,body,created_at,course_id,courses(code)", { count: "exact" })
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (c.error) throw c.error;
      if (a.error) throw a.error;
      let users = 0;
      if (me?.role === "admin") {
        const u = await supabase.from("profiles").select("id", { count: "exact", head: true });
        if (u.error) throw u.error;
        users = u.count ?? 0;
      }
      return {
        courses: c.count ?? 0,
        users,
        announcements: a.data,
        announcementCount: a.count ?? 0,
      };
    },
    enabled: !!me,
  });

  if (!me) return <Loading />;
  const firstName = me.profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const roleDescription =
    me.role === "admin"
      ? "Manage your learning community and keep everything running smoothly."
      : me.role === "teacher"
        ? "Your classes, course updates, and teaching tools are all in one place."
        : "Pick up where you left off and stay up to date with your courses.";

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-2xl bg-hero px-6 py-7 text-primary-foreground shadow-card sm:px-9 sm:py-9">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-2 -top-16 -z-10 h-56 w-56 rounded-full border border-white/10"
        />
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{greeting}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{firstName}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">
              {roleDescription}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-primary-foreground/85 sm:self-auto">
            <CalendarDays className="h-4 w-4 text-gold" />
            <span>{today}</span>
          </div>
        </div>
      </section>

      {stats.isLoading ? (
        <Loading />
      ) : stats.error ? (
        <ErrorState error={stats.error} />
      ) : (
        <>
          <section
            aria-label="Portal overview"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <Stat
              icon={BookOpen}
              label={
                me.role === "admin"
                  ? "Courses"
                  : me.role === "teacher"
                    ? "My classes"
                    : "My courses"
              }
              value={stats.data!.courses}
              to="/courses"
              detail="View your course directory"
            />
            {me.role === "admin" && (
              <Stat
                icon={Users}
                label="People"
                value={stats.data!.users}
                to="/users"
                detail="Manage students and staff"
              />
            )}
            <Stat
              icon={Megaphone}
              label="Recent announcements"
              value={stats.data!.announcementCount}
              to="/announcements"
              detail="Read the latest updates"
            />
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.8fr)]">
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Campus updates
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">Latest announcements</h2>
                </div>
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {stats.data!.announcements.length === 0 ? (
                <Empty
                  title="No announcements yet"
                  hint="New updates from your courses will appear here."
                />
              ) : (
                <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
                  {stats.data!.announcements.map((a: DashboardAnnouncement) => (
                    <article key={a.id} className="p-4 transition-colors hover:bg-muted/40 sm:p-5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                          {a.courses?.code ?? "GU Tech"}
                        </span>
                        <span>
                          {new Date(a.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold">{a.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {a.body}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="rounded-xl border bg-card p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Get started
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight">Quick access</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jump straight to the tools you use most.
              </p>
              <div className="mt-4 space-y-2">
                <QuickLink
                  to="/courses"
                  icon={BookOpen}
                  title={me.role === "student" ? "My courses" : "Courses"}
                  detail="Browse course spaces"
                />
                {me.role === "admin" && (
                  <QuickLink
                    to="/users"
                    icon={Users}
                    title="People"
                    detail="Manage portal accounts"
                  />
                )}
                <QuickLink
                  to="/announcements"
                  icon={Megaphone}
                  title="Announcements"
                  detail="Updates from your community"
                />
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  to,
  detail,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  to: "/courses" | "/users" | "/announcements";
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  detail,
}: {
  to: "/courses" | "/users" | "/announcements";
  icon: typeof BookOpen;
  title: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/70 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
