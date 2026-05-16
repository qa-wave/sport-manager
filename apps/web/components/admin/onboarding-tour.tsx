'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Tour step definitions ────────────────────────── */

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigace',
    description: 'Tady najdete vše — události, členy, týmy a zprávy.',
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Přehled klubu',
    description: 'Tady vidíte přehled klubu — co se děje dnes a tento týden.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    title: 'Rychlé vyhledávání',
    description: 'Stiskněte ⌘K pro rychlé vyhledávání a navigaci v celé aplikaci.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="new-event"]',
    title: 'První událost',
    description: 'Začněte vytvořením prvního tréninku nebo zápasu a pozvěte tým.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="help"]',
    title: 'Jste připraveni!',
    description: 'Pokud potřebujete pomoc, klikněte na ? nebo nás kontaktujte přes chat.',
    placement: 'left',
  },
];

const TOUR_STORAGE_KEY = 'tour-completed';

/* ── Geometry helpers ─────────────────────────────── */

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 12; // spotlight padding around target

/* ── Tooltip positioning ──────────────────────────── */

function calcTooltipPos(rect: Rect, placement: TourStep['placement'], tooltipW: number, tooltipH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 16;

  let top = 0;
  let left = 0;
  let arrowSide: 'top' | 'bottom' | 'left' | 'right' = 'top';

  switch (placement) {
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + PAD + 6;
      arrowSide = 'left';
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - PAD - 6;
      arrowSide = 'right';
      break;
    case 'top':
      top = rect.top - tooltipH - PAD - 6;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowSide = 'bottom';
      break;
    case 'bottom':
    default:
      top = rect.top + rect.height + PAD + 6;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowSide = 'top';
      break;
  }

  // Clamp to viewport
  left = Math.max(margin, Math.min(left, vw - tooltipW - margin));
  top = Math.max(margin, Math.min(top, vh - tooltipH - margin));

  return { top, left, arrowSide };
}

/* ── Spotlight overlay ────────────────────────────── */

function SpotlightOverlay({ rect }: { rect: Rect | null }) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[9998] bg-black/60 transition-all duration-300"
        style={{ pointerEvents: 'none' }}
      />
    );
  }

  const sp = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Build clip-path that cuts a rounded rectangle hole
  const rounding = 10;
  const path = [
    'M 0 0',
    `L ${window.innerWidth} 0`,
    `L ${window.innerWidth} ${window.innerHeight}`,
    `L 0 ${window.innerHeight}`,
    'Z',
    `M ${sp.left + rounding} ${sp.top}`,
    `Q ${sp.left} ${sp.top} ${sp.left} ${sp.top + rounding}`,
    `L ${sp.left} ${sp.top + sp.height - rounding}`,
    `Q ${sp.left} ${sp.top + sp.height} ${sp.left + rounding} ${sp.top + sp.height}`,
    `L ${sp.left + sp.width - rounding} ${sp.top + sp.height}`,
    `Q ${sp.left + sp.width} ${sp.top + sp.height} ${sp.left + sp.width} ${sp.top + sp.height - rounding}`,
    `L ${sp.left + sp.width} ${sp.top + rounding}`,
    `Q ${sp.left + sp.width} ${sp.top} ${sp.left + sp.width - rounding} ${sp.top}`,
    'Z',
  ].join(' ');

  return (
    <svg
      className="fixed inset-0 z-[9998] transition-all duration-300"
      style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}
      aria-hidden
    >
      <path d={path} fill="rgba(0,0,0,0.62)" fillRule="evenodd" />
      {/* Highlight ring around target */}
      <rect
        x={sp.left}
        y={sp.top}
        width={sp.width}
        height={sp.height}
        rx={rounding}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

/* ── Tooltip ──────────────────────────────────────── */

function Tooltip({
  step,
  stepIndex,
  totalSteps,
  rect,
  onNext,
  onSkip,
  onClose,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  rect: Rect | null;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; arrowSide: string } | null>(null);
  const isLast = stepIndex === totalSteps - 1;

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    const el = tooltipRef.current;
    const w = el.offsetWidth || 280;
    const h = el.offsetHeight || 120;

    if (rect) {
      setPos(calcTooltipPos(rect, step.placement ?? 'bottom', w, h));
    } else {
      // Center fallback
      setPos({
        top: window.innerHeight / 2 - h / 2,
        left: window.innerWidth / 2 - w / 2,
        arrowSide: 'none',
      });
    }
  }, [rect, step.placement]);

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[9999] w-[280px] rounded-xl border border-border/60 bg-card shadow-xl',
        'animate-fade-up',
      )}
      style={
        pos
          ? { top: pos.top, left: pos.left, transition: 'top 0.25s ease, left 0.25s ease' }
          : { opacity: 0, top: -9999, left: -9999 }
      }
      role="dialog"
      aria-modal="false"
      aria-label={step.title}
    >
      {/* Arrow */}
      {pos && pos.arrowSide !== 'none' && (
        <div
          className={cn(
            'absolute h-3 w-3 rotate-45 border bg-card',
            pos.arrowSide === 'top' && '-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0 border-border/60',
            pos.arrowSide === 'bottom' && '-bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0 border-border/60',
            pos.arrowSide === 'left' && '-left-1.5 top-1/2 -translate-y-1/2 border-b-0 border-l-0 border-border/60',
            pos.arrowSide === 'right' && '-right-1.5 top-1/2 -translate-y-1/2 border-t-0 border-r-0 border-border/60',
          )}
        />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold text-primary">
              {stepIndex + 1}/{totalSteps}
            </span>
            <span className="text-sm font-semibold">{step.title}</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:text-foreground"
            aria-label="Zavřít tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>

        {/* Progress bar */}
        <div className="mt-3 mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onSkip}
            className="flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <SkipForward className="h-3 w-3" />
            Přeskočit
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isLast ? 'Dokončit' : 'Další'}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────── */

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  // Only run on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if tour should start
  useEffect(() => {
    if (!mounted) return;
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so the page has time to render target elements
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Update spotlight rect when step changes
  const updateRect = useCallback(() => {
    if (!active) return;
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;
    const r = getTargetRect(step.target);
    setRect(r);
    if (r) {
      // Scroll target into view if needed
      const el = document.querySelector(step.target);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active, stepIndex]);

  useEffect(() => {
    updateRect();
    // Also update on window resize
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setActive(false);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      completeTour();
    }
  }, [stepIndex, completeTour]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const handleOverlayClick = useCallback(() => {
    // Clicking outside advances or closes
    handleNext();
  }, [handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') completeTour();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, completeTour, handleNext]);

  if (!mounted || !active) return null;

  const currentStep = TOUR_STEPS[stepIndex];
  if (!currentStep) return null;

  return createPortal(
    <>
      {/* Clickable backdrop */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={handleOverlayClick}
        aria-hidden
      />
      {/* Spotlight */}
      <SpotlightOverlay rect={rect} />
      {/* Tooltip */}
      <Tooltip
        key={stepIndex}
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={TOUR_STEPS.length}
        rect={rect}
        onNext={handleNext}
        onSkip={handleSkip}
        onClose={completeTour}
      />
    </>,
    document.body,
  );
}
