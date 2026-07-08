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
});

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

// ---------- Canlı doluluk ----------
// Her daire sayfasında <div id="avail-widget" data-apt="ankalya-3"> beklenir.
async function initAvailability() {
  const widget = document.getElementById("avail-widget");
  if (!widget) return;
  const apt = widget.dataset.apt;
  const statusEl = widget.querySelector(".avail-status");
  const calEl = widget.querySelector("#avail-calendar");

  try {
    const res = await fetch(`${ANKALYA_API_BASE}/api/public/availability?apt=${encodeURIComponent(apt)}`);
    if (!res.ok) throw new Error("API henüz hazır değil");
    const data = await res.json();
    renderAvailability(calEl, statusEl, data.busy_ranges || []);
  } catch (err) {
    statusEl.innerHTML = `<span class="avail-dot"></span> Canlı müsaitlik yakında burada olacak — şimdilik tarihlerinizi aşağıdaki formdan gönderin, size dönüş yapalım.`;
    calEl.textContent = "";
  }
}

function renderAvailability(calEl, statusEl, busyRanges) {
  statusEl.innerHTML = `<span class="avail-dot ok"></span> Müsaitlik güncel`;
  const today = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push(d);
  }
  calEl.innerHTML = months.map((m) => renderMonth(m, busyRanges)).join("");
}

function renderMonth(monthDate, busyRanges) {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthName = monthDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  let cells = "";
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const busy = busyRanges.some(r => date >= new Date(r.start) && date < new Date(r.end));
    cells += `<span title="${date.toLocaleDateString("tr-TR")}" style="display:inline-block;width:12px;height:12px;margin:1px;border-radius:3px;background:${busy ? '#f6d9d9' : '#dff2df'};border:1px solid ${busy ? '#c85c5c' : '#3f9142'}"></span>`;
  }
  return `<div style="margin-bottom:14px;"><strong>${monthName}</strong><div style="margin-top:6px;">${cells}</div></div>`;
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
