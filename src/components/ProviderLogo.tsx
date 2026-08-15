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

export function ProviderLogo({ providerName, size = 40 }: { providerName: string; size?: number }) {
  const nameLower = providerName.toLowerCase();
  
  if (nameLower.includes("sporty")) {
    return <Image src="/sportylogo.svg" alt="SportyBet" width={size} height={size} className="shrink-0" />;
  }
  if (nameLower.includes("football.com") || nameLower.includes("football")) {
    return <Image src="/footballcom.svg" alt="football.com" width={size} height={size} className="shrink-0" />;
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
