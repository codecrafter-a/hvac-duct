"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { ProcessingResult, DuctSegment } from "@/lib/types";

export interface HvacState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  result: ProcessingResult | null;
  selectedDuct: DuctSegment | null;
}

export function useHvac() {
  const [state, setState] = useState<HvacState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    result: null,
    selectedDuct: null,
  });

  const processDrawing = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, isProcessing: true, error: null }));

    try {
      const result = await api.processDrawing(file);
      setState((prev) => ({
        ...prev,
        result,
        isLoading: false,
        isProcessing: false,
      }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        isProcessing: false,
      }));
      throw error;
    }
  }, []);

  const selectDuct = useCallback((duct: DuctSegment | null) => {
    setState((prev) => ({ ...prev, selectedDuct: duct }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      result: null,
      selectedDuct: null,
    });
  }, []);

  return {
    ...state,
    processDrawing,
    selectDuct,
    reset,
  };
}
