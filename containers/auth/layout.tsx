import { siteConfig } from "@/config/site";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  logo: ReactNode;
}

export default function Layout({ children, logo }: LayoutProps) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          {logo}
          {siteConfig.name}
        </a>
        {children}
      </div>
    </div>
  );
}
