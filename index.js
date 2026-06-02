const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('QR GERADO');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTENTICADO');
});

client.on('ready', () => {
    console.log('BOT CONECTADO!');
});

const menu = {
    "1": "Nosso horário de atendimento é das 08:00 às 18:00.",
    "2": "Estamos localizados na Rua Exemplo, 123.",
    "3": "Um atendente entrará em contato em breve.",
    "4": "Aceitamos PIX, cartão e dinheiro."
};

function gerarMenu() {

    return `Olá! 👋

Escolha uma opção:

1 - Horário de atendimento
2 - Endereço
3 - Falar com suporte
4 - Formas de pagamento`;
}

const clientesAguardando = {};
const clientesAtendidos = {};

client.on('message', async message => {

    if (message.fromMe) return;

    const numero = message.from;

    try {

        // Tratamento de áudio
        if (message.hasMedia) {

            const media = await message.downloadMedia();

            if (media && media.mimetype.startsWith('audio')) {

                await message.reply(
`Recebemos sua mensagem de áudio. 🎤

Em breve um atendente ouvirá e responderá sua solicitação.

Caso prefira agilizar seu atendimento, você também pode selecionar uma das opções abaixo:

${gerarMenu()}`
                );

                return;
            }
        }

        const texto = (message.body || "").trim().toLowerCase();

        // MENU
        if (texto === "menu") {

            clientesAguardando[numero] = false;

            await message.reply(gerarMenu());

            return;
        }

        // Primeira mensagem do cliente
        if (!clientesAtendidos[numero]) {

            clientesAtendidos[numero] = true;

            await message.reply(gerarMenu());

            return;
        }

        // Opções do menu
        if (menu[texto]) {

            await message.reply(menu[texto]);

            return;
        }

        // Já recebeu aviso
        if (clientesAguardando[numero]) {
            return;
        }

        await message.reply(
`Um momento por favor.

Nossa equipe retornará o mais breve possível.

Caso deseje visualizar novamente as opções de atendimento, digite *MENU*.`
        );

        clientesAguardando[numero] = true;

    } catch (erro) {

        console.error('Erro:', erro);

    }

});

client.initialize();
