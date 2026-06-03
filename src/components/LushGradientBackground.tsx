import React, { useRef, useEffect } from 'react';

interface LushGradientBackgroundProps {
  theme?: "dark" | "light";
}

const LushGradientBackground: React.FC<LushGradientBackgroundProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    const interval = 80; // Crisp film-grain refresh interval (12.5 fps of analog flicker)

    const patternSize = 400; // Perfect 400px pattern size
    const numFrames = 6;     // Pre-generate 6 unique organic noise frames for outstanding richness

    const resize = () => {
      if (!canvas) return;
      // Device pixel ratio awareness for absolute resolution clarity
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    // exact color palette specs
    const darkColorBg = { r: 28, g: 30, b: 29 };     // #1c1e1d
    const darkColorGrain1 = { r: 24, g: 26, b: 25 }; // #181a19
    const darkColorGrain2 = { r: 31, g: 33, b: 32 }; // #1f2120
    const darkColorAccent = { r: 44, g: 107, b: 100 }; // #2c6b64

    const lightColorBg = { r: 245, g: 245, b: 245 };  // #f5f5f5
    const lightColorGrain1 = { r: 234, g: 234, b: 234 }; // #eaeaea
    const lightColorGrain2 = { r: 220, g: 218, b: 213 }; // #dcdad5
    const lightColorAccent = { r: 44, g: 107, b: 100 }; // #2c6b64

    const bg = isDark ? darkColorBg : lightColorBg;
    const g1 = isDark ? darkColorGrain1 : lightColorGrain1;
    const g2 = isDark ? darkColorGrain2 : lightColorGrain2;
    const acc = isDark ? darkColorAccent : lightColorAccent;
    const accOpacity = isDark ? 0.22 : 0.08;

    // Fast generation using ImageData logic
    const frameCanvases = Array.from({ length: numFrames }, () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = patternSize;
      offscreen.height = patternSize;
      const oCtx = offscreen.getContext('2d');
      if (!oCtx) return offscreen;

      const imgData = oCtx.createImageData(patternSize, patternSize);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const rand = Math.random();
        let r = bg.r;
        let g = bg.g;
        let b = bg.b;

        if (rand < 0.18) {
          r = g1.r;
          g = g1.g;
          b = g1.b;
        } else if (rand < 0.35) {
          r = g2.r;
          g = g2.g;
          b = g2.b;
        } else if (rand < 0.39) {
          // Microscopic structural teal highlights
          r = Math.round(bg.r * (1 - accOpacity) + acc.r * accOpacity);
          g = Math.round(bg.g * (1 - accOpacity) + acc.g * accOpacity);
          b = Math.round(bg.b * (1 - accOpacity) + acc.b * accOpacity);
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255; // Solid opaque base for optimized composite operations
      }

      oCtx.putImageData(imgData, 0, 0);
      return offscreen;
    });

    let currentFrameIdx = 0;

    const render = (time: number) => {
      if (time - lastTime > interval) {
        currentFrameIdx = (currentFrameIdx + 1) % numFrames;
        
        ctx.save();
        
        // Random offsets to prevent any repeat pattern discovery across frames
        const xOffset = Math.floor(Math.random() * patternSize);
        const yOffset = Math.floor(Math.random() * patternSize);
        
        const patternCanvas = frameCanvases[currentFrameIdx];
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        
        if (pattern) {
          // Set transform on pattern if supported, otherwise fallback to canvas translate
          if ('setTransform' in pattern && typeof (pattern as any).setTransform === 'function') {
            const matrix = new DOMMatrix().translate(xOffset, yOffset);
            (pattern as any).setTransform(matrix);
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
          } else {
            ctx.translate(xOffset, yOffset);
            ctx.fillStyle = pattern;
            ctx.fillRect(-xOffset, -yOffset, window.innerWidth + xOffset, window.innerHeight + yOffset);
          }
        }
        
        ctx.restore();
        lastTime = time;
      }
      
      animationId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    resize();
    currentFrameIdx = Math.floor(Math.random() * numFrames);
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: 'pixelated',
          opacity: 1,
        }}
      />
      {/* Exquisite dark vignette shadows to ground pages in exclusive fashion gallery space */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${
          isDark 
            ? 'bg-[radial-gradient(circle_at_center,transparent_45%,rgba(12,13,13,0.75)_100%)]' 
            : 'bg-[radial-gradient(circle_at_center,transparent_60%,rgba(44,107,100,0.06)_100%)]'
        }`}
      />
    </div>
  );
};

export default LushGradientBackground;