import fs from "fs";
import path from "path";
import readline from "readline";

const DATA_FILE = path.join(process.cwd(), "bets_raw.json");

// Console formatting helpers (ANSI colors)
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m",
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m",
  },
};

function coloredText(text, fgColor, bold = false) {
  let result = "";
  if (bold) result += colors.bright;
  if (fgColor && colors.fg[fgColor]) result += colors.fg[fgColor];
  result += text + colors.reset;
  return result;
}

// Generate some sample data for demonstration if the file doesn't exist
function generateSampleData() {
  console.log(
    coloredText(
      "\n[Info] Generating mock data to bets_raw.json to demonstrate analysis...",
      "cyan",
    ),
  );

  const statuses = ["Won", "Lost", "Void", "Open"];
  const oddsRanges = [1.2, 1.5, 1.8, 2.1, 3.5, 5.0, 10.0];
  const sampleBets = [];

  for (let i = 1; i <= 50; i++) {
    const stake = Math.round((Math.random() * 4500 + 500) / 100) * 100; // 500 to 5000 NGN
    const oddsIdx = Math.floor(Math.random() * oddsRanges.length);
    const odds = oddsRanges[oddsIdx];

    // Weighted statuses: 45% Lost, 40% Won, 10% Open, 5% Void
    let rand = Math.random();
    let status = "Lost";
    if (rand < 0.4) status = "Won";
    else if (rand < 0.45) status = "Void";
    else if (rand < 0.55) status = "Open";

    let payout = 0;
    if (status === "Won") {
      payout = parseFloat((stake * odds).toFixed(2));
    } else if (status === "Void") {
      payout = stake;
    }

    // Generate date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const dateStr = date.toISOString().replace("T", " ").substring(0, 19);

    sampleBets.push({
      betId: `TXN-${100000 + i}`,
      date: dateStr,
      stake: stake,
      payout: payout,
      odds: odds,
      status: status,
      rawText: `Sample Bet: Stake ₦${stake} @ ${odds} odds. Status: ${status}`,
    });
  }

  // Sort by date descending
  sampleBets.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(DATA_FILE, JSON.stringify(sampleBets, null, 2), "utf8");
  console.log(
    coloredText(
      `✔ Successfully created mock bets file with ${sampleBets.length} entries at ${DATA_FILE}`,
      "green",
    ),
  );
}

// Export bets_raw.json to a CSV you can open in a spreadsheet.
// Columns cover the CLI's fields plus the web-only breakdown dimensions
// (betType/sport/tournament) when the scraper captured them.
function exportCsv() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log(
      coloredText(
        '\n⚠ "bets_raw.json" not found — nothing to export.',
        "yellow",
      ),
    );
    return false;
  }
  let bets;
  try {
    bets = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    console.error(coloredText("❌ Error reading bets_raw.json:", "red", true));
    console.error(err.message);
    return false;
  }
  if (!Array.isArray(bets) || bets.length === 0) {
    console.log(coloredText("⚠ No bets to export.", "yellow"));
    return false;
  }
  const cols = ["betId", "date", "stake", "payout", "odds", "status", "betType", "sport", "tournament"];
  const csvCell = (v) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [
    cols.join(","),
    ...bets.map((b) => cols.map((c) => csvCell(b[c])).join(",")),
  ];
  const out = path.join(process.cwd(), "bets.csv");
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(
    coloredText(`✔ Exported ${bets.length} bet(s) to ${out}`, "green"),
  );
  return true;
}

