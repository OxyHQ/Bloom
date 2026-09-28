import type { MessageCatalog } from '../locale/messages';

/**
 * The default fallback's wording, in each Bloom language. `title`, `message`
 * and `retryLabel` props still win over these.
 */
export interface ErrorBoundaryMessages {
  title: string;
  message: string;
  retry: string;
}

export const ERROR_BOUNDARY_MESSAGES: MessageCatalog<ErrorBoundaryMessages> = {
  en: { title: 'Something went wrong', message: 'An unexpected error occurred', retry: 'Try Again' },
  es: { title: 'Algo salió mal', message: 'Se ha producido un error inesperado', retry: 'Volver a intentarlo' },
  ca: { title: 'Alguna cosa ha anat malament', message: "S'ha produït un error inesperat", retry: 'Torna-ho a provar' },
  de: { title: 'Etwas ist schiefgelaufen', message: 'Ein unerwarteter Fehler ist aufgetreten', retry: 'Erneut versuchen' },
  fr: { title: 'Un problème est survenu', message: 'Une erreur inattendue s’est produite', retry: 'Réessayer' },
  it: { title: 'Qualcosa è andato storto', message: 'Si è verificato un errore imprevisto', retry: 'Riprova' },
  pt: { title: 'Algo deu errado', message: 'Ocorreu um erro inesperado', retry: 'Tentar novamente' },
  ru: { title: 'Что-то пошло не так', message: 'Произошла непредвиденная ошибка', retry: 'Повторить попытку' },
  tr: { title: 'Bir şeyler ters gitti', message: 'Beklenmeyen bir hata oluştu', retry: 'Tekrar dene' },
  ja: { title: '問題が発生しました', message: '予期しないエラーが発生しました', retry: 'もう一度試す' },
  zh: { title: '出了点问题', message: '发生了意外错误', retry: '重试' },
  ar: { title: 'حدث خطأ ما', message: 'حدث خطأ غير متوقع', retry: 'إعادة المحاولة' },
  hi: { title: 'कुछ गलत हो गया', message: 'एक अनपेक्षित त्रुटि हुई', retry: 'फिर से कोशिश करें' },
  bn: { title: 'কিছু একটা ভুল হয়েছে', message: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে', retry: 'আবার চেষ্টা করুন' },
  id: { title: 'Terjadi kesalahan', message: 'Terjadi kesalahan yang tidak terduga', retry: 'Coba lagi' },
};
