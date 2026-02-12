import { useEffect, useMemo, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  headerRight,
  headerBottom,
  children,
  snapPoints = [0.18, 0.58, 0.92],
  initialSnap = 1,
  zIndex = 50,
}) {
  const sheetRef = useRef(null);
  const dragRef = useRef({
    active: false,
    startY: 0,
    startTranslate: 0,
    translate: 0,
    raf: 0,
  });

  const points = useMemo(() => {
    return snapPoints.map((f) => clamp(1 - f, 0, 1));
  }, [snapPoints]);

  const [snapIndex, setSnapIndex] = useState(initialSnap);
  const [translate, setTranslate] = useState(1);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Open/close animations
  useEffect(() => {
    if (!open) {
      setTranslate(1);
      return;
    }
    setSnapIndex(initialSnap);
    setTranslate(points[initialSnap] ?? points[1] ?? 0.42);
  }, [open, initialSnap, points]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const heightPx = () => window.innerHeight;

  const setTranslateRaf = (v) => {
    dragRef.current.translate = v;
    cancelAnimationFrame(dragRef.current.raf);
    dragRef.current.raf = requestAnimationFrame(() => setTranslate(v));
  };

  const beginDrag = (clientY) => {
    dragRef.current.active = true;
    dragRef.current.startY = clientY;
    dragRef.current.startTranslate = translate;
  };

  const moveDrag = (clientY) => {
    if (!dragRef.current.active) return;
    const dy = clientY - dragRef.current.startY;
    const delta = dy / heightPx();
    const next = clamp(dragRef.current.startTranslate + delta, 0, 1);
    setTranslateRaf(next);
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    const cur = dragRef.current.translate;
    let best = 0;
    let bestDist = Infinity;

    points.forEach((p, idx) => {
      const d = Math.abs(cur - p);
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    });

    // dragged far down -> close
    if (cur > 0.82) {
      onClose?.();
      return;
    }

    setSnapIndex(best);
    setTranslate(points[best]);
  };

  const onPointerDown = (e) => {
    if (!open) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    beginDrag(e.clientY);
  };
  const onPointerMove = (e) => moveDrag(e.clientY);
  const onPointerUp = () => endDrag();

  if (!open) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close sheet"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      {/* sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={[
          "absolute left-0 right-0 bottom-0",
          "bg-card border-t border-border",
          "rounded-t-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.25)]",
          "transition-transform duration-200 ease-out",
        ].join(" ")}
        style={{
          transform: `translateY(${translate * 100}%)`,
          willChange: "transform",
        }}
      >
        {/* sticky drag handle + header */}
        <div
          className="px-4 pt-3 pb-3 select-none sticky top-0 bg-card/95 backdrop-blur border-b border-border"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />

          {title || subtitle ? (
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {title ? <div className="text-sm font-semibold">{title}</div> : null}
                {subtitle ? (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {subtitle}
                  </div>
                ) : null}
              </div>

              {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
          ) : null}

          {headerBottom ? <div className="mt-3">{headerBottom}</div> : null}
        </div>

        {/* content */}
        <div className="max-h-[82vh] overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}