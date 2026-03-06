"use client";

import React from "react";
import { DuctSegment } from "@/lib/types";

interface DuctTableProps {
  ducts: DuctSegment[];
  selectedDuctId?: number | null;
  onDuctSelect: (duct: DuctSegment) => void;
}

const PRESSURE_BADGES = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function DuctTable({
  ducts,
  selectedDuctId,
  onDuctSelect,
}: DuctTableProps) {
  const formatDimension = (duct: DuctSegment): string => {
    if (duct.dimension.diameter !== null) {
      return `⌀ ${duct.dimension.diameter}"`;
    }
    if (duct.dimension.width !== null && duct.dimension.height !== null) {
      return `${duct.dimension.width}" × ${duct.dimension.height}"`;
    }
    return duct.dimension.raw_text || "N/A";
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Dimensions</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Pressure</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {ducts.map((duct) => (
            <tr
              key={duct.id}
              onClick={() => onDuctSelect(duct)}
              className={`border-b border-gray-200 cursor-pointer transition-colors ${
                duct.id === selectedDuctId ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <td className="px-4 py-3 text-gray-900 font-medium">{duct.id}</td>
              <td className="px-4 py-3 text-gray-700 capitalize">{duct.shape}</td>
              <td className="px-4 py-3 text-gray-700 font-mono">
                {formatDimension(duct)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                    PRESSURE_BADGES[duct.pressure_class]
                  }`}
                >
                  {duct.pressure_class}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {(duct.confidence * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
