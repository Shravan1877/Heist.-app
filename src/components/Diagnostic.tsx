import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Check } from "lucide-react";
import { QUESTIONS, calculateVector } from "../logic/calculator";
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

    // 0.5s pause for transition feedback
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
          className="w-16 h-16 bg-[var(--color-bg-card)] border border-[var(--color-accent)] flex items-center justify-center mb-8"
        >
          <Check className="text-[var(--color-accent)] w-8 h-8 stroke-[1.5]" />
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-serif font-light text-[var(--color-text-primary)] mb-4 tracking-tight uppercase">
          Securing DNA Coordinates
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto text-xs uppercase tracking-[0.25em] leading-relaxed">
          Calibrating preferences inside the Monarchy matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 flex flex-col justify-center min-h-[70vh]">
      {/* Header */}
      <div className="mb-16">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.4em] text-[var(--color-text-secondary)] font-medium mb-3 block">
              DIAGNOSTIC SEQUENCE {currentIndex + 1} OF {QUESTIONS.length}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[var(--color-text-primary)] tracking-tight uppercase leading-none">
              {currentQuestion.title}
            </h1>
          </div>
          <div className="text-base font-mono text-[var(--color-accent)] tracking-widest">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="h-[2px] w-full bg-[var(--color-border)]">
          <motion.div 
            className="h-full bg-[var(--color-accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-16">
        <h2 className="text-[var(--color-accent)] text-xl md:text-2xl font-serif font-normal mb-12 leading-relaxed tracking-wide">
          {currentQuestion.question}
        </h2>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentIndex] === idx || clickedOption === idx;
                return (
                  <button
                    key={idx}
                    id={`option-${idx}`}
                    disabled={clickedOption !== null}
                    onClick={() => handleSelect(idx)}
                    className={cn(
                      "group text-left p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all duration-300 relative overflow-hidden shadow-sm",
                      isSelected && "border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-[0_0_30px_rgba(44,107,100,0.1)]"
                    )}
                  >
                    <div className="flex justify-between items-center relative z-10 pointer-events-none">
                      <span className="text-sm md:text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-relaxed font-light uppercase tracking-wider">
                        {option.text}
                      </span>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full" />
                      )}
                    </div>
                    
                    {/* Ripple Effect */}
                    <AnimatePresence>
                      {clickedOption === idx && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0.15 }}
                          animate={{ scale: 3.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="absolute inset-0 bg-[var(--color-accent)]/20 rounded-full z-0 pointer-events-none"
                          style={{ width: '100px', height: '100px', top: '50%', left: '50%', marginTop: '-50px', marginLeft: '-50px' }}
                        />
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-8 border-t border-[var(--color-border)]">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all disabled:opacity-0"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
          Back
        </button>
        
        <div className="hidden sm:flex items-center gap-2">
          {QUESTIONS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-1.5 h-1.5 transition-all duration-300",
                i === currentIndex ? "bg-[var(--color-accent)] scale-125" : i < currentIndex ? "bg-[var(--color-accent)]/60" : "bg-[var(--color-border)]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
