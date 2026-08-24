import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckInButton from "@/components/staff/CheckInButton";

interface Props { params: Promise<{ tokenId: string }> }

export default async function CheckInPage({ params }: Props) {
  const { tokenId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/staff/check-in/${tokenId}`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["STAFF", "ADMIN"].includes(profile.role)) redirect("/dashboard");

  const { data: token } = await supabase.from("tokens").select(`id,token_number,status,arrived_at,services(name),counters(name,location)`).eq("id", tokenId).single();
  if (!token) return <Result title="Token not found" message="This QR code is invalid or the token no longer exists." />;

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
    <p className="text-sm font-semibold text-blue-600">CampusQueue</p>
    <h1 className="mt-2 text-3xl font-bold">Student Check-in</h1>
    <div className="mt-8 rounded-2xl bg-slate-50 p-6"><p className="text-sm text-slate-500">Token</p><p className="mt-1 text-5xl font-black">{token.token_number}</p><p className="mt-3 font-medium">{token.services?.name}</p><p className="mt-1 text-sm text-slate-500">{token.counters?.name}</p></div>
    {token.status === "CALLED" ? <CheckInButton tokenId={token.id} alreadyCheckedIn={!!token.arrived_at}/> : <div className="mt-6 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">This token is currently {token.status}.</div>}
  </div></main>;
}

function Result({ title, message }: { title:string; message:string }) { return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-slate-500">{message}</p></div></main>; }
