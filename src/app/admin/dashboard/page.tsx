import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage() {

  const supabase = await createClient();

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single();

  if (
    !profile ||
    profile.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  return (
    <AdminDashboard
      profile={profile}
    />
  );
}