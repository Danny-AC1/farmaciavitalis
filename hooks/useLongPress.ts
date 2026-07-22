import { useState, useRef, useCallback } from 'react';

interface LongPressOptions {
  threshold?: number; // ms to trigger long press, default 500ms
  onLongPress: (e: React.SyntheticEvent) => void;
  onClick?: (e: React.SyntheticEvent) => void;
}

export const useLongPress = ({
  threshold = 500,
  onLongPress,
  onClick
}: LongPressOptions) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.SyntheticEvent) => {
      setLongPressTriggered(false);
      
      if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
        const touch = (e as React.TouchEvent).touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      } else {
        touchStartPos.current = null;
      }

      timeoutRef.current = setTimeout(() => {
        setLongPressTriggered(true);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch (err) {
            // Ignore vibration errors
          }
        }
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const clear = useCallback(
    (e: React.SyntheticEvent, shouldTriggerClick = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(e);
      }
      setLongPressTriggered(false);
    },
    [longPressTriggered, onClick]
  );

  const move = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPos.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPos.current.y);

    // If moved more than 10px, cancel long press (user is scrolling)
    if (diffX > 10 || diffY > 10) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onTouchMove: (e: React.TouchEvent) => move(e)
  };
};
