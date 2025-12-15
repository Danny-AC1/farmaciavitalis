// Reference removed to avoid "Cannot find type definition file for 'vite/client'" error
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // Agrega aquí otras variables de entorno si usas import.meta.env
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment NodeJS namespace to include API_KEY in ProcessEnv.
// This allows strict typing for process.env without redeclaring the global process variable.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY?: string;
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;
    STRIPE_PUBLIC_KEY?: string;
    [key: string]: string | undefined;
  }
}