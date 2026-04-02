export interface TrueNASEnvironment {
  environmentVersion: string;
  remote: string;
  build: string;
  buildYear: number;
  production: boolean;
}

export const environmentVersion = '0.0.1';
export const remote = import.meta.env.PROD ? window.location.host : (import.meta.env.VITE_TRUENAS_REMOTE ?? window.location.host);
