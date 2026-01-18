'use client'

import { useUser } from "@auth0/nextjs-auth0/client";
import { LogOut, LayoutDashboard, Settings2 } from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export const ProfileBanner = () => {
  const { user } = useUser();
  
  const getLogoutUrl = () => {
    if (typeof window !== 'undefined') {
      const returnTo = `${window.location.origin}/`;
      return `/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
    }
    return '/auth/logout';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='bg-secondary flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-secondary/80 transition-colors focus:outline-none'>
        <Avatar>
          <AvatarImage src={user?.picture} />
          <AvatarFallback className='text-xs'>
            <img 
              src="https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png" 
              alt="Profile fallback" 
              className="w-full h-full object-cover"
            />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-col gap-1 text-start leading-none'>
          <span className='max-w-[17ch] truncate text-sm leading-none font-semibold'>{user?.name}</span>
          <span className='text-muted-foreground max-w-[20ch] truncate text-xs'>{user?.email}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-56' onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuItem asChild className='focus:outline-none'>
          <Link href="/dashboard" className="w-full flex items-center gap-2 cursor-pointer text-[#333] hover:text-[#333]/70 transition-colors">
            <LayoutDashboard className="size-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='focus:outline-none'>
          <Link href="/preferences" className="w-full flex items-center gap-2 cursor-pointer text-[#333] hover:text-[#333]/70 transition-colors">
            <Settings2 className="size-4" />
            <span>Preferences</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='focus:outline-none'>
          <a 
            href={getLogoutUrl()}
            className="w-full flex items-center gap-2 cursor-pointer text-[#333] hover:text-[#333]/70 transition-colors"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileBanner
