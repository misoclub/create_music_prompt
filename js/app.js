const CONFIG_URL = "./json/prompts.json";

const INSTRUCTION_TEXT = `というスタイルで曲を作りたいです。
インドで流行るような英語の歌詞を考えてください。
2分30秒以内に収まる文章量でお願いします。
楽曲の生成はSunoで行います。
・曲名
・Sunoに渡す曲のスタイルのプロンプト
・Sunoに渡すタグ付きの歌詞
・タグなしの歌詞
・歌詞すべてのの日本語訳
・どんな内容の歌詞かの簡単な説明
以上の5点を出力してください。
あなたの感想は必要ないので、結果だけを出力してください。`;

const state = {
  styles: [],
  selectedIndex: 0,
};

const elements = {
  styleCount: document.querySelector("#styleCount"),
  styleList: document.querySelector("#styleList"),
  mobileStyleDetails: document.querySelector("#mobileStyleDetails"),
  mobileStyleOptions: document.querySelector("#mobileStyleOptions"),
  mobileSelectedTitle: document.querySelector("#mobileSelectedTitle"),
  mobileSelectedDescription: document.querySelector("#mobileSelectedDescription"),
  selectedTitle: document.querySelector("#selectedTitle"),
  lyricsPromptOutput: document.querySelector("#lyricsPromptOutput"),
  sunoPromptOutput: document.querySelector("#sunoPromptOutput"),
  statusLine: document.querySelector("#statusLine"),
  copyLyricsButton: document.querySelector("#copyLyricsButton"),
  copySunoButton: document.querySelector("#copySunoButton"),
};

async function loadStyles() {
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
    state.styles = config.styles;
    state.selectedIndex = 0;
    render();
    setStatus("JSONを読み込みました。", "success");
  } catch (error) {
    showError(error.message);
  }
}

function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("JSONの形式が正しくありません。");
  }

  if (!Array.isArray(config.styles) || config.styles.length === 0) {
    throw new Error("styles が見つかりません。");
  }

  config.styles.forEach((style, index) => {
    if (!style.title_ja || !style.prompt) {
      throw new Error(`styles[${index}] に title_ja または prompt がありません。`);
    }
  });
}

function render() {
  elements.styleCount.textContent = `${state.styles.length}件`;
  renderStyleList();
  renderMobileStyleOptions();
  updateOutput();
}

function renderStyleList() {
  elements.styleList.innerHTML = "";

  state.styles.forEach((style, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "style-button";
    button.setAttribute("aria-pressed", String(index === state.selectedIndex));

    const title = document.createElement("span");
    title.className = "style-title";
    title.textContent = getStyleTitle(style);

    const description = document.createElement("span");
    description.className = "style-description";
    description.textContent = style.description_ja ?? "";

    button.append(title, description);
    button.addEventListener("click", () => {
      selectStyle(index);
    });

    elements.styleList.append(button);
  });
}

function renderMobileStyleOptions() {
  elements.mobileStyleOptions.innerHTML = "";

  state.styles.forEach((style, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-style-option";
    button.setAttribute("aria-pressed", String(index === state.selectedIndex));

    const title = document.createElement("span");
    title.className = "mobile-option-title";
    title.textContent = getStyleTitle(style);

    const description = document.createElement("span");
    description.className = "mobile-option-description";
    description.textContent = style.description_ja ?? "";

    button.append(title, description);
    button.addEventListener("click", () => {
      selectStyle(index);
      elements.mobileStyleDetails.open = false;
    });

    elements.mobileStyleOptions.append(button);
  });
}

function updateStyleSelection() {
  elements.styleList.querySelectorAll(".style-button").forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === state.selectedIndex));
  });
  elements.mobileStyleOptions
    .querySelectorAll(".mobile-style-option")
    .forEach((button, index) => {
      button.setAttribute("aria-pressed", String(index === state.selectedIndex));
    });
}

function updateOutput() {
  const style = state.styles[state.selectedIndex];

  if (!style) {
    elements.selectedTitle.textContent = "";
    elements.mobileSelectedTitle.textContent = "";
    elements.mobileSelectedDescription.textContent = "";
    elements.lyricsPromptOutput.value = "";
    elements.sunoPromptOutput.value = "";
    return;
  }

  elements.selectedTitle.textContent = getStyleTitle(style);
  elements.mobileSelectedTitle.textContent = getStyleTitle(style);
  elements.mobileSelectedDescription.textContent = style.description_ja ?? "";
  elements.lyricsPromptOutput.value = `${style.prompt}\n\n${INSTRUCTION_TEXT}`;
  elements.sunoPromptOutput.value = style.prompt;
  autoResizeTextareas();
}

function getStyleTitle(style) {
  return style.title_ja;
}

function selectStyle(index) {
  const style = state.styles[index];
  state.selectedIndex = index;
  updateStyleSelection();
  updateOutput();
  setStatus(`${getStyleTitle(style)} を選択しました。`, "success");
}

function autoResizeTextareas() {
  [elements.lyricsPromptOutput, elements.sunoPromptOutput].forEach((textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  });
}

async function copyPrompt(textarea, successMessage) {
  const text = textarea.value;

  if (!text) {
    setStatus("コピーする内容がありません。", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus(successMessage, "success");
  } catch {
    textarea.select();
    document.execCommand("copy");
    textarea.setSelectionRange(0, 0);
    setStatus(successMessage, "success");
  }
}

function showLoading() {
  elements.styleCount.textContent = "";
  elements.styleList.innerHTML = "";
  elements.mobileStyleOptions.innerHTML = "";
  elements.styleList.append(createEmptyState("読み込み中..."));
  elements.mobileSelectedTitle.textContent = "読み込み中...";
  elements.mobileSelectedDescription.textContent = "";
  elements.selectedTitle.textContent = "";
  elements.lyricsPromptOutput.value = "";
  elements.sunoPromptOutput.value = "";
  autoResizeTextareas();
  setStatus("", "success");
}

function showError(message) {
  elements.styleCount.textContent = "";
  elements.styleList.innerHTML = "";
  elements.mobileStyleOptions.innerHTML = "";
  elements.styleList.append(createEmptyState("読み込み失敗"));
  elements.mobileSelectedTitle.textContent = "読み込み失敗";
  elements.mobileSelectedDescription.textContent = "";
  elements.selectedTitle.textContent = "";
  elements.lyricsPromptOutput.value = message;
  elements.sunoPromptOutput.value = "";
  autoResizeTextareas();
  setStatus("JSONを確認してください。", "error");
}

function createEmptyState(message) {
  const template = document.querySelector("#emptyTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  node.textContent = message;
  return node;
}

function setStatus(message, tone) {
  elements.statusLine.textContent = message;
  elements.statusLine.style.color = tone === "error" ? "#b62929" : "#197278";
}

elements.copyLyricsButton.addEventListener("click", () => {
  copyPrompt(elements.lyricsPromptOutput, "歌詞生成用プロンプトをコピーしました。");
});
elements.copySunoButton.addEventListener("click", () => {
  copyPrompt(elements.sunoPromptOutput, "Suno用プロンプトをコピーしました。");
});
elements.lyricsPromptOutput.addEventListener("input", autoResizeTextareas);
elements.sunoPromptOutput.addEventListener("input", autoResizeTextareas);
loadStyles();
