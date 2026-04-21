// ============================================================
//  THE GRAND MIST — SUPABASE CLIENT  (supabase-client.js)
//  Initializes the Supabase JS client for use across the app.
//  Must load AFTER the Supabase CDN script in index.html.
// ============================================================

const SUPABASE_URL = 'https://agpfctpfjdfyngwoomyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncGZjdHBmamRmeW5nd29vbXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjkxNzQsImV4cCI6MjA4NzUwNTE3NH0.cs75tdNB4cUxE-tkdxKday3RiQd9KnfO4tZPnhTOxWo';

// --- Grand Mist Cookie Auth Storage (Chrome Optimized) ---
const GMCookieStorage = {
  getItem: (key) => {
    if (window.location.protocol === 'file:') return localStorage.getItem(key);
    const name = key + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1);
      if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return localStorage.getItem(key); // Fallback
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value); // Always set local storage for redundancy
    if (window.location.protocol !== 'file:') {
      const d = new Date();
      d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 Days
      let expires = "expires=" + d.toUTCString();
      document.cookie = key + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;SameSite=Lax";
  }
};

window.GMCookieStorage = GMCookieStorage;
window.supabase = window.supabase || {};
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: GMCookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('⚡ Supabase client initialized with CRM-optimized Cookie Storage');
