import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { cn, formatCurrency } from "../lib/utils";
import { ExternalLink, Camera, Sparkles, RefreshCcw, LayoutGrid, Scan, ChevronRight } from "lucide-react";
import { getAestheticIdentity } from "../logic/calculator";
// Gemini API is now handled via server proxy to fix browser-only key issues on Vercel
// import { GoogleGenAI } from "@google/genai";

interface VaultItem {
  id: string;
  brand_name: string;
  item_name: string;
  price: number;
  product_link: string;
  image_url: string;
  dna_vector: string | number[]; 
  category?: string;
  base_color?: string;
  item_finish?: string;
  design_type?: string;
  primary_pillar?: string;
  standardized_aesthetic_tags?: string[];
  similarity?: number;
}

interface VaultProps {
  userVector: [number, number, number, number];
  onSignOut?: () => void;
  onRetakeQuiz?: () => void;
}

type VaultTab = "recommendations" | "vision" | "batch";
type SortOrder = "recommended" | "price_asc" | "price_desc";

const CATEGORIES = [
  "all", "co-ords", "suits", "shirt", "pant", "shorts", 
  "t-shirt", "sweatshirt/hoodie", "jackets/coats", "footwear", "jewelry"
];

interface BatchedOutfit {
  base: VaultItem;
  matches: VaultItem[];
}

