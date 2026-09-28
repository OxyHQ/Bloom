import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the file upload draws or announces, in each Bloom
 * language. Sizes and extensions arrive formatted. A caller's `labels` and
 * `accessibilityLabel` still win.
 */
export interface FileUploadMessages {
  /** The idle prompt before the accent word, on web (a drop zone) and on native (a tap target). */
  promptWeb: string;
  promptNative: string;
  /** The accent-coloured action word that completes the prompt. */
  selectWeb: string;
  selectNative: string;
  uploading: (size: string) => string;
  uploaded: string;
  unsupported: (extensions: string) => string;
  tooLarge: (max: string) => string;
  /** The hint's size limit after the accepted types: "(max 8 MB)". */
  max: (size: string) => string;
  /** The drop zone's name. */
  uploadFile: string;
}

export const FILE_UPLOAD_MESSAGES: MessageCatalog<FileUploadMessages> = {
  en: {
    promptWeb: 'Drag and drop to upload or',
    promptNative: 'Tap to',
    selectWeb: 'select',
    selectNative: 'select a file',
    uploading: (size) => `Uploading ${size}...`,
    uploaded: 'Uploaded successfully!',
    unsupported: (extensions) => `Only ${extensions} files are supported`,
    tooLarge: (max) => `That file is larger than ${max}`,
    max: (size) => `(max ${size})`,
    uploadFile: 'Upload a file',
  },
  es: {
    promptWeb: 'Arrastra y suelta para subir o',
    promptNative: 'Toca para',
    selectWeb: 'selecciona',
    selectNative: 'seleccionar un archivo',
    uploading: (size) => `Subiendo ${size}...`,
    uploaded: '¡Subido correctamente!',
    unsupported: (extensions) => `Solo se admiten archivos ${extensions}`,
    tooLarge: (max) => `El archivo supera ${max}`,
    max: (size) => `(máx. ${size})`,
    uploadFile: 'Subir un archivo',
  },
  ca: {
    promptWeb: 'Arrossega i deixa anar per pujar o',
    promptNative: 'Toca per',
    selectWeb: 'selecciona',
    selectNative: 'seleccionar un fitxer',
    uploading: (size) => `Pujant ${size}...`,
    uploaded: "S'ha pujat correctament!",
    unsupported: (extensions) => `Només s'admeten fitxers ${extensions}`,
    tooLarge: (max) => `El fitxer supera ${max}`,
    max: (size) => `(màx. ${size})`,
    uploadFile: 'Puja un fitxer',
  },
  de: {
    promptWeb: 'Zum Hochladen hierher ziehen oder',
    promptNative: 'Tippen, um',
    selectWeb: 'auswählen',
    selectNative: 'eine Datei auszuwählen',
    uploading: (size) => `${size} wird hochgeladen...`,
    uploaded: 'Erfolgreich hochgeladen!',
    unsupported: (extensions) => `Nur ${extensions}-Dateien werden unterstützt`,
    tooLarge: (max) => `Die Datei ist größer als ${max}`,
    max: (size) => `(max. ${size})`,
    uploadFile: 'Datei hochladen',
  },
  fr: {
    promptWeb: 'Glissez-déposez pour importer ou',
    promptNative: 'Touchez pour',
    selectWeb: 'parcourir',
    selectNative: 'choisir un fichier',
    uploading: (size) => `Importation de ${size}...`,
    uploaded: 'Importation réussie !',
    unsupported: (extensions) => `Seuls les fichiers ${extensions} sont acceptés`,
    tooLarge: (max) => `Ce fichier dépasse ${max}`,
    max: (size) => `(max. ${size})`,
    uploadFile: 'Importer un fichier',
  },
  it: {
    promptWeb: 'Trascina qui per caricare oppure',
    promptNative: 'Tocca per',
    selectWeb: 'seleziona',
    selectNative: 'selezionare un file',
    uploading: (size) => `Caricamento di ${size}...`,
    uploaded: 'Caricamento completato!',
    unsupported: (extensions) => `Sono supportati solo file ${extensions}`,
    tooLarge: (max) => `Il file supera ${max}`,
    max: (size) => `(max ${size})`,
    uploadFile: 'Carica un file',
  },
  pt: {
    promptWeb: 'Arraste e solte para enviar ou',
    promptNative: 'Toque para',
    selectWeb: 'selecione',
    selectNative: 'selecionar um arquivo',
    uploading: (size) => `Enviando ${size}...`,
    uploaded: 'Enviado com sucesso!',
    unsupported: (extensions) => `Somente arquivos ${extensions} são aceitos`,
    tooLarge: (max) => `O arquivo é maior que ${max}`,
    max: (size) => `(máx. ${size})`,
    uploadFile: 'Enviar um arquivo',
  },
  ru: {
    promptWeb: 'Перетащите файл для загрузки или',
    promptNative: 'Нажмите, чтобы',
    selectWeb: 'выберите',
    selectNative: 'выбрать файл',
    uploading: (size) => `Загрузка ${size}...`,
    uploaded: 'Файл загружен!',
    unsupported: (extensions) => `Поддерживаются только файлы ${extensions}`,
    tooLarge: (max) => `Файл больше ${max}`,
    max: (size) => `(макс. ${size})`,
    uploadFile: 'Загрузить файл',
  },
  tr: {
    promptWeb: 'Yüklemek için sürükleyip bırakın ya da',
    promptNative: 'Dokunarak',
    selectWeb: 'seçin',
    selectNative: 'dosya seçin',
    uploading: (size) => `${size} yükleniyor...`,
    uploaded: 'Başarıyla yüklendi!',
    unsupported: (extensions) => `Yalnızca ${extensions} dosyaları desteklenir`,
    tooLarge: (max) => `Bu dosya ${max} boyutundan büyük`,
    max: (size) => `(en fazla ${size})`,
    uploadFile: 'Dosya yükle',
  },
  ja: {
    promptWeb: 'ドラッグ＆ドロップでアップロード、または',
    promptNative: 'タップして',
    selectWeb: 'ファイルを選択',
    selectNative: 'ファイルを選択',
    uploading: (size) => `${size} をアップロード中...`,
    uploaded: 'アップロードしました',
    unsupported: (extensions) => `${extensions} ファイルのみ対応しています`,
    tooLarge: (max) => `ファイルが ${max} を超えています`,
    max: (size) => `（最大 ${size}）`,
    uploadFile: 'ファイルをアップロード',
  },
  zh: {
    promptWeb: '拖放文件以上传，或',
    promptNative: '点按以',
    selectWeb: '选择文件',
    selectNative: '选择文件',
    uploading: (size) => `正在上传 ${size}...`,
    uploaded: '上传成功！',
    unsupported: (extensions) => `仅支持 ${extensions} 文件`,
    tooLarge: (max) => `文件超过 ${max}`,
    max: (size) => `（最大 ${size}）`,
    uploadFile: '上传文件',
  },
  ar: {
    promptWeb: 'اسحب الملف وأفلته للرفع أو',
    promptNative: 'انقر',
    selectWeb: 'اختر ملفًا',
    selectNative: 'لاختيار ملف',
    uploading: (size) => `جارٍ رفع ${size}...`,
    uploaded: 'تم الرفع بنجاح!',
    unsupported: (extensions) => `الملفات المدعومة: ${extensions} فقط`,
    tooLarge: (max) => `حجم الملف أكبر من ${max}`,
    max: (size) => `(الحد الأقصى ${size})`,
    uploadFile: 'رفع ملف',
  },
  hi: {
    promptWeb: 'अपलोड करने के लिए खींचें और छोड़ें या',
    promptNative: 'टैप करके',
    selectWeb: 'चुनें',
    selectNative: 'फ़ाइल चुनें',
    uploading: (size) => `${size} अपलोड हो रहा है...`,
    uploaded: 'सफलतापूर्वक अपलोड हो गया!',
    unsupported: (extensions) => `केवल ${extensions} फ़ाइलें समर्थित हैं`,
    tooLarge: (max) => `यह फ़ाइल ${max} से बड़ी है`,
    max: (size) => `(अधिकतम ${size})`,
    uploadFile: 'फ़ाइल अपलोड करें',
  },
  bn: {
    promptWeb: 'আপলোড করতে টেনে এনে ছাড়ুন অথবা',
    promptNative: 'ট্যাপ করে',
    selectWeb: 'বেছে নিন',
    selectNative: 'একটি ফাইল বেছে নিন',
    uploading: (size) => `${size} আপলোড হচ্ছে...`,
    uploaded: 'সফলভাবে আপলোড হয়েছে!',
    unsupported: (extensions) => `শুধু ${extensions} ফাইল সমর্থিত`,
    tooLarge: (max) => `ফাইলটি ${max}-এর চেয়ে বড়`,
    max: (size) => `(সর্বোচ্চ ${size})`,
    uploadFile: 'একটি ফাইল আপলোড করুন',
  },
  id: {
    promptWeb: 'Seret dan lepas untuk mengunggah atau',
    promptNative: 'Ketuk untuk',
    selectWeb: 'pilih',
    selectNative: 'memilih file',
    uploading: (size) => `Mengunggah ${size}...`,
    uploaded: 'Berhasil diunggah!',
    unsupported: (extensions) => `Hanya file ${extensions} yang didukung`,
    tooLarge: (max) => `File melebihi ${max}`,
    max: (size) => `(maks. ${size})`,
    uploadFile: 'Unggah file',
  },
};
