// Create report page

if (!requireLoginOrRedirect()) {
  // stop script
  throw new Error("redirect");
}

const form = document.getElementById("reportForm");
const linkRows = document.getElementById("linkRows");
const addLinkBtn = document.getElementById("addLinkBtn");
const reportMsg = document.getElementById("reportMsg");

function addLinkRow(url = "", label = "") {
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <input type="url" placeholder="https://..." class="link-url" value="${escapeHtml(url)}" />
    <input type="text" placeholder="লেবেল (ঐচ্ছিক)" class="link-label" value="${escapeHtml(label)}" />
    <button type="button" title="সরান"><i class="fa-solid fa-trash"></i></button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  linkRows.appendChild(row);
}

addLinkBtn.addEventListener("click", () => {
  if (linkRows.children.length >= 10) return;
  addLinkRow();
});

// start with one row
addLinkRow();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  reportMsg.textContent = "";
  reportMsg.className = "form-msg";

  const links = [];
  linkRows.querySelectorAll(".link-row").forEach((row) => {
    const url = row.querySelector(".link-url").value.trim();
    const label = row.querySelector(".link-label").value.trim();
    if (url) links.push({ url, label });
  });

  const payload = {
    category: document.getElementById("category").value,
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    division: document.getElementById("division").value,
    district: document.getElementById("district").value.trim(),
    area: document.getElementById("area").value.trim(),
    incident_date: document.getElementById("incidentDate").value || null,
    police_case_status: document.getElementById("policeStatus").value,
    case_reference: document.getElementById("caseReference").value.trim(),
    links,
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> জমা হচ্ছে...';

  try {
    const data = await apiFetch("/api/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    reportMsg.className = "form-msg success";
    reportMsg.textContent = "সফলভাবে জমা হয়েছে! রিডাইরেক্ট হচ্ছে...";
    setTimeout(() => (location.href = "/report.html?id=" + data.id), 700);
  } catch (err) {
    reportMsg.className = "form-msg error";
    reportMsg.textContent = err.message || "জমা দিতে ব্যর্থ";
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> রিপোর্ট জমা দিন';
  }
});