// Ankalya site - paylaşılan davranışlar (nav, SSS akordeon, müsaitlik, form)

// API tabanı: rezervasyon sistemindeki (mevcut, Railway'de çalışan) uygulamanın
// public/salt-okunur uç noktaları. Bu değeri, API canlıya alındığında güncelleyin.
const ANKALYA_API_BASE = "https://takvim.depodanadrese.com";

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initFaq();
  initAvailability();
  initBookingForm();
  initAmenityToggle();
  initGalleryThumbs();
  initReviewTranslate();
});

// ---------- Misafir yorumlarını çevir ----------
// Ücretsiz, resmi olmayan (dökümante edilmemiş) bir Google Translate uç noktası
// kullanılır; API anahtarı/ücret gerektirmez ama Google tarafından garanti
// edilmediğinden ileride durabilir — o durumda buton nazikçe hata mesajı gösterir.
function initReviewTranslate() {
  document.querySelectorAll(".review-card .rtext").forEach((rtext) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "review-translate-btn";
    btn.textContent = "🌐 Çevir";

    const out = document.createElement("div");
    out.className = "review-translated";
    out.style.display = "none";

    rtext.insertAdjacentElement("afterend", out);
    rtext.insertAdjacentElement("afterend", btn);

    btn.addEventListener("click", async () => {
      if (out.dataset.translated === "1") {
        const showing = out.style.display !== "none";
        out.style.display = showing ? "none" : "block";
        btn.textContent = showing ? "🌐 Çevir" : "↩ Orijinali göster";
        return;
      }
      const targetLang = (localStorage.getItem("ankalya_lang") || "tr").split("-")[0];
      btn.disabled = true;
      btn.textContent = "Çevriliyor...";
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(rtext.textContent)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("çeviri başarısız");
        const data = await res.json();
        const translated = data[0].map((chunk) => chunk[0]).join("");
        out.textContent = translated;
        out.dataset.translated = "1";
        out.style.display = "block";
        btn.textContent = "↩ Orijinali göster";
      } catch (err) {
        btn.textContent = "🌐 Çevir";
        out.textContent = "Çeviri şu anda yapılamadı, lütfen tekrar deneyin.";
        out.style.display = "block";
        out.classList.add("review-translate-error");
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// ---------- Foto galerisi: kucuk fotoya tiklayinca buyuk foto degisir ----------
function initGalleryThumbs() {
  document.querySelectorAll(".gallery-hero").forEach((hero) => {
    const scroll = hero.parentElement && hero.parentElement.querySelector(".gallery-scroll");
    if (!scroll) return;
    const heroImg = hero.querySelector("img");
    const heroLink = hero.querySelector("a");
    scroll.querySelectorAll(".thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const full = thumb.dataset.full;
        if (!full) return;
        const thumbImg = thumb.querySelector("img");
        heroImg.src = full;
        heroImg.alt = thumbImg ? thumbImg.alt : heroImg.alt;
        if (heroLink) heroLink.href = full;
        scroll.querySelectorAll(".thumb").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });
  });
}

function initAmenityToggle() {
  document.querySelectorAll(".amenity-toggle-btn").forEach((btn) => {
    const wrap = document.getElementById(btn.dataset.target);
    if (!wrap) return;
    const label = btn.querySelector(".label");
    btn.addEventListener("click", () => {
      const expanded = wrap.classList.toggle("expanded");
      btn.classList.toggle("open", expanded);
      label.textContent = expanded ? "Daha az göster" : "Daha fazlasını göster";
    });
  });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
}

function initFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", () => item.classList.toggle("open"));
  });
}

// ---------- Canlı doluluk (Airbnb tarzı tıklanabilir takvim) ----------
// Her daire sayfasında <div id="avail-widget" data-apt="ankalya-3"> beklenir.
const AVAIL_MAX_MONTH_OFFSET = 7; // ~9 aylık veri penceresiyle uyumlu (bkz. backend max_date)
const AVAIL_WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function availIsoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function availNextIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  return availIsoDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

