import { ProcessingResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

class HvacApi {
  async processDrawing(file: File): Promise<ProcessingResult> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/hvac/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(response.status, error.detail || "Failed to process drawing");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        error instanceof Error ? error.message : "Failed to process drawing"
      );
    }
  }

  async getResults(jobId: string): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hvac/results/${jobId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(404, "Job not found");
        }
        const error = await response.json();
        throw new ApiError(response.status, error.detail || "Failed to get results");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        error instanceof Error ? error.message : "Failed to get results"
      );
    }
  }

  getImageUrl(jobId: string): string {
    return `${API_BASE_URL}/results/${jobId}_annotated.png`;
  }
}

export const api = new HvacApi();
