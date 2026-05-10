import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { QUESTIONS, calculateVector, getAestheticIdentity } from "../logic/calculator";
import { cn } from "../lib/utils";

interface DiagnosticProps {
  onComplete: (vector: [number, number, number, number]) => void;
}

export default function Diagnostic({ onComplete }: DiagnosticProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [clickedOption, setClickedOption] = useState<number | null>(null);

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleSelect = (optionIndex: number) => {
    setClickedOption(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    // 0.4s wait for ripple and mental processing before sliding
    setTimeout(() => {
      setClickedOption(null);
      if (currentIndex < QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
        const vector = calculateVector(newAnswers);
        onComplete(vector);
      }
    }, 500);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-moss flex items-center justify-center mb-6"
        >
          <Check className="text-neon w-8 h-8" />
        </motion.div>
        <h2 className="text-4xl font-black text-neon mb-2 font-serif tracking-tighter">SECURING DNA...</h2>
        <p className="text-limestone max-w-xs mx-auto text-xs uppercase tracking-widest leading-loose">
          Analyzing against the 4 pillars of the Monarchy grid.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col justify-center min-h-[60vh]">
      {/* Header */}
      <div className="mb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.5em] text-neon/40 font-black mb-3 block">
              DIAGNOSTIC SEQUENCE {currentIndex + 1} / {QUESTIONS.length}
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-neon tracking-tighter uppercase leading-none">{currentQuestion.title}</h1>
          </div>
          <div className="text-xl font-mono text-neon tracking-tighter font-black">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="h-[4px] w-full bg-neon/10 overflow-hidden shadow-[0_0_20px_rgba(180,250,50,0.05)]">
          <motion.div 
            className="h-full bg-neon shadow-[0_0_20px_rgba(180,250,50,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-20 overflow-hidden">
        <h2 className="text-white text-2xl md:text-3xl font-medium mb-16 leading-tight tracking-tight">
          {currentQuestion.question}
        </h2>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 150 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -150 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  id={`option-${idx}`}
                  disabled={clickedOption !== null}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "group text-left p-10 border border-neon/10 bg-neon/5 hover:bg-neon/10 hover:border-neon transition-all duration-700 relative overflow-hidden",
                    (answers[currentIndex] === idx || clickedOption === idx) && "bg-neon/20 border-neon shadow-[0_0_40px_rgba(180,250,50,0.1)]"
                  )}
                >
                  <div className="flex justify-between items-center relative z-10 pointer-events-none">
                    <span className="text-lg md:text-xl text-neon group-hover:text-white transition-colors leading-tight font-black uppercase tracking-tight">
                      {option.text}
                    </span>
                    {(answers[currentIndex] === idx || clickedOption === idx) && (
                      <div className="w-3 h-3 bg-neon shadow-[0_0_15px_rgba(180,250,50,0.8)] animate-pulse" />
                    )}
                  </div>
                  
                  {/* Ripple Effect */}
                  <AnimatePresence>
                    {clickedOption === idx && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0.3 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-neon/40 rounded-full z-0 pointer-events-none"
                        style={{ width: '100px', height: '100px', top: '50%', left: '50%', marginTop: '-50px', marginLeft: '-50px' }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Subtle hover background effect */}
                  <div className="absolute inset-0 bg-neon/5 translate-y-full group-hover:translate-y-0 transition-transform duration-1000 z-0" />
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-12 border-t border-neon/10">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-neon/40 hover:text-neon transition-all disabled:opacity-0"
        >
          <ChevronLeft className="w-4 h-4" />
          Sequence Previous
        </button>
        
        <div className="hidden sm:flex items-center gap-3">
          {QUESTIONS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 transition-all duration-500",
                i === currentIndex ? "bg-neon scale-150 shadow-[0_0_10px_rgba(180,250,50,0.4)]" : i < currentIndex ? "bg-neon/40" : "bg-neon/5"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}