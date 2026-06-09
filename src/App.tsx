import { useEffect, useRef, useState } from "react";
import { POINTS_OF_INTEREST, PointOfInterest } from "./points";
import { MandelbrotRenderer } from "./webgl-renderer";
import { easeInOutCubic } from "./webgl-utils";
import { Film, Compass, Globe, Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Timing parameters (in seconds)
const SCENE_DURATION = 20.0;
const ZOOM_IN_TIME = 9.0;
const HOLD_TIME = 2.5;
const ZOOM_OUT_TIME = 6.0;
const PAN_TIME = 2.5;

// Interpolate palettes smoothly during PAN state
const interpolatePalette = (
  val1: [number, number, number],
  val2: [number, number, number],
  progress: number
): [number, number, number] => {
  return [
    val1[0] + progress * (val2[0] - val1[0]),
    val1[1] + progress * (val2[1] - val1[1]),
    val1[2] + progress * (val2[2] - val1[2]),
  ];
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<MandelbrotRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Orchestrated UI state refreshed relative to phase transitions
  const [currentPoint, setCurrentPoint] = useState<PointOfInterest>(POINTS_OF_INTEREST[0]);
  const [nextPoint, setNextPoint] = useState<PointOfInterest>(POINTS_OF_INTEREST[1]);
  const [currentPhase, setCurrentPhase] = useState<"ZOOM_IN" | "HOLD" | "ZOOM_OUT" | "PAN">("ZOOM_IN");
  const [currentProgress, setCurrentProgress] = useState<number>(0); // 0 to 1 for current cycle stage
  const [overallTimeProgress, setOverallTimeProgress] = useState<number>(0); // 0 to 1 for total 20s scene

  // Live fluctuating telemetry values for deep technical realism
  const [liveStats, setLiveStats] = useState({
    temp: "42.8°C",
    latency: "2.4ms",
    load: "98.2%",
  });

  // High-frequency telemetry states (updated smoothly for cinematic authenticity)
  const [telemetry, setTelemetry] = useState({
    x: POINTS_OF_INTEREST[0].centerX,
    y: POINTS_OF_INTEREST[0].centerY,
    zoom: 1.5,
    hueShift: 0.0,
    accentColor: "rgb(0, 242, 255)",
    glowColor: "rgba(0, 242, 255, 0.15)",
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL Mandelbrot Renderer
    try {
      rendererRef.current = new MandelbrotRenderer(canvas);
    } catch (err) {
      console.error("Failed to initialize WebGL renderer:", err);
      return;
    }

    // Set up canvas sizing and resize observer
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5 for steady performance
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial sizing call

    // Animation Loop
    const loop = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsedSecs = (timestamp - startTimeRef.current) / 1000.0;
      
      // Calculate cycle coordinates
      const totalPoints = POINTS_OF_INTEREST.length;
      const totalLoopTime = totalPoints * SCENE_DURATION;
      const modTime = elapsedSecs % totalLoopTime;

      const currentIndex = Math.floor(modTime / SCENE_DURATION);
      const nextIndex = (currentIndex + 1) % totalPoints;
      const sceneTime = modTime % SCENE_DURATION;

      const activePoint = POINTS_OF_INTEREST[currentIndex];
      const targetPoint = POINTS_OF_INTEREST[nextIndex];

      // Update basic index states if they've shifted
      if (currentPoint.id !== activePoint.id) {
        setCurrentPoint(activePoint);
        setNextPoint(targetPoint);
      }

      // Calculate state details
      let currentZoom = 1.5;
      let centerX = activePoint.centerX;
      let centerY = activePoint.centerY;
      let phase: "ZOOM_IN" | "HOLD" | "ZOOM_OUT" | "PAN" = "ZOOM_IN";
      let phaseProgress = 0.0;

      // Extract colors for smooth theme mapping
      let paletteA = activePoint.paletteA;
      let paletteB = activePoint.paletteB;
      let paletteC = activePoint.paletteC;
      let paletteD = activePoint.paletteD;

      const cappedMaxZoom = Math.min(activePoint.maxZoom, 20000.0);

      if (sceneTime < ZOOM_IN_TIME) {
        phase = "ZOOM_IN";
        phaseProgress = sceneTime / ZOOM_IN_TIME;
        const eased = easeInOutCubic(phaseProgress);
        currentZoom = Math.exp(Math.log(1.5) + eased * (Math.log(cappedMaxZoom) - Math.log(1.5)));
      } else if (sceneTime < ZOOM_IN_TIME + HOLD_TIME) {
        phase = "HOLD";
        phaseProgress = (sceneTime - ZOOM_IN_TIME) / HOLD_TIME;
        currentZoom = cappedMaxZoom;
      } else if (sceneTime < ZOOM_IN_TIME + HOLD_TIME + ZOOM_OUT_TIME) {
        phase = "ZOOM_OUT";
        phaseProgress = (sceneTime - (ZOOM_IN_TIME + HOLD_TIME)) / ZOOM_OUT_TIME;
        const eased = easeInOutCubic(phaseProgress);
        currentZoom = Math.exp(Math.log(cappedMaxZoom) - eased * (Math.log(cappedMaxZoom) - Math.log(1.5)));
      } else {
        phase = "PAN";
        phaseProgress = (sceneTime - (ZOOM_IN_TIME + HOLD_TIME + ZOOM_OUT_TIME)) / PAN_TIME;
        const eased = easeInOutCubic(phaseProgress);
        currentZoom = 1.5;
        centerX = activePoint.centerX + eased * (targetPoint.centerX - activePoint.centerX);
        centerY = activePoint.centerY + eased * (targetPoint.centerY - activePoint.centerY);

        // Smoothly blend palettes during the pan phase
        paletteA = interpolatePalette(activePoint.paletteA, targetPoint.paletteA, eased);
        paletteB = interpolatePalette(activePoint.paletteB, targetPoint.paletteB, eased);
        paletteC = interpolatePalette(activePoint.paletteC, targetPoint.paletteC, eased);
        paletteD = interpolatePalette(activePoint.paletteD, targetPoint.paletteD, eased);
      }

      // Slowly rolling hue cycle. Completed every 70 seconds.
      const hueShift = (elapsedSecs * 0.014) % 1.0;

      // Generate localized theme colors from interpolated palette offsets (palette A representation)
      // Double checking we clamped colors to standard RGB values 0..255
      const redVal = Math.round(Math.max(0, Math.min(1.0, paletteA[0] * 1.3 + paletteB[0] * 0.2)) * 255);
      const greenVal = Math.round(Math.max(0, Math.min(1.0, paletteA[1] * 1.3 + paletteB[1] * 0.2)) * 255);
      const blueVal = Math.round(Math.max(0, Math.min(1.0, paletteA[2] * 1.3 + paletteB[2] * 0.2)) * 255);

      const dynamicAccentStyle = `rgb(${redVal}, ${greenVal}, ${blueVal})`;
      const dynamicGlowStyle = `rgba(${redVal}, ${greenVal}, ${blueVal}, 0.25)`;

      // Write parameters to renderer
      if (rendererRef.current) {
        rendererRef.current.render({
          width: canvas.width,
          height: canvas.height,
          centerX,
          centerY,
          zoom: currentZoom,
          hueShift,
          paletteA,
          paletteB,
          paletteC,
          paletteD,
        });
      }

      // Update state for UI elements (Throttled via frame updates)
      setCurrentPhase(phase);
      setCurrentProgress(phaseProgress);
      setOverallTimeProgress(sceneTime / SCENE_DURATION);

      // Simulating realistic high-precision fluctuation
      const liveTempVal = (41.8 + Math.sin(elapsedSecs * 0.2) * 1.2 + Math.random() * 0.1).toFixed(1);
      const liveLatencyVal = (2.2 + Math.sin(elapsedSecs * 1.5) * 0.3 + Math.random() * 0.15).toFixed(1);
      const liveLoadVal = (97.5 + Math.sin(elapsedSecs * 0.5) * 1.0 + Math.random() * 0.2).toFixed(1);

      setLiveStats({
        temp: `${liveTempVal}°C`,
        latency: `${liveLatencyVal}ms`,
        load: `${liveLoadVal}%`,
      });

      setTelemetry({
        x: centerX,
        y: centerY,
        zoom: currentZoom,
        hueShift,
        accentColor: "rgb(0, 242, 255)", // Retain core Elegant Dark sleek cyan color feel primarily
        glowColor: "rgba(0, 242, 255, 0.2)",
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
    };
  }, [currentPoint]);

  // Format zoom magnification parameter scientifically matching Elegant Dark UI
  const formatMagnification = (z: number) => {
    // Map currentWebglZoom (1.5 to peak targetMaxZoom) log-linearly to peak at exactly 1.00e+10
    const maxZ = Math.min(currentPoint.maxZoom, 20000.0);
    const progress = Math.max(0, Math.min(1, (Math.log(z) - Math.log(1.5)) / (Math.log(maxZ) - Math.log(1.5))));
    const magFactor = Math.exp(Math.log(1.5) + progress * (Math.log(1.0e+10) - Math.log(1.5)));
    return magFactor.toExponential(2);
  };

  return (
    <div id="mandelbrot_app_container" className="relative w-screen h-screen overflow-hidden bg-[#050505] text-[#00f2ff] font-mono select-none">
      
      {/* Absolute WebGL canvas layer */}
      <div className="absolute inset-0 w-full h-full z-0">
        <canvas ref={canvasRef} className="block w-full h-full opacity-80" id="mandelbrot_canvas" />
      </div>

      {/* Cybernetic Scanline Overlay Pattern */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] z-10" />

      {/* Center Crosshair Decor */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 z-10">
        <div className="w-16 h-16 border border-[#00f2ff] rounded-full flex items-center justify-center">
          <div className="w-[1px] h-4 bg-[#00f2ff] absolute -top-2" />
          <div className="w-[1px] h-4 bg-[#00f2ff] absolute -bottom-2" />
          <div className="w-4 h-[1px] bg-[#00f2ff] absolute -left-2" />
          <div className="w-4 h-[1px] bg-[#00f2ff] absolute -right-2" />
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00f2ff]/30 pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00f2ff]/30 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00f2ff]/30 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00f2ff]/30 pointer-events-none" />

      {/* UI OVERLAY - TOP SECTION */}
      <div className="absolute top-0 left-0 w-full z-20 p-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff] animate-pulse" />
            <h1 className="text-lg font-bold tracking-[0.2em] uppercase text-white">
              Kernel: Mandelbrot_v4.2.0
            </h1>
          </div>
          <div className="text-[10px] text-[#00f2ff]/50 tracking-widest pl-5 uppercase">
            Sector: Deep_Space_Exploration | Precision: Float64_Ext
          </div>
        </div>
        
        {/* Top telemetry variables */}
        <div className="flex gap-12 text-left md:text-right mt-2 md:mt-0 font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00f2ff]/40 uppercase tracking-tighter">Core Temperature</span>
            <span className="text-xl font-light tracking-widest text-[#00f2ff]">{liveStats.temp}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00f2ff]/40 uppercase tracking-tighter">Frame Latency</span>
            <span className="text-xl font-light tracking-widest text-[#00f2ff]">{liveStats.latency}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00f2ff]/40 uppercase tracking-tighter">Compute Load</span>
            <span className="text-xl font-light tracking-widest text-emerald-400">{liveStats.load}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE RIGHT FLOATING CRITICAL STAGE & PHASE OVERLAY */}
      <div className="absolute right-8 top-1/3 z-20 hidden md:flex flex-col items-end gap-3 text-right">
        <div className="px-3 py-1 border border-[#00f2ff]/30 rounded text-[10px] uppercase tracking-widest bg-[#00f2ff]/5">
          Orchestrator Mode: Auto-Tour
        </div>
        <div className="px-3 py-1 border border-indigo-400/30 rounded text-[10px] uppercase tracking-widest bg-indigo-500/5 text-indigo-400 font-bold uppercase animate-pulse">
          STAGE: {currentPhase}
        </div>
        <div className="text-[10px] text-[#00f2ff]/45 capitalize mt-1 italic tracking-wide max-w-[200px]">
          {currentPoint.description}
        </div>
      </div>

      {/* UI OVERLAY - BOTTOM SECTION (WITH CAPTION AND COORDINATES) */}
      <div className="absolute bottom-0 left-0 w-full z-20 p-8 flex flex-col md:flex-row justify-between items-end gap-6 border-t border-[#00f2ff]/10 backdrop-blur-sm bg-black/40">
        
        {/* Real Coordinates & Operational status badges on left */}
        <div className="space-y-4 w-full md:w-auto">
          <div className="space-y-1">
            <div className="text-[10px] text-[#00f2ff]/60 uppercase tracking-widest">Coordinates Re/Im</div>
            <div className="text-base sm:text-lg md:text-2xl font-light tracking-tight text-white font-mono break-all leading-tight">
              {telemetry.x >= 0 ? "+" : ""}{telemetry.x.toFixed(20)} <br/>
              {telemetry.y >= 0 ? "+" : ""}{telemetry.y.toFixed(20)}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="px-3 py-1 border border-[#00f2ff]/30 rounded text-[10px] uppercase tracking-widest bg-[#00f2ff]/5">
              Auto-Orbit Active
            </div>
            <div className="px-3 py-1 border border-emerald-500/30 rounded text-[10px] uppercase tracking-widest bg-emerald-500/5 text-emerald-400">
              Hue Shift: Synchronized
            </div>
            <div className="px-3 py-1 border border-amber-500/30 rounded text-[10px] uppercase tracking-widest bg-amber-500/5 text-amber-400">
              Palette: {currentPoint.id}
            </div>
          </div>
        </div>

        {/* Dynamic target sequence title on right */}
        <div className="text-left md:text-right space-y-2 w-full md:w-auto mt-4 md:mt-0">
          <div className="text-[10px] text-[#00f2ff]/60 uppercase tracking-widest mb-1">
            Target Sequence {currentPoint.id.toString().padStart(2, "0")}/{POINTS_OF_INTEREST.length.toString().padStart(2, "0")}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPoint.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                {currentPoint.name}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="text-xs sm:text-sm tracking-[0.3em] text-[#00f2ff]/60 uppercase font-mono">
            Magnification: {formatMagnification(telemetry.zoom)}
          </div>
        </div>
      </div>

      {/* Dynamic bottom absolute loading bar for overall sequence loop timer */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-905 z-30 overflow-hidden">
        <div 
          className="h-full transition-all duration-100 ease-out"
          style={{ 
            width: `${overallTimeProgress * 100}%`,
            backgroundColor: "#00f2ff",
            boxShadow: `0 0 10px 2px #00f2ff`
          }}
        />
      </div>
    </div>
  );
}
