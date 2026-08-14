// Deterministic sample data so the demo report looks the same on every build.

import type { Bet } from "./core";

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function sampleBets(count = 40): Bet[] {
  const rand = lcg(20260718);
  const statuses = [
    "Lost",
    "Lost",
    "Lost",
    "Lost",
    "Won",
    "Won",
    "Won",
    "Won",
    "Open",
    "Void",
  ];
  const oddsPool = [1.2, 1.4, 1.65, 1.85, 2.1, 2.6, 3.2, 4.0, 5.5, 8.0, 12.0];
  const sports = ["Football", "Basketball", "Tennis", "Ice Hockey"];
  const tournaments = ["Premier League", "NBA", "ATP Tour", "La Liga", "NHL"];

  const bets: Bet[] = [];
  for (let i = 1; i <= count; i++) {
    const stake = Math.round((rand() * 4500 + 500) / 100) * 100;
    const odds = oddsPool[Math.floor(rand() * oddsPool.length)];
    const status = statuses[Math.floor(rand() * statuses.length)];

    let payout = 0;
    if (status === "Won") payout = Math.round(stake * odds * 100) / 100;
    else if (status === "Void") payout = stake;

    const d = new Date(Date.now() - Math.floor(rand() * 24) * 86400000);
    const pad = (n: number): string => String(n).padStart(2, "0");
    const date =
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds());

    bets.push({
      betId: "DEMO-" + (100000 + i),
      date,
      stake,
      payout,
      odds,
      status,
      betType: i % 4 === 0 ? "Multiple" : "Single",
      sport: sports[i % sports.length],
      tournament: tournaments[i % tournaments.length],
    });
  }

  bets.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return bets;
}
