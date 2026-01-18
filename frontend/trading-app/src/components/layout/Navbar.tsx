"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@auth0/nextjs-auth0/client";
import ProfileBanner from "@/components/login-profile/ProfileBanner";
import Link from "next/link";
import Image from "next/image";

export const Navbar = () => {
  const { user, isLoading } = useUser();

  return (
    <nav className="flex items-center justify-between py-8 px-[100px]">
      <Link href="/" className="flex items-center gap-3 text-2xl font-semibold text-[#333] tracking-tight hover:opacity-80 transition-opacity">
        <Image src="/Logo.svg" alt="SentiTrade Logo" width={30} height={30} className="object-contain" />
        SentiTrade
      </Link>
      <div className="flex items-center gap-6">
        {!isLoading && (
          user ? (
            <ProfileBanner />
          ) : (
            <Button
              variant="outline"
              className="relative border-[#333] text-[#333] bg-transparent overflow-hidden group whitespace-nowrap shrink-0 focus:outline-none"
              asChild
            >
              <a href="/auth/login?returnTo=/select" className="relative z-10 focus:outline-none">
                <span className="relative z-10 text-[#333] group-hover:text-white transition-colors duration-300 delay-150">
                  Sign In
                </span>
                <div className="absolute inset-0 bg-[#333] z-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </a>
            </Button>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
