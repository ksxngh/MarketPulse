import React from "react";
import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import type { Session } from "@/lib/auth";

const Header = ({ user }: { user: Session["user"] }) => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/assets/icons/logo.svg" alt="MarketPulse" width={34} height={34} className="size-8" />
          <span className="text-lg font-semibold text-gray-100">MarketPulse</span>
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
        <UserDropdown user={user} />
      </div>
    </header>
  );
};

export default Header;
