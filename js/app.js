const INSTRUCTION_TEXT = `というスタイルで曲を作りたいです。
インドで流行るような英語の歌詞を考えてください。
楽曲の生成はSunoで行います。
・曲名
・Sunoに渡す曲のスタイルのプロンプト
・Sunoに渡すタグ付きの歌詞
・タグなしの歌詞
・歌詞すべてのの日本語訳
・どんな内容の歌詞かの簡単な説明
以上の6点を出力してください。
コピペしやすいように簡単な説明以外にはコピーボタンをつけてください。
毎回同じプロンプトで生成しているので、今回はあなたならではのランダム性を入れて歌詞を考えてください。
あなたの感想は必要ないので、結果だけを出力してください。`;

//150秒以内に収まる文章量でお願いします。スタイルによる曲のスピードも考慮して生成してください。

// 出力するタグなしの歌詞は表示に使用するので。26文字を超える場合は英語的に違和感のない位置で改行してください」
// そもそも26文字を超えない場合は改行しなくていいです。
// もともとの歌詞を考えるときには26文字を超えるとかは考慮いでください。
// あくまで表示のときに超えると問題があるので、タグなし歌詞を出力するときのみ改行の処理をしてください。

const JAPAN_INSTRUCTION_TEXT = `というスタイルで曲を作りたいです。
日本で流行るような日本語の歌詞を考えてください。
{{songTitleLine}}
{{themeLine}}
{{durationLine}}
楽曲の生成はSunoで行います。
・曲名
・Sunoに渡す曲のスタイルのプロンプト
・Sunoに渡すタグ付きの歌詞
・タグなしの歌詞
・どんな内容の歌詞かの簡単な説明
以上の5点を出力してください。
コピペしやすいように簡単な説明以外にはコピーボタンをつけてください。
毎回同じプロンプトで生成しているので、今回はあなたならではのランダム性を入れて歌詞を考えてください。
あなたの感想は必要ないので、結果だけを出力してください。`;

const THUMBNAIL_PROMPT_TEXT = `では、この曲のサムネイルを描いてください。
歌詞の情報は絵を書くときの参考程度にとどめ、タイトル以外の文字は必要なとき以外使用しないでください。
画像のサイズは９：１６でお願いします。`;

const PROMPT_SOURCES = [
  {
    id: "india",
    label: "インド音楽",
    url: "./json/prompts.json",
    instructionText: INSTRUCTION_TEXT,
  },
  {
    id: "japan",
    label: "日本音楽",
    url: "./json/prompts_ja.json",
    instructionText: JAPAN_INSTRUCTION_TEXT,
  },
];

const state = {
  activeSourceId: PROMPT_SOURCES[0].id,
  styles: [],
  selectedIndex: 0,
  japanSongTitle: "",
  japanTheme: "",
  japanDurationMinutes: "3",
};

const elements = {
  sourceTabs: document.querySelectorAll("[data-prompt-source]"),
  japanOptions: document.querySelector("#japanOptions"),
  songTitleInput: document.querySelector("#songTitleInput"),
  durationSelect: document.querySelector("#durationSelect"),
  themeInput: document.querySelector("#themeInput"),
  styleCount: document.querySelector("#styleCount"),
  styleList: document.querySelector("#styleList"),
  mobileStyleDetails: document.querySelector("#mobileStyleDetails"),
  mobileStyleOptions: document.querySelector("#mobileStyleOptions"),
  mobileSelectedTitle: document.querySelector("#mobileSelectedTitle"),
  mobileSelectedDescription: document.querySelector("#mobileSelectedDescription"),
  mobileSelectedInspired: document.querySelector("#mobileSelectedInspired"),
  selectedTitle: document.querySelector("#selectedTitle"),
  lyricsPromptOutput: document.querySelector("#lyricsPromptOutput"),
  sunoPromptOutput: document.querySelector("#sunoPromptOutput"),
  thumbnailPromptOutput: document.querySelector("#thumbnailPromptOutput"),
  statusLine: document.querySelector("#statusLine"),
  copyLyricsButton: document.querySelector("#copyLyricsButton"),
  copySunoButton: document.querySelector("#copySunoButton"),
  copyThumbnailButton: document.querySelector("#copyThumbnailButton"),
};

