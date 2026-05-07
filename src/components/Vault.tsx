import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { cn, formatCurrency } from "../lib/utils";
import { ExternalLink, Camera, Sparkles, RefreshCcw, LayoutGrid, Scan, ChevronRight } from "lucide-react";
import { getAestheticIdentity } from "../logic/calculator";
import { GoogleGenAI } from "@google/genai";

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
  primary_pillar?: string;
  standardized_aesthetic_tags?: string[];
  similarity?: number;
}

interface VaultProps {
  userVector: [number, number, number, number];
}

type VaultTab = "recommendations" | "vision" | "batch";
type SortOrder = "recommended" | "price_asc" | "price_desc";

const CATEGORIES = [
  "all", "co-ords", "suits", "shirt", "pant", "shorts", 
  "t-shirt", "sweatshirt/hoodie", "jackets/coats", "footwear", "jewlery"
];

interface BatchedOutfit {
  base: VaultItem;
  matches: VaultItem[];
}

export default function Vault({ userVector }: VaultProps) {
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

  const identity = getAestheticIdentity(userVector);

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

  // 1. Fetch ALL items once
  useEffect(() => {
    async function fetchVault() {
      if (!supabase) {
        setError("Database Link Missing");
        setLoading(false);
        return;
      }
      
      try {
        const { data, error: fetchError } = await supabase
          .from('vault')
          .select('id, brand_name, item_name, price, product_link, image_url, dna_vector, category, base_color, item_finish, primary_pillar, standardized_aesthetic_tags');

        if (fetchError) throw fetchError;
        setAllItems(data || []);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Vault sync failed.");
      } finally {
        setLoading(false);
      }
    }

    fetchVault();
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
    setIsBatching(true);
    setLoading(true);
    setActiveTab("batch");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const heroCategory = (item.category || "").toLowerCase();
      
      const CAT_TOPS = ["jackets/coats", "t-shirt", "sweatshirt/hoodie", "shirt", "outerwear", "tops", "jacket", "knitwear"];
      const CAT_BOTTOMS = ["pant", "shorts", "pants", "bottoms", "trouser", "trousers"];
      const CAT_FULL = ["co-ords", "suits", "co-ord", "suit"];
      const CAT_FOOTWEAR = ["footwear", "shoes", "sneakers", "loafers", "boots"];
      const CAT_JEWELRY = ["jewelry", "jewellery", "accessory", "accessories", "chain", "watch", "ring"];

      let targets: { name: string, list: string[] }[] = [];
      if (CAT_BOTTOMS.some(c => heroCategory.includes(c))) {
        targets = [{ name: "Tops", list: CAT_TOPS }, { name: "Footwear", list: CAT_FOOTWEAR }, { name: "Jewelry", list: CAT_JEWELRY }];
      } else if (CAT_TOPS.some(c => heroCategory.includes(c))) {
        targets = [{ name: "Bottoms", list: CAT_BOTTOMS }, { name: "Footwear", list: CAT_FOOTWEAR }, { name: "Jewelry", list: CAT_JEWELRY }];
      } else if (CAT_FULL.some(c => heroCategory.includes(c))) {
        targets = [{ name: "Footwear", list: CAT_FOOTWEAR }, { name: "Jewelry", list: CAT_JEWELRY }];
      } else {
        targets = [{ name: "Tops", list: CAT_TOPS }, { name: "Bottoms", list: CAT_BOTTOMS }, { name: "Footwear", list: CAT_FOOTWEAR }];
      }

      const itemVector = parseVector(item.dna_vector);

      // Step A: Harmonic Logic Prediction
      const advicePrompt = `Hero: ${item.brand_name} ${item.item_name} (Color: ${item.base_color}, Finish: ${item.item_finish || 'standard'}).
      Predict ideal matching base_color for: ${targets.map(a => a.name).join(", ")}.
      Return ONLY comma-separated colors.`;

      const adviceResult = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: advicePrompt }] }]
      });

      const colors = (adviceResult.text || "").split(",").map(c => c.trim().toLowerCase());

      // Step B: Proximity & Harmony Selection
      const pool = allItems.filter(c => c.id !== item.id).slice(0, 100);
      const selectionPrompt = `Selected items must align with Hero DNA and maintain texture harmony (${item.item_finish || 'standard'}).
      Hero: ${item.brand_name} ${item.item_name}.
      Candidates:
      ${pool.map((c, i) => `${i}: ${c.brand_name} ${c.item_name} [${c.category}, ${c.base_color}, ${c.item_finish || 'standard'}]`).join("\n")}
      
      Pick the absolute BEST match for each: ${targets.map(a => a.name).join(", ")}.
      Return ONLY indices, comma-separated.`;

      const finalResult = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: selectionPrompt }] }]
      });

      const indices = (finalResult.text || "").split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      const finalItems = indices.map(idx => pool[idx]).filter(Boolean).slice(0, targets.length);

      setBatchedOutfit({ base: item, matches: finalItems });
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

    setIsVisionScanning(true);
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
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

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } }
              ]
            }
          ]
        });

        const text = response.text || "";
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
    <div className="flex flex-col h-full bg-basalt">
      {/* Dynamic Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-serif font-black text-neon tracking-tighter uppercase">
            {activeTab === "recommendations" ? "Your DNA" : "Vision Scan"}
          </h2>
          <div className="p-2 border border-limestone/20 bg-moss/20">
            <LayoutGrid className="w-4 h-4 text-neon/40" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-limestone/10 mb-8">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={cn(
              "flex-1 pb-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300",
              activeTab === "recommendations" ? "text-neon border-b-2 border-neon" : "text-limestone"
            )}
          >
            DNA Match
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={cn(
              "flex-1 pb-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300",
              activeTab === "batch" ? "text-neon border-b-2 border-neon" : "text-limestone"
            )}
          >
            Batch
          </button>
          <button
            onClick={() => setActiveTab("vision")}
            className={cn(
              "flex-1 pb-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300",
              activeTab === "vision" ? "text-neon border-b-2 border-neon" : "text-limestone"
            )}
          >
            Vision Results
          </button>
        </div>

        {/* Global Controls: Filters & Sort */}
        {(activeTab === "recommendations" || (activeTab === "vision" && visionVector)) && (
          <div className="space-y-4 mb-8">
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 text-[8px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                    selectedCategory === cat 
                      ? "bg-neon text-basalt border-neon" 
                      : "text-limestone/60 border-limestone/10 hover:border-limestone/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              {[
                { id: "recommended", label: "Monarchy Sort" },
                { id: "price_asc", label: "Price Low-High" },
                { id: "price_desc", label: "Price High-Low" }
              ].map(sort => (
                <button
                  key={sort.id}
                  onClick={() => setSortOrder(sort.id as SortOrder)}
                  className={cn(
                    "flex-1 py-3 text-[7px] font-bold uppercase tracking-widest border transition-all",
                    sortOrder === sort.id 
                      ? "bg-moss/40 text-neon border-neon/30" 
                      : "text-limestone/40 border-limestone/5 hover:border-limestone/20"
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === "batch" ? (
            <motion.div
              key="batch-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {isBatching ? (
                <div className="py-20 text-center space-y-4">
                  <div className="flex justify-center">
                    <RefreshCcw className="w-8 h-8 text-neon animate-spin" />
                  </div>
                  <p className="text-neon text-[10px] uppercase tracking-[0.3em] font-black">Calibrating Style Batch...</p>
                </div>
              ) : batchedOutfit ? (
                <div className="space-y-12">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-limestone uppercase tracking-[0.4em] mb-4">Curated Foundation</p>
                    <div className="inline-block relative">
                      <img src={batchedOutfit.base.image_url} className="w-48 h-64 object-cover border border-neon/30" />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-neon text-basalt px-4 py-2 text-[10px] font-black uppercase whitespace-nowrap">
                        Primary Selection
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {batchedOutfit.matches.map(item => (
                      <div key={item.id} className="bg-moss/10 border border-limestone/10 p-4">
                        <img src={item.image_url} className="w-full h-40 object-cover mb-4" />
                        <p className="text-[8px] font-black text-limestone uppercase mb-1">{item.brand_name}</p>
                        <h6 className="text-[10px] font-serif font-black text-neon uppercase mb-2">{item.item_name}</h6>
                        <p className="text-[9px] font-mono text-neon/60">{item.category}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleMatchAndBatch(batchedOutfit.base)}
                      className="flex items-center justify-center gap-3 border border-neon text-neon py-4 text-[10px] font-black uppercase tracking-widest hover:bg-neon hover:text-basalt transition-all group"
                      disabled={isBatching}
                    >
                      <RefreshCcw className={cn("w-4 h-4", isBatching && "animate-spin")} />
                      Regenerate Combo
                    </button>
                    <button 
                      onClick={() => setBatchedOutfit(null)}
                      className="border border-limestone/30 text-limestone py-4 text-[10px] font-black uppercase tracking-widest hover:bg-limestone/10 transition-all"
                    >
                      Reset Pipeline
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-limestone/10">
                  <Sparkles className="w-8 h-8 text-limestone/20 mx-auto mb-4" />
                  <p className="text-limestone text-[9px] uppercase tracking-widest leading-loose max-w-[280px] mx-auto">
                    The ultimate combo. Select a 'Hero' item and we’ll instantly build a 3-piece Batch for you using AI color theory and texture matching.
                  </p>
                </div>
              )}
            </motion.div>
          ) : activeTab === "vision" && !visionVector && !isVisionScanning ? (
            <motion.div
              key="vision-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-limestone/10 rounded-lg"
            >
              <div className="w-16 h-16 bg-graphite rounded-full flex items-center justify-center mb-6 shadow-neon/20 shadow-lg">
                <Camera className="text-neon w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-black text-neon mb-2 uppercase tracking-tighter">Aesthetic Scan</h3>
              <p className="text-limestone text-[9px] uppercase tracking-widest leading-loose max-w-[260px] mb-8">
                Curating vibes, not clones. Upload any photo to find 100 pieces with the same atmosphere as your inspiration.
              </p>
              <label className="bg-neon text-basalt px-8 py-4 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-white transition-colors">
                Select Hardware
                <input type="file" accept="image/*" className="hidden" onChange={handleVisionScan} />
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="items-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Profile Context for DNA Match */}
              {activeTab === "recommendations" && (
                <div className="mb-8 p-6 bg-moss/20 border border-limestone/10">
                  <p className="text-[9px] text-limestone/60 uppercase tracking-widest leading-relaxed mb-4 italic">
                    This is your personal vault. We prioritize your Majority Pillar to show you 100 items that mathematically fit your style archetype.
                  </p>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-bold text-neon tracking-widest uppercase">Identity Profile</span>
                    <Sparkles className="w-3 h-3 text-neon/40" />
                  </div>
                  <h4 className="text-2xl font-serif font-black text-white uppercase tracking-tighter mb-2">{identity.name}</h4>
                  <div className="flex gap-4">
                    <div className="text-[9px] text-limestone uppercase tracking-tighter">
                      PRM: <span className="text-neon">{identity.primary}</span>
                    </div>
                    <div className="text-[9px] text-limestone uppercase tracking-tighter">
                      SEC: <span className="text-neon">{identity.secondary}</span>
                    </div>
                  </div>
                </div>
              )}

              {loading && allItems.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-moss/10 animate-pulse border border-limestone/5" />
                  ))}
                </div>
              ) : displayedItems.length > 0 ? (
                <div className="grid gap-4">
                  {displayedItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group bg-moss/5 border border-limestone/10 flex hover:border-limestone/40 transition-all duration-300"
                    >
                      <div className="w-24 h-32 bg-basalt flex-shrink-0 relative">
                        <img 
                          src={item.image_url} 
                          alt={item.item_name}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-1 right-1 bg-neon text-basalt text-[7px] font-mono font-black px-1">
                          {Math.round((item.similarity || 0) * 100)}%
                        </div>
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1">
                        <div>
                          <p className="text-[8px] font-black text-limestone uppercase tracking-widest leading-none mb-1">{item.brand_name}</p>
                          <h5 className="text-sm font-serif font-black text-neon leading-none tracking-tighter mb-2">{item.item_name}</h5>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-mono text-neon font-black tracking-tighter">
                            {formatCurrency(item.price)}
                          </span>
                          <a 
                            href={item.product_link} 
                            target="_blank" 
                            className="bg-graphite p-2 text-neon hover:bg-neon hover:text-basalt transition-colors"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </a>
                          <button 
                            onClick={() => handleMatchAndBatch(item)}
                            className="bg-neon/10 p-2 text-neon hover:bg-neon hover:text-basalt transition-colors border border-neon/20 ml-2"
                            title="Match & Batch"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-limestone text-[10px] uppercase tracking-widest italic">{error || "Vault is Empty"}</p>
                  <RefreshCcw className="w-4 h-4 text-limestone/20 mx-auto mt-4" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action for Vision Trigger on DNA Page */}
      {activeTab === "recommendations" && (
        <div className="absolute bottom-24 right-4">
          <label className="w-12 h-12 bg-neon rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95">
            <Scan className="text-basalt w-5 h-5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleVisionScan} />
          </label>
        </div>
      )}
    </div>
  );
}