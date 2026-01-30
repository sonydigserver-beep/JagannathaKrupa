// Countdown timer
(function () {
  const el = document.getElementById("countdown");
  if (!el) return;

  const deadlineStr = el.getAttribute("data-deadline");
  const deadline = new Date(deadlineStr).getTime();

  const daysEl = el.querySelector("[data-days]");
  const hoursEl = el.querySelector("[data-hours]");
  const minsEl = el.querySelector("[data-mins]");
  const secsEl = el.querySelector("[data-secs]");

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, deadline - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    const secs = Math.floor(diff / 1000);

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minsEl) minsEl.textContent = pad(mins);
    if (secsEl) secsEl.textContent = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();



// Shop Section Start
// Optional: chip active UI (demo only)
(function () {
  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
})();
// Price range number update
(function () {
  const range = document.getElementById("priceRange");
  const val = document.getElementById("priceVal");
  if (!range || !val) return;

  const sync = () => val.textContent = range.value;
  range.addEventListener("input", sync);
  sync();
})();

// Mobile sidebar open/close (offcanvas-like) [web:55]
(function () {
  const sidebar = document.getElementById("filterSidebar");
  const overlay = document.getElementById("filterOverlay");
  const openBtn = document.getElementById("openFilterBtn");
  const closeBtn = document.getElementById("closeFilterBtn");

  if (!sidebar || !overlay || !openBtn || !closeBtn) return;

  const open = () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// Card actions: cart / wishlist / share [web:69]
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".p-act");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const card = btn.closest(".p-card");
  const title = card?.querySelector(".p-title")?.textContent?.trim() || "Product";

  if (action === "wish") {
    btn.classList.toggle("is-active");
    btn.innerHTML = btn.classList.contains("is-active")
      ? '<i class="bi bi-heart-fill"></i>'
      : '<i class="bi bi-heart"></i>';
    return;
  }

  if (action === "share") {
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      alert("Link copied!");
    }
    return;
  }

  if (action === "cart") {
    alert(`Added to cart: ${title}`);
  }
});



// Product Details Page Start
// ----- Gallery thumbs -> main image + modal image -----
(function () {
  const mainImg = document.getElementById("mainProductImage");
  const modalImg = document.getElementById("modalProductImage");
  const thumbsWrap = document.getElementById("galleryThumbs");
  if (!mainImg || !modalImg || !thumbsWrap) return;

  thumbsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".thumb");
    if (!btn) return;
    const src = btn.getAttribute("data-src");
    if (!src) return;

    thumbsWrap.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");

    mainImg.src = src;
    modalImg.src = src;

    // update magnifier background instantly
    const root = document.getElementById("magnifierRoot");
    root?.dispatchEvent(new Event("jk:update-image"));
  });

  // keep modal in sync
  document.getElementById("imgModal")?.addEventListener("show.bs.modal", () => {
    modalImg.src = mainImg.src;
  });
})();

// ----- Size chips -----
(function () {
  const group = document.getElementById("sizeGroup");
  if (!group) return;

  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    group.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
})();

// ----- Copy highlights -----
(function () {
  const btn = document.getElementById("copyHighlightsBtn");
  const box = document.getElementById("highlightsBox");
  if (!btn || !box) return;

  btn.addEventListener("click", async () => {
    const pairs = [...box.querySelectorAll(".col-6")].map(col => {
      const k = col.querySelector(".text-muted")?.textContent?.trim() || "";
      const v = col.querySelector(".fw-semibold")?.textContent?.trim() || "";
      return (k && v) ? `${k}: ${v}` : "";
    }).filter(Boolean);

    try {
      await navigator.clipboard.writeText(pairs.join("\n"));
      btn.textContent = "COPIED";
      setTimeout(() => btn.textContent = "COPY", 1200);
    } catch {
      alert("Copy not supported in this browser.");
    }
  });
})();