function runAnalysis() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log(
      coloredText(
        '\n⚠ "bets_raw.json" not found in the project directory.',
        "yellow",
      ),
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "Would you like to generate a sample mock data file to see how the analyzer works? (y/n): ",
      (answer) => {
        rl.close();
        if (answer.trim().toLowerCase() === "y") {
          generateSampleData();
          runAnalysis();
        } else {
          console.log(coloredText("\nTo analyze your own bets:", "bright"));
          console.log('1. Copy the contents of "scraper.js".');
          console.log(
            "2. Paste and run it in the developer console of football.com.",
          );
          console.log(
            '3. Save the downloaded "bets_raw.json" into this workspace folder.',
          );
          console.log('4. Run "npm start" again.\n');
        }
      },
    );
    return;
  }

  try {
    const rawData = fs.readFileSync(DATA_FILE, "utf8");
    const bets = JSON.parse(rawData);

    if (!Array.isArray(bets)) {
      throw new Error("JSON root element is not an array");
    }

    console.log(
      coloredText(
        "\n========================================",
        "magenta",
        true,
      ),
    );
    console.log(
      coloredText("     FOOTBALL.COM BET ANALYSIS REPORT   ", "bright", true),
    );
    console.log(
      coloredText("========================================", "magenta", true),
    );
    console.log(
      `Analyzing ${coloredText(bets.length, "cyan", true)} parsed records from ${coloredText(DATA_FILE, "dim")}\n`,
    );

    let totalStakes = 0;
    let totalPayouts = 0;
    let settledStakes = 0; // stakes of bets that are settled (Won or Lost)
    let settledNetProfit = 0; // net profit of settled bets

    let counts = { Won: 0, Lost: 0, Void: 0, Open: 0, Unknown: 0 };
    let oddsDistribution = {
      low: {
        label: "Low Odds (< 1.50)  ",
        stake: 0,
        profit: 0,
        won: 0,
        total: 0,
      },
      med: {
        label: "Medium (1.50 - 2.50)",
        stake: 0,
        profit: 0,
        won: 0,
        total: 0,
      },
      high: {
        label: "High (2.50 - 5.00)  ",
        stake: 0,
        profit: 0,
        won: 0,
        total: 0,
      },
      exotic: {
        label: "Exotic (5.00+)      ",
        stake: 0,
        profit: 0,
        won: 0,
        total: 0,
      },
    };

    let timeline = {};

    bets.forEach((bet) => {
      const stake = Number(bet.stake) || 0;
      const payout = Number(bet.payout) || 0;
      const odds = Number(bet.odds) || 1.0;
      const status = bet.status || "Unknown";
      const profit =
        status === "Won" ? payout - stake : status === "Lost" ? -stake : 0;

      totalStakes += stake;
      totalPayouts += payout;

      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.Unknown++;
      }

      if (status === "Won" || status === "Lost") {
        settledStakes += stake;
        settledNetProfit += profit;
      }

      // Group by odds range
      let category = "med";
      if (odds < 1.5) category = "low";
      else if (odds <= 2.5) category = "med";
      else if (odds <= 5.0) category = "high";
      else category = "exotic";

      oddsDistribution[category].total++;
      oddsDistribution[category].stake += stake;
      oddsDistribution[category].profit += profit;
      if (status === "Won") {
        oddsDistribution[category].won++;
      }

      // Group by date (YYYY-MM-DD)
      const rawDate = bet.date || "";
      const match =
        rawDate.match(/^\d{4}-\d{2}-\d{2}/) ||
        rawDate.match(/^\d{2}\/\d{2}\/\d{4}/);
      const dateKey = match ? match[0] : "Unknown Date";

      if (!timeline[dateKey]) {
        timeline[dateKey] = {
          stake: 0,
          payout: 0,
          profit: 0,
          won: 0,
          total: 0,
        };
      }
      timeline[dateKey].stake += stake;
      timeline[dateKey].payout += payout;
      timeline[dateKey].profit += profit;
      timeline[dateKey].total++;
      if (status === "Won") timeline[dateKey].won++;
    });

    const netProfit = totalPayouts - totalStakes;
    const settledTotal = counts.Won + counts.Lost;
    const winRate = settledTotal > 0 ? (counts.Won / settledTotal) * 100 : 0;
    const roi =
      settledStakes > 0 ? (settledNetProfit / settledStakes) * 100 : 0;

    // --- OVERVIEW SECTION ---
    console.log(coloredText("📊 OVERALL METRICS", "cyan", true));
    console.log(
      `  Total Stakes:      ${coloredText("₦" + totalStakes.toLocaleString(), "bright")}`,
    );
    console.log(
      `  Total Payouts:     ${coloredText("₦" + totalPayouts.toLocaleString(), "bright")}`,
    );

    const profitColor = netProfit >= 0 ? "green" : "red";
    const profitSign = netProfit >= 0 ? "+" : "";
    console.log(
      `  Net Profit/Loss:   ${coloredText(profitSign + "₦" + netProfit.toLocaleString(), profitColor, true)}`,
    );

    const roiColor = roi >= 0 ? "green" : "red";
    const roiSign = roi >= 0 ? "+" : "";
    console.log(
      `  ROI (Settled):     ${coloredText(roiSign + roi.toFixed(2) + "%", roiColor, true)}`,
    );
    console.log(
      `  Overall Win Rate:  ${coloredText(winRate.toFixed(2) + "%", "cyan", true)} (${counts.Won} Won / ${settledTotal} Settled)`,
    );

    console.log("\n💼 BET STATUS DISTRIBUTION");
    console.log(`  🟢 Won:      ${coloredText(counts.Won, "green", true)}`);
    console.log(`  🔴 Lost:     ${coloredText(counts.Lost, "red", true)}`);
    console.log(`  ⚪ Void:     ${coloredText(counts.Void, "dim")}`);
    console.log(`  🔵 Open:     ${coloredText(counts.Open, "blue", true)}`);
    if (counts.Unknown > 0) {
      console.log(`  ❓ Unknown:  ${coloredText(counts.Unknown, "yellow")}`);
    }

    // --- ODDS PERFORMANCE SECTION ---
    console.log("\n🎯 PERFORMANCE BY ODDS RANGE");
    console.log(
      "  ---------------------------------------------------------------------------------",
    );
    console.log(
      "  Odds Range           | Total Bets | Win Rate | Total Stakes | Net Profit | ROI",
    );
    console.log(
      "  ---------------------------------------------------------------------------------",
    );

    Object.keys(oddsDistribution).forEach((k) => {
      const d = oddsDistribution[k];
      const winPct = d.total > 0 ? (d.won / d.total) * 100 : 0;
      const dRoi = d.stake > 0 ? (d.profit / d.stake) * 100 : 0;
      const profitCol = d.profit >= 0 ? "green" : "red";
      const profitSign = d.profit >= 0 ? "+" : "";

      console.log(
        `  ${d.label} | ` +
          `${d.total.toString().padEnd(10)} | ` +
          `${(winPct.toFixed(1) + "%").padEnd(8)} | ` +
          `${("₦" + d.stake.toLocaleString()).padEnd(12)} | ` +
          `${coloredText((profitSign + "₦" + d.profit.toLocaleString()).padEnd(10), profitCol)} | ` +
          `${coloredText((profitSign + dRoi.toFixed(1) + "%").padEnd(6), profitCol)}`,
      );
    });
    console.log(
      "  ---------------------------------------------------------------------------------",
    );

    // --- TIMELINE / TREND SECTION ---
    console.log("\n📈 DAILY TRENDS (Last 5 Active Days)");
    const sortedDates = Object.keys(timeline)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 5);
    console.log(
      "  -------------------------------------------------------------",
    );
    console.log(
      "  Date       | Bets | Total Stake | Total Return | Net Profit",
    );
    console.log(
      "  -------------------------------------------------------------",
    );
    sortedDates.forEach((date) => {
      const t = timeline[date];
      const profitCol = t.profit >= 0 ? "green" : "red";
      const profitSign = t.profit >= 0 ? "+" : "";
      console.log(
        `  ${date.padEnd(10)} | ` +
          `${t.total.toString().padEnd(4)} | ` +
          `${("₦" + t.stake.toLocaleString()).padEnd(11)} | ` +
          `${("₦" + t.payout.toLocaleString()).padEnd(12)} | ` +
          `${coloredText(profitSign + "₦" + t.profit.toLocaleString(), profitCol)}`,
      );
    });
    console.log(
      "  -------------------------------------------------------------",
    );
    console.log(
      "\n💡 Tip: Run `node scripts/analyze.js --csv` to export bets_raw.json to a CSV you can open in any spreadsheet, or `node scripts/analyze.js --generate` to create mock data.",
    );
    console.log(
      "=================================================================\n",
    );
  } catch (error) {
    console.error(
      coloredText("❌ Error reading or parsing bets_raw.json:", "red", true),
    );
    console.error(error.message);
  }
}

// Check for script flags
if (process.argv.includes("--generate")) {
  generateSampleData();
}
if (process.argv.includes("--csv")) {
  exportCsv();
}

runAnalysis();
