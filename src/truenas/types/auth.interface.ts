export interface LoggedInUser {
  pw_dir: string;
  pw_gecos: string;
  pw_gid: number;
  pw_name: string;
  pw_shell: string;
  pw_uid: number;
  attributes: {
    preferences: any;
    dashState: any[];
    appsAgreement: boolean;
  };
  privilege: AuthMePrivilege;
  account_attributes: AccountAttribute[];
  two_factor_config: UserTwoFactorConfig;
}

export interface AuthMePrivilege {
  roles: {
    $set: Role[];
  };
  web_shell: boolean;
  webui_access: boolean;
}

export enum AccountAttribute {
  Local = 'LOCAL',
  PasswordChangeRequired = 'PASSWORD_CHANGE_REQUIRED',
  SysAdmin = 'SYS_ADMIN',
  Microsoft = 'MICROSOFT',
  LDAP = 'LDAP',
}

export enum Role {
  FullAdmin = 'FULL_ADMIN',
  AccountAdmin = 'ACCOUNT_ADMIN',
  NoAccess = 'NO_ACCESS',
  UserRead = 'USER_READ',
  RoleRead = 'ROLE_READ',
  PoolAdmin = 'POOL_ADMIN',
  PoolWrite = 'POOL_WRITE',
  PoolAudit = 'POOL_AUDIT',
  DatasetAdmin = 'DATASET_ADMIN',
  DatasetWrite = 'DATASET_WRITE',
  DatasetAudit = 'DATASET_AUDIT',
}

export interface UserTwoFactorConfig {
  secret_configured: boolean;
  otp_enabled: boolean;
}

export interface GlobalTwoFactorConfig {
  enabled: boolean;
  services: {
    console: boolean;
    ssh: boolean;
    webui: boolean;
  };
  interval: number;
  digit_count: number;
}

export enum LoginExResponseType {
  Success = 'SUCCESS',
  AuthErr = 'AUTH_ERR',
  Expired = 'EXPIRED',
  OtpRequired = 'OTP_REQUIRED',
  Redirect = 'REDIRECT',
  Denied = 'DENIED',
}

export enum LoginExMechanism {
  PasswordPlain = 'PASSWORD_PLAIN',
  OtpToken = 'OTP_TOKEN',
  TokenPlain = 'TOKEN_PLAIN',
  ApiKeyPlain = 'API_KEY_PLAIN',
}

export enum AuthenticatorLoginLevel {
  Level1 = 'LEVEL_1',
  Level2 = 'LEVEL_2',
}

export interface LoginSuccessResponse {
  response_type: LoginExResponseType.Success;
  user_info: LoggedInUser;
  authenticator: AuthenticatorLoginLevel;
}

export interface LoginAuthErrorResponse {
  response_type: LoginExResponseType.AuthErr;
}

export interface LoginExpiredResponse {
  response_type: LoginExResponseType.Expired;
}

export interface LoginRedirectResponse {
  response_type: LoginExResponseType.Redirect;
  urls: string[];
}

export interface LoginOtpRequiredResponse {
  response_type: LoginExResponseType.OtpRequired;
  username: string;
}

export interface LoginDeniedResponse {
  response_type: LoginExResponseType.Denied;
}

export type LoginExResponse =
  | LoginSuccessResponse
  | LoginAuthErrorResponse
  | LoginExpiredResponse
  | LoginRedirectResponse
  | LoginOtpRequiredResponse
  | LoginDeniedResponse;

export type LoginExQuery =
  | LoginExPasswordQuery
  | LoginExOtpTokenQuery
  | LoginExAuthTokenQuery
  | LoginExApiKeyQuery;

export interface LoginExPasswordQuery {
  mechanism: LoginExMechanism.PasswordPlain;
  username: string;
  password: string;
}

export interface LoginExOtpTokenQuery {
  mechanism: LoginExMechanism.OtpToken;
  otp_token: string;
}

export interface LoginExAuthTokenQuery {
  mechanism: LoginExMechanism.TokenPlain;
  token: string;
}

export interface LoginExApiKeyQuery {
  mechanism: LoginExMechanism.ApiKeyPlain;
  username: string;
  api_key: string;
}
