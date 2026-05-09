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
// On Vercel, use an API endpoint for Vercel Cron. On long-running servers, use setInterval.
async function performReset() {
  if (!supabase) return;
  console.log("[HEIST] Executing Global Credit Reset...");
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, scan_credits, batch_credits');
    if (error) throw error;
    for (const profile of profiles || []) {
      let newScan = profile.scan_credits <= 5 ? 5 : profile.scan_credits;
      let newBatch = profile.batch_credits <= 8 ? 8 : profile.batch_credits;
      if (newScan !== profile.scan_credits || newBatch !== profile.batch_credits) {
        await supabase
          .from('profiles')
          .update({ scan_credits: newScan, batch_credits: newBatch })
          .eq('id', profile.id);
      }
    }
  } catch (err) {
    console.error("[HEIST] Reset failed:", err);
  }
}

// Keep the interval for non-serverless environments
setInterval(async () => {
  const now = new Date();
  if (now.getUTCHours() === 18 && now.getUTCMinutes() === 29) {
    await performReset();
  }
}, 60000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  
  // API for Vercel Cron
  app.get('/api/admin/reset-credits', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    await performReset();
    res.json({ status: 'success' });
  });

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
              try {
                window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
                console.log("Message sent to opener");
                setTimeout(() => window.close(), 1500);
              } catch (e) {
                console.error("Failed to post message to opener", e);
                document.body.innerHTML = '<h1>Error</h1><p>Communication failed. Please return to the main window and refresh.</p>';
              }
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

const app = await startServer();
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, "0.0.0.0", () => {
    console.log(`HEIST. Server running on http://localhost:3000`);
  });
}
export default app;
