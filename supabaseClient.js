import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if the environment variables are loaded. This is a common issue in deployed environments.
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'As variáveis de ambiente do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram encontradas. Verifique se o arquivo .env está correto ou se as variáveis foram configuradas no seu serviço de hospedagem (ex: Netlify, Vercel).'
  
  // Display a user-friendly error message on the screen
  const appRoot = document.getElementById('app');
  if (appRoot) {
    appRoot.innerHTML = `<div style="padding: 2rem; margin: 2rem; text-align: center; background-color: #fff3f3; border: 1px solid #ffcccc; color: #d8000c; border-radius: 8px;">
      <h2>Erro de Configuração</h2>
      <p>${errorMessage}</p>
      <p>Após configurar as variáveis no seu provedor de hospedagem, faça um novo deploy da aplicação.</p>
    </div>`;
  }
  
  // Also throw an error to stop execution and log to the console
  throw new Error(errorMessage);
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
