// ============================================================
//  THE GRAND MIST — SUPABASE CLIENT  (supabase-client.js)
//  Initializes the Supabase JS client for use across the app.
//  Must load AFTER the Supabase CDN script in index.html.
// ============================================================

const SUPABASE_URL = 'https://agpfctpfjdfyngwoomyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncGZjdHBmamRmeW5nd29vbXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjkxNzQsImV4cCI6MjA4NzUwNTE3NH0.cs75tdNB4cUxE-tkdxKday3RiQd9KnfO4tZPnhTOxWo';

window.supabase = window.supabase || {};
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('⚡ Supabase client initialized');
