"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Activity, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { motion } from "framer-motion";

// Lazy load chart to prevent hydration mismatch from Math.random()
const BackgroundChart = dynamic(
  () => import("@/components/select/BackgroundChart"),
  { ssr: false }
);

export default function Home() {
  const { user, isLoading } = useUser();
  
  // If user is not logged in, redirect to login page. Otherwise go to dashboard
  const getExploreMarketHref = () => {
    if (isLoading) return "#"; // Prevent navigation while loading
    return user ? "/dashboard" : "/auth/login?returnTo=/dashboard";
  };

  return (
    <div className="relative max-h-screen bg-white overflow-hidden">
      {/* Background Chart */}
      <BackgroundChart />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 pt-0 pb-8">
        {/* Hero Section */}
        <motion.div 
          className="max-w-4xl mx-auto text-center mt-[80px] mb-[150px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-semibold text-[#333] mb-2 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Investing Made Easy
          </motion.h1>
          <motion.p 
            className="text-lg text-[#333]/50 font-medium mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Advanced sentiment analysis meets intelligent trading.
          </motion.p>
          <motion.div 
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <div>
              <Button
                asChild
                size="lg"
                className="bg-[#333] text-white hover:bg-[#333]/95 h-10 px-8 rounded-3xl focus:outline-none"
              >
                <Link href={getExploreMarketHref()}>
                  Explore market
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
            <div>
            </div>
          </motion.div>
        </motion.div>

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
