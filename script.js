/* ============================================
   CONVERSOR DE MOEDAS — Logic + API
   ============================================ */

(function () {
    'use strict';

    // --- Config ---
    const API_URL = 'https://open.er-api.com/v6/latest/USD';
    const FALLBACK_RATES = { USD: 5.50, EUR: 6.20 }; // BRL per 1 unit

    // --- DOM refs ---
    const inputReal    = document.getElementById('real');
    const amountUSD    = document.querySelector('#card-usd .card-amount');
    const amountEUR    = document.querySelector('#card-eur .card-amount');
    const taxaUSD      = document.getElementById('taxa-usd');
    const taxaEUR      = document.getElementById('taxa-eur');
    const statusDot    = document.querySelector('.status-dot');
    const statusText   = document.getElementById('status-text');
    const lastUpdate   = document.getElementById('last-update');

    // --- State ---
    let rates = { USD: null, EUR: null }; // BRL per 1 foreign unit

    // --- Formatters ---
    const fmtBRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtRate = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    // --- Fetch live rates ---
    async function fetchRates() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // API returns rates relative to USD.
            // We need BRL cost per 1 USD and per 1 EUR.
            const brlPerUsd = data.rates['BRL'];          // e.g. 5.72
            const eurPerUsd = data.rates['EUR'];           // e.g. 0.92
            const brlPerEur = brlPerUsd / eurPerUsd;       // e.g. 6.22

            rates.USD = brlPerUsd;
            rates.EUR = brlPerEur;

            // Update rate badges
            taxaUSD.textContent = `1 USD = R$ ${fmtRate.format(rates.USD)}`;
            taxaEUR.textContent = `1 EUR = R$ ${fmtRate.format(rates.EUR)}`;

            // Status → online
            setStatus('online', 'Cotações atualizadas');
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

        // Recalculate in case user already typed a value
        converter();
    }

    // --- Convert ---
    function converter() {
        const valor = parseFloat(inputReal.value);

        if (!valor || valor <= 0 || !rates.USD) {
            amountUSD.textContent = '0,00';
            amountEUR.textContent = '0,00';
            return;
        }

        const usd = valor / rates.USD;
        const eur = valor / rates.EUR;

        amountUSD.textContent = fmtBRL.format(usd);
        amountEUR.textContent = fmtBRL.format(eur);
    }

    // --- Status helper ---
    function setStatus(state, text) {
        statusDot.className = 'status-dot ' + state;
        statusText.textContent = text;
    }

    // --- Events ---
    inputReal.addEventListener('input', converter);

    // --- Init ---
    fetchRates();

    // Refresh rates every 5 minutes
    setInterval(fetchRates, 5 * 60 * 1000);
})();