// ----- People also viewed scroll buttons -----
(function () {
  const wrap = document.getElementById("alsoWrap");
  const prev = document.getElementById("prevAlso");
  const next = document.getElementById("nextAlso");
  if (!wrap || !prev || !next) return;

  const step = () => Math.min(320, wrap.clientWidth * 0.8);
  prev.addEventListener("click", () => wrap.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => wrap.scrollBy({ left: step(), behavior: "smooth" }));
})();

// ----- Desktop magnifier (hover lens + zoom pane) -----
(function () {
  const root = document.getElementById("magnifierRoot");
  const img = document.getElementById("mainProductImage");
  const lens = document.getElementById("zoomLens");
  const result = document.getElementById("zoomResult");
  if (!root || !img || !lens || !result) return;

  let zoom = 2.2; // premium feel without over-zoom
  let active = false;

  const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

  const setBg = () => {
    result.style.backgroundImage = `url('${img.src}')`;
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const move = (clientX, clientY) => {
    const rect = root.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const lw = lens.offsetWidth / 2;
    const lh = lens.offsetHeight / 2;

    const lx = clamp(x - lw, 0, rect.width - lens.offsetWidth);
    const ly = clamp(y - lh, 0, rect.height - lens.offsetHeight);

    lens.style.left = `${lx}px`;
    lens.style.top = `${ly}px`;

    // Compute background sizing from displayed image box
    const bgW = rect.width * zoom;
    const bgH = rect.height * zoom;

    result.style.backgroundSize = `${bgW}px ${bgH}px`;

    // position background so lens center matches zoom focus
    const cx = (lx + lw) / rect.width;
    const cy = (ly + lh) / rect.height;

    const bgPosX = clamp(-(cx * bgW - result.clientWidth / 2), -(bgW - result.clientWidth), 0);
    const bgPosY = clamp(-(cy * bgH - result.clientHeight / 2), -(bgH - result.clientHeight), 0);

    result.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
  };

  const show = () => {
    if (!isDesktop()) return;
    active = true;
    setBg();
    lens.style.display = "block";
    result.style.display = "block";
  };

  const hide = () => {
    active = false;
    lens.style.display = "none";
    result.style.display = "none";
  };

  // Update background when image changes
  root.addEventListener("jk:update-image", setBg);

  // Mouse
  root.addEventListener("mouseenter", () => show());
  root.addEventListener("mouseleave", () => hide());
  root.addEventListener("mousemove", (e) => {
    if (!active) return;
    move(e.clientX, e.clientY);
  });

  // Touch: disable hover zoom (mobile uses modal)
  root.addEventListener("touchstart", () => hide(), { passive: true });

  // Recalc on resize
  window.addEventListener("resize", () => {
    if (!isDesktop()) hide();
  });
})();

// ----- Modal zoom: buttons + drag-to-pan -----
(function () {
  const stage = document.getElementById("zoomStage");
  const img = document.getElementById("modalProductImage");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomResetBtn = document.getElementById("zoomResetBtn");
  if (!stage || !img || !zoomInBtn || !zoomOutBtn || !zoomResetBtn) return;

  let scale = 1;
  let x = 0, y = 0;
  let dragging = false;
  let startX = 0, startY = 0;

  const apply = () => {
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const reset = () => {
    scale = 1;
    x = 0; y = 0;
    apply();
  };

  const clampPan = () => {
    // keep some bounds when zoomed; simple but effective
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const maxX = (w * (scale - 1)) / 2;
    const maxY = (h * (scale - 1)) / 2;
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
  };

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(4, scale + 0.35);
    clampPan();
    apply();
  });

  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(1, scale - 0.35);
    clampPan();
    apply();
  });

  zoomResetBtn.addEventListener("click", reset);

  stage.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    startX = e.clientX - x;
    startY = e.clientY - y;
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    x = e.clientX - startX;
    y = e.clientY - startY;
    clampPan();
    apply();
  });

  stage.addEventListener("pointerup", () => dragging = false);
  stage.addEventListener("pointercancel", () => dragging = false);

  // reset whenever modal opens
  document.getElementById("imgModal")?.addEventListener("show.bs.modal", reset);
})();
