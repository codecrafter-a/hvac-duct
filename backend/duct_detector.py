import cv2
import numpy as np
import pytesseract
from pdf2image import convert_from_path
from pathlib import Path
import re
from typing import List, Optional
from schemas import (
    DuctSegment,
    DuctShape,
    DuctDimension,
    PressureClass,
    Point,
)
import time


class OCRText:
    def __init__(self, text: str, x: int, y: int, width: int, height: int, confidence: float):
        self.text = text
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.confidence = confidence

    @property
    def center_x(self):
        return self.x + self.width // 2

    @property
    def center_y(self):
        return self.y + self.height // 2


class DuctDetector:
    # HSV ranges for blue duct lines
    LOWER_BLUE = np.array([100, 80, 80])
    UPPER_BLUE = np.array([140, 255, 255])

    # Regex patterns for dimension extraction
    ROUND_PATTERN = r'(\d+(?:\.\d+)?)["\']?\s*[⌀Øø∅]'
    RECT_PATTERN = r'(\d+(?:\.\d+)?)["\']?\s*[xX×]\s*(\d+(?:\.\d+)?)["\']?'

    def __init__(self):
        self.duct_id_counter = 0

    def process(self, image_path: str) -> dict:
        """Main entry point for processing a drawing."""
        start_time = time.time()

        image = self._load_image(image_path)
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")

        original_image = image.copy()

        blue_mask = self._segment_blue_ducts(image)
        duct_segments = self._find_duct_segments(blue_mask, original_image)
        ocr_texts = self._run_ocr(original_image)
        duct_segments = self._associate_labels(duct_segments, ocr_texts)
        duct_segments = self._classify_pressure(duct_segments)
        annotated_image = self._draw_annotations(original_image, duct_segments)

        processing_time = time.time() - start_time

        return {
            "ducts": duct_segments,
            "annotated_image": annotated_image,
            "processing_time": processing_time,
        }

    def _load_image(self, image_path: str) -> Optional[np.ndarray]:
        """Load image from file or PDF."""
        path = Path(image_path)

        if path.suffix.lower() == ".pdf":
            try:
                images = convert_from_path(image_path)
                if images:
                    image = cv2.cvtColor(np.array(images[0]), cv2.COLOR_RGB2BGR)
                    return image
            except Exception as e:
                print(f"Error converting PDF: {e}")
                return None
        else:
            try:
                image = cv2.imread(image_path)
                return image
            except Exception as e:
                print(f"Error loading image: {e}")
                return None

    def _segment_blue_ducts(self, image: np.ndarray) -> np.ndarray:
        """Isolate blue duct lines using HSV color space."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, self.LOWER_BLUE, self.UPPER_BLUE)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        return mask

    def _find_duct_segments(self, mask: np.ndarray, original_image: np.ndarray) -> List[DuctSegment]:
        """Find duct line segments from the blue mask."""
        segments = []
        self.duct_id_counter = 0

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 100:
                continue

            x, y, w, h = cv2.boundingRect(contour)
            pts = contour.reshape(-1, 2).astype(np.float32)

            if len(pts) >= 2:
                M = cv2.moments(contour)
                if M["m00"] > 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])

                    start_x, start_y = int(pts[0][0]), int(pts[0][1])
                    end_x, end_y = int(pts[-1][0]), int(pts[-1][1])

                    segment = DuctSegment(
                        id=self.duct_id_counter,
                        shape=DuctShape.ROUND,
                        dimension=DuctDimension(shape=DuctShape.ROUND, raw_text=""),
                        pressure_class=PressureClass.LOW,
                        start_point=Point(x=start_x, y=start_y),
                        end_point=Point(x=end_x, y=end_y),
                        center_point=Point(x=cx, y=cy),
                        confidence=0.5,
                    )

                    segments.append(segment)
                    self.duct_id_counter += 1

        return segments

    def _run_ocr(self, image: np.ndarray) -> List[OCRText]:
        """Extract all text from the image using Tesseract."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        data = pytesseract.image_to_data(thresh, output_type=pytesseract.Output.DICT)

        ocr_texts = []
        for i in range(len(data["text"])):
            text = data["text"][i].strip()
            if text:
                # Handle missing or invalid confidence values
                conf_value = 0
                if "confidence" in data and i < len(data["confidence"]):
                    try:
                        conf_value = int(data["confidence"][i])
                        if conf_value < 0:
                            conf_value = 0
                    except (ValueError, TypeError):
                        conf_value = 0
                confidence = conf_value / 100.0

                ocr_text = OCRText(
                    text=text,
                    x=data["left"][i],
                    y=data["top"][i],
                    width=data["width"][i],
                    height=data["height"][i],
                    confidence=confidence,
                )
                ocr_texts.append(ocr_text)

        return ocr_texts

    def _associate_labels(self, segments: List[DuctSegment], ocr_texts: List[OCRText]) -> List[DuctSegment]:
        """Match OCR text labels with duct segments."""
        updated_segments = []

        for segment in segments:
            nearest_text = None
            min_distance = float("inf")

            for ocr_text in ocr_texts:
                dist = np.sqrt(
                    (segment.center_point.x - ocr_text.center_x) ** 2
                    + (segment.center_point.y - ocr_text.center_y) ** 2
                )

                if dist < min_distance:
                    min_distance = dist
                    nearest_text = ocr_text

            current_segment = segment
            if nearest_text and min_distance < 150:
                dimension_info = self._parse_dimension(nearest_text.text)
                if dimension_info:
                    current_segment = DuctSegment(
                        id=segment.id,
                        shape=dimension_info.shape,
                        dimension=dimension_info,
                        pressure_class=segment.pressure_class,
                        start_point=segment.start_point,
                        end_point=segment.end_point,
                        center_point=segment.center_point,
                        confidence=segment.confidence,
                    )

            updated_segments.append(current_segment)

        return updated_segments

    def _parse_dimension(self, text: str) -> Optional[DuctDimension]:
        """Parse dimension text to extract duct size."""
        text = text.strip()

        round_match = re.search(self.ROUND_PATTERN, text)
        if round_match:
            diameter = float(round_match.group(1))
            return DuctDimension(shape=DuctShape.ROUND, diameter=diameter, raw_text=text)

        rect_match = re.search(self.RECT_PATTERN, text)
        if rect_match:
            width = float(rect_match.group(1))
            height = float(rect_match.group(2))
            return DuctDimension(shape=DuctShape.RECTANGULAR, width=width, height=height, raw_text=text)

        return None

    def _classify_pressure(self, segments: List[DuctSegment]) -> List[DuctSegment]:
        """Classify pressure class based on duct size."""
        updated_segments = []

        for segment in segments:
            pressure = self._get_pressure_class(segment)
            updated_segment = DuctSegment(
                id=segment.id,
                shape=segment.shape,
                dimension=segment.dimension,
                pressure_class=pressure,
                start_point=segment.start_point,
                end_point=segment.end_point,
                center_point=segment.center_point,
                confidence=segment.confidence,
            )
            updated_segments.append(updated_segment)

        return updated_segments

    def _get_pressure_class(self, segment: DuctSegment) -> PressureClass:
        """Determine pressure class from duct dimensions."""
        dim = segment.dimension

        if dim.diameter:
            diameter = dim.diameter
            if diameter <= 8:
                return PressureClass.LOW
            elif diameter <= 18:
                return PressureClass.MEDIUM
            else:
                return PressureClass.HIGH

        elif dim.width and dim.height:
            area = dim.width * dim.height
            if area < 50:
                return PressureClass.LOW
            elif area <= 250:
                return PressureClass.MEDIUM
            else:
                return PressureClass.HIGH

        return PressureClass.LOW

    def _draw_annotations(self, image: np.ndarray, segments: List[DuctSegment]) -> np.ndarray:
        """Draw color-coded annotations on the image."""
        annotated = image.copy()

        color_map = {
            PressureClass.LOW: (0, 255, 0),
            PressureClass.MEDIUM: (0, 165, 255),
            PressureClass.HIGH: (0, 0, 255),
        }

        for segment in segments:
            color = color_map.get(segment.pressure_class, (255, 255, 255))

            cv2.line(
                annotated,
                (int(segment.start_point.x), int(segment.start_point.y)),
                (int(segment.end_point.x), int(segment.end_point.y)),
                color,
                3,
            )

            cv2.circle(
                annotated,
                (int(segment.center_point.x), int(segment.center_point.y)),
                8,
                color,
                -1,
            )

            text = segment.dimension.raw_text or "?"
            cv2.putText(
                annotated,
                text,
                (int(segment.center_point.x) + 10, int(segment.center_point.y) + 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2,
            )

        return annotated
