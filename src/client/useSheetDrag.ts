"use client";

import { useRef, useState, type PointerEvent } from "react";

const CLOSE_PX = 96;
const FLICK_PX_PER_MS = 0.6;

/**
 * Drag a bottom sheet down by its handle. It follows the finger 1:1 (with resistance when pulled up),
 * closes on a long drag or a fast flick, and otherwise springs back via the CSS transition.
 */
export function useSheetDrag(onClose: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const origin = useRef<{ y: number; t: number } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    origin.current = { y: e.clientY, t: e.timeStamp };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (!origin.current) return;
    const dy = e.clientY - origin.current.y;
    setOffset(dy > 0 ? dy : dy / 4);
  }

  function onPointerUp(e: PointerEvent<HTMLElement>) {
    if (!origin.current) return;
    const dy = e.clientY - origin.current.y;
    const velocity = dy / Math.max(1, e.timeStamp - origin.current.t);
    origin.current = null;
    setDragging(false);
    setOffset(0);
    if (dy > CLOSE_PX || velocity > FLICK_PX_PER_MS) onClose();
  }

  return {
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    sheetStyle: {
      transform: offset ? `translateY(${offset}px)` : undefined,
      transition: dragging ? "none" : undefined,
    },
  };
}
