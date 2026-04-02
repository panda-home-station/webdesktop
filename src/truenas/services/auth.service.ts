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
   * Login with username and password
   */
  async login(
    username: string,
    password: string,
    otp: string | null = null,
  ): Promise<LoginResultData> {
    const params = otp
      ? { mechanism: LoginExMechanism.OtpToken, otp_token: otp }
      : { mechanism: LoginExMechanism.PasswordPlain, username, password, login_options: { reconnect_token: true } };

    const loginCall = otp
      ? truenasApi.call('auth.login_ex_continue', [params])
      : truenasApi.call('auth.login_ex', [params]);

    const result = (await loginCall) as LoginExResponse;
    const loginResult = this.processLoginResult(result);

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
      const params = { mechanism: LoginExMechanism.TokenPlain, token, login_options: { reconnect_token: true } };
      const result = (await truenasApi.call('auth.login_ex', [params])) as LoginExResponse;

      return this.processLoginResult(result);
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

    const authStore = useAuthStore.getState();
    authStore.setToken(token);
    localStorage.setItem('token', token);
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
   * Initialize session after successful login
   */
  initializeSession(userInfo: LoggedInUser, reconnectToken: string | null): void {
    const authStore = useAuthStore.getState();

    // Check if user has webui access
    if (!userInfo?.privilege?.webui_access) {
      return;
    }

    // Set user data
    authStore.setUser(userInfo);
    authStore.setAuthenticated(true);
    authStore.setHasTwoFactor(false);

    // Store reconnect token
    if (reconnectToken) {
      authStore.setToken(reconnectToken);
      localStorage.setItem('token', reconnectToken);
    }

    // Mark login banner as dismissed
    sessionStorage.setItem('loginBannerDismissed', 'true');
  }

  /**
   * Process login result from API
   */
  private processLoginResult(loginResult: LoginExResponse): LoginResult {
    if (loginResult.response_type === LoginExResponseType.Success) {
      if (!loginResult.user_info?.privilege?.webui_access) {
        return LoginResult.NoAccess;
      }

      const authStore = useAuthStore.getState();

      // Initialize session with user data
      this.initializeSession(loginResult.user_info, loginResult.reconnect_token);

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
