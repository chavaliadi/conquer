"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, History, LineChart, FileText } from "lucide-react";
import { usePathname } from "next/navigation";

const montserrat = Montserrat({
    weight: "600",
    subsets: ["latin"]
});

const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-500", 
    },
    {
      label: "Resume",
      icon: FileText,
      href: "/resume",
      color: "text-teal-500",
    },
    {
      label: "History",
      icon: History,
      href: "/history",
      color: "text-violet-500",
    },
    {
      label: "Progress",
      icon: LineChart,
      href: "/progress",
      color: "text-pink-500",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      color: "text-orange-500",
    },
]

const Sidebar = () => {
  const pathname = usePathname();
    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-neutral-50 dark:bg-[#0B0F19] text-neutral-900 dark:text-white">
          <div className="px-3 py-2 flex-1">
            <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                <div className="relative w-8 h-8 mr-4">
                    <Image
                        fill 
                        alt="Logo"
                        src="/logo.png"
                        className="rounded-lg shadow-sm"
                        />
                </div>
                <h1 className={cn("text-2xl font-bold text-neutral-900 dark:text-white", montserrat.className)}>
                 Conquer
                </h1> 
            </Link>
            <div className="space-y-1">
             {routes.map((route) => (
                <Link
                 href={route.href}
                 key={route.href}
                 className={cn("text-sm group flex p-3 w-full justify-start font-semibold cursor-pointer rounded-lg transition", 
                 pathname === route.href 
                   ? "text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10 border border-neutral-200/50 dark:border-neutral-800/10 shadow-sm" 
                   : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-white/10"
                )}
                >
                <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                    {route.label} 
                </div>
                </Link>
             ))}
            </div>
          </div>
        </div>
    );
}

export default Sidebar;