import type { MessageCatalog } from '../locale/messages';
import type { VehicleKind } from './types';

/** One built-in vehicle's words. */
export interface VehicleWords {
  label: string;
  capacity: string;
  fits: [string, string, string];
}

/**
 * Every fixed string the vehicle picker draws or announces — its own words and
 * the five built-in vehicles' — in each Bloom language. A caller's `labels`,
 * `accessibilityLabel` and `options` still win.
 */
export interface VehiclePickerMessages {
  /** Before the `priceFrom` amount. */
  from: string;
  /** Names an option's `fits` chip row. */
  fits: (label: string) => string;
  /** The reason fallback on a disabled option with none. */
  unavailable: string;
  /** Names the group. */
  vehicle: string;
  vehicles: Record<VehicleKind, VehicleWords>;
}

export const VEHICLE_PICKER_MESSAGES: MessageCatalog<VehiclePickerMessages> = {
  en: {
    from: 'From',
    fits: (label) => `What fits in a ${label}`,
    unavailable: 'Not available for this load',
    vehicle: 'Vehicle',
    vehicles: {
      bike: { label: 'Cargo bike', capacity: 'Up to 25 kg · 60 × 40 × 40 cm', fits: ['Documents', 'A food order', 'A small box'] },
      car: { label: 'Car', capacity: 'Up to 150 kg · 100 × 80 × 60 cm', fits: ['Two suitcases', 'Four boxes', 'A bicycle'] },
      van: { label: 'Van', capacity: 'Up to 800 kg · 240 × 150 × 140 cm', fits: ['A sofa', 'A studio move', 'Half a pallet'] },
      boxTruck: { label: 'Box truck', capacity: 'Up to 3,500 kg · 420 × 200 × 210 cm', fits: ['Two pallets', 'A two-bedroom move', 'A tail lift'] },
      refrigerated: { label: 'Refrigerated van', capacity: 'Up to 700 kg · held at 2–8 °C', fits: ['Fresh produce', 'Chilled catering', 'Flowers'] },
    },
  },
  es: {
    from: 'Desde',
    fits: (label) => `Qué cabe en: ${label}`,
    unavailable: 'No disponible para esta carga',
    vehicle: 'Vehículo',
    vehicles: {
      bike: { label: 'Bicicleta de carga', capacity: 'Hasta 25 kg · 60 × 40 × 40 cm', fits: ['Documentos', 'Un pedido de comida', 'Una caja pequeña'] },
      car: { label: 'Coche', capacity: 'Hasta 150 kg · 100 × 80 × 60 cm', fits: ['Dos maletas', 'Cuatro cajas', 'Una bicicleta'] },
      van: { label: 'Furgoneta', capacity: 'Hasta 800 kg · 240 × 150 × 140 cm', fits: ['Un sofá', 'La mudanza de un estudio', 'Media paleta'] },
      boxTruck: { label: 'Camión caja', capacity: 'Hasta 3500 kg · 420 × 200 × 210 cm', fits: ['Dos palés', 'La mudanza de un piso de dos dormitorios', 'Una plataforma elevadora'] },
      refrigerated: { label: 'Furgoneta refrigerada', capacity: 'Hasta 700 kg · entre 2 y 8 °C', fits: ['Productos frescos', 'Catering refrigerado', 'Flores'] },
    },
  },
  ca: {
    from: 'Des de',
    fits: (label) => `Què hi cap: ${label}`,
    unavailable: 'No disponible per a aquesta càrrega',
    vehicle: 'Vehicle',
    vehicles: {
      bike: { label: 'Bicicleta de càrrega', capacity: 'Fins a 25 kg · 60 × 40 × 40 cm', fits: ['Documents', 'Una comanda de menjar', 'Una caixa petita'] },
      car: { label: 'Cotxe', capacity: 'Fins a 150 kg · 100 × 80 × 60 cm', fits: ['Dues maletes', 'Quatre caixes', 'Una bicicleta'] },
      van: { label: 'Furgoneta', capacity: 'Fins a 800 kg · 240 × 150 × 140 cm', fits: ['Un sofà', "La mudança d'un estudi", 'Mig palet'] },
      boxTruck: { label: 'Camió caixa', capacity: 'Fins a 3.500 kg · 420 × 200 × 210 cm', fits: ['Dos palets', "La mudança d'un pis de dues habitacions", 'Una plataforma elevadora'] },
      refrigerated: { label: 'Furgoneta frigorífica', capacity: 'Fins a 700 kg · entre 2 i 8 °C', fits: ['Productes frescos', 'Càtering refrigerat', 'Flors'] },
    },
  },
  de: {
    from: 'Ab',
    fits: (label) => `Was in folgendes Fahrzeug passt: ${label}`,
    unavailable: 'Für diese Ladung nicht verfügbar',
    vehicle: 'Fahrzeug',
    vehicles: {
      bike: { label: 'Lastenrad', capacity: 'Bis 25 kg · 60 × 40 × 40 cm', fits: ['Dokumente', 'Eine Essensbestellung', 'Ein kleiner Karton'] },
      car: { label: 'Auto', capacity: 'Bis 150 kg · 100 × 80 × 60 cm', fits: ['Zwei Koffer', 'Vier Kartons', 'Ein Fahrrad'] },
      van: { label: 'Transporter', capacity: 'Bis 800 kg · 240 × 150 × 140 cm', fits: ['Ein Sofa', 'Ein Einzimmer-Umzug', 'Eine halbe Palette'] },
      boxTruck: { label: 'Kofferaufbau-Lkw', capacity: 'Bis 3.500 kg · 420 × 200 × 210 cm', fits: ['Zwei Paletten', 'Ein Dreizimmer-Umzug', 'Eine Ladebordwand'] },
      refrigerated: { label: 'Kühltransporter', capacity: 'Bis 700 kg · bei 2–8 °C', fits: ['Frische Lebensmittel', 'Gekühltes Catering', 'Blumen'] },
    },
  },
  fr: {
    from: 'À partir de',
    fits: (label) => `Ce qui tient dans : ${label}`,
    unavailable: 'Indisponible pour ce chargement',
    vehicle: 'Véhicule',
    vehicles: {
      bike: { label: 'Vélo cargo', capacity: "Jusqu'à 25 kg · 60 × 40 × 40 cm", fits: ['Des documents', 'Une commande de repas', 'Un petit carton'] },
      car: { label: 'Voiture', capacity: "Jusqu'à 150 kg · 100 × 80 × 60 cm", fits: ['Deux valises', 'Quatre cartons', 'Un vélo'] },
      van: { label: 'Fourgonnette', capacity: "Jusqu'à 800 kg · 240 × 150 × 140 cm", fits: ['Un canapé', "Le déménagement d'un studio", 'Une demi-palette'] },
      boxTruck: { label: 'Camion fourgon', capacity: "Jusqu'à 3 500 kg · 420 × 200 × 210 cm", fits: ['Deux palettes', "Le déménagement d'un T3", 'Un hayon élévateur'] },
      refrigerated: { label: 'Fourgon frigorifique', capacity: "Jusqu'à 700 kg · entre 2 et 8 °C", fits: ['Produits frais', 'Traiteur réfrigéré', 'Des fleurs'] },
    },
  },
  it: {
    from: 'Da',
    fits: (label) => `Cosa entra in: ${label}`,
    unavailable: 'Non disponibile per questo carico',
    vehicle: 'Veicolo',
    vehicles: {
      bike: { label: 'Cargo bike', capacity: 'Fino a 25 kg · 60 × 40 × 40 cm', fits: ['Documenti', 'Un ordine di cibo', 'Una scatola piccola'] },
      car: { label: 'Auto', capacity: 'Fino a 150 kg · 100 × 80 × 60 cm', fits: ['Due valigie', 'Quattro scatoloni', 'Una bicicletta'] },
      van: { label: 'Furgone', capacity: 'Fino a 800 kg · 240 × 150 × 140 cm', fits: ['Un divano', 'Il trasloco di un monolocale', 'Mezzo pallet'] },
      boxTruck: { label: 'Camion furgonato', capacity: 'Fino a 3.500 kg · 420 × 200 × 210 cm', fits: ['Due pallet', 'Il trasloco di un trilocale', 'Una sponda idraulica'] },
      refrigerated: { label: 'Furgone refrigerato', capacity: 'Fino a 700 kg · tra 2 e 8 °C', fits: ['Prodotti freschi', 'Catering refrigerato', 'Fiori'] },
    },
  },
  pt: {
    from: 'A partir de',
    fits: (label) => `O que cabe em: ${label}`,
    unavailable: 'Indisponível para esta carga',
    vehicle: 'Veículo',
    vehicles: {
      bike: { label: 'Bicicleta de carga', capacity: 'Até 25 kg · 60 × 40 × 40 cm', fits: ['Documentos', 'Um pedido de comida', 'Uma caixa pequena'] },
      car: { label: 'Carro', capacity: 'Até 150 kg · 100 × 80 × 60 cm', fits: ['Duas malas', 'Quatro caixas', 'Uma bicicleta'] },
      van: { label: 'Van', capacity: 'Até 800 kg · 240 × 150 × 140 cm', fits: ['Um sofá', 'A mudança de um estúdio', 'Meio palete'] },
      boxTruck: { label: 'Caminhão baú', capacity: 'Até 3.500 kg · 420 × 200 × 210 cm', fits: ['Dois paletes', 'A mudança de um apartamento de dois quartos', 'Uma plataforma elevatória'] },
      refrigerated: { label: 'Van refrigerada', capacity: 'Até 700 kg · entre 2 e 8 °C', fits: ['Hortifrúti', 'Bufê refrigerado', 'Flores'] },
    },
  },
  ru: {
    from: 'От',
    fits: (label) => `Что помещается: ${label}`,
    unavailable: 'Не подходит для этого груза',
    vehicle: 'Транспорт',
    vehicles: {
      bike: { label: 'Грузовой велосипед', capacity: 'До 25 кг · 60 × 40 × 40 см', fits: ['Документы', 'Заказ еды', 'Небольшая коробка'] },
      car: { label: 'Легковой автомобиль', capacity: 'До 150 кг · 100 × 80 × 60 см', fits: ['Два чемодана', 'Четыре коробки', 'Велосипед'] },
      van: { label: 'Фургон', capacity: 'До 800 кг · 240 × 150 × 140 см', fits: ['Диван', 'Переезд из студии', 'Полпаллеты'] },
      boxTruck: { label: 'Грузовик с кузовом', capacity: 'До 3500 кг · 420 × 200 × 210 см', fits: ['Две паллеты', 'Переезд из двухкомнатной квартиры', 'Гидроборт'] },
      refrigerated: { label: 'Рефрижератор', capacity: 'До 700 кг · при 2–8 °C', fits: ['Свежие продукты', 'Охлаждённый кейтеринг', 'Цветы'] },
    },
  },
  tr: {
    from: 'Başlangıç',
    fits: (label) => `${label} içine neler sığar`,
    unavailable: 'Bu yük için uygun değil',
    vehicle: 'Araç',
    vehicles: {
      bike: { label: 'Kargo bisikleti', capacity: '25 kg’a kadar · 60 × 40 × 40 cm', fits: ['Evrak', 'Yemek siparişi', 'Küçük bir kutu'] },
      car: { label: 'Otomobil', capacity: '150 kg’a kadar · 100 × 80 × 60 cm', fits: ['İki bavul', 'Dört koli', 'Bir bisiklet'] },
      van: { label: 'Panelvan', capacity: '800 kg’a kadar · 240 × 150 × 140 cm', fits: ['Bir kanepe', 'Stüdyo daire taşıma', 'Yarım palet'] },
      boxTruck: { label: 'Kapalı kasa kamyon', capacity: '3.500 kg’a kadar · 420 × 200 × 210 cm', fits: ['İki palet', '2+1 ev taşıma', 'Hidrolik kapak'] },
      refrigerated: { label: 'Frigorifik panelvan', capacity: '700 kg’a kadar · 2–8 °C arası', fits: ['Taze ürünler', 'Soğuk ikram', 'Çiçekler'] },
    },
  },
  ja: {
    from: '最低料金',
    fits: (label) => `${label}に積めるもの`,
    unavailable: 'この荷物には利用できません',
    vehicle: '車両',
    vehicles: {
      bike: { label: 'カーゴバイク', capacity: '最大 25 kg · 60 × 40 × 40 cm', fits: ['書類', 'フードの注文', '小さな箱'] },
      car: { label: '乗用車', capacity: '最大 150 kg · 100 × 80 × 60 cm', fits: ['スーツケース2個', '段ボール4箱', '自転車1台'] },
      van: { label: 'バン', capacity: '最大 800 kg · 240 × 150 × 140 cm', fits: ['ソファ', 'ワンルームの引っ越し', 'パレット半分'] },
      boxTruck: { label: '箱型トラック', capacity: '最大 3,500 kg · 420 × 200 × 210 cm', fits: ['パレット2枚', '2LDKの引っ越し', 'パワーゲート'] },
      refrigerated: { label: '冷蔵バン', capacity: '最大 700 kg · 2〜8 °C を維持', fits: ['生鮮食品', '冷蔵ケータリング', '花'] },
    },
  },
  zh: {
    from: '起价',
    fits: (label) => `${label}能装下什么`,
    unavailable: '不适用于此货物',
    vehicle: '车型',
    vehicles: {
      bike: { label: '货运自行车', capacity: '最多 25 kg · 60 × 40 × 40 cm', fits: ['文件', '一份外卖', '一个小箱子'] },
      car: { label: '轿车', capacity: '最多 150 kg · 100 × 80 × 60 cm', fits: ['两个行李箱', '四个纸箱', '一辆自行车'] },
      van: { label: '面包车', capacity: '最多 800 kg · 240 × 150 × 140 cm', fits: ['一张沙发', '单间搬家', '半个托盘'] },
      boxTruck: { label: '厢式货车', capacity: '最多 3,500 kg · 420 × 200 × 210 cm', fits: ['两个托盘', '两居室搬家', '尾板升降'] },
      refrigerated: { label: '冷藏车', capacity: '最多 700 kg · 保持 2–8 °C', fits: ['生鲜食品', '冷藏餐饮', '鲜花'] },
    },
  },
  ar: {
    from: 'ابتداءً من',
    fits: (label) => `ما يتسع له ${label}`,
    unavailable: 'غير متاحة لهذه الحمولة',
    vehicle: 'المركبة',
    vehicles: {
      bike: { label: 'دراجة شحن', capacity: 'حتى 25 كغ · 60 × 40 × 40 سم', fits: ['مستندات', 'طلب طعام', 'صندوق صغير'] },
      car: { label: 'سيارة', capacity: 'حتى 150 كغ · 100 × 80 × 60 سم', fits: ['حقيبتا سفر', 'أربعة صناديق', 'دراجة هوائية'] },
      van: { label: 'فان', capacity: 'حتى 800 كغ · 240 × 150 × 140 سم', fits: ['أريكة', 'نقل أثاث استوديو', 'نصف منصة نقالة'] },
      boxTruck: { label: 'شاحنة صندوقية', capacity: 'حتى 3500 كغ · 420 × 200 × 210 سم', fits: ['منصتان نقالتان', 'نقل أثاث شقة بغرفتي نوم', 'رافعة خلفية'] },
      refrigerated: { label: 'فان مبرّد', capacity: 'حتى 700 كغ · بين 2 و8 °م', fits: ['منتجات طازجة', 'تموين مبرّد', 'زهور'] },
    },
  },
  hi: {
    from: 'शुरुआती कीमत',
    fits: (label) => `${label} में क्या आता है`,
    unavailable: 'इस सामान के लिए उपलब्ध नहीं',
    vehicle: 'वाहन',
    vehicles: {
      bike: { label: 'कार्गो बाइक', capacity: '25 kg तक · 60 × 40 × 40 cm', fits: ['दस्तावेज़', 'खाने का ऑर्डर', 'एक छोटा डिब्बा'] },
      car: { label: 'कार', capacity: '150 kg तक · 100 × 80 × 60 cm', fits: ['दो सूटकेस', 'चार डिब्बे', 'एक साइकिल'] },
      van: { label: 'वैन', capacity: '800 kg तक · 240 × 150 × 140 cm', fits: ['एक सोफ़ा', 'स्टूडियो फ़्लैट की शिफ़्टिंग', 'आधा पैलेट'] },
      boxTruck: { label: 'बॉक्स ट्रक', capacity: '3,500 kg तक · 420 × 200 × 210 cm', fits: ['दो पैलेट', '2BHK की शिफ़्टिंग', 'टेल लिफ़्ट'] },
      refrigerated: { label: 'रेफ़्रिजरेटेड वैन', capacity: '700 kg तक · 2–8 °C पर', fits: ['ताज़ी उपज', 'ठंडा कैटरिंग', 'फूल'] },
    },
  },
  bn: {
    from: 'শুরু',
    fits: (label) => `${label}-এ কী ধরে`,
    unavailable: 'এই মালের জন্য উপলব্ধ নয়',
    vehicle: 'যানবাহন',
    vehicles: {
      bike: { label: 'কার্গো বাইক', capacity: '২৫ কেজি পর্যন্ত · ৬০ × ৪০ × ৪০ সেমি', fits: ['নথিপত্র', 'খাবারের অর্ডার', 'একটি ছোট বাক্স'] },
      car: { label: 'গাড়ি', capacity: '১৫০ কেজি পর্যন্ত · ১০০ × ৮০ × ৬০ সেমি', fits: ['দুটি স্যুটকেস', 'চারটি বাক্স', 'একটি সাইকেল'] },
      van: { label: 'ভ্যান', capacity: '৮০০ কেজি পর্যন্ত · ২৪০ × ১৫০ × ১৪০ সেমি', fits: ['একটি সোফা', 'স্টুডিও বাসা বদল', 'অর্ধেক প্যালেট'] },
      boxTruck: { label: 'বক্স ট্রাক', capacity: '৩,৫০০ কেজি পর্যন্ত · ৪২০ × ২০০ × ২১০ সেমি', fits: ['দুটি প্যালেট', 'দুই শোবার ঘরের বাসা বদল', 'টেল লিফট'] },
      refrigerated: { label: 'রেফ্রিজারেটেড ভ্যান', capacity: '৭০০ কেজি পর্যন্ত · ২–৮ °সে-এ', fits: ['তাজা পণ্য', 'ঠান্ডা ক্যাটারিং', 'ফুল'] },
    },
  },
  id: {
    from: 'Mulai',
    fits: (label) => `Yang muat di ${label}`,
    unavailable: 'Tidak tersedia untuk muatan ini',
    vehicle: 'Kendaraan',
    vehicles: {
      bike: { label: 'Sepeda kargo', capacity: 'Hingga 25 kg · 60 × 40 × 40 cm', fits: ['Dokumen', 'Pesanan makanan', 'Kotak kecil'] },
      car: { label: 'Mobil', capacity: 'Hingga 150 kg · 100 × 80 × 60 cm', fits: ['Dua koper', 'Empat kardus', 'Sepeda'] },
      van: { label: 'Van', capacity: 'Hingga 800 kg · 240 × 150 × 140 cm', fits: ['Sofa', 'Pindahan studio', 'Setengah palet'] },
      boxTruck: { label: 'Truk boks', capacity: 'Hingga 3.500 kg · 420 × 200 × 210 cm', fits: ['Dua palet', 'Pindahan rumah dua kamar', 'Tail lift'] },
      refrigerated: { label: 'Van berpendingin', capacity: 'Hingga 700 kg · suhu 2–8 °C', fits: ['Produk segar', 'Katering dingin', 'Bunga'] },
    },
  },
};
