import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini AI Setup (Server-side)
const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "");

// Supabase Server Client (Prefer Service Role Key for global resets)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Postgres Connection Pooler configuration for high performance database operations.
// Port 6543 is used for Supavisor Connection Pooling. (Transaction Mode + ?pgbouncer=true)
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const dbPool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      // Supabase requires SSL for remote server database connections.
      // We pass rejectUnauthorized: false to prevent SSL handshake errors on dynamic environments.
      ssl: {
        rejectUnauthorized: false
      },
      max: 10, // Maintain a pool of up to 10 connections
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Fail after 5 seconds of connection waiting
    })
  : null;

if (dbPool) {
  console.log("[HEIST] Database connection pool configured successfully.");
  dbPool.on("error", (err) => {
    console.error("[HEIST] Database connection pool error:", err.message);
  });
} else {
  console.warn("[HEIST] DATABASE_URL or SUPABASE_DB_URL missing. Operating solely on HTTP REST Client.");
}

// HEIST Reset Logic: 11:59 PM IST = 18:29 UTC
// On Vercel, use an API endpoint for Vercel Cron. On long-running servers, use setInterval.
async function performReset() {
  console.log("[HEIST] Executing Global Credit Reset...");

  // 1. Connection Pool Optimization
  if (dbPool) {
    try {
      console.log("[HEIST] Executing batch credit reset using Postgres Connection Pooling...");
      const result = await dbPool.query(`
        UPDATE public.profiles
        SET
          scan_credits = CASE WHEN scan_credits <= 5 THEN 5 ELSE scan_credits END,
          batch_credits = CASE WHEN batch_credits <= 8 THEN 8 ELSE batch_credits END
        WHERE scan_credits <= 5 OR batch_credits <= 8;
      `);
      console.log(`[HEIST] Global Credit Reset completed via connection pool. Rows updated: ${result.rowCount}`);
      return;
    } catch (dbErr: any) {
      console.error("[HEIST] Connection Pool query failed, seeking RPC callback...", dbErr.message);
    }
  }

  // 2. High-performance REST RPC callback
  if (!supabase) {
    console.error("[HEIST] Cannot run reset. Supabase parameters missing.");
    return;
  }

  try {
    console.log("[HEIST] Executing credit reset using single-transaction RPC...");
    const { error: rpcError } = await supabase.rpc('reset_profiles_credit_protocol');
    if (!rpcError) {
      console.log("[HEIST] Global Credit Reset completed successfully via RPC.");
      return;
    }
    console.warn("[HEIST] RPC reset failed or not found, falling back to sequential REST updates...", rpcError.message);
  } catch (rpcErr: any) {
    console.warn("[HEIST] RPC reset invocation crashed, invoking sequential fallback", rpcErr.message || rpcErr);
  }

  // 3. Fallback sequential REST loops (only executed if direct sql/pooling & RPC function are missing/unprovisioned)
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, scan_credits, batch_credits');
    if (error) throw error;
    
    let updatedCount = 0;
    for (const profile of profiles || []) {
      const newScan = profile.scan_credits <= 5 ? 5 : profile.scan_credits;
      const newBatch = profile.batch_credits <= 8 ? 8 : profile.batch_credits;
      if (newScan !== profile.scan_credits || newBatch !== profile.batch_credits) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ scan_credits: newScan, batch_credits: newBatch })
          .eq('id', profile.id);
        if (!updateError) {
          updatedCount++;
        }
      }
    }
    console.log(`[HEIST] Sequential reset complete. Rows updated: ${updatedCount}`);
  } catch (err: any) {
    console.error("[HEIST] Absolute fallback reset failed:", err.message || err);
  }
}

// Keep the interval for non-serverless environments
if (process.env.NODE_ENV !== "production") {
  setInterval(async () => {
    const now = new Date();
    if (now.getUTCHours() === 18 && now.getUTCMinutes() === 29) {
      await performReset();
    }
  }, 60000);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', platform: 'HEIST_CORE' });
});

// API for Vercel Cron
app.get('/api/admin/reset-credits', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  await performReset();
  res.json({ status: 'success' });
});

// AI Proxy: Batch
app.post('/api/ai/batch', async (req, res) => {
  console.log("[HEIST_SERVER] Batch Synthesis Request received");
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt missing' });
    
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error("AI Credentials missing in Vault.");
    }

    const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    res.json({ text });
  } catch (err: any) {
    console.error("AI Batch Error:", err);
    res.status(500).json({ error: err.message || "Internal AI Error" });
  }
});

// AI Proxy: Vision
app.post('/api/ai/vision', async (req, res) => {
  console.log("[HEIST_SERVER] Vision Scan Request received");
  try {
    const { prompt, image, mimeType } = req.body;
    if (!prompt || !image) return res.status(400).json({ error: 'Missing parameters' });

    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error("AI Credentials missing in Vault.");
    }

    const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: image
        }
      }
    ]);

    const text = result.response.text();

    res.json({ text });
  } catch (err: any) {
    console.error("AI Vision Error:", err);
    res.status(500).json({ error: err.message || "Internal AI Vision Error" });
  }
});

// HEIST Auth Callback for Popups
app.get('/auth/callback', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>HEIST. Login Successful</title>
        <style>
          body { background: #0A0A0A; color: #B4FA32; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .content { text-align: center; border: 1px solid rgba(180,250,50,0.2); padding: 40px; }
          h1 { font-size: 14px; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 20px; }
          p { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.2em; }
        </style>
      </head>
      <body>
        <div class="content">
          <h1>Login Successful</h1>
          <p>Returning to HEIST...</p>
        </div>
        <script>
          if (window.opener) {
            try {
              window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
              setTimeout(() => window.close(), 1500);
            } catch (e) {
              document.body.innerHTML = '<h1>Error</h1><p>Communication failed.</p>';
            }
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Server setup
async function setupServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      // Dynamic import to avoid loading Vite in production
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } catch (err) {
    console.error("Critical: Failed to initialize HEIST logic core:", err);
  }
}

const portNumber = Number(PORT);

// Global initialization
setupServer().then(() => {
  if (process.env.NODE_ENV !== "production") {
    app.listen(portNumber, "0.0.0.0", () => {
      console.log(`HEIST. Server running on http://localhost:${portNumber}`);
    });
  }
});

export default app;