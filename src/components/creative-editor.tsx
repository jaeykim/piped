"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Type, Sun, Contrast, X, RotateCcw, Eye, EyeOff, GripVertical, Check } from "lucide-react";

export interface CreativeEditorData {
  baseImage: string;
  hookText: string;
  subheadline?: string;
  cta?: string;
  productName: string;
  brandColor: string;
  size: string;
  isComplete?: boolean; // graphic card — text already baked in
}

interface TextLayer {
  id: string;
  label: string;
  text: string;
  visible: boolean;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // percentage of default
  color: string;
  fontFamily: string;
  shadow: boolean;
}

const FONT_OPTIONS = [
  { label: "기본 (Sans)", value: "Helvetica Neue, Helvetica, Arial, sans-serif" },
  { label: "둥근 (Rounded)", value: "system-ui, -apple-system, sans-serif" },
  { label: "모노 (Mono)", value: "SF Mono, Menlo, monospace" },
  { label: "세리프 (Serif)", value: "Georgia, Times New Roman, serif" },
];

const COLOR_PRESETS = ["#FFFFFF", "#000000", "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6", "#AF52DE", "#FF2D55"];

interface Props {
  data: CreativeEditorData;
  onClose: () => void;
  onSave?: (dataUrl: string) => void;
}

// Smart Korean word wrap
function smartWrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  const cjk = /[\u3000-\u9fff\uac00-\ud7af]/;
  for (const para of text.split("\n")) {
    if (!para.trim()) { result.push(""); continue; }
    if (cjk.test(para)) {
      const words = para.split(" ");
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && cur) { result.push(cur); cur = word; }
        else cur = test;
      }
      // If a single word is too long, break by character
      if (cur && ctx.measureText(cur).width > maxWidth) {
        let charCur = "";
        for (const ch of cur) {
          if (ctx.measureText(charCur + ch).width > maxWidth && charCur) { result.push(charCur); charCur = ch; }
          else charCur += ch;
        }
        if (charCur) result.push(charCur);
      } else if (cur) {
        result.push(cur);
      }
    } else {
      let cur = "";
      for (const word of para.split(" ")) {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && cur) { result.push(cur); cur = word; }
        else cur = test;
      }
      if (cur) result.push(cur);
    }
  }
  return result;
}

