'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';

interface BMIData {
  peso: string;
  altura: string;
  imc: number | null;
  classificacao: string;
}

interface BMICalculatorProps {
  value: BMIData;
  onChange: (value: BMIData) => void;
  disabled?: boolean;
}

function calculateBMIValue(pesoStr: string, alturaStr: string): { imc: number | null; classificacaoKey: string } {
  const peso = parseFloat(pesoStr.replace(',', '.'));
  const alturaRaw = parseFloat(alturaStr.replace(',', '.'));

  if (!peso || !alturaRaw || peso <= 0 || alturaRaw <= 0) {
    return { imc: null, classificacaoKey: '' };
  }

  // Auto-detect: if > 3, treat as cm; otherwise, meters
  const alturaM = alturaRaw > 3 ? alturaRaw / 100 : alturaRaw;
  const imc = peso / (alturaM * alturaM);
  const imcRounded = Math.round(imc * 10) / 10;

  let classificacaoKey = '';
  if (imc < 18.5) classificacaoKey = 'underweight';
  else if (imc < 25) classificacaoKey = 'normal';
  else if (imc < 30) classificacaoKey = 'overweight';
  else if (imc < 35) classificacaoKey = 'obesityI';
  else if (imc < 40) classificacaoKey = 'obesityII';
  else classificacaoKey = 'obesityIII';

  return { imc: imcRounded, classificacaoKey };
}

function getBMIColor(imc: number | null): string {
  if (!imc) return 'rgba(255,255,255,0.3)';
  if (imc < 18.5) return '#60A5FA'; // blue
  if (imc < 25) return '#10B981'; // green
  if (imc < 30) return '#F59E0B'; // amber
  if (imc < 35) return '#F97316'; // orange
  return '#EF4444'; // red
}

export default function BMICalculator({ value, onChange, disabled }: BMICalculatorProps) {
  const t = useTranslations('form.bmi');
  const resultRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [prevIMC, setPrevIMC] = useState<number | null>(null);

  const data = useMemo(() => ({
    peso: value?.peso || '',
    altura: value?.altura || '',
    imc: value?.imc || null,
    classificacao: value?.classificacao || '',
  }), [value]);

  // Calculate BMI on input change
  const handleFieldChange = (field: 'peso' | 'altura', val: string) => {
    const newData = { ...data, [field]: val };
    const { imc, classificacaoKey } = calculateBMIValue(
      field === 'peso' ? val : data.peso,
      field === 'altura' ? val : data.altura
    );
    newData.imc = imc;
    newData.classificacao = classificacaoKey ? t(`classifications.${classificacaoKey}`) : '';
    onChange(newData);
  };

  // Animate counter when IMC changes
  useEffect(() => {
    if (data.imc !== null && data.imc !== prevIMC && counterRef.current) {
      const start = prevIMC || 0;
      const end = data.imc;

      gsap.fromTo(
        { val: start },
        { val: start },
        {
          val: end,
          duration: 1.2,
          ease: 'dp4Reveal',
          onUpdate: function () {
            if (counterRef.current) {
              counterRef.current.textContent = this.targets()[0].val.toFixed(1);
            }
          },
        }
      );

      // Fade in result
      if (resultRef.current && prevIMC === null) {
        gsap.fromTo(
          resultRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'dp4Luxe' }
        );
      }

      setPrevIMC(data.imc);
    }
  }, [data.imc, prevIMC]);

  const imcColor = getBMIColor(data.imc);

  return (
    <div className="space-y-5">
      {/* Weight input */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground/90">{t('weightLabel')}</label>
        <div className="border-2 border-white/[0.08] rounded-xl px-4 py-3 focus-within:border-amber-500/40 transition-colors">
          <input
            type="text"
            inputMode="decimal"
            value={data.peso}
            onChange={(e) => handleFieldChange('peso', e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder={t('weightPlaceholder')}
            disabled={disabled}
            className="w-full bg-transparent text-foreground text-lg focus:outline-none placeholder:text-muted-foreground/80"
          />
        </div>
      </div>

      {/* Height input */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground/90">{t('heightLabel')}</label>
        <div className="border-2 border-white/[0.08] rounded-xl px-4 py-3 focus-within:border-amber-500/40 transition-colors">
          <input
            type="text"
            inputMode="decimal"
            value={data.altura}
            onChange={(e) => handleFieldChange('altura', e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder={t('heightPlaceholder')}
            disabled={disabled}
            className="w-full bg-transparent text-foreground text-lg focus:outline-none placeholder:text-muted-foreground/80"
          />
        </div>
      </div>

      {/* BMI Result */}
      {data.imc !== null && (
        <div
          ref={resultRef}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 text-center space-y-2"
        >
          <p className="text-xs text-muted-foreground/90 uppercase tracking-wider">
            {t('resultLabel')}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span
              ref={counterRef}
              className="text-4xl font-bold"
              style={{ color: imcColor }}
            >
              {data.imc.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground/80">{t('unit')}</span>
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: imcColor }}
          >
            {data.classificacao}
          </p>

          {/* Visual bar */}
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mt-3">
            {[
              { max: 18.5, color: '#60A5FA', label: t('barLabels.underweight') },
              { max: 25, color: '#10B981', label: t('barLabels.normal') },
              { max: 30, color: '#F59E0B', label: t('barLabels.overweight') },
              { max: 35, color: '#F97316', label: t('barLabels.obesityI') },
              { max: 50, color: '#EF4444', label: t('barLabels.obesityIIPlus') },
            ].map((range, i) => {
              const isActive = data.imc !== null && (
                (i === 0 && data.imc < range.max) ||
                (i === 1 && data.imc >= 18.5 && data.imc < range.max) ||
                (i === 2 && data.imc >= 25 && data.imc < range.max) ||
                (i === 3 && data.imc >= 30 && data.imc < range.max) ||
                (i === 4 && data.imc >= 35)
              );

              return (
                <div
                  key={range.label}
                  className="flex-1 rounded-sm transition-opacity duration-300"
                  style={{
                    backgroundColor: range.color,
                    opacity: isActive ? 1 : 0.15,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
