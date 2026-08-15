"use client";

import { useState, useEffect } from "react";

interface MobileStepsProps {
  copied: boolean;
  onCopy: () => void;
}

export function MobileSteps({ copied, onCopy }: MobileStepsProps) {
  const [activeDevice, setActiveDevice] = useState("android");

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      setActiveDevice("iphone");
    }
  }, []);

  return (
    <div className="my-[18px] hidden rounded-lg border border-[var(--color-rule)] bg-[var(--color-ticket)]/90 p-5 max-[820px]:block">
      <h2 className="mb-1 font-utility text-xs uppercase tracking-[1.5px] text-[var(--color-faint)]">
        📱 On a phone? No bookmarks bar — install it in a tap
      </h2>
      <p className="mb-3 text-[13.5px] text-[var(--color-faint)]">
        Click the button to copy the code, then run it while you're logged in at <span className="font-bold">SportyBet or football.com</span>. Your data still never leaves your phone.
      </p>

      <button
        className="mb-2 w-full cursor-pointer rounded-lg border-0 bg-[var(--color-lime)] px-5 py-3.5 text-[15px] font-black text-[var(--color-blacktop)] shadow-[0_10px_24px_rgba(65,212,132,.25)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-cyan)]"
        type="button"
        onClick={onCopy}
      >
        Copy bookmarklet URL
      </button>

      {copied && (
        <p className="mb-3 text-[13px] font-bold text-[var(--color-lime)]">
          Copied — now run it:
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Choose your device">
        <button
          type="button"
          className={`ba-device-tab ${activeDevice === "android" ? "ba-active" : ""}`}
          onClick={() => setActiveDevice("android")}
          aria-pressed={activeDevice === "android"}
        >
          Android
        </button>
        <button
          type="button"
          className={`ba-device-tab ${activeDevice === "iphone" ? "ba-active" : ""}`}
          onClick={() => setActiveDevice("iphone")}
          aria-pressed={activeDevice === "iphone"}
        >
          iPhone / iPad
        </button>
      </div>

      {activeDevice === "android" && (
        <ol className="ml-[18px] list-decimal space-y-1.5 text-[13.5px] text-[var(--color-faint)]">
          <li>Log in to either <span className="font-bold text-[var(--color-ink)]">SportyBet</span> or <span className="font-bold text-[var(--color-ink)]">football.com</span>.</li>
          <li>Tap the address bar, paste the copied code, and press <b>Go</b>.</li>
          <li className="text-[12px] text-[var(--color-gold)] mt-2">
            <b>Important:</b> Some mobile browsers (like Chrome) remove the <code>javascript:</code> text when you paste for security. If nothing happens, type <code>javascript:</code> manually at the very beginning of the address bar before pressing Go!
          </li>
        </ol>
      )}

      {activeDevice === "iphone" && (
        <ol className="ml-[18px] list-decimal space-y-1.5 text-[13.5px] text-[var(--color-faint)]">
          <li>Bookmark <b>any page</b>: tap Share → Add Bookmark → Save.</li>
          <li>Open your bookmarks, find it, tap <b>Edit</b> → replace the URL with the copied one → <b>Done</b>.</li>
          <li>Log in to either <span className="font-bold text-[var(--color-ink)]">SportyBet</span> or <span className="font-bold text-[var(--color-ink)]">football.com</span> and tap that bookmark.</li>
        </ol>
      )}
    </div>
  );
}
