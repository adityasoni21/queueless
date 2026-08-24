import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRouter() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Profile lookup failed:", error);
    redirect("/login");
  }

  console.log(
    "Dashboard router:",
    user.id,
    profile.role
  );

  if (profile.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (profile.role === "STAFF") {
    redirect("/staff/dashboard");
  }

  redirect("/student/dashboard");
}