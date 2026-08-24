import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xl font-black tracking-tight">Queueless</p>
            <p className="text-xs text-slate-400">Smart Campus Queue Management</p>
          </div>
          <Link href="/login" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Login</Link>
        </div>
      </nav>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Smart Campus Administration</div>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 md:text-7xl">Stop waiting.<br /><span className="text-blue-600">Start queuing virtually.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Queueless lets students book virtual tokens, track their position in real time, and arrive only when their turn is approaching.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/login" className="rounded-2xl bg-blue-600 px-7 py-4 font-semibold text-white shadow-sm hover:bg-blue-700">Join the Queue →</Link>
            <Link href="/login" className="rounded-2xl border bg-white px-7 py-4 font-semibold text-slate-700 hover:bg-slate-50">Staff Login</Link>
          </div>
        </div>
      </section>
      <section className="border-y bg-white"><div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-3"><Feature title="Virtual Tokens" description="Students join a digital queue instead of standing in crowded corridors." /><Feature title="Live ETA" description="Queue position and estimated waiting time update automatically." /><Feature title="Smart Notifications" description="Students are alerted when their turn is approaching." /></div></section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center"><p className="text-sm font-semibold text-blue-600">HOW IT WORKS</p><h2 className="mt-2 text-3xl font-bold">From queue to counter in four steps</h2></div>
        <div className="mt-12 grid gap-6 md:grid-cols-4"><Step number="01" title="Select Service" description="Choose the administrative service you need." /><Step number="02" title="Get Token" description="Receive a digital token and estimated waiting time." /><Step number="03" title="Track Queue" description="Leave the crowded area and monitor your position." /><Step number="04" title="Arrive & Serve" description="Come to the counter when your turn approaches." /></div>
      </section>
      <footer className="border-t bg-white"><div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-400">Queueless · Smart Queue Management for Campuses</div></footer>
    </main>
  );
}

function Feature({ title, description }: { title: string; description: string }) { return <div className="border-b p-8 md:border-b-0 md:border-r last:border-r-0"><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>; }
function Step({ number, title, description }: { number: string; title: string; description: string }) { return <div className="rounded-2xl border bg-white p-6"><span className="text-sm font-bold text-blue-600">{number}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>; }
