import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Updated to the correct package name

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CLIENTS ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const app = express();
app.use(express.json({ limit: '10mb' }));

// --- 1. AUTH CALLBACK (From your server.ts) ---
app.get('/auth/callback', (req, res) => {
  res.send(`
    <html>
      <body style="background: #0A0A0A; color: #B4FA32; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center; border: 1px solid rgba(180,250,50,0.2); padding: 40px;">
          <h1 style="font-size: 14px; letter-spacing: 0.4em; text-transform: uppercase;">Identity Verified</h1>
          <p style="font-size: 10px; opacity: 0.6; text-transform: uppercase;">Closing Secure Channel...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// --- 2. VISION API (From your current index.ts) ---
app.post("/api/vision", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Missing image data" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Analyze this fashion item and extract its style DNA. Return ONLY 4 comma-separated floating point numbers (0.0 to 1.0) for: Old Money, Ivy, Soft Boy, Streetwear.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: image } }
    ]);

    const text = result.response.text();
    const vector = text.split(",").map(v => parseFloat(v.trim()));
    res.json({ vector });
  } catch (error) {
    console.error("Vision Error:", error);
    res.status(500).json({ error: "Failed to vectorize image" });
  }
});

// --- 3. RESET LOGIC ---
app.get('/api/reset-monarchy', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not connected" });
  // Logic to reset credits goes here...
  res.json({ message: "Reset triggered" });
});

// --- 4. PRODUCTION SERVING ---
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- EXPORT FOR VERCEL ---
export default app;

// Local Development listen
if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(\`HEIST. Combined Server running on http://localhost:\${PORT}\`);
  });
}