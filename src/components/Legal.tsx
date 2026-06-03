import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Receipt, Scale, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] font-sans p-6 md:p-12 lg:p-16 flex flex-col justify-between transition-colors duration-500">
      {/* Top Bar Navigation */}
      <div className="max-w-7xl mx-auto w-full mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 px-5 py-2.5 border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all bg-[var(--color-bg-deep)]/50"
            aria-label="Return to homepage"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Back</span>
          </button>
          <div className="h-8 w-[1px] bg-[var(--color-border)] hidden md:block" />
          <div>
            <span className="text-[var(--color-accent)] text-[10px] uppercase tracking-[0.4em] font-medium block mb-0.5">Legal Protocol</span>
            <h1 className="text-2xl font-serif font-light tracking-wide uppercase text-[var(--color-text-primary)]">
              Monarchy Guidelines
            </h1>
          </div>
        </div>

        <div className="text-[10px] font-mono text-[var(--color-text-secondary)] uppercase tracking-widest text-left md:text-right leading-relaxed">
          v1.2.0 • Published May 2026
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-10 space-y-4">
            <p className="text-[10px] font-mono text-[var(--color-text-secondary)] uppercase tracking-[0.3em] font-medium px-2 pb-2 border-b border-[var(--color-border)] lg:block hidden">
              Select Document
            </p>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
              {sections.map((sect) => {
                const Icon = sect.icon;
                const isActive = activeSection === sect.id;
                return (
                  <button
                    key={sect.id}
                    onClick={() => setActiveSection(sect.id)}
                    className={`flex-shrink-0 flex items-center lg:w-full gap-4 p-4 border text-left transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-text-primary)] shadow-[0_0_20px_rgba(44,107,100,0.1)]"
                        : "bg-[var(--color-bg-deep)]/50 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <div className={`p-2 ${isActive ? "bg-[var(--color-accent)] text-[var(--color-bg)]" : "bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)]"}`}>
                      <Icon className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-medium">{sect.title}</p>
                      <p className="text-[9px] text-[var(--color-text-secondary)] font-mono tracking-tight">{sect.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Panel */}
        <div className="lg:col-span-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 md:p-12 min-h-[500px] transition-all duration-500">
          {activeSection === "refund" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
                <div>
                  <span className="text-[var(--color-accent)] text-[10px] font-mono uppercase tracking-[0.4em]">REFUND_HEIST_01</span>
                  <h2 className="text-3xl font-serif font-light uppercase text-[var(--color-text-primary)] mt-1">Refund Policy</h2>
                </div>
                <Receipt className="w-8 h-8 text-[var(--color-accent)] opacity-50 hidden md:block stroke-[1.5]" />
              </div>

              <div className="max-w-none text-[var(--color-text-secondary)] space-y-6 text-sm md:text-base leading-relaxed">
                <div>
                  <p className="border-l-2 border-[var(--color-accent)] pl-4 py-2 bg-[var(--color-accent)]/5 text-[var(--color-text-primary)] font-medium">
                    Effective Date: May 30, 2026. All digital interactions with Monarchy system assets and proprietary frameworks are strictly final.
                  </p>
                </div>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">1. Scope of Digital Asset Sales</h3>
                <p>
                  Monarchy governs highly customized digital diagnostics and real-time architectural evaluations of wardrobe matrices. We configure and supply instantly generated style diagnostics reports, tailor-made visual alignments, and algorithmic fashion recommendations based on user style DNA datasets.
                </p>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">2. strict All-Sales-Final Policy</h3>
                <p>
                  Because Monarchy products are direct virtual computations delivered immediately upon protocol payment, 
                  <strong className="text-[var(--color-text-primary)] font-medium"> any and all transactions are strictly final</strong>.
                </p>
                <ul className="list-disc pl-6 space-y-3 text-[var(--color-text-secondary)]">
                  <li>
                    <strong className="text-[var(--color-text-primary)] font-medium">Style Diagnostic Reports:</strong> Upon completion of the Style DNA processing core and vector synthesis, reports are rendered and delivered instantly to your profile. Returns or requests for refund are entirely prohibited under any subjective pretenses.
                  </li>
                  <li>
                    <strong className="text-[var(--color-text-primary)] font-medium">Tokyo Stylist AI Subscriptions:</strong> Instantaneous digital tokens are dynamically assigned once user authorization establishes premium recurring subscription sessions. There are no partial or full refunds allowed for any activated subscription billing periods.
                  </li>
                </ul>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">3. Recurring Subscription Cancellation</h3>
                <p>
                  While current and past billing cycles are entirely non-refundable, you maintain complete autonomous control over future charges. Users can cancel their recurring subscription at any time to prevent future automated billing. Access to premium Tokyo Stylist AI modules will continue until the expiration of the current actively paid cycle.
                </p>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">4. Contact & Discrepancies</h3>
                <p>
                  If you experience dynamic delivery failure (where reports fail to output in your Vault due to verifiable network infrastructure defects), you must submit coordinates to our support team within forty-eight (48) hours of purchase for technical resolution.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === "privacy" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
                <div>
                  <span className="text-[var(--color-accent)] text-[10px] font-mono uppercase tracking-[0.4em]">PRIVACY_HEIST_02</span>
                  <h2 className="text-3xl font-serif font-light uppercase text-[var(--color-text-primary)] mt-1">Privacy Policy</h2>
                </div>
                <ShieldCheck className="w-8 h-8 text-[var(--color-accent)] opacity-50 hidden md:block stroke-[1.5]" />
              </div>

              <div className="max-w-none text-[var(--color-text-secondary)] space-y-6 text-sm md:text-base leading-relaxed">
                <div>
                  <p className="border-l-2 border-[var(--color-accent)] pl-4 py-2 bg-[var(--color-accent)]/5 text-[var(--color-text-primary)] font-medium">
                    Your physical layout is yours. We execute cryptographic localized compression and strict data confinement policies.
                  </p>
                </div>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">1. Localized Image Processing</h3>
                <p>
                  For the initialization of your Style Diagnostic, Monarchy requests physical portraits or facial assets. To safeguard user security:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-[var(--color-text-secondary)]">
                  <li>
                    All uploaded images undergo <strong className="text-[var(--color-text-primary)] font-medium">localized client-side compression</strong> to minimize pixel transport footprints.
                  </li>
                  <li>
                    Image arrays are transmitted securely sole purpose of geometric alignment, color frequency diagnostic, and proportion metrics (<strong className="text-[var(--color-text-primary)] font-medium">Vision AI</strong> analysis).
                  </li>
                </ul>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">2. Zero Sale of Biometrics</h3>
                <p>
                  We explicitly operate under a zero-compromise framework:
                  <strong className="text-[var(--color-text-primary)] font-medium"> We do not sell or monetize biometric data, facial recognition keys, geometric matrix data, or user photos</strong> to advertisers, brokers, or external third-party aggregators under any circumstances.
                </p>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">3. Chat Transcript & Styling Logs</h3>
                <p>
                  Conversations and diagnostic chats generated with your virtual stylist, the "Tokyo Stylist", are stored in encrypted cloud baselines. This metadata is retained exclusively to maintain context memory, allowing the AI to recall previous fashion alignments.
                </p>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">4. Complete Erasure Protocol</h3>
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
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
                <div>
                  <span className="text-[var(--color-accent)] text-[10px] font-mono uppercase tracking-[0.4em]">TERMS_HEIST_03</span>
                  <h2 className="text-3xl font-serif font-light uppercase text-[var(--color-text-primary)] mt-1">Terms of Service</h2>
                </div>
                <Scale className="w-8 h-8 text-[var(--color-accent)] opacity-50 hidden md:block stroke-[1.5]" />
              </div>

              <div className="max-w-none text-[var(--color-text-secondary)] space-y-6 text-sm md:text-base leading-relaxed">
                <div>
                  <p className="border-l-2 border-[var(--color-accent)] pl-4 py-2 bg-[var(--color-accent)]/5 text-[var(--color-text-primary)] font-medium">
                    By initializing Monarchy systems, you authorize connection with autonomous artificial neural components.
                  </p>
                </div>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">1. AI Architectural Styling Disclaimers</h3>
                <p>
                  Our primary virtual assistant, the <strong className="text-[var(--color-text-primary)] font-medium">"Tokyo Stylist"</strong>, and all style diagnostic reports are generated and synthesized through machine learning models and Artificial Intelligence algorithms. 
                </p>
                <div className="p-5 bg-[var(--color-bg-deep)] border border-[var(--color-accent)]/30 text-xs text-[var(--color-text-secondary)] space-y-2">
                  <p className="text-[var(--color-accent)] font-medium tracking-wider uppercase font-mono">⚡ CRITICAL NOTICE:</p>
                  <p className="leading-relaxed">
                    All diagnostic measurements, color assessments, and stylistic matching outputs are presented for entertainment, aesthetic guidance, and personal inspirational purposes only.
                  </p>
                </div>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">2. Limitation of Styling Liability</h3>
                <p>
                  Stated layouts are intensely subjective. Monarchy is not liable or legally responsible for any subjective dissatisfaction, sensory misalignment, wardrobe misfit, or visual incompatibility resulting from style recommendations or generated wardrobe selections.
                </p>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">3. Prohibited Usage Terms</h3>
                <p>
                  You agree not to bypass backend safety filters, exploit Vision AI input configurations, scrape our catalog databases, or execute script injectors targeting system profiles. Any violation results in immediate extraction and de-authorization of your account.
                </p>

                <h3 className="text-base font-serif font-light text-[var(--color-accent)] uppercase tracking-wider mt-8">4. Governing Law and Jurisdiction</h3>
                <p>
                  These binding legal terms and all actions relating to user alignment with Monarchy shall be governed by, interpreted under, and resolved exclusively in accordance with the laws of the State of 
                  <strong className="text-[var(--color-text-primary)] font-medium font-sans"> Telangana, India</strong>, without regard to conflict of law principles. You hereby consent to the exclusive jurisdiction of courts situated in Hyderabad, Telangana, India.
                </p>
              </div>
            </motion.div>
          )}
        </div>

      </div>

      {/* Footer bar */}
      <footer className="max-w-7xl mx-auto w-full mt-24 border-t border-[var(--color-border)] pt-8 text-center text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.3em] space-y-1">
        <p>© 2026 MONARCHY INC. ALL RIGHTS RESERVED.</p>
        <p className="font-mono text-[8px] text-[var(--color-text-secondary)]/80">HYDERABAD JURISDICTION ACTIVE</p>
      </footer>
    </div>
  );
}