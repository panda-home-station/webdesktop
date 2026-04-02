import { TrueNASEnvironment, environmentVersion, remote } from './environment.interface';

export const environment: TrueNASEnvironment = {
  environmentVersion,
  remote,
  buildYear: new Date().getFullYear(),
  production: false,
};
