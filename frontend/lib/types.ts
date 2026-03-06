export type PressureClass = "low" | "medium" | "high";
export type DuctShape = "round" | "rectangular";

export interface Point {
  x: number;
  y: number;
}

export interface DuctDimension {
  shape: DuctShape;
  diameter?: number;
  width?: number;
  height?: number;
  raw_text: string;
}

export interface DuctSegment {
  id: number;
  shape: DuctShape;
  dimension: DuctDimension;
  pressure_class: PressureClass;
  start_point: Point;
  end_point: Point;
  center_point: Point;
  confidence: number;
}

export interface ProcessingResult {
  job_id: string;
  filename: string;
  ducts: DuctSegment[];
  annotated_image_url: string;
  total_ducts: number;
  processing_time_seconds: number;
}
