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

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      setIsFinished(true);
      const vector = calculateVector(newAnswers);
      onComplete(vector);
    }
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
          className="w-16 h-16 bg-moss rounded-full flex items-center justify-center mb-6"
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
    <div className="max-w-xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-limestone font-semibold mb-1 block">
              DIAGNOSTIC {currentIndex + 1} / {QUESTIONS.length}
            </span>
            <h1 className="text-4xl font-serif font-black text-neon tracking-tighter uppercase">{currentQuestion.title}</h1>
          </div>
          <div className="text-[10px] font-mono text-limestone tracking-widest">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="h-[2px] w-full bg-limestone/10 overflow-hidden">
          <motion.div 
            className="h-full bg-neon"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-12">
        <h2 className="text-neon/80 text-xl font-medium mb-12 leading-tight">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-3"
            >
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  id={`option-${idx}`}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "group text-left p-6 border border-limestone/20 bg-moss/20 hover:bg-moss/40 hover:border-limestone transition-all duration-300 relative overflow-hidden",
                    answers[currentIndex] === idx && "bg-moss/60 border-neon ring-1 ring-neon/20"
                  )}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-sm text-neon group-hover:text-white transition-colors leading-relaxed font-medium">
                      {option.text}
                    </span>
                    {answers[currentIndex] === idx && (
                      <div className="w-2 h-2 rounded-full bg-neon shadow-[0_0_8px_rgba(211,211,211,0.5)]" />
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-8 border-t border-limestone/10">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-limestone hover:text-neon transition-colors disabled:opacity-0"
        >
          <ChevronLeft className="w-3 h-3" />
          PREV
        </button>
        
        <div className="flex items-center gap-1.5">
          {QUESTIONS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-1 h-1 rounded-full transition-all duration-300",
                i === currentIndex ? "bg-neon scale-150" : i < currentIndex ? "bg-limestone" : "bg-limestone/20"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
