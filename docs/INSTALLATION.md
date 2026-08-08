# Установка — Helper S21

Helper S21 — расширение для браузеров, которое устанавливается одним из двух
способов для каждой платформы:

1. **Простое скачивание** — готовый zip из папки `release/`
2. **Из исходников** — сборка через `npm run release` (или `npm run build`)

> Версии Firefox и Safari — **в разработке** и пока ставятся вручную, как
> временные (unpacked) расширения.

---

## Chrome

_Chrome, а также Chromium, Microsoft Edge, Opera, Brave._

### Способ 1. Скачать release

0. Перейти на [страницу с релизами](https://github.com/qFioofa/helper-extention.s21/releases)
1. Скачайте архив с нужней версией (рекомендуется быть последнюю)
2. Распакуйте его в любую папку
3. Откройте `chrome://extensions/`
4. Включите **Developer mode** (правый верхний угол)
5. Нажмите **Load unpacked** и выберите распакованную папку
6. Расширение Helper S21 появится в списке и в панели Chrome

### Способ 2. Из исходников

```bash
git clone https://github.com/qFioofa/helper-extention.s21
cd helper-extention.s21
npm install
npm run build          # соберёт dist/
```

Далее: `chrome://extensions/` → **Developer mode** → **Load unpacked** → выбрать `dist/`.

> После пересборки обновите расширение кнопкой **Reload** на странице `chrome://extensions/`.

---

## Firefox

_В разработке_

---

## Safari

_В разработке_

---
