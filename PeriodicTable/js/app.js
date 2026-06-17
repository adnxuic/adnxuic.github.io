const CATEGORY_CLASS = {
  "Alkali Metal": "alkali-metal",
  "Alkaline Earth Metal": "alkaline-earth-metal",
  "Transition Metal": "transition-metal",
  "Post-Transition Metal": "post-transition-metal",
  "Semi-metal": "metalloid",
  Metalloid: "metalloid",
  "Non-metal": "nonmetal",
  Nonmetal: "nonmetal",
  Halogen: "halogen",
  "Noble Gas": "noble-gas",
  Lanthanide: "lanthanide",
  Actinide: "actinide",
  Metal: "metal",
  Unknown: "unknown",
};

const LEGEND_ORDER = [
  "Alkali Metal",
  "Alkaline Earth Metal",
  "Transition Metal",
  "Post-Transition Metal",
  "Semi-metal",
  "Metalloid",
  "Non-metal",
  "Nonmetal",
  "Halogen",
  "Noble Gas",
  "Lanthanide",
  "Actinide",
  "Metal",
  "Unknown",
];

const CATEGORY_LABEL_ZH = {
  "Alkali Metal": "碱金属",
  "Alkaline Earth Metal": "碱土金属",
  "Transition Metal": "过渡金属",
  "Post-Transition Metal": "后过渡金属",
  "Semi-metal": "类金属",
  Metalloid: "类金属",
  "Non-metal": "非金属",
  Nonmetal: "非金属",
  Halogen: "卤素",
  "Noble Gas": "稀有气体",
  Lanthanide: "镧系元素",
  Actinide: "锕系元素",
  Metal: "金属",
  Unknown: "未知",
};

const STANDARD_POSITIONS = {
  H: [1, 1], He: [18, 1],
  Li: [1, 2], Be: [2, 2], B: [13, 2], C: [14, 2], N: [15, 2], O: [16, 2], F: [17, 2], Ne: [18, 2],
  Na: [1, 3], Mg: [2, 3], Al: [13, 3], Si: [14, 3], P: [15, 3], S: [16, 3], Cl: [17, 3], Ar: [18, 3],
  K: [1, 4], Ca: [2, 4], Sc: [3, 4], Ti: [4, 4], V: [5, 4], Cr: [6, 4], Mn: [7, 4], Fe: [8, 4], Co: [9, 4], Ni: [10, 4], Cu: [11, 4], Zn: [12, 4], Ga: [13, 4], Ge: [14, 4], As: [15, 4], Se: [16, 4], Br: [17, 4], Kr: [18, 4],
  Rb: [1, 5], Sr: [2, 5], Y: [3, 5], Zr: [4, 5], Nb: [5, 5], Mo: [6, 5], Tc: [7, 5], Ru: [8, 5], Rh: [9, 5], Pd: [10, 5], Ag: [11, 5], Cd: [12, 5], In: [13, 5], Sn: [14, 5], Sb: [15, 5], Te: [16, 5], I: [17, 5], Xe: [18, 5],
  Cs: [1, 6], Ba: [2, 6], Hf: [4, 6], Ta: [5, 6], W: [6, 6], Re: [7, 6], Os: [8, 6], Ir: [9, 6], Pt: [10, 6], Au: [11, 6], Hg: [12, 6], Tl: [13, 6], Pb: [14, 6], Bi: [15, 6], Po: [16, 6], At: [17, 6], Rn: [18, 6],
  Fr: [1, 7], Ra: [2, 7], Rf: [4, 7], Db: [5, 7], Sg: [6, 7], Bh: [7, 7], Hs: [8, 7], Mt: [9, 7], Ds: [10, 7], Rg: [11, 7], Cn: [12, 7], Nh: [13, 7], Fl: [14, 7], Mc: [15, 7], Lv: [16, 7], Ts: [17, 7], Og: [18, 7],
};

const RADIOACTIVE_ATOMIC_NUMBERS = new Set([
  43, 61,
  84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
  100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112,
  113, 114, 115, 116, 117, 118,
]);