export default function Vault({ userVector, onSignOut, onRetakeQuiz }: VaultProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("recommendations");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recommended");
  const [allItems, setAllItems] = useState<VaultItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visionVector, setVisionVector] = useState<number[] | null>(null);
  const [visionTags, setVisionTags] = useState<string[]>([]);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [isBatching, setIsBatching] = useState(false);
  const [batchedOutfit, setBatchedOutfit] = useState<BatchedOutfit | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Credit & Auth State
  const [userProfile, setUserProfile] = useState<{ id: string, email: string, full_name: string, scan_credits: number, batch_credits: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const identity = getAestheticIdentity(userVector);

  // Helper: admin check
  const checkAdmin = (email: string) => email.toLowerCase() === "shravan.p1877@gmail.com";

  // Helper: Cosine Similarity / Dot Product since vectors are normalized
  const calculateSimilarity = (v1: number[], v2: number[]) => {
    if (!v1 || !v2 || v1.length !== v2.length) return 0;
    // For non-negative normalized vectors, the dot product is a strong similarity measure
    const dotProduct = v1.reduce((acc, val, i) => acc + (val * v2[i]), 0);
    return dotProduct;
  };

  const parseVector = (v: any): number[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v);
      } catch (e) {
        // If string but not JSON (e.g. "(0.1, 0.2...)")
        return v.replace(/[()\[\]]/g, '').split(',').map(Number);
      }
    }
    return [0.25, 0.25, 0.25, 0.25];
  };

  // 1. Fetch Profile and ALL items once
  useEffect(() => {
    async function initVault() {
      if (!supabase) {
        setError("Database Link Missing");
        setLoading(false);
        return;
      }
      
      try {
        // Fetch User Info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isUserAdmin = checkAdmin(user.email || "");
          setIsAdmin(isUserAdmin);

          let { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (pError || !profile) {
            const fullName = user.user_metadata?.full_name || "";
            // New User: Create Profile with defaults
            const newProfile = {
              id: user.id,
              email: user.email || "",
              full_name: fullName,
              scan_credits: 5,
              batch_credits: 8,
              style_dna: userVector
            };
            const { data: upserted, error: uError } = await supabase
              .from('profiles')
              .upsert(newProfile)
              .select()
              .single();
            
            if (!uError && upserted) {
              profile = upserted;
            }
          } else {
            // Update full_name if profile exists but name is missing and we have it in metadata
            if (!profile.full_name && user.user_metadata?.full_name) {
              const { data: updated } = await supabase
                .from('profiles')
                .update({ full_name: user.user_metadata.full_name })
                .eq('id', user.id)
                .select()
                .single();
              if (updated) profile = updated;
            }
            // Sync style_dna if missing in profile but present in local context (e.g. just finished quiz)
            if (!profile.style_dna && userVector) {
              await supabase.from('profiles').update({ style_dna: userVector }).eq('id', user.id);
            }
          }

          if (profile) {
            setUserProfile({
              id: profile.id,
              email: profile.email || user.email || "",
              full_name: profile.full_name || "",
              scan_credits: profile.scan_credits,
              batch_credits: profile.batch_credits
            });
          }
        }

        const { data, error: fetchError } = await supabase
          .from('vault')
          .select('id, brand_name, item_name, price, product_link, image_url, dna_vector, category, base_color, item_finish, design_type, primary_pillar, standardized_aesthetic_tags');

        if (fetchError) throw fetchError;
        setAllItems(data || []);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Vault sync failed.");
      } finally {
        setLoading(false);
      }
    }

    initVault();
  }, []);

  // 2. Correlation Logic: Triggered when data arrives, tab switches, or new vectors (quiz/vision) are set
  useEffect(() => {
    if (allItems.length === 0) return;

    let filtered = [...allItems];

    // Majority Pillar Logic Identification
    const pillarNames = ['old money', 'ivy', 'soft boy', 'streetwear'];
    const maxIndex = userVector.indexOf(Math.max(...userVector));
    const majorityPillar = pillarNames[maxIndex];

    if (activeTab === "vision" && visionVector) {
      // Vision Engine: Atmospheric Scan
      filtered = filtered.map(item => {
        const itemVector = parseVector(item.dna_vector);
        const similarity = calculateSimilarity(visionVector, itemVector);
        const itemTags = item.standardized_aesthetic_tags || [];
        const hasTagMatch = visionTags.length === 0 || itemTags.some(tag => visionTags.includes(tag.toLowerCase()));
        return { ...item, similarity, hasTagMatch };
      }).filter(item => item.hasTagMatch);
    } else if (activeTab === "recommendations") {
      // Recommendation Engine: Pillar Priority Guardrail
      filtered = filtered
        .filter(item => (item.primary_pillar || "").toLowerCase() === majorityPillar)
        .map(item => {
          const itemVector = parseVector(item.dna_vector);
          return {
            ...item,
            similarity: calculateSimilarity(userVector, itemVector)
          };
        });
    }

    // Category Filtering
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => (item.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sorting Logic
    if (sortOrder === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // Recommended (Monarchy Sort): Already prioritized by pillar, now sort by proximity
      filtered.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    }

    setDisplayedItems(filtered.slice(0, 100));
  }, [allItems, activeTab, userVector, visionVector, visionTags, selectedCategory, sortOrder]);

  const handleMatchAndBatch = async (item: VaultItem) => {
    // Credit Guard
    if (!isAdmin && (userProfile?.batch_credits || 0) <= 0) {
      setError("monarchy limit reached: zero batch credits remaining.");
      return;
    }

    setIsBatching(true);
    setLoading(true);
    setActiveTab("batch");
    try {
      const heroCategory = (item.category || "").toLowerCase();
      
      const CAT_TOPS = ["shirt", "t-shirt", "sweatshirt/hoodie", "jackets/coats", "tops", "upper"];
      const CAT_BOTTOMS = ["pant", "shorts", "bottoms", "lower", "trousers"];
      const CAT_FOOTWEAR = ["footwear", "shoes", "sneakers", "boots"];
      const CAT_SETS = ["co-ords", "suits", "set", "outfit"];
      const CAT_ACCESSORIES = ["jewelry", "jewlery", "accessories", "jewellery", "cap", "bag"];

      const DESIGN_TAGS = ["abstract", "acid", "argyle", "bengal", "block", "blocked", "camo", "check", "collar", "color", "contrast", "detailing", "distressed", "embossed", "embroidery", "floral", "geometric", "graphics", "heathered", "horizontal", "ink", "intarsia", "jacquard", "marled", "melange", "micro", "motif", "none", "ombre", "patchwork", "pattern", "patterned", "pinstripe", "piping", "plaid", "print", "screen", "solid", "stitching", "stripe", "stripes", "striping", "textured", "tweed", "vertical", "wash", "weave"];

      let targets: { name: string, list: string[] }[] = [];
      const isTop = CAT_TOPS.includes(heroCategory);
      const isBottom = CAT_BOTTOMS.includes(heroCategory);
      const isFootwear = CAT_FOOTWEAR.includes(heroCategory);
      const isSet = CAT_SETS.includes(heroCategory);

      if (isTop) {
        targets = [
          { name: "Bottoms", list: CAT_BOTTOMS },
          { name: "Footwear", list: CAT_FOOTWEAR },
          { name: "Accessories", list: CAT_ACCESSORIES }
        ];
      } else if (isBottom) {
        targets = [
          { name: "Tops", list: CAT_TOPS },
          { name: "Footwear", list: CAT_FOOTWEAR },
          { name: "Accessories", list: CAT_ACCESSORIES }
        ];
      } else if (isFootwear) {
        targets = [
          { name: "Tops", list: CAT_TOPS },
          { name: "Bottoms", list: CAT_BOTTOMS },
          { name: "Accessories", list: CAT_ACCESSORIES }
        ];
      } else if (isSet) {
        targets = [
          { name: "Footwear", list: CAT_FOOTWEAR },
          { name: "Accessories", list: CAT_ACCESSORIES }
        ];
      } else {
        targets = [
          { name: "Tops", list: CAT_TOPS },
          { name: "Bottoms", list: CAT_BOTTOMS },
          { name: "Footwear", list: CAT_FOOTWEAR }
        ];
      }

      const itemVector = parseVector(item.dna_vector);

      // Step A: Prediction with Design Thinking via Server Proxy
      const advicePrompt = `You are an elite wardrobe architect.
Hero Garment: ${item.brand_name} ${item.item_name}
Category: ${item.category}
Color: ${item.base_color}
Design Type: ${item.design_type || 'unspecified'}
Finish: ${item.item_finish || 'standard'}

Predict the ideal matching [Base Color] and [Design Type] for a cohesive 3-piece batch.
Target Pieces: ${targets.map(a => a.name).join(", ")}

Available Design Types: ${DESIGN_TAGS.join(", ")}

Return format:
TargetName|Color|DesignType
Example:
Tops|Navy|Solid
Footwear|White|None

Return ONLY the rows.`;

      const aiResponse = await fetch('/api/ai/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: advicePrompt })
      });
      
      const contentType = aiResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await aiResponse.text();
        console.error("Non-JSON response from batch AI:", text);
        throw new Error("System Identity Error: Neural link returned invalid data format.");
      }

      const { text: adviceText, error: aiError } = await aiResponse.json();
      if (aiError) throw new Error(aiError);

      const predictions = (adviceText || "").split("\n")
        .filter(line => line.includes("|"))
        .map(line => {
          const [name, color, type] = line.split("|").map(s => s.trim().toLowerCase());
          return { name, color, type };
        });

      // Step B: Mathematical Proximity Search
      const finalItems: VaultItem[] = [];
      const pool = allItems.filter(c => c.id !== item.id);

      for (const target of targets) {
        const prediction = predictions.find(p => p.name.includes(target.name.toLowerCase()));
        
        // Filter pool for this specific target category branch
        const candidates = pool.filter(p => target.list.some(cat => (p.category || "").toLowerCase().includes(cat)));

        if (candidates.length === 0) continue;

        // Scoring: 
        // 50% Vector Proximity
        // 30% Color Match
        // 20% Design Type Match
        const scored = candidates.map(c => {
          const vSim = calculateSimilarity(itemVector, parseVector(c.dna_vector));
          let colorScore = 0;
          let designScore = 0;

          if (prediction) {
            if ((c.base_color || "").toLowerCase().includes(prediction.color)) colorScore = 1;
            if ((c.design_type || "").toLowerCase() === prediction.type) designScore = 1;
          }

          const totalScore = (vSim * 0.5) + (colorScore * 0.3) + (designScore * 0.2);
          return { ...c, totalScore };
        });

        scored.sort((a, b) => b.totalScore - a.totalScore);
        if (scored[0]) finalItems.push(scored[0]);
      }

      setBatchedOutfit({ base: item, matches: finalItems });

      // Decrement Credits
      if (!isAdmin && userProfile) {
        const newCredits = userProfile.batch_credits - 1;
        await supabase?.from('profiles').update({ batch_credits: newCredits }).eq('id', userProfile.id);
        setUserProfile(prev => prev ? { ...prev, batch_credits: newCredits } : null);
      }
    } catch (err) {
      console.error("Batching failed:", err);
      setError("Outfit synthesis failed. Recalibrating style coordinates.");
    } finally {
      setIsBatching(false);
      setLoading(false);
    }
  };
  const handleVisionScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Credit Guard
    if (!isAdmin && (userProfile?.scan_credits || 0) <= 0) {
      setError("monarchy limit reached: zero scan credits remaining.");
      return;
    }

    setIsVisionScanning(true);
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const prompt = `
Act as an elite fashion analyst. Analyze the garment in the image and extract its style DNA and aesthetic markers. 

DEFINITIONS:
1. **Old Money (OM)**: Quiet luxury, neutral palettes, premium natural fabrics, tailored fits, zero visible logos.
2. **Ivy (IV)**: Collegiate heritage, Oxford shirts, cable-knits, loafers, rugby shirts, preppy academia.
3. **Soft Boy (SB)**: Artistic silhouettes, cardigans, vintage-washed denim, pastel/mori tones, creative layering.
4. **Streetwear (SW)**: Modern urban edge, graphic tees, hoodies, technical fabrics, chunky sneakers, bold branding.

INSTRUCTIONS:
1. Assign a weight (0.0 to 1.0) to each pillar [OM, IV, SB, SW]. Must sum to 1.0.
2. Identify 3-5 standardized aesthetic tags (e.g., minimalist, oversized, prep, utility, vintage, tailoring, heritage).

Return format:
DNA: [OM], [IV], [SB], [SW]
TAGS: tag1, tag2, tag3
`;

        const aiResponse = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, image: base64, mimeType: file.type || "image/jpeg" })
        });

        const contentType = aiResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await aiResponse.text();
          console.error("Non-JSON response from vision AI:", text);
          throw new Error("Vision hardware sync failure: Neural interface corrupted.");
        }

        const { text: visionText, error: aiError } = await aiResponse.json();
        if (aiError) throw new Error(aiError);

        const text = visionText || "";
        const dnaMatch = text.match(/DNA:\s*([\d.,\s]+)/);
        const tagsMatch = text.match(/TAGS:\s*([^\n]+)/);

        if (dnaMatch) {
          const vector = dnaMatch[1].split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
          if (vector.length === 4) setVisionVector(vector);
          
          if (tagsMatch) {
            const tags = tagsMatch[1].split(",").map(t => t.trim().toLowerCase());
            setVisionTags(tags);
          }

          setActiveTab("vision");

          // Decrement Credits
          if (!isAdmin && userProfile) {
            const newCredits = userProfile.scan_credits - 1;
            await supabase?.from('profiles').update({ scan_credits: newCredits }).eq('id', userProfile.id);
            setUserProfile(prev => prev ? { ...prev, scan_credits: newCredits } : null);
          }
        } else {
          throw new Error("Invalid style DNA format received.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Vision scan failed:", err);
      setError("Vision scan degraded. High-fidelity visual required.");
    } finally {
      setIsVisionScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-basalt min-h-screen">
      {/* Dynamic Header */}
      <div className="px-12 md:px-24 pt-16 pb-8 border-b border-neon/5 bg-basalt/30 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
          <h2 className="text-6xl md:text-8xl font-serif font-black text-neon tracking-tighter uppercase leading-none">
            {activeTab === "recommendations" ? "Atmosphere" : (activeTab === "batch" ? "Synthesis" : "Vision Scan")}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {userProfile && (
              <div className="flex gap-12 items-center">
                <button 
                  onClick={onRetakeQuiz}
                  className="hidden xl:block px-6 py-3 border border-neon/30 text-[10px] text-neon uppercase tracking-[0.4em] hover:bg-neon hover:text-basalt transition-all duration-500 font-black shadow-[0_0_20px_rgba(180,250,50,0.05)]"
                >
                  Re-calibrate DNA Map
                </button>
                <div className="hidden lg:block text-right pr-12 border-r border-neon/10">
                  <p className="text-[9px] text-neon/40 uppercase tracking-[0.4em] leading-none mb-3 font-black">Identity Verified</p>
                  <p className="text-sm font-black text-neon truncate max-w-[200px] tracking-tight">{userProfile.full_name || userProfile.email.split('@')[0]}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-neon/40 uppercase tracking-[0.4em] leading-none mb-3 font-black">Scan Credits</p>
                  <p className="text-xl font-mono font-black text-neon leading-none">{isAdmin ? "∞" : userProfile.scan_credits}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-neon/40 uppercase tracking-[0.4em] leading-none mb-3 font-black">Batch Credits</p>
                  <p className="text-xl font-mono font-black text-neon leading-none">{isAdmin ? "∞" : userProfile.batch_credits}</p>
                </div>
              </div>
            )}
            <button 
              onClick={onSignOut}
              className="p-4 border border-neon/10 bg-neon/5 hover:bg-neon/10 transition-colors rounded-full"
              title="De-authorize Identity"
            >
              <LayoutGrid className="w-6 h-6 text-neon/60 hover:text-neon" />
            </button>
          </div>
        </div>

        {/* Tab Switcher - Centered and Wider */}
        <div className="flex max-w-4xl mx-auto border-b border-neon/10 mb-12">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={cn(
              "flex-1 pb-6 text-xs font-black tracking-[0.5em] uppercase transition-all duration-500",
              activeTab === "recommendations" ? "text-neon border-b-4 border-neon" : "text-neon/20 hover:text-neon/50"
            )}
          >
            DNA Match
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={cn(
              "flex-1 pb-6 text-xs font-black tracking-[0.5em] uppercase transition-all duration-500",
              activeTab === "batch" ? "text-neon border-b-4 border-neon" : "text-neon/20 hover:text-neon/50"
            )}
          >
            Batch Synthesis
          </button>
          <button
            onClick={() => setActiveTab("vision")}
            className={cn(
              "flex-1 pb-6 text-xs font-black tracking-[0.5em] uppercase transition-all duration-500",
              activeTab === "vision" ? "text-neon border-b-4 border-neon" : "text-neon/20 hover:text-neon/50"
            )}
          >
            Vision Output
          </button>
        </div>

        {/* Global Controls: Filters & Sort - Scaled Up */}
        {(activeTab === "recommendations" || (activeTab === "vision" && visionVector)) && (
          <div className="max-w-7xl mx-auto space-y-8 mb-12">
            <div className="flex flex-wrap justify-center gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] border transition-all duration-500",
                    selectedCategory === cat 
                      ? "bg-neon text-basalt border-neon shadow-[0_0_20px_rgba(180,250,50,0.2)]" 
                      : "text-neon/40 border-neon/10 hover:border-neon/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { id: "recommended", label: "Neural Proximity Sort" },
                { id: "price_asc", label: "Value Calibration (Low-High)" },
                { id: "price_desc", label: "Value Calibration (High-Low)" }
              ].map(sort => (
                <button
                  key={sort.id}
                  onClick={() => setSortOrder(sort.id as SortOrder)}
                  className={cn(
                    "px-10 py-4 text-[9px] font-black uppercase tracking-[0.4em] border transition-all duration-500",
                    sortOrder === sort.id 
                      ? "bg-neon/10 text-neon border-neon/40" 
                      : "text-neon/20 border-neon/5 hover:border-neon/20"
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-12 md:px-24 py-20 bg-basalt">
        <div className="max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "batch" ? (
              <motion.div
                key="batch-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-16"
              >
                {isBatching ? (
                  <div className="py-40 text-center space-y-10">
                    <div className="flex justify-center">
                      <RefreshCcw className="w-16 h-16 text-neon animate-spin" />
                    </div>
                    <p className="text-neon text-sm uppercase tracking-[1em] font-black">Neural Link: Calibrating Style Batch...</p>
                  </div>
                ) : batchedOutfit ? (
                  <div className="space-y-24">
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-black text-neon/40 uppercase tracking-[0.8em] mb-12">Foundation Unit</p>
                      <div className="relative group">
                        <img src={batchedOutfit.base.image_url} className="w-80 h-[480px] object-cover border border-neon/20 group-hover:border-neon/50 transition-all duration-1000 shadow-[0_0_100px_rgba(180,250,50,0.05)]" />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-neon text-basalt px-10 py-5 text-xs font-black uppercase tracking-[0.4em] whitespace-nowrap shadow-2xl">
                          Selected Anchor
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      {batchedOutfit.matches.map(item => (
                        <div key={item.id} className="bg-neon/5 border border-neon/10 p-8 flex flex-col items-center hover:border-neon/30 transition-all duration-700">
                          <img src={item.image_url} className="w-full h-[400px] object-cover mb-8 shadow-xl" />
                          <p className="text-[10px] font-black text-neon/40 uppercase tracking-[0.5em] mb-3 leading-none italic">{item.brand_name}</p>
                          <h6 className="text-xl font-serif font-black text-neon uppercase mb-4 text-center tracking-tight leading-none">{item.item_name}</h6>
                          <div className="w-12 h-[1px] bg-neon/20 mb-4" />
                          <p className="text-[11px] font-mono text-neon/60 uppercase tracking-widest">{item.category}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-10 mt-20">
                      <button 
                        onClick={() => handleMatchAndBatch(batchedOutfit.base)}
                        className="px-16 py-8 border-2 border-neon text-neon text-xs font-black uppercase tracking-[0.6em] hover:bg-neon hover:text-basalt transition-all duration-700 shadow-[0_0_40px_rgba(180,250,50,0.1)] flex items-center gap-4"
                        disabled={isBatching}
                      >
                        <RefreshCcw className={cn("w-5 h-5", isBatching && "animate-spin")} />
                        Recalculate Combo
                      </button>
                      <button 
                        onClick={() => setBatchedOutfit(null)}
                        className="px-16 py-8 border-2 border-neon/20 text-neon/40 text-xs font-black uppercase tracking-[0.6em] hover:bg-neon/5 hover:text-neon transition-all duration-700"
                      >
                        Reset Matrix
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-40 text-center border-4 border-dashed border-neon/5 rounded-[40px]">
                    <Sparkles className="w-20 h-20 text-neon/10 mx-auto mb-10" />
                    <h3 className="text-3xl font-serif font-black text-neon/40 mb-6 uppercase tracking-tighter">Outfit Synthesis Engine</h3>
                    <p className="text-neon/30 text-xs md:text-sm uppercase tracking-[0.5em] leading-loose max-w-2xl mx-auto font-bold italic">
                      Select a 'Hero' from your vault. <br />
                      AI neural matching will architect a complete 3-piece atmosphere.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : activeTab === "vision" && !visionVector && !isVisionScanning ? (
              <motion.div
                key="vision-upload"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-40 flex flex-col items-center justify-center text-center border-4 border-dashed border-neon/5 rounded-[40px] bg-neon/[0.02]"
              >
                <div className="w-32 h-32 bg-neon/10 rounded-full flex items-center justify-center mb-10 border border-neon/30 shadow-[0_0_60px_rgba(180,250,50,0.1)]">
                  <Camera className="text-neon w-12 h-12" />
                </div>
                <h3 className="text-5xl font-serif font-black text-neon mb-6 uppercase tracking-tighter">Optical Aesthetic Scan</h3>
                <p className="text-limestone text-xs md:text-sm uppercase tracking-[0.5em] font-bold leading-loose max-w-2xl mb-16 italic">
                  Analyzing vibes, not patterns. Upload visual data to isolate 100 synchronized items across our global network.
                </p>
                <label className="bg-neon text-basalt px-16 py-8 font-black text-xs uppercase tracking-[1em] cursor-pointer hover:bg-white transition-all duration-1000 shadow-2xl">
                  Connect Optics
                  <input type="file" accept="image/*" className="hidden" onChange={handleVisionScan} />
                </label>
              </motion.div>
            ) : (
              <motion.div
                key="items-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-16"
              >
                {/* Profile Context for DNA Match */}
                {activeTab === "recommendations" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-20 p-12 bg-neon/[0.03] border border-neon/10 rounded-[20px] shadow-2xl flex flex-col md:flex-row items-center gap-12"
                  >
                    <div className="flex-1 space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-neon animate-pulse" />
                        <span className="text-xs font-black text-neon tracking-[0.6em] uppercase">Neural Signal Latency: 4ms</span>
                      </div>
                      <h4 className="text-6xl md:text-8xl font-serif font-black text-white uppercase tracking-tighter leading-none">{identity.name}</h4>
                      <p className="text-sm md:text-base text-neon/40 uppercase tracking-[0.4em] leading-relaxed font-bold italic max-w-3xl">
                        Vault parameters optimized. Dominant neural pillar: <span className="text-neon">{identity.primary}</span>. Secondary nodes shifting between <span className="text-neon">{identity.secondary}</span>. 
                      </p>
                    </div>
                    <div className="flex gap-16 border-l border-neon/10 pl-16">
                      <div className="text-center">
                        <p className="text-[10px] text-neon/30 uppercase tracking-[0.5em] font-black mb-4 italic">Primary</p>
                        <p className="text-2xl font-black text-neon uppercase tracking-tighter">{identity.primary}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-neon/30 uppercase tracking-[0.5em] font-black mb-4 italic">Secondary</p>
                        <p className="text-2xl font-black text-neon uppercase tracking-tighter">{identity.secondary}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {loading && allItems.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="h-96 bg-neon/5 animate-pulse border border-neon/10 rounded-xl" />
                    ))}
                  </div>
                ) : displayedItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20">
                    {displayedItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.01 }}
                        className="group flex flex-col"
                      >
                        <div className="w-full aspect-[3/4] bg-neon/10 flex-shrink-0 relative overflow-hidden mb-8 border border-neon/5 group-hover:border-neon/30 transition-all duration-700 shadow-xl">
                          <img 
                            src={item.image_url} 
                            alt={item.item_name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[1500ms]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 left-4 bg-basalt/80 backdrop-blur-md text-neon text-[9px] font-black px-3 py-1 tracking-[0.2em] border border-neon/20">
                            COORD_{Math.round((item.similarity || 0) * 100)}
                          </div>
                          
                          {/* Hover Controls Overlay */}
                          <div className="absolute inset-0 bg-basalt/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-6 backdrop-blur-sm">
                            <a 
                              href={item.product_link} 
                              target="_blank" 
                              className="w-14 h-14 bg-neon text-basalt rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                            >
                              <ExternalLink className="w-6 h-6" />
                            </a>
                            <button 
                              onClick={() => handleMatchAndBatch(item)}
                              className="w-14 h-14 bg-white text-basalt rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                              title="Synthesis Hub"
                            >
                              <Sparkles className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center">
                          <p className="text-[10px] font-black text-neon/40 uppercase tracking-[0.6em] mb-3 italic">{item.brand_name || "Nexus Unit"}</p>
                          <h5 className="text-xl md:text-2xl font-serif font-black text-neon leading-none tracking-tighter mb-4 uppercase">{item.item_name}</h5>
                          <div className="flex flex-col items-center gap-4">
                            <span className="text-lg font-mono text-neon font-bold tracking-tighter">
                              {formatCurrency(item.price)}
                            </span>
                            <div className="w-10 h-[1px] bg-neon/10 group-hover:w-full transition-all duration-1000" />
                            <p className="text-[10px] text-neon/20 uppercase tracking-[0.3em] font-black">{item.category}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-40 text-center space-y-10">
                    <p className="text-neon/30 text-2xl uppercase tracking-[1em] italic font-black">{error || "Signal Exhausted. Vault Empty."}</p>
                    <div className="flex justify-center">
                      <RefreshCcw className="w-12 h-12 text-neon/10 animate-spin-slow" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action / Scanners - Fixed Positioned relative to screen */}
      {activeTab === "recommendations" && (
        <div className="fixed bottom-12 right-12 z-[100]">
          <label className="w-24 h-24 bg-neon rounded-full shadow-[0_0_50px_rgba(180,250,50,0.4)] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-500 active:scale-95 group relative">
            <div className="absolute inset-0 rounded-full border-2 border-neon animate-ping opacity-20" />
            <Scan className="text-basalt w-10 h-10" />
            <div className="absolute -top-12 right-0 bg-basalt border border-neon/30 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <span className="text-[10px] text-neon font-black tracking-[0.3em] uppercase">Atmospheric Scan</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleVisionScan} />
          </label>
        </div>
      )}
    </div>
  );
}