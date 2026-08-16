"use client";

import { useEffect, useRef, useState } from "react";

export function BookmarkletLink({
  url,
  className,
  children,
}: {
  url: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (ref.current) {
      // Bypasses React's javascript: URL blocking
      ref.current.setAttribute("href", url);
    }
  }, [url]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setToast(
      "Drag this button to your bookmarks bar. If it's hidden, press Ctrl+Shift+B (Windows) or Cmd+Shift+B (Mac) to show it.",
    );
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      <a id="ba-bookmarklet" ref={ref} className={className} onClick={handleClick}>
        {children}
      </a>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] w-[min(92vw,420px)] -translate-x-1/2">
          <div
            role="status"
            className="animate-toast-in flex items-start gap-2.5 rounded-lg border border-gold/40 bg-ticket2 px-4 py-3 text-[13px] leading-snug text-ink shadow-[0_12px_40px_rgba(0,0,0,.5)]"
          >
            <span className="mt-px shrink-0 font-black text-gold" aria-hidden="true">
              ↗
            </span>
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
