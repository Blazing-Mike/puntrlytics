export function DesktopSteps() {
  return (
    <div className="my-[18px] grid grid-cols-3 gap-2.5 max-[820px]:hidden">
      <div className="h-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-ticket)]/90 p-[18px] transition hover:-translate-y-0.5 hover:border-[var(--color-gold)]/40 max-[520px]:p-[15px]">
        <span className="mb-2.5 block font-utility text-xs font-black uppercase tracking-[1.4px] text-[var(--color-gold)]">
          Step 1
        </span>
        <h3 className="mb-1.5 text-[15px] font-bold">Drag the button above</h3>
        <p className="text-[13px] leading-relaxed text-[var(--color-faint)]">
          Drag “Analyze my bets” into your bookmarks bar. If the bar is hidden, press Ctrl+Shift+B.
        </p>
      </div>
      <div className="h-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-ticket)]/90 p-[18px] transition hover:-translate-y-0.5 hover:border-[var(--color-gold)]/40 max-[520px]:p-[15px]">
        <span className="mb-2.5 block font-utility text-xs font-black uppercase tracking-[1.4px] text-[var(--color-gold)]">
          Step 2
        </span>
        <h3 className="mb-1.5 text-[15px] font-bold">Log in</h3>
        <p className="text-[13px] leading-relaxed text-[var(--color-faint)]">
          Log in to either <span className="font-bold text-[var(--color-ink)]">SportyBet</span> or <span className="font-bold text-[var(--color-ink)]">football.com</span>.
        </p>
      </div>
      <div className="h-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-ticket)]/90 p-[18px] transition hover:-translate-y-0.5 hover:border-[var(--color-gold)]/40 max-[520px]:p-[15px]">
        <span className="mb-2.5 block font-utility text-xs font-black uppercase tracking-[1.4px] text-[var(--color-gold)]">
          Step 3
        </span>
        <h3 className="mb-1.5 text-[15px] font-bold">Click the bookmark</h3>
        <p className="text-[13px] leading-relaxed text-[var(--color-faint)]">
          Click the bookmark you just added. Your report will open in a new tab.
        </p>
      </div>
    </div>
  );
}
