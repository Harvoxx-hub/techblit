import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '@/lib/apiService';

interface AutoSaveOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
  manualSave: () => Promise<void>;
}

export function useAutoSave<T>(
  documentId: string | null,
  data: T,
  options: AutoSaveOptions = {}
): AutoSaveState {
  const {
    interval = 30000, // 30 seconds
    enabled = true,
    onSave,
    onError,
    onSuccess
  } = options;

  const [state, setState] = useState<Omit<AutoSaveState, 'manualSave'>>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isInitialMount = useRef(true);

  // Serialize data for comparison
  const serializeData = useCallback((data: T): string => {
    return JSON.stringify(data, (key, value) => {
      // Skip functions and undefined values
      if (typeof value === 'function' || value === undefined) {
        return undefined;
      }
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  }, []);

  // Save function
  const save = useCallback(async (dataToSave: T) => {
    if (!documentId || !enabled) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      if (onSave) {
        await onSave(dataToSave);
      } else {
        // Default save via API
        await apiService.updatePost(documentId, {
          ...dataToSave,
          lastAutoSaved: new Date().toISOString()
        });
      }

      const now = new Date();
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: now,
        hasUnsavedChanges: false,
        error: null
      }));

      lastSavedDataRef.current = serializeData(dataToSave);
      onSuccess?.(dataToSave);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }));
      onError?.(error as Error);
    }
  }, [documentId, enabled, onSave, onSuccess, onError, serializeData]);

  // Check for changes and schedule save
  useEffect(() => {
    if (!enabled || !documentId) return;

    const currentDataString = serializeData(data);
    const hasChanges = currentDataString !== lastSavedDataRef.current;

    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedDataRef.current = currentDataString;
      return;
    }

    setState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }));

    if (hasChanges) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        save(data);
      }, interval);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, documentId, enabled, interval, save, serializeData]);

  // Manual save function
  const manualSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return save(data);
  }, [save, data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    manualSave
  };
}

// Hook for auto-save with visual indicator
export function useAutoSaveIndicator(autoSaveState: AutoSaveState) {
  const getIndicatorText = () => {
    if (autoSaveState.isSaving) return 'Saving...';
    if (autoSaveState.error) return 'Save failed';
    if (autoSaveState.hasUnsavedChanges) return 'Unsaved changes';
    if (autoSaveState.lastSaved) return `Saved ${formatLastSaved(autoSaveState.lastSaved)}`;
    return 'All changes saved';
  };

  const getIndicatorColor = () => {
    if (autoSaveState.isSaving) return 'text-blue-600';
    if (autoSaveState.error) return 'text-red-600';
    if (autoSaveState.hasUnsavedChanges) return 'text-yellow-600';
    return 'text-green-600';
  };

  return {
    text: getIndicatorText(),
    color: getIndicatorColor(),
    isSaving: autoSaveState.isSaving,
    hasError: !!autoSaveState.error,
    hasUnsavedChanges: autoSaveState.hasUnsavedChanges
  };
}

// Utility function to format last saved time
function formatLastSaved(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    return date.toLocaleTimeString();
  }
}

export default useAutoSave;
