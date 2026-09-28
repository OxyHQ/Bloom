import type { MessageCatalog } from '../locale/messages';
import type { SocialButtonAction } from './types';

/**
 * Every fixed string the social-button family draws or announces, in each
 * Bloom language. A button's `children` and `accessibilityLabel` still win.
 */
export interface SocialButtonMessages {
  /**
   * The default label and icon-only name, given the brand: a whole phrase per
   * language, since the brand sits before the verb in some ("Google ile giriş yap").
   */
  actions: Record<SocialButtonAction, (brand: string) => string>;
}

export const SOCIAL_BUTTON_MESSAGES: MessageCatalog<SocialButtonMessages> = {
  en: { actions: { continue: (b) => `Continue with ${b}`, signIn: (b) => `Sign in with ${b}`, signUp: (b) => `Sign up with ${b}` } },
  es: { actions: { continue: (b) => `Continuar con ${b}`, signIn: (b) => `Iniciar sesión con ${b}`, signUp: (b) => `Registrarse con ${b}` } },
  ca: { actions: { continue: (b) => `Continua amb ${b}`, signIn: (b) => `Inicia la sessió amb ${b}`, signUp: (b) => `Registra't amb ${b}` } },
  de: { actions: { continue: (b) => `Weiter mit ${b}`, signIn: (b) => `Mit ${b} anmelden`, signUp: (b) => `Mit ${b} registrieren` } },
  fr: { actions: { continue: (b) => `Continuer avec ${b}`, signIn: (b) => `Se connecter avec ${b}`, signUp: (b) => `S'inscrire avec ${b}` } },
  it: { actions: { continue: (b) => `Continua con ${b}`, signIn: (b) => `Accedi con ${b}`, signUp: (b) => `Registrati con ${b}` } },
  pt: { actions: { continue: (b) => `Continuar com ${b}`, signIn: (b) => `Entrar com ${b}`, signUp: (b) => `Cadastrar-se com ${b}` } },
  ru: { actions: { continue: (b) => `Продолжить через ${b}`, signIn: (b) => `Войти через ${b}`, signUp: (b) => `Зарегистрироваться через ${b}` } },
  tr: { actions: { continue: (b) => `${b} ile devam et`, signIn: (b) => `${b} ile giriş yap`, signUp: (b) => `${b} ile kaydol` } },
  ja: { actions: { continue: (b) => `${b}で続行`, signIn: (b) => `${b}でサインイン`, signUp: (b) => `${b}で登録` } },
  zh: { actions: { continue: (b) => `使用 ${b} 继续`, signIn: (b) => `使用 ${b} 登录`, signUp: (b) => `使用 ${b} 注册` } },
  ar: { actions: { continue: (b) => `المتابعة باستخدام ${b}`, signIn: (b) => `تسجيل الدخول باستخدام ${b}`, signUp: (b) => `إنشاء حساب باستخدام ${b}` } },
  hi: { actions: { continue: (b) => `${b} के साथ जारी रखें`, signIn: (b) => `${b} से साइन इन करें`, signUp: (b) => `${b} से साइन अप करें` } },
  bn: { actions: { continue: (b) => `${b} দিয়ে চালিয়ে যান`, signIn: (b) => `${b} দিয়ে সাইন ইন করুন`, signUp: (b) => `${b} দিয়ে সাইন আপ করুন` } },
  id: { actions: { continue: (b) => `Lanjutkan dengan ${b}`, signIn: (b) => `Masuk dengan ${b}`, signUp: (b) => `Daftar dengan ${b}` } },
};