const STATE_ZH = {
  Solid: "固体",
  Liquid: "液体",
  Gas: "气体",
  "Expected to be a Gas": "气体",
  "Expected to be a Solid": "固体",
  Unknown: "未知",
};

const table = document.querySelector("#periodicTable");
const lanthanides = document.querySelector("#lanthanides");
const actinides = document.querySelector("#actinides");
const statusMessage = document.querySelector("#statusMessage");
const legend = document.querySelector("#legend");
const searchInput = document.querySelector("#searchInput");
const elementModal = document.querySelector("#elementModal");
const modalContent = document.querySelector("#modalContent");

let allCards = [];

init();

async function init() {
  try {
    const response = await fetch("data/elements.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    renderLegend(payload.elements);
    renderElements(payload.elements);
    bindSearch();
    bindModal();
    statusMessage.hidden = true;
    table.hidden = false;
  } catch (error) {
    const localHint = window.location.protocol === "file:"
      ? "当前浏览器阻止直接从 file:// 读取 JSON。请在项目目录运行静态服务器，例如：python -m http.server 8000，然后访问 http://localhost:8000/。"
      : "请检查 data/elements.json 是否存在且格式正确。";
    statusMessage.textContent = `元素数据加载失败。${localHint}`;
    console.error(error);
  }
}

function renderLegend(elements) {
  const categories = new Set(elements.map((element) => element.category));
  const orderedCategories = LEGEND_ORDER.filter((category) => categories.has(category));

  legend.innerHTML = orderedCategories.map((category) => {
    const className = getCategoryClass(category);
    return `
      <span class="legend-item">
        <span class="legend-swatch swatch-${className}" aria-hidden="true"></span>
        ${escapeHtml(CATEGORY_LABEL_ZH[category] || category)}
      </span>
    `;
  }).join("");
}

function renderElements(elements) {
  table.innerHTML = "";
  lanthanides.innerHTML = "";
  actinides.innerHTML = "";
  allCards = [];

  table.appendChild(createGuideCard());
  table.appendChild(createPlaceholder("57-71", "镧系", 3, 6));
  table.appendChild(createPlaceholder("89-103", "锕系", 3, 7));

  for (const element of elements) {
    const card = createElementCard(element);

    if (element.series === "lanthanide") {
      lanthanides.appendChild(card);
    } else if (element.series === "actinide") {
      actinides.appendChild(card);
    } else {
      const [group, period] = getGridPosition(element);
      card.style.gridColumn = String(group);
      card.style.gridRow = String(period);
      table.appendChild(card);
    }

    allCards.push(card);
  }
}

function getGridPosition(element) {
  const standard = STANDARD_POSITIONS[element.symbol];
  if (standard) {
    return standard;
  }
  return [element.group || 1, element.period || 1];
}

function createGuideCard() {
  const guide = document.createElement("aside");
  guide.className = "guide-card";
  guide.style.gridColumn = "4 / 13";
  guide.style.gridRow = "1 / 3";
  guide.innerHTML = `
    <div class="guide-sample">
      <div class="guide-sample-top">
        <span class="guide-radioactive">92</span>
        <span class="guide-state">固体</span>
      </div>
      <div class="guide-symbol-row">
        <span class="guide-radioactive guide-symbol">U</span>
        <span class="guide-zh">铀</span>
      </div>
      <div class="guide-en">Uranium</div>
      <div class="guide-values">
        <span>238.03</span>
        <span>5f3 6d1 7s2</span>
        <span>175 pm</span>
        <span>1135°C</span>
      </div>
    </div>
    <div class="guide-notes">
      <p><b>左上</b>原子序数；右上为 20°C 状态。</p>
      <p><b>中部</b>元素符号和中文名同一行，英文名在下一行。</p>
      <p><b>下方四行</b>依次为原子量、外层电子排布、经验原子半径、固体熔点。</p>
      <p><b>红色序号/符号</b>表示放射性元素；红色状态标签表示 PubChem 的预测状态。</p>
    </div>
  `;
  return guide;
}

function createPlaceholder(range, label, column, row) {
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder-card";
  placeholder.style.gridColumn = String(column);
  placeholder.style.gridRow = String(row);
  placeholder.innerHTML = `<span>${range}<br>${label}</span>`;
  return placeholder;
}

function createElementCard(element) {
  const className = getCategoryClass(element.category);
  const categoryLabel = CATEGORY_LABEL_ZH[element.category] || element.categoryZh || element.category || "未知";
  const radioactiveClass = RADIOACTIVE_ATOMIC_NUMBERS.has(element.atomicNumber) ? " is-radioactive" : "";
  const card = document.createElement("article");
  card.className = `element-card category-${className}`;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `查看${element.nameZh}${element.nameEn}详情`);
  card.addEventListener("click", () => openElementModal(element));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openElementModal(element);
    }
  });
  card.dataset.search = [
    element.atomicNumber,
    element.symbol,
    element.nameZh,
    element.nameEn,
    element.categoryZh,
    element.category,
  ].join(" ").toLowerCase();

  const radius = formatRadius(element.atomicRadiusEmpiricalPm);
  const solidMeltingPoint = isSolidAt20C(element.stateAt20C) ? formatCelsiusMeltingPoint(element.meltingPoint) : "-";
  const state = STATE_ZH[element.stateAt20C] || element.stateAt20C || "未知";
  const stateClass = isExpectedState(element.stateAt20C) ? " state-expected" : "";
  const outerConfig = element.outerElectronConfiguration
    ? formatElectronConfiguration(element.outerElectronConfiguration)
    : "未知";

  card.title = `${element.nameZh} ${element.nameEn}: ${categoryLabel}`;
  card.innerHTML = `
    <div class="element-top">
      <span class="atomic-number${radioactiveClass}">${element.atomicNumber}</span>
      <span class="state${stateClass}">${escapeHtml(state)}</span>
    </div>
    <div class="symbol-row">
      <span class="symbol${radioactiveClass}">${escapeHtml(element.symbol)}</span>
      <span class="name-zh">${escapeHtml(element.nameZh)}</span>
    </div>
    <div class="names">
      <span class="name-en">${escapeHtml(element.nameEn)}</span>
    </div>
    <dl class="metric-list">
      <div class="metric">
        <dt class="visually-hidden">原子量</dt>
        <dd>${escapeHtml(formatAtomicWeight(element.atomicWeight))}</dd>
      </div>
      <div class="metric">
        <dt class="visually-hidden">外层电子排布</dt>
        <dd>${outerConfig}</dd>
      </div>
      <div class="metric">
        <dt class="visually-hidden">经验原子半径</dt>
        <dd>${escapeHtml(radius)}</dd>
      </div>
      <div class="metric">
        <dt class="visually-hidden">熔点</dt>
        <dd>${escapeHtml(solidMeltingPoint)}</dd>
      </div>
    </dl>
  `;
  return card;
}