async function loadStyles() {
  showLoading();

  try {
    const source = getActiveSource();
    const response = await fetch(`${source.url}?v=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`JSONを読み込めませんでした (${response.status})`);
    }

    const config = await response.json();
    validateConfig(config);
    state.styles = config.styles;
    state.selectedIndex = 0;
    renderSourceTabs();
    render();
    setStatus(`${source.label}のJSONを読み込みました。`, "success");
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
  renderThemeField();
  renderStyleList();
  renderMobileStyleOptions();
  updateOutput();
}

function renderThemeField() {
  elements.japanOptions.hidden = state.activeSourceId !== "japan";
  elements.songTitleInput.value = state.japanSongTitle;
  elements.durationSelect.value = state.japanDurationMinutes;
  elements.themeInput.value = state.japanTheme;
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

    const inspiredBy = createInspiredByElement(style, "style-inspired");
    button.append(title, description);
    if (inspiredBy) {
      button.append(inspiredBy);
    }

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

    const inspiredBy = createInspiredByElement(style, "mobile-option-inspired");
    button.append(title, description);
    if (inspiredBy) {
      button.append(inspiredBy);
    }

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
    elements.mobileSelectedInspired.textContent = "";
    elements.lyricsPromptOutput.value = "";
    elements.sunoPromptOutput.value = "";
    return;
  }

  elements.selectedTitle.textContent = getSelectedTitleLabel(style);
  elements.mobileSelectedTitle.textContent = getStyleTitle(style);
  elements.mobileSelectedDescription.textContent = style.description_ja ?? "";
  elements.mobileSelectedInspired.textContent = getInspiredByLabel(style);
  elements.lyricsPromptOutput.value = `${style.prompt}\n\n${getInstructionText()}`;
  elements.sunoPromptOutput.value = style.prompt;
  autoResizeTextareas();
}

function getStyleTitle(style) {
  return style.title_ja;
}

function getSelectedTitleLabel(style) {
  const inspiredBy = getInspiredByLabel(style);
  return inspiredBy ? `${getStyleTitle(style)} / ${inspiredBy}` : getStyleTitle(style);
}

function createInspiredByElement(style, className) {
  const label = getInspiredByLabel(style);

  if (!label) {
    return null;
  }

  const element = document.createElement("span");
  element.className = className;
  element.textContent = label;
  return element;
}

function getInspiredByLabel(style) {
  if (state.activeSourceId !== "japan") {
    return "";
  }

  const inspiredBy = Array.isArray(style.inspired_by)
    ? style.inspired_by.filter(Boolean).join("、")
    : String(style.inspired_by ?? "").trim();

  return inspiredBy ? `参考: ${inspiredBy}` : "";
}

function getActiveSource() {
  return (
    PROMPT_SOURCES.find((source) => source.id === state.activeSourceId) ??
    PROMPT_SOURCES[0]
  );
}

function getInstructionText() {
  const source = getActiveSource();

  if (source.id !== "japan") {
    return source.instructionText;
  }

  const songTitle = state.japanSongTitle.trim();
  const theme = state.japanTheme.trim();
  const songTitleLine = songTitle ? `歌のタイトルは「${songTitle}」にしてください。` : "";
  const themeLine = theme ? `歌のテーマは「${theme}」です。` : "";
  const durationLine = `なるべく${state.japanDurationMinutes}分以内に収まる文章量でお願いします。`;
  return source.instructionText
    .replaceAll("{{songTitleLine}}\n", songTitleLine ? `${songTitleLine}\n` : "")
    .replaceAll("{{themeLine}}\n", themeLine ? `${themeLine}\n` : "")
    .replaceAll("{{durationLine}}", durationLine);
}

function renderSourceTabs() {
  elements.sourceTabs.forEach((tab) => {
    const isActive = tab.dataset.promptSource === state.activeSourceId;
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function selectPromptSource(sourceId) {
  if (sourceId === state.activeSourceId) {
    return;
  }

  state.activeSourceId = sourceId;
  state.selectedIndex = 0;
  elements.mobileStyleDetails.open = false;
  renderSourceTabs();
  loadStyles();
}

function selectStyle(index) {
  const style = state.styles[index];
  state.selectedIndex = index;
  updateStyleSelection();
  updateOutput();
  setStatus(`${getStyleTitle(style)} を選択しました。`, "success");
}

function autoResizeTextareas() {
  [
    elements.lyricsPromptOutput,
    elements.sunoPromptOutput,
    elements.thumbnailPromptOutput,
  ].forEach((textarea) => {
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
  renderThemeField();
  elements.styleCount.textContent = "";
  elements.styleList.innerHTML = "";
  elements.mobileStyleOptions.innerHTML = "";
  elements.styleList.append(createEmptyState("読み込み中..."));
  elements.mobileSelectedTitle.textContent = "読み込み中...";
  elements.mobileSelectedDescription.textContent = "";
  elements.mobileSelectedInspired.textContent = "";
  elements.selectedTitle.textContent = "";
  elements.lyricsPromptOutput.value = "";
  elements.sunoPromptOutput.value = "";
  autoResizeTextareas();
  setStatus("", "success");
}

function showError(message) {
  renderThemeField();
  elements.styleCount.textContent = "";
  elements.styleList.innerHTML = "";
  elements.mobileStyleOptions.innerHTML = "";
  elements.styleList.append(createEmptyState("読み込み失敗"));
  elements.mobileSelectedTitle.textContent = "読み込み失敗";
  elements.mobileSelectedDescription.textContent = "";
  elements.mobileSelectedInspired.textContent = "";
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
elements.copyThumbnailButton.addEventListener("click", () => {
  copyPrompt(elements.thumbnailPromptOutput, "サムネイル用プロンプトをコピーしました。");
});
elements.lyricsPromptOutput.addEventListener("input", autoResizeTextareas);
elements.sunoPromptOutput.addEventListener("input", autoResizeTextareas);
elements.thumbnailPromptOutput.value = THUMBNAIL_PROMPT_TEXT;
elements.songTitleInput.addEventListener("input", (event) => {
  state.japanSongTitle = event.target.value;
  updateOutput();
});
elements.durationSelect.addEventListener("change", (event) => {
  state.japanDurationMinutes = event.target.value;
  updateOutput();
});
elements.themeInput.addEventListener("input", (event) => {
  state.japanTheme = event.target.value;
  updateOutput();
});
elements.sourceTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectPromptSource(tab.dataset.promptSource);
  });
});
loadStyles();
