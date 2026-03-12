# 🦇 BiteFight Bot Pro v30.2 (AJAX Edition)

![Wersja](https://img.shields.io/badge/Wersja-v30.2-blue.svg)
![Język](https://img.shields.io/badge/J%C4%99zyk-JavaScript-yellow.svg)
![Tampermonkey](https://img.shields.io/badge/Wtyczka-Tampermonkey-green.svg)

Zaawansowany, niewykrywalny skrypt (Userscript) do gry BiteFight, operujący w 100% w tle z wykorzystaniem technologii AJAX i fetch. Skrypt oszczędza transfer, nie przeładowuje strony i automatyzuje żmudne, codzienne czynności w grze.

## 🌟 Główne Funkcje

- **Rozbudowany Panel GUI:** Elegancki i mroczny interfejs w lewym rogu ekranu, pasujący do klimatu gry.
- **Logi w czasie rzeczywistym:** Monitoruj działania bota na bieżąco, bez odświeżania strony.
- **Praca w tle (AJAX):** Bot nie przeszkadza w przeglądaniu innych zakładek gry.
- **Inteligentne zarządzanie PA:**
  - Odbieranie Sfer Ekstrakcji zgodnie z wybraną rangą (od S do F).
  - Polowanie w wybranych lokacjach z uwzględnieniem Sfer.
  - Wykonywanie zadań w Lesie na podstawie wybranej strategii (Exp, Złoto, Aspekty).
  - Automatyczne wyjście z Lasu i podjęcie Pracy na Cmentarzu, gdy PA spadnie poniżej ustalonego progu.
- **Zarządzanie Postacią:**
  - Auto-leczenie i odnawianie energii (Mikstury i Kościół).
  - Automatyczny zakup brakujących mikstur na Rynku.
  - Trening atrybutów.
  - Rekrutacja jednostek w Jamie Lęgowej.
- **Wojny i Walka:**
  - Automatyczny, cykliczny meldunek na Wojny Klanowe (co 10 minut).
  - Atakowanie potworów w Ruinach Pradziejów (z obsługą poziomów 1-5). Możliwość dodania więcej.
  - Walki z Demonami w Grocie.

## ⚙️ Instalacja

Aby zainstalować skrypt, potrzebujesz rozszerzenia do przeglądarki:
- [Tampermonkey dla Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Tampermonkey dla Firefox](https://addons.mozilla.org/pl/firefox/addon/tampermonkey/)

Gdy masz już Tampermonkey:
1. Kliknij w plik **`bitefight-bot-pro.user.js`** w tym repozytorium.
2. Kliknij przycisk **Raw** (Zwykły tekst) w prawym górnym rogu kodu.
3. Tampermonkey automatycznie przechwyci skrypt – kliknij **Zainstaluj** (Install).
4. Wejdź na stronę BiteFight i ciesz się grą!

## ⚠️ Zrzeczenie się odpowiedzialności
*Ten skrypt został stworzony wyłącznie w celach edukacyjnych. Korzystanie z botów i skryptów automatyzujących może naruszać Regulamin (ToS) firmy Gameforge. Używasz go wyłącznie na własne ryzyko. Twórca nie ponosi odpowiedzialności za ewentualne blokady kont.*
