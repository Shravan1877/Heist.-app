import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // AI: Gemini Vision Scan API - Extraction of Style Vector
  app.post("/api/vision", async (req, res) => {
    try {
      const { image } = req.body; // base64 string
      if (!image) return res.status(400).json({ error: "Missing image data" });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Analyze this fashion item and extract its style DNA according to these 4 pillars:
      1. Old Money (OM)
      2. Ivy (IV)
      3. Soft Boy (SB)
      4. Streetwear (SW)
      
      Return ONLY 4 comma-separated floating point numbers between 0.0 and 1.0 that represent the intensity/alignment with each pillar. They should roughly sum to 1.0.
      Example Output: 0.7, 0.2, 0.1, 0.0`;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: image } }
            ]
          }
        ]
      });

      const text = result.text;
      const vector = text.split(",").map(v => parseFloat(v.trim()));
      
      if (vector.length !== 4) throw new Error("Invalid vector returned from AI");
      
      res.json({ vector });
    } catch (error) {
      console.error("Vision Error:", error);
      res.status(500).json({ error: "Failed to vectorize image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HEIST. Server running on http://localhost:${PORT}`);
  });
}

startServer();
