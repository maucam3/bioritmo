# Sincronía · Biorhythm & compatibility

Installable web app to check your **daily biorhythm** (physical, emotional and intellectual) and your **biorhythm compatibility** with another person.

**👉 Open the app: <https://maucam3.github.io/bioritmo/>**

> The app itself is in Spanish.

## Features

- **Intro**: what biorhythms are, the three cycles and how they are used.
- **My day**: overall energy, the three cycles with their trend, a daily reading, a monthly chart, upcoming critical days and the best day of the week.
- **Couple**: lifetime compatibility (overall and per cycle), today's sync, the step-by-step math, both waves over the next 30 days and the best days to spend together.
- **Share app** button that opens the phone's share menu (or copies the link on desktop).
- Works **offline** once installed; data is stored only on your device.

## Install on your phone

- **Android (Chrome)**: open the link → menu ⋮ → *Install app* (or *Add to Home screen*).
- **iPhone (Safari)**: open the link → Share button → *Add to Home Screen*.
- **Desktop (Chrome or Edge)**: open the link → install icon in the address bar.

The installed app updates itself the next time you open it with an internet connection.

You can also download the source as a ZIP: green **Code → Download ZIP** button on this page, or directly [here](https://github.com/maucam3/bioritmo/archive/refs/heads/main.zip).

## The math

| Cycle | Period | Formula |
|---|---|---|
| Physical | 23 days | `sin(2π·t/23)` |
| Emotional | 28 days | `sin(2π·t/28)` |
| Intellectual | 33 days | `sin(2π·t/33)` |

- `t` = days since birth.
- **Compatibility per cycle**: `(1 + cos(2π·Δ/period)) / 2`, where `Δ` = days between both birth dates. Since `Δ` never changes, this is a lifetime value.
- **Lifetime compatibility**: the average of the three cycles.
- **Today's sync**: `1 − |A − B| / 2` for each cycle on a given day, averaged.
- All three cycles line up again every 23 · 28 · 33 = 21,252 days (~58 years).

> Biorhythms are a popular tradition with no scientific backing: use the app for fun.

## Run locally

```bash
python -m http.server 5501
```

then open <http://localhost:5501>.
