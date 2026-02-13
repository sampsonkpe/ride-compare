import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  snapPoints = [0.18, 0.58, 0.92],
  initialSnap = 0,
  zIndex = 9999,
}) {
  const dragRef = useRef({
    active: false,
    startY: 0,
    startTranslate: 0,
    translate: 0,
    raf: 0,
  });

  const maxSnap = useMemo(() => Math.max(...snapPoints), [snapPoints]);
  const sheetHeightPx = useMemo(() => Math.round(window.innerHeight * maxSnap), [maxSnap]);

  const snapTranslatePx = useMemo(() => {
    const vh = window.innerHeight;
    const h = Math.round(vh * maxSnap);
    return snapPoints.map((f) => clamp(h - Math.round(vh * f), 0, h));
  }, [snapPoints, maxSnap]);

  const [translatePx, setTranslatePx] = useState(sheetHeightPx);

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
    setTranslatePx(snapTranslatePx[initialSnap] ?? snapTranslatePx[0] ?? 0);
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
    dragRef.current.active = true;
    dragRef.current.startY = clientY;
    dragRef.current.startTranslate = translatePx;
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

    const cur = dragRef.current.translate;

    // dragged down enough => close
    if (cur > sheetHeightPx * 0.88) {
      onClose?.();
      return;
    }

    // snap to nearest
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

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeightPx,
          transform: `translateY(${translatePx}px)`,
          transition: "transform 200ms ease-out",
          background: "var(--rc-sheet-bg, #111827)",
          color: "white",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          boxShadow: "0 -20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* Handle/Header (drag area) */}
        <div
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            beginDrag(e.clientY);
          }}
          onPointerMove={(e) => moveDrag(e.clientY)}
          onPointerUp={endDrag}
          style={{
            padding: "10px 16px 8px",
            userSelect: "none",
            cursor: "grab",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              margin: "0 auto",
              height: 6,
              width: 54,
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
            }}
          />

          {(title || subtitle) ? (
            <div style={{ marginTop: 10 }}>
              {title ? <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div> : null}
              {subtitle ? (
                <div style={{ marginTop: 4, opacity: 0.75, fontSize: 12 }}>{subtitle}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div
          style={{
            height: "calc(100% - 64px)",
            overflowY: "auto",
            padding: "12px 16px 18px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}