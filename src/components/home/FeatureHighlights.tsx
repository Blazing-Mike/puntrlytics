const FEATURES = [
  {
    eyebrow: "100% Secure",
    heading: "Zero-Trace Privacy",
    body: "No accounts, no passwords, no API keys. Your history is read locally and never touches our servers.",
  },
  {
    eyebrow: "Deep Analytics",
    heading: "Uncover Your True Edge",
    body: "Track your actual net profit, ROI, and win rate. See exactly which sports and tournaments make you money.",
  },
  {
    eyebrow: "One-Click Share",
    heading: "Share Your True ROI",
    body: "Export a beautifully formatted snapshot of your performance. Let the hard numbers do the talking, whether green or red.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="my-8 md:py-10">
      <div className="mb-6">
        <h2 className="font-display text-center text-[clamp(28px,5vw,36px)] font-black uppercase leading-none tracking-wider text-ink">
          Why <span className="text-gold">Betlytics?</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.eyebrow}
            className="group relative flex h-full flex-col justify-center overflow-hidden rounded-md border border-rule bg-ticket px-8 py-10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-[0_8px_30px_rgba(247,185,85,0.08)] max-[520px]:px-6 max-[520px]:py-8"
          >
            <div className="relative z-10">
              <span className="mb-4 block font-utility text-xs font-black uppercase tracking-[2px] text-gold">
                {f.eyebrow}
              </span>
              <h3 className="mb-3 font-display text-2xl font-medium leading-[1.1] text-ink sm:text-[28px]">
                {f.heading}
              </h3>
              <p className="text-[15px] leading-relaxed text-faint">{f.body}</p>
            </div>
            {/* Subtle hover glow effect behind the text */}
            <div className="absolute -right-8 -top-8 z-0 h-32 w-32 rounded-full bg-gold/5 blur-[50px] transition-all duration-500 group-hover:bg-gold/10" />
          </div>
        ))}
      </div>
    </section>
  );
}
