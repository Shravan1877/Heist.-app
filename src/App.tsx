/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Diagnostic from "./components/Diagnostic";
import Vault from "./components/Vault";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ShieldCheck, LogIn, UserCircle, Archive, Scan, LayoutGrid } from "lucide-react";
import { supabase } from "./lib/supabase";
import { cn } from "./lib/utils";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [view, setView] = useState<"home" | "diagnostic" | "vault" | "auth_required">("home");
  const [userVector, setUserVector] = useState<[number, number, number, number] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
          try {
            const vector = typeof profile.style_dna === 'string' 
              ? JSON.parse(profile.style_dna) 
              : profile.style_dna;
            setUserVector(vector);
          } catch (e) {
            console.error("Failed to parse saved style DNA");
          }
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

  const startDiagnostic = () => setView("diagnostic");

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
            const vector = typeof profile.style_dna === "string" ? JSON.parse(profile.style_dna) : profile.style_dna;
            setUserVector(vector);
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

  const handleSavedSignIn = async () => {
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
          const vector = typeof profile.style_dna === 'string' 
            ? JSON.parse(profile.style_dna) 
            : profile.style_dna;
          setUserVector(vector);
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
    <div className="bg-basalt min-h-screen text-neon font-sans selection:bg-neon/20 flex flex-col">
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 bg-basalt relative">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-12 md:px-24 py-32 flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center"
              >
                <div className="max-w-5xl w-full flex flex-col items-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 mb-12"
                  >
                    <div className="h-[1px] w-16 bg-neon" />
                    <span className="text-xs tracking-[0.8em] text-neon font-black uppercase">Monarchy v1.0 [Full Canvas]</span>
                    <div className="h-[1px] w-16 bg-neon" />
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-7xl sm:text-9xl md:text-[220px] font-serif font-black leading-[0.75] mb-8 md:mb-16 tracking-[-0.07em] uppercase break-words px-4"
                  >
                    HEIST.<br /> 
                    VAULT.
                  </motion.h1>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-10 max-w-2xl"
                  >
                    <p className="text-neon/80 text-lg md:text-xl font-medium leading-relaxed tracking-tight">
                      Curated by experts. Verified by AI. Designed for the 1%. <br className="hidden md:block" />
                      Vault coordinates optimized for precision stylistic matching.
                    </p>
                    <div className="h-[1px] w-full bg-neon/10" />
                    <p className="text-limestone text-xs uppercase tracking-[0.3em] leading-loose">
                      Clueless? Click below to begin atmospheric DNA mapping and unlock the high-tech vault.
                    </p>
                  </motion.div>
                </div>

                <div className="mt-12 md:mt-24 flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl px-6">
                  {!session ? (
                    <>
                      <button
                        onClick={startDiagnostic}
                        id="begin-diagnostic"
                        className="flex-1 bg-neon text-basalt py-8 flex items-center justify-center gap-4 group transition-all duration-700 relative overflow-hidden shadow-[0_0_50px_rgba(180,250,50,0.1)]"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xs tracking-[0.4em] font-black uppercase">Map Style DNA</span>
                      </button>

                      <button
                        onClick={handleLogin}
                        className="flex-1 bg-transparent text-neon py-8 flex items-center justify-center gap-4 group hover:bg-neon/10 transition-all duration-300 border border-neon/20"
                      >
                        <LogIn className="w-5 h-5" />
                        <span className="text-xs tracking-[0.4em] font-black uppercase">Identity Verified</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-6 w-full">
                      <button
                        onClick={handleSavedSignIn}
                        className="w-full bg-neon text-basalt py-8 flex items-center justify-center gap-4 group hover:scale-[1.02] transition-all duration-300 shadow-[0_0_60px_rgba(180,250,50,0.4)]"
                      >
                        <UserCircle className="w-6 h-6" />
                        <span className="text-xs tracking-[0.5em] font-black uppercase">Resume Identity</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full py-4 text-limestone/60 font-black text-xs uppercase tracking-[0.4em] hover:text-red-500 transition-colors"
                      >
                        De-authorize Neural Node [{session.user.email?.split('@')[0]}]
                      </button>
                    </div>
                  )}
                </div>
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
                <div className="mb-12 p-8 bg-neon/10 border border-neon/30 shadow-[0_0_40px_rgba(180,250,50,0.1)]">
                  <ShieldCheck className="w-12 h-12 text-neon" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-serif font-black text-neon mb-4 uppercase tracking-tighter">
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
                        className="w-full bg-neon/5 border border-neon/10 p-6 text-xs font-mono text-neon placeholder:text-neon/20 focus:border-neon outline-none transition-all uppercase tracking-widest"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <input 
                      type="email" 
                      placeholder="EMAIL COORDINATES"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neon/5 border border-neon/10 p-6 text-xs font-mono text-neon placeholder:text-neon/20 focus:border-neon outline-none transition-all uppercase tracking-widest"
                    />
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="password" 
                      placeholder="VAULT CRYPTO KEY"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neon/5 border border-neon/10 p-6 text-xs font-mono text-neon placeholder:text-neon/20 focus:border-neon outline-none transition-all uppercase tracking-widest"
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
                    className="w-full bg-neon text-basalt py-6 flex items-center justify-center gap-4 group hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(180,250,50,0.2)]"
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
                  {authMode === "signin" ? "NEW USER? CREATE IDENTITY" : "ALREADY REGISTERED? SYNC MATRIX"}
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
                  onSignOut={handleSignOut} 
                  onRetakeQuiz={() => setView("diagnostic")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        <nav className="fixed bottom-4 md:bottom-8 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[100] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 bg-basalt/60 backdrop-blur-2xl border border-limestone/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto mx-4">
            <button 
              onClick={() => setView("vault")}
              className={cn(
                "flex-1 md:px-8 py-3 md:py-4 px-4 border border-limestone/20 flex flex-col items-center gap-1 transition-all",
                view === "vault" ? "bg-neon/10 border-neon text-neon" : "text-limestone hover:border-limestone/60 hover:text-white"
              )}
            >
              <Archive className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[7px] md:text-[8px] font-black tracking-widest uppercase">Archive</span>
            </button>
            
            <button 
              onClick={() => setView("diagnostic")}
              className={cn(
                "flex-1 md:px-8 py-3 md:py-4 px-4 border border-limestone/20 flex flex-col items-center gap-1 transition-all",
                view === "diagnostic" ? "bg-neon/10 border-neon text-neon" : "text-limestone hover:border-limestone/60 hover:text-white"
              )}
            >
              <Scan className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[7px] md:text-[8px] font-black tracking-widest uppercase">Scan</span>
            </button>

            <button 
              onClick={() => setView("home")}
              className={cn(
                "flex-1 md:px-8 py-3 md:py-4 px-4 border border-limestone/20 flex flex-col items-center gap-1 transition-all",
                view === "home" ? "bg-neon/10 border-neon text-neon" : "text-limestone hover:border-limestone/60 hover:text-white"
              )}
            >
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[7px] md:text-[8px] font-black tracking-widest uppercase">Protocol</span>
            </button>
          </div>
        </nav>

        {/* Footnote */}
        <footer className="py-24 flex flex-col items-center border-t border-neon/10 bg-basalt">
          <p className="text-[10px] uppercase font-black tracking-[0.6em] text-neon/20">
            HEIST. GLOBAL NETWORK v1.0.4
          </p>
        </footer>
      </div>
    </div>
  );
}