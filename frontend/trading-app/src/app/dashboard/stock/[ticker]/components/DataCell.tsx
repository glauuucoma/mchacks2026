/**
 * DataCell Component
 * 
 * A reusable cell component for displaying labeled data with an icon.
 * Used in Market Data, Financial Metrics, and Company Info sections.
 */

import React from "react";

interface DataCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}

export function DataCell({ icon, label, value, valueClass = "" }: DataCellProps) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`font-mono font-semibold text-lg ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
