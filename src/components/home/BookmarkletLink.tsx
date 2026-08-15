"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (ref.current) {
      // Bypasses React's javascript: URL blocking
      ref.current.setAttribute("href", url);
    }
  }, [url]);

  return (
    <a
      id="ba-bookmarklet"
      ref={ref}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        alert(
          "Drag this button to your bookmarks bar!\n\nIf your bookmarks bar is hidden, press Ctrl+Shift+B (Windows) or Cmd+Shift+B (Mac) to show it."
        );
      }}
    >
      {children}
    </a>
  );
}
