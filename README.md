# Excel Quick Reference

A searchable Excel reference: all 500+ functions, about 200 shortcuts, tools, fixes and everyday tasks, from beginner to expert.

Type in the search box (for example `date`, `sum`, `lookup`, `not adding`, `#N/A`) and the matching cards show instantly.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page and search box |
| `style.css` | The design, light and dark mode, print layout |
| `script.js` | Search, filters, copy buttons, cheat sheet |
| `data.js` | All the content |

## Add or change an item

Open `data.js`, copy one block and edit the text:

```js
{ l: 'beginner', t: 'SUM', d: 'Adds numbers.', e: '=SUM(E2:E6)', a: '238', cat: 'Math', u: 'daily', k: 'add total plus' },
```

- `l` level: `beginner`, `intermediate`, `expert`, `shortcut`, `fix`, `task`, `forgot`
- `t` title, `d` what it does, `e` example, `a` answer
- `alt` another way, `tip` extra note
- `cat` category for the dropdown, `u` how often used (`daily`, `sometimes`, `rare`)
- `v` Excel version needed (`2013`, `2016`, `2019`, `2021`, `365`)
- `k` hidden search keywords
- `c: 1` puts it on the printed cheat sheet

## Publish on GitHub Pages

1. Create a new public repository, for example `excel-guide`
2. Upload all the files in this folder
3. Go to Settings, Pages
4. Source: Deploy from a branch. Branch: `main`, folder: `/ (root)`. Save
5. Wait about a minute. The link appears on the same page: `https://YOUR-USERNAME.github.io/excel-guide/`

## Notes

- Shortcuts are for Windows. Ribbon key sequences (Alt, H, ...) can differ slightly between Excel versions and languages.
- Functions marked with a version badge need that Excel version or newer.
