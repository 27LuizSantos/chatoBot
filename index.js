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
        // --- NOVA VERIFICAÇÃO PARA SEGUNDA MENSAGEM ---
        // Se for a primeira interação do bot com esse número nesta sessão
        if (!clientesAtendidos[numero]) {
            const chat = await message.getChat();
            const mensagens = await chat.fetchMessages({ limit: 2 });
            
            // Se houver mais de uma mensagem no histórico recente
            if (mensagens.length > 1) {
                // Pega a mensagem anterior à atual
                const mensagemAnterior = mensagens[mensagens.length - 2];
                
                // Se a mensagem anterior foi enviada por VOCÊ, significa que VOCÊ iniciou a conversa.
                // Então, o bot marca o cliente como já atendido manualmente e não envia o menu.
                if (mensagemAnterior.fromMe) {
                    clientesAtendidos[numero] = true;
                    clientesAguardando[numero] = true; // Evita que envie a mensagem de "Um momento por favor"
                    console.log(`Conversa iniciada manualmente com ${numero}. Bot silenciado.`);
                    return; 
                }
            }
        }
        // ---------------------------------------------

        // Tratamento de áudio
        if (message.hasMedia) {
            const media = await message.downloadMedia();

            if (media && media.mimetype.startsWith('audio')) {
                console.log("Áudio recebido.");
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
            console.log("Enviando menu...");
            clientesAguardando[numero] = false;
            clientesAtendidos[numero] = true; // Garante que está marcado como atendido
            
            console.log("PASSOU AQUI - OPCAO");
            await message.reply(gerarMenu());

            return;
        }

        // Primeira mensagem de fato iniciada pelo cliente
        if (!clientesAtendidos[numero]) {
            clientesAtendidos[numero] = true;
            await message.reply(gerarMenu());

            return;
        }

        // Opções do menu
        if (menu[texto]) {
            console.log("PASSOU AQUI- OPCAO");
            await message.reply(menu[texto]);

            return;
        }

        // Já recebeu aviso
        if (clientesAguardando[numero]) {
            return;
        }

        console.log("PASSOU AQUI EM AVISOS...");
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
