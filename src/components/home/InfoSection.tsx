"use client";

interface InfoSectionProps {
  copied: boolean;
  onCopy: () => void;
  activeProviderCode: string;
}

export function InfoSection({ copied, onCopy, activeProviderCode }: InfoSectionProps) {
  return (
    <div className="my-[18px] rounded-lg border border-[var(--color-rule)] bg-[var(--color-ticket)]/90 p-5 max-[520px]:p-[15px]">
      <h2 className="mb-3 font-utility text-xs uppercase tracking-[1.5px] text-[var(--color-faint)]">
        What it does &amp; privacy
      </h2>
      <p className="mb-2.5 text-[13.5px] text-[var(--color-faint)]">
        The bookmark reads your bet history the same way the site itself does, then computes the report <b>entirely in your browser</b>:
      </p>
      <ul className="ml-[18px] list-disc text-[13.5px] text-[var(--color-faint)]">
        <li className="mb-1">Total stakes, payouts, net profit/loss, ROI, win rate</li>
        <li className="mb-1">Performance by odds range (low / medium / high / exotic)</li>
        <li className="mb-1">Daily trends for your most recent betting days</li>
      </ul>
      <p className="mb-2.5 text-[13.5px] text-[var(--color-faint)]">
        Your data never leaves your computer. Nothing is uploaded or stored anywhere. Only your own bets are read.
      </p>

      <details className="mt-4">
        <summary className="cursor-pointer text-[13px] text-[var(--color-faint)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-cyan)]">
          Prefer to copy the code instead of dragging?
        </summary>
        <textarea
          className="mt-2.5 w-full resize-y rounded-lg border border-[var(--color-rule)] bg-[var(--color-blacktop)] p-3 font-mono text-[11px] leading-normal text-[var(--color-ink)] outline-none focus:border-[var(--color-cyan)]"
          readOnly
          rows={6}
          value={activeProviderCode}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
        <button
          className="mt-2.5 cursor-pointer rounded-md border-0 bg-[var(--color-gold)] px-3 py-2 font-black text-[var(--color-blacktop)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-cyan)]"
          onClick={onCopy}
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
      </details>
    </div>
  );
}
