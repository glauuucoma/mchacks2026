"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@auth0/nextjs-auth0/client";
import { TrendingUp, BarChart3, Activity, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import ProfileBanner from "../components/login-profile/ProfileBanner"

// Lazy load chart to prevent hydration mismatch from Math.random()
const BackgroundChart = dynamic(
  () => import("@/components/select/BackgroundChart"),
  { ssr: false }
);

export default function Home() {
  const { user, isLoading } = useUser();

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Background Chart */}
      <BackgroundChart />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-[110px]">
          <div className="text-2xl font-semibold text-[#333] tracking-tight">
            Trading
          </div>
          <div className="flex items-center gap-6">
            {!isLoading && (
                user ? (
                  <>
                    <ProfileBanner />
                    <Button
                      variant="outline"
                      className="relative border-[#333] text-[#333] bg-transparent overflow-hidden group whitespace-nowrap shrink-0"
                      asChild
                    >
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="relative border-[#333] text-[#333] bg-transparent overflow-hidden group whitespace-nowrap shrink-0 focus:outline-none"
                    asChild
                  >
                    <a href="/auth/login" className="relative z-10 focus:outline-none">
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

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-[150px]">
          <h1 className="text-6xl md:text-7xl font-semibold text-[#333] mb-2 tracking-tight leading-tight">
            Investing Made Easy
          </h1>
          <p className="text-lg text-[#333]/50 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            Advanced sentiment analysis meets intelligent trading.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <Button
                size="lg"
                className="bg-[#333] text-white hover:bg-[#333]/95 h-10 px-8 rounded-3xl focus:outline-none"
              >
                Explore market
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
            <div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-[50px]">
          <div className="group p-8 border border-[#333]/10 rounded-lg bg-white/80 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:border-[#333]/20">
            <TrendingUp className="size-8 text-[#333] mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <h3 className="text-xl font-medium text-[#333] mb-2 transition-colors duration-300">
              Real-Time Analytics
            </h3>
            <p className="text-[#333]/60 text-sm leading-relaxed transition-colors duration-300 group-hover:text-[#333]/70">
              Monitor market sentiment and trends with live data feeds and
              comprehensive analytics.
            </p>
          </div>
          <div className="group p-8 border border-[#333]/10 rounded-lg bg-white/80 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:border-[#333]/20">
            <BarChart3 className="size-8 text-[#333] mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <h3 className="text-xl font-medium text-[#333] mb-2 transition-colors duration-300">
              Smart Insights
            </h3>
            <p className="text-[#333]/60 text-sm leading-relaxed transition-colors duration-300 group-hover:text-[#333]/70">
              AI-powered predictions help you stay ahead of market movements
              and make informed decisions.
            </p>
          </div>
          <div className="group p-8 border border-[#333]/10 rounded-lg bg-white/80 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:border-[#333]/20">
            <Activity className="size-8 text-[#333] mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <h3 className="text-xl font-medium text-[#333] mb-2 transition-colors duration-300">
              Automated Trading
            </h3>
            <p className="text-[#333]/60 text-sm leading-relaxed transition-colors duration-300 group-hover:text-[#333]/70">
              Set up automated strategies that execute trades based on your
              predefined criteria and risk tolerance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
