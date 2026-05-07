/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Diagnostic from "./components/Diagnostic";
import Vault from "./components/Vault";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ShieldCheck, LogIn, UserCircle } from "lucide-react";
import { supabase } from "./lib/supabase";
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
        // Try to fetch saved DNA vector from profile
        const { data: profile } = await supabase!
          .from('profiles')
          .select('dna_vector')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.dna_vector) {
          try {
            const vector = typeof profile.dna_vector === 'string' 
              ? JSON.parse(profile.dna_vector) 
              : profile.dna_vector;
            setUserVector(vector);
          } catch (e) {
            console.error("Failed to parse saved DNA vector");
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
    
    // If logged in, save the new DNA vector to profile
    if (session) {
      await supabase?.from('profiles').update({ dna_vector: vector }).eq('id', session.user.id);
    }

    // Simulate high-end calculation delay
    setTimeout(() => {
      if (session) {
        setView("vault");
      } else {
        setView("auth_required");
      }
    }, 2500);
  };

  const handleLogin = async () => {
    if (!supabase) return;
    
    // Supabase Auth Popup implementation
    // We open a popup to handle the OAuth flow without redirecting the main App (which is in an iframe)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true, // This allows us to open the URL in a custom popup
      }
    });

    if (error) {
      console.error("Login failed:", error.message);
      return;
    }

    if (data?.url) {
      const authWindow = window.open(data.url, "heist_auth", "width=600,height=700");
      
      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "AUTH_SUCCESS") {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          
          if (session && userVector) {
            // Save the quiz results to the newly authenticated profile
            await supabase.from('profiles').update({ dna_vector: userVector }).eq('id', session.user.id);
            setView("vault");
          }
          window.removeEventListener("message", messageHandler);
        }
      };

      window.addEventListener("message", messageHandler);
    }
  };

  const handleSavedSignIn = async () => {
    if (session) {
      if (userVector) {
        setView("vault");
      } else {
        // Fetch again if somehow missing
        const { data: profile } = await supabase!
          .from('profiles')
          .select('dna_vector')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.dna_vector) {
          const vector = typeof profile.dna_vector === 'string' 
            ? JSON.parse(profile.dna_vector) 
            : profile.dna_vector;
          setUserVector(vector);
          setView("vault");
        } else {
          // No DNA vector found, start quiz
          setView("diagnostic");
        }
      }
    } else {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <div className="bg-basalt min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

                <div className="mt-auto pt-12 space-y-4">
                  {!session ? (
                    <>
                      <button
                        onClick={startDiagnostic}
                        id="begin-diagnostic"
                        className="w-full bg-graphite text-neon py-6 flex items-center justify-center gap-3 group hover:bg-neon hover:text-basalt transition-all duration-700 border border-limestone/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-neon/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Sparkles className="w-4 h-4 relative z-10" />
                        <span className="text-[10px] tracking-[0.3em] font-black uppercase relative z-10">Map DNA (New User)</span>
                      </button>

                      <button
                        onClick={handleLogin}
                        className="w-full bg-basalt text-limestone py-6 flex items-center justify-center gap-3 group hover:text-white transition-all duration-300 border border-limestone/10"
                      >
                        <LogIn className="w-4 h-4" />
                        <span className="text-[10px] tracking-[0.3em] font-black uppercase">Identity Sign In</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSavedSignIn}
                      className="w-full bg-neon text-basalt py-6 flex items-center justify-center gap-3 group hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(180,250,50,0.3)]"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span className="text-[10px] tracking-[0.3em] font-black uppercase">Saved Identity Sign In</span>
                    </button>
                  )}
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

            {view === "auth_required" && (
              <motion.div
                key="auth_required"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-8 py-20 flex flex-col h-full bg-basalt items-center justify-center text-center"
              >
                <div className="mb-8 p-6 bg-moss/20 border border-neon/30 rounded-full">
                  <ShieldCheck className="w-12 h-12 text-neon" />
                </div>
                <h2 className="text-2xl font-serif font-black text-neon mb-4 uppercase tracking-tight">Identity Required</h2>
                <p className="text-limestone text-[10px] uppercase tracking-widest leading-loose mb-12 max-w-[280px]">
                  DNA mapping complete. To unlock the vault and access Monarchy-tier results, you must verify your identity.
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full bg-neon text-basalt py-6 flex items-center justify-center gap-3 group hover:bg-white transition-all duration-300"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-[10px] tracking-[0.3em] font-black uppercase">Verify via Google</span>
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