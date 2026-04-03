import { truenasApi } from '../api';
import { useAuthStore } from '../stores/auth.store';
import { LoginResult } from '../types/login-result.enum';
import {
  LoginExMechanism,
  LoginExResponse,
  LoginExResponseType,
  LoggedInUser,
} from '../types/auth.interface';

export interface LoginResultData {
  loginResult: LoginResult;
  loginResponse: LoginExResponse;
}

export class AuthService {
  /**
   * Save authentication token
   */
  private saveToken(token: string): void {
    const authStore = useAuthStore.getState();
    authStore.setToken(token);
    localStorage.setItem('token', token);
  }

  /**
   * Initialize session after successful login
   */
  private initializeSession(userInfo: LoggedInUser): void {
    const authStore = useAuthStore.getState();
    authStore.setUser(userInfo);
    authStore.setAuthenticated(true);
    authStore.setHasTwoFactor(false);
    sessionStorage.setItem('loginBannerDismissed', 'true');
  }

  /**
   * Login with username and password
   */
  async login(
    username: string,
    password: string,
    otp: string | null = null,
  ): Promise<LoginResultData> {
    const params = otp
      ? { mechanism: LoginExMechanism.OtpToken, otp_token: otp }
      : { mechanism: LoginExMechanism.PasswordPlain, username, password };

    const loginCall = otp
      ? truenasApi.call('auth.login_ex_continue', [params])
      : truenasApi.call('auth.login_ex', [params]);

    const result = (await loginCall) as LoginExResponse;
    const loginResult = this.processLoginResult(result);

    // If login successful, generate and save a token for future use
    if (loginResult === LoginResult.Success && result.response_type === LoginExResponseType.Success) {
      try {
        const token = await truenasApi.call('auth.generate_token', [300, {}, true, true]) as string;
        this.saveToken(token);
      } catch (tokenError) {
        console.error('Failed to generate token:', tokenError);
      }
    }

    return {
      loginResult,
      loginResponse: result,
    };
  }

  /**
   * Login with stored token (from URL or localStorage)
   */
  async loginWithToken(): Promise<LoginResult> {
    const authStore = useAuthStore.getState();
    const token = authStore.token;

    if (!token) {
      return LoginResult.NoToken;
    }

    try {
      const params = { mechanism: LoginExMechanism.TokenPlain, token };
      const result = (await truenasApi.call('auth.login_ex', [params])) as LoginExResponse;

      const loginResult = this.processLoginResult(result);

      // If login successful, generate a new token for future use
      if (loginResult === LoginResult.Success) {
        try {
          const newToken = await truenasApi.call('auth.generate_token', [300, {}, true, true]) as string;
          this.saveToken(newToken);
        } catch (tokenError) {
          console.error('Failed to generate new token:', tokenError);
        }
      }

      return loginResult;
    } catch (error) {
      console.error('Login with token failed:', error);
      return LoginResult.NoAccess;
    }
  }

  /**
   * Set query token from URL
   */
  setQueryToken(token: string | null): void {
    const isSecure =
      window.location.protocol === 'https:' || !import.meta.env.PROD;

    if (!token || !isSecure) {
      return;
    }

    this.saveToken(token);
  }

  /**
   * Get error message for login result
   */
  getLoginErrorMessage(loginResult: LoginResult, isOtp = false): string {
    switch (loginResult) {
      case LoginResult.IncorrectDetails:
        return isOtp
          ? 'The one-time password is incorrect. Please try again.'
          : 'The username or password is incorrect. Please try again.';
      case LoginResult.NoAccess:
        return 'You do not have access to this resource.';
      case LoginResult.NoToken:
        {
          return 'No authentication token found.';
        }
      case LoginResult.Denied:
        return 'Access denied.';
      case LoginResult.Redirect:
        return 'Redirecting to login provider...';
      case LoginResult.NoOtp:
        return 'Two-factor authentication token required.';
      default:
        return 'An unknown error occurred during login.';
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const authStore = useAuthStore.getState();
    if (!authStore.user?.privilege?.roles?.$set) {
      return false;
    }
    return authStore.user.privilege.roles.$set.includes(role as any);
  }

  /**
   * Check if user is full admin
   */
  isFullAdmin(): boolean {
    return this.hasRole('FULL_ADMIN');
  }

  /**
   * Process login result from API
   */
  private processLoginResult(loginResult: LoginExResponse): LoginResult {
    if (loginResult.response_type === LoginExResponseType.Success) {
      if (!loginResult.user_info?.privilege?.webui_access) {
        return LoginResult.NoAccess;
      }

      this.initializeSession(loginResult.user_info);
      return LoginResult.Success;
    }

    if (loginResult.response_type === LoginExResponseType.OtpRequired) {
      const authStore = useAuthStore.getState();
      authStore.setHasTwoFactor(true);
      return LoginResult.NoOtp;
    }

    if (loginResult.response_type === LoginExResponseType.Redirect) {
      return LoginResult.Redirect;
    }

    if (loginResult.response_type === LoginExResponseType.Denied) {
      return LoginResult.Denied;
    }

    return LoginResult.IncorrectDetails;
  }
}

// Export singleton instance
export const authService = new AuthService();
