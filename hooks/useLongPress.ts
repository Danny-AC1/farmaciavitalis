import { useRef, useCallback } from 'react';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isMovedRef = useRef<boolean>(false);
  const longPressTriggeredRef = useRef<boolean>(false);

  const start = useCallback(
    (e: React.SyntheticEvent) => {
      longPressTriggeredRef.current = false;
      isMovedRef.current = false;

      if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
        const touch = (e as React.TouchEvent).touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      } else if ('clientX' in e) {
        touchStartPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
      } else {
        touchStartPos.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!isMovedRef.current) {
          longPressTriggeredRef.current = true;
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(50);
            } catch (err) {
              // Ignore vibration errors
            }
          }
          onLongPress(e);
        }
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const clear = useCallback(
    (e: React.SyntheticEvent, shouldTriggerClick = true) => {
      const wasTimerActive = !!timeoutRef.current;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Only trigger click if user did NOT move/scroll and long press was NOT triggered
      if (
        shouldTriggerClick && 
        !longPressTriggeredRef.current && 
        !isMovedRef.current && 
        wasTimerActive && 
        onClick
      ) {
        onClick(e);
      }

      longPressTriggeredRef.current = false;
      isMovedRef.current = false;
    },
    [onClick]
  );

  const move = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPos.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPos.current.y);

    // If moved more than 8px, user is scrolling/swiping
    if (diffX > 8 || diffY > 8) {
      isMovedRef.current = true;
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
    onTouchCancel: (e: React.TouchEvent) => clear(e, false),
    onTouchMove: (e: React.TouchEvent) => move(e)
  };
};

export default useLongPress;