function getCategoryClass(category) {
  return CATEGORY_CLASS[category] || "unknown";
}

function bindSearch() {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    for (const card of allCards) {
      card.classList.toggle("is-dimmed", Boolean(query) && !card.dataset.search.includes(query));
    }
  });
}

function bindModal() {
  elementModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal]")) {
      closeElementModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elementModal.hidden) {
      closeElementModal();
    }
  });
}

function openElementModal(element) {
  const className = getCategoryClass(element.category);
  const categoryLabel = CATEGORY_LABEL_ZH[element.category] || element.categoryZh || element.category || "未知";
  const state = STATE_ZH[element.stateAt20C] || element.stateAt20C || "未知";
  const stateTagClass = isExpectedState(element.stateAt20C) ? " detail-tag is-red" : "detail-tag";
  const radioactive = RADIOACTIVE_ATOMIC_NUMBERS.has(element.atomicNumber);
  const empiricalRadius = formatRadius(element.atomicRadiusEmpiricalPm);
  const nonbondedRadius = formatRadius(element.atomicRadiusNonbondedPm);
  const solidMeltingPoint = isSolidAt20C(element.stateAt20C) ? formatCelsiusMeltingPoint(element.meltingPoint) : "-";
  const originalMeltingPoint = element.meltingPoint || "未知";
  const sourceText = formatSources(element.sources);

  modalContent.innerHTML = `
    <header class="detail-header">
      <div class="detail-symbol category-${className}${radioactive ? " is-radioactive" : ""}">${escapeHtml(element.symbol)}</div>
      <div class="detail-title">
        <h2 id="modalTitle">${escapeHtml(element.nameZh)} ${escapeHtml(element.nameEn)}</h2>
        <p>原子序数 ${element.atomicNumber} · 第 ${element.period} 周期 · 第 ${element.group} 族</p>
        <div class="detail-tags">
          <span class="detail-tag">${escapeHtml(categoryLabel)}</span>
          <span class="${stateTagClass}">${escapeHtml(state)}</span>
          ${radioactive ? '<span class="detail-tag is-red">放射性元素</span>' : ""}
        </div>
      </div>
    </header>
    <dl class="detail-body">
      ${detailItem("原子量（页面显示）", formatAtomicWeight(element.atomicWeight))}
      ${detailItem("原子量（原始数据）", element.atomicWeight || "未知")}
      ${detailItem("外层电子排布", element.outerElectronConfiguration ? formatElectronConfiguration(element.outerElectronConfiguration) : "未知", false, true)}
      ${detailItem("完整电子排布", element.electronConfiguration ? formatElectronConfiguration(element.electronConfiguration) : "未知", false, true)}
      ${detailItem("经验原子半径", empiricalRadius)}
      ${detailItem("非键合原子半径", nonbondedRadius)}
      ${detailItem("固体熔点（页面显示）", solidMeltingPoint)}
      ${detailItem("熔点（PubChem 原始数据）", originalMeltingPoint, true)}
      ${detailItem("20°C 状态（PubChem 原始数据）", element.stateAt20C || "未知", true)}
      <p class="detail-source">${escapeHtml(sourceText)}</p>
    </dl>
  `;

  elementModal.hidden = false;
  document.body.style.overflow = "hidden";
  elementModal.querySelector(".modal-close").focus();
}

