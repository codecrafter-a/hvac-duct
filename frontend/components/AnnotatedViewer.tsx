"use client";

import React, { useRef, useEffect, useState } from "react";
import { DuctSegment } from "@/lib/types";

interface AnnotatedViewerProps {
  imageUrl: string;
  ducts: DuctSegment[];
  selectedDuctId?: number | null;
  onDuctSelect: (duct: DuctSegment) => void;
}

const COLOR_MAP = {
  low: "#00FF00",
  medium: "#00A5FF",
  high: "#0000FF",
};

export function AnnotatedViewer({
  imageUrl,
  ducts,
  selectedDuctId,
  onDuctSelect,
}: AnnotatedViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setImgDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      return () => img.removeEventListener("load", handleLoad);
    }
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block max-w-full bg-gray-100 rounded-lg overflow-hidden"
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Annotated HVAC Drawing"
        className="max-w-full h-auto"
      />

      {imgDimensions.width > 0 && (
        <svg
          ref={svgRef}
          className="absolute top-0 left-0"
          style={{
            width: imgDimensions.width,
            height: imgDimensions.height,
            cursor: "pointer",
          }}
          viewBox={`0 0 ${imgDimensions.width} ${imgDimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {ducts.map((duct) => {
            const color = COLOR_MAP[duct.pressure_class];
            const isSelected = duct.id === selectedDuctId;
            const strokeWidth = isSelected ? 8 : 4;

            return (
              <g
                key={duct.id}
                onClick={() => onDuctSelect(duct)}
                style={{ cursor: "pointer" }}
              >
                <line
                  x1={duct.start_point.x}
                  y1={duct.start_point.y}
                  x2={duct.end_point.x}
                  y2={duct.end_point.y}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={isSelected ? 1 : 0.7}
                  className="transition-all hover:opacity-100"
                />

                <circle
                  cx={duct.center_point.x}
                  cy={duct.center_point.y}
                  r={isSelected ? 12 : 8}
                  fill={color}
                  opacity={isSelected ? 1 : 0.8}
                  className="transition-all hover:opacity-100"
                />

                <circle
                  cx={duct.center_point.x}
                  cy={duct.center_point.y}
                  r="25"
                  fill="transparent"
                  className="hover:fill-blue-300 hover:opacity-20"
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
