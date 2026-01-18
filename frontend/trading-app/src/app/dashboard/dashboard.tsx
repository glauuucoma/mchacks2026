"use client";

import { motion } from "framer-motion";
import StockList from "@/components/dashboard/StockList";
import FearGreedIndex from "@/components/dashboard/FearGreedIndex";
import AskAIChat from "@/components/dashboard/AskAIChat";

export default function DashboardPage() {
  return (
    <div className="bg-background relative">
      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Fear & Greed Index - Sidebar */}
          <motion.div
            className="lg:col-span-3 xl:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="sticky top-24">
              <FearGreedIndex />
              
              {/* Quick Stats Card */}
              <motion.div
                className="mt-6 bg-card rounded-2xl border border-border shadow-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Market Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">S&P 500</span>
                    <span className="text-sm font-medium text-emerald-500">+0.42%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">NASDAQ</span>
                    <span className="text-sm font-medium text-emerald-500">+0.78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">DOW</span>
                    <span className="text-sm font-medium text-red-500">-0.15%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Stock List - Main Content */}
          <motion.div
            className="lg:col-span-9 xl:col-span-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <StockList />
          </motion.div>
        </div>
      </main>

      {/* Floating AI Chat */}
      <AskAIChat />
    </div>
  );
}
