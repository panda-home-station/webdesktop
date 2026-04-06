import { TrueNASEnvironment, environmentVersion, remote } from './environment.interface';

export const environment: TrueNASEnvironment = {
  environmentVersion,
  remote,
  build: 'development',
  buildYear: new Date().getFullYear(),
  production: import.meta.env.PROD,
};
