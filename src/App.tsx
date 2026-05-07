/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Diagnostic from "./components/Diagnostic";
import Vault from "./components/Vault";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"home" | "diagnostic" | "vault">("home");
  const [userVector, setUserVector] = useState<[number, number, number, number] | null>(null);

  const startDiagnostic = () => setView("diagnostic");

  const handleDiagnosticComplete = (vector: [number, number, number, number]) => {
    setUserVector(vector);
    // Simulate high-end calculation delay
    setTimeout(() => setView("vault"), 2500);
  };

  return (
    <div className="bg-[#1A1A1A] min-h-screen text-neon font-sans selection:bg-neon/20 flex items-center justify-center">
      <div className="w-full max-w-[450px] bg-basalt min-h-screen shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden ring-1 ring-limestone/20">
        {/* Nav */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-limestone/10 bg-basalt/80 backdrop-blur-md sticky top-0 z-50">
          <button 
            onClick={() => setView("home")}
            className="flex items-center gap-2 group"
          >
            <div className="w-6 h-6 bg-neon rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-basalt text-[10px] font-black">H.</span>
            </div>
            <span className="text-[10px] tracking-[0.4em] font-black uppercase text-neon">HEIST.</span>
          </button>
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-4 h-4 text-limestone" />
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 bg-basalt">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-8 py-20 flex flex-col h-full bg-basalt"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-[1px] w-8 bg-neon" />
                    <span className="text-[9px] tracking-[0.5em] text-neon font-black uppercase">Monarchy v1.0</span>
                  </div>
                  
                  <h1 className="text-[85px] font-serif font-black leading-[0.75] mb-12 tracking-[-0.05em]">
                    HEIST.<br /> 
                    VAULT.
                  </h1>
                  
                  <div className="space-y-6 max-w-[280px]">
                    <p className="text-neon/80 text-xs font-medium leading-relaxed">
                      Curated by experts. <br />
                      Verified by AI. <br />
                      Designed for the 1%.
                    </p>
                    <div className="h-[1px] w-full bg-limestone/20" />
                    <p className="text-limestone text-[9px] uppercase tracking-widest leading-loose">
                      Clueless? Click the button below to start the quiz, find your Fashion DNA, and unlock the vault.
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-12">
                  <button
                    onClick={startDiagnostic}
                    id="begin-diagnostic"
                    className="w-full bg-graphite text-neon py-6 flex items-center justify-center gap-3 group hover:bg-neon hover:text-basalt transition-all duration-700 border border-limestone/30 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-neon/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Sparkles className="w-4 h-4 relative z-10" />
                    <span className="text-[10px] tracking-[0.3em] font-black uppercase relative z-10">Initialize DNA Map</span>
                  </button>
                </div>
              </motion.div>
            )}

            {view === "diagnostic" && (
              <motion.div
                key="diagnostic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full bg-basalt"
              >
                <Diagnostic onComplete={handleDiagnosticComplete} />
              </motion.div>
            )}

            {view === "vault" && userVector && (
              <motion.div
                key="vault"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Vault userVector={userVector} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Footnote */}
        <footer className="py-8 px-8 border-t border-limestone/10 bg-basalt">
          <p className="text-[8px] uppercase tracking-[0.4em] text-limestone/40 text-center font-bold">
            HEIST. v1.0.4
          </p>
        </footer>
      </div>
    </div>
  );
}