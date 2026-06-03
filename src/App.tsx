/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Diagnostic from "./components/Diagnostic";
import Vault from "./components/Vault";
import Legal from "./components/Legal";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ShieldCheck, LogIn, UserCircle, Archive, Scan, LayoutGrid, Camera, Sun, Moon } from "lucide-react";
import { supabase } from "./lib/supabase";
import { cn } from "./lib/utils";
import { Session } from "@supabase/supabase-js";
import { safeParseVector } from "./logic/calculator";

import LushGradientBackground from "./components/LushGradientBackground";

export default function App() {
  const [view, setView] = useState<"home" | "diagnostic" | "vault" | "auth_required" | "quiz_intro_1" | "quiz_intro_2" | "legal">(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/legal") {
      return "legal";
    }
    return "home";
  });
  const [legalSection, setLegalSection] = useState<"refund" | "privacy" | "terms">("refund");
  const [vaultTab, setVaultTab] = useState<"recommendations" | "vision">("recommendations");
  const [userVector, setUserVector] = useState<[number, number, number, number] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [comingSoonAlert, setComingSoonAlert] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/legal") {
        setView("legal");
      } else if (path === "/") {
        setView("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem("heist_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("light", savedTheme === "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("heist_theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  useEffect(() => {
    async function getInitialSession() {
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      setSession(session);
      
      if (session) {
        // Try to fetch saved DNA vector from profile style_dna column
        const { data: profile } = await supabase!
          .from('profiles')
          .select('style_dna')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.style_dna) {
          setUserVector(safeParseVector(profile.style_dna));
        }
      }
      setLoading(false);
    }
    
    getInitialSession();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const startDiagnostic = () => setView("quiz_intro_1");

  const handleDiagnosticComplete = async (vector: [number, number, number, number]) => {
    setUserVector(vector);
    
    // If logged in, save the new style DNA to profile
    if (session) {
      await supabase?.from('profiles').update({ style_dna: JSON.stringify(vector) }).eq('id', session.user.id);
    }

    // Simulate high-end calculation delay
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (session) {
        setView("vault");
      } else {
        setAuthMode("signup"); // Default to signup after quiz
        setView("auth_required");
      }
    }, 2500);
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authError, setAuthError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthError(null);
    setLoading(true);

    try {
      console.log(`[HEIST] Auth attempt (${authMode}): ${email}`);
      if (authMode === "signup") {
        // Uniquness check (Handle gracefully if RLS blocks)
        if (username) {
          try {
            const { data: existing, error: checkError } = await supabase
              .from('profiles')
              .select('id')
              .eq('full_name', username)
              .maybeSingle();
            
            if (checkError) {
              console.warn("[HEIST] Alias check bypassed due to RLS/Node connectivity.");
            } else if (existing) {
              setAuthError("This Identity Alias is already claimed.");
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("[HEIST] Alias check failed, proceeding with signup anyway.");
          }
        }

        console.log("[HEIST] Registering new neural node...");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: username
              // Removing style_dna from metadata as it might cause vector cast errors in triggers.
              // Vault component handles profile creation/initialization if trigger fails.
            }
          }
        });
        
        if (error) {
          console.error("[HEIST] Signup Failure:", error);
          if (error.message.includes("database error saving new user")) {
            throw new Error("PROFILES_INTEGRITY_FAULT: The database could not save your identity coordinates. Please try a different alias or contact support.");
          }
          throw error;
        }
        
        if (data.user && !data.session) {
          setAuthError("Identity Request Sent. Verify your DNA via email link.");
        } else if (data.session) {
          console.log("[HEIST] Identity verified. Synchronizing vault...");
          setSession(data.session);
          if (userVector) setView("vault");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          // Fetch DNA vector
          const { data: profile } = await supabase.from("profiles").select("style_dna").eq("id", data.session.user.id).single();
          if (profile?.style_dna) {
            setUserVector(safeParseVector(profile.style_dna));
          }
          setView("vault");
        }
      }
    } catch (err: any) {
      console.error("[HEIST] Auth Engine Error:", err);
      // Clean up common Supabase error messages
      let displayMsg = err.message || "Network node timeout.";
      if (displayMsg.includes("database error saving new user")) {
        displayMsg = "Database Integrity Failure: Your identity coordinates could not be saved. Contact System Admin.";
      }
      setAuthError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setView("home");
  };

  const handleLogin = () => setView("auth_required");

  const handleSavedSignIn = async (tab: "recommendations" | "vision" = "recommendations") => {
    setVaultTab(tab);
    if (session) {
      if (userVector) {
        setView("vault");
      } else {
        const { data: profile } = await supabase!
          .from('profiles')
          .select('style_dna')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.style_dna) {
          setUserVector(safeParseVector(profile.style_dna));
          setView("vault");
        } else {
          setView("diagnostic");
        }
      }
    } else {
      setView("auth_required");
    }
  };

  if (loading && !session) {
    return (
      <div className="bg-basalt min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-basalt min-h-screen text-obsidian font-sans selection:bg-neon/20 flex flex-col transition-colors duration-500">
      <div className="fixed top-6 right-6 md:top-10 md:right-10 z-[1000]">
        <button 
          onClick={toggleTheme}
          className="p-4 glass hover:border-neon hover:scale-110 transition-all rounded-full text-obsidian"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full h-full flex flex-col relative overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 bg-basalt relative z-10">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="px-12 md:px-24 py-32 flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center relative gpu-accelerated"
              >
                <LushGradientBackground theme={theme} />
                <div className="max-w-5xl w-full flex flex-col items-center relative z-10">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-4 mb-12 gpu-accelerated"
                  >
                    <div className="h-[1px] w-16 bg-neon" />
                    <span className="text-xs tracking-[0.8em] text-neon font-black uppercase drop-shadow-md">Monarchy v1.0 [Full Canvas]</span>
                    <div className="h-[1px] w-16 bg-neon" />
                  </motion.div>
                  
                  <div className="mask-reveal overflow-hidden mb-8 md:mb-16 gpu-accelerated">
                    <motion.h1 
                      initial={{ y: "110%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
                      className={cn(
                        "text-7xl sm:text-9xl md:text-[220px] font-serif font-black leading-[0.75] tracking-[-0.07em] uppercase break-words px-4 text-stroke-thin",
                        theme === "light" ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
                      )}
                    >
                      HEIST.
                    </motion.h1>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 1, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col items-center gap-12 mb-20 w-full max-w-2xl px-6 relative z-10"
                  >
                    <div className="space-y-4">
                       <p className="text-neon text-[10px] md:text-sm font-black uppercase tracking-[0.6em] px-4 animate-pulse">
                         INITIALISE THE DNA SCAN TO ASCEND YOUR FASHION SENSE
                       </p>
                    </div>

                    {!session ? (
                      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={startDiagnostic}
                          id="begin-diagnostic"
                          className={cn(
                            "flex-1 py-10 flex items-center justify-center gap-4 group transition-all duration-700 relative overflow-hidden border-2 pulse-glow",
                            theme === "light"
                              ? "bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)] shadow-[0_0_80px_rgba(44,107,100,0.2)]"
                              : "glass-neon text-[#2c6b64] border-neon shadow-[0_0_80px_rgba(2,80,67,0.3)]"
                          )}
                        >
                          <Sparkles className="w-6 h-6" />
                          <span className="text-sm tracking-[0.5em] font-black uppercase">Start Style DNA Quiz</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogin}
                          className={cn(
                            "flex-1 py-10 flex items-center justify-center gap-4 group transition-all duration-300 border-2 backdrop-blur-md",
                            theme === "light"
                              ? "bg-[var(--color-bg-card)] text-[var(--color-accent)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
                              : "glass text-neon border-neon/40 hover:bg-neon/10"
                          )}
                        >
                          <LogIn className="w-6 h-6" />
                          <span className="text-sm tracking-[0.5em] font-black uppercase">Sign In</span>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6 w-full">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSavedSignIn("vision")}
                          className={cn(
                            "w-full py-10 flex items-center justify-center gap-4 group transition-all duration-300 border-2",
                            theme === "light"
                              ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] shadow-[0_0_30px_rgba(44,107,100,0.1)]"
                              : "glass-neon border-neon shadow-[0_0_80px_rgba(2,80,67,0.5)]"
                          )}
                        >
                          <Camera className="w-7 h-7 text-[#2c6b64]" />
                          <span className="text-sm tracking-[0.6em] font-black uppercase text-[#2c6b64]">Open Vision Engine</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSavedSignIn("recommendations")}
                          className={cn(
                            "w-full py-6 flex items-center justify-center gap-4 border transition-all",
                            theme === "light"
                              ? "bg-[var(--color-bg-card)] text-[var(--color-accent)]/80 hover:text-[var(--color-accent)] border-[var(--color-border)] hover:border-[var(--color-accent)]"
                              : "glass text-neon/60 border-neon/20 hover:border-neon hover:text-neon"
                          )}
                        >
                          <Archive className="w-5 h-5" />
                          <span className="text-xs tracking-[0.4em] font-black uppercase">Archive Storage</span>
                        </motion.button>
                        <button
                         onClick={handleSignOut}
                         className="w-full py-4 text-neon/40 font-black text-[9px] uppercase tracking-[0.4em] hover:text-red-500 transition-colors"
                       >
                         De-authorize Neural Node [{session.user.email?.split('@')[0]}]
                       </button>
                      </div>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    initial="initial"
                    animate="animate"
                    variants={{
                      animate: {
                        transition: {
                          staggerChildren: 0.3,
                          delayChildren: 2
                        }
                      }
                    }}
                    className="space-y-12 max-w-2xl px-4"
                  >
                    <motion.div 
                      variants={{
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
                      }}
                      className="glass-card p-8 md:p-12 space-y-6"
                    >
                      <h2 className="text-obsidian text-xl md:text-2xl font-serif font-black uppercase tracking-tight text-stroke-sm">
                        The Mission
                      </h2>
                      <p className="text-obsidian/80 text-lg md:text-xl font-medium leading-relaxed tracking-tight text-stroke-sm">
                        HEIST. It's not just another shop; it’s a platform for the best homegrown fashion brands. Many gems stay hidden, and it's time to change that. We curate your specific vibe.
                      </p>
                    </motion.div>

                    <motion.div 
                      variants={{
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
                      }}
                      className="glass-card p-8 md:p-12 space-y-6"
                    >
                      <h2 className="text-obsidian text-xl md:text-2xl font-serif font-black uppercase tracking-tight text-stroke-sm">
                        The Technology
                      </h2>
                      <p className="text-obsidian/80 text-lg md:text-xl font-medium leading-relaxed tracking-tight text-stroke-sm">
                        Using a state-of-the-art Style DNA Quiz, our AI maps your exact aesthetic preferences to create a personalized digital wardrobe. No noise, just your style.
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {view === "quiz_intro_1" && (
              <motion.div
                key="quiz_intro_1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 py-24 flex flex-col h-full bg-basalt items-center justify-center text-center min-h-[calc(100vh-160px)]"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl space-y-12"
                >
                  <p className="text-neon text-[10px] md:text-xs uppercase tracking-[0.6em] font-black opacity-50">Protocol: DNA Mapping</p>
                  <h2 className="text-4xl sm:text-6xl font-serif font-black text-neon uppercase tracking-tighter leading-tight">
                    This quiz analyses your style DNA so you know what clothes you can buy
                  </h2>
                  <div className="pt-12">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView("quiz_intro_2")}
                      className="px-16 py-8 bg-neon text-basalt text-xs font-black uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(2,80,67,0.4)]"
                    >
                      Process Integration
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {view === "quiz_intro_2" && (
              <motion.div
                key="quiz_intro_2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 py-24 flex flex-col h-full bg-basalt items-center justify-center text-center min-h-[calc(100vh-160px)]"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-3xl space-y-12"
                >
                  <p className="text-neon text-[10px] md:text-xs uppercase tracking-[0.6em] font-black opacity-50">Final Authorization</p>
                  <h2 className="text-4xl sm:text-6xl font-serif font-black text-neon uppercase tracking-tighter leading-tight">
                    Let's begin your journey to the other side
                  </h2>
                  <div className="pt-12">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView("diagnostic")}
                      className="px-16 py-8 bg-neon text-basalt text-xs font-black uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(2,80,67,0.4)]"
                    >
                      Enter The Void
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {view === "diagnostic" && (
              <motion.div
                key="diagnostic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-basalt"
              >
                <div className="max-w-7xl mx-auto w-full h-full p-8 md:p-24">
                  <Diagnostic onComplete={handleDiagnosticComplete} />
                </div>
              </motion.div>
            )}

            {view === "auth_required" && (
              <motion.div
                key="auth_required"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-8 py-24 flex flex-col h-full bg-basalt items-center justify-center text-center min-h-[calc(100vh-160px)]"
              >
                <div className="mb-12 p-8 glass-neon shadow-[0_0_40px_rgba(2,80,67,0.1)]">
                  <ShieldCheck className="w-12 h-12 text-neon" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-serif font-black text-obsidian mb-4 uppercase tracking-tighter">
                  {userVector ? "Identity Encoded" : (authMode === "signup" ? "New Identity" : "Vault Sync")}
                </h2>
                <p className="text-limestone text-[10px] md:text-xs uppercase tracking-[0.4em] leading-loose mb-16 max-w-sm mx-auto">
                  {userVector 
                    ? "DNA mapping complete. Register your account to unlock your personalized Vault results."
                    : "Access the world's most exclusive stylistic neural network. Synchronize your coordinates to proceed."
                  }
                </p>

                <form onSubmit={handleEmailAuth} className="w-full max-w-md space-y-6 mb-12">
                  {authMode === "signup" && (
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        placeholder="IDENTITY ALIAS (USERNAME)"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full glass p-6 text-xs font-mono text-neon placeholder:text-neon/20 focus:border-neon outline-none transition-all uppercase tracking-widest"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <input 
                      type="email" 
                      placeholder="EMAIL"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full glass p-6 text-xs font-mono text-neon placeholder:text-neon/20 focus:border-neon outline-none transition-all uppercase tracking-widest"
                    />
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="password" 
                      placeholder="SET A PASSWORD"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full glass p-6 text-xs font-mono text-neon placeholder:text-neon/20 focus:border-neon outline-none transition-all uppercase tracking-widest"
                    />
                  </div>
                  {authError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20">
                      <p className="text-[10px] text-red-500 uppercase font-black tracking-widest leading-relaxed">
                        SYSTEM ERROR: {authError}
                      </p>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    className="w-full bg-neon text-basalt py-6 flex items-center justify-center gap-4 group hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(2,80,67,0.2)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-basalt border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span className="text-xs tracking-[0.5em] font-black uppercase">
                          {authMode === "signin" ? "Verify Node" : "Register Node"}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <button 
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="text-neon/40 text-[10px] uppercase font-black tracking-[0.4em] hover:text-neon transition-colors"
                >
                  {authMode === "signin" ? "NEW TO HEIST? SIGN UP" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
                </button>
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
                <Vault 
                  userVector={userVector} 
                  initialTab={vaultTab}
                  onSignOut={handleSignOut} 
                  onRetakeQuiz={() => setView("diagnostic")}
                  theme={theme}
                />
              </motion.div>
            )}

            {view === "legal" && (
              <motion.div
                key="legal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Legal 
                  initialSection={legalSection}
                  onBack={() => {
                    setView("home");
                    window.history.pushState(null, "", "/");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {view !== "legal" && (
          <nav className="fixed bottom-4 md:bottom-8 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[100] flex items-center justify-center pointer-events-none">
            <div className={cn(
              "flex items-center gap-2 md:gap-4 p-2 md:p-3 pointer-events-auto mx-4 border transition-all duration-500",
              theme === "light"
                ? "bg-[var(--color-bg-card)] border-[var(--color-border)] shadow-md"
                : "glass border-neon/10"
            )}>
              <button 
                onClick={() => setView("vault")}
                className={cn(
                  "flex-1 md:px-12 py-4 px-6 border flex flex-col items-center gap-1 transition-all",
                  theme === "light"
                    ? (view === "vault" ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]" : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
                    : (view === "vault" ? "bg-neon/10 border-neon text-neon" : "border-white/5 text-limestone hover:text-white")
                )}
              >
                <Archive className="w-5 h-5" />
                <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">Archive</span>
              </button>
              
              <button 
                onClick={() => setView("home")}
                className={cn(
                  "flex-1 md:px-12 py-4 px-6 border flex flex-col items-center gap-1 transition-all",
                  theme === "light"
                    ? (view === "home" ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]" : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
                    : (view === "home" ? "bg-neon/10 border-neon text-neon" : "border-limestone/20 text-limestone hover:text-white")
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">Protocol</span>
              </button>
            </div>
          </nav>
        )}

        {/* Footnote */}
        {view !== "legal" && (
          <footer className="py-24 flex flex-col items-center border-t border-[var(--color-border)] bg-[var(--color-bg-deep)] gap-10 transition-all duration-500">
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 px-6">
              <button 
                onClick={() => {
                  setLegalSection("refund");
                  setView("legal");
                  window.history.pushState(null, "", "/legal");
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer font-sans"
              >
                Refund Policy
              </button>
              <span className="text-[var(--color-border)] text-xs hidden sm:inline">|</span>
              <button 
                onClick={() => {
                  setLegalSection("privacy");
                  setView("legal");
                  window.history.pushState(null, "", "/legal");
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer font-sans"
              >
                Privacy Policy
              </button>
              <span className="text-[var(--color-border)] text-xs hidden sm:inline">|</span>
              <button 
                onClick={() => {
                  setLegalSection("terms");
                  setView("legal");
                  window.history.pushState(null, "", "/legal");
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer font-sans"
              >
                Terms of Service
              </button>
            </div>
            
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">
              Monarchy • Curator Platform (v1.2.0)
            </p>
          </footer>
        )}
      </div>

      {comingSoonAlert && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[var(--color-bg-deep)]/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8 text-center space-y-6 border border-[var(--color-border)] bg-[var(--color-bg-card)]"
          >
            <div className="text-[var(--color-accent)] uppercase tracking-[0.3em] text-[10px] font-medium">
              Curator Advisory
            </div>
            <h3 className="text-[var(--color-text-primary)] text-2xl font-serif font-light uppercase tracking-wide">
              Coming Soon
            </h3>
            <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-widest leading-relaxed">
              "{comingSoonAlert}"
              <span className="block mt-4 text-[10px] text-[var(--color-accent)] font-sans tracking-[0.15em]">MODULE UNDER CALIBRATION</span>
            </p>
            <button 
              onClick={() => setComingSoonAlert(null)}
              className="w-full py-4 text-xs font-medium uppercase tracking-[0.3em] transition-all cursor-pointer border border-[var(--color-border)] bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]"
            >
              Acknowledge
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}