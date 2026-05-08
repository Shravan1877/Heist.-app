import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// NOTE: executeDailyReset should now be triggered by a Vercel Cron Job or a simple URL hit
// instead of a setInterval that dies on serverless.
export async function executeDailyReset() {
  if (!supabase) return;
  console.log("[HEIST] Manual Reset Triggered...");
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('id, scan_credits, batch_credits');
    if (error) throw error;

    for (const profile of profiles || []) {
      let newScan = profile.scan_credits <= 5 ? 5 : profile.scan_credits;
      let newBatch = profile.batch_credits <= 8 ? 8 : profile.batch_credits;

      if (newScan !== profile.scan_credits || newBatch !== profile.batch_credits) {
        await supabase.from('profiles').update({ scan_credits: newScan, batch_credits: newBatch }).eq('id', profile.id);
      }
    }
    return { success: true };
  } catch (err) {
    console.error("[HEIST] Reset failed:", err);
    return { success: false, error: err };
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000; // Let Vercel decide the port

  app.use(express.json({ limit: '10mb' }));

  // This route is for the daily reset. You can "hit" this URL once a day to reset everyone.
  app.get('/api/reset-monarchy', async (req, res) => {
    const result = await executeDailyReset();
    res.json(result);
  });

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
              window.opener.postMessage({ type: 'AUTH_SUCCESS' }, '*'); // FIXED ORIGIN
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`HEIST. Server live on port \${PORT}\`);
  });
}

startServer();