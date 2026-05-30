import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Receipt, Scale, ArrowLeft, Trash2, HelpCircle } from "lucide-react";

interface LegalProps {
  initialSection?: "refund" | "privacy" | "terms";
  onBack: () => void;
}

export default function Legal({ initialSection = "refund", onBack }: LegalProps) {
  const [activeSection, setActiveSection] = useState<"refund" | "privacy" | "terms">(initialSection);

  const sections = [
    {
      id: "refund" as const,
      title: "Refund Policy",
      subtitle: "Digital Goods & Finality",
      icon: Receipt,
    },
    {
      id: "privacy" as const,
      title: "Privacy Policy",
      subtitle: "Biometrics & Local Vision AI",
      icon: ShieldCheck,
    },
    {
      id: "terms" as const,
      title: "Terms of Service",
      subtitle: "AI Styling Disclaimers & Law",
      icon: Scale,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F2] font-sans selection:bg-neon/30 p-6 md:p-12 lg:p-16 flex flex-col justify-between">
      {/* Top Bar Navigation */}
      <div className="max-w-7xl mx-auto w-full mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#025043]/20 pb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 px-4 py-2 border border-white/10 hover:border-neon rounded-full text-limestone hover:text-neon transition-all bg-white/5"
            aria-label="Return to system"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Escape Page</span>
          </button>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
          <div>
            <span className="text-neon text-[9px] uppercase tracking-[0.4em] font-black block mb-0.5">Core Protocol</span>
            <h1 className="text-2xl font-serif font-black tracking-wider uppercase text-[#ffffff]">
              HEIST. LEGAL COORD
            </h1>
          </div>
        </div>

        <div className="text-[10px] font-mono text-[#e0e0e0]/40 uppercase tracking-widest text-left md:text-right">
          STATUS: AUTHORIZED SECURE CHANNEL<br />
          NODE_ID: HEIST_LEG_v1.0.4
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Navigation Sidebar / Mob Top Nav */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-10 space-y-3">
            <p className="text-[10px] font-mono text-[#e0e0e0]/35 uppercase tracking-[0.3em] font-black px-2 pb-1 border-b border-white/5 lg:block hidden">
              SELECT DOCUMENTATION
            </p>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
              {sections.map((sect) => {
                const Icon = sect.icon;
                const isActive = activeSection === sect.id;
                return (
                  <button
                    key={sect.id}
                    onClick={() => setActiveSection(sect.id)}
                    className={`flex-shrink-0 flex items-center lg:w-full gap-4 p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-[#025043]/25 border-neon text-neon shadow-[0_0_20px_rgba(2,80,67,0.15)]"
                        : "bg-white/5 border-white/10 text-limestone hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? "bg-neon text-basalt" : "bg-white/5 text-limestone"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-black uppercase tracking-wider">{sect.title}</p>
                      <p className="text-[9px] filter brightness-75 font-mono tracking-tight">{sect.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 space-y-4 lg:block hidden">
              <div className="flex items-center gap-2 text-neon text-[10px] font-black uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" /> SYSTEM SUMMARY
              </div>
              <p className="text-xs text-limestone leading-relaxed">
                You are currently viewing binding stylistic frameworks governing HEIST. AI subsystems, purchases, and facial matrix operations.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Panel */}
        <div className="lg:col-span-3 bg-[#151515] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_12px_48px_rgba(0,0,0,0.6)] min-h-[500px]">
          {activeSection === "refund" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-neon text-[10px] font-black uppercase tracking-[0.4em]">DOCUMENT REFUND_HEIST_01</span>
                  <h2 className="text-3xl font-serif font-black uppercase text-[#ffffff]">Refund Policy</h2>
                </div>
                <Receipt className="w-8 h-8 text-neon opacity-70 hidden md:block" />
              </div>

              <div className="prose prose-invert max-w-none text-limestone space-y-6 text-sm lg:text-base leading-relaxed">
                <div>
                  <p className="font-bold text-[#ffffff] border-l-2 border-neon pl-4 py-1 bg-neon/10">
                    Effective Date: May 30, 2026. All digital interactions with HEIST. system assets and proprietary frameworks are strictly final.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">1. Scope of Digital Asset Sales</h3>
                <p>
                  HEIST. governs highly customized digital diagnostics and real-time architectural evaluations of wardrobe matrices. We configure and supply instantly generated style diagnostics reports, tailor-made visual alignments, and algorithmic fashion recommendations based on user style DNA datasets.
                </p>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">2. strict All-Sales-Final Policy</h3>
                <p>
                  Because HEIST. products are direct virtual computations delivered immediately upon protocol payment, 
                  <strong className="text-[#ffffff]"> any and all transactions are strictly final</strong>.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#e0e0e0]">
                  <li>
                    <strong className="text-neon">Style Diagnostic Reports:</strong> Upon completion of the Style DNA processing core and vector synthesis, reports are rendered and delivered instantly to your profile. Returns or requests for refund are entirely prohibited under any subjective pretenses.
                  </li>
                  <li>
                    <strong className="text-neon">Tokyo Stylist AI Subscriptions:</strong> Instantaneous digital tokens are dynamically assigned once user authorization establishes premium recurring subscription sessions. There are no partial or full refunds allowed for any activated subscription billing periods.
                  </li>
                </ul>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">3. Recurring Subscription Cancellation</h3>
                <p>
                  While current and past billing cycles are entirely non-refundable, you maintain complete autonomous control over future charges. Users can cancel their recurring subscription at any time to prevent future automated billing. Access to premium Tokyo Stylist AI modules will continue until the expiration of the current actively paid cycle.
                </p>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">4. Contact & Discrepancies</h3>
                <p>
                  If you experience dynamic node delivery failure (where reports fail to output in your Vault due to verifiable network infrastructure defects), you must submit coordinates to our support team within forty-eight (48) hours of purchase for technical resolution.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === "privacy" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-neon text-[10px] font-black uppercase tracking-[0.4em]">DOCUMENT PRIVACY_HEIST_02</span>
                  <h2 className="text-3xl font-serif font-black uppercase text-[#ffffff]">Privacy Policy</h2>
                </div>
                <ShieldCheck className="w-8 h-8 text-neon opacity-70 hidden md:block" />
              </div>

              <div className="prose prose-invert max-w-none text-limestone space-y-6 text-sm lg:text-base leading-relaxed">
                <div>
                  <p className="font-bold text-[#ffffff] border-l-2 border-neon pl-4 py-1 bg-neon/10">
                    Your physical layout is yours. We execute cryptographic localized compression and strict data confinement policies.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">1. Localized Image Processing</h3>
                <p>
                  For the initialization of your Style Diagnostic, HEIST. requests physical portraits or facial assets. To safeguard user security:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#e0e0e0]">
                  <li>
                    All uploaded images undergo <strong className="text-neon">localized client-side compression</strong> to minimize pixel transport footprints.
                  </li>
                  <li>
                    Image arrays are transmitted securely using high-grade Transport Layer Security (TLS) solely for the purpose of geometric alignment, color frequency diagnostic, and proportion metrics (<strong className="text-white font-bold">Vision AI</strong> analysis).
                  </li>
                </ul>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">2. Zero Sale of Biometrics</h3>
                <p>
                  HEIST. explicitly operates under a zero-compromise framework:
                  <strong className="text-neon"> We do not sell or monetize biometric data, facial recognition keys, geometric matrix data, or user photos</strong> to advertisers, brokers, or external third-party aggregators under any circumstances.
                </p>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">3. Chat Transcript & Styling Logs</h3>
                <p>
                  Conversations and diagnostic chats generated with your virtual stylist, the "Tokyo Stylist", are stored in encrypted cloud baselines. This metadata is retained exclusively to maintain context memory, allowing the AI to recall previous fashion alignments.
                </p>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">4. Complete Erasure Protocol</h3>
                <p>
                  We recognize your absolute sovereign ownership of personal credentials. Users can request account and data deletion at any time. Upon receiving a valid erasure directive, we permanently purge your credentials, style vector maps, uploaded image traces, and chat transcripts from our active databases.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === "terms" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-neon text-[10px] font-black uppercase tracking-[0.4em]">DOCUMENT TERMS_HEIST_03</span>
                  <h2 className="text-3xl font-serif font-black uppercase text-[#ffffff]">Terms of Service</h2>
                </div>
                <Scale className="w-8 h-8 text-neon opacity-70 hidden md:block" />
              </div>

              <div className="prose prose-invert max-w-none text-limestone space-y-6 text-sm lg:text-base leading-relaxed">
                <div>
                  <p className="font-bold text-[#ffffff] border-l-2 border-neon pl-4 py-1 bg-neon/10">
                    By initializing HEIST. systems, you authorize connection with autonomous artificial neural components.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">1. AI Architectural Styling Disclaimers</h3>
                <p>
                  Our primary virtual assistant, the <strong className="text-neon">"Tokyo Stylist"</strong>, and all style diagnostic reports are generated and synthesized through machine learning models and Artificial Intelligence algorithms. 
                </p>
                <div className="p-4 bg-white/5 border border-neon/25 text-xs text-[#e0e0e0] uppercase tracking-wider font-mono space-y-2">
                  <p className="text-neon font-black">⚡ CRITICAL INTEL NOTICE:</p>
                  <p>
                    All diagnostic measurements, color assessments, and stylistic matching outputs are presented for entertainment, aesthetic guidance, and personal inspirational purposes only.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">2. Limitation of Styling Liability</h3>
                <p>
                  Stated layout aesthetics are intensely subjective. HEIST. is not liable or legally responsible for any subjective dissatisfaction, sensory misalignment, wardrobe misfit, or visual incompatibility resulting from style recommendations or generated wardrobe selections.
                </p>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">3. Prohibited Usage Terms</h3>
                <p>
                  You agree not to bypass backend safety guardrolls, exploit Vision AI input configurations, scrape our catalog databases, or execute script injectors targeting system profiles. Any violation results in immediate extraction and de-authorization of your Neural node.
                </p>

                <h3 className="text-lg font-bold text-[#ffffff] uppercase tracking-wider mt-6">4. Governing Law and Jurisdiction</h3>
                <p>
                  These binding legal terms and all actions relating to user alignment with HEIST. shall be governed by, interpreted under, and resolved exclusively in accordance with the laws of the State of 
                  <strong className="text-neon"> Telangana, India</strong>, without regard to conflict of law principles. You hereby consent to the exclusive jurisdiction of courts situated in Hyderabad, Telangana, India.
                </p>
              </div>
            </motion.div>
          )}
        </div>

      </div>

      {/* Footer bar */}
      <footer className="max-w-7xl mx-auto w-full mt-12 border-t border-white/5 pt-6 text-center text-[10px] text-limestone/40 uppercase tracking-[0.3em] space-y-2">
        <p>© 2026 HEIST. INC. ALL HEISTS PROTOCOL RESERVED.</p>
        <p className="text-[8px]">TELANGANA JURISDICTION NODE ACTIVE</p>
      </footer>
    </div>
  );
}