const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS: Permite que tu web en Cloudflare hable con este servidor
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { messages, system_instruction } = JSON.parse(body);
      const apiKey = process.env.GEMINI_API_KEY;

      // Configuración de Gemini con Google Search
      const payload = JSON.stringify({
        contents: messages,
        tools: [{ google_search_retrieval: {} }], // Habilita búsqueda en Google
        system_instruction: { parts: [{ text: system_instruction }] }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', d => data += d);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      apiReq.on('error', (e) => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });

      apiReq.write(payload);
      apiReq.end();
    });
  }
});

server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
