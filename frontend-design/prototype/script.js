const API_BASE = "http://localhost:3001";
const DEMO_ADMIN = {
  username: "admin",
  password: "Admin123!"
};

const navItems = Array.from(document.querySelectorAll("[data-view-target]"));
const jumpItems = Array.from(document.querySelectorAll("[data-view-jump]"));
const views = Array.from(document.querySelectorAll(".view"));
const assistantDrawer = document.getElementById("assistant-drawer");
const assistantToggle = document.getElementById("assistant-toggle");
const assistantToggleInline = document.getElementById("assistant-toggle-inline");
const assistantClose = document.getElementById("assistant-close");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const compareModeAll = document.getElementById("compare-mode-all");
const compareModeDiff = document.getElementById("compare-mode-diff");
const compareTable = document.querySelector(".compare-table");
const validateFormButton = document.getElementById("validate-form");
const publishButton = document.getElementById("publish-button");
const toast = document.getElementById("toast");
const validationPanel = document.getElementById("validation-panel");
const editorForm = document.getElementById("editor-form");
const globalSearchInput = document.getElementById("global-search");
const globalSearchButton = document.querySelector(".topbar-search .primary-button");
const searchResultTitle = document.querySelector(".result-head h3");
const searchResultKeyword = document.querySelector(".result-head .muted");
const searchResultList = document.querySelector(".result-list");
const metricCards = Array.from(document.querySelectorAll(".metric-card strong"));

let toastTimer = null;
let adminAccessToken = null;

function setActiveView(viewName) {
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.viewTarget === viewName);
  });

  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${viewName}`);
  });

  if (window.innerWidth < 1200) {
    sidebar?.classList.remove("is-open");
  }
}

function toggleAssistant(open) {
  const shouldOpen = open ?? !assistantDrawer.classList.contains("is-open");
  assistantDrawer.hidden = !shouldOpen;
  assistantDrawer.classList.toggle("is-open", shouldOpen);
  assistantDrawer.setAttribute("aria-hidden", String(!shouldOpen));
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function setCompareMode(diffOnly) {
  compareModeAll?.classList.toggle("is-active", !diffOnly);
  compareModeDiff?.classList.toggle("is-active", diffOnly);

  if (!compareTable) return;
  compareTable.dataset.mode = diffOnly ? "diff" : "all";

  compareTable.querySelectorAll("tbody tr").forEach((row) => {
    const diffCells = row.querySelectorAll(".diff-only");
    if (diffOnly && diffCells.length === 0) {
      row.hidden = true;
    } else {
      row.hidden = false;
    }
  });
}

async function apiRequest(endpoint, options = {}, requireAdmin = false) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (requireAdmin) {
    await ensureAdminSession();
    headers.Authorization = `Bearer ${adminAccessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({
    data: null,
    error: { message: "服务返回了无法解析的响应" }
  }));

  if (!response.ok || payload.error) {
    throw new Error(payload?.error?.message || "请求失败");
  }

  return payload.data;
}

async function ensureAdminSession() {
  if (adminAccessToken) {
    return adminAccessToken;
  }

  const data = await apiRequest("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(DEMO_ADMIN)
  });
  adminAccessToken = data.accessToken;
  return adminAccessToken;
}

function renderValidation(validation) {
  if (!validationPanel) return;

  const okItems = [];
  if (!validation.missingFields.includes("nameZh")) okItems.push("中文名称已填写");
  if (!validation.missingFields.includes("aircraftType")) okItems.push("机型分类已选择");
  if (!validation.missingFields.includes("summary")) okItems.push("一句话简介已填写");

  const blocking = validation.blockingIssues.map((item) => `<li class="warn">${item}</li>`).join("");
  const warnings = validation.warningIssues.map((item) => `<li class="warn">${item}</li>`).join("");
  const passedText = validation.passed
    ? `<li class="ok">当前内容满足基础校验要求</li>`
    : "";

  validationPanel.innerHTML = `
    <h4>质量校验面板</h4>
    <ul>
      ${okItems.map((item) => `<li class="ok">${item}</li>`).join("")}
      ${passedText}
      ${blocking}
      ${warnings}
    </ul>
  `;
}

function getEditorPayload() {
  const formData = new FormData(editorForm);
  return {
    nameZh: String(formData.get("name") || "").trim(),
    aircraftType: String(formData.get("type") || "").trim(),
    firstFlightYear: Number(formData.get("firstFlight") || 0),
    rangeKm: Number(formData.get("range") || 0),
    summary: String(formData.get("summary") || "").trim(),
    source: String(formData.get("source") || "").trim(),
    description: String(formData.get("summary") || "").trim(),
    manufacturer: "待补充",
    countryOfOrigin: "待补充",
    eraLabel: "待补充"
  };
}