export function CreativeEditor({ data, onClose, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [overlayImg, setOverlayImg] = useState<HTMLImageElement | null>(null);
  const [overlayPos, setOverlayPos] = useState({ x: 60, y: 55, size: 35 }); // percentage
  const [draggingLayer, setDraggingLayer] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [overlayOpacity, setOverlayOpacity] = useState(data.isComplete ? 0 : 40);

  // Text layers — hidden by default for graphic cards (text already baked in)
  const showText = !data.isComplete;
  const defaultFont = FONT_OPTIONS[0].value;
  const [layers, setLayers] = useState<TextLayer[]>([
    { id: "headline", label: "헤드라인", text: data.hookText, visible: showText, x: 7, y: 5, fontSize: 100, color: "#FFFFFF", fontFamily: defaultFont, shadow: true },
    { id: "sub", label: "서브 텍스트", text: data.subheadline || "", visible: showText && !!(data.subheadline), x: 7, y: 40, fontSize: 100, color: "rgba(255,255,255,0.85)", fontFamily: defaultFont, shadow: true },
    { id: "cta", label: "CTA 버튼", text: data.cta || "", visible: showText && !!(data.cta), x: 30, y: 85, fontSize: 100, color: "#FFFFFF", fontFamily: defaultFont, shadow: true },
    { id: "brand", label: "브랜드", text: data.productName, visible: showText, x: 7, y: 92, fontSize: 100, color: "rgba(255,255,255,0.7)", fontFamily: defaultFont, shadow: false },
  ]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBaseImg(img);
    img.src = data.baseImage;
  }, [data.baseImage]);

  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;

    const [w, h] = data.size.split("x").map(Number);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Base image
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(baseImg, 0, 0, w, h);
    ctx.filter = "none";

    // Gradient overlay for readability
    const opacity = overlayOpacity / 100;
    if (opacity > 0) {
      const topG = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      topG.addColorStop(0, `rgba(0,0,0,${opacity * 0.7})`);
      topG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topG;
      ctx.fillRect(0, 0, w, h * 0.5);

      const botG = ctx.createLinearGradient(0, h * 0.5, 0, h);
      botG.addColorStop(0, "rgba(0,0,0,0)");
      botG.addColorStop(1, `rgba(0,0,0,${opacity * 0.5})`);
      ctx.fillStyle = botG;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
    }

    // Render overlay image if present
    if (overlayImg) {
      const oSize = (overlayPos.size / 100) * w;
      const oX = (overlayPos.x / 100) * w;
      const oY = (overlayPos.y / 100) * h;
      const aspect = overlayImg.height / overlayImg.width;
      ctx.drawImage(overlayImg, oX, oY, oSize, oSize * aspect);
    }

    // Render each visible layer
    for (const layer of layers) {
      if (!layer.visible || !layer.text.trim()) continue;

      const lx = (layer.x / 100) * w;
      const ly = (layer.y / 100) * h;
      const font = layer.fontFamily;

      const applyShadow = (blur: number, offsetY: number, opacity: number) => {
        if (layer.shadow) {
          ctx.shadowColor = `rgba(0,0,0,${opacity})`;
          ctx.shadowBlur = blur;
          ctx.shadowOffsetY = offsetY;
        }
      };
      const clearShadow = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

      if (layer.id === "headline") {
        const fs = Math.round(w * 0.065 * (layer.fontSize / 100));
        ctx.font = `900 ${fs}px ${font}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const maxW = w - lx - w * 0.07;

        let actualFs = fs;
        let lines: string[] = [];
        for (let i = 0; i < 6; i++) {
          ctx.font = `900 ${actualFs}px ${font}`;
          lines = smartWrap(ctx, layer.text, maxW);
          if (lines.length <= 4) break;
          actualFs = Math.round(actualFs * 0.88);
        }
        ctx.font = `900 ${actualFs}px ${font}`;

        lines.forEach((line, i) => {
          applyShadow(12, 2, 0.7);
          ctx.fillStyle = layer.color;
          ctx.fillText(line, lx, ly + i * (actualFs * 1.15));
        });
        clearShadow();

      } else if (layer.id === "sub") {
        const fs = Math.round(w * 0.032 * (layer.fontSize / 100));
        ctx.font = `500 ${fs}px ${font}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const lines = smartWrap(ctx, layer.text, w - lx - w * 0.07);
        lines.slice(0, 3).forEach((line, i) => {
          applyShadow(6, 1, 0.4);
          ctx.fillStyle = layer.color;
          ctx.fillText(line, lx, ly + i * (fs * 1.3));
        });
        clearShadow();

      } else if (layer.id === "cta") {
        const fs = Math.round(w * 0.028 * (layer.fontSize / 100));
        ctx.font = `700 ${fs}px ${font}`;
        const tw = ctx.measureText(layer.text).width + fs * 3;
        const th = fs * 2.6;

        ctx.fillStyle = data.brandColor;
        applyShadow(8, 3, 0.25);
        ctx.beginPath();
        ctx.roundRect(lx, ly, tw, th, th / 2);
        ctx.fill();
        clearShadow();

        ctx.fillStyle = layer.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(layer.text, lx + tw / 2, ly + th / 2);

      } else if (layer.id === "brand") {
        const fs = Math.round(w * 0.02 * (layer.fontSize / 100));
        ctx.font = `600 ${fs}px ${font}`;
        const bw = ctx.measureText(layer.text).width + 16;
        const bh = fs * 2;

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.roundRect(lx, ly, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle = layer.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(layer.text, lx + 8, ly + bh / 2);
      }
    }
  }, [baseImg, overlayImg, overlayPos, layers, brightness, contrast, saturation, overlayOpacity, data]);

  useEffect(() => { render(); }, [render]);

  // Drag handling
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const [w, h] = data.size.split("x").map(Number);
    const scaleX = w / rect.width;
    const scaleY = h / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Find which layer was clicked (reverse order = top layer first)
    const mxPct = (mx / w) * 100;
    const myPct = (my / h) * 100;

    // Check overlay image first
    if (overlayImg) {
      const oSize = (overlayPos.size / 100) * w;
      const oX = (overlayPos.x / 100) * w;
      const oY = (overlayPos.y / 100) * h;
      const aspect = overlayImg.height / overlayImg.width;
      if (mx >= oX && mx <= oX + oSize && my >= oY && my <= oY + oSize * aspect) {
        dragOffsetRef.current = { dx: mxPct - overlayPos.x, dy: myPct - overlayPos.y };
        setDraggingLayer("__overlay__");
        return;
      }
    }

    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (!l.visible) continue;
      const lx = (l.x / 100) * w;
      const ly = (l.y / 100) * h;
      const hitW = w * 0.6;
      const hitH = w * 0.12;
      if (mx >= lx - 10 && mx <= lx + hitW && my >= ly - 10 && my <= ly + hitH) {
        dragOffsetRef.current = { dx: mxPct - l.x, dy: myPct - l.y };
        setDraggingLayer(l.id);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingLayer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const newX = px - dragOffsetRef.current.dx;
    const newY = py - dragOffsetRef.current.dy;
    if (draggingLayer === "__overlay__") {
      setOverlayPos((prev) => ({ ...prev, x: Math.max(0, Math.min(90, newX)), y: Math.max(0, Math.min(90, newY)) }));
    } else {
      updateLayer(draggingLayer, { x: Math.max(0, Math.min(90, newX)), y: Math.max(0, Math.min(95, newY)) });
    }
  };

  const handleCanvasMouseUp = () => { setDraggingLayer(null); };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `piped-${data.size}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => {
    setLayers([
      { id: "headline", label: "헤드라인", text: data.hookText, visible: showText, x: 7, y: 5, fontSize: 100, color: "#FFFFFF", fontFamily: defaultFont, shadow: true },
      { id: "sub", label: "서브 텍스트", text: data.subheadline || "", visible: showText && !!(data.subheadline), x: 7, y: 40, fontSize: 100, color: "rgba(255,255,255,0.85)", fontFamily: defaultFont, shadow: true },
      { id: "cta", label: "CTA 버튼", text: data.cta || "", visible: showText && !!(data.cta), x: 30, y: 85, fontSize: 100, color: "#FFFFFF", fontFamily: defaultFont, shadow: true },
      { id: "brand", label: "브랜드", text: data.productName, visible: showText, x: 7, y: 92, fontSize: 100, color: "rgba(255,255,255,0.7)", fontFamily: defaultFont, shadow: false },
    ]);
    setBrightness(100); setContrast(100); setSaturation(100); setOverlayOpacity(40);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
      {/* Sidebar */}
      <div className="w-80 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">편집</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-400">캔버스에서 텍스트를 드래그하여 위치를 조절하세요</p>

        {/* Text Layers */}
        <div className="mt-4 space-y-3">
          {layers.map((layer) => (
            <div key={layer.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                  <span className="text-xs font-semibold text-gray-700">{layer.label}</span>
                </div>
                <button
                  onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                  className={`rounded p-1 ${layer.visible ? "text-indigo-600" : "text-gray-300"}`}
                >
                  {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
              {layer.visible && (
                <div className="mt-2 space-y-2">
                  {layer.id === "headline" ? (
                    <textarea
                      value={layer.text}
                      onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none"
                      rows={2}
                    />
                  ) : (
                    <input
                      value={layer.text}
                      onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none"
                    />
                  )}
                  {/* Font size */}
                  <div className="flex items-center gap-2">
                    <Type className="h-3 w-3 text-gray-400" />
                    <input
                      type="range" min={50} max={150} value={layer.fontSize}
                      onChange={(e) => updateLayer(layer.id, { fontSize: Number(e.target.value) })}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-[10px] text-gray-400 w-8">{layer.fontSize}%</span>
                  </div>
                  {/* Color presets */}
                  <div className="flex items-center gap-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateLayer(layer.id, { color: c })}
                        className={`h-5 w-5 rounded-full border-2 transition-all ${layer.color === c ? "border-indigo-500 scale-110" : "border-gray-200"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={layer.color.startsWith("#") ? layer.color : "#ffffff"}
                      onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                      className="h-5 w-5 cursor-pointer rounded border-0 p-0"
                    />
                  </div>
                  {/* Font family */}
                  <select
                    value={layer.fontFamily}
                    onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-[10px] text-gray-700 focus:border-indigo-400 focus:outline-none"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  {/* Shadow toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layer.shadow}
                      onChange={(e) => updateLayer(layer.id, { shadow: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-gray-500">그림자</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overlay image */}
        <div className="mt-4 border-t border-gray-100 pt-3">
          <h3 className="text-xs font-medium text-gray-700">이미지 삽입</h3>
          <p className="text-[10px] text-gray-400">이미지를 업로드하면 캔버스에 드래그해서 배치할 수 있습니다</p>
          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              {overlayImg ? "변경" : "업로드"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const img = new window.Image();
                  img.onload = () => setOverlayImg(img);
                  img.src = reader.result as string;
                };
                reader.readAsDataURL(file);
              }} />
            </label>
            {overlayImg && (
              <button onClick={() => setOverlayImg(null)} className="text-xs text-red-500">삭제</button>
            )}
          </div>
          {overlayImg && (
            <div className="mt-2">
              <label className="text-[10px] text-gray-500">크기 {overlayPos.size}%</label>
              <input type="range" min={10} max={80} value={overlayPos.size}
                onChange={(e) => setOverlayPos((p) => ({ ...p, size: Number(e.target.value) }))}
                className="w-full accent-indigo-600" />
            </div>
          )}
        </div>

        {/* Overlay opacity */}
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-700">배경 어둡기 {overlayOpacity}%</label>
          <input type="range" min={0} max={80} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="mt-1 w-full accent-indigo-600" />
        </div>

        {/* Image Adjustments */}
        <div className="mt-4 border-t border-gray-100 pt-3">
          <h3 className="text-xs font-medium text-gray-700">이미지 조정</h3>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="h-3 w-3 text-gray-400" />
              <input type="range" min={50} max={150} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="flex-1 accent-indigo-600" />
              <span className="text-[10px] text-gray-400 w-8">{brightness}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Contrast className="h-3 w-3 text-gray-400" />
              <input type="range" min={50} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="flex-1 accent-indigo-600" />
              <span className="text-[10px] text-gray-400 w-8">{contrast}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">채도</span>
              <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="flex-1 accent-indigo-600" />
              <span className="text-[10px] text-gray-400 w-8">{saturation}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {onSave && (
            <Button onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              onSave(canvas.toDataURL("image/png"));
            }} className="w-full" size="sm">
              <Check className="mr-2 h-4 w-4" /> 적용
            </Button>
          )}
          <Button onClick={handleDownload} className="w-full" size="sm" variant={onSave ? "outline" : "primary"}>
            <Download className="mr-2 h-4 w-4" /> 다운로드
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" /> 초기화
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center bg-gray-900 p-8">
        <canvas
          ref={canvasRef}
          className={`max-h-full max-w-full rounded-lg shadow-2xl ${draggingLayer ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ objectFit: "contain" }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>
    </div>
  );
}
