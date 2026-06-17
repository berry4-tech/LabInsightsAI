// ===========================================
// API Configuration
// ===========================================
// Auto-detects environment - no manual toggle needed!

// Auto-detect: localhost = development, otherwise = production
const IS_PRODUCTION = !window.location.hostname.includes('localhost') && 
                      !window.location.hostname.includes('127.0.0.1');

// Local development URLs
const LOCAL_BACKEND_URL = "http://127.0.0.1:5000";
const LOCAL_AI_SERVICE_URL = "http://127.0.0.1:5001";

// Production URLs
const PROD_BACKEND_URL = "https://labinsight-backend.onrender.com";
const PROD_AI_SERVICE_URL = "https://labinsight-ai-s6lkc.ondigitalocean.app";

// Export the active URLs
export const API_BASE = IS_PRODUCTION ? PROD_BACKEND_URL : LOCAL_BACKEND_URL;
export const AI_SERVICE_URL = IS_PRODUCTION ? PROD_AI_SERVICE_URL : LOCAL_AI_SERVICE_URL;
