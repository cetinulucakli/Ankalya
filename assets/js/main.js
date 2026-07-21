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
  initChatWidget();
  initAvailabilitySearch();
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

// Paylasilan, iki aylik tiklanabilir tarih araligi takvimi. Hem daire
// sayfalarindaki musaitlik widget'i hem de rezervasyon sayfasindaki arama
// kutusu bu fonksiyonu kullanir - giris secildikten sonra takvim kapanmadan
// cikis da secilebilsin diye tek bir takvimde ikisi birden gosterilir.
// calEl: takvimin cizilecegi kapsayici <div>.
// options.getBusyRanges: () => [{start,end}, ...] (bos birakilirsa hicbir gun dolu sayilmaz).
// options.onSelect: (checkin, checkout) => {} - secim her degistiginde cagrilir.
function ankalyaMountRangeCalendar(calEl, options) {
  const getBusyRanges = (options && options.getBusyRanges) || (() => []);
  const onSelect = (options && options.onSelect) || (() => {});
  const maxMonthOffset = (options && options.maxMonthOffset) ?? AVAIL_MAX_MONTH_OFFSET;
  const state = { checkin: null, checkout: null, monthOffset: 0 };

  function isBusy(iso) {
    return getBusyRanges().some((r) => iso >= r.start && iso < r.end);
  }

  function isRangeFree(startIso, endIso) {
    let cur = startIso;
    while (cur < endIso) {
      if (isBusy(cur)) return false;
      cur = availNextIso(cur);
    }
    return true;
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
    render();
    onSelect(state.checkin, state.checkout);
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

  function render() {
    const today = new Date();
    const todayIso = availIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
    const m1 = new Date(today.getFullYear(), today.getMonth() + state.monthOffset, 1);
    const m2 = new Date(today.getFullYear(), today.getMonth() + state.monthOffset + 1, 1);
    calEl.innerHTML = `
      <div class="avail-cal-nav">
        <button type="button" class="avail-prev" ${state.monthOffset <= 0 ? "disabled" : ""} aria-label="Önceki ay">‹</button>
        <button type="button" class="avail-next" ${state.monthOffset >= maxMonthOffset ? "disabled" : ""} aria-label="Sonraki ay">›</button>
      </div>
      <div class="avail-months">${renderMonthGrid(m1, todayIso)}${renderMonthGrid(m2, todayIso)}</div>`;

    calEl.querySelectorAll(".avail-day").forEach((el) => {
      if (el.classList.contains("empty") || el.classList.contains("past") || el.classList.contains("busy")) return;
      el.addEventListener("click", () => onDayClick(el.dataset.date));
    });
    const prevBtn = calEl.querySelector(".avail-prev");
    const nextBtn = calEl.querySelector(".avail-next");
    if (prevBtn) prevBtn.addEventListener("click", () => { if (state.monthOffset > 0) { state.monthOffset--; render(); } });
    if (nextBtn) nextBtn.addEventListener("click", () => { if (state.monthOffset < maxMonthOffset) { state.monthOffset++; render(); } });
  }

  render();
  return {
    getState: () => ({ checkin: state.checkin, checkout: state.checkout }),
    refresh: render,
  };
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

  function fmtTR(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }

  function updateSelectedText(checkin, checkout) {
    if (!selectedEl) return;
    if (checkin && checkout) {
      const nightCount = (new Date(`${checkout}T00:00:00`) - new Date(`${checkin}T00:00:00`)) / 86400000;
      selectedEl.innerHTML = `<strong>${fmtTR(checkin)} → ${fmtTR(checkout)}</strong> · ${nightCount} gece`;
    } else if (checkin) {
      selectedEl.innerHTML = `Giriş: <strong>${fmtTR(checkin)}</strong> — çıkış tarihini seçin`;
    } else {
      selectedEl.textContent = "Giriş ve çıkış tarihinizi seçin.";
    }
  }

  function updateCta(checkin, checkout) {
    if (!ctaLink) return;
    if (checkin && checkout) {
      const sep = ctaBase.includes("?") ? "&" : "?";
      ctaLink.href = `${ctaBase}${sep}checkin=${checkin}&checkout=${checkout}`;
    } else {
      ctaLink.href = ctaBase;
    }
  }

  try {
    const res = await fetch(`${ANKALYA_API_BASE}/api/public/availability?apt=${encodeURIComponent(apt)}`);
    if (!res.ok) throw new Error("API henüz hazır değil");
    const data = await res.json();
    const busyRanges = data.busy_ranges || [];
    statusEl.innerHTML = `<span class="avail-dot ok"></span> Müsaitlik güncel`;
    ankalyaMountRangeCalendar(calEl, {
      getBusyRanges: () => busyRanges,
      onSelect: (checkin, checkout) => { updateSelectedText(checkin, checkout); updateCta(checkin, checkout); },
    });
    updateSelectedText(null, null);
    updateCta(null, null);
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
    msg.textContent = ankalyaT("form_msg_sending");
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`${ANKALYA_API_BASE}/api/public/booking-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      msg.className = "ok";
      msg.textContent = ankalyaT("form_msg_success");
      form.reset();
    } catch (err) {
      msg.className = "err";
      msg.textContent = ankalyaT("form_msg_error");
    }
  });
}

// ---------- Chatbot (yer tutucu) ----------
// Hazir sorulardan olusan basit bir yardim widget'i - gercek (Claude destekli)
// asistan gelene kadar burada duruyor. Degistirmek icin initChatWidget()
// cagrisini kaldirip yeni widget'in kendi kurulum kodunu eklemeniz yeterli.
const ANKALYA_CHAT_QA = ["chat_q1", "chat_q2", "chat_q3", "chat_q4", "chat_q5"];

function initChatWidget() {
  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.className = "chat-bubble";
  bubble.setAttribute("aria-label", "Chat");
  bubble.innerHTML = "💬";

  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.innerHTML = `
    <div class="chat-panel-header">
      <span data-i18n="chat_title">Ankalya Asistan</span>
      <button type="button" class="chat-close" aria-label="Kapat">✕</button>
    </div>
    <div class="chat-log"></div>
    <div class="chat-quick-replies"></div>
    <a class="chat-faq-link" href="sss.html" data-i18n="chat_faq_more">Daha fazla soru için SSS sayfamıza göz atın →</a>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  const logEl = panel.querySelector(".chat-log");
  const repliesEl = panel.querySelector(".chat-quick-replies");
  const faqLink = panel.querySelector(".chat-faq-link");
  faqLink.setAttribute("href", location.pathname.includes("/evler/") ? "../sss.html" : "sss.html");

  function addBubble(text, who) {
    const b = document.createElement("div");
    b.className = `chat-bubble-msg ${who}`;
    b.textContent = text;
    logEl.appendChild(b);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderQuickReplies() {
    repliesEl.innerHTML = "";
    ANKALYA_CHAT_QA.forEach((qKey) => {
      const aKey = qKey.replace("chat_q", "chat_a");
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-chip";
      chip.textContent = ankalyaT(qKey);
      chip.addEventListener("click", () => {
        addBubble(ankalyaT(qKey), "user");
        addBubble(ankalyaT(aKey), "bot");
      });
      repliesEl.appendChild(chip);
    });
  }

  function resetGreeting() {
    logEl.innerHTML = "";
    addBubble(ankalyaT("chat_greeting"), "bot");
    renderQuickReplies();
  }

  bubble.addEventListener("click", () => {
    const opening = !panel.classList.contains("open");
    panel.classList.toggle("open");
    bubble.classList.toggle("open");
    if (opening && !logEl.dataset.inited) {
      resetGreeting();
      logEl.dataset.inited = "1";
    }
  });
  panel.querySelector(".chat-close").addEventListener("click", () => {
    panel.classList.remove("open");
    bubble.classList.remove("open");
  });

  document.addEventListener("ankalya:langchange", () => {
    if (logEl.dataset.inited) resetGreeting();
  });
}

// ---------- Rezervasyon sayfasi: tum daireler icin musaitlik arama ----------
const ANKALYA_SEARCH_APTS = [
  { slug: "ankalya-1", name: "Ankalya 1", img: "assets/img/anka1/anka1-kapak.jpg" },
  { slug: "ankalya-3", name: "Ankalya 3", img: "assets/img/anka3/anka3-kapak.jpg" },
  { slug: "ankalya-5", name: "Ankalya 5", img: "assets/img/anka5/anka5-kapak.jpg" },
  { slug: "ankalya-7", name: "Ankalya 7", img: "assets/img/anka7/anka7-kapak.jpg" },
  { slug: "ankalya-24", name: "Ankalya 24", img: "assets/img/anka24/anka24-bina1.jpg" },
];

function ankalyaRangeOverlapsBusy(checkin, checkout, busyRanges) {
  return busyRanges.some((r) => checkin < r.end && checkout > r.start);
}

function ankalyaFmtTR(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

async function initAvailabilitySearch() {
  const form = document.getElementById("avail-search-form");
  if (!form) return;
  const statusEl = document.getElementById("avail-search-status");
  const resultsEl = document.getElementById("avail-search-results");
  const dateToggle = document.getElementById("search-dates-toggle");
  const dateBtnText = document.getElementById("search-dates-btn-text");
  const popover = document.getElementById("search-date-popover");
  const formSection = document.getElementById("booking-form-section");
  const btn = form.querySelector("button[type=submit]");
  let lastSearch = null;
  let searchCal = null;
  let picked = { checkin: null, checkout: null };

  function updateDateBtnText() {
    if (picked.checkin && picked.checkout) {
      dateBtnText.removeAttribute("data-i18n");
      dateBtnText.textContent = `${ankalyaFmtTR(picked.checkin)} → ${ankalyaFmtTR(picked.checkout)}`;
    } else if (picked.checkin) {
      dateBtnText.removeAttribute("data-i18n");
      dateBtnText.textContent = `${ankalyaFmtTR(picked.checkin)} → ?`;
    } else {
      dateBtnText.setAttribute("data-i18n", "search_dates_placeholder");
      dateBtnText.textContent = ankalyaT("search_dates_placeholder");
    }
  }

  function openPopover() {
    popover.classList.add("open");
    if (!searchCal) {
      searchCal = ankalyaMountRangeCalendar(popover, {
        onSelect: (checkin, checkout) => {
          picked = { checkin, checkout };
          updateDateBtnText();
          if (checkin && checkout) {
            closePopover();
            runSearch(checkin, checkout);
          }
        },
      });
    }
  }
  function closePopover() { popover.classList.remove("open"); }

  dateToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (popover.classList.contains("open")) closePopover(); else openPopover();
  });
  document.addEventListener("click", (e) => {
    if (!popover.classList.contains("open")) return;
    // composedPath kullanilir: takvim gunune tiklayinca calendar kendini
    // yeniden ciziyor (innerHTML), bu yuzden e.target tiklama aninda DOM'da
    // olsa bile bu noktada zaten kopmus (detached) bir dugum olabiliyor -
    // popover.contains(e.target) o zaman yanlislikla "disarida" sanip
    // popover'i aninda kapatiyordu. composedPath, tiklama anindaki gercek
    // yolu kullandigi icin bu sorunu yasamiyor.
    const path = e.composedPath ? e.composedPath() : [e.target];
    if (!path.includes(popover) && !path.includes(dateToggle)) closePopover();
  });

  function renderResults(results, checkin, checkout) {
    const availableCount = results.filter((r) => r.available).length;
    let html = availableCount === 0
      ? `<p class="search-all-busy">${ankalyaT("search_all_busy")}</p>`
      : `<p class="search-results-hint">${ankalyaT("search_results_hint")}</p>`;
    html += `<div class="apt-grid search-results-grid">`;
    results.forEach((r) => {
      const busy = r.available === false;
      const statusText = r.available === null ? "" : (busy ? ankalyaT("avail_status_busy") : ankalyaT("avail_status_available"));
      html += `
        <div class="apt-card search-result-card${busy ? " is-busy" : ""}">
          <a href="evler/${r.slug}.html"><div class="img-wrap"><img src="${r.img}" alt="${r.name}">${statusText ? `<span class="badge avail-badge ${busy ? "busy" : "free"}">${statusText}</span>` : ""}</div></a>
          <div class="body">
            <h3><a href="evler/${r.slug}.html">${r.name}</a></h3>
            <div class="search-result-actions">
              <a href="evler/${r.slug}.html" class="btn btn-outline" data-i18n="search_view_btn">${ankalyaT("search_view_btn")}</a>
              <button type="button" class="btn btn-primary choose-apt-btn" data-apt="${r.slug}" ${busy ? "disabled" : ""}>${ankalyaT("search_choose_btn")}</button>
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll(".choose-apt-btn:not([disabled])").forEach((b) => {
      b.addEventListener("click", () => {
        const sel = document.getElementById("apt");
        if (sel) sel.value = b.dataset.apt;
        document.getElementById("checkin").value = checkin;
        document.getElementById("checkout").value = checkout;
        if (typeof updateAptPreview === "function") updateAptPreview();
        formSection.style.display = "";
        document.getElementById("booking-form").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  async function runSearch(checkin, checkout) {
    statusEl.className = "";
    statusEl.textContent = ankalyaT("search_status_searching");
    resultsEl.innerHTML = "";
    btn.disabled = true;

    try {
      const results = await Promise.all(ANKALYA_SEARCH_APTS.map(async (apt) => {
        try {
          const res = await fetch(`${ANKALYA_API_BASE}/api/public/availability?apt=${encodeURIComponent(apt.slug)}`);
          if (!res.ok) throw new Error("failed");
          const data = await res.json();
          const busyRanges = data.busy_ranges || [];
          return { ...apt, available: !ankalyaRangeOverlapsBusy(checkin, checkout, busyRanges), ok: true };
        } catch (err) {
          return { ...apt, available: null, ok: false };
        }
      }));

      if (!results.some((r) => r.ok)) {
        statusEl.className = "err";
        statusEl.textContent = ankalyaT("search_status_error");
        return;
      }
      statusEl.textContent = "";
      lastSearch = { results, checkin, checkout };
      renderResults(results, checkin, checkout);
    } finally {
      btn.disabled = false;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const checkin = picked.checkin;
    const checkout = picked.checkout;
    statusEl.className = "";
    if (!checkin || !checkout) {
      statusEl.className = "err";
      statusEl.textContent = ankalyaT("search_no_dates");
      openPopover();
      return;
    }
    runSearch(checkin, checkout);
  });

  updateDateBtnText();

  const params = new URLSearchParams(window.location.search);
  const ci = params.get("checkin");
  const co = params.get("checkout");
  if (ci && co) {
    picked = { checkin: ci, checkout: co };
    updateDateBtnText();
    runSearch(ci, co);
  }

  document.addEventListener("ankalya:langchange", () => {
    if (lastSearch) renderResults(lastSearch.results, lastSearch.checkin, lastSearch.checkout);
    if (!picked.checkin) updateDateBtnText();
  });
}
