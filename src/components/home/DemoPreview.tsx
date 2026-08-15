import Image from "next/image";
import { ProviderLogo } from "@/components/ProviderLogo";

export function DemoPreview() {
  return (
    <div className="mx-auto mt-12 max-w-[1000px] overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-blacktop)] shadow-[0_30px_80px_rgba(0,0,0,.35)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-rule)] bg-[var(--color-ticket2)]/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="rounded-full ring-2 ring-[var(--color-ticket2)] z-10"><ProviderLogo providerName="sporty" size={24} /></div>
            <div className="rounded-full ring-2 ring-[var(--color-ticket2)] z-0"><ProviderLogo providerName="football.com" size={24} /></div>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[1px] text-[var(--color-faint)]">
            slip № <span className="font-bold">SportyBet / football.com</span> — sample report
          </span>
        </div>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[var(--color-rose)]/80"></span>
          <span className="h-3 w-3 rounded-full bg-[var(--color-gold)]/80"></span>
          <span className="h-3 w-3 rounded-full bg-[var(--color-lime)]/80"></span>
        </span>
      </div>

      <div className="relative flex h-[560px] w-full bg-[var(--color-background)] overflow-hidden pointer-events-none select-none max-[820px]:h-[420px]">
        {/* We use a static image for the preview. You will need to drop a screenshot into the public folder. */}
        <div className="absolute inset-0">
          <Image
            src="/dashboard-demo.png"
            alt="Dashboard Preview"
            fill
            className="object-cover object-top opacity-90"
            unoptimized
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[var(--color-blacktop)] to-transparent" />
      </div>
    </div>
  );
}
