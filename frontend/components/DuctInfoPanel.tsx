"use client";

import React from "react";
import { DuctSegment } from "@/lib/types";

interface DuctInfoPanelProps {
  duct: DuctSegment | null;
  onClose: () => void;
}

const PRESSURE_CLASS_NAMES = {
  low: "Low Pressure",
  medium: "Medium Pressure",
  high: "High Pressure",
};

const PRESSURE_CLASS_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function DuctInfoPanel({ duct, onClose }: DuctInfoPanelProps) {
  if (!duct) {
    return null;
  }

  const pressureName = PRESSURE_CLASS_NAMES[duct.pressure_class];
  const pressureColor = PRESSURE_CLASS_COLORS[duct.pressure_class];

  return (
    <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold text-gray-900">Duct #{duct.id}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Pressure Class</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${pressureColor}`}>
            {pressureName}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Duct Type</p>
          <p className="text-gray-900 capitalize">{duct.shape} Duct</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Dimensions</p>
          {duct.dimension.diameter !== null && (
            <p className="text-gray-900">⌀ {duct.dimension.diameter}"</p>
          )}
          {duct.dimension.width !== null && duct.dimension.height !== null && (
            <p className="text-gray-900">
              {duct.dimension.width}" × {duct.dimension.height}"
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Text: {duct.dimension.raw_text || "N/A"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Location</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <p className="font-medium">Start</p>
              <p>({duct.start_point.x}, {duct.start_point.y})</p>
            </div>
            <div>
              <p className="font-medium">End</p>
              <p>({duct.end_point.x}, {duct.end_point.y})</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(duct.confidence * 100).toFixed(1)}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {(duct.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
