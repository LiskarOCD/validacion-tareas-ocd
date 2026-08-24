import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Helper to extract Google Drive file ID
function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const str = url.trim();

  const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]{15,60})/i);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]{15,60})/i);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  const matchD = str.match(/\/d\/([a-zA-Z0-9_-]{15,60})/i);
  if (matchD && matchD[1]) return matchD[1];

  const matchOpen = str.match(/drive\.google\.com\/(?:open|uc|thumbnail|file)\?.*id=([a-zA-Z0-9_-]{15,60})/i);
  if (matchOpen && matchOpen[1]) return matchOpen[1];

  const matchLh3 = str.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,60})/i);
  if (matchLh3 && matchLh3[1]) return matchLh3[1];

  return null;
}

// Universal Image Proxy to bypass CORS, Hotlink blocking, Google Drive embedding issues, and Mixed Content
app.get('/api/image-proxy', async (req, res) => {
  const targetUrl = req.query.url as string;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing "url" parameter in query string' });
  }

  let finalUrl = targetUrl.trim();

  // If wrapped in quotes or formulas
  finalUrl = finalUrl.replace(/^["']+|["']+$/g, '');

  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl;
  }

  // Handle Google Drive links
  const driveId = extractGoogleDriveId(finalUrl);
  const candidateUrls: string[] = [];

  if (driveId) {
    // Google Drive direct export & CDN endpoints (ordered by reliability)
    candidateUrls.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`);
    candidateUrls.push(`https://lh3.googleusercontent.com/d/${driveId}`);
    candidateUrls.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
    candidateUrls.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
    candidateUrls.push(`https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`);
  } else if (finalUrl.includes('dropbox.com')) {
    let dbxUrl = finalUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?raw=1');
    if (!dbxUrl.includes('raw=1') && !dbxUrl.includes('dl=1')) {
      dbxUrl += (dbxUrl.includes('?') ? '&' : '?') + 'raw=1';
    }
    candidateUrls.push(dbxUrl);
    candidateUrls.push(finalUrl);
  } else {
    candidateUrls.push(finalUrl);
    // If http, also try https
    if (finalUrl.startsWith('http://')) {
      candidateUrls.push(finalUrl.replace('http://', 'https://'));
    }
  }

  // Attempt to fetch from candidates
  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const rawContentType = response.headers.get('content-type') || '';
      
      // If response is an HTML page (like Google Drive login/interstitial) and we have other candidates, skip
      if (rawContentType.includes('text/html') && candidateUrls.indexOf(url) < candidateUrls.length - 1) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength < 50 && candidateUrls.indexOf(url) < candidateUrls.length - 1) {
        continue; // suspiciously small/empty response, try next candidate
      }

      const buffer = Buffer.from(arrayBuffer);
      const finalContentType = rawContentType.includes('image/') 
        ? rawContentType 
        : (url.endsWith('.png') ? 'image/png' : (url.endsWith('.webp') ? 'image/webp' : 'image/jpeg'));

      // Set CORS and Cache Headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Content-Type', finalContentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Content-Length', buffer.length.toString());

      return res.status(200).send(buffer);
    } catch {
      // try next candidate
      continue;
    }
  }

  // If internal fetch failed on all candidates, redirect client directly as fallback
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.redirect(302, candidateUrls[0] || finalUrl);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Vite in development mode or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
