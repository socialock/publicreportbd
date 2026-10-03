// Single report page

const params = new URLSearchParams(location.search);
const reportId = parseInt(params.get("id") || "0", 10);

const loadingEl = document.getElementById("reportLoading");
const errorEl = document.getElementById("reportError");
const articleEl = document.getElementById("reportArticle");

const likeBtn = document.getElementById("likeBtn");
const likeCountEl = document.getElementById("likeCount");
const commentCountEl = document.getElementById("commentCount");
const shareBtn = document.getElementById("shareBtn");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentMsg = document.getElementById("commentMsg");
const commentsList = document.getElementById("commentsList");

let currentReport = null;

async function loadReport() {
  if (!reportId) {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    return;
  }
  try {
    const data = await apiFetch("/api/reports/" + reportId);
    currentReport = data.report;
    renderReport(currentReport);
    loadingEl.classList.add("hidden");
    articleEl.classList.remove("hidden");
    loadComments();
  } catch (err) {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    errorEl.querySelector("p").textContent = err.message || "রিপোর্ট পাওয়া যায়নি।";
  }
}

function renderReport(r) {
  document.getElementById("rCategory").textContent = r.category;
  document.getElementById("rTitle").textContent = r.title;
  document.getElementById("rAuthor").textContent = r.author;
  document.getElementById("rCreated").textContent = formatDate(r.created_at);
  document.title = r.title + " — Public Report BD";

  const loc = [r.area, r.district, r.division].filter(Boolean).join(", ");
  const locWrap = document.getElementById("rLocationWrap");
  if (loc) document.getElementById("rLocation").textContent = loc;
  else locWrap.style.display = "none";

  const incWrap = document.getElementById("rIncidentWrap");
  if (r.incident_date) document.getElementById("rIncident").textContent = r.incident_date;
  else incWrap.style.display = "none";

  const policeEl = document.getElementById("rPolice");
  policeEl.textContent = policeStatusLabel(r.police_case_status) +
    (r.case_reference ? " — রেফ: " + r.case_reference : "");
  policeEl.className = "police-status " + (r.police_case_status || "unknown");

  document.getElementById("rDescription").textContent = r.description;

  if (r.links && r.links.length) {
    const wrap = document.getElementById("rEvidenceWrap");
    const list = document.getElementById("rEvidenceList");
    list.innerHTML = "";
    r.links.forEach((l) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(l.url)}</a>
        ${l.label ? `<span class="label">${escapeHtml(l.label)}</span>` : ""}
      `;
      list.appendChild(li);
    });
    wrap.classList.remove("hidden");
  }

  likeCountEl.textContent = r.like_count || 0;
  commentCountEl.textContent = r.comment_count || 0;

  if (r.user_liked) {
    likeBtn.classList.add("liked");
    likeBtn.querySelector("i").className = "fa-solid fa-heart";
  } else {
    likeBtn.classList.remove("liked");
    likeBtn.querySelector("i").className = "fa-regular fa-heart";
  }
}

// Like
likeBtn.addEventListener("click", async () => {
  if (!getToken()) {
    location.href = "/auth.html?next=" + encodeURIComponent(location.pathname + location.search);
    return;
  }
  try {
    const data = await apiFetch("/api/reports/" + reportId + "/like", { method: "POST" });
    likeCountEl.textContent = data.like_count;
    if (data.liked) {
      likeBtn.classList.add("liked");
      likeBtn.querySelector("i").className = "fa-solid fa-heart";
    } else {
      likeBtn.classList.remove("liked");
      likeBtn.querySelector("i").className = "fa-regular fa-heart";
    }
  } catch (err) {
    alert(err.message);
  }
});

// Share
shareBtn.addEventListener("click", async () => {
  const url = location.origin + "/report.html?id=" + reportId;
  const title = currentReport ? currentReport.title : "Public Report";
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(url);
    alert("লিংক কপি হয়েছে!");
  } catch {
    prompt("এই লিংকটি কপি করুন:", url);
  }
});

// Focus comment input
document.getElementById("commentFocusBtn").addEventListener("click", () => {
  if (!getToken()) {
    location.href = "/auth.html?next=" + encodeURIComponent(location.pathname + location.search);
    return;
  }
  commentInput.focus();
  commentInput.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Load comments
async function loadComments() {
  try {
    const data = await apiFetch("/api/reports/" + reportId + "/comments");
    renderComments(data.comments || []);
  } catch (err) {
    console.error(err);
  }
}

function renderComments(list) {
  commentsList.innerHTML = "";
  if (!list.length) {
    commentsList.innerHTML = '<p style="color:var(--muted);font-size:14px;">এখনো কোনো মন্তব্য নেই।</p>';
    return;
  }
  list.forEach((c) => commentsList.appendChild(renderComment(c)));
}

function renderComment(c) {
  const div = document.createElement("div");
  div.className = "comment";
  div.innerHTML = `
    <div class="comment-head">
      <span class="author">${escapeHtml(c.author)}</span>
      <span>·</span>
      <span>${timeAgo(c.created_at)}</span>
    </div>
    <div class="comment-body">${escapeHtml(c.body)}</div>
    <button class="reply-btn" type="button"><i class="fa-solid fa-reply"></i> উত্তর দিন</button>
    <div class="reply-form hidden">
      <input type="text" placeholder="উত্তর লিখুন..." />
      <button class="btn btn-primary btn-sm" type="button"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
    <div class="comment-replies"></div>
  `;

  const repliesWrap = div.querySelector(".comment-replies");
  if (c.replies && c.replies.length) {
    c.replies.forEach((r) => repliesWrap.appendChild(renderComment(r)));
  }

  const replyBtn = div.querySelector(".reply-btn");
  const replyForm = div.querySelector(".reply-form");
  const replyInput = replyForm.querySelector("input");
  const replySubmit = replyForm.querySelector("button");

  replyBtn.addEventListener("click", () => {
    if (!getToken()) {
      location.href = "/auth.html?next=" + encodeURIComponent(location.pathname + location.search);
      return;
    }
    replyForm.classList.toggle("hidden");
    if (!replyForm.classList.contains("hidden")) replyInput.focus();
  });

  replySubmit.addEventListener("click", async () => {
    const body = replyInput.value.trim();
    if (body.length < 2) return;
    try {
      const data = await apiFetch("/api/reports/" + reportId + "/comments", {
        method: "POST",
        body: JSON.stringify({ body, parent_id: c.id }),
      });
      const newEl = renderComment({
        id: data.id,
        author: data.author,
        body: data.body,
        created_at: data.created_at,
        parent_id: c.id,
        replies: [],
      });
      repliesWrap.appendChild(newEl);
      replyInput.value = "";
      replyForm.classList.add("hidden");
      commentCountEl.textContent = (parseInt(commentCountEl.textContent, 10) || 0) + 1;
    } catch (err) {
      alert(err.message);
    }
  });

  return div;
}

// Post comment
commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  commentMsg.textContent = "";
  commentMsg.className = "form-msg";

  if (!getToken()) {
    location.href = "/auth.html?next=" + encodeURIComponent(location.pathname + location.search);
    return;
  }

  const body = commentInput.value.trim();
  if (body.length < 2) {
    commentMsg.className = "form-msg error";
    commentMsg.textContent = "কমপক্ষে ২ অক্ষর লিখুন";
    return;
  }

  try {
    await apiFetch("/api/reports/" + reportId + "/comments", {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    commentInput.value = "";
    commentMsg.className = "form-msg success";
    commentMsg.textContent = "মন্তব্য যোগ হয়েছে";
    commentCountEl.textContent = (parseInt(commentCountEl.textContent, 10) || 0) + 1;
    loadComments();
  } catch (err) {
    commentMsg.className = "form-msg error";
    commentMsg.textContent = err.message || "ব্যর্থ";
  }
});

loadReport();