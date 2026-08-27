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

  // If wrapped in quotes, formulas or Excel artifacts
  finalUrl = finalUrl.replace(/^["']+|["']+$/g, '').trim();

  // Extract from formula if present: =HYPERLINK("url", "text")
  const formulaMatch = finalUrl.match(/HYPERLINK\(\s*["']([^"']+)["']/i);
  if (formulaMatch && formulaMatch[1]) {
    finalUrl = formulaMatch[1].trim();
  }

  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl;
  }

  // Helper to generate a clean, branded SVG fallback
  const sendSvgFallback = (title: string, subtitle: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
      <rect width="800" height="600" fill="#071D38"/>
      <rect x="20" y="20" width="760" height="560" rx="16" stroke="#2B98BA" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="6 6"/>
      <circle cx="400" cy="230" r="50" fill="#0B2F5B" stroke="#2B98BA" stroke-width="2"/>
      <path d="M380 220L395 240L415 210L430 240H370L380 220Z" fill="#4AC3E7"/>
      <circle cx="420" cy="205" r="5" fill="#4AC3E7"/>
      <text x="400" y="325" fill="#FFFFFF" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">
        ${title}
      </text>
      <text x="400" y="360" fill="#94A3B8" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" text-anchor="middle">
        ${subtitle}
      </text>
      <rect x="280" y="405" width="240" height="36" rx="8" fill="#0B2F5B" stroke="#2B98BA" stroke-width="1.5"/>
      <text x="400" y="428" fill="#4AC3E7" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">
        Auditoría Comercial OCD
      </text>
    </svg>`;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(svg);
  };

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
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      
      // If response is an HTML page (like Google Drive login/interstitial) skip to next
      if (rawContentType.includes('text/html')) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength < 50) {
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

  // If internal fetch failed on all candidates, return styled fallback SVG
  if (driveId) {
    return sendSvgFallback(
      'Archivo de Google Drive',
      'Requiere permisos de visualización o acceso público'
    );
  }

  return sendSvgFallback(
    'Evidencia Fotográfica No Disponible',
    'No se pudo recuperar la imagen del servidor externo'
  );
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
