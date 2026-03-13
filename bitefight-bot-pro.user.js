// ==UserScript==
// @name         BiteFight Bot Pro v30.3 (AJAX GUI + Dynamiczne HP)
// @namespace    http://tampermonkey.net/
// @version      30.3
// @description  W pełni konfigurowalne leczenie, 100% poprawny payload, obsługa kościoła.
// @author       Neymaro007
// @match        https://*.bitefight.gameforge.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    //==================================================================
    // 📜 KONFIGURACJA 📜
    //==================================================================

    const potionScriptCooldown = 31 * 60 * 1000;
    const churchScriptCooldown = 121 * 60 * 1000;
    const ruinsCooldown = 61 * 60 * 1000;
    const clanWarCooldown = 10 * 60 * 1000;

    const baseURL = window.location.origin;

    const adventureLink = baseURL + "/city/adventure";
    const profileLink = baseURL + "/profile/index";
    const churchLink = baseURL + "/city/church";
    const marketLink = baseURL + "/city/shop/potions/";
    const clanLink = baseURL + "/clan/index";
    const huntLink = baseURL + "/robbery/index";
    const graveyardLink = baseURL + "/city/graveyard";
    const trainLink = baseURL + "/nourishing/index";
    const grotteLink = baseURL + "/city/grotte";

    const potionEnergyName = "Mikstura Energii";

    const ruinsLevels = [
        { id: 1, unit1: 4, unit2: 4 },
        { id: 2, unit1: 7, unit2: 5 },
        { id: 3, unit1: 11, unit2: 6 },
        { id: 4, unit1: 13, unit2: 8 },
        { id: 5, unit1: 15, unit2: 10 }
    ];

    const adventureStrategies = {
        'exp_gold': {
            name: "Max EXP i Złoto",
            priority: ['Zaurocz', 'Pożryj', 'Wrzuć monetę', 'Skonfrontuj wroga', 'Do ataku!', 'Zamorduj podstępnie', 'Wejdź do lasu', 'Splądruj', 'Zdobądź niezły łup', 'Podpal wszystko', 'Wykorzystaj szansę', 'Zostań tutaj', 'Bądź odważny', 'Sprawdź', 'Rozejrzyj się'],
            avoid: ['Terroryzuj', 'Pogódź się z tym', 'Zakończ przygodę', 'Uciekaj']
        },
        'aspect_human': { name: "Człowiek", priority: ['Ostrzeż', 'Porozmawiaj', 'Bądź odważny', 'Baw się', 'Zostań'], avoid: ['Zamorduj', 'Do ataku!', 'Podpal', 'Zakończ', 'Pogódź'] },
        'aspect_knowledge': { name: "Wiedza", priority: ['Sprawdź', 'Przeczytaj', 'Rozejrzyj się', 'Porozmawiaj'], avoid: ['Podpal', 'Do ataku!', 'Zniszcz'] },
        'aspect_order': { name: "Porządek", priority: ['Skonfrontuj wroga', 'Bądź odważny', 'Sprawdź'], avoid: ['Zamorduj', 'Terroryzuj', 'Splądruj'] },
        'aspect_nature': { name: "Natura", priority: ['Ukryj się', 'Zostań tutaj', 'Obserwuj', 'Idź ostrożnie'], avoid: ['Podpal', 'Do ataku!', 'Zniszcz'] },
        'aspect_beast': { name: "Bestia", priority: ['Do ataku!', 'Pożryj', 'Śmiertelna aura', 'Terroryzuj'], avoid: ['Porozmawiaj', 'Ostrzeż', 'Ukryj się'] },
        'aspect_destruction': { name: "Zniszczenie", priority: ['Podpal wszystko', 'Zniszcz', 'Do ataku!'], avoid: ['Sprawdź', 'Zostań', 'Porozmawiaj'] },
        'aspect_chaos': { name: "Chaos", priority: ['Wykorzystaj szansę', 'Przeskocz', 'Zniszcz', 'Podpal'], avoid: ['Skonfrontuj', 'Sprawdź', 'Ostrzeż'] },
        'aspect_corruption': { name: "Korupcja", priority: ['Zamorduj', 'Splądruj', 'Zdobądź', 'Zaurocz'], avoid: ['Skonfrontuj', 'Ostrzeż', 'Bądź odważny'] }
    };

    const unitCosts = { '1': 10, '2': 15, '3': 20, '4': 35 };

    //==================================================================
    // 🤖 RDZEŃ SKRYPTU (GUI) 🤖
    //==================================================================
    function createBotPanel() {
        if (document.getElementById('bf-bot-panel')) return;

        const currentServerMatch = window.location.host.match(/s(\d+)-pl/);
        const currentServerId = currentServerMatch ? currentServerMatch[1] : '70';
        const isX2 = ['60', '63', '65', '67', '69'].includes(currentServerId);

        let graveyardOptions = isX2 ? `
            <option value="1">0:30:00 godz. </option><option value="2">1:00:00 godz. </option><option value="3">1:30:00 godz. </option><option value="4">2:00:00 godz. </option>
            <option value="5">2:30:00 godz. </option><option value="6">3:00:00 godz. </option><option value="7">3:30:00 godz. </option><option value="8">4:00:00 godz. </option>` : `
            <option value="1">0:10:12 godz. </option><option value="2">0:20:24 godz. </option><option value="3">0:30:36 godz. </option><option value="4">0:40:48 godz. </option>
            <option value="5">0:51:00 godz. </option><option value="6">1:01:12 godz. </option><option value="7">1:11:24 godz. </option><option value="8">1:21:36 godz. </option>`;

        const panel = document.createElement('div');
        panel.id = 'bf-bot-panel';
        panel.style.cssText = `
            position: fixed; top: 10px; left: 10px; width: 300px;
            background: linear-gradient(180deg, #1a0a0a 0%, #0d0404 100%);
            border: 2px solid #7a0000; color: #d4d4d4; padding: 12px; z-index: 999999;
            font-family: Tahoma, Arial, sans-serif; font-size: 12px; border-radius: 8px;
            box-shadow: 3px 3px 20px rgba(0,0,0,0.9); max-height: 95vh; overflow-y: auto; overflow-x: hidden;
        `;

        panel.innerHTML = `
            <style>
                #bf-bot-panel * { box-sizing: border-box; }
                .bf-sec { background: rgba(20, 5, 5, 0.6); border: 1px solid #4a1515; border-radius: 6px; padding: 10px; margin-bottom: 12px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
                .bf-sec-main { border: 1px solid #8a1515; background: rgba(30, 8, 8, 0.8); box-shadow: 0 0 8px rgba(138, 0, 0, 0.3) inset; }
                .bf-sec-title { margin: 0 0 10px 0; font-weight: bold; color: #ff5555; font-size: 13px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #4a1010; padding-bottom: 5px; text-shadow: 1px 1px 2px black; }
                .bf-row { display: flex; align-items: center; margin-bottom: 8px; justify-content: space-between; }
                .bf-row-left { display: flex; align-items: center; margin-bottom: 8px; justify-content: flex-start; gap: 8px;}
                .bf-row label, .bf-row-left label { cursor: pointer; display: flex; align-items: center; gap: 6px; color: #e0e0e0; font-size: 12px; }
                .bf-sel { width: 100%; background: #0a0404; color: #ffdddd; border: 1px solid #661111; padding: 5px; border-radius: 4px; font-size: 11px; margin-top: 2px; outline: none; cursor: pointer; transition: 0.2s;}
                .bf-sel:hover { border-color: #aa2222; }
                .bf-sel option:disabled { color: #555; background: #0a0404; }
                .bf-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
                .bf-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
                .bf-badge { background: #2a0b0b; border: 1px solid #551111; border-radius: 4px; padding: 4px 0; text-align: center; cursor: pointer; color: #ccc; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;}
                .bf-badge:hover { background: #501010; color: #fff; border-color: #882222; }
                .bf-badge input { margin: 0; cursor: pointer; }
                .bf-hr { border: 0; height: 1px; background: linear-gradient(90deg, transparent, #551111, transparent); margin: 10px 0; }
                #bf-bot-panel::-webkit-scrollbar { width: 6px; }
                #bf-bot-panel::-webkit-scrollbar-track { background: #0d0404; border-radius: 4px; }
                #bf-bot-panel::-webkit-scrollbar-thumb { background: #7a0000; border-radius: 4px; }
            </style>
            <h3 style="margin: 0 0 5px 0; text-align: center; color: #ff3333; text-transform: uppercase; letter-spacing: 2px; font-size: 15px; text-shadow: 2px 2px 4px black;">BiteFight Bot v30.3</h3>
            <div style="text-align: center; margin-bottom: 12px;">
                <label style="color:#aaa; font-size: 11px;">🌍 Serwer:</label>
                <select id="bot-server-select" class="bf-sel" style="width: auto; display: inline-block; margin-left: 5px; padding: 2px 5px; margin-right: 10px;">
                    <option value="60">s60</option><option value="61">s61</option><option value="62">s62</option><option value="63">s63</option><option value="64">s64</option><option value="65">s65</option>
                    <option value="66">s66</option><option value="67">s67</option><option value="68">s68</option><option value="69">s69</option><option value="70">s70</option>
                </select>
                <div style="margin-top: 6px;">
                    <label style="color:#aaa; font-size: 11px;">⏱️ Prędkość bota:</label>
                    <select id="bot-click-delay" class="bf-sel" style="width: auto; display: inline-block; margin-left: 5px; padding: 2px 5px;">
                        <option value="fast">Szybka (100 - 400 ms)</option><option value="normal" selected>Normalna (200 - 800 ms)</option>
                        <option value="human">Ludzka (0.5s - 1.5s)</option><option value="safe">Bezpieczna (1s - 3s)</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button id="btn-start" style="flex: 1; padding: 10px; font-size: 13px; font-weight: bold; border: 1px solid #00aa00; background: linear-gradient(180deg, #004400, #002200); color: #fff; cursor: pointer; border-radius: 5px; text-shadow: 1px 1px 2px black;">▶ START</button>
                <button id="btn-stop" style="flex: 1; padding: 10px; font-size: 13px; font-weight: bold; border: 1px solid #aa0000; background: linear-gradient(180deg, #440000, #220000); color: #fff; cursor: pointer; border-radius: 5px; text-shadow: 1px 1px 2px black;">⏹ STOP</button>
            </div>
            <div style="margin-bottom: 15px;">
                <button id="btn-reset" style="width: 100%; padding: 8px; font-size: 12px; font-weight: bold; border: 1px solid #997700; background: linear-gradient(180deg, #554400, #222200); color: #fff; cursor: pointer; border-radius: 5px; text-shadow: 1px 1px 2px black;">🔄 Wyczyść Pamięć (Zacięcia)</button>
            </div>
            <div class="bf-sec" style="margin-bottom: 12px; padding: 6px;">
                <div class="bf-sec-title" style="margin-bottom: 4px;">📝 Logi działań w tle (AJAX)</div>
                <div id="bf-bot-logs" style="background: #000; border: 1px solid #4a1515; padding: 5px; height: 120px; overflow-y: auto; font-family: monospace; font-size: 10px; border-radius: 4px;"></div>
            </div>
            <div class="bf-sec bf-sec-main">
                <div class="bf-sec-title">⚔️ Główna Aktywność (Wybierz 1)</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-adventure"> 🌲 Przygoda w Lesie</label></div>
                <select id="bot-adv-strategy" class="bf-sel" style="margin-bottom: 10px;">
                    <option value="exp_gold">⚔️ Max EXP i Złoto</option><option value="aspect_human">👤 Aspekt: Człowiek</option><option value="aspect_knowledge">📖 Aspekt: Wiedza</option>
                    <option value="aspect_order">⚖️ Aspekt: Porządek (+HP)</option><option value="aspect_nature">🌿 Aspekt: Natura</option><option value="aspect_beast">🐺 Aspekt: Bestia</option>
                    <option value="aspect_destruction">🔥 Aspekt: Zniszczenie</option><option value="aspect_chaos">🌪️ Aspekt: Chaos</option><option value="aspect_corruption">🧛 Aspekt: Korupcja</option>
                </select>
                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-grotte"> 🦇 Polowanie w Grocie</label></div>
                <select id="bot-grotte-diff" class="bf-sel"><option value="Łatwe">🟢 Poziom: Łatwe</option><option value="Średnie">🟡 Poziom: Średnie</option><option value="Trudne">🔴 Poziom: Trudne</option></select>
            </div>
            <div class="bf-sec">
                <div class="bf-sec-title">🧛 Polowanie na Ludzi</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-hunt"> Aktywuj Polowanie</label></div>
                <select id="bot-hunt-location" class="bf-sel"><option value="1">Farma (1 PA)</option><option value="2">Wioska (1 PA)</option><option value="3">Małe miasteczko (1 PA)</option><option value="4">Miasto (1 PA)</option><option value="5">Metropolia (2 PA)</option></select>
                <div style="margin-top: 10px; color: #aaa; font-size: 10px; text-align: center;">Odbieraj Sfery tych Rang:</div>
                <div class="bf-grid-4" id="bot-rank-checkboxes">
                    <label class="bf-badge"><input type="checkbox" value="S"> S</label><label class="bf-badge"><input type="checkbox" value="A"> A</label><label class="bf-badge"><input type="checkbox" value="B"> B</label>
                    <label class="bf-badge"><input type="checkbox" value="C"> C</label><label class="bf-badge"><input type="checkbox" value="D"> D</label><label class="bf-badge"><input type="checkbox" value="E"> E</label><label class="bf-badge"><input type="checkbox" value="F"> F</label>
                </div>
                <div class="bf-row-left" style="margin-top: 10px; margin-bottom: 0;"><label title="Gdy bot zapełni sloty odliczaniem, przerwie polowania."><input type="checkbox" id="bot-toggle-hunt-spheres-only"> 🔮 Tylko po Sfery Ekstrakcji</label></div>
            </div>
            <div class="bf-sec">
                <div class="bf-sec-title">🏰 Walka i Ruiny</div>
                <div class="bf-row-left"><label><input type="checkbox" id="bot-toggle-clan"> Zapisuj na Wojny Klanowe</label></div>
                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-ruins"> Ruiny Pradziejów</label></div>
                <div style="color: #aaa; font-size: 10px; margin-left: 24px; margin-bottom: 4px;">Wybierz poziomy do ataku:</div>
                <div class="bf-grid-3" id="bot-ruins-checkboxes" style="margin-left: 24px;">
                    <label class="bf-badge"><input type="checkbox" value="1"> Poz. 1</label><label class="bf-badge"><input type="checkbox" value="2"> Poz. 2</label>
                    <label class="bf-badge"><input type="checkbox" value="3"> Poz. 3</label><label class="bf-badge"><input type="checkbox" value="4"> Poz. 4</label><label class="bf-badge"><input type="checkbox" value="5"> Poz. 5</label>
                </div>
            </div>
            <div class="bf-sec">
                <div class="bf-sec-title">💎 Rozwój Postaci</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-attributes"> Trenuj Atrybuty (Złoto):</label></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-left: 24px; margin-top: 5px;">
                    <label class="bf-badge"><input type="checkbox" id="attr-strength" value="Siła"> Siła</label><label class="bf-badge"><input type="checkbox" id="attr-defense" value="Obrona"> Obrona</label>
                    <label class="bf-badge"><input type="checkbox" id="attr-agility" value="Zwinność"> Zwinność</label><label class="bf-badge"><input type="checkbox" id="attr-endurance" value="Wytrzymałość"> Wytrzym.</label><label class="bf-badge" style="grid-column: span 2;"><input type="checkbox" id="attr-charisma" value="Charyzma"> Charyzma</label>
                </div>
                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-train"> Jamy Lęgowe (Wojsko)</label></div>
                <select id="bot-train-unit" class="bf-sel" style="margin-left: 24px; width: calc(100% - 24px);"><option value="1">Rój Nietoperzy</option><option value="2">Ghul</option><option value="3">Wampirzy Niewolnik</option><option value="4">Banshee</option></select>
            </div>
            <div class="bf-sec" style="margin-bottom: 0;">
                <div class="bf-sec-title">🩸 Przetrwanie i Regeneracja</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-potion-life"> Pij Mikstury Leczące:</label></div>
                <select id="bot-potion-type" class="bf-sel" style="margin-bottom: 5px;">
                    <option value="Mała Uzdrawiająca Mikstura">Mała Uzdrawiająca (od 1 lvl)</option><option value="Średnia Uzdrawiająca Mikstura">Średnia Uzdrawiająca (od 3 lvl)</option><option value="Zupa Życia">Zupa Życia (od 75 lvl)</option>
                </select>
                <div class="bf-row-left" style="margin-top: 5px;"><label style="font-weight:bold; color:#00ffcc;">╰ Pij miksturę, gdy HP spadnie do:</label></div>
                <select id="bot-potion-hp" class="bf-sel" style="margin-bottom: 10px;">
                    <option value="0.90">90%</option><option value="0.80" selected>80%</option><option value="0.70">70%</option><option value="0.60">60%</option><option value="0.50">50%</option>
                </select>

                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-potion-energy"> Pij Mikstury Energii (PA)</label></div>
                <div class="bf-row-left" style="margin-top: 10px; margin-bottom: 10px;"><label style="font-weight:bold; color:#00ff00;"><input type="checkbox" id="bot-potion-autobuy"> Auto-Kupowanie brakujących mikstur</label></div>

                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-church"> Uzdrowienie w Kościele</label></div>
                <div class="bf-row-left" style="margin-top: 5px;"><label style="font-weight:bold; color:#ffcc33;">╰ Idź do Kościoła, gdy HP spadnie do:</label></div>
                <select id="bot-church-hp" class="bf-sel" style="margin-bottom: 5px;">
                    <option value="0.30">30%</option><option value="0.25">25%</option><option value="0.20">20%</option><option value="0.15" selected>15%</option><option value="0.10">10%</option>
                </select>
                <div style="color: #aaa; font-size: 10px; margin-left: 24px;">Akceptuj max. koszt leczenia:</div>
                <select id="bot-church-ap" class="bf-sel" style="margin-left: 24px; width: calc(100% - 24px); margin-bottom: 10px;">
                    <option value="5">Do 5 Punktów Akcji (PA)</option><option value="10">Do 10 Punktów Akcji (PA)</option><option value="20">Do 20 Punktów Akcji (PA)</option><option value="40">Do 40 Punktów Akcji (PA)</option><option value="80">Do 80 Punktów Akcji (PA)</option>
                </select>

                <div class="bf-hr"></div>
                <div class="bf-row-left" style="margin-top: 10px;"><label style="font-weight:bold; color:#ff5555;">🛡️ Ucieczka (Wyjdź z Lasu), gdy HP wynosi:</label></div>
                <select id="bot-safe-hp" class="bf-sel" style="margin-bottom: 10px;">
                    <option value="0.15">15% (Wysokie ryzyko)</option><option value="0.25">25% (Podwyższone ryzyko)</option><option value="0.35">35% (Zbalansowane)</option><option value="0.50">50% (Bezpieczne)</option><option value="0.65">65% (Bardzo ostrożnie)</option>
                </select>

                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-graveyard"> Praca (Cmentarz), gdy brak PA</label></div>
                <select id="bot-graveyard-time" class="bf-sel" style="margin-left: 24px; width: calc(100% - 24px);">${graveyardOptions}</select>
            </div>
        `;

        document.body.appendChild(panel);

        const btnStart = document.getElementById('btn-start');
        const btnStop = document.getElementById('btn-stop');
        const btnReset = document.getElementById('btn-reset');
        const serverSelect = document.getElementById('bot-server-select');

        if (currentServerMatch) serverSelect.value = currentServerMatch[1];
        serverSelect.addEventListener('change', (e) => { window.location.href = `https://s${e.target.value}-pl.bitefight.gameforge.com/profile/index`; });

        function updateMainButtons(isRunning) {
            if (isRunning) {
                btnStart.style.background = '#006600'; btnStart.style.color = '#fff'; btnStart.style.boxShadow = '0 0 12px #00ff00'; btnStart.style.borderColor = '#00ff00';
                btnStop.style.background = '#330000'; btnStop.style.color = '#888'; btnStop.style.boxShadow = 'none'; btnStop.style.borderColor = '#660000';
            } else {
                btnStart.style.background = '#003300'; btnStart.style.color = '#888'; btnStart.style.boxShadow = 'none'; btnStart.style.borderColor = '#006600';
                btnStop.style.background = '#880000'; btnStop.style.color = '#fff'; btnStop.style.boxShadow = '0 0 12px #ff0000'; btnStop.style.borderColor = '#ff3333';
            }
        }

        const isRunning = localStorage.getItem('botCfg_Main') === 'true';
        updateMainButtons(isRunning);

        btnStart.addEventListener('click', () => { localStorage.setItem('botCfg_Main', 'true'); updateMainButtons(true); });
        btnStop.addEventListener('click', () => { localStorage.setItem('botCfg_Main', 'false'); updateMainButtons(false); });

        btnReset.addEventListener('click', () => {
            localStorage.removeItem('lastLifePotionUse'); localStorage.removeItem('lastEnergyPotionUse');
            localStorage.removeItem('needsLifePotion'); localStorage.removeItem('needsEnergyPotion');
            localStorage.removeItem('nextChurchUse');
            [1, 2, 3, 4, 5].forEach(id => localStorage.removeItem(`nextRuin_${id}`));
            logToGUI("🔄 Pamięć wyczyszczona (Zresetowano czasy Ruin i Kościoła)!", "#ffff00");
        });

        const setupCb = (id, key, def) => {
            const cb = document.getElementById(id);
            if (!cb) return;
            let state = localStorage.getItem(key);
            if (state === null) { localStorage.setItem(key, def); state = def.toString(); }
            cb.checked = state === 'true';
            cb.addEventListener('change', (e) => localStorage.setItem(key, e.target.checked));
        };

        const setupSel = (id, key) => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const val = localStorage.getItem(key);
            if (val) sel.value = val; else localStorage.setItem(key, sel.value);
            sel.addEventListener('change', (e) => localStorage.setItem(key, e.target.value));
        };

        const rankCbs = Array.from(document.querySelectorAll('#bot-rank-checkboxes input'));
        const savedRanks = localStorage.getItem('botCfg_HuntRanks');
        const activeRanks = savedRanks ? savedRanks.split(',') : ['S','A','B','C','D','E','F'];
        rankCbs.forEach(cb => {
            cb.checked = activeRanks.includes(cb.value);
            cb.addEventListener('change', () => { localStorage.setItem('botCfg_HuntRanks', rankCbs.filter(c => c.checked).map(c => c.value).join(',')); });
        });

        const ruinsCbs = Array.from(document.querySelectorAll('#bot-ruins-checkboxes input'));
        const savedRuins = localStorage.getItem('botCfg_RuinsLevels');
        const activeRuins = savedRuins ? savedRuins.split(',') : ['1','2','3','4','5'];
        ruinsCbs.forEach(cb => {
            cb.checked = activeRuins.includes(cb.value);
            cb.addEventListener('change', () => { localStorage.setItem('botCfg_RuinsLevels', ruinsCbs.filter(c => c.checked).map(c => c.value).join(',')); });
        });

        setupCb('bot-toggle-attributes', 'botCfg_Attributes', false);
        const attrs = ['Siła', 'Obrona', 'Zwinność', 'Wytrzymałość', 'Charyzma'];
        const savedAttrs = localStorage.getItem('botCfg_AttrList');
        const activeAttrs = savedAttrs ? savedAttrs.split(',') : [];

        attrs.forEach(attrName => {
            let attrId = attrName === 'Siła' ? 'attr-strength' : attrName === 'Obrona' ? 'attr-defense' : attrName === 'Zwinność' ? 'attr-agility' : attrName === 'Wytrzymałość' ? 'attr-endurance' : 'attr-charisma';
            const cb = document.getElementById(attrId);
            cb.checked = activeAttrs.includes(attrName);
            cb.addEventListener('change', () => {
                const arr = [];
                if (document.getElementById('attr-strength').checked) arr.push('Siła');
                if (document.getElementById('attr-defense').checked) arr.push('Obrona');
                if (document.getElementById('attr-agility').checked) arr.push('Zwinność');
                if (document.getElementById('attr-endurance').checked) arr.push('Wytrzymałość');
                if (document.getElementById('attr-charisma').checked) arr.push('Charyzma');
                localStorage.setItem('botCfg_AttrList', arr.join(','));
            });
        });

        setupCb('bot-potion-life', 'botCfg_PotionLife', true); setupSel('bot-potion-type', 'botCfg_PotionType');
        setupSel('bot-potion-hp', 'botCfg_PotionHp'); // NOWY SUWAK DLA MIKSTUR
        setupCb('bot-potion-energy', 'botCfg_PotionEnergy', false); setupCb('bot-potion-autobuy', 'botCfg_PotionAutoBuy', false);
        setupSel('bot-safe-hp', 'botCfg_SafeHp');
        setupCb('bot-toggle-church', 'botCfg_Church', true); setupSel('bot-church-ap', 'botCfg_ChurchApMax');
        setupSel('bot-church-hp', 'botCfg_ChurchHp'); // NOWY SUWAK DLA KOŚCIOŁA
        setupCb('bot-toggle-clan', 'botCfg_Clan', true); setupCb('bot-toggle-ruins', 'botCfg_Ruins', true);
        setupCb('bot-toggle-hunt', 'botCfg_Hunt', false); setupSel('bot-hunt-location', 'botCfg_HuntLocation');
        setupCb('bot-toggle-hunt-spheres-only', 'botCfg_HuntSpheresOnly', true);
        setupCb('bot-toggle-adventure', 'botCfg_Adventure', true); setupSel('bot-adv-strategy', 'botCfg_AdvStrategy');
        setupSel('bot-click-delay', 'botCfg_ClickDelay'); setupCb('bot-toggle-grotte', 'botCfg_Grotte', false); setupSel('bot-grotte-diff', 'botCfg_GrotteDiff');
        setupCb('bot-toggle-train', 'botCfg_Train', false); setupSel('bot-train-unit', 'botCfg_TrainUnit');
        setupCb('bot-toggle-graveyard', 'botCfg_Graveyard', true); setupSel('bot-graveyard-time', 'botCfg_GraveyardTime');

        const cbAdv = document.getElementById('bot-toggle-adventure');
        const cbGrotte = document.getElementById('bot-toggle-grotte');
        cbAdv.addEventListener('change', (e) => { if (e.target.checked) { cbGrotte.checked = false; localStorage.setItem('botCfg_Grotte', 'false'); } });
        cbGrotte.addEventListener('change', (e) => { if (e.target.checked) { cbAdv.checked = false; localStorage.setItem('botCfg_Adventure', 'false'); } });
    }

    //==================================================================
    // 📢 SYSTEM LOGÓW W TLE
    //==================================================================
    function logToGUI(message, color = "#cccccc") {
        const logContainer = document.getElementById('bf-bot-logs');
        if (!logContainer) return;
        const logLine = document.createElement('div');
        logLine.style.color = color;
        logLine.style.marginBottom = "2px";
        logLine.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logLine);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    //==================================================================
    // 🌐 SYSTEM ZAPYTAŃ W TLE (AJAX / FETCH)
    //==================================================================
    function resolveUrl(url) {
        if (!url || url === '#') return null;
        if (url.startsWith('javascript')) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return baseURL + url;
        return baseURL + '/' + url;
    }

    async function fetchPage(url, options = {}) {
        if (!url) return null;
        try {
            options.cache = 'no-store';
            options.credentials = 'same-origin';
            const response = await fetch(url, options);
            const htmlText = await response.text();
            return new DOMParser().parseFromString(htmlText, 'text/html');
        } catch (error) { return null; }
    }

    async function submitBackgroundFormOrLink(buttonElement, baseUrlContext) {
        if (!buttonElement) return null;

        if (buttonElement.tagName.toLowerCase() === 'a') {
            const href = buttonElement.getAttribute('href');
            const resHref = resolveUrl(href);
            if (resHref) return await fetchPage(resHref);
        }

        const onclickStr = buttonElement.getAttribute('onclick') || '';
        let match = onclickStr.match(/buttonLeftAction\s*:\s*function\(\)\s*\{\s*window\.location\.href\s*=\s*['"]([^'"]+)['"]/i) ||
                    onclickStr.match(/buttonLeftAction\s*:\s*['"]([^'"]+)['"]/i) ||
                    onclickStr.match(/href\s*=\s*['"]([^'"]+)['"]/i) ||
                    onclickStr.match(/['"]([^'"]+\?__token=[a-f0-9]+)['"]/i) ||
                    onclickStr.match(/['"]([^'"]+\/buy\/[^'"]+)['"]/i);

        if (match && !match[1].includes('function')) {
            return await fetchPage(resolveUrl(match[1]));
        }

        const form = buttonElement.closest('form');
        if (form) {
            const formData = new FormData(form);
            if (buttonElement.name) { formData.append(buttonElement.name, buttonElement.value || ''); }

            let url = resolveUrl(form.getAttribute('action') || baseUrlContext);
            const method = (form.getAttribute('method') || 'GET').toUpperCase();

            const params = new URLSearchParams();
            Array.from(formData.entries()).forEach(([key, val]) => { params.append(key, val); });

            if (method === 'POST' && !params.has('csrf_token') && !params.has('__token')) {
                const globalToken = (document.querySelector('meta[name="csrf-token"]') || {}).content || (document.querySelector('input[name="csrf_token"]') || {}).value;
                if (globalToken) params.append('csrf_token', globalToken);
            }

            if (method === 'POST') {
                return await fetchPage(url, { method: 'POST', body: params.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            } else {
                return await fetchPage(`${url}?${params.toString()}`);
            }
        }
        return null;
    }

    //==================================================================
    // 📊 ODCZYT STATYSTYK
    //==================================================================
    function getStats(doc = document) {
        const goldDiv = doc.querySelector("div.gold");
        if (!goldDiv) return null;
        const text = goldDiv.innerHTML.replace(/&nbsp;/g, ' ');
        const parseNum = (str) => parseInt(str.replace(/[^\d]/g, ''), 10);
        const bloodElem = doc.getElementById("blood-essen-balance");
        const levelElem = doc.querySelector("img[alt='Poziom']");
        let level = 1;
        if (levelElem && levelElem.nextSibling) { level = parseInt(levelElem.nextSibling.textContent.replace(/[^\d]/g, ''), 10) || 1; }

        return {
            gold: parseNum((text.match(/([\d\s.,]+)\s*<img[^>]*alt="Złoto"/i) || [])[1] || "0"),
            currentHP: parseNum((text.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)\s*<img[^>]*alt="Zdrowie"/i) || [])[1] || "0"),
            maxHP: parseNum((text.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)\s*<img[^>]*alt="Zdrowie"/i) || [])[2] || "0"),
            currentAP: parseNum((text.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)\s*<img[^>]*alt="Punkty Akcji"/i) || [])[1] || "0"),
            maxAP: parseNum((text.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)\s*<img[^>]*alt="Punkty Akcji"/i) || [])[2] || "0"),
            blood: bloodElem ? parseNum(bloodElem.textContent) : 0,
            level: level
        };
    }

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    function getRandomDelay() {
        const speed = localStorage.getItem('botCfg_ClickDelay') || 'normal';
        let min = 200, max = 800;
        if (speed === 'fast') { min = 100; max = 400; }
        else if (speed === 'normal') { min = 200; max = 800; }
        else if (speed === 'human') { min = 500; max = 1500; }
        else if (speed === 'safe') { min = 1000; max = 3000; }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function parseTimeToMs(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 3) return (parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10)) * 1000;
        else if (parts.length === 2) return (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)) * 1000;
        return 10 * 60 * 1000;
    }

    //==================================================================
    // 🩸 MODUŁY W TLE
    //==================================================================

    async function backgroundUseItem(profileDoc, itemName, storageCooldown, storageNeedBuy) {
        const itemContainer = profileDoc.getElementById("items");
        if (!itemContainer) return false;

        const allItemNames = Array.from(itemContainer.querySelectorAll("strong"));
        const itemRowStrong = allItemNames.find(el => el.textContent.toLowerCase().includes(itemName.toLowerCase().trim()));

        if (itemRowStrong) {
            const itemRow = itemRowStrong.closest("tr") || itemRowStrong.closest("div.item-form") || itemRowStrong.parentElement.parentElement;
            const useButton = itemRow ? Array.from(itemRow.querySelectorAll("a, button, input")).find(btn => {
                const href = btn.getAttribute('href') || '';
                return href.includes('/profile/useItem/') || (btn.value && btn.value.includes('Użyj'));
            }) : null;

            if (useButton) {
                logToGUI(`🩸 Piję: ${itemName}...`, "#00ffcc");
                localStorage.removeItem(storageNeedBuy);
                localStorage.setItem(storageCooldown, (Date.now() - potionScriptCooldown).toString());
                await wait(getRandomDelay());
                await submitBackgroundFormOrLink(useButton, profileLink);
                return true;
            } else {
                const cooldownSpan = itemRow.querySelector('.countdown_amount');
                let waitTimeMs = 10 * 60 * 1000;
                if (cooldownSpan) {
                    waitTimeMs = parseTimeToMs(cooldownSpan.textContent.trim());
                    logToGUI(`⏳ ${itemName} ładuje się (${cooldownSpan.textContent.trim()}).`, "#aaaaaa");
                }
                localStorage.setItem(storageCooldown, (Date.now() + waitTimeMs + 5000 - potionScriptCooldown).toString());
                return false;
            }
        } else {
             if (localStorage.getItem('botCfg_PotionAutoBuy') === 'true') {
                 if (Date.now() - parseInt(localStorage.getItem('bot_lastBuy_' + storageNeedBuy) || '0', 10) < 10 * 60 * 1000) {
                     localStorage.setItem(storageCooldown, (Date.now() - potionScriptCooldown + (10 * 60 * 1000)).toString());
                     return false;
                 }
                 logToGUI(`🛒 Brak ${itemName} - wpisuję na listę zakupów.`, "#ffaa00");
                 localStorage.setItem(storageNeedBuy, 'true');
             } else {
                 localStorage.setItem(storageCooldown, (Date.now() - potionScriptCooldown + (10 * 60 * 1000)).toString());
             }
             return false;
        }
    }

    async function backgroundBuyItem(itemName, storageNeedBuy) {
        logToGUI(`🛒 Rynek: Kupuję ${itemName}...`, "#ffffaa");
        const doc = await fetchPage(marketLink);
        if (!doc) return false;

        localStorage.removeItem(storageNeedBuy);
        const itemHeaders = Array.from(doc.querySelectorAll("strong"));
        const targetHeader = itemHeaders.find(el => el.textContent.trim().toLowerCase().includes(itemName.toLowerCase().trim()));

        if (targetHeader) {
            let itemContainer = targetHeader.closest("form") || targetHeader.closest("tr") || targetHeader.closest("div.item-form") || targetHeader.parentElement.parentElement.parentElement;

            if (itemContainer) {
                const buyButton = Array.from(itemContainer.querySelectorAll("a, button, input")).find(btn => (btn.textContent || btn.value || "").trim().toLowerCase().includes("kup"));

                if (buyButton) {
                    await wait(getRandomDelay());
                    logToGUI(`🛒 Przetwarzam transakcję...`, "#aaaaaa");

                    let resultDoc = await submitBackgroundFormOrLink(buyButton, marketLink);
                    if (!resultDoc) {
                        const directBuyLink = itemContainer.innerHTML.match(/['"]([^'"]+\/buy\/[^'"]+\?__token=[a-f0-9]+)['"]/i);
                        if (directBuyLink) resultDoc = await fetchPage(resolveUrl(directBuyLink[1]));
                    }

                    if (resultDoc) {
                        logToGUI(`✅ Zakupiono: ${itemName}`, "#00ff00");
                        localStorage.setItem('bot_lastBuy_' + storageNeedBuy, Date.now().toString());
                        const cdKey = storageNeedBuy === 'needsLifePotion' ? 'lastLifePotionUse' : 'lastEnergyPotionUse';
                        localStorage.setItem(cdKey, (Date.now() - potionScriptCooldown).toString());
                        return true;
                    }
                }
            }
        }

        logToGUI(`❌ Błąd zakupu ${itemName}. (Blokada 10 min)`, "#ff3333");
        localStorage.setItem(storageNeedBuy === 'needsLifePotion' ? 'lastLifePotionUse' : 'lastEnergyPotionUse', (Date.now() - potionScriptCooldown + (10 * 60 * 1000)).toString());
        return false;
    }

    async function backgroundChurchHeal() {
        const doc = await fetchPage(churchLink);
        if (!doc) return false;

        const docText = doc.body ? doc.body.textContent.replace(/\s+/g, ' ') : "";
        const maxAp = parseInt(localStorage.getItem('botCfg_ChurchApMax') || '10', 10);
        const apMatch = docText.match(/za\s*(\d+)\s*PA/i);
        const apCost = apMatch ? parseInt(apMatch[1], 10) : 0;

        const healButton = doc.querySelector('input[name="heal"][value="Uzdrowienie"]');

        if (docText.includes("100% maksymalnego zdrowia") && healButton) {
            let waitTimeMs = 121 * 60 * 1000;
            const timeMatch = docText.match(/odczeka[ćc]\s*(\d{2}:\d{2}:\d{2})/i);

            if (apCost <= maxAp && apCost > 0) {
                if (timeMatch) waitTimeMs = parseTimeToMs(timeMatch[1]) + 5000;

                logToGUI(`⛪ Leczę się w kościele za ${apCost} PA!`, "#00ff00");
                localStorage.setItem('nextChurchUse', (Date.now() + waitTimeMs).toString());

                await wait(getRandomDelay());
                await submitBackgroundFormOrLink(healButton, churchLink);
                return true;
            } else {
                logToGUI(`⛪ Kościół zignorowany (${apCost} PA > limit ${maxAp} PA).`, "#ffaa00");
                if (timeMatch && !docText.includes("odczekać 00:00:00")) waitTimeMs = parseTimeToMs(timeMatch[1]) + 5000;
                else waitTimeMs = 15 * 60 * 1000;

                localStorage.setItem('nextChurchUse', (Date.now() + waitTimeMs).toString());
                return false;
            }
        }

        localStorage.setItem('nextChurchUse', (Date.now() + 15 * 60 * 1000).toString());
        return false;
    }

    async function backgroundAttributesUpgrade(profileDoc, stats) {
        const savedAttrs = (localStorage.getItem('botCfg_AttrList') || '').split(',').filter(Boolean);
        if (savedAttrs.length === 0) return false;

        const attrRows = profileDoc.querySelectorAll("#skills_tab table tr");
        for (let row of Array.from(attrRows)) {
            const labelTd = row.querySelector("td:first-child");
            if (!labelTd) continue;

            const attrName = labelTd.textContent.replace(':', '').trim();
            if (!savedAttrs.includes(attrName)) continue;

            const costMatch = row.textContent.match(/kosztuje:\s*([\d.]+)/i);
            if (costMatch) {
                const cost = parseInt(costMatch[1].replace(/\./g, ''), 10);
                const plusBtnLink = row.querySelector("a[href*='/profile/training/']");
                if (plusBtnLink && stats.gold >= cost) {
                    logToGUI(`💪 Ulepszam '${attrName}' za ${cost} złota!`, "#ffff00");
                    await wait(getRandomDelay());
                    await submitBackgroundFormOrLink(plusBtnLink, profileLink);
                    return true;
                }
            }
        }
        localStorage.setItem('bot_NextAttrCheck', (Date.now() + 5 * 60 * 1000).toString());
        return false;
    }

    async function backgroundTraining(stats) {
        const unitId = localStorage.getItem('botCfg_TrainUnit') || '1';
        const costPerUnit = unitCosts[unitId] || 10;

        if (stats.blood < costPerUnit) return false;

        const doc = await fetchPage(trainLink);
        if (!doc) return false;

        const amountToBuy = (stats.blood >= costPerUnit * 10) ? 10 : 1;
        const btnId = `recruits-${unitId}-${amountToBuy}`;
        const trainBtn = doc.getElementById(btnId);

        if (trainBtn && !trainBtn.classList.contains('disabled')) {
            logToGUI(`🦇 Jama Lęgowa: Kupuję ${amountToBuy} wojowników (id: ${unitId})...`, "#ff5555");
            await wait(getRandomDelay());

            try {
                await new Promise((resolve, reject) => {
                    window.$.ajax({
                        type: "POST",
                        url: "/nourishing/recruits",
                        data: { 'unit_id': unitId, 'amount': amountToBuy },
                        dataType: "json",
                        success: function(response) {
                            if (response && response.success) resolve(true);
                            else reject();
                        },
                        error: function() {
                            reject();
                        }
                    });
                });

                logToGUI(`✅ Zakupiono wojsko pomyślnie!`, "#00ff00");
                await wait(2000);
                return true;
            } catch(e) {
                logToGUI(`❌ Błąd zakupu w Jamie Lęgowej.`, "#ff0000");
            }
        }

        return false;
    }

    async function backgroundGraveyard() {
        const doc = await fetchPage(graveyardLink);
        if (!doc) return false;

        const docText = doc.body ? doc.body.textContent : "";

        const isAdventureBlock = docText.includes('zakończyć przygodę');
        if (isAdventureBlock) {
            logToGUI(`⚠️ Cmentarz niedostępny. Wracam dokończyć aktywną przygodę...`, "#ffaa55");
            return false;
        }

        const workSelect = doc.querySelector('select[name="workDuration"]');
        const submitBtn = doc.querySelector('input[name="dowork"]');

        if (workSelect && submitBtn) {
            const workTimeValue = localStorage.getItem('botCfg_GraveyardTime') || '1';
            workSelect.value = workTimeValue;
            logToGUI(`🪦 Idę pracować na cmentarz...`, "#aaffaa");
            await wait(getRandomDelay());
            await submitBackgroundFormOrLink(submitBtn, graveyardLink);
            return true;
        }

        const isAlreadyWorking = doc.querySelector('.countdown_amount') || docText.includes('pracujesz');
        if (isAlreadyWorking) {
            return true;
        }

        return false;
    }

    async function backgroundClanWar() {
        const doc = await fetchPage(clanLink);
        if (!doc) return false;
        const joinBtn = doc.querySelector('input.join-now[type="submit"]');
        if (joinBtn) {
            logToGUI(`🛡️ Meldunek na Wojnę Klanową zgłoszony!`, "#ffaa00");
            localStorage.setItem('nextClanWar', (Date.now() + clanWarCooldown).toString());
            await wait(getRandomDelay());
            await submitBackgroundFormOrLink(joinBtn, clanLink);
            return true;
        }
        localStorage.setItem('nextClanWar', (Date.now() + clanWarCooldown).toString());
        return false;
    }

    async function backgroundGrotte() {
        const doc = await fetchPage(grotteLink);
        if (!doc) return false;

        const continueBtn = Array.from(doc.querySelectorAll("a.btn")).find(el => el.textContent.trim().toLowerCase().includes('kontynuuj'));
        if (continueBtn) {
            logToGUI(`🦇 Grota: Kontynuuję walkę z demonem!`, "#ff55ff");
            await wait(getRandomDelay());
            await submitBackgroundFormOrLink(continueBtn, grotteLink);
            return true;
        }

        const diff = localStorage.getItem('botCfg_GrotteDiff') || 'Łatwe';
        const attackBtn = doc.querySelector(`input[type="submit"][name="difficulty"][value="${diff}"]`);
        if (attackBtn) {
            logToGUI(`🦇 Grota: Atakuję demona (${diff})!`, "#ff55ff");
            await wait(getRandomDelay());
            await submitBackgroundFormOrLink(attackBtn, grotteLink);
            return true;
        }
        return false;
    }

    async function backgroundHunting(stats) {
        const doc = await fetchPage(huntLink);
        if (!doc) return false;

        async function checkAndExtractSphere(targetDoc) {
            const extractBtn = targetDoc.getElementById("extractBloodBtn");
            if (extractBtn && !extractBtn.disabled && !extractBtn.classList.contains('extractBloodDisabled')) {
                const rankContainer = targetDoc.querySelector(".rank-container");
                const foundRankMatch = rankContainer ? rankContainer.textContent.match(/([SABCDEF])/i) : null;
                const foundRank = foundRankMatch ? foundRankMatch[1].toUpperCase() : 'Nieznana';

                const allowedRanks = (localStorage.getItem('botCfg_HuntRanks') || 'S,A,B,C,D,E,F').split(',');

                if (foundRank === 'Nieznana' || allowedRanks.includes(foundRank)) {
                    const huntId = extractBtn.getAttribute('data-hunt-id');
                    if (huntId) {
                        logToGUI(`🔮 Odbieram Sferę (Ranga: ${foundRank})...`, "#cc88ff");
                        await wait(1000);

                        const form = extractBtn.closest('form');
                        if (form) {
                            form.setAttribute('action', '/slot/extract');
                            form.setAttribute('method', 'POST');
                            extractBtn.name = "human_hunt_id";
                            extractBtn.value = huntId;

                            const result = await submitBackgroundFormOrLink(extractBtn, huntLink);
                            if (result) {
                                logToGUI(`✅ Sfera bezpiecznie schowana!`, "#00ff00");
                            } else {
                                logToGUI(`❌ Odbiór sfery odrzucony przez serwer.`, "#ff0000");
                            }
                            return true;
                        }
                    }
                } else {
                    if (Math.random() < 0.2) logToGUI(`⏳ Zignorowano sferę (Ranga: ${foundRank}).`, "#aaaaaa");
                }
            }
            return false;
        }

        if (await checkAndExtractSphere(doc)) return true;

        const allSlots = Array.from(doc.querySelectorAll(".slots .slot"));
        let activeTimersCount = 0, minTimeSeconds = Infinity;
        allSlots.forEach(slot => {
            const timerSpan = slot.querySelector('span[data-remaining]');
            if (timerSpan) {
                const rem = parseInt(timerSpan.getAttribute('data-remaining') || '0', 10);
                if (!isNaN(rem) && rem > 0) { activeTimersCount++; if (rem < minTimeSeconds) minTimeSeconds = rem; }
            }
        });

        const areAllSlotsBusy = activeTimersCount >= (allSlots.length > 0 ? allSlots.length : 3);
        if (areAllSlotsBusy && minTimeSeconds !== Infinity) localStorage.setItem('nextSphereReady', (Date.now() + (minTimeSeconds * 1000) + 5000).toString());
        else if (!areAllSlotsBusy) localStorage.setItem('nextSphereReady', '0');

        if (areAllSlotsBusy && localStorage.getItem('botCfg_HuntSpheresOnly') === 'true') return false;

        const huntLoc = localStorage.getItem('botCfg_HuntLocation') || '1';
        if (stats.currentAP < (huntLoc === '5' ? 2 : 1)) return false;

        const ponownieBtn = Array.from(doc.querySelectorAll("button[type='submit'].btn")).find(el => el.textContent.trim().toLowerCase().includes("ponownie"));
        if (ponownieBtn) {
            logToGUI(`🧛 Ponawiam polowanie na ludzi!`, "#ff4444");

            const parentForm = ponownieBtn.closest('form');
            if (parentForm) {
                const actionUrl = parentForm.getAttribute('action');
                let tokenMatch = actionUrl ? actionUrl.match(/__token=([a-f0-9]{32})/i) : null;

                await wait(getRandomDelay());
                const params = new URLSearchParams(new FormData(parentForm));
                if (tokenMatch) params.append('__token', tokenMatch[1]);

                const resultDoc = await fetchPage(resolveUrl(actionUrl), {
                    method: 'POST',
                    body: params.toString(),
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (resultDoc) await checkAndExtractSphere(resultDoc);
                return true;
            }
        }

        const initBtn = doc.querySelector(`button[onclick*='doHunt(${huntLoc})']`);
        if (initBtn) {
            logToGUI(`🧛 Rozpoczynam polowanie w mieście...`, "#ff4444");
            await wait(getRandomDelay());

            const resultDoc = await fetchPage(resolveUrl(`/robbery/humanhunt/${huntLoc}`));

            if (resultDoc) await checkAndExtractSphere(resultDoc);
            return true;
        }

        return false;
    }

    async function backgroundRuins(ruinConfig) {
        const listUrl = new URL(resolveUrl(`/ancestral/index?page=1&layerId=${ruinConfig.id}`));
        listUrl.searchParams.append('_t', Date.now());
        const doc = await fetchPage(listUrl.toString());
        if (!doc) return false;

        const layerContainer = doc.getElementById(`layerInfoContainer${ruinConfig.id}`);
        if (!layerContainer) return false;

        const text = layerContainer.textContent || "";
        if (text.includes("WARUNKI ODBLOKOWANIA") || text.includes("Dostępne za") || text.includes("Dostępne po")) {
            let waitMs = ruinsCooldown;
            const timeMatch = text.match(/Dost[ęe]pne za\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i);
            if (timeMatch) waitMs = (parseInt(timeMatch[1]||'0',10)*3600 + parseInt(timeMatch[2]||'0',10)*60 + parseInt(timeMatch[3]||'0',10))*1000 + 5000;
            localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + waitMs).toString());
            return false;
        }

        const enterBtn = layerContainer.querySelector('a.layerEntryBtn');
        if (enterBtn) {
            logToGUI(`🏰 Ruiny Pradziejów: Szykuję oddziały (poz. ${ruinConfig.id})...`, "#aaaaff");
            await wait(getRandomDelay());

            const showHref = enterBtn.getAttribute('href');
            if(!showHref) return false;

            const fightDoc = await fetchPage(resolveUrl(showHref));

            if (fightDoc) {
                const csrfMeta = document.querySelector('meta[name="csrf-token"]');
                const csrfInput = document.querySelector('input[name="csrf_token"]');
                const csrfToken = (csrfMeta ? csrfMeta.getAttribute('content') : null) || (csrfInput ? csrfInput.value : null);

                if (!csrfToken) {
                    logToGUI(`❌ Błąd krytyczny: Bot nie potrafi zlokalizować tokena sesji na stronie!`, "#ff0000");
                    localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + 5 * 60 * 1000).toString());
                    return false;
                }

                const slider1 = fightDoc.querySelector('input[name="units[1]"]');
                const slider2 = fightDoc.querySelector('input[name="units[2]"]');
                const max1 = slider1 ? parseInt(slider1.getAttribute('max') || '0', 10) : 0;
                const max2 = slider2 ? parseInt(slider2.getAttribute('max') || '0', 10) : 0;

                if (max1 < ruinConfig.unit1 || max2 < ruinConfig.unit2) {
                    logToGUI(`⚠️ Ruiny (poz. ${ruinConfig.id}): Brak wojska!`, "#ffaaaa");
                    localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + 30 * 60 * 1000).toString());
                    return true;
                }

                const params = new URLSearchParams();
                params.append('units[1]', ruinConfig.unit1.toString());
                params.append('units[2]', ruinConfig.unit2.toString());
                params.append('units[3]', '0');
                params.append('units[4]', '0');
                params.append('layer_id', ruinConfig.id.toString());
                params.append('csrf_token', csrfToken);

                await wait(getRandomDelay());

                const resultDoc = await fetchPage(resolveUrl('/ancestral/fight'), {
                    method: 'POST',
                    body: params.toString(),
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (resultDoc) {
                    const errorDiv = resultDoc.querySelector('.error');
                    if (errorDiv && errorDiv.textContent.trim().length > 0) {
                        logToGUI(`❌ Błąd serwera (poz. ${ruinConfig.id}): ${errorDiv.textContent.trim()}`, "#ff5555");
                        localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + 10 * 60 * 1000).toString());
                    } else {
                        logToGUI(`✅ Ruiny Pradziejów: Udany atak (poz. ${ruinConfig.id})!`, "#00ff00");
                        localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + ruinsCooldown).toString());
                    }
                } else {
                    logToGUI(`✅ Ruiny Pradziejów: Udany atak (poz. ${ruinConfig.id})!`, "#00ff00");
                    localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + ruinsCooldown).toString());
                }
                return true;
            }
        }
        localStorage.setItem(`nextRuin_${ruinConfig.id}`, (Date.now() + 5 * 60 * 1000).toString());
        return false;
    }

    async function backgroundAdventure(stats, cfg) {
        const currentUrl = new URL(adventureLink);
        currentUrl.searchParams.append('_t', Date.now());

        const doc = await fetchPage(currentUrl.toString());
        if (!doc) return false;

        let progressInfo = "";
        const headerEl = doc.querySelector('.wrap-content h2');
        if (headerEl) {
            const headerText = headerEl.textContent.replace(/\s+/g, ' ').trim();
            let cleanText = headerText.replace(/Zakończ przygodę/i, '').trim();
            const progressMatch = cleanText.match(/(.*?)\s*\(Zaliczone etapy:\s*(\d+\s*\/\s*\d+)\)/i);

            if (progressMatch) {
                let adventureName = progressMatch[1].trim();
                let steps = progressMatch[2].replace(/\s/g, '');

                if (adventureName.length > 2) {
                    progressInfo = ` - ${adventureName} (${steps})`;
                } else {
                    progressInfo = ` (${steps})`;
                }
            }
        }

        const tavernBtn = Array.from(doc.querySelectorAll("button")).find(btn => {
            const oc = btn.getAttribute('onclick') || '';
            return oc.includes("location.href='/city/adventure'");
        });

        const startQuestBtn = Array.from(doc.querySelectorAll("a.btn")).find(btn => {
            const href = btn.getAttribute('href') || '';
            return href.includes('/city/adventure/startquest');
        });

        const continueBtn = Array.from(doc.querySelectorAll("a.btn")).find(el => el.textContent.trim().toLowerCase().includes('kontynuuj'));

        const indirectContinueBtn = Array.from(doc.querySelectorAll("a.btn")).find(btn => {
            const href = btn.getAttribute('href') || '';
            return href.includes('/city/adventure/') && !href.includes('startquest') && !href.includes('decision');
        });

        const decisionBtns = Array.from(doc.querySelectorAll("a.btn")).filter(btn => {
            return (btn.getAttribute('href') || '').includes('/city/adventure/decision/');
        });

        const isMidAdventure = continueBtn || indirectContinueBtn || decisionBtns.length > 0;
        const minAp = cfg.doGrave ? 3 : 1;
        if (!isMidAdventure && stats.currentAP < minAp) {
            return false;
        }

        let targetElement = null, actionName = "";

        if (tavernBtn) { targetElement = tavernBtn; actionName = "Wchodzę do Tawerny"; }
        else if (startQuestBtn) { targetElement = startQuestBtn; actionName = "Rozpoczynam nową misję"; }
        else if (continueBtn) { targetElement = continueBtn; actionName = "Kontynuuję wyprawę"; }
        else if (indirectContinueBtn) { targetElement = indirectContinueBtn; actionName = "Idę dalej..."; }
        else if (decisionBtns.length > 0) {
            const strategy = adventureStrategies[localStorage.getItem('botCfg_AdvStrategy') || 'exp_gold'] || adventureStrategies['exp_gold'];
            for (const pref of strategy.priority) {
                const match = decisionBtns.find(b => b.textContent.trim().toLowerCase() === pref.toLowerCase());
                if (match) { targetElement = match; actionName = `Wybieram: [${match.textContent.trim()}]`; break; }
            }
            if (!targetElement) {
                for (const btn of decisionBtns) {
                    const text = btn.textContent.trim();
                    if (!strategy.avoid.some(a => a.toLowerCase() === text.toLowerCase())) { targetElement = btn; actionName = `Wybieram: [${text}]`; break; }
                }
            }
            if (!targetElement) { targetElement = decisionBtns[0]; actionName = `Brak wyboru: [${decisionBtns[0].textContent.trim()}]`; }
        }

        if (targetElement) {
            logToGUI(`🌲 Las: ${actionName}${progressInfo}`, "#aaffaa");
            await wait(getRandomDelay());
            await submitBackgroundFormOrLink(targetElement, adventureLink);
            return true;
        }
        return false;
    }

    //==================================================================
    // ⚙️ GŁÓWNA PĘTLA BOTA (DYSTRYBUTOR ZADAŃ)
    //==================================================================
    let isWorking = false;

    async function startBotLoop() {
        createBotPanel();

        if (localStorage.getItem('botCfg_Main') !== 'true' || isWorking) { setTimeout(startBotLoop, 1000); return; }
        isWorking = true;

        try {
            const profileDoc = await fetchPage(profileLink);
            if (profileDoc) {
                const stats = getStats(profileDoc);
                if (stats) {
                    const cfg = {
                        doPotLife: localStorage.getItem('botCfg_PotionLife') !== 'false',
                        doPotEnergy: localStorage.getItem('botCfg_PotionEnergy') === 'true',
                        doAutoBuy: localStorage.getItem('botCfg_PotionAutoBuy') === 'true',
                        potLifeName: localStorage.getItem('botCfg_PotionType') || 'Mała Uzdrawiająca Mikstura',
                        doChurch: localStorage.getItem('botCfg_Church') !== 'false',
                        doClan: localStorage.getItem('botCfg_Clan') !== 'false',
                        doRuins: localStorage.getItem('botCfg_Ruins') !== 'false',
                        doHunt: localStorage.getItem('botCfg_Hunt') === 'true',
                        doTrain: localStorage.getItem('botCfg_Train') === 'true',
                        doAttrs: localStorage.getItem('botCfg_Attributes') === 'true',
                        doAdv: localStorage.getItem('botCfg_Adventure') === 'true',
                        doGrotte: localStorage.getItem('botCfg_Grotte') === 'true',
                        doGrave: localStorage.getItem('botCfg_Graveyard') !== 'false',
                        safeHp: parseFloat(localStorage.getItem('botCfg_SafeHp') || '0.50'),
                        potionHp: parseFloat(localStorage.getItem('botCfg_PotionHp') || '0.80'),
                        churchHp: parseFloat(localStorage.getItem('botCfg_ChurchHp') || '0.15')
                    };

                    const selectEl = document.getElementById('bot-potion-type');
                    if (selectEl) {
                        Array.from(selectEl.options).forEach(opt => {
                            if (opt.value === 'Średnia Uzdrawiająca Mikstura') opt.disabled = stats.level < 3;
                            if (opt.value === 'Zupa Życia') opt.disabled = stats.level < 75;
                        });
                        if (selectEl.options[selectEl.selectedIndex].disabled) {
                            selectEl.value = 'Mała Uzdrawiająca Mikstura';
                            localStorage.setItem('botCfg_PotionType', 'Mała Uzdrawiająca Mikstura');
                            cfg.potLifeName = 'Mała Uzdrawiająca Mikstura';
                        }
                    }

                    // 1. ZAKUPY W TLE
                    if (cfg.doAutoBuy && cfg.doPotLife && localStorage.getItem('needsLifePotion') === 'true') { if(await backgroundBuyItem(cfg.potLifeName, 'needsLifePotion')) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; } }
                    if (cfg.doAutoBuy && cfg.doPotEnergy && localStorage.getItem('needsEnergyPotion') === 'true') { if(await backgroundBuyItem(potionEnergyName, 'needsEnergyPotion')) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; } }

                    // 2. LECZENIE W TLE (HP i AP)
                    if (stats.currentHP < (stats.maxHP * cfg.churchHp)) {
                        if (cfg.doPotLife && (Date.now() - parseInt(localStorage.getItem('lastLifePotionUse') || '0', 10) > potionScriptCooldown)) {
                            if (await backgroundUseItem(profileDoc, cfg.potLifeName, 'lastLifePotionUse', 'needsLifePotion')) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                        }
                        if (cfg.doChurch && (Date.now() > parseInt(localStorage.getItem('nextChurchUse') || '0', 10))) {
                            if (await backgroundChurchHeal()) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                        }
                    }
                    if (cfg.doPotLife && stats.currentHP < (stats.maxHP * cfg.potionHp)) {
                        if (Date.now() - parseInt(localStorage.getItem('lastLifePotionUse') || '0', 10) > potionScriptCooldown) {
                            if (await backgroundUseItem(profileDoc, cfg.potLifeName, 'lastLifePotionUse', 'needsLifePotion')) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                        }
                    }
                    if (cfg.doPotEnergy && stats.currentAP <= (stats.maxAP - 20)) {
                        if (Date.now() - parseInt(localStorage.getItem('lastEnergyPotionUse') || '0', 10) > potionScriptCooldown) {
                            if (await backgroundUseItem(profileDoc, potionEnergyName, 'lastEnergyPotionUse', 'needsEnergyPotion')) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                        }
                    }

                    // ZABEZPIECZENIE HP
                    if (stats.currentHP < (stats.maxHP * cfg.safeHp)) {
                        if (Math.random() < 0.2) logToGUI(`🛑 Zbyt mało HP by walczyć (${stats.currentHP}/${stats.maxHP}). Czekam na regenerację.`, "#ffaaaa");
                        isWorking = false; setTimeout(startBotLoop, 10000); return;
                    }

                    // 3. WOJNY I ROZWÓJ W TLE
                    if (cfg.doClan && Date.now() > parseInt(localStorage.getItem('nextClanWar') || '0', 10)) {
                        if (await backgroundClanWar()) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                    }
                    if (cfg.doAttrs && Date.now() > parseInt(localStorage.getItem('bot_NextAttrCheck') || '0', 10)) {
                        if (await backgroundAttributesUpgrade(profileDoc, stats)) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                    }
                    if (cfg.doTrain && stats.blood >= 10) {
                        if (await backgroundTraining(stats)) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                    }

                    // 4. RUINY W TLE
                    if (cfg.doRuins) {
                        const activeRuins = (localStorage.getItem('botCfg_RuinsLevels') || '1,2,3,4,5').split(',').map(Number);
                        for (let i = 0; i < activeRuins.length; i++) {
                            const rId = activeRuins[i];
                            const ruin = ruinsLevels.find(r => r.id === rId);
                            if (ruin && Date.now() > parseInt(localStorage.getItem(`nextRuin_${ruin.id}`) || '0', 10)) {
                                if (await backgroundRuins(ruin)) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                            }
                        }
                    }

                    // 5. WALKI ZUŻYWAJĄCE PA W TLE
                    if (stats.currentAP > 0) {
                        if (cfg.doHunt) {
                            const nextSphereTime = parseInt(localStorage.getItem('nextSphereReady') || '0', 10);
                            const huntSpheresOnly = localStorage.getItem('botCfg_HuntSpheresOnly') === 'true';
                            if (!huntSpheresOnly || Date.now() >= nextSphereTime) {
                                if (await backgroundHunting(stats)) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                            }
                        }
                        if (cfg.doGrotte && await backgroundGrotte()) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                    }

                    if (cfg.doAdv) {
                        if (await backgroundAdventure(stats, cfg)) { isWorking = false; setTimeout(startBotLoop, getRandomDelay()); return; }
                    }

                    // 6. PRACA (CMENTARZ) W TLE
                    let shouldWork = false;

                    if (cfg.doGrave) {
                        if (stats.currentAP < 3) {
                            shouldWork = true;
                        } else if (!cfg.doAdv && !cfg.doGrotte) {
                            shouldWork = true;

                            if (cfg.doHunt) {
                                const huntLoc = localStorage.getItem('botCfg_HuntLocation') || '1';
                                const apCost = huntLoc === '5' ? 2 : 1;

                                const huntSpheresOnly = localStorage.getItem('botCfg_HuntSpheresOnly') === 'true';
                                const isSphereReady = Date.now() >= parseInt(localStorage.getItem('nextSphereReady') || '0', 10);

                                if (stats.currentAP >= apCost && (!huntSpheresOnly || isSphereReady)) {
                                    shouldWork = false;
                                }
                            }
                        }
                    }

                    if (shouldWork) {
                        if (await backgroundGraveyard()) {
                            isWorking = false;
                            setTimeout(startBotLoop, 300000);
                            return;
                        }
                    } else if (stats.currentAP < 1 && !cfg.doGrave) {
                        if (Math.random() < 0.1) logToGUI("💤 Brak Punktów Akcji (PA).", "#ff5555");
                    }
                }
            }
        } catch (e) {
            logToGUI("❌ Błąd w głównej pętli AJAX.", "#ff0000");
            console.error(e);
        }

        isWorking = false;
        setTimeout(startBotLoop, getRandomDelay());
    }

    setTimeout(startBotLoop, 500);

})();
