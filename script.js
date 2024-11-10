function converter() {
    // Obtém o valor em reais do input
    let real = parseFloat(document.getElementById('real').value);

    if (isNaN(real)) {
        document.getElementById('resultado').innerHTML = "Por favor, insira um valor válido.";
        return;
    }

    // Taxas de câmbio (essas taxas variam de acordo com a cotação)
    const taxaDolar = 5.74;
    const taxaEuro = 6.14;

    // Calcula o valor em dólares e euros
    let dolar = real / taxaDolar;
    let euro = real / taxaEuro;

    // Exibe o resultado formatado
    document.getElementById('resultado').innerHTML = `
        Com R$${real.toFixed(2)} você pode comprar:<br>
        US$${dolar.toFixed(2)}<br>
        €${euro.toFixed(2)}
    `;
}
