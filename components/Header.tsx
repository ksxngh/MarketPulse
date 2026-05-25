import React from "react";
import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import MobileNav from "./MobileNav";
import type { Session } from "@/lib/auth";

const Header = ({ user }: { user: Session["user"] }) => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/assets/icons/logo.svg"
            alt="MarketPulse"
            width={34}
            height={34}
            className="size-8"
          />
          <span className="truncate text-base font-semibold text-gray-100 sm:text-lg">
            MarketPulse
          </span>
        </Link>
        <nav className="hidden lg:block">
          <NavItems />
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <MobileNav />
          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  );
};

export default Header;
