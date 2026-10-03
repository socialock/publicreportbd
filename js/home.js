// Homepage logic: load, filter, search, paginate reports

const state = {
  q: "",
  category: "",
  page: 1,
  limit: 12,
  totalLoaded: 0,
  loading: false,
  hasMore: true,
};

const reportsList = document.getElementById("reportsList");
const loadingEl = document.getElementById("loading");
const emptyEl = document.getElementById("emptyState");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

function renderReportCard(r) {
  const loc = [r.area, r.district, r.division].filter(Boolean).join(", ");
  return `
    <a class="report-card" href="/report.html?id=${r.id}">
      <span class="badge">${escapeHtml(r.category)}</span>
      <h3>${escapeHtml(r.title)}</h3>
      <p class="desc">${escapeHtml(r.description)}</p>
      <div class="card-meta">
        <span><i class="fa-solid fa-user"></i>${escapeHtml(r.author)}</span>
        ${loc ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(loc)}</span>` : ""}
        <span><i class="fa-solid fa-clock"></i>${timeAgo(r.created_at)}</span>
      </div>
      <div class="card-footer">
        <div class="stats">
          <span><i class="fa-regular fa-heart"></i>${r.like_count || 0}</span>
          <span><i class="fa-regular fa-comment"></i>${r.comment_count || 0}</span>
        </div>
        <span>বিস্তারিত <i class="fa-solid fa-arrow-right"></i></span>
      </div>
    </a>
  `;
}

async function loadReports(reset = false) {
  if (state.loading) return;
  if (reset) {
    state.page = 1;
    state.totalLoaded = 0;
    state.hasMore = true;
    reportsList.innerHTML = "";
    emptyEl.classList.add("hidden");
  }
  if (!state.hasMore) return;

  state.loading = true;
  loadingEl.classList.remove("hidden");
  loadMoreBtn.classList.add("hidden");

  try {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.category) params.set("category", state.category);
    params.set("page", state.page);
    params.set("limit", state.limit);

    const data = await apiFetch("/api/reports?" + params.toString());
    const reports = data.reports || [];

    if (reports.length === 0 && state.totalLoaded === 0) {
      emptyEl.classList.remove("hidden");
    }

    reports.forEach((r) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = renderReportCard(r);
      reportsList.appendChild(wrap.firstElementChild);
    });

    state.totalLoaded += reports.length;
    state.hasMore = reports.length === state.limit;
    state.page++;

    if (state.hasMore) loadMoreBtn.classList.remove("hidden");
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    loadingEl.classList.add("hidden");
  }
}

// Debounced search
let searchTimer;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = e.target.value.trim();
    loadReports(true);
  }, 350);
});

// Category filter
categoryFilter.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  categoryFilter.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  state.category = btn.dataset.cat || "";
  loadReports(true);
});

loadMoreBtn.addEventListener("click", () => loadReports(false));

// Initial
loadReports(true);