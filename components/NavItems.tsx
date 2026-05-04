"use client";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavItems = () => {
  const pathName: string = usePathname();

  const isActive: (path: string) => boolean = (path: string) => {
    if (path === "/") return pathName === "/";
    return pathName.startsWith(path);
  };
  return (
    <ul className="flex flex-col gap-3 p-2 font-medium sm:flex-row sm:gap-10">
      {NAV_ITEMS.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            className={`transition-colors hover:text-yellow-500 ${
              isActive(href) ? "text-gray-100" : "text-gray-500"
            }`}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default NavItems;
