"use client";

import React, { useRef } from "react";

interface DrawingUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
}

export function DrawingUpload({ onUpload, isLoading }: DrawingUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onUpload(file);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");

    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        await onUpload(file);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50"
        onClick={() => fileInputRef.current?.click()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Processing drawing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="text-lg font-semibold text-gray-700">Upload HVAC Drawing</p>
            <p className="text-sm text-gray-500">Drag and drop a PDF or image, or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">Supported: PDF, PNG, JPG</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />
    </div>
  );
}
