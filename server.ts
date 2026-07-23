import express from 'express';
import path from 'path';
import app from './api/app.js';

const PORT = 3000;

if (!process.env.VERCEL) {
  async function start() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
          res.sendFile(path.join(distPath, 'index.html'));
        }
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`💖 LoveWrapped server running on http://0.0.0.0:${PORT}`);
    });
  }

  start();
}

export default app;