import app from '../server.js';

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless handler error:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}


