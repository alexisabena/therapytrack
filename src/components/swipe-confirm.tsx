"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";

const CONFIRM_THRESHOLD = 0.85;
const THUMB_SIZE = 52;

export function SwipeConfirm({
  onConfirm,
  label = "Desliza para confirmar",
  disabled = false,
}: {
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ startX: number; startPercent: number; maxDragPx: number } | null>(null);
  const [percent, setPercent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled || confirmed) return;
    const track = trackRef.current;
    if (!track) return;
    const trackWidth = track.getBoundingClientRect().width;
    dragInfo.current = {
      startX: e.clientX,
      startPercent: percent,
      maxDragPx: Math.max(trackWidth - THUMB_SIZE, 1),
    };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || !dragInfo.current) return;
    const { startX, startPercent, maxDragPx } = dragInfo.current;
    const deltaPercent = (e.clientX - startX) / maxDragPx;
    setPercent(Math.min(1, Math.max(0, startPercent + deltaPercent)));
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    dragInfo.current = null;
    if (percent >= CONFIRM_THRESHOLD) {
      setPercent(1);
      setConfirmed(true);
      onConfirm();
    } else {
      setPercent(0);
    }
  }

  return (
    <div
      ref={trackRef}
      className="relative h-14 rounded-full bg-neutral-200 overflow-hidden select-none"
    >
      <div
        className="absolute inset-y-0 left-0 bg-green-500"
        style={{
          width: `calc(${THUMB_SIZE}px + ${percent} * (100% - ${THUMB_SIZE}px))`,
          transition: dragging ? "none" : "width 200ms ease-out",
        }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-neutral-600 pointer-events-none"
        style={{ opacity: Math.max(0, 1 - percent * 1.4) }}
      >
        {confirmed ? "¡Registrado!" : label}
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute top-0 left-0 flex items-center justify-center rounded-full bg-green-600 text-white shadow-md ${
          disabled || confirmed ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          left: `calc(${percent} * (100% - ${THUMB_SIZE}px))`,
          touchAction: "none",
          transition: dragging ? "none" : "left 200ms ease-out",
        }}
      >
        <Check size={24} />
      </div>
    </div>
  );
}