async function initAvailability() {
  const widget = document.getElementById("avail-widget");
  if (!widget) return;
  const apt = widget.dataset.apt;
  const statusEl = widget.querySelector(".avail-status");
  const calEl = widget.querySelector("#avail-calendar");
  const selectedEl = widget.querySelector(".avail-selected");
  const ctaLink = document.getElementById("avail-cta");
  const ctaBase = ctaLink ? ctaLink.getAttribute("href") : `../rezervasyon.html?apt=${encodeURIComponent(apt)}`;

  const state = { busyRanges: [], checkin: null, checkout: null, monthOffset: 0 };

  function isBusy(iso) {
    return state.busyRanges.some((r) => iso >= r.start && iso < r.end);
  }

  function isRangeFree(startIso, endIso) {
    let cur = startIso;
    while (cur < endIso) {
      if (isBusy(cur)) return false;
      cur = availNextIso(cur);
    }
    return true;
  }

  function fmtTR(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }

  function updateSelectedText() {
    if (!selectedEl) return;
    if (state.checkin && state.checkout) {
      const nightCount = (new Date(`${state.checkout}T00:00:00`) - new Date(`${state.checkin}T00:00:00`)) / 86400000;
      selectedEl.innerHTML = `<strong>${fmtTR(state.checkin)} → ${fmtTR(state.checkout)}</strong> · ${nightCount} gece`;
    } else if (state.checkin) {
      selectedEl.innerHTML = `Giriş: <strong>${fmtTR(state.checkin)}</strong> — çıkış tarihini seçin`;
    } else {
      selectedEl.textContent = "Giriş ve çıkış tarihinizi seçin.";
    }
  }

  function updateCta() {
    if (!ctaLink) return;
    if (state.checkin && state.checkout) {
      const sep = ctaBase.includes("?") ? "&" : "?";
      ctaLink.href = `${ctaBase}${sep}checkin=${state.checkin}&checkout=${state.checkout}`;
    } else {
      ctaLink.href = ctaBase;
    }
  }

  function onDayClick(iso) {
    if (!state.checkin || state.checkout) {
      state.checkin = iso;
      state.checkout = null;
    } else if (iso <= state.checkin) {
      state.checkin = iso;
      state.checkout = null;
    } else if (isRangeFree(state.checkin, iso)) {
      state.checkout = iso;
    } else {
      state.checkin = iso;
      state.checkout = null;
    }
    renderCalendar();
    updateSelectedText();
    updateCta();
  }

  function renderMonthGrid(monthDate, todayIso) {
    const y = monthDate.getFullYear(), m = monthDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Pazartesi = 0
    const monthName = monthDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

    let cells = "";
    for (let i = 0; i < firstWeekday; i++) cells += `<span class="avail-day empty"></span>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = availIsoDate(y, m, d);
      const classes = ["avail-day"];
      if (iso < todayIso) classes.push("past");
      else if (isBusy(iso)) classes.push("busy");
      if (state.checkin && iso === state.checkin) classes.push("range-start");
      if (state.checkout && iso === state.checkout) classes.push("range-end");
      if (state.checkin && state.checkout && iso > state.checkin && iso < state.checkout) classes.push("in-range");
      cells += `<span class="${classes.join(" ")}" data-date="${iso}">${d}</span>`;
    }
    return `<div><div class="avail-month-title">${monthName}</div>
      <div class="avail-weekdays">${AVAIL_WEEKDAY_LABELS.map((w) => `<span>${w}</span>`).join("")}</div>
      <div class="avail-days">${cells}</div></div>`;
  }

  function renderCalendar() {
    const today = new Date();
    const todayIso = availIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
    const m1 = new Date(today.getFullYear(), today.getMonth() + state.monthOffset, 1);
    const m2 = new Date(today.getFullYear(), today.getMonth() + state.monthOffset + 1, 1);
    calEl.innerHTML = `
      <div class="avail-cal-nav">
        <button type="button" class="avail-prev" ${state.monthOffset <= 0 ? "disabled" : ""} aria-label="Önceki ay">‹</button>
        <button type="button" class="avail-next" ${state.monthOffset >= AVAIL_MAX_MONTH_OFFSET ? "disabled" : ""} aria-label="Sonraki ay">›</button>
      </div>
      <div class="avail-months">${renderMonthGrid(m1, todayIso)}${renderMonthGrid(m2, todayIso)}</div>`;

    calEl.querySelectorAll(".avail-day").forEach((el) => {
      if (el.classList.contains("empty") || el.classList.contains("past") || el.classList.contains("busy")) return;
      el.addEventListener("click", () => onDayClick(el.dataset.date));
    });
    const prevBtn = calEl.querySelector(".avail-prev");
    const nextBtn = calEl.querySelector(".avail-next");
    if (prevBtn) prevBtn.addEventListener("click", () => { if (state.monthOffset > 0) { state.monthOffset--; renderCalendar(); } });
    if (nextBtn) nextBtn.addEventListener("click", () => { if (state.monthOffset < AVAIL_MAX_MONTH_OFFSET) { state.monthOffset++; renderCalendar(); } });
  }

  try {
    const res = await fetch(`${ANKALYA_API_BASE}/api/public/availability?apt=${encodeURIComponent(apt)}`);
    if (!res.ok) throw new Error("API henüz hazır değil");
    const data = await res.json();
    state.busyRanges = data.busy_ranges || [];
    statusEl.innerHTML = `<span class="avail-dot ok"></span> Müsaitlik güncel`;
    renderCalendar();
    updateSelectedText();
    updateCta();
  } catch (err) {
    statusEl.innerHTML = `<span class="avail-dot"></span> Canlı müsaitlik yakında burada olacak — şimdilik tarihlerinizi aşağıdaki formdan gönderin, size dönüş yapalım.`;
    calEl.textContent = "";
  }
}

// ---------- Ön onay rezervasyon formu ----------
async function initBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;
  const msg = document.getElementById("form-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "";
    msg.textContent = "Gönderiliyor...";
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`${ANKALYA_API_BASE}/api/public/booking-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      msg.className = "ok";
      msg.textContent = "Talebiniz alındı! En kısa sürede size dönüş yapacağız.";
      form.reset();
    } catch (err) {
      msg.className = "err";
      msg.textContent = "Şu an gönderilemedi — lütfen bizi info@ankalya.tr adresinden veya WhatsApp'tan arayın.";
    }
  });
}
