"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileNav() {
  const pathName = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathName === "/";
    return pathName.startsWith(path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-gray-300 hover:text-yellow-400 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-52 border-gray-700 bg-gray-800 p-2 text-gray-300"
      >
        {NAV_ITEMS.map(({ href, label }) => (
          <DropdownMenuItem
            key={href}
            asChild
            className="cursor-pointer focus:bg-gray-700"
          >
            <Link
              href={href}
              className={
                isActive(href)
                  ? "font-medium text-yellow-400"
                  : "text-gray-300"
              }
            >
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
