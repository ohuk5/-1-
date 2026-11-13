import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Sliders,
  Move,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

export const SphericalMirrorsSimulator: React.FC = () => {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const [mirrorType, setMirrorType] = useState<'concave' | 'convex'>('concave');
  const [focalLength, setFocalLength] = useState<number>(100); // px
  const [objectDistance, setObjectDistance] = useState<number>(220); // px (do)
  const [objectHeight, setObjectHeight] = useState<number>(70); // px (ho)
  const [isDragging, setIsDragging] = useState<'none' | 'object' | 'focus'>('none');
  const [showRays, setShowRays] = useState<{ ray1: boolean; ray2: boolean; ray3: boolean }>({
    ray1: true,
    ray2: true,
    ray3: true
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics Calculations: 1/f = 1/do + 1/di
  // Concave mirror: f > 0, Convex mirror: f < 0
  const fSigned = mirrorType === 'concave' ? focalLength : -focalLength;
  const doVal = Math.max(1, objectDistance);
  const isAtFocus = Math.abs(doVal - fSigned) <= 2;
  const diVal = !isAtFocus ? (fSigned * doVal) / (doVal - fSigned) : 999999;
  const magnification = !isAtFocus ? -diVal / doVal : 999999;
  const imageHeight = !isAtFocus ? magnification * objectHeight : 0;
  const isReal = diVal > 0 && !isAtFocus;
  const isVirtual = diVal < 0 && !isAtFocus;
  const isUpright = magnification > 0;
  const radiusOfCurvature = focalLength * 2;

  // Scale-aware coordinates for mouse & touch
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

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(clientX, clientY);
    const mirrorVertexX = 420;
    const objX = mirrorVertexX - doVal;
    const focusX = mirrorType === 'concave' ? mirrorVertexX - focalLength : mirrorVertexX + focalLength;

    if (Math.hypot(x - objX, y - (190 - objectHeight)) < 35 || Math.abs(x - objX) < 20) {
      setIsDragging('object');
    } else if (Math.hypot(x - focusX, y - 190) < 25) {
      setIsDragging('focus');
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isDragging === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(clientX, clientY);
    const mirrorVertexX = 420;

    if (isDragging === 'object') {
      const newDo = Math.max(25, Math.min(370, mirrorVertexX - x));
      setObjectDistance(newDo);
      const newHo = Math.max(20, Math.min(110, 190 - y));
      if (Math.abs(y - 190) > 15) setObjectHeight(newHo);
    } else if (isDragging === 'focus') {
      const newF = Math.max(50, Math.min(160, Math.abs(mirrorVertexX - x)));
      setFocalLength(newF);
    }
  };

  const handlePointerUp = () => {
    setIsDragging('none');
  };

  // Canvas Ray Tracing Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = 190;
    const vertexX = 420; // Mirror Pole / Vertex V

    // Clear
    ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
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

    // Principal Axis (المحور الرئيس)
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Key Optical Cardinal Points
    const fX = mirrorType === 'concave' ? vertexX - focalLength : vertexX + focalLength;
    const cX = mirrorType === 'concave' ? vertexX - radiusOfCurvature : vertexX + radiusOfCurvature;

    // Draw Cardinal Point Markers
    const drawPoint = (px: number, label: string, color: string, isF: boolean = false) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, centerY, isF ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, px, centerY + 18);
    };

    drawPoint(vertexX, t('V (قطب المرآة)', 'V (Mirror Pole)'), '#38bdf8');
    drawPoint(fX, mirrorType === 'concave' ? t('F (البؤرة الحقيقية)', 'F (Real Focus)') : t('F (بؤرة تقديرية)', 'F (Virtual Focus)'), '#a855f7', true);
    drawPoint(cX, mirrorType === 'concave' ? t('C (مركز التكور)', 'C (Center C)') : t('C (مركز تقديري)', 'C (Virtual C)'), '#6366f1');

    // Draw Spherical Mirror Curved Arc with Silvered Backing
    ctx.save();
    const mirrorRadius = 260;
    const arcAngle = 0.55; // radians

    if (mirrorType === 'concave') {
      // Concave: Reflective side faces left (toward object)
      const circleCenterX = vertexX + mirrorRadius;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(circleCenterX, centerY, mirrorRadius, Math.PI - arcAngle, Math.PI + arcAngle);
      ctx.stroke();

      // Back Silvering Hatch marks (خطوط التفضيد على ظهر المرآة)
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1.5;
      for (let a = Math.PI - arcAngle; a <= Math.PI + arcAngle; a += 0.08) {
        const mx = circleCenterX + Math.cos(a) * mirrorRadius;
        const my = centerY + Math.sin(a) * mirrorRadius;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + 8, my - 6);
        ctx.stroke();
      }
    } else {
      // Convex: Reflective side curves bulging toward left
      const circleCenterX = vertexX - mirrorRadius;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(circleCenterX, centerY, mirrorRadius, -arcAngle, arcAngle);
      ctx.stroke();

      // Back Silvering Hatch marks on the concave interior
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1.5;
      for (let a = -arcAngle; a <= arcAngle; a += 0.08) {
        const mx = circleCenterX + Math.cos(a) * mirrorRadius;
        const my = centerY + Math.sin(a) * mirrorRadius;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + 8, my - 6);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Draw Object (Candle with Flame)
    const objX = vertexX - doVal;
    const objTopY = centerY - objectHeight;

    ctx.save();
    // Candle body
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(objX - 6, objTopY, 12, objectHeight);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(objX - 6, objTopY, 12, objectHeight);

    // Candle flame (glowing)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(objX, objTopY - 10, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(objX, objTopY - 8, 3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draggable Handle Halo
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(objX, objTopY - 10, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('الجسم (اسحب)', 'Object (Drag)'), objX, objTopY - 32);
    ctx.restore();

    // ==========================================
    // RAY TRACING FOR SPHERICAL MIRRORS
    // ==========================================
    if (!isAtFocus) {
      const imgX = vertexX - diVal;
      const imgTopY = centerY - imageHeight;

      // 1. Ray 1: Parallel to principal axis reflects through Focus (Red)
      if (showRays.ray1) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(objX, objTopY);
        ctx.lineTo(vertexX, objTopY); // Incident parallel to axis

        if (mirrorType === 'concave') {
          // Reflects through Focus F (fX < vertexX)
          const slope = (centerY - objTopY) / (fX - vertexX);
          const reflectEndX = 0;
          const reflectEndY = objTopY + slope * (reflectEndX - vertexX);
          ctx.lineTo(reflectEndX, reflectEndY);
          ctx.stroke();

          // Virtual backward extension if image is virtual
          if (isVirtual) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(vertexX, objTopY);
            ctx.lineTo(imgX, imgTopY);
            ctx.stroke();
          }
        } else {
          // Convex: Appears to diverge from virtual Focus F behind mirror
          const slope = (objTopY - centerY) / (vertexX - fX);
          const reflectEndX = 0;
          const reflectEndY = objTopY - slope * vertexX;
          ctx.stroke();

          // Reflected real ray diverging away
          ctx.beginPath();
          ctx.moveTo(vertexX, objTopY);
          ctx.lineTo(reflectEndX, reflectEndY);
          ctx.stroke();

          // Dashed virtual ray backwards to F and Image
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(vertexX, objTopY);
          ctx.lineTo(fX, centerY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Ray 2: Focal Ray (Directed toward or through F, reflects parallel) (Cyan)
      if (showRays.ray2) {
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;

        if (mirrorType === 'concave') {
          // Ray from object top through F to mirror surface
          const slope = (centerY - objTopY) / (fX - objX);
          const hitMirrorY = objTopY + slope * (vertexX - objX);
          ctx.beginPath();
          ctx.moveTo(objX, objTopY);
          ctx.lineTo(vertexX, hitMirrorY);
          // Reflects parallel to axis
          ctx.lineTo(0, hitMirrorY);
          ctx.stroke();

          if (isVirtual) {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(vertexX, hitMirrorY);
            ctx.lineTo(imgX, hitMirrorY);
            ctx.stroke();
          }
        } else {
          // Convex: Directed toward virtual F behind mirror
          const slope = (centerY - objTopY) / (fX - objX);
          const hitMirrorY = objTopY + slope * (vertexX - objX);
          ctx.beginPath();
          ctx.moveTo(objX, objTopY);
          ctx.lineTo(vertexX, hitMirrorY);
          // Reflects parallel back to left
          ctx.lineTo(0, hitMirrorY);
          ctx.stroke();

          // Virtual backward parallel ray to image
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(vertexX, hitMirrorY);
          ctx.lineTo(imgX, hitMirrorY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Ray 3: Through Center of Curvature C (Purple)
      if (showRays.ray3) {
        ctx.save();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.8;

        if (mirrorType === 'concave') {
          const slope = (centerY - objTopY) / (cX - objX);
          const hitMirrorY = objTopY + slope * (vertexX - objX);
          ctx.beginPath();
          ctx.moveTo(objX, objTopY);
          ctx.lineTo(vertexX, hitMirrorY);
          ctx.stroke();

          if (isVirtual) {
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(vertexX, hitMirrorY);
            ctx.lineTo(imgX, imgTopY);
            ctx.stroke();
          }
        } else {
          const slope = (centerY - objTopY) / (cX - objX);
          const hitMirrorY = objTopY + slope * (vertexX - objX);
          ctx.beginPath();
          ctx.moveTo(objX, objTopY);
          ctx.lineTo(vertexX, hitMirrorY);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(vertexX, hitMirrorY);
          ctx.lineTo(cX, centerY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Resulting Image (الصورة المتكونة)
      ctx.save();
      const imgColor = isReal ? '#10b981' : '#a855f7';
      ctx.fillStyle = imgColor;
      ctx.globalAlpha = isReal ? 0.9 : 0.65;

      // Image candle body
      ctx.fillRect(imgX - 5, centerY, 10, -imageHeight);
      ctx.strokeStyle = imgColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(imgX - 5, centerY, 10, -imageHeight);

      // Flame
      ctx.beginPath();
      ctx.ellipse(imgX, imgTopY, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = imgColor;
      ctx.fillText(
        isReal ? t('صورة حقيقية', 'Real Image') : t('صورة خيالية', 'Virtual Image'),
        imgX,
        imgTopY + (imageHeight < 0 ? 18 : -14)
      );
      ctx.restore();
    } else {
      // Parallel rays to infinity
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        t('الجسم في البؤرة (do = f) ⟵ تنعكس الأشعة متوازية ولا تتكون صورة (الصورة في اللانهاية ∞)',
          'Object at focal point (do = f) ⟵ Reflected rays are parallel, image at infinity ∞'),
        vertexX - 100,
        centerY - 60
      );
      ctx.restore();
    }
  }, [mirrorType, focalLength, objectDistance, objectHeight, showRays, isDark, doVal, diVal, imageHeight, isAtFocus, isReal, isVirtual, radiusOfCurvature, t]);

  return (
    <div className="w-full flex flex-col gap-5 animate-fadeIn">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}>
            <Eye className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('محاكي المرايا الكروية وقانون التكبير (فيزياء 3 ثانوي)', 'Spherical Mirrors & Magnification Simulator')}
              </h3>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}>
                1/f = 1/do + 1/di | m = -di/do
              </span>
            </div>
            <p className={`text-xs max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('تتبع الأشعة المنعكسة في المرآة المقعرة والمحدبة، مع رصد موقع وصفات الصورة الحقيقية والخيالية وحالات الكتاب المدرسي.',
                 'Ray tracing for concave and convex spherical mirrors with live magnification, real/virtual images, and curriculum cases.')}
            </p>
          </div>
        </div>

        {/* Mirror Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => {
                setMirrorType('concave');
                setObjectDistance(220);
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mirrorType === 'concave'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('مرآة مقعرة (مجمعة)', 'Concave Mirror')}
            </button>
            <button
              onClick={() => {
                setMirrorType('convex');
                setObjectDistance(150);
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mirrorType === 'convex'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('مرآة محدبة (مفرقة)', 'Convex Mirror')}
            </button>
          </div>

          <button
            onClick={() => {
              setFocalLength(100);
              setObjectDistance(220);
              setObjectHeight(70);
              playLabSound('click');
            }}
            className={`p-2 rounded-xl border transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            title={t('إعادة ضبط للقيم المعيارية', 'Reset')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Canvas Section */}
        <div className="lg:col-span-8 min-w-0 flex flex-col gap-3">
          <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between gap-2 flex-wrap text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                <Move className="w-4 h-4" />
                <span>{t('اسحب الجسم أو البؤرة F لتغيير المسافات بدقة ورصد تشكل الصورة فورياً!', 'Drag object or focal point F to manipulate rays instantly!')}</span>
              </span>
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                f = {fSigned > 0 ? `+${focalLength}` : `-${focalLength}`} px | R = 2f = {radiusOfCurvature} px
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

          {/* Scientific HUD Stats */}
          <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('بعد الجسم do:', 'Object Distance do:')}</span>
              <span className="font-mono font-bold text-sm text-cyan-500">{Math.round(doVal)} px</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('بعد الصورة di:', 'Image Distance di:')}</span>
              <span className="font-mono font-bold text-sm text-indigo-500">
                {isAtFocus ? t('∞ (لانهاية)', '∞ (Infinity)') : `${Math.round(diVal)} px`}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('معامل التكبير m:', 'Magnification m:')}</span>
              <span className="font-mono font-bold text-sm text-amber-500">
                {isAtFocus ? '∞' : `${magnification.toFixed(2)}x`}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('صفات الصورة:', 'Image Attributes:')}</span>
              <span className="font-bold text-xs text-emerald-500 truncate">
                {isAtFocus
                  ? t('لا تتكون صورة (متوازية)', 'No Image (Parallel)')
                  : `${isReal ? t('حقيقية', 'Real') : t('خيالية', 'Virtual')}, ${isUpright ? t('معتدلة', 'Upright') : t('مقلوبة', 'Inverted')}`}
              </span>
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
              <span>{t('إعدادات المرآة الكروية والأشعة', 'Mirror & Ray Controls')}</span>
            </h4>

            {/* Object Distance Slider */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>{t('بعد الجسم عن قطب المرآة do:', 'Object Distance do:')}</span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{Math.round(doVal)} px</span>
              </div>
              <input
                type="range"
                min="25"
                max="360"
                value={doVal}
                onChange={e => setObjectDistance(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5"
              />
            </div>

            {/* Focal Length Slider */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>{t('البعد البؤري f (ونصف قطر التكور R = 2f):', 'Focal Length f (R = 2f):')}</span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{focalLength} px</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={focalLength}
                onChange={e => setFocalLength(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5"
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t(`R = ${radiusOfCurvature} px (مركز التكور C)`, `R = ${radiusOfCurvature} px (Center C)`)}
              </span>
            </div>

            {/* Ray Toggles */}
            <div className={`flex items-center justify-between gap-1 p-2 rounded-xl border text-[11px] ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                onClick={() => setShowRays(r => ({ ...r, ray1: !r.ray1 }))}
                className={`px-2 py-1 rounded-lg border font-bold transition-all ${
                  showRays.ray1
                    ? isDark ? 'border-red-500 bg-red-500/20 text-red-300' : 'border-red-400 bg-red-50 text-red-700'
                    : isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}
              >
                {t('الشعاع 1 (الموازي)', 'Ray 1 (Parallel)')}
              </button>
              <button
                onClick={() => setShowRays(r => ({ ...r, ray2: !r.ray2 }))}
                className={`px-2 py-1 rounded-lg border font-bold transition-all ${
                  showRays.ray2
                    ? isDark ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-cyan-400 bg-cyan-50 text-cyan-700'
                    : isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}
              >
                {t('الشعاع 2 (البؤري)', 'Ray 2 (Focal)')}
              </button>
              <button
                onClick={() => setShowRays(r => ({ ...r, ray3: !r.ray3 }))}
                className={`px-2 py-1 rounded-lg border font-bold transition-all ${
                  showRays.ray3
                    ? isDark ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-purple-400 bg-purple-50 text-purple-700'
                    : isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}
              >
                {t('الشعاع 3 (التكور)', 'Ray 3 (Curvature)')}
              </button>
            </div>

            {/* Curriculum Textbook Cases */}
            <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('حالات كتاب الفيزياء 3 المعتمدة للمرايا:', 'Textbook Mirror Cases:')}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setMirrorType('concave');
                    setFocalLength(90);
                    setObjectDistance(240); // do > 2f (240 > 180)
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between gap-2 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('1. مقعرة: الجسم خلف مركز التكور (do > 2f)', '1. Concave: do > 2f')}</span>
                  <span className="font-mono text-emerald-500 font-bold">{t('حقيقية مقلوبة مصغرة', 'Real, Inverted, Smaller')}</span>
                </button>

                <button
                  onClick={() => {
                    setMirrorType('concave');
                    setFocalLength(90);
                    setObjectDistance(180); // do = 2f
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between gap-2 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('2. مقعرة: الجسم عند مركز التكور (do = 2f)', '2. Concave: do = 2f')}</span>
                  <span className="font-mono text-cyan-500 font-bold">{t('حقيقية مقلوبة مساوية', 'Real, Inverted, Same')}</span>
                </button>

                <button
                  onClick={() => {
                    setMirrorType('concave');
                    setFocalLength(90);
                    setObjectDistance(130); // f < do < 2f
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between gap-2 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('3. مقعرة: بين البؤرة والمركز (f < do < 2f)', '3. Concave: f < do < 2f')}</span>
                  <span className="font-mono text-amber-500 font-bold">{t('حقيقية مقلوبة مكبرة', 'Real, Inverted, Larger')}</span>
                </button>

                <button
                  onClick={() => {
                    setMirrorType('concave');
                    setFocalLength(90);
                    setObjectDistance(50); // do < f
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between gap-2 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('4. مقعرة: مرآة حلاقة وتجميل (do < f)', '4. Concave: do < f (Makeup)')}</span>
                  <span className="font-mono text-purple-500 font-bold">{t('خيالية معتدلة مكبرة', 'Virtual, Upright, Larger')}</span>
                </button>

                <button
                  onClick={() => {
                    setMirrorType('convex');
                    setFocalLength(90);
                    setObjectDistance(160);
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between gap-2 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('5. محدبة: مرآة السيارة الجانبية (Convex)', '5. Convex: Car side mirror')}</span>
                  <span className="font-mono text-indigo-500 font-bold">{t('خيالية معتدلة مصغرة دائماً', 'Always Virtual, Upright')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
