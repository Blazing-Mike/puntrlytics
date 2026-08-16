import Image from "next/image";

const AVATAR_COLORS = [
  "#f7b955", // gold
  "#41d484", // lime
  "#5fd4ff", // cyan
  "#ff7084", // rose
  "#b39dff", // purple
  "#ffb25f", // orange
  "#4dd8c0", // teal
];

function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function ProviderLogo({ providerName, size = 20 }: { providerName: string; size?: number }) {
  const nameLower = providerName.toLowerCase();

  if (nameLower.includes("sporty")) {
    return <Image src="/sportylogo.svg" alt="SportyBet" width={size} height={size} className="shrink-0" />;
  }
  if (nameLower.includes("stake")) {
    // The Stake mark is white, so it needs its brand-color chip behind it.
    return (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: "#1A2C38",
        }}
        title="Stake"
      >
        <Image
          src="/stake.svg"
          alt="Stake"
          width={15}
          height={20}
          className="shrink-0"
        />
      </div>
    );
  }
  if (nameLower.includes("football.com") || nameLower.includes("football")) {
    return <Image src="/footballcom.svg" alt="football.com" width={size} height={size} className="shrink-0" />;
  }
  if (nameLower.includes("msport")) {
    // No MSport logo asset yet — use their brand-yellow chip with the initial.
    return (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black text-black"
        style={{ width: size, height: size, backgroundColor: "#ffca27", fontSize: size * 0.42 }}
        title="MSport"
      >
        M
      </div>
    );
  }

  // Fallback avatar
  const avatarStyle = { backgroundColor: getAvatarColor(providerName), width: size, height: size };
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-black text-black"
      style={{ ...avatarStyle, fontSize: size * 0.4 }}
    >
      {(providerName.trim().charAt(0) || "?").toUpperCase()}
    </div>
  );
}
