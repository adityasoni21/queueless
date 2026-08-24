import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TokenLiveView from "@/components/queue/TokenLiveView";

interface TokenPageProps {
  params: Promise<{
    tokenId: string;
  }>;
}

export default async function TokenPage({
  params,
}: TokenPageProps) {
  const { tokenId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: token } = await supabase
    .from("tokens")
    .select(`
      *,
      services (
        name
      ),
      counters (
        id,
        name,
        location
      )
    `)
    .eq("id", tokenId)
    .eq("student_id", user.id)
    .single();

  if (!token) {
    notFound();
  }

  return (
    <TokenLiveView
      initialToken={token}
    />
  );
}