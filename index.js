const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bot online!");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const client = new Client({

    authStrategy: new LocalAuth(),

    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    }

});

client.on("qr", (qr) => {
    console.log("ESCANEIE O QR CODE:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("WhatsApp conectado!");
});

client.on("message", async (message) => {

    try {

        // Ignora mensagens do próprio bot
        if (message.fromMe) return;

        // Ignora grupos
        if (message.from.includes("@g.us")) return;

        // Ignora mensagens vazias
        if (!message.body) return;

        const texto = message.body.toLowerCase().trim();

        console.log("Mensagem recebida:", texto);

        // Delay humano
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (texto === "1") {

            await message.reply(
`📚 AULAS E HORÁRIOS

Segunda à Sexta
08h às 18h`
            );

        } else if (texto === "2") {

            await message.reply(
`💰 PAGAMENTOS

Aceitamos:
- PIX
- Cartão
- Dinheiro`
            );

        } else if (texto === "3") {

            await message.reply(
`🏆 CATEGORIAS

- Infantil
- Adulto
- Profissional`
            );

        } else {

            await message.reply(
`Olá! Seja bem-vindo ao contato da empresa.

Escolha uma opção:

1 - Aulas e horários
2 - Pagamentos
3 - Categorias`
            );

        }

    } catch (erro) {

        console.log("ERRO:", erro);

    }

});






client.initialize();