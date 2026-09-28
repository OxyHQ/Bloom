import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string `AgentProgress` draws or announces, in each Bloom
 * language. A caller's `labels` and `steps` props still win over these.
 */
export interface AgentProgressMessages {
  stepsLeft: (remaining: number) => string;
  allCompleted: string;
  minimize: string;
  expand: string;
  /** The demo coding workflow shown when no `steps` are passed. */
  defaultSteps: readonly string[];
}

export const AGENT_PROGRESS_MESSAGES: MessageCatalog<AgentProgressMessages> = {
  en: {
    stepsLeft: (n) => plural('en', n, { one: '{n} step left', other: '{n} steps left' }),
    allCompleted: 'All steps completed',
    minimize: 'Minimize steps',
    expand: 'Expand steps',
    defaultSteps: [
      'Read project files',
      'Update and install light mode tokens',
      'Implement dark mode tokens',
      'Add reusable registered theme toggle',
      'Run registry, lint and production build',
    ],
  },
  es: {
    stepsLeft: (n) => plural('es', n, { one: 'Queda {n} paso', other: 'Quedan {n} pasos' }),
    allCompleted: 'Todos los pasos completados',
    minimize: 'Minimizar pasos',
    expand: 'Expandir pasos',
    defaultSteps: [
      'Leer los archivos del proyecto',
      'Actualizar e instalar los tokens del modo claro',
      'Implementar los tokens del modo oscuro',
      'Añadir un selector de tema reutilizable y registrado',
      'Ejecutar el registro, el lint y la compilación de producción',
    ],
  },
  ca: {
    stepsLeft: (n) => plural('ca', n, { one: 'Queda {n} pas', other: 'Queden {n} passos' }),
    allCompleted: 'Tots els passos completats',
    minimize: 'Minimitza els passos',
    expand: 'Desplega els passos',
    defaultSteps: [
      'Llegir els fitxers del projecte',
      'Actualitzar i instal·lar els tokens del mode clar',
      'Implementar els tokens del mode fosc',
      'Afegir un selector de tema reutilitzable i registrat',
      'Executar el registre, el lint i la compilació de producció',
    ],
  },
  de: {
    stepsLeft: (n) => plural('de', n, { one: 'Noch {n} Schritt', other: 'Noch {n} Schritte' }),
    allCompleted: 'Alle Schritte abgeschlossen',
    minimize: 'Schritte minimieren',
    expand: 'Schritte einblenden',
    defaultSteps: [
      'Projektdateien lesen',
      'Tokens für den hellen Modus aktualisieren und installieren',
      'Tokens für den dunklen Modus implementieren',
      'Wiederverwendbaren, registrierten Theme-Umschalter hinzufügen',
      'Registry, Lint und Produktions-Build ausführen',
    ],
  },
  fr: {
    stepsLeft: (n) => plural('fr', n, { one: '{n} étape restante', other: '{n} étapes restantes' }),
    allCompleted: 'Toutes les étapes sont terminées',
    minimize: 'Réduire les étapes',
    expand: 'Développer les étapes',
    defaultSteps: [
      'Lire les fichiers du projet',
      'Mettre à jour et installer les tokens du mode clair',
      'Implémenter les tokens du mode sombre',
      'Ajouter un sélecteur de thème réutilisable et enregistré',
      'Lancer le registre, le lint et le build de production',
    ],
  },
  it: {
    stepsLeft: (n) => plural('it', n, { one: 'Manca {n} passaggio', other: 'Mancano {n} passaggi' }),
    allCompleted: 'Tutti i passaggi completati',
    minimize: 'Riduci passaggi',
    expand: 'Espandi passaggi',
    defaultSteps: [
      'Leggere i file del progetto',
      'Aggiornare e installare i token della modalità chiara',
      'Implementare i token della modalità scura',
      'Aggiungere un selettore di tema riutilizzabile e registrato',
      'Eseguire registry, lint e build di produzione',
    ],
  },
  pt: {
    stepsLeft: (n) => plural('pt', n, { one: '{n} etapa restante', other: '{n} etapas restantes' }),
    allCompleted: 'Todas as etapas concluídas',
    minimize: 'Minimizar etapas',
    expand: 'Expandir etapas',
    defaultSteps: [
      'Ler os arquivos do projeto',
      'Atualizar e instalar os tokens do modo claro',
      'Implementar os tokens do modo escuro',
      'Adicionar um seletor de tema reutilizável e registrado',
      'Executar o registro, o lint e o build de produção',
    ],
  },
  ru: {
    stepsLeft: (n) =>
      plural('ru', n, { one: 'Остался {n} шаг', few: 'Осталось {n} шага', many: 'Осталось {n} шагов', other: 'Осталось {n} шага' }),
    allCompleted: 'Все шаги выполнены',
    minimize: 'Свернуть шаги',
    expand: 'Развернуть шаги',
    defaultSteps: [
      'Прочитать файлы проекта',
      'Обновить и установить токены светлой темы',
      'Реализовать токены тёмной темы',
      'Добавить переиспользуемый зарегистрированный переключатель темы',
      'Запустить реестр, линтер и продакшен-сборку',
    ],
  },
  tr: {
    stepsLeft: (n) => plural('tr', n, { other: '{n} adım kaldı' }),
    allCompleted: 'Tüm adımlar tamamlandı',
    minimize: 'Adımları küçült',
    expand: 'Adımları genişlet',
    defaultSteps: [
      'Proje dosyalarını oku',
      'Açık mod token’larını güncelle ve yükle',
      'Koyu mod token’larını uygula',
      'Yeniden kullanılabilir, kayıtlı bir tema düğmesi ekle',
      'Kayıt, lint ve üretim derlemesini çalıştır',
    ],
  },
  ja: {
    stepsLeft: (n) => plural('ja', n, { other: '残り{n}ステップ' }),
    allCompleted: 'すべてのステップが完了しました',
    minimize: 'ステップを最小化',
    expand: 'ステップを展開',
    defaultSteps: [
      'プロジェクトファイルを読み込む',
      'ライトモードのトークンを更新してインストール',
      'ダークモードのトークンを実装',
      '再利用可能なテーマ切り替えを登録して追加',
      'レジストリ、lint、本番ビルドを実行',
    ],
  },
  zh: {
    stepsLeft: (n) => plural('zh', n, { other: '还剩 {n} 个步骤' }),
    allCompleted: '所有步骤已完成',
    minimize: '收起步骤',
    expand: '展开步骤',
    defaultSteps: ['读取项目文件', '更新并安装浅色模式令牌', '实现深色模式令牌', '添加可复用的已注册主题切换', '运行注册表、lint 和生产构建'],
  },
  ar: {
    stepsLeft: (n) =>
      plural('ar', n, {
        zero: 'لم تتبقَّ أي خطوات',
        one: 'تبقّت خطوة واحدة',
        two: 'تبقّت خطوتان',
        few: 'تبقّت {n} خطوات',
        many: 'تبقّت {n} خطوة',
        other: 'تبقّت {n} خطوة',
      }),
    allCompleted: 'اكتملت كل الخطوات',
    minimize: 'تصغير الخطوات',
    expand: 'توسيع الخطوات',
    defaultSteps: [
      'قراءة ملفات المشروع',
      'تحديث رموز الوضع الفاتح وتثبيتها',
      'تنفيذ رموز الوضع الداكن',
      'إضافة مبدّل سمة مسجَّل قابل لإعادة الاستخدام',
      'تشغيل السجل والتدقيق وبناء الإنتاج',
    ],
  },
  hi: {
    stepsLeft: (n) => plural('hi', n, { other: '{n} चरण बाकी' }),
    allCompleted: 'सभी चरण पूरे हो गए',
    minimize: 'चरण छोटे करें',
    expand: 'चरण दिखाएं',
    defaultSteps: [
      'प्रोजेक्ट फ़ाइलें पढ़ें',
      'लाइट मोड टोकन अपडेट और इंस्टॉल करें',
      'डार्क मोड टोकन लागू करें',
      'दोबारा इस्तेमाल होने वाला रजिस्टर्ड थीम टॉगल जोड़ें',
      'रजिस्ट्री, लिंट और प्रोडक्शन बिल्ड चलाएं',
    ],
  },
  bn: {
    stepsLeft: (n) => plural('bn', n, { other: '{n}টি ধাপ বাকি' }),
    allCompleted: 'সব ধাপ সম্পন্ন হয়েছে',
    minimize: 'ধাপগুলো ছোট করুন',
    expand: 'ধাপগুলো দেখান',
    defaultSteps: [
      'প্রজেক্টের ফাইল পড়ুন',
      'লাইট মোডের টোকেন আপডেট ও ইনস্টল করুন',
      'ডার্ক মোডের টোকেন প্রয়োগ করুন',
      'পুনরায় ব্যবহারযোগ্য নিবন্ধিত থিম টগল যোগ করুন',
      'রেজিস্ট্রি, লিন্ট ও প্রোডাকশন বিল্ড চালান',
    ],
  },
  id: {
    stepsLeft: (n) => plural('id', n, { other: '{n} langkah lagi' }),
    allCompleted: 'Semua langkah selesai',
    minimize: 'Ciutkan langkah',
    expand: 'Luaskan langkah',
    defaultSteps: [
      'Baca file proyek',
      'Perbarui dan pasang token mode terang',
      'Terapkan token mode gelap',
      'Tambahkan pengalih tema terdaftar yang dapat dipakai ulang',
      'Jalankan registry, lint, dan build produksi',
    ],
  },
};
