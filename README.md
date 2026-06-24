# JRD LinkedIn Dashboard

Interaktivní dashboard výkonu JRD na LinkedIn v designu **ON BOARD Design System**.

## Jak otevřít
Dvojklik na **`Spustit dashboard.command`** — přepočítá data z nejnovější tabulky a otevře dashboard v prohlížeči.

## Aktualizace dat lokálně (náhled na počítači)
1. Nahraj novou tabulku do nadřazené složky (např. `JRD ContentPlan v3.xlsx`).
2. Dvojklik na `Spustit dashboard.command` (skript si sám vezme **nejnovější** soubor podle data úpravy).
3. Hotovo — stejné obrazovky, nová data.

Ruční varianta: `python3 build.py` a pak `python3 -m http.server 8765`.

## Nasazení na Vercel (přes git)
Dashboard je **čistě statický web** (žádný server, žádný build na Vercelu) — Vercel jen servíruje soubory.

**První nasazení:**
1. Tato složka (`dashboard/`) je už git repo. Vytvoř prázdný repozitář na GitHubu a propoj:
   ```bash
   git remote add origin <URL-tvého-repozitáře>
   git push -u origin main
   ```
2. Na [vercel.com](https://vercel.com) → **Add New → Project** → vyber ten repozitář.
3. Framework Preset nech **Other** (statický web), Root Directory = kořen repa. Klikni **Deploy**.
4. Hotovo — Vercel ti dá veřejnou URL (např. `jrd-linkedin.vercel.app`).

**Aktualizace dat na webu (nová verze tabulky):**
```bash
python3 build.py          # přepočítá data.json z nejnovější tabulky
git add data.json
git commit -m "Aktualizace dat"
git push                  # Vercel automaticky nasadí novou verzi
```
Stejné obrazovky, nová data. Excel tabulka se na web nenahrává (je v `.gitignore`) — nasazuje se jen předpočítaný `data.json`.

> Pozn.: `index.html` načítá Chart.js a fonty z CDN, takže na Vercelu (online) vše funguje bez instalace.

## Soubory
| Soubor | Účel |
|---|---|
| `build.py` | přečte nejnovější `JRD ContentPlan*.xlsx`, vyčistí a vygeneruje `data.json` |
| `data.json` | předpočítaná data (jediné, co se mění při aktualizaci) |
| `index.html` / `app.js` / `styles.css` | dashboard (vzhled se nemění) |
| `assets/` | logo ON BOARD |

## 7 obrazovek
1. **Přehled** — hlavní KPI + vývoj dosahu
2. **Dosah v čase** — měsíčně, kumulativně, podíl autorů, srovnání let
3. **Nejlepší čas** — den, hodina, teplotní mapa, sezónnost
4. **Růst sítě** — sledující/spojení v čase, přírůstky (Řežáb/Sadil/JRD + IG/FB bonus)
5. **Srovnání profilů** — Řežáb vs Sadil
6. **TOP příspěvky** — žebříček dle dosahu
7. **Stav obsahu** — publikováno vs. rozpracováno

Filtry nahoře: **období** (Vše/2023–2026) a **profil**. Lze i deep-linkovat přes `?s=network&net=JRD`.

## Přesnost dat
Do výkonu se počítají jen **publikované** příspěvky (status „1 - Done") se skutečným dosahem; datum/den/hodina se počítají přímo z data publikace (ne z výpočtových buněk, kde byly chyby). Budoucí a rozpracované položky se do výkonu nezahrnují.
