const CONFIG_URL = "./json/prompts.json";

const state = {
  config: null,
  values: {},
  activePresetId: "",
};

const elements = {
  configName: document.querySelector("#configName"),
  presetGrid: document.querySelector("#presetGrid"),
  promptForm: document.querySelector("#promptForm"),
  promptOutput: document.querySelector("#promptOutput"),
  promptStats: document.querySelector("#promptStats"),
  statusLine: document.querySelector("#statusLine"),
  copyButton: document.querySelector("#copyButton"),
  resetButton: document.querySelector("#resetButton"),
  reloadButton: document.querySelector("#reloadButton"),
};

async function loadConfig() {
  showLoading();

  try {
    const response = await fetch(`${CONFIG_URL}?v=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`JSONを読み込めませんでした (${response.status})`);
    }

    const config = await response.json();
    validateConfig(config);
    state.config = config;
    state.activePresetId = config.presets?.[0]?.id ?? "";
    state.values = getInitialValues(config, state.activePresetId);
    render();
    setStatus("JSONを読み込みました。", "success");
  } catch (error) {
    showError(error);
  }
}

function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("JSONの形式が正しくありません。");
  }

  if (!Array.isArray(config.fields) || config.fields.length === 0) {
    throw new Error("fields が見つかりません。");
  }

  if (typeof config.template !== "string" || config.template.trim() === "") {
    throw new Error("template が見つかりません。");
  }
}

function getInitialValues(config, presetId = "") {
  const values = {};

  config.fields.forEach((field) => {
    values[field.id] = getDefaultValue(field);
  });

  const preset = config.presets?.find((item) => item.id === presetId);
  return {
    ...values,
    ...(preset?.values ?? {}),
  };
}

function getDefaultValue(field) {
  if (field.type === "multiselect") {
    return Array.isArray(field.default) ? field.default : [];
  }

  if (field.type === "checkbox") {
    return Boolean(field.default);
  }

  if (field.default !== undefined) {
    return field.default;
  }

  if (Array.isArray(field.options) && field.options.length > 0) {
    return normalizeOption(field.options[0]).value;
  }

  return "";
}

function render() {
  const { config } = state;
  elements.configName.textContent = config.name ?? "";
  renderPresets();
  renderForm();
  updateOutput();
}

function renderPresets() {
  elements.presetGrid.innerHTML = "";

  if (!Array.isArray(state.config.presets) || state.config.presets.length === 0) {
    elements.presetGrid.append(createEmptyState("プリセットなし"));
    return;
  }

  state.config.presets.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.dataset.presetId = preset.id;
    button.setAttribute("aria-pressed", String(preset.id === state.activePresetId));

    const title = document.createElement("span");
    title.className = "preset-title";
    title.textContent = preset.label ?? preset.id;

    const description = document.createElement("span");
    description.className = "preset-description";
    description.textContent = preset.description ?? "";

    button.append(title, description);
    button.addEventListener("click", () => {
      state.activePresetId = preset.id;
      state.values = getInitialValues(state.config, preset.id);
      render();
      setStatus(`${preset.label ?? "プリセット"}を反映しました。`, "success");
    });

    elements.presetGrid.append(button);
  });
}

function renderForm() {
  elements.promptForm.innerHTML = "";

  state.config.fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    wrapper.dataset.fieldId = field.id;

    if (field.type === "multiselect") {
      wrapper.append(createLegend(field));
      wrapper.append(createMultiSelect(field));
    } else if (field.type === "checkbox") {
      wrapper.append(createCheckbox(field));
    } else {
      wrapper.append(createLabel(field));
      wrapper.append(createInput(field));
    }

    if (field.help) {
      const help = document.createElement("p");
      help.className = "field-help";
      help.textContent = field.help;
      wrapper.append(help);
    }

    elements.promptForm.append(wrapper);
  });
}

function createLabel(field) {
  const label = document.createElement("label");
  label.htmlFor = field.id;
  label.textContent = field.label ?? field.id;
  return label;
}

function createLegend(field) {
  const legend = document.createElement("span");
  legend.className = "field-label";
  legend.textContent = field.label ?? field.id;
  return legend;
}

function createInput(field) {
  const value = state.values[field.id] ?? "";
  let input;

  if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = field.rows ?? 4;
  } else if (field.type === "select") {
    input = document.createElement("select");
    field.options?.forEach((option) => {
      const normalized = normalizeOption(option);
      const optionElement = document.createElement("option");
      optionElement.value = normalized.value;
      optionElement.textContent = normalized.label;
      input.append(optionElement);
    });
  } else {
    input = document.createElement("input");
    input.type = field.type === "number" ? "number" : "text";
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    if (field.step !== undefined) input.step = field.step;
  }

  input.id = field.id;
  input.name = field.id;
  input.value = value;
  input.placeholder = field.placeholder ?? "";
  input.addEventListener("input", (event) => {
    state.values[field.id] = event.target.value;
    state.activePresetId = "";
    updatePresetState();
    updateOutput();
  });

  return input;
}

function createCheckbox(field) {
  const label = document.createElement("label");
  label.className = "checkbox-pill";

  const input = document.createElement("input");
  input.id = field.id;
  input.name = field.id;
  input.type = "checkbox";
  input.checked = Boolean(state.values[field.id]);
  input.addEventListener("change", (event) => {
    state.values[field.id] = event.target.checked;
    state.activePresetId = "";
    updatePresetState();
    updateOutput();
  });

  const labelText = document.createElement("span");
  labelText.textContent = field.label ?? field.id;
  label.append(input, labelText);
  return label;
}

function createMultiSelect(field) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "option-list";

  field.options?.forEach((option) => {
    const normalized = normalizeOption(option);
    const label = document.createElement("label");
    label.className = "checkbox-pill";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = field.id;
    input.value = normalized.value;
    input.checked = Array.isArray(state.values[field.id])
      ? state.values[field.id].includes(normalized.value)
      : false;
    input.addEventListener("change", () => {
      state.values[field.id] = Array.from(
        fieldset.querySelectorAll("input:checked"),
      ).map((item) => item.value);
      state.activePresetId = "";
      updatePresetState();
      updateOutput();
    });

    const labelText = document.createElement("span");
    labelText.textContent = normalized.label;
    label.append(input, labelText);
    fieldset.append(label);
  });

  return fieldset;
}

function normalizeOption(option) {
  if (typeof option === "string") {
    return {
      label: option,
      value: option,
    };
  }

  return {
    label: option.label ?? option.value,
    value: option.value ?? option.label,
  };
}

function updatePresetState() {
  elements.presetGrid.querySelectorAll(".preset-button").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.presetId === state.activePresetId),
    );
  });
}

function updateOutput() {
  const prompt = renderTemplate(state.config.template, state.values);
  elements.promptOutput.value = prompt;
  const chars = prompt.length.toLocaleString("ja-JP");
  const lines = prompt.split("\n").length.toLocaleString("ja-JP");
  elements.promptStats.textContent = `${chars}文字 / ${lines}行`;
}

function renderTemplate(template, values) {
  return template
    .replace(/{{\s*([\w-]+)\s*}}/g, (_, key) => formatValue(values[key]))
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  return String(value ?? "").trim();
}

async function copyPrompt() {
  const text = elements.promptOutput.value;

  if (!text) {
    setStatus("コピーする内容がありません。", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("コピーしました。", "success");
  } catch {
    elements.promptOutput.select();
    document.execCommand("copy");
    elements.promptOutput.setSelectionRange(0, 0);
    setStatus("コピーしました。", "success");
  }
}

function showLoading() {
  elements.configName.textContent = "";
  elements.presetGrid.innerHTML = "";
  elements.promptForm.innerHTML = "";
  elements.presetGrid.append(createEmptyState("読み込み中..."));
  elements.promptOutput.value = "";
  elements.promptStats.textContent = "";
  setStatus("", "success");
}

function showError(error) {
  elements.presetGrid.innerHTML = "";
  elements.promptForm.innerHTML = "";
  elements.presetGrid.append(createEmptyState("読み込み失敗"));
  elements.promptOutput.value = error.message;
  elements.promptStats.textContent = "";
  setStatus("JSONを確認してください。", "error");
}

function createEmptyState(message) {
  const template = document.querySelector("#loadingTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  node.textContent = message;
  return node;
}

function setStatus(message, tone) {
  elements.statusLine.textContent = message;
  elements.statusLine.style.color = tone === "error" ? "#b62929" : "#197278";
}

elements.copyButton.addEventListener("click", copyPrompt);
elements.resetButton.addEventListener("click", () => {
  state.values = getInitialValues(state.config, state.activePresetId);
  renderForm();
  updateOutput();
  setStatus("初期値に戻しました。", "success");
});
elements.reloadButton.addEventListener("click", loadConfig);

loadConfig();
