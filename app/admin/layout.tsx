import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SIDEBAR_COOKIE } from "@/components/admin/nav";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The middleware already guards /admin; this re-check protects against a stale or bypassed edge.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/login?error=not_admin");

  const {
    data: { user },
  } = await createClient().auth.getUser();

  return (
    <AdminShell
      user={{ name: profile.full_name || "Administrator", email: user?.email ?? "", municipality: profile.municipality }}
      initialCollapsed={cookies().get(SIDEBAR_COOKIE)?.value === "collapsed"}
    >
      {children}
    </AdminShell>
  );
}
