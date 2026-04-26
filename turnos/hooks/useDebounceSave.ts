import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounceSave<T>(
  saveFn: (data: T) => Promise<void>,
  delayMs = 3000
): {
  scheduleSave: (data: T) => void;
  schedulesSave: (data: T) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: (data: T) => Promise<void>;
} {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const saveNow = useCallback(async (data: T) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsSaving(true);
    try {
      await saveFnRef.current(data);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, []);

  const scheduleSave = useCallback((data: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow(data);
    }, delayMs);
  }, [delayMs, saveNow]);

  return {
    scheduleSave,
    schedulesSave: scheduleSave,
    isSaving,
    lastSaved,
    saveNow,
  };
}
