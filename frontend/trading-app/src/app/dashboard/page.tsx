"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to select page immediately
    router.push("/select");
  }, [router]);

  // Optional: Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-[#333]">Redirecting...</div>
    </div>
  );
}
