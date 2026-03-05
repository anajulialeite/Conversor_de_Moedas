(function () {
    'use strict';

    // API do Banco Central do Brasil via AwesomeAPI
    const API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';
    const FALLBACK_RATES = { USD: 5.23, EUR: 6.08 };

    const inputBRL = document.getElementById('real');
    const inputUSD = document.getElementById('input-usd');
    const inputEUR = document.getElementById('input-eur');
    const taxaUSD = document.getElementById('taxa-usd');
    const taxaEUR = document.getElementById('taxa-eur');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const lastUpdate = document.getElementById('last-update');

    let rates = { USD: null, EUR: null };

    const fmtBRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtRate = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    // Converte string formatada em pt-BR (ex: "1.234,56") para número
    function parseInput(str) {
        if (!str) return 0;
        const clean = str.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }

    function formatValue(num) {
        return fmtBRL.format(num);
    }

    // Formata o campo enquanto o usuário digita, preservando a posição do cursor
    function formatFieldInput(inputEl) {
        const raw = inputEl.value;

        if (!raw || raw === '') return;

        // Mantém apenas dígitos e vírgula
        let clean = raw.replace(/[^\d,]/g, '');

        // Permite no máximo uma vírgula
        const parts = clean.split(',');
        if (parts.length > 2) {
            clean = parts[0] + ',' + parts.slice(1).join('');
        }

        // Limita a 2 casas decimais
        if (parts.length === 2 && parts[1].length > 2) {
            clean = parts[0] + ',' + parts[1].substring(0, 2);
        }

        // Formata a parte inteira com separador de milhares
        if (parts[0].length > 0) {
            const intPart = parts[0].replace(/^0+(?=\d)/, '');
            const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            clean = parts.length === 2 ? formatted + ',' + parts[1].substring(0, 2) : formatted;
        }

        // Atualiza sem perder a posição do cursor
        const cursorPos = inputEl.selectionStart;
        const prevLen = inputEl.value.length;
        inputEl.value = clean;
        const newLen = inputEl.value.length;
        const newCursor = cursorPos + (newLen - prevLen);
        inputEl.setSelectionRange(newCursor, newCursor);
    }

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

    // Busca cotações em tempo real via AwesomeAPI (fonte: Banco Central do Brasil)
    async function fetchRates() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // Usa a cotação comercial de compra (bid)
            rates.USD = parseFloat(data.USDBRL.bid);
            rates.EUR = parseFloat(data.EURBRL.bid);

            taxaUSD.textContent = `1 USD = R$ ${fmtRate.format(rates.USD)}`;
            taxaEUR.textContent = `1 EUR = R$ ${fmtRate.format(rates.EUR)}`;

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

        // Recalcula caso o usuário já tenha digitado um valor
        if (inputBRL.value) convertFromBRL();
    }

    function setStatus(state, text) {
        statusDot.className = 'status-dot ' + state;
        statusText.textContent = text;
    }

    inputBRL.addEventListener('input', convertFromBRL);
    inputUSD.addEventListener('input', convertFromUSD);
    inputEUR.addEventListener('input', convertFromEUR);

    fetchRates();

    // Atualiza as cotações a cada 5 minutos
    setInterval(fetchRates, 5 * 60 * 1000);
})();
