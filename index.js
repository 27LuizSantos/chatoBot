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

// === FUNÇÃO AUXILIAR DE DELAY ===
// Faz o bot esperar o tempo definido (em milissegundos) antes de ir para a próxima linha
const delay = ms => new Promise(res => setTimeout(res, ms));

const clientesAguardando = {};
const clientesAtendidos = {};

client.on('message', async message => {
    // REGRA DE OURO: Ignora completamente mensagens enviadas por você ou pelo próprio bot
    if (message.fromMe || message.id.fromMe) return;

    const numero = message.from;

    try {
        // --- VERIFICAÇÃO PARA SEGUNDA MENSAGEM ---
        if (!clientesAtendidos[numero]) {
            const chat = await message.getChat();
            const mensagens = await chat.fetchMessages({ limit: 2 });
            
            if (mensagens.length > 1) {
                const messageAnterior = mensagens[mensagens.length - 2];
                
                if (messageAnterior.fromMe || messageAnterior.id.fromMe) {
                    clientesAtendidos[numero] = true;
                    clientesAguardando[numero] = true; 
                    console.log(`Conversa iniciada manualmente com ${numero}. Bot silenciado.`);
                    return; 
                }
            }
        }
        // ---------------------------------------------

        // --- TRATAMENTO ISOLADO PARA ÁUDIO DO CLIENTE ---
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            
            if (media && media.mimetype.startsWith('audio')) {
                if (clientesAguardando[numero]) {
                    console.log(`Áudio recebido de ${numero}, mas o cliente já está aguardando suporte. Ignorado.`);
                    return;
                }

                console.log("Áudio recebido do cliente. Aplicando delay de 3 segundos...");
                await delay(3000); // Espera 3 segundos simulando audição/digitação
                
                if (!clientesAtendidos[numero]) {
                    clientesAtendidos[numero] = true;
                    await message.reply(`Recebemos sua mensagem de áudio. 🎤\n\nEm breve um atendente ouvirá e responderá sua solicitação.\n\nCaso prefira agilizar seu atendimento, você também pode selecionar uma das opções abaixo:\n\n${gerarMenu()}`);
                } else {
                    await message.reply(`Recebemos sua mensagem de áudio. 🎤\n\nEm breve um atendente ouvirá e responderá sua solicitação.\n\nCaso deseje visualizar novamente as opções de atendimento, digite *MENU*.`);
                }

                clientesAguardando[numero] = true;
                return; 
            }
        }
        // -------------------------------------

        const texto = (message.body || "").trim().toLowerCase();

        // MENU (Quando o cliente digita "menu")
        if (texto === "menu") {
            console.log("Enviando menu... Aplicando delay de 2 segundos...");
            clientesAguardando[numero] = false;
            clientesAtendidos[numero] = true; 
            
            await delay(2000); // Espera 2 segundos
            await message.reply(gerarMenu());
            return;
        }

        // Primeira mensagem de texto do cliente
        if (!clientesAtendidos[numero]) {
            clientesAtendidos[numero] = true;
            
            console.log("Primeira mensagem de texto. Aplicando delay de 3 segundos...");
            await delay(3000); // Espera 3 segundos
            await message.reply(gerarMenu());
            return;
        }

        // Opções do menu (1, 2, 3 ou 4)
        if (menu[texto]) {
            console.log("Opção do menu selecionada. Aplicando delay de 2 segundos...");
            
            await delay(2000); // Espera 2 segundos
            await message.reply(menu[texto]);
            return;
        }

        // Já recebeu aviso de espera (ignora textos repetidos para não fludar)
        if (clientesAguardando[numero]) {
            return;
        }

        // Qualquer outro texto fora do menu (Aviso de encaminhamento para suporte)
        console.log("Texto fora do menu. Aplicando delay de 3 segundos antes do aviso...");
        
        await delay(3000); // Espera 3 segundos
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

// Inicialização do cliente (sempre na última linha)
client.initialize();