async function runValidation(requirePublishReady = false) {
  const validation = await apiRequest(
    "/api/admin/content/validate",
    {
      method: "POST",
      body: JSON.stringify({
        ...getEditorPayload(),
        requirePublishReady
      })
    },
    true
  );

  renderValidation(validation);
  return validation;
}

async function submitAircraftForReview() {
  const validation = await runValidation(true);
  if (!validation.passed) {
    showToast("提审前仍有必填字段缺失，请先补充来源标注。");
    return;
  }

  const payload = getEditorPayload();
  let aircraft;

  if (editorForm?.dataset.aircraftId) {
    aircraft = await apiRequest(
      `/api/admin/aircraft/${editorForm.dataset.aircraftId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload)
      },
      true
    );
  } else {
    aircraft = await apiRequest(
      "/api/admin/aircraft",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      true
    );
    editorForm.dataset.aircraftId = aircraft.id;
  }

  await apiRequest(
    "/api/admin/content/submit-review",
    {
      method: "POST",
      body: JSON.stringify({
        entityType: "aircraft",
        entityId: aircraft.id
      })
    },
    true
  );

  await loadDashboardSummary();
  showToast("已保存并提交审核，当前为单级审核流，等待审核人处理。");
}

function renderSearchResults(items, keyword) {
  if (!searchResultList) return;

  searchResultKeyword.textContent = `搜索词：${keyword || "全部内容"}`;
  searchResultTitle.textContent = `找到 ${items.length} 个结果`;

  searchResultList.innerHTML = items
    .map((item) => {
      const typeLabelMap = {
        aircraft: "航空器",
        event: "事件",
        person: "人物"
      };
      const typeClassMap = {
        aircraft: "",
        event: "accent",
        person: "subdued"
      };

      const metaParts = Object.values(item.meta || {}).filter(Boolean);

      return `
        <article class="result-card">
          <div class="result-type ${typeClassMap[item.entityType] || ""}">${typeLabelMap[item.entityType] || item.entityType}</div>
          <div class="result-content">
            <h4>${item.title}</h4>
            <p>${item.summary}</p>
            <div class="result-meta">
              ${metaParts.map((part) => `<span>${part}</span>`).join("")}
            </div>
          </div>
          <button class="link-button" data-view-jump="${item.entityType === "aircraft" ? "aircraft" : "timeline"}">查看详情</button>
        </article>
      `;
    })
    .join("");

  Array.from(searchResultList.querySelectorAll("[data-view-jump]")).forEach((item) => {
    item.addEventListener("click", () => {
      setActiveView(item.dataset.viewJump);
    });
  });
}

async function loadSearchResults() {
  const keyword = globalSearchInput?.value?.trim() || "";
  try {
    const data = await apiRequest(`/api/public/search?q=${encodeURIComponent(keyword)}`);
    renderSearchResults(data, keyword);
    showToast(`已从本地后端载入 ${data.length} 条搜索结果。`);
  } catch (error) {
    showToast(`搜索失败：${error.message}`);
  }
}

async function loadDashboardSummary() {
  if (metricCards.length < 3) return;

  try {
    const data = await apiRequest("/api/admin/dashboard/summary", {}, true);
    metricCards[0].textContent = String(data.publishedCount);
    metricCards[1].textContent = String(data.missingFieldCount);
    metricCards[2].textContent = data.weeklyFixRate;
  } catch (error) {
    showToast(`后台摘要载入失败：${error.message}`);
  }
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    setActiveView(item.dataset.viewTarget);
  });
});

jumpItems.forEach((item) => {
  item.addEventListener("click", () => {
    setActiveView(item.dataset.viewJump);
  });
});

assistantToggle?.addEventListener("click", () => toggleAssistant(true));
assistantToggleInline?.addEventListener("click", () => toggleAssistant(true));
assistantClose?.addEventListener("click", () => toggleAssistant(false));
menuToggle?.addEventListener("click", () => sidebar?.classList.toggle("is-open"));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleAssistant(false);
    sidebar?.classList.remove("is-open");
  }
});

compareModeAll?.addEventListener("click", () => setCompareMode(false));
compareModeDiff?.addEventListener("click", () => setCompareMode(true));
validateFormButton?.addEventListener("click", async () => {
  try {
    const validation = await runValidation(false);
    const warningCount = validation.warningIssues.length + validation.blockingIssues.length;
    showToast(`已执行字段校验：发现 ${warningCount} 项待处理内容。`);
  } catch (error) {
    showToast(`字段校验失败：${error.message}`);
  }
});

publishButton?.addEventListener("click", async () => {
  try {
    await submitAircraftForReview();
  } catch (error) {
    showToast(`提审失败：${error.message}`);
  }
});

globalSearchButton?.addEventListener("click", loadSearchResults);
globalSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    loadSearchResults();
  }
});

setCompareMode(false);
loadSearchResults();
loadDashboardSummary();
