import React from 'react';

const LushGradientBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121212] pointer-events-none z-0">
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-40 blur-[100px] will-change-transform"
        style={{
          background: `radial-gradient(circle at center, 
            #CCFF00 0%, 
            #06402B 35%, 
            #F4FFA1 70%, 
            transparent 100%)`,
          animation: 'lush-ambient 20s infinite linear'
        }}
      />
      {/* Texture Overlay for extra grit/luxury feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default LushGradientBackground;