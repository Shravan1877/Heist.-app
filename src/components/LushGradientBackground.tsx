import React from 'react';

const LushGradientBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#909090] pointer-events-none z-0">
      {/* Self-contained CSS for high-performance organic aurora motion */}
      <style>{`
        @keyframes aurora-wave-a {
          0% { transform: translate(-30%, -40%) rotate(0deg) scale(1); }
          33% { transform: translate(10%, -20%) rotate(40deg) scale(1.15); }
          66% { transform: translate(-10%, 20%) rotate(80deg) scale(0.9); }
          100% { transform: translate(-30%, -40%) rotate(360deg) scale(1); }
        }
        @keyframes aurora-wave-b {
          0% { transform: translate(25%, 30%) rotate(0deg) scale(1.1); }
          50% { transform: translate(-15%, -10%) rotate(-90deg) scale(0.85); }
          100% { transform: translate(25%, 30%) rotate(-360deg) scale(1.1); }
        }
        @keyframes aurora-wave-c {
          0% { transform: translate(-20%, 20%) rotate(30deg) scale(0.9); }
          50% { transform: translate(30%, -30%) rotate(160deg) scale(1.3); }
          100% { transform: translate(-20%, 20%) rotate(390deg) scale(0.9); }
        }
        @keyframes aurora-wave-d {
          0% { transform: translate(10%, -35%) rotate(-20deg) scale(1); }
          50% { transform: translate(-25%, 25%) rotate(45deg) scale(1.2); }
          100% { transform: translate(10%, -35%) rotate(-20deg) scale(1); }
        }
        @keyframes aurora-curtain-morph {
          0%, 100% { border-radius: 43% 57% 41% 59% / 54% 39% 61% 46%; }
          33% { border-radius: 60% 40% 50% 50% / 37% 63% 37% 63%; }
          66% { border-radius: 40% 60% 64% 36% / 60% 40% 60% 40%; }
        }
        .aurora-blur {
          filter: blur(120px);
          -webkit-filter: blur(120px);
          will-change: transform, opacity;
          mix-blend-mode: screen;
        }
        :global(.light) .aurora-blur {
          mix-blend-mode: multiply;
          opacity: 0.25 !important;
        }
      `}</style>

      {/* Aurora Layer 1: Dark Slate & Charcoal Core */}
      <div 
        className="absolute top-1/4 left-1/4 w-[120%] h-[120%] opacity-50 bg-gradient-to-r from-slate-600 via-charcoal-700 to-zinc-600 blur-[130px] rounded-[50%]"
      />

      {/* Aurora Layer 2: Deep Luxury Forest Teal */}
      <div 
        className="absolute -top-[20%] -left-[20%] w-[130%] h-[130%] opacity-[0.38] bg-gradient-to-tr from-[#025043] via-[#013b31] to-transparent aurora-blur"
        style={{
          borderRadius: '43% 57% 41% 59% / 54% 39% 61% 46%'
        }}
      />

      {/* Aurora Layer 3: Radiant High-Aspect Mint Teal */}
      <div 
        className="absolute -bottom-[10%] -right-[10%] w-[120%] h-[120%] opacity-[0.45] bg-gradient-to-bl from-[#4a9c8f] via-[#00a896] to-transparent aurora-blur"
        style={{
          borderRadius: '50% 50% 45% 55% / 40% 60% 40% 60%'
        }}
      />

      {/* Aurora Layer 4: Smoky Warm Grey Highlight */}
      <div 
        className="absolute top-1/3 left-1/3 w-[100%] h-[100%] opacity-[0.32] bg-gradient-to-br from-[#7a8b8c] via-[#5c6f6c] to-transparent aurora-blur"
        style={{
          borderRadius: '35% 65% 55% 45% / 50% 50% 50% 50%'
        }}
      />

      {/* Aurora Layer 5: Concentrated Intense Emerald/Neon Stripe */}
      <div 
        className="absolute top-1/4 left-1/10 w-[110%] h-[80%] opacity-[0.25] bg-[#028090] aurora-blur"
        style={{
          borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%'
        }}
      />

      {/* High-Fidelity Static Noise Grain overlay - 100% self-contained data URL */}
      <div 
        className="absolute inset-0 opacity-[0.045] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`
        }}
      />
    </div>
  );
};

export default LushGradientBackground;