import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delay: number = 2000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedValue = useDebounce(value, delay);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const save = async () => {
      setIsSaving(true);
      try {
        await onSave(debouncedValue);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedValue]);

  return { isSaving, lastSaved };
}
