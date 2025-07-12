import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Perform a pre-flight check for all required environment variables.
const GOOGLE_CLIENT_ID = "1141976817983-plprie5tmlm50o8ipoaslq3cg03lve5o.apps.googleusercontent.com";

let apiKey: string | undefined;
try {
  // This will throw a ReferenceError if 'process' is not defined, which is caught.
  apiKey = process.env.API_KEY;
} catch (e) {
  // Expected in a browser environment where process is not defined.
  apiKey = undefined;
}

const missingVars: string[] = [];
if (!apiKey) missingVars.push('API_KEY');

const root = ReactDOM.createRoot(rootElement);

if (missingVars.length > 0) {
  root.render(
    <div style={{
      fontFamily: "'Inter', sans-serif",
      color: '#cbd5e1',
      backgroundColor: '#020617',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid #334155',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
      }}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem'}}>Configuration Error</h1>
        <p style={{marginBottom: '1.5rem'}}>The application cannot start because the following required environment variables are missing:</p>
        <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            textAlign: 'left'
        }}>
            {missingVars.map(v => <code key={v} style={{display: 'block', padding: '0.25rem 0.5rem', fontFamily: 'monospace'}}>{v}</code>)}
        </div>
        <p style={{fontSize: '0.875rem', color: '#94a3b8' }}>
            Please ensure these variables are set in your execution environment.
        </p>
      </div>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}