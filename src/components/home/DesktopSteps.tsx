export function DesktopSteps() {
  return (
    <div className="my-10 max-[820px]:hidden">
      <div className="mb-6">
        <h2 className="font-display text-center text-2xl font-black uppercase tracking-wider text-ink">
          How It Works
        </h2>
      </div>

      <div className="flex overflow-hidden rounded-2xl border border-rule bg-ticket shadow-lg">
        {/* Step 1 */}
        <div className="group relative flex-1 p-8 transition-colors hover:bg-ticket2/50">
          <div className="absolute -right-2 -top-6 z-0 select-none font-display text-[140px] font-black leading-none text-rule/40 transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:text-gold/10">
            1
          </div>
          <div className="relative z-10">
            <span className="mb-3 block font-utility text-xs font-black uppercase tracking-[2px] text-gold">
              Step 1
            </span>
            <h3 className="mb-2 text-xl font-bold text-ink">Drag the button</h3>
            <p className="text-[15px] leading-relaxed text-faint">
              Drag "Analyze my bets" above into your bookmarks bar. (Press Ctrl+Shift+B if it's hidden).
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="group relative flex-1 border-l border-rule p-8 transition-colors hover:bg-ticket2/50">
          <div className="absolute -right-2 -top-6 z-0 select-none font-display text-[140px] font-black leading-none text-rule/40 transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:text-gold/10">
            2
          </div>
          <div className="relative z-10">
            <span className="mb-3 block font-utility text-xs font-black uppercase tracking-[2px] text-gold">
              Step 2
            </span>
            <h3 className="mb-2 text-xl font-bold text-ink">Log in</h3>
            <p className="text-[15px] leading-relaxed text-faint">
              Visit <span className="font-bold text-ink">SportyBet, MSport, Stake.com,</span> or <span className="font-bold text-ink">football.com</span> and log in.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="group relative flex-1 border-l border-rule p-8 transition-colors hover:bg-ticket2/50">
          <div className="absolute -right-2 -top-6 z-0 select-none font-display text-[140px] font-black leading-none text-rule/40 transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:text-gold/10">
            3
          </div>
          <div className="relative z-10">
            <span className="mb-3 block font-utility text-xs font-black uppercase tracking-[2px] text-gold">
              Step 3
            </span>
            <h3 className="mb-2 text-xl font-bold text-ink">Click the bookmark</h3>
            <p className="text-[15px] leading-relaxed text-faint">
              Click the bookmark you just added. Your complete report will open instantly in a new tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
