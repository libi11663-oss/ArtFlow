  updateRevenue();
}

function closeOrder() {
  orderPanel.classList.remove("open");
  scrim.classList.remove("open");
  orderPanel.setAttribute("aria-hidden", "true");
}

function updateRevenue() {
  const service = state.selected || getFilteredServices()[0];
  if (!service) {
    revenueText.textContent = "選一個服務後會顯示估算。";
    return;
  }
  const commissionIncome = Math.round(service.price * (state.commission / 100));
  const monthlyIncome = commissionIncome * 40 + Number(state.adFee || 0) * 12;
  revenueText.textContent = `${service.title} 每單抽成約 ${money.format(commissionIncome)}。若月成交 40 單、12 位繪師投放廣告，平台月收約 ${money.format(monthlyIncome)}。`;
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderServices();
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order]");
  if (!button) return;
  const service = services.find((item) => item.id === Number(button.dataset.order));
  openOrder(service);
});

orderContent.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tier]");
  if (!button || !state.selected) return;
  const tier = state.selected.tiers[Number(button.dataset.tier)];
  const form = document.querySelector("#orderForm");
  if (!tier || !form) return;
  form.dataset.selectedTier = tier[0];
  form.dataset.selectedPrice = tier[1];
  orderContent.querySelectorAll("button[data-tier]").forEach((tierButton) => {
    tierButton.textContent = "選這個方案";
  });
  button.textContent = "已選擇";
});

orderContent.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const brief = new FormData(form).get("brief");
  const risks = detectPolicyRisk(brief);
  const alert = document.querySelector("#orderPolicyAlert");
  if (risks.length) {
    alert.textContent = formatRiskMessage(risks);
    alert.hidden = false;
    alert.classList.add("danger");
    return;
  }
  const tier = form.dataset.selectedTier || state.selected.tiers[0][0];
  const price = Number(form.dataset.selectedPrice || state.selected.tiers[0][1]);
  const fee = Math.round(price * (state.commission / 100));
  document.querySelector("#orderSuccess").hidden = false;
  document.querySelector("#orderSuccess").textContent = `委託單已建立：${tier} ${money.format(price)}，平台此單抽成約 ${money.format(fee)}。`;
});

orderContent.addEventListener("input", (event) => {
  if (event.target.name !== "brief") return;
  const alert = document.querySelector("#orderPolicyAlert");
  if (!alert) return;
  const risks = detectPolicyRisk(event.target.value);
  const message = formatRiskMessage(risks);
  alert.hidden = !message;
  alert.textContent = message;
  alert.classList.toggle("danger", Boolean(message));
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderServices();
});

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderServices();
});

budgetRange.addEventListener("input", (event) => {
  state.budget = Number(event.target.value);
  budgetValue.textContent = state.budget;
  renderServices();
});

commercialOnly.addEventListener("change", (event) => {
  state.commercialOnly = event.target.checked;
  renderServices();
});

fastOnly.addEventListener("change", (event) => {
  state.fastOnly = event.target.checked;
  renderServices();
});

commissionRange.addEventListener("input", (event) => {
  state.commission = Number(event.target.value);
  commissionValue.textContent = `${state.commission}%`;
  updateRevenue();
});

adFeeInput.addEventListener("input", (event) => {
  state.adFee = Number(event.target.value);
  updateRevenue();
});

listingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(listingForm);
  const listingText = `${data.get("title")} ${data.get("description")}`;
  const risks = detectPolicyRisk(listingText);
  if (risks.length) {
    listingPolicyNotice.textContent = formatRiskMessage(risks);
    listingPolicyNotice.classList.add("danger");
    return;
  }
  const price = Number(data.get("price"));
  const days = Number(data.get("days"));
  services.unshift({
    id: Date.now(),
    title: data.get("title"),
    artist: "新繪師",
    category: data.get("category"),
    price,
    days,
    rating: 5,
    orders: 0,
    commercial: true,
    featured: false,
    palette: ["#06b6d4", "#4f46e5"],
    description: data.get("description"),
    tiers: [
      ["Basic", price, "基本方案"],
      ["Pro", Math.round(price * 1.8), "加購商用與更多修改"],
      ["Studio", Math.round(price * 3), "完整專案與優先排程"]
    ]
  });
  state.category = "全部";
  listingForm.reset();
  listingPolicyNotice.textContent = "上架內容已通過站外交易檢查。";
  listingPolicyNotice.classList.remove("danger");
  listingPolicyNotice.classList.add("warning");
  renderServices();
  document.querySelector("#market").scrollIntoView({ behavior: "smooth" });
});

listingForm.addEventListener("input", () => {
  const data = new FormData(listingForm);
  const risks = detectPolicyRisk(`${data.get("title")} ${data.get("description")}`);
  const message = formatRiskMessage(risks);
  listingPolicyNotice.textContent = message || "上架內容會檢查站外聯絡與付款資訊。";
  listingPolicyNotice.classList.toggle("danger", Boolean(message));
  listingPolicyNotice.classList.toggle("warning", !message);
});

sellerCta.addEventListener("click", () => {
  document.querySelector("#studio").scrollIntoView({ behavior: "smooth" });
});

closePanel.addEventListener("click", closeOrder);
scrim.addEventListener("click", closeOrder);

renderServices();
