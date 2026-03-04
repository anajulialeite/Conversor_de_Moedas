/* ============================================
   CONVERSOR DE MOEDAS — Logic + API
   Conversão bidirecional: BRL ⇄ USD | EUR
   ============================================ */

(function () {
    'use strict';

    // --- Config ---
    // AwesomeAPI — fonte: Banco Central do Brasil (BCB)
    const API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';
    const FALLBACK_RATES = { USD: 5.23, EUR: 6.08 }; // BRL per 1 unit (mar/2026)

    // --- DOM refs ---
    const inputBRL = document.getElementById('real');
    const inputUSD = document.getElementById('input-usd');
    const inputEUR = document.getElementById('input-eur');
    const taxaUSD = document.getElementById('taxa-usd');
    const taxaEUR = document.getElementById('taxa-eur');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const lastUpdate = document.getElementById('last-update');

    // --- State ---
    let rates = { USD: null, EUR: null }; // BRL per 1 foreign unit

    // --- Formatters ---
    const fmtBRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtRate = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    // --- Parse formatted input (pt-BR) → number ---
    function parseInput(str) {
        if (!str) return 0;
        const clean = str.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }

    // --- Format a value for display (thousands separator) ---
    function formatValue(num) {
        return fmtBRL.format(num);
    }

    // --- Format an input field while typing (preserves cursor) ---
    function formatFieldInput(inputEl) {
        const raw = inputEl.value;

        if (!raw || raw === '') return;

        // Keep only digits and comma
        let clean = raw.replace(/[^\d,]/g, '');

        // Limit to one comma
        const parts = clean.split(',');
        if (parts.length > 2) {
            clean = parts[0] + ',' + parts.slice(1).join('');
        }

        // Limit decimal places to 2
        if (parts.length === 2 && parts[1].length > 2) {
            clean = parts[0] + ',' + parts[1].substring(0, 2);
        }

        // Format integer part with thousands separator
        if (parts[0].length > 0) {
            const intPart = parts[0].replace(/^0+(?=\d)/, '');
            const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            clean = parts.length === 2 ? formatted + ',' + parts[1].substring(0, 2) : formatted;
        }

        // Update without losing cursor position
        const cursorPos = inputEl.selectionStart;
        const prevLen = inputEl.value.length;
        inputEl.value = clean;
        const newLen = inputEl.value.length;
        const newCursor = cursorPos + (newLen - prevLen);
        inputEl.setSelectionRange(newCursor, newCursor);
    }

    // --- Convert from BRL ---
    function convertFromBRL() {
        formatFieldInput(inputBRL);
        const valor = parseInput(inputBRL.value);

        if (!valor || valor <= 0 || !rates.USD) {
            inputUSD.value = '';
            inputEUR.value = '';
            return;
        }

        inputUSD.value = formatValue(valor / rates.USD);
        inputEUR.value = formatValue(valor / rates.EUR);
    }

    // --- Convert from USD ---
    function convertFromUSD() {
        formatFieldInput(inputUSD);
        const valor = parseInput(inputUSD.value);

        if (!valor || valor <= 0 || !rates.USD) {
            inputBRL.value = '';
            inputEUR.value = '';
            return;
        }

        const brl = valor * rates.USD;
        inputBRL.value = formatValue(brl);
        inputEUR.value = formatValue(brl / rates.EUR);
    }

    // --- Convert from EUR ---
    function convertFromEUR() {
        formatFieldInput(inputEUR);
        const valor = parseInput(inputEUR.value);

        if (!valor || valor <= 0 || !rates.EUR) {
            inputBRL.value = '';
            inputUSD.value = '';
            return;
        }

        const brl = valor * rates.EUR;
        inputBRL.value = formatValue(brl);
        inputUSD.value = formatValue(brl / rates.USD);
    }

    // --- Fetch live rates (Banco Central do Brasil via AwesomeAPI) ---
    async function fetchRates() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // AwesomeAPI retorna cotação comercial de compra (bid)
            rates.USD = parseFloat(data.USDBRL.bid);
            rates.EUR = parseFloat(data.EURBRL.bid);

            // Update rate badges
            taxaUSD.textContent = `1 USD = R$ ${fmtRate.format(rates.USD)}`;
            taxaEUR.textContent = `1 EUR = R$ ${fmtRate.format(rates.EUR)}`;

            // Status → online
            setStatus('online', 'Cotações BCB atualizadas');
            lastUpdate.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        } catch (err) {
            console.warn('Falha ao buscar cotações, usando fallback:', err);
            rates.USD = FALLBACK_RATES.USD;
            rates.EUR = FALLBACK_RATES.EUR;

            taxaUSD.textContent = `1 USD ≈ R$ ${fmtRate.format(rates.USD)} (offline)`;
            taxaEUR.textContent = `1 EUR ≈ R$ ${fmtRate.format(rates.EUR)} (offline)`;

            setStatus('offline', 'Modo offline');
            lastUpdate.textContent = 'Usando cotações estimadas';
        }

        // Recalculate if user already typed a value
        if (inputBRL.value) convertFromBRL();
    }

    // --- Status helper ---
    function setStatus(state, text) {
        statusDot.className = 'status-dot ' + state;
        statusText.textContent = text;
    }

    // --- Events ---
    inputBRL.addEventListener('input', convertFromBRL);
    inputUSD.addEventListener('input', convertFromUSD);
    inputEUR.addEventListener('input', convertFromEUR);

    // --- Init ---
    fetchRates();

    // Refresh rates every 5 minutes
    setInterval(fetchRates, 5 * 60 * 1000);
})();
