import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Server Client (Prefer Service Role Key for global resets)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// HEIST Reset Logic: 11:59 PM IST = 18:29 UTC
let lastResetDate: string | null = null;

async function executeDailyReset() {
  if (!supabase) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Check if it's 18:29 UTC and we haven't reset today
  if (currentHour === 18 && currentMinute === 29 && lastResetDate !== today) {
    console.log("[HEIST] Triggering 11:59 PM IST Reset Logic...");
    
    try {
      // Fetch all non-admin profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, scan_credits, batch_credits');

      if (error) throw error;

      for (const profile of profiles || []) {
        // Condition: Scan Credits
        let newScan = profile.scan_credits;
        if (profile.scan_credits <= 5) {
          newScan = 5;
        }

        // Condition: Batch Credits
        let newBatch = profile.batch_credits;
        if (profile.batch_credits <= 8) {
          newBatch = 8;
        }

        if (newScan !== profile.scan_credits || newBatch !== profile.batch_credits) {
          await supabase
            .from('profiles')
            .update({ scan_credits: newScan, batch_credits: newBatch })
            .eq('id', profile.id);
        }
      }

      lastResetDate = today;
      console.log("[HEIST] Reset completed for all non-admin users.");
    } catch (err) {
      console.error("[HEIST] Reset failed:", err);
    }
  }
}

// Check every minute
setInterval(executeDailyReset, 60000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // HEIST Auth Callback for Popups
  app.get('/auth/callback', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>HEIST. Identity Verified</title>
          <style>
            body { background: #0A0A0A; color: #B4FA32; font-family: sans-serif; display: flex; items-center; justify-content: center; height: 100vh; margin: 0; }
            .content { text-align: center; border: 1px solid rgba(180,250,50,0.2); padding: 40px; }
            h1 { font-size: 14px; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 20px; }
            p { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.2em; }
          </style>
        </head>
        <body>
          <div class="content">
            <h1>Identity Verified</h1>
            <p>Closing Secure Channel...</p>
          </div>
          <script>
            // Notify the parent window
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
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
    console.log(`HEIST. Server running on https://heist-app-5yjs.vercel.app/`);
  });
}

startServer();