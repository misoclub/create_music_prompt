# Music Prompt Builder

JSONで保存した項目とテンプレートから、音楽生成AI向けのプロンプトを自動生成する静的Webページです。ビルド不要なので GitHub Pages にそのまま公開できます。

## 使い方

1. `json/prompts.json` の `fields`、`presets`、`template` を編集します。
2. `index.html` をブラウザで開くか、GitHub Pages に公開します。
3. ページ上で条件を変えると、右側のプロンプトが自動更新されます。

## GitHub Pages

GitHub のリポジトリ設定から `Settings` -> `Pages` を開き、`Deploy from a branch` を選んで、公開したいブランチの `/root` を指定してください。

## JSONの置換ルール

`template` 内の `{{field_id}}` が、同じ `id` を持つ `fields` の値に置き換わります。

例:

```json
{
  "id": "genre",
  "label": "ジャンル",
  "type": "text",
  "default": "city pop"
}
```

```text
Genre: {{genre}}
```

対応している `type` は `text`、`textarea`、`select`、`multiselect`、`checkbox`、`number` です。
