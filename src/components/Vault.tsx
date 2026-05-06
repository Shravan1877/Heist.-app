import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { cn, formatCurrency } from "../lib/utils";
import { ExternalLink, Camera, Sparkles, RefreshCcw, LayoutGrid, Scan, ChevronRight } from "lucide-react";
import { getAestheticIdentity } from "../logic/calculator";

interface VaultItem {
  id: string;
  brand_name: string;
  item_name: string;
  price: number;
  product_link: string;
  image_url: string;
  dna_vector: string | number[]; // Supabase might return as string "[0.1, 0.2...]"
  similarity?: number;
}

interface VaultProps {
  userVector: [number, number, number, number];
}

type VaultTab = "recommendations" | "vision";

export default function Vault({ userVector }: VaultProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("recommendations");
  const [allItems, setAllItems] = useState<VaultItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visionVector, setVisionVector] = useState<number[] | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
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
          .select('id, brand_name, item_name, price, product_link, image_url, dna_vector');

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

    const targetVector = (activeTab === "vision" && visionVector) ? visionVector : userVector;
    
    const correlated = allItems.map(item => {
      const itemVector = parseVector(item.dna_vector);
      return {
        ...item,
        similarity: calculateSimilarity(targetVector, itemVector)
      };
    });

    // Sort by similarity descending
    const sorted = correlated.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    setDisplayedItems(sorted.slice(0, 20)); // Page limit: 20
  }, [allItems, activeTab, userVector, visionVector]);

  const handleVisionScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVisionScanning(true);
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        const data = await res.json();
        if (data.vector) {
          setVisionVector(data.vector);
          setActiveTab("vision");
          // fetchItems is triggered by useEffect
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Vision scan failed:", err);
      setError("Image analysis error.");
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
            onClick={() => setActiveTab("vision")}
            className={cn(
              "flex-1 pb-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300",
              activeTab === "vision" ? "text-neon border-b-2 border-neon" : "text-limestone"
            )}
          >
            Vision Results
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === "vision" && !visionVector && !isVisionScanning ? (
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
              <p className="text-limestone text-[9px] uppercase tracking-widest leading-loose max-w-[200px] mb-8">
                Upload a garment to extract its style vector and find matches.
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
