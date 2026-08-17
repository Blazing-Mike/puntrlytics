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
    <div id="mobile-steps" className="my-4 hidden rounded-lg border border-rule bg-ticket/90 p-5 max-[820px]:block">
      <h2 className="mb-1 font-utility text-xs uppercase tracking-[1.5px] text-faint">
        📱 On a phone? No bookmarks bar — install it in a tap
      </h2>
      <p className="mb-3 text-[13.5px] text-faint">
        Click the button to copy the code, then add it as a bookmark on your phone (steps below) and run it while you're logged in at <span className="font-bold">SportyBet, MSport, Stake.com, or football.com</span>. Your data still never leaves your phone.
      </p>

      <button
        className="mb-2 w-full cursor-pointer rounded-lg border-0 bg-lime px-5 py-3.5 text-[15px] font-black text-blacktop shadow-[0_10px_24px_rgba(65,212,132,.25)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan"
        type="button"
        onClick={onCopy}
      >
        Copy bookmarklet URL
      </button>

      {copied && (
        <p className="mb-3 text-[13px] font-bold text-lime">
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
        <ol className="ml-[18px] list-decimal space-y-1.5 text-[13.5px] text-faint">
          <li>Log in to <span className="font-bold text-ink">SportyBet, MSport, Stake.com,</span> or <span className="font-bold text-ink">football.com</span>.</li>
          <li>Add the bookmarklet: tap <b>⋮ → Bookmarks → New bookmark</b> (or the <b>☆</b> star on any page), paste the copied code into the URL field, name it <b>Puntrlytics</b>, and save.</li>
          <li>Run it while you're on the betting site: tap <b>⋮ → Bookmarks</b>, then tap <b>Puntrlytics</b>.</li>
          <li className="text-[12px] text-gold mt-2">
            <b>Important:</b> Some Chrome versions strip the <code>javascript:</code> text when you paste into the bookmark URL. If the bookmark won't run, reopen its edit screen and re-type <code>javascript:</code> at the very start of the URL before saving.
          </li>
        </ol>
      )}

      {activeDevice === "iphone" && (
        <ol className="ml-[18px] list-decimal space-y-1.5 text-[13.5px] text-faint">
          <li>Add the bookmarklet: bookmark <b>any page</b> (Share → Add Bookmark → Save), then open your bookmarks, tap <b>Edit</b>, replace the URL with the copied code, name it <b>Puntrlytics</b>, and tap <b>Done</b>.</li>
          <li>Log in to <span className="font-bold text-ink">SportyBet, MSport, Stake.com,</span> or <span className="font-bold text-ink">football.com</span>.</li>
          <li>Tap the <b>Share</b> icon (square with up arrow), swipe left on the bottom row → <b>More</b> → turn on <b>Bookmarks</b>.</li>
          <li>Tap <b>Bookmarks</b> in the share sheet and select <b>Puntrlytics</b> — it runs on the page you're viewing.</li>
        </ol>
      )}
    </div>
  );
}
