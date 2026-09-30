import { Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/shared/lib/cn';

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const SCALE_STEP = 0.35;

type InspectableDocumentImageProps = {
  src: string;
  alt: string;
  caption: string;
};

export function InspectableDocumentImage({ src, alt, caption }: InspectableDocumentImageProps) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [fullscreen]);

  return (
    <figure>
      <div className="mb-1 flex items-center justify-between gap-2">
        <figcaption className="text-xs font-medium text-admin-muted">{caption}</figcaption>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-admin-teal"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Full screen
        </button>
      </div>
      <ZoomStage src={src} alt={alt} compact />
      {fullscreen ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-black/90"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="text-sm font-medium">{caption} · zoom and pan to inspect details</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={() => setFullscreen(false)}
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <ZoomStage src={src} alt={alt} />
          </div>
        </div>
      ) : null}
    </figure>
  );
}

function ZoomStage({ src, alt, compact = false }: { src: string; alt: string; compact?: boolean }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const zoomBy = useCallback((delta: number) => {
    setScale((current) => {
      const next = clampScale(current + delta);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      zoomBy(event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (scale <= MIN_SCALE) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.originX + (event.clientX - drag.current.x),
      y: drag.current.originY + (event.clientY - drag.current.y),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="admin-btn-ghost px-2 py-1 text-xs"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomBy(-SCALE_STEP)}
        >
          <Minus className="mr-1 inline h-3.5 w-3.5" />
          Zoom out
        </button>
        <button type="button" className="admin-btn-ghost px-2 py-1 text-xs" onClick={() => zoomBy(SCALE_STEP)}>
          <Plus className="mr-1 inline h-3.5 w-3.5" />
          Zoom in
        </button>
        <button type="button" className="admin-btn-ghost px-2 py-1 text-xs" onClick={reset}>
          <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
          Reset
        </button>
        <span className="text-[11px] text-admin-muted">{Math.round(scale * 100)}%</span>
      </div>
      <div
        ref={stageRef}
        className={cn(
          'overflow-hidden rounded-xl border border-admin-line bg-slate-950/5',
          compact ? 'h-[42vh]' : 'h-full min-h-[70vh]',
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => zoomBy(SCALE_STEP)}
      >
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={src}
            alt={alt}
            draggable={false}
            decoding="async"
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              imageRendering: 'auto',
            }}
          />
        </div>
      </div>
    </div>
  );
}
