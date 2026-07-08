// Ankalya - çoklu dil sistemi (TR / EN / DE / FR / RU / UK)
// Kullanım: metni değiştirmek istediğiniz elemana data-i18n="anahtar" ekleyin,
// bu sözlüğe o anahtar için 6 dilde çeviri ekleyin.

const ANKALYA_LANGS = ["tr", "en", "de", "fr", "ru", "uk"];
const ANKALYA_LANG_NAMES = { tr: "Türkçe", en: "English", de: "Deutsch", fr: "Français", ru: "Русский", uk: "Українська" };

const ANKALYA_DICT = {
  // ---- Promo bar & nav ----
  promo_bar: { tr: "5 evimiz de Antalya Muratpaşa'da —", en: "All 5 of our homes are in Muratpaşa, Antalya —", de: "Alle 5 unserer Wohnungen liegen in Muratpaşa, Antalya —", fr: "Nos 5 logements sont situés à Muratpaşa, Antalya —", ru: "Все наши 5 апартаментов находятся в Муратпаше, Анталия —", uk: "Усі наші 5 помешкань розташовані в Муратпаші, Анталія —" },
  promo_cta: { tr: "hemen ön onay talebi gönderin →", en: "send a pre-approval request now →", de: "jetzt Voranfrage senden →", fr: "envoyez une demande de pré-approbation →", ru: "отправьте предварительный запрос →", uk: "надішліть попередній запит →" },
  nav_home: { tr: "Ana Sayfa", en: "Home", de: "Startseite", fr: "Accueil", ru: "Главная", uk: "Головна" },
  nav_apartments: { tr: "Evlerimiz", en: "Our Homes", de: "Unsere Wohnungen", fr: "Nos Logements", ru: "Наши апартаменты", uk: "Наші помешкання" },
  nav_about: { tr: "Hakkımızda", en: "About Us", de: "Über Uns", fr: "À Propos", ru: "О нас", uk: "Про нас" },
  nav_faq: { tr: "SSS", en: "FAQ", de: "FAQ", fr: "FAQ", ru: "Частые вопросы", uk: "Часті питання" },
  nav_contact: { tr: "İletişim", en: "Contact", de: "Kontakt", fr: "Contact", ru: "Контакты", uk: "Контакти" },
  nav_book: { tr: "Rezervasyon Talebi", en: "Booking Request", de: "Buchungsanfrage", fr: "Demande de Réservation", ru: "Запрос на бронь", uk: "Запит на бронювання" },

  // ---- Footer ----
  footer_desc: { tr: "Antalya Muratpaşa'da, şehrin kalbinde 5 özenle hazırlanmış tatil evi.", en: "5 carefully prepared holiday homes in the heart of Muratpaşa, Antalya.", de: "5 sorgfältig eingerichtete Ferienwohnungen im Herzen von Muratpaşa, Antalya.", fr: "5 logements de vacances soigneusement aménagés au cœur de Muratpaşa, Antalya.", ru: "5 тщательно подготовленных апартаментов в самом сердце Муратпаши, Анталия.", uk: "5 ретельно облаштованих помешкань у серці Муратпаші, Анталія." },
  footer_apartments: { tr: "Evlerimiz", en: "Our Homes", de: "Unsere Wohnungen", fr: "Nos Logements", ru: "Наши апартаменты", uk: "Наші помешкання" },
  footer_corporate: { tr: "Kurumsal", en: "Company", de: "Unternehmen", fr: "Entreprise", ru: "О компании", uk: "Компанія" },
  footer_contact: { tr: "İletişim", en: "Contact", de: "Kontakt", fr: "Contact", ru: "Контакты", uk: "Контакти" },
  footer_whatsapp: { tr: "WhatsApp & Telefon", en: "WhatsApp & Phone", de: "WhatsApp & Telefon", fr: "WhatsApp & Téléphone", ru: "WhatsApp и телефон", uk: "WhatsApp і телефон" },
  footer_copyright: { tr: "© 2026 Ankalya. Tüm hakları saklıdır.", en: "© 2026 Ankalya. All rights reserved.", de: "© 2026 Ankalya. Alle Rechte vorbehalten.", fr: "© 2026 Ankalya. Tous droits réservés.", ru: "© 2026 Ankalya. Все права защищены.", uk: "© 2026 Ankalya. Усі права захищено." },

  // ---- Ortak butonlar / basliklar ----
  btn_view_details: { tr: "Detayları Gör", en: "View Details", de: "Details ansehen", fr: "Voir les détails", ru: "Подробнее", uk: "Детальніше" },
  btn_send_request: { tr: "Bu Ev İçin Ön Onay Talebi Gönder", en: "Send Pre-Approval Request for This Home", de: "Voranfrage für dieses Zuhause senden", fr: "Envoyer une demande pour ce logement", ru: "Отправить запрос на это жильё", uk: "Надіслати запит на це помешкання" },
  section_about_home: { tr: "Ev Hakkında", en: "About This Home", de: "Über diese Wohnung", fr: "À propos du logement", ru: "О жилье", uk: "Про помешкання" },
  section_amenities: { tr: "Olanaklar", en: "Amenities", de: "Ausstattung", fr: "Équipements", ru: "Удобства", uk: "Зручності" },
  section_know_before: { tr: "Bilmeniz Gerekenler", en: "Good to Know", de: "Wissenswertes", fr: "À savoir", ru: "Важно знать", uk: "Важливо знати" },
  section_availability: { tr: "Canlı Müsaitlik", en: "Live Availability", de: "Live-Verfügbarkeit", fr: "Disponibilité en direct", ru: "Наличие в реальном времени", uk: "Наявність у реальному часі" },
  section_reviews: { tr: "Misafir Yorumları", en: "Guest Reviews", de: "Gästebewertungen", fr: "Avis des voyageurs", ru: "Отзывы гостей", uk: "Відгуки гостей" },
  legend_free: { tr: "Müsait", en: "Available", de: "Verfügbar", fr: "Disponible", ru: "Свободно", uk: "Вільно" },
  legend_busy: { tr: "Dolu", en: "Booked", de: "Belegt", fr: "Réservé", ru: "Занято", uk: "Зайнято" },
  loading: { tr: "Yükleniyor...", en: "Loading...", de: "Wird geladen...", fr: "Chargement...", ru: "Загрузка...", uk: "Завантаження..." },

  // ---- Ana sayfa ----
  hero_title: { tr: "Antalya'da kendi eviniz gibi hissedin", en: "Feel at home in Antalya", de: "Fühlen Sie sich zu Hause in Antalya", fr: "Sentez-vous chez vous à Antalya", ru: "Почувствуйте себя как дома в Анталии", uk: "Відчуйте себе як удома в Анталії" },
  hero_lead: { tr: "Muratpaşa'nın kalbinde, şehre ve sahile yakın 5 özenle döşenmiş dairede konforlu ve güvenli bir konaklama. Ankalya ailesi olarak sizi ağırlamaktan mutluluk duyarız.", en: "Comfortable and safe stays in 5 carefully furnished apartments in the heart of Muratpaşa, close to the city and the beach. The Ankalya family is delighted to host you.", de: "Komfortabler und sicherer Aufenthalt in 5 liebevoll eingerichteten Wohnungen im Herzen von Muratpaşa, nah an Stadt und Strand. Die Ankalya-Familie freut sich, Sie willkommen zu heißen.", fr: "Un séjour confortable et sûr dans 5 appartements soigneusement meublés au cœur de Muratpaşa, proches de la ville et de la plage. La famille Ankalya est ravie de vous accueillir.", ru: "Комфортное и безопасное проживание в 5 уютно обставленных апартаментах в самом сердце Муратпаши, рядом с городом и пляжем. Семья Ankalya рада принять вас.", uk: "Комфортне і безпечне проживання в 5 затишно облаштованих апартаментах у серці Муратпаші, поруч із містом і пляжем. Родина Ankalya рада вітати вас." },
  hero_btn_explore: { tr: "Evlerimizi Keşfedin", en: "Explore Our Homes", de: "Unsere Wohnungen entdecken", fr: "Découvrir nos logements", ru: "Смотреть апартаменты", uk: "Переглянути помешкання" },
  hero_btn_request: { tr: "Ön Onay Talebi Gönderin", en: "Send a Pre-Approval Request", de: "Voranfrage senden", fr: "Envoyer une demande", ru: "Отправить запрос", uk: "Надіслати запит" },
  home_apartments_title: { tr: "Evlerimiz", en: "Our Homes", de: "Unsere Wohnungen", fr: "Nos Logements", ru: "Наши апартаменты", uk: "Наші помешкання" },
  home_apartments_sub: { tr: "Her biri kendine has bir karaktere sahip, tamamı Muratpaşa'da konumlanmış 5 daire.", en: "5 apartments, each with its own character, all located in Muratpaşa.", de: "5 Wohnungen, jede mit eigenem Charakter, alle in Muratpaşa gelegen.", fr: "5 appartements, chacun avec son propre caractère, tous situés à Muratpaşa.", ru: "5 апартаментов, у каждого свой характер, все расположены в Муратпаше.", uk: "5 помешкань, кожне з власним характером, усі розташовані в Муратпаші." },
  why_title: { tr: "Neden Ankalya?", en: "Why Ankalya?", de: "Warum Ankalya?", fr: "Pourquoi Ankalya ?", ru: "Почему Ankalya?", uk: "Чому Ankalya?" },
  why_1: { tr: "Şehir merkezine ve sahile yürüme mesafesi", en: "Walking distance to the city center and the beach", de: "Fußläufig zum Stadtzentrum und zum Strand", fr: "À distance de marche du centre-ville et de la plage", ru: "Пешая доступность до центра города и пляжа", uk: "Пішки до центру міста та пляжу" },
  why_2: { tr: "Resmi Turizm Amaçlı Kiralanan Konut İzin Belgeli", en: "Officially licensed short-term rental properties", de: "Offiziell lizenzierte Ferienwohnungen", fr: "Logements de location de vacances officiellement agréés", ru: "Официально лицензированное краткосрочное жильё", uk: "Офіційно ліцензоване житло для оренди" },
  why_3: { tr: "7/24 Türkçe ve İngilizce iletişim desteği", en: "24/7 support in Turkish and English", de: "24/7 Support auf Türkisch und Englisch", fr: "Assistance 24h/24 en turc et en anglais", ru: "Поддержка 24/7 на турецком и английском", uk: "Підтримка 24/7 турецькою та англійською" },
  why_4: { tr: "Profesyonel temizlik ve hijyen standardı", en: "Professional cleaning and hygiene standards", de: "Professionelle Reinigungs- und Hygienestandards", fr: "Normes professionnelles de nettoyage et d'hygiène", ru: "Профессиональная уборка и стандарты гигиены", uk: "Професійне прибирання та стандарти гігієни" },
  why_5: { tr: "Ücretsiz Wi-Fi ve çamaşır makinesi", en: "Free Wi-Fi and washing machine", de: "Kostenloses Wi-Fi und Waschmaschine", fr: "Wi-Fi gratuit et machine à laver", ru: "Бесплатный Wi-Fi и стиральная машина", uk: "Безкоштовний Wi-Fi і пральна машина" },
  why_6: { tr: "Esnek giriş/çıkış saatleri", en: "Flexible check-in/check-out times", de: "Flexible Check-in-/Check-out-Zeiten", fr: "Horaires d'arrivée/départ flexibles", ru: "Гибкое время заезда/выезда", uk: "Гнучкий час заїзду/виїзду" },
  home_cta_title: { tr: "Tarihlerinizi bize bildirin", en: "Let us know your dates", de: "Teilen Sie uns Ihre Daten mit", fr: "Indiquez-nous vos dates", ru: "Сообщите нам ваши даты", uk: "Повідомте нам ваші дати" },
  home_cta_sub: { tr: "İstediğiniz evi ve tarihleri seçin, ön onay talebinizi hemen gönderin — size en kısa sürede dönüş yapalım.", en: "Choose your home and dates, send your pre-approval request now — we'll get back to you as soon as possible.", de: "Wählen Sie Ihre Wohnung und Ihre Daten, senden Sie jetzt Ihre Voranfrage — wir melden uns so schnell wie möglich.", fr: "Choisissez votre logement et vos dates, envoyez votre demande dès maintenant — nous vous répondrons rapidement.", ru: "Выберите жильё и даты, отправьте запрос — мы ответим вам как можно скорее.", uk: "Оберіть помешкання і дати, надішліть запит — ми відповімо якнайшвидше." },
};

function ankalyaApplyLang(lang) {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const entry = ANKALYA_DICT[key];
    if (entry && entry[lang]) el.textContent = entry[lang];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const entry = ANKALYA_DICT[key];
    if (entry && entry[lang]) el.setAttribute("placeholder", entry[lang]);
  });
  localStorage.setItem("ankalya_lang", lang);
  const sel = document.getElementById("lang-select");
  if (sel) sel.value = lang;
}

function ankalyaInitLangSwitcher() {
  const sel = document.getElementById("lang-select");
  if (!sel) return;
  sel.innerHTML = ANKALYA_LANGS.map((l) => `<option value="${l}">${ANKALYA_LANG_NAMES[l]}</option>`).join("");
  const saved = localStorage.getItem("ankalya_lang") || "tr";
  sel.value = saved;
  ankalyaApplyLang(saved);
  sel.addEventListener("change", (e) => ankalyaApplyLang(e.target.value));
}

document.addEventListener("DOMContentLoaded", ankalyaInitLangSwitcher);
