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

client.on('message', async message => {

    const texto = message.body.trim().toLowerCase();

    console.log('Mensagem recebida:', message.body);

    // Opção 1
    if (texto === '1') {
        await message.reply(
            'Nosso horário de atendimento é das 08:00 às 18:00.'
        );
        return;
    }

    // Opção 2
    if (texto === '2') {
        await message.reply(
            'Estamos localizados na Rua Exemplo, 123.'
        );
        return;
    }

    // Opção 3
    if (texto === '3') {
        await message.reply(
            'Um atendente entrará em contato em breve.'
        );
        return;
    }

    // Qualquer outra mensagem recebe o menu
    await message.reply(
`Olá! 👋

Seja bem-vindo ao nosso atendimento.

Escolha uma opção:

1 - Horário de atendimento
2 - Endereço
3 - Falar com suporte`
    );

});

client.initialize();