function closeElementModal() {
  elementModal.hidden = true;
  modalContent.innerHTML = "";
  document.body.style.overflow = "";
}

function detailItem(label, value, wide = false, allowHtml = false) {
  return `
    <div class="detail-item${wide ? " wide" : ""}">
      <dt>${escapeHtml(label)}</dt>
      <dd>${allowHtml ? value : escapeHtml(value)}</dd>
    </div>
  `;
}

function formatSources(sources = {}) {
  const sourceItems = [
    ["20°C 状态", sources.stateAt20C],
    ["熔点", sources.meltingPoint],
    ["电子排布", sources.electronConfiguration],
    ["外层电子排布", sources.outerElectronConfiguration],
    ["经验原子半径", sources.atomicRadiusEmpirical],
    ["非键合原子半径", sources.atomicRadiusNonbonded],
  ].filter((item) => item[1]);

  if (!sourceItems.length) {
    return "数据来源：见页面底部说明。";
  }
  return `数据来源：${sourceItems.map(([label, source]) => `${label}：${source}`).join("；")}。`;
}

function formatElectronConfiguration(value) {
  return escapeHtml(value).replace(/([spdfg])(\d+)/g, "$1<sup>$2</sup>");
}

function formatCelsiusMeltingPoint(value) {
  if (!value) {
    return "未知";
  }
  const match = String(value).match(/([-+]?\d+(?:\.\d+)?)\s*°C/);
  return match ? `${match[1]}°C` : String(value);
}

function formatRadius(value) {
  return value ? `${value} pm` : "未知";
}

function isSolidAt20C(state) {
  return state === "Solid" || state === "Expected to be a Solid";
}

function isExpectedState(state) {
  return state === "Expected to be a Solid" || state === "Expected to be a Gas";
}

function formatAtomicWeight(value) {
  if (!value) {
    return "未知";
  }
  const text = String(value).replace(/\s+/g, "");
  const rangeMatch = text.match(/^\[?([-+]?\d+(?:\.\d+)?),([-+]?\d+(?:\.\d+)?)\]?$/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    return ((low + high) / 2).toFixed(2);
  }

  const numberMatch = text.match(/^([-+]?\d+(?:\.\d+)?)/);
  return numberMatch ? Number(numberMatch[1]).toFixed(2) : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
