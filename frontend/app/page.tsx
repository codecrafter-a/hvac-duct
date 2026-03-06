"use client";

import React from "react";
import { useHvac } from "@/hooks/useHvac";
import { api } from "@/lib/api";
import { DrawingUpload } from "@/components/DrawingUpload";
import { AnnotatedViewer } from "@/components/AnnotatedViewer";
import { DuctInfoPanel } from "@/components/DuctInfoPanel";
import { DuctTable } from "@/components/DuctTable";

export default function Home() {
  const hvac = useHvac();

  const handleUpload = async (file: File) => {
    try {
      await hvac.processDrawing(file);
    } catch (error) {
      console.error("Processing error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            HVAC Duct Annotation System
          </h1>
          <p className="text-gray-600">
            Upload a mechanical floor plan to automatically detect, annotate, and classify HVAC ducts.
          </p>
        </div>

        {/* Error Alert */}
        {hvac.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{hvac.error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!hvac.result ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <DrawingUpload
              onUpload={handleUpload}
              isLoading={hvac.isLoading}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900">Processing Complete</h3>
                <p className="text-green-700">
                  {hvac.result.total_ducts} ducts detected in{" "}
                  {hvac.result.processing_time_seconds.toFixed(2)}s
                </p>
              </div>
            </div>

            {/* Results Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Annotated Image */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Annotated Drawing
                  </h2>
                  <div className="overflow-auto max-h-96">
                    <AnnotatedViewer
                      imageUrl={api.getImageUrl(hvac.result.job_id)}
                      ducts={hvac.result.ducts}
                      selectedDuctId={hvac.selectedDuct?.id}
                      onDuctSelect={hvac.selectDuct}
                    />
                  </div>
                </div>

                {/* Ducts Table */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Detected Ducts
                  </h2>
                  <DuctTable
                    ducts={hvac.result.ducts}
                    selectedDuctId={hvac.selectedDuct?.id}
                    onDuctSelect={hvac.selectDuct}
                  />
                </div>
              </div>

              {/* Right Column - Duct Info Panel */}
              <div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Duct Details
                  </h2>
                  {hvac.selectedDuct ? (
                    <DuctInfoPanel
                      duct={hvac.selectedDuct}
                      onClose={() => hvac.selectDuct(null)}
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Click on a duct in the image or table to view details
                    </p>
                  )}
                </div>

                {/* Legend */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h3 className="font-bold text-gray-900 mb-3">Legend</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Low Pressure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-gray-700">Medium Pressure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-700">High Pressure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={hvac.reset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Process Another Drawing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
