// Vercel Serverless Function Entry Point
// Routes all /api/* requests to the Express application
import app from '../backend/server.js';

export default function handler(req, res) {
  // Ensure the request URL always retains the /api prefix expected by Express routes
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/favicon')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
