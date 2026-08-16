import Image from "next/image";
import { ProviderLogo } from "@/components/ProviderLogo";

export function DemoPreview() {
  return (
    <div className="mx-auto mt-12 max-w-[1000px] overflow-hidden rounded-xl border border-rule bg-blacktop shadow-[0_30px_80px_rgba(0,0,0,.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-ticket2/70 px-4 py-3 sm:flex-nowrap">
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:flex-nowrap">
          <div className="flex shrink-0 items-center gap-1.5">
            {["SportyBet", "MSport", "Stake.com", "football.com"].map((name) => (
              <ProviderLogo key={name} providerName={name} size={24} />
            ))}
          </div>
          <span className="truncate font-mono text-[11px] uppercase tracking-[1px] text-faint">
            slip № <span className="font-bold">SportyBet · MSport · Stake.com · football.com</span> — sample report
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose/80"></span>
          <span className="h-3 w-3 rounded-full bg-gold/80"></span>
          <span className="h-3 w-3 rounded-full bg-lime/80"></span>
        </span>
      </div>

      <div className="relative flex h-[560px] w-full bg-background overflow-hidden pointer-events-none select-none max-[820px]:h-[420px] max-[520px]:h-[280px]">
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
        <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-blacktop to-transparent" />
      </div>
    </div>
  );
}
