import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function BottomSheet({
  open,
  onClose,
  pickupText = "Pickup",
  dropoffText = "Dropoff",
  onAddStop,
  children,
  snapPoints = [0.18, 0.66, 0.92],
  initialSnap = 1,
  zIndex = 9999,
  maxWidthClass = "max-w-lg",
}) {
  const dragRef = useRef({
    active: false,
    startY: 0,
    startTranslate: 0,
    translate: 0,
    raf: 0,
  });

  const [vh, setVh] = useState(() => window.innerHeight);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxSnap = useMemo(() => Math.max(...snapPoints), [snapPoints]);
  const sheetHeightPx = useMemo(() => Math.round(vh * maxSnap), [vh, maxSnap]);

  const snapTranslatePx = useMemo(() => {
    const h = Math.round(vh * maxSnap);
    return snapPoints.map((f) => clamp(h - Math.round(vh * f), 0, h));
  }, [snapPoints, maxSnap, vh]);

  const [translatePx, setTranslatePx] = useState(sheetHeightPx);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTranslatePx(sheetHeightPx);
      return;
    }
    const target = snapTranslatePx[initialSnap] ?? snapTranslatePx[0] ?? 0;
    setTranslatePx(target);
  }, [open, initialSnap, snapTranslatePx, sheetHeightPx]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const setTranslateRaf = (px) => {
    dragRef.current.translate = px;
    cancelAnimationFrame(dragRef.current.raf);
    dragRef.current.raf = requestAnimationFrame(() => setTranslatePx(px));
  };

  const beginDrag = (clientY) => {
    setIsDragging(true);
    dragRef.current.active = true;
    dragRef.current.startY = clientY;
    dragRef.current.startTranslate = translatePx;
    dragRef.current.translate = translatePx;
  };

  const moveDrag = (clientY) => {
    if (!dragRef.current.active) return;
    const dy = clientY - dragRef.current.startY;
    const next = clamp(dragRef.current.startTranslate + dy, 0, sheetHeightPx);
    setTranslateRaf(next);
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);

    const cur = dragRef.current.translate;

    if (cur > sheetHeightPx * 0.88) {
      onClose?.();
      return;
    }

    let best = 0;
    let bestDist = Infinity;
    snapTranslatePx.forEach((px, idx) => {
      const d = Math.abs(cur - px);
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    });

    setTranslatePx(snapTranslatePx[best]);
  };

  if (!open) return null;

  const iconBtn =
    "p-2 rounded-full hover:bg-muted/60 transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const canAddStop = typeof onAddStop === "function";

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex }}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close sheet"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
          border: "none",
        }}
      />

      {/* Sheet wrapper */}
      <div className={`absolute left-0 right-0 bottom-0 mx-auto w-full ${maxWidthClass} px-4`}>
        <div
          role="dialog"
          aria-modal="true"
          style={{
            height: sheetHeightPx,
            transform: `translateY(${translatePx}px)`,
            transition: isDragging ? "none" : "transform 220ms ease-out",
            background: "hsl(var(--card) / 0.86)",
            backdropFilter: "blur(18px)",
            color: "hsl(var(--foreground))",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: "0 -20px 60px rgba(0,0,0,0.35)",
            overflow: "hidden",
            borderTop: "1px solid hsl(var(--border) / 0.85)",
          }}
        >
          <div
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              beginDrag(e.clientY);
            }}
            onPointerMove={(e) => moveDrag(e.clientY)}
            onPointerUp={endDrag}
            style={{
              padding: "10px 12px 6px",
              userSelect: "none",
              cursor: "grab",
            }}
          >
            <div
              style={{
                margin: "0 auto",
                height: 6,
                width: 54,
                borderRadius: 999,
                background: "hsl(var(--muted-foreground) / 0.35)",
              }}
            />
          </div>

          {/* ROUTE HEADER (separate from Available Rides) */}
          <div
            className="px-3 pb-3 pt-2 border-b border-border/70"
            style={{
              background: "hsl(var(--card) / 0.78)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={onClose} className={iconBtn} aria-label="Close">
                <X className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1 flex items-center justify-center gap-2 text-sm font-semibold">
                <span className="min-w-0 max-w-[38%] truncate text-muted-foreground">
                  {pickupText}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="min-w-0 max-w-[52%] truncate text-primary">
                  {dropoffText}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onAddStop?.()}
                className={iconBtn}
                aria-label="Add stop"
                disabled={!canAddStop}
                title={canAddStop ? "Add stop" : ""}
                style={!canAddStop ? { opacity: 0.45, cursor: "default" } : undefined}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              height: "calc(100% - 106px)",
              overflowY: "auto",
              padding: "12px 16px 18px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}