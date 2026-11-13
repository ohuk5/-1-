import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Zap,
  Lightbulb,
  Compass,
  Waves,
  Eye,
  Sparkles,
  Move,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';
import { SnellsLawSimulator } from './SnellsLawSimulator';
import { SphericalMirrorsSimulator } from './SphericalMirrorsSimulator';
import { YoungInterferenceSimulator } from './YoungInterferenceSimulator';
import { BohrAtomSimulator } from './BohrAtomSimulator';
import { SpectrometerDischargeModule } from '../SpectrometerDischargeModule';

// --- Medium Definition for Refraction ---
interface OpticalMedium {
  id: string;
  nameAr: string;
  nameEn: string;
  n: number; // Refractive index
  colorDark: string;
  colorLight: string;
}

const OPTICAL_MEDIA: OpticalMedium[] = [
  { id: 'air', nameAr: 'الهواء (Air)', nameEn: 'Air', n: 1.0003, colorDark: 'rgba(30, 41, 59, 0.25)', colorLight: 'rgba(241, 245, 249, 0.4)' },
  { id: 'water', nameAr: 'الماء (Water)', nameEn: 'Water', n: 1.333, colorDark: 'rgba(6, 182, 212, 0.22)', colorLight: 'rgba(6, 182, 212, 0.15)' },
  { id: 'oil', nameAr: 'الزيت النباتي (Oil)', nameEn: 'Vegetable Oil', n: 1.470, colorDark: 'rgba(245, 158, 11, 0.22)', colorLight: 'rgba(245, 158, 11, 0.15)' },
  { id: 'crown_glass', nameAr: 'زجاج كراون (Crown Glass)', nameEn: 'Crown Glass', n: 1.520, colorDark: 'rgba(99, 102, 241, 0.25)', colorLight: 'rgba(99, 102, 241, 0.15)' },
  { id: 'flint_glass', nameAr: 'زجاج صواني (Flint Glass)', nameEn: 'Flint Glass', n: 1.660, colorDark: 'rgba(168, 85, 247, 0.28)', colorLight: 'rgba(168, 85, 247, 0.18)' },
  { id: 'diamond', nameAr: 'الألماس (Diamond)', nameEn: 'Diamond', n: 2.417, colorDark: 'rgba(236, 72, 153, 0.3)', colorLight: 'rgba(236, 72, 153, 0.2)' }
];

// --- Metal Definition for Photoelectric effect ---
interface Metal {
  id: string;
  nameAr: string;
  nameEn: string;
  workFunctionEV: number; // Φ in eV
  color: string;
}

const METALS: Metal[] = [
  { id: 'cs', nameAr: 'السيزيوم (Cesium)', nameEn: 'Cesium', workFunctionEV: 2.14, color: '#e2e8f0' },
  { id: 'k', nameAr: 'البوتاسيوم (Potassium)', nameEn: 'Potassium', workFunctionEV: 2.30, color: '#cbd5e1' },
  { id: 'na', nameAr: 'الصوديوم (Sodium)', nameEn: 'Sodium', workFunctionEV: 2.46, color: '#fef08a' },
  { id: 'zn', nameAr: 'الخارصين (Zinc)', nameEn: 'Zinc', workFunctionEV: 4.31, color: '#94a3b8' },
  { id: 'pt', nameAr: 'البلاتين (Platinum)', nameEn: 'Platinum', workFunctionEV: 6.35, color: '#f1f5f9' }
];


// --- Draggable Virtual Optical Protractor Helper ---
interface DrawProtractorOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  rotation?: number;
  radius?: number;
  normalAngleRad?: number | null;
  incidentAngleRad?: number | null;
  refractedAngleRad?: number | null;
  theta1Deg?: number | null;
  theta2Deg?: number | null;
  isDark?: boolean;
  title?: string;
  snellFormulaText?: string;
}

const drawVirtualProtractor = ({
  ctx,
  x,
  y,
  rotation = 0,
  radius = 80,
  normalAngleRad = null,
  incidentAngleRad = null,
  refractedAngleRad = null,
  theta1Deg = null,
  theta2Deg = null,
  isDark = true,
  title = 'منقلة بصرية',
  snellFormulaText
}: DrawProtractorOptions) => {
  ctx.save();
  ctx.translate(x, y);

  // 1. Frosted Glass Body
  const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
  if (isDark) {
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.72)');
    gradient.addColorStop(0.85, 'rgba(15, 23, 42, 0.65)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.35)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.85, 'rgba(241, 245, 249, 0.8)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Glass edge highlight
  ctx.strokeStyle = isDark ? 'rgba(129, 140, 248, 0.65)' : 'rgba(79, 70, 229, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Concentric guideline
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Degree ticks
  ctx.save();
  ctx.rotate(rotation);

  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMedium = deg % 10 === 0;
    const tickLen = isMajor ? 10 : isMedium ? 6 : 3.5;

    const rOuter = radius - 1;
    const rInner = radius - 1 - tickLen;

    const x1 = Math.cos(rad) * rOuter;
    const y1 = Math.sin(rad) * rOuter;
    const x2 = Math.cos(rad) * rInner;
    const y2 = Math.sin(rad) * rInner;

    ctx.strokeStyle = isMajor
      ? (isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(30, 41, 59, 0.9)')
      : (isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)');
    ctx.lineWidth = isMajor ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (isMajor) {
      const rText = radius - 18;
      const tx = Math.cos(rad) * rText;
      const ty = Math.sin(rad) * rText;
      ctx.fillStyle = isDark ? 'rgba(203, 213, 225, 0.85)' : 'rgba(51, 65, 85, 0.9)';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayDeg = deg <= 180 ? deg : 360 - deg;
      ctx.fillText(`${displayDeg}°`, tx, ty);
    }
  }

  // Cross lines (Baseline and Vertical axis)
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-radius + 12, 0);
  ctx.lineTo(radius - 12, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -radius + 12);
  ctx.lineTo(0, radius - 12);
  ctx.stroke();

  ctx.restore(); // restore rotation

  // 3. Normal Line (العمود المقام N)
  if (normalAngleRad !== null) {
    ctx.save();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    const normLen = radius + 14;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(normalAngleRad) * normLen, -Math.sin(normalAngleRad) * normLen);
    ctx.lineTo(Math.cos(normalAngleRad) * normLen, Math.sin(normalAngleRad) * normLen);
    ctx.stroke();

    const nx = Math.cos(normalAngleRad) * (radius + 9);
    const ny = Math.sin(normalAngleRad) * (radius + 9);
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny);
    ctx.restore();
  }

  // 4. Incident Angle Arc (θ1)
  if (normalAngleRad !== null && incidentAngleRad !== null && theta1Deg !== null) {
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const oppRay = incidentAngleRad + Math.PI;
    ctx.arc(0, 0, radius * 0.46, normalAngleRad, oppRay, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const midAngle = (normalAngleRad + oppRay) / 2;
    const ax = Math.cos(midAngle) * (radius * 0.54);
    const ay = Math.sin(midAngle) * (radius * 0.54);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`θ₁=${theta1Deg.toFixed(1)}°`, ax, ay);
    ctx.restore();
  }

  // 5. Refracted Angle Arc (θ2)
  if (normalAngleRad !== null && refractedAngleRad !== null && theta2Deg !== null) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const oppNormal = normalAngleRad + Math.PI;
    ctx.arc(0, 0, radius * 0.46, oppNormal, refractedAngleRad, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const midAngle = (oppNormal + refractedAngleRad) / 2;
    const rx = Math.cos(midAngle) * (radius * 0.54);
    const ry = Math.sin(midAngle) * (radius * 0.54);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`θ₂=${theta2Deg.toFixed(1)}°`, rx, ry);
    ctx.restore();
  }

  // 6. Central Crosshair & Draggable Pivot Handle
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  // Floating Protractor Label Header
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`📐 ${title}`, 0, -radius - 4);

  // Bottom Snell Verification or Angle Info
  if (snellFormulaText) {
    ctx.fillStyle = isDark ? 'rgba(203, 213, 225, 0.9)' : 'rgba(51, 65, 85, 0.9)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(snellFormulaText, 0, radius + 4);
  }

  ctx.restore();
};

