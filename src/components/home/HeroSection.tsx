import Link from "next/link";

import { BookmarkletLink } from "./BookmarkletLink";

export function HeroSection({ activeProviderUrl }: { activeProviderUrl: string }) {
  return (
    <div className="mx-auto max-w-5xl text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rule bg-ticket2/40 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-gold">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gold"></span>
        </span>
        100% private · no account · no upload
      </div>
      <h1 className="mb-5 font-display text-[clamp(38px,10vw,60px)] font-black uppercase text-balance max-[820px]:text-[clamp(32px,10vw,58px)] leading-none">
        Your Bookie Knows Your Numbers. Now You Do Too.
      </h1>
      <p className="mx-auto max-w-3xl text-[17px] leading-relaxed text-faint">
        Puntrlytics turns your scattered bet history into a real profit/loss dashboard — win rate, ROI, biggest wins and losses, broken down by sport and stake.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
        <BookmarkletLink
          url={activeProviderUrl}
          className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-lime px-8 py-[14px] text-[17px] font-bold leading-none text-blacktop no-underline shadow-[0_16px_38px_rgba(65,212,132,.25)] transition hover:-translate-y-0.5 hover:bg-[#54dd8e] hover:shadow-[0_22px_44px_rgba(65,212,132,.35)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan motion-reduce:transition-none max-[520px]:w-full"
        >
          Analyze my bets

        </BookmarkletLink>

        <Link href="/demo" className="font-utility font-bold uppercase tracking-wider text-sm text-gold transition hover:text-cyan">
          View sample report
        </Link>
      </div>

      <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[1.8px] text-faint max-[820px]:hidden">
        Drag the button to your bookmarks bar
      </p>
    </div>
  );
}
