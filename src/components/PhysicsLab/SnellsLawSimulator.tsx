import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Waves,
  ArrowRightLeft,
  Box,
  Cable
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';
import { ThreePhysicsStage } from './three/ThreePhysicsStage';

export interface MediumPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  n: number;
  colorDark: string;
  colorLight: string;
}

export const PRESET_MEDIA: MediumPreset[] = [
  { id: 'air', nameAr: 'الهواء (Air)', nameEn: 'Air', n: 1.0003, colorDark: 'rgba(30, 41, 59, 0.35)', colorLight: 'rgba(241, 245, 249, 0.5)' },
  { id: 'water', nameAr: 'الماء النقي (Water)', nameEn: 'Water', n: 1.333, colorDark: 'rgba(6, 182, 212, 0.25)', colorLight: 'rgba(6, 182, 212, 0.15)' },
  { id: 'ethanol', nameAr: 'الإيثانول (Ethanol)', nameEn: 'Ethanol', n: 1.360, colorDark: 'rgba(16, 185, 129, 0.25)', colorLight: 'rgba(16, 185, 129, 0.15)' },
  { id: 'oil', nameAr: 'الزيت النباتي (Oil)', nameEn: 'Vegetable Oil', n: 1.470, colorDark: 'rgba(245, 158, 11, 0.25)', colorLight: 'rgba(245, 158, 11, 0.15)' },
  { id: 'crown_glass', nameAr: 'زجاج كراون للعدسات', nameEn: 'Crown Glass', n: 1.520, colorDark: 'rgba(99, 102, 241, 0.28)', colorLight: 'rgba(99, 102, 241, 0.18)' },
  { id: 'quartz', nameAr: 'الكوارتز (Quartz)', nameEn: 'Quartz', n: 1.540, colorDark: 'rgba(139, 92, 246, 0.28)', colorLight: 'rgba(139, 92, 246, 0.18)' },
  { id: 'flint_glass', nameAr: 'الزجاج الصواني (Flint)', nameEn: 'Flint Glass', n: 1.660, colorDark: 'rgba(168, 85, 247, 0.32)', colorLight: 'rgba(168, 85, 247, 0.2)' },
  { id: 'diamond', nameAr: 'الألماس النقي (Diamond)', nameEn: 'Diamond', n: 2.417, colorDark: 'rgba(236, 72, 153, 0.35)', colorLight: 'rgba(236, 72, 153, 0.22)' }
];

