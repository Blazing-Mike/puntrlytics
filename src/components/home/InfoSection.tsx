export function InfoSection() {
  return (
    <div className="my-[18px] rounded-lg border border-rule bg-ticket/90 p-5 max-[520px]:p-[15px]">
      <h2 className="mb-3 font-utility text-xs uppercase tracking-[1.5px] text-faint">
        What it does &amp; privacy
      </h2>
      <p className="mb-2.5 text-[13.5px] text-faint">
        The bookmark reads your bet history the same way the site itself does, then computes the report <b>entirely in your browser</b>:
      </p>
      <ul className="ml-[18px] list-disc text-[13.5px] text-faint">
        <li className="mb-1">Total stakes, payouts, net profit/loss, ROI, win rate</li>
        <li className="mb-1">Performance by odds range (low / medium / high / exotic)</li>
        <li className="mb-1">Daily trends for your most recent betting days</li>
      </ul>
      <p className="mb-2.5 text-[13.5px] text-faint">
        Your data never leaves your computer. Nothing is uploaded or stored anywhere. Only your own bets are read.
      </p>
    </div>
  );
}
