// Returns Firebase Web App configuration only. These values are intended for the
// browser and are not Firebase Admin secrets. Never return FIREBASE_SERVICE_ACCOUNT_JSON.
const defaults = {
  apiKey: 'AIzaSyAqFp2SG979LRDAFDCXfrhbam3eA8vtsbA',
  authDomain: 'system-proof.firebaseapp.com',
  projectId: 'system-proof',
  storageBucket: 'system-proof.firebasestorage.app',
  messagingSenderId: '398851511707',
  appId: '1:398851511707:web:b6e00db7bd409f074ebd3e',
};

const response = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
    'X-Content-Type-Options': 'nosniff',
  },
});

export default async function firebaseConfig(request) {
  if (request.method !== 'GET') return response(405, { error: 'GET only.' });
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || defaults.apiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || defaults.authDomain,
    projectId: process.env.FIREBASE_PROJECT_ID || defaults.projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || defaults.storageBucket,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || defaults.messagingSenderId,
    appId: process.env.FIREBASE_APP_ID || defaults.appId,
  };
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter((key) => !String(config[key] || '').trim());
  if (missing.length) return response(503, { error: 'Firebase Web App configuration is incomplete.', missing });
  return response(200, config);
}
