'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';
import type { PainMapData } from '@/types';

interface PainMapProps {
  value: PainMapData;
  onChange: (value: PainMapData) => void;
  disabled?: boolean;
}

interface PainRegion {
  id: keyof PainMapData;
  labelKey: string;
  shortLabel: string;
  cx: number;
  cy: number;
}

const PAIN_REGIONS: PainRegion[] = [
  { id: 'frontal', labelKey: 'frontal', shortLabel: 'Fr', cx: 100, cy: 28 },
  { id: 'temporal_left', labelKey: 'temporalLeft', shortLabel: 'TE', cx: 55, cy: 55 },
  { id: 'temporal_right', labelKey: 'temporalRight', shortLabel: 'TD', cx: 145, cy: 55 },
  { id: 'masseter_left', labelKey: 'masseterLeft', shortLabel: 'ME', cx: 60, cy: 100 },
  { id: 'masseter_right', labelKey: 'masseterRight', shortLabel: 'MD', cx: 140, cy: 100 },
  { id: 'trapezio_left', labelKey: 'trapezioLeft', shortLabel: 'TrE', cx: 55, cy: 165 },
  { id: 'trapezio_right', labelKey: 'trapezioRight', shortLabel: 'TrD', cx: 145, cy: 165 },
  { id: 'cervical', labelKey: 'cervical', shortLabel: 'Ce', cx: 100, cy: 145 },
];

const DEFAULT_PAIN_MAP: PainMapData = {
  trapezio_right: 0,
  trapezio_left: 0,
  masseter_right: 0,
  masseter_left: 0,
  temporal_right: 0,
  temporal_left: 0,
  frontal: 0,
  cervical: 0,
};

function getPainColor(val: number): string {
  if (val === 0) return 'rgba(255,255,255,0.08)';
  if (val <= 3) return '#10B981';
  if (val <= 6) return '#F59E0B';
  if (val <= 8) return '#F97316';
  return '#EF4444';
}

export default function PainMap({ value, onChange, disabled }: PainMapProps) {
  const t = useTranslations('form.painMapRegions');
  const svgRef = useRef<SVGSVGElement>(null);
  const pointRefs = useRef<(SVGGElement | null)[]>([]);
  const hasAnimated = useRef(false);
  const [activeRegion, setActiveRegion] = useState<keyof PainMapData | null>(null);

  const data = { ...DEFAULT_PAIN_MAP, ...value };

  useEffect(() => {
    if (!svgRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    // Fade in the whole SVG
    gsap.fromTo(
      svgRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.5, ease: 'dp4Reveal' }
    );

    // Sequential pulse on each point
    pointRefs.current.filter(Boolean).forEach((point, i) => {
      gsap.fromTo(
        point,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'deyaBounce',
          delay: 0.8 + i * 0.1,
          transformOrigin: 'center center',
        }
      );
    });
  }, []);

  const handleRegionClick = useCallback(
    (regionId: keyof PainMapData) => {
      if (disabled) return;
      setActiveRegion(regionId);
    },
    [disabled]
  );

  const handleValueChange = useCallback(
    (regionId: keyof PainMapData, newValue: number) => {
      onChange({ ...data, [regionId]: newValue });
    },
    [data, onChange]
  );

  return (
    <div className="space-y-6">
      {/* SVG face diagram */}
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className="w-64 h-64 sm:w-72 sm:h-72 opacity-0"
        >
          {/* Head outline */}
          <ellipse
            cx="100"
            cy="75"
            rx="50"
            ry="60"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
          />
          {/* Neck */}
          <path
            d="M80,130 Q80,145 75,160 M120,130 Q120,145 125,160"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
          />
          {/* Shoulders */}
          <path
            d="M75,160 Q50,165 40,175 M125,160 Q150,165 160,175"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />

          {/* Pain points */}
          {PAIN_REGIONS.map((region, index) => {
            const val = data[region.id];
            const color = getPainColor(val);
            const isActive = activeRegion === region.id;
            const radius = val > 0 ? 14 + val * 0.5 : 12;

            return (
              <g
                key={region.id}
                ref={(el) => { pointRefs.current[index] = el; }}
                onClick={() => handleRegionClick(region.id)}
                className={disabled ? '' : 'cursor-pointer'}
                role="button"
                tabIndex={0}
                aria-label={`${t(region.labelKey)}: ${val}/10`}
              >
                {/* Glow ring for non-zero values */}
                {val > 0 && (
                  <circle
                    cx={region.cx}
                    cy={region.cy}
                    r={radius + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity={0.3}
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={region.cx}
                  cy={region.cy}
                  r={radius}
                  fill={val > 0 ? `${color}30` : 'rgba(255,255,255,0.04)'}
                  stroke={isActive ? '#F59E0B' : color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />

                {/* Value text */}
                <text
                  x={region.cx}
                  y={region.cy - 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fontWeight="bold"
                  fill={val > 0 ? color : 'rgba(255,255,255,0.3)'}
                >
                  {val}
                </text>

                {/* Label */}
                <text
                  x={region.cx}
                  y={region.cy + 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="6"
                  fill="rgba(255,255,255,0.4)"
                >
                  {region.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Region selector / slider */}
      {activeRegion && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t(PAIN_REGIONS.find((r) => r.id === activeRegion)?.labelKey ?? '')}
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: getPainColor(data[activeRegion]) }}
            >
              {data[activeRegion]}/10
            </span>
          </div>

          {/* Mini scale buttons 0-10 */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: 11 }, (_, i) => {
              const isSelected = data[activeRegion] === i;
              const color = getPainColor(i);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleValueChange(activeRegion, i)}
                  className={`
                    w-9 h-9 rounded-full text-xs font-bold
                    transition-all duration-200
                    focus:outline-none
                    ${isSelected ? 'scale-110' : 'hover:scale-105'}
                  `}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${color}30`,
                          border: `2px solid ${color}`,
                          color: color,
                          boxShadow: `0 0 12px ${color}30`,
                        }
                      : {
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.4)',
                        }
                  }
                >
                  {i}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setActiveRegion(null)}
            className="w-full text-xs text-muted-foreground/80 hover:text-muted-foreground py-1"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Summary of non-zero regions */}
      {!activeRegion && Object.values(data).some((v) => v > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {PAIN_REGIONS.filter((r) => data[r.id] > 0).map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => handleRegionClick(region.id)}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-left"
            >
              <span className="text-xs text-foreground/60">{t(region.labelKey)}</span>
              <span
                className="text-sm font-bold"
                style={{ color: getPainColor(data[region.id]) }}
              >
                {data[region.id]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Instruction */}
      {!activeRegion && (
        <p className="text-xs text-center text-muted-foreground/80">
          Toque em cada ponto para indicar a intensidade da dor (0-10)
        </p>
      )}
    </div>
  );
}
