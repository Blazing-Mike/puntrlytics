import Link from "next/link";

export function HeroSection({ activeProviderUrl }: { activeProviderUrl: string }) {
  return (
    <div className="mx-auto max-w-[680px] text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-ticket2)]/40 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--color-gold)]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-gold)] opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-gold)]"></span>
        </span>
        Betlytics
      </div>
      <h1 className="mb-5 font-display text-[clamp(38px,6vw,76px)] font-black uppercase leading-[.9] max-[820px]:text-[clamp(32px,10vw,58px)]">
        Betlytics
      </h1>
      <p className="mx-auto max-w-[560px] text-[17px] leading-relaxed text-[var(--color-faint)]">
        Your betting site won't tell you if you're actually making money.
        Get instant insights into your true <span className="font-bold text-[var(--color-ink)]">profit, ROI, and win-rate.</span> No
        account, no install, no upload.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
        <a
          id="ba-bookmarklet"
          className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--color-lime)] px-8 py-[14px] text-[17px] font-bold leading-none text-[var(--color-blacktop)] no-underline shadow-[0_16px_38px_rgba(65,212,132,.25)] transition hover:-translate-y-0.5 hover:bg-[#54dd8e] hover:shadow-[0_22px_44px_rgba(65,212,132,.35)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-cyan)] motion-reduce:transition-none max-[520px]:w-full"
          href={activeProviderUrl}
        >
          Analyze my bets
          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </a>

        <Link href="/demo" className="font-utility font-bold uppercase tracking-wider text-sm text-[var(--color-gold)] transition hover:text-[var(--color-cyan)]">
          View sample report
        </Link>
      </div>

      <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[1.8px] text-[var(--color-faint)] max-[820px]:hidden">
        Drag the button to your bookmarks bar
      </p>
    </div>
  );
}