export const SnellsLawSimulator: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  // View Mode ('2d' | '3d' | 'fiber') declared before useEffect dependencies
  const [simViewMode, setSimViewMode] = useState<'2d' | '3d' | 'fiber'>('2d');
  // State: Refractive indices & Angle of incidence
  const [n1, setN1] = useState<number>(1.0003); // Medium 1
  const [n2, setN2] = useState<number>(1.52);   // Medium 2 (e.g. Crown Glass)
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 230, y: 55 }); // Full 2D laser position
  const [hitPointX, setHitPointX] = useState<number>(390); // Boundary hit point X
  const [dragTarget, setDragTarget] = useState<'none' | 'laser' | 'hitPoint'>('none');
  const [laserWavelengthNm, setLaserWavelengthNm] = useState<number>(632.8); // Red laser
  const [showNormal, setShowNormal] = useState<boolean>(true);
  const [showProtractor, setShowProtractor] = useState<boolean>(true);
  const [showWavefronts, setShowWavefronts] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Speed of light in vacuum
  const C_VACUUM = 299792458; // m/s
  const midY = 190;

  // Physics Calculations according to Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
  const dx = hitPointX - laserPos.x;
  const dy = Math.max(10, midY - laserPos.y);
  const rawAngle = (Math.abs(Math.atan2(dx, dy)) * 180) / Math.PI;
  const theta1Deg = Math.max(0.1, Math.min(89.5, rawAngle));
  const theta1Rad = (theta1Deg * Math.PI) / 180;
  const sinTheta1 = Math.sin(theta1Rad);
  const sinTheta2 = (n1 / n2) * sinTheta1;
  const isTotalInternalReflection = sinTheta2 > 1.0;
  const theta2Rad = !isTotalInternalReflection ? Math.asin(sinTheta2) : 0;
  const theta2Deg = !isTotalInternalReflection ? (theta2Rad * 180) / Math.PI : 0;
  const criticalAngleDeg = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

  // Wave speed in each medium
  const v1 = C_VACUUM / n1;
  const v2 = C_VACUUM / n2;
  const v1KmS = (v1 / 1000).toFixed(0);
  const v2KmS = (v2 / 1000).toFixed(0);

  // Wavelength in each medium
  const lambda1Nm = laserWavelengthNm / n1;
  const lambda2Nm = laserWavelengthNm / n2;

  // Wavelength to RGB color
  const getLaserColor = (nm: number): string => {
    if (nm < 420) return '#a855f7';
    if (nm < 480) return '#3b82f6';
    if (nm < 540) return '#06b6d4';
    if (nm < 580) return '#22c55e';
    if (nm < 610) return '#eab308';
    if (nm < 650) return '#f97316';
    return '#ef4444';
  };

  const laserColor = getLaserColor(laserWavelengthNm);

  // Canvas Rendering
  useEffect(() => {
    if (simViewMode !== '2d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    // Clear background
    ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Dynamic tint for Medium 1 (Top)
    const m1Color = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(241, 245, 249, 0.7)';
    ctx.fillStyle = m1Color;
    ctx.fillRect(0, 0, width, midY);

    // Dynamic tint for Medium 2 (Bottom)
    const m2Alpha = Math.min(0.7, 0.15 + (n2 - 1.0) * 0.25);
    ctx.fillStyle = isDark ? `rgba(99, 102, 241, ${m2Alpha})` : `rgba(99, 102, 241, ${m2Alpha * 0.75})`;
    ctx.fillRect(0, midY, width, height - midY);

    // Medium Boundary (Interface Line)
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Subtle Grid pattern
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const midX = hitPointX;

    // Semi-Transparent Optical Protractor (منقلة دائرية مدرسية centered at hitPointX)
    if (showProtractor) {
      ctx.save();
      const prRadius = 150;
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(midX, midY, prRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Degree tick marks
      ctx.font = '9px monospace';
      ctx.fillStyle = isDark ? 'rgba(203, 213, 225, 0.5)' : 'rgba(71, 85, 105, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let deg = 0; deg < 360; deg += 10) {
        const rad = (deg * Math.PI) / 180;
        const isMajor = deg % 30 === 0;
        const tickLen = isMajor ? 12 : 6;
        const x1 = midX + Math.cos(rad) * (prRadius - tickLen);
        const y1 = midY + Math.sin(rad) * (prRadius - tickLen);
        const x2 = midX + Math.cos(rad) * prRadius;
        const y2 = midY + Math.sin(rad) * prRadius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (isMajor && deg !== 0 && deg !== 180) {
          const lblRad = prRadius - 20;
          const lx = midX + Math.cos(rad) * lblRad;
          const ly = midY + Math.sin(rad) * lblRad;
          const normalAngle = deg <= 180 ? Math.abs(deg - 90) : Math.abs(deg - 270);
          ctx.fillText(`${normalAngle}°`, lx, ly);
        }
      }
      ctx.restore();
    }

    // Normal Line (العمود المقام)
    if (showNormal) {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(midX, 20);
      ctx.lineTo(midX, height - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(t('العمود المقام (Normal)', 'Normal Line'), midX, 15);
      ctx.restore();
    }

    // Ray Parameters:
    // Incident ray starts at laserPos (free 2D) and hits (midX, midY)
    const srcX = laserPos.x;
    const srcY = laserPos.y;
    const rayLength = 250;

    // 1. Draw Incident Ray
    ctx.save();
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = laserColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(srcX, srcY);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    // Direction Arrow on Incident Ray
    const midIncX = (srcX + midX) / 2;
    const midIncY = (srcY + midY) / 2;
    const incAngle = Math.atan2(midY - srcY, midX - srcX);
    ctx.fillStyle = laserColor;
    ctx.beginPath();
    ctx.moveTo(midIncX, midIncY);
    ctx.lineTo(midIncX - 10 * Math.cos(incAngle - Math.PI / 6), midIncY - 10 * Math.sin(incAngle - Math.PI / 6));
    ctx.lineTo(midIncX - 10 * Math.cos(incAngle + Math.PI / 6), midIncY - 10 * Math.sin(incAngle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Laser Pointer Body (Draggable anywhere in 2D)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = laserColor;
    ctx.shadowColor = laserColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draggable Halo Ring on Laser
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(srcX, srcY, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Laser position text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('مؤشر الليزر (اسحب بحرية)', 'Laser Gun (Free Drag)'), srcX, srcY - 26);
    ctx.restore();

    // 2. Reflected Ray in Medium 1 (θr = θ1)
    const signX = laserPos.x <= midX ? 1 : -1;
    const reflX = midX + signX * Math.sin(theta1Rad) * rayLength;
    const reflY = midY - Math.cos(theta1Rad) * rayLength;

    ctx.save();
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = isTotalInternalReflection ? 4 : 2;
    ctx.globalAlpha = isTotalInternalReflection ? 1.0 : 0.45;
    ctx.shadowColor = laserColor;
    ctx.shadowBlur = isTotalInternalReflection ? 16 : 4;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(reflX, reflY);
    ctx.stroke();

    // Reflected direction arrow
    const midReflX = (midX + reflX) / 2;
    const midReflY = (midY + reflY) / 2;
    const reflAngle = Math.atan2(reflY - midY, reflX - midX);
    ctx.fillStyle = laserColor;
    ctx.beginPath();
    ctx.moveTo(midReflX, midReflY);
    ctx.lineTo(midReflX - 8 * Math.cos(reflAngle - Math.PI / 6), midReflY - 8 * Math.sin(reflAngle - Math.PI / 6));
    ctx.lineTo(midReflX - 8 * Math.cos(reflAngle + Math.PI / 6), midReflY - 8 * Math.sin(reflAngle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Refracted Ray in Medium 2 (if NOT Total Internal Reflection)
    if (!isTotalInternalReflection) {
      const refrX = midX + signX * Math.sin(theta2Rad) * rayLength;
      const refrY = midY + Math.cos(theta2Rad) * rayLength;

      ctx.save();
      ctx.strokeStyle = laserColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = laserColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(refrX, refrY);
      ctx.stroke();

      // Direction Arrow on Refracted Ray
      const midRefrX = (midX + refrX) / 2;
      const midRefrY = (midY + refrY) / 2;
      const refrAngle = Math.atan2(refrY - midY, refrX - midX);
      ctx.fillStyle = laserColor;
      ctx.beginPath();
      ctx.moveTo(midRefrX, midRefrY);
      ctx.lineTo(midRefrX - 9 * Math.cos(refrAngle - Math.PI / 6), midRefrY - 9 * Math.sin(refrAngle - Math.PI / 6));
      ctx.lineTo(midRefrX - 9 * Math.cos(refrAngle + Math.PI / 6), midRefrY - 9 * Math.sin(refrAngle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Refracted Angle θ2 Arc
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(midX, midY, 60, Math.PI / 2, Math.PI / 2 + (signX > 0 ? theta2Rad : -theta2Rad), signX < 0);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = signX > 0 ? 'left' : 'right';
      ctx.fillText(`θ₂ = ${theta2Deg.toFixed(1)}°`, midX + signX * 30, midY + 45);
      ctx.restore();
    } else {
      // Total Internal Reflection Indicator on boundary
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        t('💥 انعكاس كلي داخلي تام (TIR) - نفاذ الضوء = 0%', '💥 Total Internal Reflection (TIR) - Transmission = 0%'),
        midX,
        midY + 50
      );
      ctx.restore();
    }

    // Incident Angle θ1 Arc
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(midX, midY, 70, -Math.PI / 2 - (signX > 0 ? theta1Rad : -theta1Rad), -Math.PI / 2, signX > 0);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = signX > 0 ? 'right' : 'left';
    ctx.fillText(`θ₁ = ${theta1Deg.toFixed(1)}°`, midX - signX * 30, midY - 45);

    // Reflected Angle θr Arc
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(midX, midY, 50, -Math.PI / 2, -Math.PI / 2 + (signX > 0 ? theta1Rad : -theta1Rad), signX < 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.font = '11px monospace';
    ctx.textAlign = signX > 0 ? 'left' : 'right';
    ctx.fillText(`θr = ${theta1Deg.toFixed(1)}°`, midX + signX * 20, midY - 35);

    // Critical Angle Guideline (if defined on canvas)
    if (criticalAngleDeg !== null) {
      const critRad = (criticalAngleDeg * Math.PI) / 180;
      const critX = midX - signX * Math.sin(critRad) * (rayLength * 0.9);
      const critY = midY - Math.cos(critRad) * (rayLength * 0.9);

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(critX, critY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = signX > 0 ? 'right' : 'left';
      ctx.fillText(`θc=${criticalAngleDeg.toFixed(1)}°`, critX - signX * 5, critY);
    }
    ctx.restore();

    // Hit Point central dot (Draggable Handle on Interface)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(midX, midY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Optional Wavefronts (مقدمات الموجات لتوضيح مبدأ هيجنز)
    if (showWavefronts) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      const step1 = Math.max(12, lambda1Nm * 0.05);
      const step2 = Math.max(12, lambda2Nm * 0.05);

      // Wavefronts in Medium 1
      for (let d = 20; d < rayLength; d += step1) {
        const wx = midX - signX * Math.sin(theta1Rad) * d;
        const wy = midY - Math.cos(theta1Rad) * d;
        const perpX = Math.cos(theta1Rad) * 20;
        const perpY = -signX * Math.sin(theta1Rad) * 20;
        ctx.beginPath();
        ctx.moveTo(wx - perpX, wy - perpY);
        ctx.lineTo(wx + perpX, wy + perpY);
        ctx.stroke();
      }

      // Wavefronts in Medium 2 (shorter spacing if n2 > n1)
      if (!isTotalInternalReflection) {
        for (let d = 20; d < rayLength; d += step2) {
          const wx = midX + signX * Math.sin(theta2Rad) * d;
          const wy = midY + Math.cos(theta2Rad) * d;
          const perpX = Math.cos(theta2Rad) * 20;
          const perpY = -signX * Math.sin(theta2Rad) * 20;
          ctx.beginPath();
          ctx.moveTo(wx - perpX, wy - perpY);
          ctx.lineTo(wx + perpX, wy + perpY);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }, [simViewMode, n1, n2, theta1Deg, laserPos, hitPointX, laserWavelengthNm, showNormal, showProtractor, showWavefronts, isDark, theta1Rad, theta2Rad, theta2Deg, criticalAngleDeg, isTotalInternalReflection, lambda1Nm, lambda2Nm, laserColor, t]);

  // =========================================================================
  // FIBER OPTICS SIMULATION STATE (فيزياء 3: تطبيقات الانعكاس الكلي الداخلي)
  // =========================================================================
  const [fiberNcore, setFiberNcore] = useState<number>(1.62); // قلب الليفة n1
  const [fiberNclad, setFiberNclad] = useState<number>(1.48); // غلاف الليفة n2
  const [fiberThetaInDeg, setFiberThetaInDeg] = useState<number>(12.0); // زاوية السقوط من الهواء (θin)
  const fiberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fiber Optics Physics Formulas:
  // 1. Critical angle between Core and Cladding:
  const fiberCritRad = fiberNcore > fiberNclad ? Math.asin(fiberNclad / fiberNcore) : null;
  const fiberCritDeg = fiberCritRad ? (fiberCritRad * 180) / Math.PI : null;

  // 2. Numerical Aperture: NA = sqrt(n_core^2 - n_clad^2)
  const fiberNA = Math.sqrt(Math.max(0, fiberNcore * fiberNcore - fiberNclad * fiberNclad));

  // 3. Acceptance Angle in air (n0 = 1.0): sin(theta_acc) = NA / n0
  const sinAcceptance = Math.min(1.0, fiberNA);
  const fiberAcceptanceDeg = (Math.asin(sinAcceptance) * 180) / Math.PI;

  // 4. Refraction at entrance face (Air n0=1 -> Core n_core):
  const thetaInRad = (fiberThetaInDeg * Math.PI) / 180;
  const sinRefrAtFace = Math.sin(thetaInRad) / fiberNcore;
  const thetaRefrRad = Math.asin(Math.max(-1, Math.min(1, sinRefrAtFace)));
  const thetaRefrDeg = (thetaRefrRad * 180) / Math.PI;

  // 5. Angle of incidence on core-cladding boundary:
  // phi = 90 - |theta_refr|
  const phiBoundaryDeg = 90 - Math.abs(thetaRefrDeg);
  const isFiberTIR = fiberCritDeg !== null && phiBoundaryDeg >= fiberCritDeg;

  // Fiber Optics Canvas Rendering
  useEffect(() => {
    if (simViewMode !== 'fiber') return;
    const canvas = fiberCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const startX = 140;
    const endX = 700;
    const coreTop = 145;
    const coreBottom = 235;
    const coreCenterY = (coreTop + coreBottom) / 2; // 190
    const cladTop = 75;
    const cladBottom = 305;

    // 1. Draw Outer Buffer / Jacket
    ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
    ctx.fillRect(startX, cladTop - 12, endX - startX, 12);
    ctx.fillRect(startX, cladBottom, endX - startX, 12);

    // 2. Draw Cladding (Upper and Lower)
    const cladGradient = ctx.createLinearGradient(0, cladTop, 0, coreTop);
    cladGradient.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.15)');
    cladGradient.addColorStop(1, isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)');
    ctx.fillStyle = cladGradient;
    ctx.fillRect(startX, cladTop, endX - startX, coreTop - cladTop);

    const cladBottomGrad = ctx.createLinearGradient(0, coreBottom, 0, cladBottom);
    cladBottomGrad.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)');
    cladBottomGrad.addColorStop(1, isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.15)');
    ctx.fillStyle = cladBottomGrad;
    ctx.fillRect(startX, coreBottom, endX - startX, cladBottom - coreBottom);

    // Cladding boundary lines
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, cladTop, endX - startX, cladBottom - cladTop);

    // 3. Draw Core (Center)
    const coreGradient = ctx.createLinearGradient(0, coreTop, 0, coreBottom);
    coreGradient.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)');
    coreGradient.addColorStop(0.5, isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.35)');
    coreGradient.addColorStop(1, isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(startX, coreTop, endX - startX, coreBottom - coreTop);

    // Core-Cladding Interface Lines
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, coreTop);
    ctx.lineTo(endX, coreTop);
    ctx.moveTo(startX, coreBottom);
    ctx.lineTo(endX, coreBottom);
    ctx.stroke();

    // Core Entrance Facet line
    ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, coreTop);
    ctx.lineTo(startX, coreBottom);
    ctx.stroke();

    // 4. Labels on Layers
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.fillText(`${t('غلاف الليفة', 'Cladding')} (n₂ = ${fiberNclad.toFixed(2)})`, startX + 15, cladTop + 25);
    ctx.fillText(`${t('غلاف الليفة', 'Cladding')} (n₂ = ${fiberNclad.toFixed(2)})`, startX + 15, cladBottom - 15);

    ctx.fillStyle = isDark ? '#a5b4fc' : '#4338ca';
    ctx.fillText(`${t('قلب الليفة البصرية (Glass Core)', 'Optical Fiber Core')} (n₁ = ${fiberNcore.toFixed(2)})`, startX + 15, coreCenterY + 4);

    // 5. Acceptance Cone at Entrance Facet
    const coneRadius = 110;
    const accRad = (fiberAcceptanceDeg * Math.PI) / 180;
    const withinAcceptance = Math.abs(fiberThetaInDeg) <= fiberAcceptanceDeg;

    ctx.save();
    ctx.fillStyle = withinAcceptance ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';
    ctx.strokeStyle = withinAcceptance ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, coreCenterY);
    ctx.arc(startX, coreCenterY, coneRadius, Math.PI - accRad, Math.PI + accRad, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px monospace';
    ctx.fillStyle = withinAcceptance ? '#10b981' : '#f43f5e';
    ctx.textAlign = 'right';
    ctx.fillText(t(`مخروط القبول (θacc = ±${fiberAcceptanceDeg.toFixed(1)}°)`, `Acceptance Cone (θacc = ±${fiberAcceptanceDeg.toFixed(1)}°)`), startX - 15, coreCenterY - 45);
    ctx.restore();

    // 6. Normal at Entrance Facet (horizontal)
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX - 100, coreCenterY);
    ctx.lineTo(startX + 80, coreCenterY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 7. Laser Gun & Incident Ray
    const laserDist = 95;
    const laserX = startX - Math.cos(thetaInRad) * laserDist;
    const laserY = coreCenterY - Math.sin(thetaInRad) * laserDist;

    // Laser body
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(laserX, laserY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(laserX, laserY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Incident Ray
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(laserX, laserY);
    ctx.lineTo(startX, coreCenterY);
    ctx.stroke();

    // Angle θin arc
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(startX, coreCenterY, 40, Math.PI, Math.PI + thetaInRad, thetaInRad < 0);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`θin = ${fiberThetaInDeg.toFixed(1)}°`, startX - 45, coreCenterY + (fiberThetaInDeg >= 0 ? -12 : 20));
    ctx.restore();

    // 8. Ray Tracing inside the Core
    // Starts at (startX, coreCenterY) traveling at angle thetaRefrRad
    let currX = startX;
    let currY = coreCenterY;
    let currAngle = thetaRefrRad; // angle with horizontal axis

    ctx.save();
    let bounceCount = 0;
    const maxBounces = 12;
    let rayAlpha = 1.0;

    while (currX < endX && bounceCount < maxBounces) {
      bounceCount++;
      const goingDown = currAngle > 0;
      const targetY = goingDown ? coreBottom : coreTop;
      const dy = targetY - currY;
      const dx = Math.abs(dy / Math.tan(currAngle || 0.001));

      let nextX = currX + dx;
      let nextY = targetY;

      if (nextX > endX) {
        // Exits before next bounce
        const fraction = (endX - currX) / dx;
        nextY = currY + dy * fraction;
        nextX = endX;
      }

      // Draw segment inside core
      ctx.strokeStyle = isFiberTIR ? '#38bdf8' : 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 3;
      ctx.globalAlpha = rayAlpha;
      ctx.shadowColor = isFiberTIR ? '#38bdf8' : '#ef4444';
      ctx.shadowBlur = isFiberTIR ? 12 : 4;
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      if (nextX >= endX) break;

      // Draw Normal & Angle arc at bounce point
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(nextX, nextY - 30);
      ctx.lineTo(nextX, nextY + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isFiberTIR) {
        // Reflection inside core
        currAngle = -currAngle; // reflect angle
        currX = nextX;
        currY = nextY;
      } else {
        // Light LEAKS out into Cladding! (Signal Loss)
        const leakY = goingDown ? cladBottom : cladTop;
        const leakAngle = Math.atan2(Math.sin(currAngle) * (fiberNcore / fiberNclad), Math.cos(currAngle));
        const leakDx = Math.abs((leakY - nextY) / Math.tan(leakAngle || 0.01));

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.globalAlpha = rayAlpha * 0.7;
        ctx.beginPath();
        ctx.moveTo(nextX, nextY);
        ctx.lineTo(nextX + Math.min(80, leakDx), leakY);
        ctx.stroke();

        // Weak reflected ray remains
        currAngle = -currAngle;
        currX = nextX;
        currY = nextY;
        rayAlpha *= 0.45; // ray intensity rapidly decays
      }
    }
    ctx.restore();

    // 9. Output Receiver Detector at endX
    ctx.save();
    ctx.fillStyle = isFiberTIR ? '#10b981' : '#f43f5e';
    ctx.fillRect(endX, coreTop - 10, 18, (coreBottom - coreTop) + 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(endX, coreTop - 10, 18, (coreBottom - coreTop) + 20);

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isFiberTIR ? '#10b981' : '#f43f5e';
    ctx.fillText(
      isFiberTIR ? t('مستقبل الإشارة (كفاءة 100%)', 'Receiver: 100% Signal Guided') : t('فقدان الإشارة (Signal Lost)', 'Receiver: Signal Lost'),
      endX + 9,
      coreBottom + 35
    );
    ctx.restore();
  }, [simViewMode, fiberNcore, fiberNclad, fiberThetaInDeg, isDark, fiberCritDeg, fiberAcceptanceDeg, thetaInRad, thetaRefrRad, isFiberTIR, t]);

  // Scale-aware canvas coordinate resolver (mobile/desktop responsive)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: clientX, y: clientY };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // UNRESTRICTED 2D DRAGGING & TOUCH HANDLERS
  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (Math.hypot(x - laserPos.x, y - laserPos.y) < 45) {
      setDragTarget('laser');
    } else if (Math.hypot(x - hitPointX, y - midY) < 35) {
      setDragTarget('hitPoint');
    } else if (y < midY) {
      // Click anywhere in medium 1 immediately moves laser to that 2D point!
      setDragTarget('laser');
      setLaserPos({ x: Math.max(20, Math.min(canvas.width - 20, x)), y: Math.max(20, Math.min(midY - 10, y)) });
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (dragTarget === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (dragTarget === 'laser') {
      const clampedX = Math.max(20, Math.min(canvas.width - 20, x));
      const clampedY = Math.max(20, Math.min(midY - 10, y));
      setLaserPos({ x: clampedX, y: clampedY });
    } else if (dragTarget === 'hitPoint') {
      const clampedHitX = Math.max(60, Math.min(canvas.width - 60, x));
      setHitPointX(clampedHitX);
    }
  };

  const handlePointerUp = () => {
    setDragTarget('none');
  };

  // Set Incident Angle from Slider
  const setTheta1FromSlider = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const dist = Math.hypot(hitPointX - laserPos.x, midY - laserPos.y) || 200;
    const sign = laserPos.x <= hitPointX ? 1 : -1;
    setLaserPos({
      x: hitPointX - sign * Math.sin(rad) * dist,
      y: midY - Math.cos(rad) * dist
    });
  };

  // Reset to textbook default
  const handleReset = () => {
    setN1(1.0003);
    setN2(1.52);
    setLaserPos({ x: 230, y: 55 });
    setHitPointX(390);
    setLaserWavelengthNm(632.8);
    playLabSound('click');
  };

  // Swap Media (n1 <-> n2)
  const handleSwapMedia = () => {
    const temp = n1;
    setN1(n2);
    setN2(temp);
    playLabSound('click');
  };

  // Set Incident Angle equal to Critical Angle
  const handleSetToCritical = () => {
    if (criticalAngleDeg !== null) {
      setTheta1FromSlider(Number(criticalAngleDeg.toFixed(1)));
      playLabSound('click');
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-fadeIn">
      {/* Top Banner / Mode Switcher Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
            <Compass className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('محاكي قانون سنل والألياف البصرية (فيزياء 3)', 'Snell\'s Law & Fiber Optics Suite (Physics 3)')}
              </h3>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                n₁ · sin θ₁ = n₂ · sin θ₂
              </span>
            </div>
            <p className={`text-xs max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('محاكاة متكاملة لانكسار الضوء، الانعكاس الكلي الداخلي، الحوض المائي ثلاثي الأبعاد 3D، وتطبيقات الألياف البصرية.',
                 'Comprehensive simulation of light refraction, total internal reflection, 3D water tank, and optical fibers.')}
            </p>
          </div>
        </div>

        {/* 3-Way Mode Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => {
                setSimViewMode('2d');
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                simViewMode === '2d'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('محاكي 2D الدقيق', '2D Precision')}</span>
            </button>

            <button
              onClick={() => {
                setSimViewMode('3d');
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                simViewMode === '3d'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{t('حوض سنل 3D', '3D Water Tank')}</span>
            </button>

            <button
              onClick={() => {
                setSimViewMode('fiber');
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                simViewMode === 'fiber'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cable className="w-3.5 h-3.5" />
              <span>{t('الألياف البصرية (TIR)', 'Fiber Optics')}</span>
            </button>
          </div>

          {simViewMode === '2d' && (
            <>
              <button
                onClick={() => setShowProtractor(!showProtractor)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showProtractor
                    ? isDark ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-amber-50 border-amber-400 text-amber-800'
                    : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={t('إظهار أو إخفاء منقلة الزوايا البصرية', 'Toggle optical protractor')}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{t('المنقلة', 'Protractor')}</span>
              </button>

              <button
                onClick={() => setShowWavefronts(!showWavefronts)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showWavefronts
                    ? isDark ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300' : 'bg-cyan-50 border-cyan-400 text-cyan-800'
                    : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={t('إظهار مقدمات الموجات ومبدأ هيجنز', 'Toggle Huygens Wavefronts')}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>{t('مقدمات الموجات', 'Wavefronts')}</span>
              </button>

              <button
                onClick={handleReset}
                className={`p-2 rounded-xl border transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                title={t('إعادة ضبط للقيم المعيارية', 'Reset to defaults')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: THREE.JS 3D WATER TANK */}
      {simViewMode === '3d' && (
        <div className="w-full flex flex-col gap-4 animate-fadeIn">
          <div className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-xs ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
              <Box className={`w-4 h-4 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span>
                {t(
                  'حوض مائي زجاجي 3D تفاعلي: تحكم بالليزر الدوار بزوايا حرة، مع تتبع الأشعة المنكسرة والمنعكسة والعمود المقام والزاوية الحرجة في الفضاء ثلاثي الأبعاد.',
                  'Interactive 3D Glass Water Tank: Rotate laser turret freely with incident/refracted/reflected rays, protractor arc, and critical angle alerts.'
                )}
              </span>
            </div>
            <button
              onClick={() => setSimViewMode('2d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800'}`}
            >
              {t('العودة للوضع 2D', 'Return to 2D')}
            </button>
          </div>
          <ThreePhysicsStage
            station="optics_quantum"
            initialOpticsMode="snell"
            onSwitchTo2D={() => setSimViewMode('2d')}
          />
        </div>
      )}

      {/* VIEW MODE 2: FIBER OPTICS & TOTAL INTERNAL REFLECTION (فيزياء 3 ثانوي) */}
      {simViewMode === 'fiber' && (
        <div className="w-full flex flex-col gap-5 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Canvas Section */}
            <div className="lg:col-span-8 min-w-0 flex flex-col gap-3">
              <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`p-3 border-b flex items-center justify-between gap-2 flex-wrap text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('محاكاة مسار الضوء داخل كابل الألياف البصرية (Fiber Optic Waveguide)', 'Optical Fiber Light Guidance Simulation')}</span>
                  </span>
                  <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded font-bold border ${
                    isFiberTIR
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {isFiberTIR ? t('انعكاس كلي تام (TIR 100%)', 'TIR Guided 100%') : t('تسرب إشارة (Signal Loss)', 'Signal Loss')}
                  </span>
                </div>

                <canvas
                  ref={fiberCanvasRef}
                  width={780}
                  height={380}
                  className="w-full aspect-[780/380] h-auto max-h-[420px] block select-none"
                />
              </div>

              {/* Status Alert Banner */}
              {isFiberTIR ? (
                <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 text-xs ${isDark ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <div>
                      <h5 className={`font-bold text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                        {t('تحقق شرط الانعكاس الكلي الداخلي التام (TIR)!', 'Total Internal Reflection (TIR) Achieved!')}
                      </h5>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-emerald-800/80'}`}>
                        {t(
                          `زاوية السقوط على جدار القلب φ (${phiBoundaryDeg.toFixed(1)}°) أكبر من أو تساوي الزاوية الحرجة θc (${fiberCritDeg?.toFixed(1)}°)، وزاوية الدخول θin ضمن مخروط القبول (θacc = ±${fiberAcceptanceDeg.toFixed(1)}°). ينتقل الضوء لمسافات هائلة دون أي تسرب أو فقدان في الطاقة!`,
                          `Incidence angle on core wall φ (${phiBoundaryDeg.toFixed(1)}°) ≥ critical angle θc (${fiberCritDeg?.toFixed(1)}°), within acceptance cone (±${fiberAcceptanceDeg.toFixed(1)}°). Signal propagates losslessly!`
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-xl shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                    {t('كفاءة 100%', '100% Guided')}
                  </span>
                </div>
              ) : (
                <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 text-xs ${isDark ? 'border-rose-500/40 bg-rose-950/30 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                    <div>
                      <h5 className={`font-bold text-sm ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>
                        {t('تحذير: تسرب الضوء من غلاف الليفة (Signal Attenuation / Loss)!', 'Warning: Light Leaking through Cladding (Loss)!')}
                      </h5>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-rose-800/80'}`}>
                        {t(
                          `زاوية السقوط على جدار القلب φ (${phiBoundaryDeg.toFixed(1)}°) أقل من الزاوية الحرجة θc (${fiberCritDeg?.toFixed(1)}°). جزء من الضوء ينفذ إلى الغلاف (Cladding) ويتسرب للخارج، مما يؤدي لتلاشي إشارة البيانات. قلل زاوية السقوط θin لتصبح أصغر من زاوية القبول (${fiberAcceptanceDeg.toFixed(1)}°).`,
                          `Incidence angle on core wall φ (${phiBoundaryDeg.toFixed(1)}°) < critical angle θc (${fiberCritDeg?.toFixed(1)}°). Light refracts into cladding and escapes. Reduce θin below acceptance angle (${fiberAcceptanceDeg.toFixed(1)}°).`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Numerical Aperture & Physical Equations */}
              <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400">{t('الزاوية الحرجة θc للقلب:', 'Critical Angle θc:')}</span>
                  <span className="font-mono font-bold text-sm text-purple-400">{fiberCritDeg?.toFixed(2)}°</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400">{t('فتحة القبول العددية NA:', 'Numerical Aperture NA:')}</span>
                  <span className="font-mono font-bold text-sm text-cyan-400">{fiberNA.toFixed(3)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400">{t('زاوية مخروط القبول θacc:', 'Acceptance Angle θacc:')}</span>
                  <span className="font-mono font-bold text-sm text-amber-400">±{fiberAcceptanceDeg.toFixed(1)}°</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400">{t('زاوية السقوط على الجدار φ:', 'Wall Incidence Angle φ:')}</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">{phiBoundaryDeg.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* Controls Deck */}
            <div className="lg:col-span-4 min-w-0 flex flex-col gap-4">
              <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                  <Sliders className="w-4 h-4" />
                  <span>{t('إعدادات الليفة البصرية والليزر', 'Optical Fiber Parameters')}</span>
                </h4>

                {/* 1. Launch Angle θin */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{t('زاوية سقوط الليزر بالهواء θin:', 'Launch Angle θin:')}</span>
                    <span className={`font-mono font-bold text-base ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{fiberThetaInDeg.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-45.0"
                    max="45.0"
                    step="0.5"
                    value={fiberThetaInDeg}
                    onChange={e => setFiberThetaInDeg(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2"
                  />
                  <div className={`flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>-45°</span>
                    <span>{t('0° (سقوط محوري)', '0° (Axial)')}</span>
                    <span>+45°</span>
                  </div>
                </div>

                {/* 2. Core Index n1 */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>{t('معامل انكسار القلب n₁ (Core):', 'Core Refractive Index n₁:')}</span>
                    <span className={`font-mono font-bold text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{fiberNcore.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.45"
                    max="1.85"
                    step="0.01"
                    value={fiberNcore}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val > fiberNclad) setFiberNcore(val);
                    }}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5"
                  />
                </div>

                {/* 3. Cladding Index n2 */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>{t('معامل انكسار الغلاف n₂ (Cladding):', 'Cladding Index n₂:')}</span>
                    <span className={`font-mono font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{fiberNclad.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.00"
                    max="1.55"
                    step="0.01"
                    value={fiberNclad}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val < fiberNcore) setFiberNclad(val);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5"
                  />
                </div>

                {/* Fiber Presets */}
                <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t('أنواع الألياف البصرية المعتمدة دراسياً:', 'Standard Fiber Types:')}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setFiberNcore(1.62);
                        setFiberNclad(1.48);
                        setFiberThetaInDeg(12.0);
                        playLabSound('click');
                      }}
                      className={`p-2 rounded-xl border text-xs text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{t('ألياف زجاجية قياسية (Telecom)', 'Telecom Glass Fiber')}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>n₁ = 1.62, n₂ = 1.48 (θc = 65.9°)</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-500 font-bold">NA = 0.66</span>
                    </button>

                    <button
                      onClick={() => {
                        setFiberNcore(1.49);
                        setFiberNclad(1.40);
                        setFiberThetaInDeg(15.0);
                        playLabSound('click');
                      }}
                      className={`p-2 rounded-xl border text-xs text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{t('ألياف بلاستيكية (POF)', 'Plastic Optical Fiber')}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>n₁ = 1.49, n₂ = 1.40 (θc = 69.9°)</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-500 font-bold">NA = 0.51</span>
                    </button>

                    <button
                      onClick={() => {
                        setFiberNcore(1.72);
                        setFiberNclad(1.45);
                        setFiberThetaInDeg(25.0);
                        playLabSound('click');
                      }}
                      className={`p-2 rounded-xl border text-xs text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{t('ألياف طبية عالية القبول (High-NA)', 'High-NA Medical Fiber')}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>n₁ = 1.72, n₂ = 1.45 (θc = 57.4°)</span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-500 font-bold">NA = 0.92</span>
                    </button>

                    <button
                      onClick={() => {
                        setFiberNcore(1.49);
                        setFiberNclad(1.48);
                        setFiberThetaInDeg(25.0);
                        playLabSound('click');
                      }}
                      className={`p-2 rounded-xl border text-xs text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{t('محاكاة تسرب الإشارة (Loss Demo)', 'Signal Loss Demo')}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>n₁ = 1.49, n₂ = 1.48 (θc = 83.3°)</span>
                      </div>
                      <span className="text-[11px] font-mono text-rose-500 font-bold">NA = 0.17</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: 2D PRECISION SNELL SIMULATOR */}
      {simViewMode === '2d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Canvas Section (Col 1-8) */}
        <div className="lg:col-span-8 min-w-0 flex flex-col gap-3">
          <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between gap-2 flex-wrap text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                <Sparkles className="w-4 h-4" />
                <span>{t('اسحب المؤشر أو حرّك المنزلق لتدوير شعاع الليزر بحرية تامة!', 'Drag pointer or slider to rotate laser beam freely!')}</span>
              </span>
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                θ₁ = {theta1Deg.toFixed(1)}° | θ₂ = {isTotalInternalReflection ? 'TIR' : `${theta2Deg.toFixed(1)}°`}
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={780}
              height={380}
              onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={e => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={e => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={e => e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handlePointerUp}
              className="w-full aspect-[780/380] h-auto max-h-[420px] block cursor-grab active:cursor-grabbing select-none touch-none"
            />
          </div>

          {/* 1. Total Internal Reflection Notice Banner (if triggered) */}
          {isTotalInternalReflection && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${isDark ? 'border-rose-500/40 bg-rose-950/30 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              <span>
                {t(
                  `انعكاس كلي داخلي تام (TIR)! زاوية السقوط θ₁ (${theta1Deg.toFixed(1)}°) تجاوزت الزاوية الحرجة θc (${criticalAngleDeg?.toFixed(1)}°). ينعكس الضوء بنسبة 100% داخل الوسط الأول دون أي نفاذ للوسط الثاني!`,
                  `Total Internal Reflection (TIR)! Incident angle θ₁ (${theta1Deg.toFixed(1)}°) exceeds critical angle θc (${criticalAngleDeg?.toFixed(1)}°). 100% of light reflects back into Medium 1!`
                )}
              </span>
            </div>
          )}

          {/* 2. Dynamic Critical Angle Calculation Card OR Undefined Alert Banner */}
          {criticalAngleDeg !== null ? (
            <div className={`p-4 rounded-3xl border flex flex-col gap-3 transition-all ${
              isDark ? 'bg-purple-950/20 border-purple-500/40' : 'bg-purple-50/80 border-purple-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                      {t('حساب الزاوية الحرجة (Critical Angle Calculation):', 'Critical Angle Calculation (θc):')}
                    </h5>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('الزاوية التي ينكسر عندها الشعاع على امتداد السطح الفاصل (θ₂ = 90°)', 'Angle where refracted ray grazes interface (θ₂ = 90°)')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`font-mono font-bold text-base px-3 py-1 rounded-xl border ${isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-300'}`}>
                    θc = {criticalAngleDeg.toFixed(2)}°
                  </span>
                  <button
                    onClick={handleSetToCritical}
                    className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-xs"
                    title={t('ضبط زاوية السقوط مساوية للزاوية الحرجة تماماً', 'Set incident angle to critical angle')}
                  >
                    {t('ضبط θ₁ = θc', 'Set θ₁ = θc')}
                  </button>
                </div>
              </div>

              {/* Mathematical Equation & Numerical Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-purple-500/20">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-purple-200'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>sin θc = n₂ / n₁:</span>
                  <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {n2.toFixed(3)} / {n1.toFixed(3)} = {(n2 / n1).toFixed(4)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-purple-200'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>θc = arcsin(n₂/n₁):</span>
                  <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    arcsin({(n2 / n1).toFixed(4)}) = {criticalAngleDeg.toFixed(2)}°
                  </span>
                </div>
              </div>

              {/* Current Angle Status Comparison */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('الحالة الفيزيائية الحالية:', 'Current Status:')}</span>
                {theta1Deg < criticalAngleDeg ? (
                  <span className={`px-2 py-0.5 rounded-lg font-bold ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
                    {t(`θ₁ (${theta1Deg.toFixed(1)}°) < θc ⟵ يحدث انكسار ونفاذ إلى الوسط الثاني بزاوية θ₂ = ${theta2Deg.toFixed(1)}°`,
                       `θ₁ (${theta1Deg.toFixed(1)}°) < θc ⟵ Refraction & transmission into Medium 2 at θ₂ = ${theta2Deg.toFixed(1)}°`)}
                  </span>
                ) : Math.abs(theta1Deg - criticalAngleDeg) < 0.2 ? (
                  <span className={`px-2 py-0.5 rounded-lg font-bold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                    {t(`θ₁ = θc ⟵ الشعاع مماس للسطح الفاصل تماماً بزاوية θ₂ = 90.0°`,
                       `θ₁ = θc ⟵ Grazing ray along the interface at θ₂ = 90.0°`)}
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 rounded-lg font-bold ${isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800'}`}>
                    {t(`θ₁ (${theta1Deg.toFixed(1)}°) > θc ⟵ انعكاس كلي داخلي تام (TIR 100%) ولا ينفذ أي ضوء!`,
                       `θ₁ (${theta1Deg.toFixed(1)}°) > θc ⟵ 100% Total Internal Reflection (TIR)!`)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* UNDEFINED CRITICAL ANGLE ALERT BANNER */
            <div className={`p-4 rounded-3xl border flex flex-col gap-3 transition-all ${
              isDark ? 'bg-amber-950/25 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                        {t('تنبيه: الزاوية الحرجة غير معرّفة (Critical Angle is Undefined)', 'Alert: Critical Angle is Undefined')}
                      </h5>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-800'}`}>
                        {t('n₁ ≤ n₂ (غير معرّفة)', 'n₁ ≤ n₂ (Undefined)')}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-slate-300' : 'text-amber-950/80'}`}>
                      {t(
                        `الزاوية الحرجة والانعكاس الكلي الداخلي غير معرّفين في هذه الحالة لأن معامل انكسار وسط السقوط n₁ (${n1.toFixed(3)}) أقل من أو يساوي معامل انكسار وسط الانكسار n₂ (${n2.toFixed(3)}). النسبة n₂/n₁ = ${(n2 / n1).toFixed(3)} ≥ 1، ولا توجد زاوية حقيقية جيبها (sin) أكبر من 1. شرط وجود الزاوية الحرجة وحدوث الانعكاس الكلي هو أن ينتقل الضوء من وسط أكبر كثافة ضوئية إلى وسط أقل كثافة ضوئية (n₁ > n₂).`,
                        `The critical angle is undefined here because incident medium n₁ (${n1.toFixed(3)}) is less than or equal to refracting medium n₂ (${n2.toFixed(3)}). Ratio n₂/n₁ = ${(n2 / n1).toFixed(3)} ≥ 1, which has no real arcsin solution. Total internal reflection and critical angle exist exclusively when light travels from a denser to a rarer optical medium (n₁ > n₂).`
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSwapMedia}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shrink-0 shadow-md transition-all self-start sm:self-center"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{t('عكس الوسطين (n₁ ↔ n₂)', 'Swap Media (n₁ ↔ n₂)')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Real-Time Equality Verification Bar */}
          <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('طرف السقوط n₁·sin θ₁:', 'Incident side n₁·sin θ₁:')}</span>
              <span className="font-mono font-bold text-sm text-amber-500">
                {(n1 * sinTheta1).toFixed(4)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('طرف الانكسار n₂·sin θ₂:', 'Refracted side n₂·sin θ₂:')}</span>
              <span className="font-mono font-bold text-sm text-cyan-500">
                {isTotalInternalReflection ? t('TIR (انعكاس)', 'TIR (Reflected)') : (n2 * Math.sin(theta2Rad)).toFixed(4)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('سرعة الضوء بالوسط 1 v₁:', 'Speed in Medium 1 v₁:')}</span>
              <span className={`font-mono font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {v1KmS} km/s
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('سرعة الضوء بالوسط 2 v₂:', 'Speed in Medium 2 v₂:')}</span>
              <span className={`font-mono font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {v2KmS} km/s
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls Deck (Col 9-12) */}
        <div className="lg:col-span-4 min-w-0 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              <Sliders className="w-4 h-4" />
              <span>{t('لوحة التحكم بالانكسار والزوايا', 'Refraction & Angle Controls')}</span>
            </h4>

            {/* 1. Incident Angle θ1 Slider */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{t('زاوية السقوط θ₁ (مع العمود المقام):', 'Incident Angle θ₁:')}</span>
                <span className={`font-mono font-bold text-base ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{theta1Deg.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="89.5"
                step="0.5"
                value={theta1Deg}
                onChange={e => setTheta1FromSlider(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2"
              />
              <div className={`flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>{t('0° (سقوط عمودي)', '0° (Normal)')}</span>
                <span>45°</span>
                <span>{t('89.5° (مماس)', '89.5° (Grazing)')}</span>
              </div>
            </div>

            {/* 2. Medium 1 Refractive Index (n1) */}
            <div className={`flex flex-col gap-2 p-3 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('معامل انكسار الوسط الأول n₁:', 'Medium 1 Index n₁:')}</span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{n1.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="1.000"
                max="2.500"
                step="0.005"
                value={n1}
                onChange={e => setN1(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5"
              />
              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {PRESET_MEDIA.slice(0, 4).map(m => (
                  <button
                    key={`m1-${m.id}`}
                    onClick={() => {
                      setN1(m.n);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-start truncate transition-all ${
                      Math.abs(n1 - m.n) < 0.01
                        ? isDark ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 font-bold' : 'bg-cyan-50 border-cyan-400 text-cyan-800 font-bold'
                        : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {isAr ? m.nameAr : m.nameEn} ({m.n})
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Swap Media Button */}
            <div className="flex justify-center -my-1">
              <button
                onClick={handleSwapMedia}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 ${
                  isDark ? 'border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                }`}
                title={t('عكس معاملات انكسار الوسطين n1 و n2', 'Swap n1 and n2')}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('عكس الوسطين (n₁ ↔ n₂)', 'Swap Media (n₁ ↔ n₂)')}</span>
              </button>
            </div>

            {/* 3. Medium 2 Refractive Index (n2) */}
            <div className={`flex flex-col gap-2 p-3 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('معامل انكسار الوسط الثاني n₂:', 'Medium 2 Index n₂:')}</span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{n2.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="1.000"
                max="2.500"
                step="0.005"
                value={n2}
                onChange={e => setN2(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5"
              />
              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {PRESET_MEDIA.slice(4).map(m => (
                  <button
                    key={`m2-${m.id}`}
                    onClick={() => {
                      setN2(m.n);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-start truncate transition-all ${
                      Math.abs(n2 - m.n) < 0.01
                        ? isDark ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold' : 'bg-indigo-50 border-indigo-400 text-indigo-800 font-bold'
                        : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {isAr ? m.nameAr : m.nameEn} ({m.n})
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Angle Status Widget in Controls */}
            <div className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
              criticalAngleDeg !== null
                ? isDark ? 'bg-purple-950/30 border-purple-500/30' : 'bg-purple-50 border-purple-200'
                : isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-500" />
                  <span>{t('الزاوية الحرجة (θc):', 'Critical Angle (θc):')}</span>
                </span>
                <span className="font-mono font-bold text-xs">
                  {criticalAngleDeg !== null ? (
                    <span className={isDark ? 'text-purple-400' : 'text-purple-700'}>{criticalAngleDeg.toFixed(1)}°</span>
                  ) : (
                    <span className={`text-[11px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{t('غير معرّفة (n₁ ≤ n₂)', 'Undefined (n₁ ≤ n₂)')}</span>
                  )}
                </span>
              </div>
              <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {criticalAngleDeg !== null
                  ? t(`ينكسر الشعاع موازياً للسطح الفاصل عند زاوية سقوط = ${criticalAngleDeg.toFixed(1)}°`, `Ray grazes boundary at incident angle = ${criticalAngleDeg.toFixed(1)}°`)
                  : t('يلزم أن يكون n₁ > n₂ (من وسط أكبر كثافة إلى أقل) لتعريف الزاوية الحرجة والانعكاس الكلي.', 'n₁ must exceed n₂ for critical angle and total internal reflection to exist.')}
              </p>
            </div>

            {/* Curriculum Cases / Standard Textbook Exercises */}
            <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('مسائل كتاب الفيزياء 3-1 المعتمدة:', 'Textbook Practice Cases:')}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setN1(1.0003); // Air
                    setN2(1.52);   // Crown glass
                    setTheta1FromSlider(30.0);
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('مثال 1: من الهواء إلى زجاج العدسات', 'Ex 1: Air to Crown Glass')}</span>
                  <span className="font-mono text-cyan-500 font-bold">θ₂ = 19.2°</span>
                </button>

                <button
                  onClick={() => {
                    setN1(1.0003); // Air
                    setN2(1.36);   // Ethanol
                    setTheta1FromSlider(37.0);
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('مسألة 1: من الهواء إلى الإيثانول', 'Prob 1: Air to Ethanol')}</span>
                  <span className="font-mono text-cyan-500 font-bold">θ₂ = 26.3°</span>
                </button>

                <button
                  onClick={() => {
                    setN1(2.417);  // Diamond
                    setN2(1.0003); // Air
                    setTheta1FromSlider(30.0); // > 24.4
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-rose-300' : 'border-slate-200 hover:bg-rose-50 text-rose-700'}`}
                >
                  <span>{t('انعكاس تام: من الألماس إلى الهواء', 'TIR: Diamond to Air')}</span>
                  <span className="font-mono text-rose-500 font-bold">θc = 24.4°</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
