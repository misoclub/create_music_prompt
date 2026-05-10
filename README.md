# Music Prompt Copier

JSONに保存した音楽スタイルを選ぶと、歌詞生成用プロンプトとSuno用プロンプトを生成する静的Webページです。ビルド不要なので GitHub Pages にそのまま公開できます。

## ディレクトリ構成

```text
/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── json/
    └── prompts.json
```

## JSON

編集するファイルは `json/prompts.json` です。

```json
{
  "version": "1.0",
  "styles": [
    {
      "title": "Bollywood Dance Anthem",
      "title_ja": "ボリウッド・ダンスアンセム",
      "description_ja": "説明文",
      "prompt": "AIに渡す音楽スタイル"
    }
  ]
}
```

一覧には `title_ja` と `description_ja` を表示します。`title` は英語名の保管用で、画面では使用しません。スタイルを選択すると、歌詞生成用プロンプトには `prompt` の下に固定の日本語指示文を追加したテキストを生成します。Suno用プロンプトには `prompt` をそのまま表示します。

## GitHub Pages

GitHub のリポジトリ設定から `Settings` -> `Pages` を開き、`Deploy from a branch` を選んで、公開したいブランチの `/root` を指定してください。