export const OpticsQuantumSim: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  // Primary Optics Sub-Modes (4 Varieties)
  const [activeOpticsSubTab, setActiveOpticsSubTab] = useState<'lenses' | 'refraction' | 'prism' | 'quantum'>('lenses');
  const [opticsSubCategory, setOpticsSubCategory] = useState<'lenses' | 'mirrors'>('lenses');
  const [prismSubCategory, setPrismSubCategory] = useState<'prism' | 'young'>('prism');

  // ==========================================
  // 1. LENSES SIMULATION STATE
  // ==========================================
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex');
  const [focalLength, setFocalLength] = useState<number>(100); // px
  const [objectDistance, setObjectDistance] = useState<number>(200); // px (do)
  const [objectHeight, setObjectHeight] = useState<number>(75); // px (ho)
  const [objectVisual, setObjectVisual] = useState<'lamp' | 'candle' | 'arrow'>('lamp');
  const [dragModeLens, setDragModeLens] = useState<'none' | 'object' | 'focus' | 'protractor'>('none');
  const [showProtractorLens, setShowProtractorLens] = useState<boolean>(true);
  const [lensProtractorPos, setLensProtractorPos] = useState<{ x: number; y: number }>({ x: 390, y: 115 });
  const [lensProtractorRot, setLensProtractorRot] = useState<number>(0);
  const lensCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculations for Lens Equation: 1/f = 1/do + 1/di => di = (f * do) / (do - f)
  const effectiveF = lensType === 'convex' ? focalLength : -focalLength;
  const doVal = Math.max(1, objectDistance);
  const diVal = (doVal - effectiveF) !== 0 ? (effectiveF * doVal) / (doVal - effectiveF) : 999999;
  const magnification = -diVal / doVal;
  const imageHeight = magnification * objectHeight;
  const isImageReal = diVal > 0 && Math.abs(doVal - effectiveF) > 1;
  const isImageVirtual = diVal < 0;
  const isImageUpright = magnification > 0;
  const isImageAtInfinity = Math.abs(doVal - effectiveF) <= 1;

  // ==========================================
  // 2. REFLECTION & REFRACTION STATE
  // ==========================================
  const [medium1Id, setMedium1Id] = useState<string>('air');
  const [medium2Id, setMedium2Id] = useState<string>('water');
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 200, y: 80 });
  const [laserAimX, setLaserAimX] = useState<number>(390); // Aim point on boundary
  const [laserBeamColor, setLaserBeamColor] = useState<string>('#ef4444');
  const [dragModeRefr, setDragModeRefr] = useState<'none' | 'laserPos' | 'laserAim'>('none');
  const refrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const med1 = OPTICAL_MEDIA.find(m => m.id === medium1Id) || OPTICAL_MEDIA[0];
  const med2 = OPTICAL_MEDIA.find(m => m.id === medium2Id) || OPTICAL_MEDIA[1];

  // Incident angle relative to interface normal
  // Boundary is at midY = 190. Normal is vertical at x = laserAimX.
  const dxRefr = laserAimX - laserPos.x;
  const dyRefr = 190 - laserPos.y;
  const incidentAngleDeg = Math.max(0.1, Math.min(89.5, Math.abs(Math.atan2(dxRefr, dyRefr) * 180 / Math.PI)));
  const theta1Rad = (incidentAngleDeg * Math.PI) / 180;
  const sinTheta2 = (med1.n / med2.n) * Math.sin(theta1Rad);
  const isTotalInternalReflection = sinTheta2 > 1.0;
  const theta2Rad = !isTotalInternalReflection ? Math.asin(sinTheta2) : 0;
  const theta2Deg = !isTotalInternalReflection ? (theta2Rad * 180) / Math.PI : 0;
  const criticalAngleDeg = med1.n > med2.n ? (Math.asin(med2.n / med1.n) * 180) / Math.PI : null;

  // ==========================================
  // 3. PRISM DISPERSION STATE (UNRESTRICTED 2D & ANGLE)
  // ==========================================
  const [prismSourcePos, setPrismSourcePos] = useState<{ x: number; y: number }>({ x: 140, y: 190 });
  const [prismAimPos, setPrismAimPos] = useState<{ x: number; y: number }>({ x: 340, y: 220 });
  const [prismType, setPrismType] = useState<'flint' | 'crown'>('flint');
  const [prismLightMode, setPrismLightMode] = useState<'white' | 'laser'>('white');
  const [prismsLaserNm, setPrismsLaserNm] = useState<number>(532);
  const [dragModePrism, setDragModePrism] = useState<'none' | 'source' | 'aim' | 'protractor' | 'screen'>('none');
  const [showProtractorPrism, setShowProtractorPrism] = useState<boolean>(false);
  const [prismProtractorPos, setPrismProtractorPos] = useState<{ x: number; y: number }>({ x: 90, y: 75 });
  const [prismProtractorRot, setPrismProtractorRot] = useState<number>(0);
  const [prismScreenX, setPrismScreenX] = useState<number>(600);
  const [showHitGlow, setShowHitGlow] = useState<boolean>(true);
  const prismCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ==========================================
  // 4. QUANTUM PHOTOELECTRIC & SPECTRA STATE
  // ==========================================
  const [quantumSubMode, setQuantumSubMode] = useState<'photoelectric' | 'bohr' | 'spectra'>('photoelectric');
  const [selectedMetalId, setSelectedMetalId] = useState<string>('cs');
  const [wavelengthNm, setWavelengthNm] = useState<number>(380);
  const [intensityPercent, setIntensityPercent] = useState<number>(75);
  const [appliedVoltage, setAppliedVoltage] = useState<number>(0);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const electronsRef = useRef<{ x: number; y: number; vx: number; vy: number; id: number }[]>([]);

  // Physical Constants
  const HC_EV_NM = 1239.84193;
  const activeMetal = METALS.find(m => m.id === selectedMetalId) || METALS[0];
  const photonEnergyEV = Number((HC_EV_NM / wavelengthNm).toFixed(3));
  const workFunctionEV = activeMetal.workFunctionEV;
  const maxKineticEnergyEV = Math.max(0, Number((photonEnergyEV - workFunctionEV).toFixed(3)));
  const thresholdWavelengthNm = Math.round(HC_EV_NM / workFunctionEV);
  const isEmissionOccurring = photonEnergyEV >= workFunctionEV && intensityPercent > 0;
  const stoppingPotentialV = maxKineticEnergyEV;
  const isCurrentFlowing = isEmissionOccurring && (appliedVoltage > -stoppingPotentialV);

  const wavelengthToColor = (nm: number): string => {
    if (nm < 380) return '#a855f7';
    if (nm < 440) return '#6366f1';
    if (nm < 490) return '#06b6d4';
    if (nm < 560) return '#22c55e';
    if (nm < 590) return '#eab308';
    if (nm < 630) return '#f97316';
    if (nm <= 750) return '#ef4444';
    return '#881337';
  };

  // -------------------------------------------------------------
  // RENDER CANVAS 1: LENSES & RAY TRACING
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeOpticsSubTab !== 'lenses' || opticsSubCategory !== 'lenses') return;
    const canvas = lensCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(226, 232, 240, 0.6)';
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

    // Principal Optical Axis
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Central Normal Line through lens
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Focal points coordinates
    const fX1 = centerX - focalLength;
    const f2X1 = centerX - focalLength * 2;
    const fX2 = centerX + focalLength;
    const f2X2 = centerX + focalLength * 2;

    // Draw Focal Point Markers with draggable handles
    const drawFocusMarker = (x: number, label: string, isDraggable: boolean = false) => {
      ctx.fillStyle = isDraggable ? '#a855f7' : '#6366f1';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isDraggable ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, centerY, isDraggable ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (isDraggable) ctx.stroke();

      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, centerY + 18);
    };

    drawFocusMarker(f2X1, '2F₁');
    drawFocusMarker(fX1, 'F₁ (البؤرة)', true);
    drawFocusMarker(centerX, 'O (المركز)');
    drawFocusMarker(fX2, 'F₂', true);
    drawFocusMarker(f2X2, '2F₂');

    // Draw Lens Shape
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 3;

    if (lensType === 'convex') {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 24, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX - 16, centerY - 130);
      ctx.lineTo(centerX + 16, centerY - 130);
      ctx.quadraticCurveTo(centerX + 4, centerY, centerX + 16, centerY + 130);
      ctx.lineTo(centerX - 16, centerY + 130);
      ctx.quadraticCurveTo(centerX - 4, centerY, centerX - 16, centerY - 130);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // OBJECT (Lamp / Candle / Arrow) - Draggable Position & Height
    // ==========================================
    const objX = centerX - doVal;
    const objTopY = centerY - objectHeight;

    if (objectVisual === 'lamp') {
      // 1. Optical Lamp / Luminous Flashlight
      ctx.save();
      // Lamp Stand & Base
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(objX, centerY);
      ctx.lineTo(objX, objTopY + 12);
      ctx.stroke();

      // Base footprint
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(objX, centerY, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lamp Casing / Reflector Housing
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(objX - 16, objTopY - 14, 28, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Glowing Golden Lamp Bulb
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(objX + 12, objTopY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Luminous radiant light cone illuminating the entire lens
      ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
      ctx.beginPath();
      ctx.moveTo(objX + 12, objTopY);
      ctx.lineTo(centerX, centerY - 120);
      ctx.lineTo(centerX, centerY + 120);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (objectVisual === 'candle') {
      // 2. Candle Body
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.fillRect(objX - 6, objTopY + 14, 12, objectHeight - 14);
      ctx.strokeRect(objX - 6, objTopY + 14, 12, objectHeight - 14);
      // Wick
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(objX, objTopY + 14);
      ctx.lineTo(objX, objTopY + 8);
      ctx.stroke();
      // Glowing Flame
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(objX, objTopY + 4, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(objX, objTopY + 6, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // 3. Upright Arrow
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(objX, centerY);
      ctx.lineTo(objX, objTopY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(objX - 7, objTopY + 12);
      ctx.lineTo(objX + 7, objTopY + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Draggable Handle on Top of Light / Object
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(objX, objTopY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Object Footprint / Base Handle
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(objX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Object Label
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${t('المصدر الضوئي (اسحب بحرية)', 'Light Source (Free Drag)')}`, objX, centerY + 32);

    // ==========================================
    // RAY TRACING (3 Principal Rays)
    // ==========================================
    if (!isImageAtInfinity) {
      // 1. Ray 1: Parallel to Principal Axis -> refracts through/away from focus
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(centerX, objTopY);
      ctx.stroke();

      if (lensType === 'convex') {
        const slope1 = (centerY - objTopY) / focalLength;
        ctx.beginPath();
        ctx.moveTo(centerX, objTopY);
        ctx.lineTo(width, objTopY + slope1 * (width - centerX));
        ctx.stroke();

        if (doVal < focalLength) {
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(centerX, objTopY);
          ctx.lineTo(0, objTopY - slope1 * centerX);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        const slope1 = (objTopY - centerY) / focalLength;
        ctx.beginPath();
        ctx.moveTo(centerX, objTopY);
        ctx.lineTo(width, objTopY + slope1 * (width - centerX));
        ctx.stroke();

        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, objTopY);
        ctx.lineTo(fX1, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Ray 2: Central ray through Optical Center O (passes straight)
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      const slope2 = (centerY - objTopY) / doVal;
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(width, centerY + slope2 * (width - centerX));
      ctx.stroke();

      if (doVal < focalLength || lensType === 'concave') {
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(0, centerY - slope2 * centerX);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Ray 3: Through focus F1 -> exits parallel to principal axis
      if (lensType === 'convex' && doVal > focalLength) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        const slope3 = (centerY - objTopY) / (focalLength - doVal);
        const hitLensY = centerY + slope3 * focalLength;
        ctx.beginPath();
        ctx.moveTo(objX, objTopY);
        ctx.lineTo(centerX, hitLensY);
        ctx.lineTo(width, hitLensY);
        ctx.stroke();
      }

      // ==========================================
      // IMAGE FORMATION (Real or Virtual)
      // ==========================================
      const imgX = centerX + diVal;
      const imgTopY = centerY - imageHeight;

      if (imgX > 20 && imgX < width - 20) {
        ctx.save();
        ctx.strokeStyle = isImageReal ? '#38bdf8' : '#a855f7';
        ctx.fillStyle = isImageReal ? '#38bdf8' : '#a855f7';
        ctx.lineWidth = 3;

        if (isImageVirtual) {
          ctx.setLineDash([5, 5]);
        }

        ctx.beginPath();
        ctx.moveTo(imgX, centerY);
        ctx.lineTo(imgX, imgTopY);
        ctx.stroke();

        ctx.setLineDash([]);
        const arrowDir = imageHeight >= 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(imgX, imgTopY);
        ctx.lineTo(imgX - 6, imgTopY + arrowDir * 10);
        ctx.lineTo(imgX + 6, imgTopY + arrowDir * 10);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${isImageReal ? t('صورة حقيقية', 'Real Image') : t('صورة تقديرية', 'Virtual Image')} (di=${Math.round(diVal)}px)`,
          imgX,
          centerY + (imageHeight >= 0 ? 35 : -15)
        );
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('الأشعة متوازية: تتكون الصورة في اللانهاية (do = f)', 'Rays are parallel: Image formed at Infinity (do = f)'), centerX, 40);
    }

    // ==========================================
    // DRAGGABLE VIRTUAL PROTRACTOR (LENS SIMULATION)
    // ==========================================
    if (showProtractorLens) {
      const ray1HitX = centerX;
      const ray1HitY = objTopY;
      const distRay1 = Math.hypot(lensProtractorPos.x - ray1HitX, lensProtractorPos.y - ray1HitY);
      const distCenter = Math.hypot(lensProtractorPos.x - centerX, lensProtractorPos.y - centerY);

      let drawX = lensProtractorPos.x;
      let drawY = lensProtractorPos.y;
      let normAngle: number | null = null;
      let incAngle: number | null = null;
      let refrAngle: number | null = null;
      let t1: number | null = null;
      let t2: number | null = null;
      let lTitle = t('منقلة بصرية افتراضية (قابلة للسحب 🎯)', 'Virtual Protractor (Draggable 🎯)');
      let snellTxt = '';

      if (distRay1 < 45) {
        drawX = ray1HitX;
        drawY = ray1HitY;
        normAngle = Math.PI; // Normal is horizontal pointing left (-x)
        incAngle = 0; // Parallel ray coming from left
        t1 = 0.0; // Incident angle with normal is 0°

        // Refracted ray towards (centerX + effectiveF, centerY)
        const dX = effectiveF;
        const dY = centerY - objTopY;
        refrAngle = Math.atan2(dY, dX);
        t2 = (Math.atan2(Math.abs(dY), Math.abs(dX)) * 180) / Math.PI;

        lTitle = t('انكسار الشعاع الموازي عند سطح العدسة', 'Parallel Ray Lens Refraction');
        snellTxt = `θ_انحراف = ${t2.toFixed(1)}° نحو البؤرة F`;
      } else if (distCenter < 45) {
        drawX = centerX;
        drawY = centerY;
        normAngle = Math.PI;
        const slope = (centerY - objTopY) / doVal;
        const angle = (Math.atan(slope) * 180) / Math.PI;
        t1 = angle;
        t2 = angle;
        incAngle = Math.atan2(centerY - objTopY, doVal);
        refrAngle = incAngle;
        lTitle = t('الشعاع المار بالمركز البصري O (دون انكسار)', 'Central Ray through Optical Center');
        snellTxt = `θ₁ = θ₂ = ${angle.toFixed(1)}° (يمر على استقامته)`;
      }

      drawVirtualProtractor({
        ctx,
        x: drawX,
        y: drawY,
        rotation: lensProtractorRot,
        radius: 80,
        normalAngleRad: normAngle,
        incidentAngleRad: incAngle,
        refractedAngleRad: refrAngle,
        theta1Deg: t1,
        theta2Deg: t2,
        isDark,
        title: lTitle,
        snellFormulaText: snellTxt
      });
    }
  }, [activeOpticsSubTab, opticsSubCategory, lensType, focalLength, objectDistance, objectHeight, objectVisual, isDark, doVal, diVal, effectiveF, imageHeight, isImageAtInfinity, isImageReal, isImageVirtual, showProtractorLens, lensProtractorPos, lensProtractorRot, t]);

  // -------------------------------------------------------------
  // RENDER CANVAS 2: SNELL'S LAW & REFLECTION/REFRACTION
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeOpticsSubTab !== 'refraction') return;
    const canvas = refrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = 190;
    const midX = laserAimX;

    // Clear
    ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Medium 1 (Top)
    ctx.fillStyle = isDark ? med1.colorDark : med1.colorLight;
    ctx.fillRect(0, 0, width, midY);

    // Medium 2 (Bottom)
    ctx.fillStyle = isDark ? med2.colorDark : med2.colorLight;
    ctx.fillRect(0, midY, width, height - midY);

    // Medium separator line
    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Normal line at hit point
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Medium Labels
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = isAr ? 'right' : 'left';
    const labelX = isAr ? width - 30 : 30;

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.fillText(`${t('الوسط الأول', 'Medium 1')}: ${isAr ? med1.nameAr : med1.nameEn} (n₁ = ${med1.n.toFixed(3)})`, labelX, 40);

    ctx.fillStyle = isDark ? '#a855f7' : '#7c3aed';
    ctx.fillText(`${t('الوسط الثاني', 'Medium 2')}: ${isAr ? med2.nameAr : med2.nameEn} (n₂ = ${med2.n.toFixed(3)})`, labelX, midY + 40);

    // Movable Laser Gun Body
    const lX = laserPos.x;
    const lY = laserPos.y;

    // Laser Box
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lX, lY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Emitter nozzle
    ctx.fillStyle = laserBeamColor;
    ctx.shadowColor = laserBeamColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(lX, lY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Incident Beam from Laser to Boundary Hit Point
    ctx.save();
    ctx.strokeStyle = laserBeamColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = laserBeamColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(lX, lY);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    // Aim point handle on interface
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(midX, midY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reflected Ray (θr = θ1)
    const signX = laserPos.x < midX ? 1 : -1;
    const reflLength = 220;
    const reflX = midX + signX * Math.sin(theta1Rad) * reflLength;
    const reflY = midY - Math.cos(theta1Rad) * reflLength;

    ctx.strokeStyle = laserBeamColor;
    ctx.lineWidth = isTotalInternalReflection ? 3.5 : 2;
    ctx.globalAlpha = isTotalInternalReflection ? 1.0 : 0.45;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(reflX, reflY);
    ctx.stroke();

    // Refracted Ray into Medium 2
    if (!isTotalInternalReflection) {
      const refrLength = 220;
      const refrX = midX + signX * Math.sin(theta2Rad) * refrLength;
      const refrY = midY + Math.cos(theta2Rad) * refrLength;

      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(refrX, refrY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Refraction angle arc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(midX, midY, 45, Math.PI / 2, Math.PI / 2 + (signX > 0 ? theta2Rad : -theta2Rad), signX < 0);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`θ₂ = ${theta2Deg.toFixed(1)}°`, midX + signX * 25, midY + 40);
    } else {
      // Total Internal Reflection HUD
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('💥 حدوث انعكاس كلي داخلي تام (TIR)! لا ينفذ أي ضوء للوسط الثاني', '💥 Total Internal Reflection (TIR)! Zero refraction into Medium 2'), width / 2, midY + 70);
    }

    ctx.restore();

    // Incident angle arc
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(midX, midY, 50, -Math.PI / 2, -Math.PI / 2 + (signX < 0 ? theta1Rad : -theta1Rad), signX > 0);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`θ₁ = ${incidentAngleDeg.toFixed(1)}°`, midX - signX * 35, midY - 35);
  }, [activeOpticsSubTab, med1, med2, laserPos, laserAimX, laserBeamColor, isDark, isTotalInternalReflection, incidentAngleDeg, theta1Rad, theta2Rad, theta2Deg, isAr, t]);

  // -------------------------------------------------------------
  // RENDER CANVAS 3: REAL DYNAMIC GLASS PRISM DISPERSION ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeOpticsSubTab !== 'prism' || prismSubCategory !== 'prism') return;

    let animId: number;
    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      const canvas = prismCanvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark optical bench backdrop
      ctx.fillStyle = isDark ? '#050811' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

    // Prism Geometry (Equilateral Triangle centered)
    const pSize = 180;
    const pCenterX = width * 0.48;
    const pCenterY = height * 0.54;

    const pA = { x: pCenterX, y: pCenterY - pSize * 0.65 }; // Apex
    const pB = { x: pCenterX - pSize * 0.65, y: pCenterY + pSize * 0.45 }; // Bottom Left
    const pC = { x: pCenterX + pSize * 0.65, y: pCenterY + pSize * 0.45 }; // Bottom Right

    // Draw Glass Prism Body
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.12)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glass facet highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pA.x + 3, pA.y + 12);
    ctx.lineTo(pB.x + 12, pB.y - 4);
    ctx.stroke();
    ctx.restore();

    // Flashlight Source coordinates
    const srcX = prismSourcePos.x;
    const srcY = prismSourcePos.y;
    const aimX = prismAimPos.x;
    const aimY = prismAimPos.y;

    // Beam Direction vector
    const bDx = aimX - srcX;
    const bDy = aimY - srcY;
    const bDist = Math.hypot(bDx, bDy) || 1;
    const dirX = bDx / bDist;
    const dirY = bDy / bDist;

    // Helper: Segment intersection
    const lineIntersectSegment = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      s1: { x: number; y: number },
      s2: { x: number; y: number }
    ) => {
      const d = (p2.x - p1.x) * (s2.y - s1.y) - (p2.y - p1.y) * (s2.x - s1.x);
      if (Math.abs(d) < 1e-6) return null;
      const u = ((s1.x - p1.x) * (s2.y - s1.y) - (s1.y - p1.y) * (s2.x - s1.x)) / d;
      const v = ((s1.x - p1.x) * (p2.y - p1.y) - (s1.y - p1.y) * (p2.x - p1.x)) / d;
      if (u > 0.001 && v >= 0 && v <= 1) {
        return {
          x: p1.x + u * (p2.x - p1.x),
          y: p1.y + u * (p2.y - p1.y),
          dist: u * Math.hypot(p2.x - p1.x, p2.y - p1.y)
        };
      }
      return null;
    };

    // Vector 2D Refraction according to Snell's Law
    const refractVector2D = (
      dir: { x: number; y: number },
      normal: { x: number; y: number },
      nFrom: number,
      nTo: number
    ) => {
      let cosI = -(dir.x * normal.x + dir.y * normal.y);
      let nVec = { x: normal.x, y: normal.y };
      if (cosI < 0) {
        cosI = -cosI;
        nVec.x = -nVec.x;
        nVec.y = -nVec.y;
      }
      const eta = nFrom / nTo;
      const k = 1 - eta * eta * (1 - cosI * cosI);
      if (k < 0) {
        // Total internal reflection
        const refl = {
          x: dir.x + 2 * cosI * nVec.x,
          y: dir.y + 2 * cosI * nVec.y
        };
        const len = Math.hypot(refl.x, refl.y) || 1;
        return { vec: { x: refl.x / len, y: refl.y / len }, isTIR: true };
      }
      const cosT = Math.sqrt(k);
      const refr = {
        x: eta * dir.x + (eta * cosI - cosT) * nVec.x,
        y: eta * dir.y + (eta * cosI - cosT) * nVec.y
      };
      const len = Math.hypot(refr.x, refr.y) || 1;
      return { vec: { x: refr.x / len, y: refr.y / len }, isTIR: false };
    };

    // Prism Centroid for robust outward-normal orientation
    const pCentroid = {
      x: (pA.x + pB.x + pC.x) / 3,
      y: (pA.y + pB.y + pC.y) / 3
    };

    const getTriangleOutwardNormal = (
      p1: { x: number; y: number },
      p2: { x: number; y: number }
    ) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len;
      let ny = dx / len;
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      // Vector from centroid to midpoint always points outward:
      if (nx * (mx - pCentroid.x) + ny * (my - pCentroid.y) < 0) {
        nx = -nx;
        ny = -ny;
      }
      return { x: nx, y: ny };
    };

    // Prism Faces & Outward Normals:
    // Face 1: Left face pB -> pA
    const norm1 = getTriangleOutwardNormal(pB, pA);
    // Face 2: Right face pA -> pC
    const norm2 = getTriangleOutwardNormal(pA, pC);
    // Face 3: Base pB -> pC
    const norm3 = getTriangleOutwardNormal(pB, pC);

    const prismFaces = [
      { face: 1, s1: pB, s2: pA, norm: norm1 },
      { face: 2, s1: pA, s2: pC, norm: norm2 },
      { face: 3, s1: pB, s2: pC, norm: norm3 }
    ];

    // Ray from Flashlight
    const farPoint = { x: srcX + dirX * 1200, y: srcY + dirY * 1200 };
    const hit1 = lineIntersectSegment({ x: srcX, y: srcY }, farPoint, pB, pA);
    const hit2 = lineIntersectSegment({ x: srcX, y: srcY }, farPoint, pA, pC);
    const hit3 = lineIntersectSegment({ x: srcX, y: srcY }, farPoint, pB, pC);

    // Find nearest face hit
    let firstHit: { x: number; y: number; normal: { x: number; y: number }; face: number } | null = null;
    let minDist = 999999;
    if (hit1 && hit1.dist < minDist) {
      minDist = hit1.dist;
      firstHit = { x: hit1.x, y: hit1.y, normal: norm1, face: 1 };
    }
    if (hit2 && hit2.dist < minDist) {
      minDist = hit2.dist;
      firstHit = { x: hit2.x, y: hit2.y, normal: norm2, face: 2 };
    }
    if (hit3 && hit3.dist < minDist) {
      minDist = hit3.dist;
      firstHit = { x: hit3.x, y: hit3.y, normal: norm3, face: 3 };
    }

    // Draw Flashlight Instrument
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner glowing bulb
    const beamSourceColor = prismLightMode === 'white' ? '#ffffff' : wavelengthToColor(prismsLaserNm);
    ctx.fillStyle = beamSourceColor;
    ctx.shadowColor = beamSourceColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Flashlight body cone graphic
    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(srcX - dirX * 18 + dirY * 12, srcY - dirY * 18 - dirX * 12);
    ctx.lineTo(srcX + dirY * 14, srcY - dirX * 14);
    ctx.lineTo(srcX - dirY * 14, srcY + dirX * 14);
    ctx.lineTo(srcX - dirX * 18 - dirY * 12, srcY - dirY * 18 + dirX * 12);
    ctx.closePath();
    ctx.fillStyle = isDark ? '#1e293b' : '#334155';
    ctx.fill();
    ctx.stroke();

    // Aim Handle (Orange target ring on the beam path)
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(aimX, aimY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('توجيه الزاوية 🎯', 'Aim Angle 🎯'), aimX, aimY - 13);
    ctx.restore();

    // Wavelength dispersion data (7 colors for White light, or single laser)
    const baseIndex = prismType === 'flint' ? 1.64 : 1.52;
    const dispersionDelta = prismType === 'flint' ? 0.055 : 0.025;

    const rainbowBands = [
      { name: 'Red', nm: 700, color: '#ef4444', n: baseIndex - dispersionDelta * 0.5 },
      { name: 'Orange', nm: 610, color: '#f97316', n: baseIndex - dispersionDelta * 0.3 },
      { name: 'Yellow', nm: 580, color: '#eab308', n: baseIndex - dispersionDelta * 0.1 },
      { name: 'Green', nm: 530, color: '#22c55e', n: baseIndex + dispersionDelta * 0.1 },
      { name: 'Cyan', nm: 490, color: '#06b6d4', n: baseIndex + dispersionDelta * 0.25 },
      { name: 'Blue', nm: 460, color: '#3b82f6', n: baseIndex + dispersionDelta * 0.4 },
      { name: 'Violet', nm: 410, color: '#a855f7', n: baseIndex + dispersionDelta * 0.6 }
    ];

    const activeBands = prismLightMode === 'white'
      ? rainbowBands
      : [{ name: 'Laser', nm: prismsLaserNm, color: wavelengthToColor(prismsLaserNm), n: baseIndex }];

    if (firstHit) {
      // 1. Draw Incoming Incident Beam to the Hit Point
      ctx.save();
      ctx.strokeStyle = beamSourceColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = beamSourceColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(firstHit.x, firstHit.y);
      ctx.stroke();
      ctx.restore();

      // Normal line at entrance hit point
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(firstHit.x - firstHit.normal.x * 25, firstHit.y - firstHit.normal.y * 25);
      ctx.lineTo(firstHit.x + firstHit.normal.x * 25, firstHit.y + firstHit.normal.y * 25);
      ctx.stroke();
      ctx.restore();

      // Track main spectral band for protractor reference
      let prismMainExitHit: { x: number; y: number; normal: { x: number; y: number } } | null = null;
      let prismMainInDir: { x: number; y: number } | null = null;
      let prismMainOutDir: { x: number; y: number } | null = null;
      let prismMainN = baseIndex;

      // Track screen and floor hits for realistic projection rendering
      const screenX = prismScreenX;
      const screenTopY = 25;
      const floorY = height - 25;
      const screenHits: { y: number; color: string; nm: number; name: string }[] = [];
      const floorHits: { x: number; color: string; nm: number }[] = [];

      // 2. Real Vector Refraction for each wavelength inside and outside
      for (let bandIdx = 0; bandIdx < activeBands.length; bandIdx++) {
        const band = activeBands[bandIdx];
        // Refract into glass at entrance face
        const inRefraction = refractVector2D({ x: dirX, y: dirY }, firstHit.normal, 1.0003, band.n);
        const inDir = inRefraction.vec;

        // Trace inside prism from firstHit to find intersection with the other faces
        const inFar = { x: firstHit.x + inDir.x * 1200, y: firstHit.y + inDir.y * 1200 };
        let exitHit: { x: number; y: number; normal: { x: number; y: number }; face: number } | null = null;
        let bestDist = 999999;

        for (const f of prismFaces) {
          if (f.face === firstHit.face) continue;
          const h = lineIntersectSegment(firstHit, inFar, f.s1, f.s2);
          if (h && h.dist < bestDist) {
            bestDist = h.dist;
            exitHit = { x: h.x, y: h.y, normal: f.norm, face: f.face };
          }
        }

        if (exitHit) {
          if (bandIdx === Math.floor(activeBands.length / 2)) {
            prismMainExitHit = exitHit;
            prismMainInDir = inDir;
            prismMainN = band.n;
          }

          // Draw Internal Refracted Ray
          ctx.save();
          ctx.strokeStyle = band.color;
          ctx.lineWidth = prismLightMode === 'white' ? 2 : 3.5;
          ctx.beginPath();
          ctx.moveTo(firstHit.x, firstHit.y);
          ctx.lineTo(exitHit.x, exitHit.y);
          ctx.stroke();

          // Refract out of glass into air at exit face
          const outRefraction = refractVector2D(inDir, exitHit.normal, band.n, 1.0003);
          const outDir = outRefraction.vec;

          if (bandIdx === Math.floor(activeBands.length / 2)) {
            prismMainOutDir = outDir;
          }

          if (!outRefraction.isTIR) {
            // Ray successfully emerges into air towards projection screen or floor
            let endX: number;
            let endY: number;

            if (outDir.x > 0.001) {
              const tScreen = (screenX - exitHit.x) / outDir.x;
              const yAtScreen = exitHit.y + outDir.y * tScreen;

              if (yAtScreen >= screenTopY && yAtScreen <= floorY) {
                // Ray lands squarely on the projection screen!
                endX = screenX;
                endY = yAtScreen;
                screenHits.push({ y: yAtScreen, color: band.color, nm: band.nm, name: band.name });
              } else if (yAtScreen > floorY && outDir.y > 0.001) {
                // Ray strikes the floor bench before or under the screen
                const tFloor = (floorY - exitHit.y) / outDir.y;
                const xAtFloor = exitHit.x + outDir.x * tFloor;
                endX = Math.min(screenX, Math.max(exitHit.x + 10, xAtFloor));
                endY = floorY;
                floorHits.push({ x: endX, color: band.color, nm: band.nm });
              } else {
                // Ray angles above screen
                endX = screenX;
                endY = Math.max(screenTopY, yAtScreen);
                screenHits.push({ y: endY, color: band.color, nm: band.nm, name: band.name });
              }
            } else {
              endX = exitHit.x + outDir.x * 250;
              endY = exitHit.y + outDir.y * 250;
            }

            ctx.strokeStyle = band.color;
            ctx.lineWidth = prismLightMode === 'white' ? 2.5 : 4;
            ctx.shadowColor = band.color;
            ctx.shadowBlur = 9;
            ctx.beginPath();
            ctx.moveTo(exitHit.x, exitHit.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Total Internal Reflection inside prism:
            // The ray reflects internally towards the next face
            const bounceFar = { x: exitHit.x + outDir.x * 800, y: exitHit.y + outDir.y * 800 };
            let bounceHit: { x: number; y: number; normal: { x: number; y: number } } | null = null;
            let bounceMinDist = 999999;

            for (const f of prismFaces) {
              if (f.face === exitHit.face) continue;
              const bh = lineIntersectSegment(exitHit, bounceFar, f.s1, f.s2);
              if (bh && bh.dist < bounceMinDist) {
                bounceMinDist = bh.dist;
                bounceHit = { x: bh.x, y: bh.y, normal: f.norm };
              }
            }

            if (bounceHit) {
              ctx.strokeStyle = band.color;
              ctx.lineWidth = prismLightMode === 'white' ? 2 : 3.5;
              ctx.beginPath();
              ctx.moveTo(exitHit.x, exitHit.y);
              ctx.lineTo(bounceHit.x, bounceHit.y);
              ctx.stroke();

              // Refract out from 2nd bounce face
              const out2 = refractVector2D(outDir, bounceHit.normal, band.n, 1.0003);
              const o2Dir = out2.vec;

              let endX: number;
              let endY: number;

              if (o2Dir.x > 0.001) {
                const tScreen = (screenX - bounceHit.x) / o2Dir.x;
                const yAtScreen = bounceHit.y + o2Dir.y * tScreen;
                if (yAtScreen >= screenTopY && yAtScreen <= floorY) {
                  endX = screenX;
                  endY = yAtScreen;
                  screenHits.push({ y: yAtScreen, color: band.color, nm: band.nm, name: band.name });
                } else if (yAtScreen > floorY && o2Dir.y > 0.001) {
                  const tFloor = (floorY - bounceHit.y) / o2Dir.y;
                  endX = Math.min(screenX, Math.max(bounceHit.x + 10, bounceHit.x + o2Dir.x * tFloor));
                  endY = floorY;
                  floorHits.push({ x: endX, color: band.color, nm: band.nm });
                } else {
                  endX = screenX;
                  endY = Math.max(screenTopY, yAtScreen);
                  screenHits.push({ y: endY, color: band.color, nm: band.nm, name: band.name });
                }
              } else {
                endX = bounceHit.x + o2Dir.x * 200;
                endY = bounceHit.y + o2Dir.y * 200;
              }

              ctx.strokeStyle = band.color;
              ctx.lineWidth = prismLightMode === 'white' ? 2 : 3.5;
              ctx.beginPath();
              ctx.moveTo(bounceHit.x, bounceHit.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            } else {
              ctx.strokeStyle = band.color;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(exitHit.x, exitHit.y);
              ctx.lineTo(exitHit.x + outDir.x * 90, exitHit.y + outDir.y * 90);
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }

      // ==========================================
      // PROJECTION SCREEN & SPECTRUM DETECTOR GRAPHIC
      // ==========================================
      const screenW = 12;
      const screenH = floorY - screenTopY;

      ctx.save();
      // Lab table surface line at floorY
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(width, floorY);
      ctx.stroke();

      // Screen Base Pedestal
      ctx.fillStyle = isDark ? '#1e293b' : '#94a3b8';
      ctx.fillRect(screenX - 16, floorY - 5, 32, 10);
      ctx.strokeStyle = isDark ? '#475569' : '#64748b';
      ctx.strokeRect(screenX - 16, floorY - 5, 32, 10);

      // Screen Panel Plate
      const screenGrad = ctx.createLinearGradient(screenX - 6, 0, screenX + 6, 0);
      if (isDark) {
        screenGrad.addColorStop(0, '#334155');
        screenGrad.addColorStop(0.35, '#f8fafc');
        screenGrad.addColorStop(0.65, '#e2e8f0');
        screenGrad.addColorStop(1, '#1e293b');
      } else {
        screenGrad.addColorStop(0, '#cbd5e1');
        screenGrad.addColorStop(0.35, '#ffffff');
        screenGrad.addColorStop(0.65, '#f1f5f9');
        screenGrad.addColorStop(1, '#94a3b8');
      }
      ctx.fillStyle = screenGrad;
      ctx.fillRect(screenX - 6, screenTopY, screenW, screenH);
      ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(screenX - 6, screenTopY, screenW, screenH);

      // Top Drag Handle & Title Badge
      const isDraggingScreen = dragModePrism === 'screen';
      ctx.fillStyle = isDraggingScreen ? '#6366f1' : (isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(241, 245, 249, 0.92)');
      ctx.strokeStyle = isDraggingScreen ? '#a5b4fc' : (isDark ? '#64748b' : '#94a3b8');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(screenX - 42, screenTopY - 18, 84, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDraggingScreen ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155');
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('⇔ شاشة الاستقبال', '⇔ Screen Plate'), screenX, screenTopY - 10);

      // Render Screen Spectral Bands & Continuous Rainbow Gradient
      if (screenHits.length > 0) {
        if (prismLightMode === 'white' && screenHits.length >= 2) {
          const sortedHits = [...screenHits].sort((a, b) => a.y - b.y);
          const minY = sortedHits[0].y;
          const maxY = sortedHits[sortedHits.length - 1].y;

          // Continuous Rainbow Spectrum Band along screen surface
          const specGrad = ctx.createLinearGradient(0, minY, 0, maxY);
          sortedHits.forEach((h, idx) => {
            const stop = sortedHits.length > 1 ? idx / (sortedHits.length - 1) : 0;
            specGrad.addColorStop(Math.max(0, Math.min(1, stop)), h.color);
          });

          ctx.fillStyle = specGrad;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.fillRect(screenX - 6, minY - 3, screenW, Math.max(8, maxY - minY + 6));
          ctx.shadowBlur = 0;

          // Distinct color hit lines
          sortedHits.forEach(h => {
            ctx.fillStyle = h.color;
            ctx.shadowColor = h.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX - 6, h.y - 2, screenW, 4);
            ctx.shadowBlur = 0;
          });

          // Red (top) and Violet (bottom) Callouts
          const topHit = sortedHits[0];
          const bottomHit = sortedHits[sortedHits.length - 1];

          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'left';

          ctx.fillStyle = topHit.color;
          ctx.fillText(`◄ ${isAr ? topHit.name : topHit.nm + 'nm'}`, screenX + 10, topHit.y + 3);

          if (Math.abs(bottomHit.y - topHit.y) > 16) {
            ctx.fillStyle = bottomHit.color;
            ctx.fillText(`◄ ${isAr ? bottomHit.name : bottomHit.nm + 'nm'}`, screenX + 10, bottomHit.y + 3);
          }

          const spanPx = Math.round(Math.abs(maxY - minY));
          ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
          ctx.font = '9px monospace';
          ctx.fillText(`Δy: ${spanPx}px`, screenX + 10, (minY + maxY) / 2 + 3);
        } else {
          // Monochromatic laser hit
          screenHits.forEach(h => {
            ctx.fillStyle = h.color;
            ctx.shadowColor = h.color;
            ctx.shadowBlur = 18;
            ctx.fillRect(screenX - 6, h.y - 3, screenW, 6);
            ctx.shadowBlur = 0;

            ctx.fillStyle = h.color;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`◄ ${h.nm} nm`, screenX + 10, h.y + 3);
          });
        }
      }

      // Render Floor Dispersion Scatter Spot if rays strike table
      if (floorHits.length > 0) {
        const sortedFloor = [...floorHits].sort((a, b) => a.x - b.x);
        const minX = sortedFloor[0].x;
        const maxX = sortedFloor[sortedFloor.length - 1].x;
        const floorGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
        sortedFloor.forEach((h, idx) => {
          const stop = sortedFloor.length > 1 ? idx / (sortedFloor.length - 1) : 0;
          floorGrad.addColorStop(Math.max(0, Math.min(1, stop)), h.color);
        });

        ctx.fillStyle = floorGrad;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(minX - 4, floorY - 2, Math.max(12, maxX - minX + 8), 5);
        ctx.shadowBlur = 0;

        ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('تشتت على سطح الطاولة ✦', 'Bench Surface Scatter ✦'), (minX + maxX) / 2, floorY + 14);
      }
      ctx.restore();

      // ==========================================
      // INTERACTIVE GLOW & CONCENTRATION HOTSPOT AT PRISM SURFACE HIT POINT
      // ==========================================
      if (showHitGlow && firstHit) {
        ctx.save();
        const hitX = firstHit.x;
        const hitY = firstHit.y;

        // Tangent vector along the prism surface (perpendicular to normal)
        const tanX = -firstHit.normal.y;
        const tanY = firstHit.normal.x;

        // Time-based organic pulsation for realistic radiant shimmer
        const timeMs = Date.now();
        const pulse = 1 + 0.15 * Math.sin(timeMs * 0.0055);
        const shimmerSpin = (timeMs * 0.0015) % (Math.PI * 2);
        const isDragging = dragModePrism === 'source' || dragModePrism === 'aim';
        const baseRadius = (isDragging ? 26 : 20) * pulse;
        const glowColor = beamSourceColor;

        // 1. Broad Ambient Diffusion Halo (Simulates atmospheric and boundary scatter)
        const outerHalo = ctx.createRadialGradient(hitX, hitY, 2, hitX, hitY, baseRadius * 1.85);
        if (prismLightMode === 'white') {
          outerHalo.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
          outerHalo.addColorStop(0.25, 'rgba(254, 240, 138, 0.42)'); // Solar warm gold
          outerHalo.addColorStop(0.55, 'rgba(168, 85, 247, 0.25)'); // Violet boundary fringe
          outerHalo.addColorStop(0.8, 'rgba(6, 182, 212, 0.12)'); // Cyan boundary fringe
          outerHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          outerHalo.addColorStop(0, glowColor);
          outerHalo.addColorStop(0.4, glowColor);
          outerHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = outerHalo;
        ctx.beginPath();
        ctx.arc(hitX, hitY, baseRadius * 1.85, 0, Math.PI * 2);
        ctx.fill();

        // 2. Focused Intense Corona (Focal Hotspot Concentration)
        const coronaGrad = ctx.createRadialGradient(hitX, hitY, 1, hitX, hitY, baseRadius);
        if (prismLightMode === 'white') {
          coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
          coronaGrad.addColorStop(0.35, 'rgba(253, 224, 71, 0.82)');
          coronaGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.42)');
          coronaGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        } else {
          coronaGrad.addColorStop(0, '#ffffff');
          coronaGrad.addColorStop(0.35, glowColor);
          coronaGrad.addColorStop(0.75, glowColor);
          coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = coronaGrad;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isDragging ? 26 : 18;
        ctx.beginPath();
        ctx.arc(hitX, hitY, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Tangential Surface Dispersion Glint (Along the prism interface)
        ctx.strokeStyle = prismLightMode === 'white' ? 'rgba(255, 255, 255, 0.9)' : glowColor;
        ctx.lineWidth = isDragging ? 3.5 : 2.5;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        const flareSpread = (isDragging ? 24 : 18) * pulse;
        ctx.moveTo(hitX - tanX * flareSpread, hitY - tanY * flareSpread);
        ctx.lineTo(hitX + tanX * flareSpread, hitY + tanY * flareSpread);
        ctx.stroke();

        // 4. Multi-Ray Optical Diffraction Sparkle / Star (Rotating shimmer)
        ctx.save();
        ctx.translate(hitX, hitY);
        ctx.rotate(shimmerSpin);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.shadowBlur = 9;
        ctx.shadowColor = '#ffffff';

        const sparkLen = (isDragging ? 14 : 10) * pulse;
        ctx.beginPath();
        ctx.moveTo(-sparkLen, 0);
        ctx.lineTo(sparkLen, 0);
        ctx.moveTo(0, -sparkLen);
        ctx.lineTo(0, sparkLen);
        const diagLen = sparkLen * 0.6;
        ctx.moveTo(-diagLen, -diagLen);
        ctx.lineTo(diagLen, diagLen);
        ctx.moveTo(-diagLen, diagLen);
        ctx.lineTo(diagLen, -diagLen);
        ctx.stroke();
        ctx.restore();

        // 5. White-Hot Central Photonic Core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(hitX, hitY, isDragging ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 6. Floating Scientific Hotspot Badge
        ctx.shadowBlur = 0;
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)';
        ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.75)' : 'rgba(217, 119, 6, 0.75)';
        ctx.lineWidth = 1;
        const badgeText = t('بؤرة تركيز الضوء ✦', 'Focus Hotspot ✦');
        ctx.font = 'bold 9px sans-serif';
        const txtW = ctx.measureText(badgeText).width;
        const bx = hitX + firstHit.normal.x * 24;
        const by = hitY + firstHit.normal.y * 24 - 8;
        ctx.beginPath();
        ctx.roundRect(bx - txtW / 2 - 5, by - 8, txtW + 10, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, bx, by);

        ctx.restore();

        // Subtle Exit Dispersion Glow where rays exit the prism face
        if (prismMainExitHit) {
          ctx.save();
          const exitX = prismMainExitHit.x;
          const exitY = prismMainExitHit.y;
          const exitGrad = ctx.createRadialGradient(exitX, exitY, 1, exitX, exitY, 12 * pulse);
          exitGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          exitGrad.addColorStop(0.4, prismLightMode === 'white' ? 'rgba(168, 85, 247, 0.45)' : glowColor);
          exitGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = exitGrad;
          ctx.beginPath();
          ctx.arc(exitX, exitY, 12 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ==========================================
      // DRAGGABLE VIRTUAL PROTRACTOR (PRISM SIMULATION)
      // ==========================================
      if (showProtractorPrism) {
        const distEntrance = firstHit ? Math.hypot(prismProtractorPos.x - firstHit.x, prismProtractorPos.y - firstHit.y) : 9999;
        const distExit = prismMainExitHit ? Math.hypot(prismProtractorPos.x - prismMainExitHit.x, prismProtractorPos.y - prismMainExitHit.y) : 9999;

        let drawX = prismProtractorPos.x;
        let drawY = prismProtractorPos.y;
        let normAngle: number | null = null;
        let incAngle: number | null = null;
        let refrAngle: number | null = null;
        let t1: number | null = null;
        let t2: number | null = null;
        let pTitle = t('منقلة بصرية افتراضية (اسحبني بحرية 🎯)', 'Virtual Protractor (Draggable 🎯)');
        let snellTxt = '';

        if (distEntrance < 24 && firstHit) {
          drawX = firstHit.x;
          drawY = firstHit.y;
          normAngle = Math.atan2(firstHit.normal.y, firstHit.normal.x);
          incAngle = Math.atan2(dirY, dirX);
          const cosI = Math.max(-1, Math.min(1, -(dirX * firstHit.normal.x + dirY * firstHit.normal.y)));
          t1 = (Math.acos(cosI) * 180) / Math.PI;

          if (prismMainInDir) {
            refrAngle = Math.atan2(prismMainInDir.y, prismMainInDir.x);
            const cosR = Math.max(-1, Math.min(1, -(prismMainInDir.x * firstHit.normal.x + prismMainInDir.y * firstHit.normal.y)));
            t2 = (Math.acos(cosR) * 180) / Math.PI;
          }
          pTitle = t('نقطة السقوط الأولى على سطح المنشور', 'Entrance Surface Hit Point');
          if (t1 !== null && t2 !== null) {
            snellTxt = `1.00·sin(${t1.toFixed(1)}°) = ${(Math.sin(t1 * Math.PI / 180)).toFixed(3)} ≈ ${prismMainN.toFixed(2)}·sin(${t2.toFixed(1)}°)`;
          }
        } else if (distExit < 24 && prismMainExitHit && prismMainInDir && prismMainOutDir) {
          drawX = prismMainExitHit.x;
          drawY = prismMainExitHit.y;
          normAngle = Math.atan2(prismMainExitHit.normal.y, prismMainExitHit.normal.x);
          incAngle = Math.atan2(prismMainInDir.y, prismMainInDir.x);
          const cosI = Math.max(-1, Math.min(1, prismMainInDir.x * prismMainExitHit.normal.x + prismMainInDir.y * prismMainExitHit.normal.y));
          t1 = (Math.acos(cosI) * 180) / Math.PI;
          refrAngle = Math.atan2(prismMainOutDir.y, prismMainOutDir.x);
          const cosR = Math.max(-1, Math.min(1, prismMainOutDir.x * prismMainExitHit.normal.x + prismMainOutDir.y * prismMainExitHit.normal.y));
          t2 = (Math.acos(cosR) * 180) / Math.PI;

          pTitle = t('نقطة خروج الضوء وانكساره للهواء', 'Exit Surface Refraction Point');
          snellTxt = `${prismMainN.toFixed(2)}·sin(${t1.toFixed(1)}°) ≈ 1.00·sin(${t2.toFixed(1)}°)`;
        }

        drawVirtualProtractor({
          ctx,
          x: drawX,
          y: drawY,
          rotation: prismProtractorRot,
          radius: 82,
          normalAngleRad: normAngle,
          incidentAngleRad: incAngle,
          refractedAngleRad: refrAngle,
          theta1Deg: t1,
          theta2Deg: t2,
          isDark,
          title: pTitle,
          snellFormulaText: snellTxt
        });
      }
    } else {
      // Beam misses prism - continues straight through space
      ctx.save();
      ctx.strokeStyle = beamSourceColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = beamSourceColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(farPoint.x, farPoint.y);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('وجه الكشاف نحو وجه المنشور لمشاهدة التشتت والانكسار!', 'Aim the flashlight at the prism face to observe dispersion!'), width / 2, 40);

      // Render protractor even when beam misses if user enabled it
      if (showProtractorPrism) {
        drawVirtualProtractor({
          ctx,
          x: prismProtractorPos.x,
          y: prismProtractorPos.y,
          rotation: prismProtractorRot,
          radius: 82,
          isDark,
          title: t('منقلة بصرية افتراضية (قابلة للسحب 🎯)', 'Virtual Protractor (Draggable 🎯)')
        });
      }
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);
  return () => {
    isMounted = false;
    cancelAnimationFrame(animId);
  };
}, [activeOpticsSubTab, prismSubCategory, prismSourcePos, prismAimPos, prismType, prismLightMode, prismsLaserNm, isDark, showProtractorPrism, prismProtractorPos, prismProtractorRot, showHitGlow, dragModePrism, prismScreenX, t]);

  // -------------------------------------------------------------
  // RENDER CANVAS 4: PHOTOELECTRIC TUBE & ELECTRONS
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeOpticsSubTab !== 'quantum' || quantumSubMode !== 'photoelectric') return;

    let animId: number;
    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      const canvas = photoCanvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Vacuum Tube Enclosure
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, 50, width - 160, height - 100, 40);
      ctx.stroke();
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)';
      ctx.fill();

      // Cathode Plate (Left)
      const cathodeX = 140;
      ctx.fillStyle = activeMetal.color;
      ctx.fillRect(cathodeX, 80, 24, height - 160);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(cathodeX, 80, 24, height - 160);

      // Anode Plate (Right)
      const anodeX = width - 164;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(anodeX, 80, 24, height - 160);
      ctx.strokeRect(anodeX, 80, 24, height - 160);

      ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('مهبط (-)', 'Cathode (-)'), cathodeX + 12, 70);
      ctx.fillText(t('مصعد (+)', 'Anode (+)'), anodeX + 12, 70);

      // Incoming Light Beam
      const beamColor = wavelengthToColor(wavelengthNm);
      ctx.save();
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 4 + (intensityPercent / 100) * 12;
      ctx.globalAlpha = 0.5 + (intensityPercent / 100) * 0.4;
      ctx.shadowColor = beamColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(cathodeX, height / 2);
      ctx.stroke();
      ctx.restore();

      // Electron generation & motion
      if (isEmissionOccurring && Math.random() < (intensityPercent / 100) * 0.7) {
        const speed = Math.sqrt(maxKineticEnergyEV) * 3 + 1;
        electronsRef.current.push({
          x: cathodeX + 24,
          y: 90 + Math.random() * (height - 180),
          vx: speed,
          vy: (Math.random() - 0.5) * 1.5,
          id: Math.random()
        });
      }

      // Update & Draw Electrons
      const electricForce = appliedVoltage * 0.15; // Retarding or accelerating force
      electronsRef.current.forEach(e => {
        e.vx += electricForce;
        e.x += e.vx;
        e.y += e.vy;

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Filter collected or turned-back electrons
      electronsRef.current = electronsRef.current.filter(
        e => e.x > cathodeX && e.x < anodeX && e.y > 60 && e.y < height - 60 && e.vx > -2
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
    };
  }, [activeOpticsSubTab, quantumSubMode, wavelengthNm, intensityPercent, appliedVoltage, activeMetal, isEmissionOccurring, maxKineticEnergyEV, isDark, t]);

  // ==========================================
  // UNRESTRICTED DRAG HANDLERS (MOUSE & TOUCH WITH SCALE-AWARE RESOLUTION)
  // ==========================================
  const getCanvasCoords = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // 1. Lens Dragging (Free 2D object & focal manipulation + Draggable Protractor)
  const handleLensStart = (clientX: number, clientY: number) => {
    const canvas = lensCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, clientX, clientY);

    // Check click on Virtual Protractor first
    if (showProtractorLens && Math.hypot(x - lensProtractorPos.x, y - lensProtractorPos.y) < 75) {
      setDragModeLens('protractor');
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const objX = centerX - doVal;
    const objTopY = centerY - objectHeight;

    // Click near object column or object body/tip
    if (Math.abs(x - objX) < 55 && y >= objTopY - 40 && y <= centerY + 40) {
      setDragModeLens('object');
    } else if (Math.hypot(x - (centerX - focalLength), y - centerY) < 25 || Math.hypot(x - (centerX + focalLength), y - centerY) < 25) {
      setDragModeLens('focus');
    } else if (x < centerX - 25) {
      // Click anywhere on left optical bench instantly grabs and moves the light source!
      setDragModeLens('object');
      const newDo = Math.max(30, Math.min(360, centerX - x));
      const newHo = Math.max(20, Math.min(120, centerY - y));
      setObjectDistance(Math.round(newDo));
      setObjectHeight(Math.round(newHo));
    }
  };

  const handleLensMove = (clientX: number, clientY: number) => {
    if (dragModeLens === 'none') return;
    const canvas = lensCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, clientX, clientY);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (dragModeLens === 'protractor') {
      const clampedX = Math.max(25, Math.min(canvas.width - 25, x));
      const clampedY = Math.max(25, Math.min(canvas.height - 25, y));
      setLensProtractorPos({ x: clampedX, y: clampedY });
    } else if (dragModeLens === 'object') {
      const newDo = Math.max(30, Math.min(360, centerX - x));
      const newHo = Math.max(20, Math.min(120, centerY - y));
      setObjectDistance(Math.round(newDo));
      setObjectHeight(Math.round(newHo));
    } else if (dragModeLens === 'focus') {
      const newF = Math.max(40, Math.min(160, Math.abs(centerX - x)));
      setFocalLength(Math.round(newF));
    }
  };

  // 2. Refraction Dragging
  const handleRefrStart = (clientX: number, clientY: number) => {
    const canvas = refrCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, clientX, clientY);

    if (Math.hypot(x - laserPos.x, y - laserPos.y) < 35) {
      setDragModeRefr('laserPos');
    } else if (Math.hypot(x - laserAimX, y - 190) < 30) {
      setDragModeRefr('laserAim');
    } else if (y < 190) {
      setDragModeRefr('laserPos');
      setLaserPos({ x: Math.max(30, Math.min(canvas.width - 30, x)), y: Math.max(30, Math.min(160, y)) });
    }
  };

  const handleRefrMove = (clientX: number, clientY: number) => {
    if (dragModeRefr === 'none') return;
    const canvas = refrCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, clientX, clientY);

    if (dragModeRefr === 'laserPos') {
      const clampedX = Math.max(30, Math.min(canvas.width - 30, x));
      const clampedY = Math.max(30, Math.min(160, y));
      setLaserPos({ x: clampedX, y: clampedY });
    } else if (dragModeRefr === 'laserAim') {
      const clampedAimX = Math.max(80, Math.min(canvas.width - 80, x));
      setLaserAimX(clampedAimX);
    }
  };

  // 3. Prism Dragging (Full 2D + Direction Aiming Handle + Draggable Screen + Draggable Protractor)
  const handlePrismStart = (clientX: number, clientY: number) => {
    const canvas = prismCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, clientX, clientY);

    // Check click near Screen plate or header handle first
    if (Math.abs(x - prismScreenX) < 24 && y >= 15 && y <= canvas.height - 15) {
      setDragModePrism('screen');
      return;
    }

    // Check click on Virtual Protractor
    if (showProtractorPrism && Math.hypot(x - prismProtractorPos.x, y - prismProtractorPos.y) < 75) {
      setDragModePrism('protractor');
      return;
    }

    if (Math.hypot(x - prismSourcePos.x, y - prismSourcePos.y) < 40) {
      setDragModePrism('source');
    } else if (Math.hypot(x - prismAimPos.x, y - prismAimPos.y) < 30) {
      setDragModePrism('aim');
    } else if (x < 300) {
      // Click in left space to immediately reposition flashlight
      setDragModePrism('source');
      const dx = x - prismSourcePos.x;
      const dy = y - prismSourcePos.y;
      setPrismSourcePos({ x, y });
      setPrismAimPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else {
      // Click near prism to aim beam directly there
      setDragModePrism('aim');
      setPrismAimPos({ x, y });
    }
  };

  const handlePrismMove = (clientX: number, clientY: number) => {
    if (dragModePrism === 'none') return;
    const canvas = prismCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(canvas, clientX, clientY);

    if (dragModePrism === 'screen') {
      const clampedScreenX = Math.max(480, Math.min(canvas.width - 25, x));
      setPrismScreenX(Math.round(clampedScreenX));
    } else if (dragModePrism === 'protractor') {
      const clampedX = Math.max(25, Math.min(canvas.width - 25, x));
      const clampedY = Math.max(25, Math.min(canvas.height - 25, y));
      setPrismProtractorPos({ x: clampedX, y: clampedY });
    } else if (dragModePrism === 'source') {
      const clampedX = Math.max(30, Math.min(270, x));
      const clampedY = Math.max(30, Math.min(canvas.height - 30, y));
      const dx = clampedX - prismSourcePos.x;
      const dy = clampedY - prismSourcePos.y;
      setPrismSourcePos({ x: clampedX, y: clampedY });
      setPrismAimPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dragModePrism === 'aim') {
      const clampedAimX = Math.max(100, Math.min(canvas.width - 60, x));
      const clampedAimY = Math.max(30, Math.min(canvas.height - 30, y));
      setPrismAimPos({ x: clampedAimX, y: clampedAimY });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn pb-12">
      {/* ============================================================== */}
      {/* 4 VARIETY OPTICS SUB-TAB SELECTOR (Lenses, Refraction, Prism, Quantum) */}
      {/* ============================================================== */}
      <div className={`p-2 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
          <button
            onClick={() => {
              setActiveOpticsSubTab('lenses');
              playLabSound('click');
            }}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeOpticsSubTab === 'lenses'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{t('01. العدسات والمرايا الكروية', '01. Lenses & Spherical Mirrors')}</span>
          </button>

          <button
            onClick={() => {
              setActiveOpticsSubTab('refraction');
              playLabSound('click');
            }}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeOpticsSubTab === 'refraction'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>{t('02. سنل والألياف البصرية وحوض 3D', '02. Snell, Fibers & 3D Tank')}</span>
          </button>

          <button
            onClick={() => {
              setActiveOpticsSubTab('prism');
              playLabSound('click');
            }}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeOpticsSubTab === 'prism'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{t('03. المنشور وتجربة شقي يونغ', '03. Prism & Young Interference')}</span>
          </button>

          <button
            onClick={() => {
              setActiveOpticsSubTab('quantum');
              playLabSound('click');
            }}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeOpticsSubTab === 'quantum'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>{t('04. الظاهرة الكهروضوئية ونموذج بور', '04. Photoelectric & Bohr Atom')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 01. LENSES & RAY OPTICS SIMULATION VIEW */}
      {/* ============================================================== */}
      {activeOpticsSubTab === 'lenses' && (
        <div className="w-full flex flex-col gap-4">
          <div className={`p-2 rounded-2xl border flex items-center justify-between gap-2 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOpticsSubCategory('lenses');
                  playLabSound('click');
                }}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  opticsSubCategory === 'lenses'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('العدسات الكروية (محدبة ومقعرة)', 'Spherical Lenses')}
              </button>
              <button
                onClick={() => {
                  setOpticsSubCategory('mirrors');
                  playLabSound('click');
                }}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  opticsSubCategory === 'mirrors'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('المرايا الكروية (مقعرة ومحدبة)', 'Spherical Mirrors')}
              </button>
            </div>
          </div>

          {opticsSubCategory === 'mirrors' ? (
            <SphericalMirrorsSimulator />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 tablet-sim-grid">
          <div className="lg:col-span-8 min-w-0 flex flex-col gap-3 tablet-sim-stage">
            <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className="font-bold flex items-center gap-2 text-cyan-500">
                  <Move className="w-4 h-4 shrink-0" />
                  <span>{t('حركة تفاعلية حرة: اسحب الجسم، البؤرة F، أو المنقلة الافتراضية 📐 بحرية كاملة!', 'Free 2D Dragging: Drag object, focus F, or virtual protractor 📐 freely!')}</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setShowProtractorLens(prev => !prev);
                      playLabSound('click');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      showProtractorLens
                        ? isDark
                          ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-cyan-50 border border-cyan-500 text-cyan-700 shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{showProtractorLens ? t('المنقلة 📐: مفعلة', 'Protractor 📐: ON') : t('المنقلة 📐: معطلة', 'Protractor 📐: OFF')}</span>
                  </button>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}
                  >
                    1/f = 1/do + 1/di
                  </span>
                </div>
              </div>

              <canvas
                ref={lensCanvasRef}
                width={780}
                height={380}
                onMouseDown={e => handleLensStart(e.clientX, e.clientY)}
                onMouseMove={e => handleLensMove(e.clientX, e.clientY)}
                onMouseUp={() => setDragModeLens('none')}
                onMouseLeave={() => setDragModeLens('none')}
                onTouchStart={e => e.touches[0] && handleLensStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={e => e.touches[0] && handleLensMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={() => setDragModeLens('none')}
                className="w-full aspect-[780/380] h-auto max-h-[420px] block cursor-grab active:cursor-grabbing select-none touch-none"
              />
            </div>

            {/* Scientific HUD Stats */}
            <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col gap-0.5">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('بعد الجسم do:', 'Object Distance do:')}</span>
                <span className="font-mono font-bold text-sm text-cyan-500">{Math.round(doVal)} px</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('بعد الصورة di:', 'Image Distance di:')}</span>
                <span className="font-mono font-bold text-sm text-indigo-500">
                  {isImageAtInfinity ? '∞ (لانهاية)' : `${Math.round(diVal)} px`}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('معامل التكبير m:', 'Magnification m:')}</span>
                <span className="font-mono font-bold text-sm text-amber-500">
                  {isImageAtInfinity ? '∞' : magnification.toFixed(2)}x
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('حالة وصفات الصورة:', 'Image Attributes:')}</span>
                <span className="font-bold text-xs text-emerald-500 truncate">
                  {isImageAtInfinity
                    ? t('لا تتكون صورة (متوازية)', 'No Image (Parallel)')
                    : `${isImageReal ? t('حقيقية', 'Real') : t('خيالية', 'Virtual')}, ${isImageUpright ? t('معتدلة', 'Upright') : t('مقلوبة', 'Inverted')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Deck */}
          <div className="lg:col-span-4 min-w-0 flex flex-col gap-4 tablet-sim-controls">
            <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="font-bold text-sm text-cyan-500 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>{t('إعدادات العدسة والجسم', 'Lens & Object Setup')}</span>
              </h4>

              {/* Lens Type */}
              <div className="flex flex-col gap-1.5">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('نوع العدسة الكروية:', 'Lens Type:')}</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setLensType('convex');
                      playLabSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      lensType === 'convex'
                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                        : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🔍 {t('محدبة (مجمعة)', 'Convex (Converging)')}
                  </button>
                  <button
                    onClick={() => {
                      setLensType('concave');
                      playLabSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      lensType === 'concave'
                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                        : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🔭 {t('مقعرة (مفرقة)', 'Concave (Diverging)')}
                  </button>
                </div>
              </div>

              {/* Object Visual Type */}
              <div className="flex flex-col gap-1.5">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('نوع المصدر الضوئي / الجسم:', 'Light Source / Object Type:')}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setObjectVisual('lamp')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      objectVisual === 'lamp'
                        ? isDark ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-amber-100 border-amber-400 text-amber-800'
                        : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    💡 {t('مصباح', 'Lamp')}
                  </button>
                  <button
                    onClick={() => setObjectVisual('candle')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      objectVisual === 'candle'
                        ? isDark ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-amber-100 border-amber-400 text-amber-800'
                        : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    🕯️ {t('شمعة', 'Candle')}
                  </button>
                  <button
                    onClick={() => setObjectVisual('arrow')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      objectVisual === 'arrow'
                        ? isDark ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-emerald-100 border-emerald-400 text-emerald-800'
                        : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    ⬆️ {t('سهم', 'Arrow')}
                  </button>
                </div>
              </div>

              {/* Focal Length Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('البعد البؤري f:', 'Focal Length f:')}</span>
                  <span className="font-mono font-bold text-cyan-500">{focalLength} px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={focalLength}
                  onChange={e => setFocalLength(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Object Distance Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('بعد الجسم عن العدسة do:', 'Object Distance do:')}</span>
                  <span className="font-mono font-bold text-emerald-500">{objectDistance} px</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="350"
                  value={objectDistance}
                  onChange={e => setObjectDistance(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Object Height Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('ارتفاع الجسم / الضوء ho:', 'Light / Object Height ho:')}</span>
                  <span className="font-mono font-bold text-amber-500">{objectHeight} px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={objectHeight}
                  onChange={e => setObjectHeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Quick Presets */}
              <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('أوضاع دراسية جاهزة (كتاب الفيزياء):', 'Curriculum Presets:')}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setLensType('convex');
                      setFocalLength(100);
                      setObjectDistance(250);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    do &gt; 2f (مصغرة)
                  </button>
                  <button
                    onClick={() => {
                      setLensType('convex');
                      setFocalLength(100);
                      setObjectDistance(200);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    do = 2f (مساوية)
                  </button>
                  <button
                    onClick={() => {
                      setLensType('convex');
                      setFocalLength(100);
                      setObjectDistance(150);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    2f &gt; do &gt; f (مكبرة)
                  </button>
                  <button
                    onClick={() => {
                      setLensType('convex');
                      setFocalLength(100);
                      setObjectDistance(100);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    do = f (في البؤرة ∞)
                  </button>
                  <button
                    onClick={() => {
                      setLensType('convex');
                      setFocalLength(100);
                      setObjectDistance(60);
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center col-span-2 transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    do &lt; f (مكبرة اليد - خيالية معتدلة)
                  </button>
                </div>
              </div>
            </div>

            {/* Draggable Virtual Protractor Tool Card for Lenses */}
            <div className={`p-4 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-cyan-500 flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>{t('المنقلة البصرية الافتراضية 📐', 'Virtual Protractor Tool 📐')}</span>
                </h4>
                <button
                  onClick={() => {
                    setShowProtractorLens(p => !p);
                    playLabSound('click');
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    showProtractorLens
                      ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-cyan-50 text-cyan-700 border border-cyan-400'
                      : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {showProtractorLens ? t('مفعلة', 'Active') : t('معطلة', 'Disabled')}
                </button>
              </div>

              {showProtractorLens && (
                <>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t(
                      'اسحب المنقلة مباشرة بالماوس أو اللمس فوق سطح العدسة لقياس زوايا السقوط والانكسار تلقائياً، أو استخدم أزرار المحاذاة السريعة:',
                      'Drag the protractor anywhere or snap to ray intersections to automatically measure incidence and refraction angles:'
                    )}
                  </p>

                  {/* Quick Snap Buttons */}
                  <div className="flex flex-col gap-1">
                    <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t('محاذاة تلقائية لنقاط الأشعة والعدسة:', 'Auto-Snap to Optical Points:')}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setLensProtractorPos({ x: 390, y: 190 - objectHeight });
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 font-medium transition-colors ${
                          isDark ? 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300' : 'border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        <Target className="w-3 h-3 text-cyan-500" />
                        <span>{t('شعاع السطح (Ray 1)', 'Surface Ray 1')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setLensProtractorPos({ x: 390, y: 190 });
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 font-medium transition-colors ${
                          isDark ? 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300' : 'border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        <Target className="w-3 h-3 text-cyan-500" />
                        <span>{t('المركز البصري O', 'Optical Center O')}</span>
                      </button>
                      <button
                        onClick={() => {
                          const fDir = lensType === 'convex' ? 1 : -1;
                          setLensProtractorPos({ x: 390 + fDir * focalLength, y: 190 });
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 ${
                          isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{t('البؤرة F₂', 'Focal Point F2')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setLensProtractorPos({ x: 390, y: 190 });
                          setLensProtractorRot(0);
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 ${
                          isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t('إعادة ضبط (0°)', 'Reset (0°)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rotation Slider */}
                  <div className={`flex flex-col gap-1 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('تدوير تدريج المنقلة:', 'Rotate Protractor:')}</span>
                      <span className="font-mono font-bold text-cyan-500">
                        {Math.round((lensProtractorRot * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={Math.round((lensProtractorRot * 180) / Math.PI)}
                      onChange={e => setLensProtractorRot((Number(e.target.value) * Math.PI) / 180)}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* ============================================================== */}
      {/* 02. SNELL'S LAW & REFLECTION/REFRACTION VIEW (SnellsLawSimulator) */}
      {/* ============================================================== */}
      {activeOpticsSubTab === 'refraction' && (
        <SnellsLawSimulator />
      )}

      {/* ============================================================== */}
      {/* 03. REAL DYNAMIC GLASS PRISM DISPERSION VIEW */}
      {/* ============================================================== */}
      {activeOpticsSubTab === 'prism' && (
        <div className="w-full flex flex-col gap-4">
          <div className={`p-2 rounded-2xl border flex items-center justify-between gap-2 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPrismSubCategory('prism');
                  playLabSound('click');
                }}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  prismSubCategory === 'prism'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('المنشور الزجاجي وتشتت الضوء', 'Glass Prism Dispersion')}
              </button>
              <button
                onClick={() => {
                  setPrismSubCategory('young');
                  playLabSound('click');
                }}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  prismSubCategory === 'young'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('تجربة شقي يونغ ومحزوزات الحيود', 'Young Double-Slit & Gratings')}
              </button>
            </div>
          </div>

          {prismSubCategory === 'young' ? (
            <YoungInterferenceSimulator />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 tablet-sim-grid">
          <div className="lg:col-span-8 min-w-0 flex flex-col gap-3 tablet-sim-stage">
            <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className="font-bold flex items-center gap-2 text-indigo-500">
                  <Move className="w-4 h-4 shrink-0" />
                  <span>{t('حرية حركة كاملة: اسحب الكشاف، دائرة التوجيه، شاشة الاستقبال ⇔، أو المنقلة الافتراضية 📐!', 'Full Freedom: Drag torch, aim ring, reception screen ⇔, or virtual protractor 📐!')}</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setShowHitGlow(prev => !prev);
                      playLabSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      showHitGlow
                        ? isDark ? 'bg-amber-500/20 border border-amber-400 text-amber-300 shadow-sm' : 'bg-amber-50 border border-amber-400 text-amber-700 shadow-sm'
                        : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{showHitGlow ? t('توهج التركيز ✨', 'Focus Glow ✨') : t('توهج: معطل', 'Glow: OFF')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setPrismProtractorPos({ x: 90, y: 75 });
                      setPrismProtractorRot(0);
                      playLabSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      isDark ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                    title={t('إبعاد وركن المنقلة في زاوية المختبر بعيداً عن المنشور', 'Park protractor away in corner')}
                  >
                    <span>🅿️</span>
                    <span>{t('ركن المنقلة', 'Park Away')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProtractorPrism(prev => !prev);
                      playLabSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      showProtractorPrism
                        ? isDark ? 'bg-indigo-500/20 border border-indigo-400 text-indigo-300 shadow-sm' : 'bg-indigo-50 border border-indigo-400 text-indigo-700 shadow-sm'
                        : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{showProtractorPrism ? t('المنقلة 📐: مفعلة', 'Protractor 📐: ON') : t('المنقلة 📐: معطلة', 'Protractor 📐: OFF')}</span>
                  </button>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                    isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    n_violet &gt; n_red
                  </span>
                </div>
              </div>

              <canvas
                ref={prismCanvasRef}
                width={780}
                height={380}
                onMouseDown={e => handlePrismStart(e.clientX, e.clientY)}
                onMouseMove={e => handlePrismMove(e.clientX, e.clientY)}
                onMouseUp={() => setDragModePrism('none')}
                onMouseLeave={() => setDragModePrism('none')}
                onTouchStart={e => e.touches[0] && handlePrismStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={e => e.touches[0] && handlePrismMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={() => setDragModePrism('none')}
                className="w-full aspect-[780/380] h-auto max-h-[420px] block cursor-grab active:cursor-grabbing select-none touch-none"
              />
            </div>

            {/* Explanation Note */}
            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
              isDark ? 'border-indigo-500/30 bg-indigo-950/20 text-slate-300' : 'border-indigo-200 bg-indigo-50/70 text-slate-700'
            }`}>
              <span className="font-bold text-indigo-500 block mb-0.5">
                {t('لماذا يتشتت الضوء الأبيض داخل المنشور الزجاجي؟', 'Why Does White Light Disperse in a Glass Prism?')}
              </span>
              <p>
                {t(
                  'لأن معامل انكسار الزجاج يعتمد عكسياً على الطول الموجي للضوء (معادلة كوشي n(λ)). ينكسر الضوء البنفسجي الأقصر طولاً موجياً (400 nm) بزاوية أكبر وينحرف أكثر من الضوء الأحمر الأطول طولاً موجياً (700 nm)، مما يفصل حزمة الضوء الأبيض إلى ألوان الطيف السبعة لقوس قزح على الشاشة المقابلة!',
                  'Glass refractive index depends inversely on wavelength. Shorter wavelength violet light (400 nm) bends more sharply than longer wavelength red light (700 nm), separating composite white beam into the 7 visible rainbow spectrum bands!'
                )}
              </p>
            </div>
          </div>

          {/* Control Deck */}
          <div className="lg:col-span-4 min-w-0 flex flex-col gap-4 tablet-sim-controls">
            <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="font-bold text-sm text-indigo-500 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>{t('إعدادات المنشور ومصدر الضوء', 'Prism & Beam Controls')}</span>
              </h4>

              {/* Light Beam Mode Toggle */}
              <div className="flex flex-col gap-1.5">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('نوع الحزمة الضوئية:', 'Beam Mode:')}</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setPrismLightMode('white');
                      playLabSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      prismLightMode === 'white'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🌈 {t('ضوء أبيض مركب', 'White Light')}
                  </button>
                  <button
                    onClick={() => {
                      setPrismLightMode('laser');
                      playLabSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      prismLightMode === 'laser'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ {t('ليزر أحادي اللون', 'Single Laser')}
                  </button>
                </div>
              </div>

              {/* Laser Wavelength if Monochromatic */}
              {prismLightMode === 'laser' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('الطول الموجي لليزر λ:', 'Laser Wavelength λ:')}</span>
                    <span className="font-mono font-bold" style={{ color: wavelengthToColor(prismsLaserNm) }}>
                      {prismsLaserNm} nm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="380"
                    max="750"
                    value={prismsLaserNm}
                    onChange={e => setPrismsLaserNm(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Interactive Surface Glow Setting */}
              <div className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs ${
                isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-300 bg-amber-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className={`font-bold block leading-tight ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      {t('توهج تركيز الضوء عند السطح ✨', 'Surface Concentration Glow ✨')}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('دلالة بصرية لكثافة تدفق الضوء والنبض الإشعاعي', 'Visual indicator of radiant flux density')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHitGlow(p => !p);
                    playLabSound('click');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                    showHitGlow
                      ? 'bg-amber-500 text-slate-900 shadow-sm shadow-amber-500/30'
                      : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {showHitGlow ? t('مفعّل', 'ON') : t('معطّل', 'OFF')}
                </button>
              </div>

              {/* Glass Prism Material Type */}
              <div className="flex flex-col gap-1.5">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('مادة زجاج المنشور:', 'Prism Glass Material:')}</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setPrismType('flint');
                      playLabSound('click');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                      prismType === 'flint'
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {t('زجاج صواني (تشتت عالي)', 'Flint (High Dispersion)')}
                  </button>
                  <button
                    onClick={() => {
                      setPrismType('crown');
                      playLabSound('click');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                      prismType === 'crown'
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {t('زجاج كراون (تشتت قياسي)', 'Crown (Standard)')}
                  </button>
                </div>
              </div>

              {/* Flashlight Height Slider (Y) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('ارتفاع الكشاف الرأسي Y:', 'Torch Vertical Y:')}</span>
                  <span className="font-mono font-bold text-indigo-500">{Math.round(prismSourcePos.y)} px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="330"
                  value={prismSourcePos.y}
                  onChange={e => {
                    const newY = Number(e.target.value);
                    const dy = newY - prismSourcePos.y;
                    setPrismSourcePos(prev => ({ ...prev, y: newY }));
                    setPrismAimPos(prev => ({ ...prev, y: prev.y + dy }));
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Aim Target Height Slider (Aim Y) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('ارتفاع نقطة التوجيه:', 'Aim Target Y:')}</span>
                  <span className="font-mono font-bold text-amber-500">{Math.round(prismAimPos.y)} px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="330"
                  value={prismAimPos.y}
                  onChange={e => setPrismAimPos(prev => ({ ...prev, y: Number(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Projection Screen Position Slider (X) */}
              <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border ${
                isDark ? 'border-indigo-500/30 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/70'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                    <span>⇔</span>
                    <span>{t('موضع شاشة الاستقبال (قابلة للسحب):', 'Screen Position X (Draggable):')}</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-500">{prismScreenX} px</span>
                </div>
                <input
                  type="range"
                  min="480"
                  max="740"
                  value={prismScreenX}
                  onChange={e => setPrismScreenX(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{t('قريبة (480px)', 'Close (480px)')}</span>
                  <span>{t('قياسية (600px)', 'Standard (600px)')}</span>
                  <span>{t('بعيدة (740px)', 'Far (740px)')}</span>
                </div>
              </div>

              {/* Quick Aim Buttons */}
              <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('أوضاع توجيه وحالات كتاب الفيزياء:', 'Physics Presets:')}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setPrismSourcePos({ x: 120, y: 190 });
                      setPrismAimPos({ x: 340, y: 220 });
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    🌈 {t('تشتت كامل قياسي', 'Standard Dispersion')}
                  </button>
                  <button
                    onClick={() => {
                      setPrismSourcePos({ x: 120, y: 120 });
                      setPrismAimPos({ x: 345, y: 160 });
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    🏔️ {t('قرب قمة المنشور', 'Near Apex')}
                  </button>
                  <button
                    onClick={() => {
                      setPrismSourcePos({ x: 140, y: 165 });
                      setPrismAimPos({ x: 330, y: 165 });
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    📐 {t('سقوط أفقي مستقيم', 'Horizontal Beam')}
                  </button>
                  <button
                    onClick={() => {
                      setPrismSourcePos({ x: 170, y: 95 });
                      setPrismAimPos({ x: 330, y: 150 });
                      playLabSound('click');
                    }}
                    className={`p-1.5 rounded-lg border text-[11px] text-center transition-colors ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    🔄 {t('انعكاس داخلي (TIR)', 'Total Internal Refl.')}
                  </button>
                </div>
              </div>
            </div>

            {/* Draggable Virtual Protractor Tool Card for Prism */}
            <div className={`p-4 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-indigo-500 flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>{t('المنقلة البصرية الافتراضية 📐', 'Virtual Protractor Tool 📐')}</span>
                </h4>
                <button
                  onClick={() => {
                    setShowProtractorPrism(p => !p);
                    playLabSound('click');
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    showProtractorPrism
                      ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-400'
                      : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {showProtractorPrism ? t('مفعلة', 'Active') : t('معطلة', 'Disabled')}
                </button>
              </div>

              {showProtractorPrism && (
                <>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t(
                      'اسحب المنقلة وضعها عند نقطة السقوط الأولى أو نقطة خروج الطيف لقراءة زوايا السقوط والانكسار تلقائياً والتحقق من قانون سنل، أو استخدم المحاذاة التلقائية:',
                      'Drag protractor near ray entrance or exit surface to automatically measure angles θ₁ & θ₂ and verify Snell’s law live:'
                    )}
                  </p>

                  {/* Quick Snap & Parking Buttons */}
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t('محاذاة المنقلة أو ركنها بعيداً عن المنشور:', 'Snap or Park Away from Prism:')}
                    </span>
                    <button
                      onClick={() => {
                        setPrismProtractorPos({ x: 90, y: 75 });
                        setPrismProtractorRot(0);
                        playLabSound('click');
                      }}
                      className={`p-2 rounded-xl border text-[11px] flex items-center justify-center gap-1.5 font-bold transition-all shadow-sm ${
                        isDark
                          ? 'border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300'
                          : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <span>🅿️</span>
                      <span>{t('ركن المنقلة بعيداً في زاوية المختبر (إبعادها)', 'Park Protractor Away in Corner')}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setPrismProtractorPos({ x: 318, y: 195 });
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 font-medium transition-colors ${
                          isDark ? 'border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-300' : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        <Target className="w-3 h-3 text-indigo-500" />
                        <span>{t('نقطة السقوط 🎯', 'Entrance Hit 🎯')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrismProtractorPos({ x: 450, y: 225 });
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 font-medium transition-colors ${
                          isDark ? 'border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-300' : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        <Target className="w-3 h-3 text-indigo-500" />
                        <span>{t('نقطة الخروج 🌈', 'Exit Dispersion 🌈')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrismProtractorPos({ x: 390, y: 88 });
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 ${
                          isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{t('قمة المنشور A', 'Prism Apex A')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrismProtractorPos({ x: 90, y: 75 });
                          setPrismProtractorRot(0);
                          playLabSound('click');
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 ${
                          isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t('إعادة ضبط للزاوية', 'Reset to Corner')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rotation Slider */}
                  <div className={`flex flex-col gap-1 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('تدوير تدريج المنقلة:', 'Rotate Protractor:')}</span>
                      <span className="font-mono font-bold text-indigo-500">
                        {Math.round((prismProtractorRot * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={Math.round((prismProtractorRot * 180) / Math.PI)}
                      onChange={e => setPrismProtractorRot((Number(e.target.value) * Math.PI) / 180)}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* ============================================================== */}
      {/* 04. PHOTOELECTRIC EFFECT & QUANTUM SPECTRA VIEW */}
      {/* ============================================================== */}
      {activeOpticsSubTab === 'quantum' && (
        <div className="flex flex-col gap-5">
          {/* Sub Mode Toggle (Photoelectric Tube vs Bohr Atom vs Emission Spectra) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setQuantumSubMode('photoelectric');
                playLabSound('click');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
                quantumSubMode === 'photoelectric'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{t('الظاهرة الكهروضوئية', 'Photoelectric Cell')}</span>
            </button>
            <button
              onClick={() => {
                setQuantumSubMode('bohr');
                playLabSound('click');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
                quantumSubMode === 'bohr'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('نموذج بور الذري وسلاسل الطيف', 'Bohr Atom & Spectra')}</span>
            </button>
            <button
              onClick={() => {
                setQuantumSubMode('spectra');
                playLabSound('click');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
                quantumSubMode === 'spectra'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Waves className="w-4 h-4" />
              <span>{t('مطياف الانبعاث والتفريغ (الأطياف)', 'Emission Spectrometer & Spectra')}</span>
            </button>
          </div>

          {quantumSubMode === 'bohr' ? (
            <BohrAtomSimulator />
          ) : quantumSubMode === 'photoelectric' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 tablet-sim-grid">
              <div className="lg:col-span-8 min-w-0 flex flex-col gap-3 tablet-sim-stage">
                <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <span className="font-bold flex items-center gap-2 text-purple-500">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>{t('أنبوبة التفريغ الكهروضوئية: تحرير الإلكترونات بفوتونات الضوء (معادلة أينشتاين)', 'Photoelectric Cell: Light Quanta liberating electrons')}</span>
                    </span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      E = h·f = Φ + K_max
                    </span>
                  </div>

                  <canvas
                    ref={photoCanvasRef}
                    width={780}
                    height={380}
                    className="w-full aspect-[780/380] h-auto max-h-[420px] block select-none"
                  />
                </div>

                {/* Photoelectric Stats HUD */}
                <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('طاقة الفوتون E:', 'Photon Energy E:')}</span>
                    <span className="font-mono font-bold text-sm text-cyan-500">{photonEnergyEV.toFixed(2)} eV</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('دالة الشغل للفلز Φ:', 'Work Function Φ:')}</span>
                    <span className="font-mono font-bold text-sm text-amber-500">{workFunctionEV.toFixed(2)} eV</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('أقصى طاقة حركية K_max:', 'Max Kinetic K_max:')}</span>
                    <span className="font-mono font-bold text-sm text-emerald-500">{maxKineticEnergyEV.toFixed(2)} eV</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('جهد الإيقاف V_stop:', 'Stopping Potential:')}</span>
                    <span className="font-mono font-bold text-sm text-rose-500">{stoppingPotentialV.toFixed(2)} V</span>
                  </div>
                </div>
              </div>

              {/* Photoelectric Controls */}
              <div className="lg:col-span-4 min-w-0 flex flex-col gap-4 tablet-sim-controls">
                <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="font-bold text-sm text-purple-500 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>{t('عناصر التجربة والتحكم', 'Photoelectric Parameters')}</span>
                  </h4>

                  {/* Metal Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('فلز المهبط (Cathode Metal):', 'Cathode Metal:')}</span>
                    <select
                      value={selectedMetalId}
                      onChange={e => {
                        setSelectedMetalId(e.target.value);
                        playLabSound('click');
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      {METALS.map(m => (
                        <option key={m.id} value={m.id}>
                          {isAr ? m.nameAr : m.nameEn} (Φ = {m.workFunctionEV} eV)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Wavelength Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('الطول الموجي للضوء الساقط λ:', 'Incident Light λ:')}</span>
                      <span className="font-mono font-bold" style={{ color: wavelengthToColor(wavelengthNm) }}>
                        {wavelengthNm} nm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="750"
                      value={wavelengthNm}
                      onChange={e => setWavelengthNm(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Intensity Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('شدة الإضاءة (معدل الفوتونات):', 'Light Intensity:')}</span>
                      <span className="font-mono font-bold text-amber-500">{intensityPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={intensityPercent}
                      onChange={e => setIntensityPercent(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Voltage Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('جهد البطارية المطبق V:', 'Battery Potential V:')}</span>
                      <span className="font-mono font-bold text-cyan-500">{appliedVoltage > 0 ? `+${appliedVoltage}` : appliedVoltage} V</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={appliedVoltage}
                      onChange={e => setAppliedVoltage(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <SpectrometerDischargeModule />
          )}
        </div>
      )}
    </div>
  );
};
