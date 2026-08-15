import { ReactNode } from "react";
import { PayloadHandler } from "@/components/PayloadHandler";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PayloadHandler />
      {children}
    </>
  );
}
