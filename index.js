const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');

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

// === ATUALIZAÇÃO NAEL ===
function carregarClientes() {
    try {
        if (!fs.existsSync('clientes.json')) {
            return {};
        }
        const dados = fs.readFileSync('clientes.json', 'utf8');
        return JSON.parse(dados);
    } catch (erro) {
        console.error('Erro ao carregar clientes:', erro);
        return {};
    }
}

function salvarClientes(clientes) {
    console.log("Salvando arquivo em:", __dirname);
    fs.writeFileSync('clientes.json', JSON.stringify(clientes, null, 4));
}

function registrarInteracao(numero, tipo, valor) {
    console.log("REGISTRANDO...", { numero, tipo, valor });
    const clientes = carregarClientes();

    if (!clientes[numero]) {
        clientes[numero] = {
            primeiroContato: new Date().toLocaleString('pt-BR'),
            opcoes: [],
            mensagens: []
        };
    }

    if (tipo === "opcao") {
        if (!clientes[numero].opcoes.includes(valor)) {
            clientes[numero].opcoes.push(valor);
        }
    } else if (tipo === "mensagem") {
        clientes[numero].mensagens.push(valor);

        // Mantém apenas as últimas 10 mensagens
        if (clientes[numero].mensagens.length > 10) {
            clientes[numero].mensagens.shift();
        }
    }

    salvarClientes(clientes);
}

function gerarMenu() {
    return `Olá! 👋\n\nEscolha uma opção:\n\n1 - Horário de atendimento\n2 - Endereço\n3 - Falar com suporte\n4 - Formas de pagamento`;
}

// === FUNÇÃO AUXILIAR DE DELAY ===
const delay = ms => new Promise(res => setTimeout(res, ms));

async function gerarResumo(numero) {
    const nomeCliente = await obterNomeCliente(numero);
    const clientes = carregarClientes();
    const cliente = clientes[numero];

    if (!cliente) {
        return "Nenhuma informação encontrada para este cliente.";
    }

    let resumo = `📋 RESUMO DO ATENDIMENTO\n\n👤 Cliente:\n${nomeCliente}\n\n📞 ID:\n${numero}\n\n📅 Primeiro contato:\n${cliente.primeiroContato}\n\n`;

    if (cliente.opcoes && cliente.opcoes.length > 0) {
        resumo += "📌 Opções selecionadas:\n";
        cliente.opcoes.forEach(opcao => {
            resumo += `• ${opcao}\n`;
        });
        resumo += "\n";
    }

    // CORREÇÃO: Pega o último item do array de mensagens atualizado por você
    if (cliente.mensagens && cliente.mensagens.length > 0) {
        const ultimaMsg = cliente.mensagens[cliente.mensagens.length - 1];
        resumo += `💬 Última mensagem:\n\n${ultimaMsg}`;
    }

    return resumo;
}

const clientesAguardando = {};
const clientesAtendidos = {};

async function obterNomeCliente(numero) {
    try {
        const contato = await client.getContactById(numero);
        return contato.pushname || contato.name || contato.number || numero;
    } catch (erro) {
        console.log("Erro ao obter nome:", erro);
        return numero;
    }
}

// === COMANDO INTERNO DO ATENDENTE ===
client.on('message_create', async message => {
    if (!message.fromMe) return;

    const texto = (message.body || "").trim().toLowerCase();
    if (texto !== "/resumo") return;

    const numero = message.to;
    console.log("GERANDO RESUMO DE:", numero);

    const resumo = await gerarResumo(numero);
    await message.reply(resumo);
});

// === FLUXO DE MENSAGENS RECEBIDAS ===
client.on('message', async message => {
    // REGRA DE OURO 1: Ignora completamente mensagens enviadas por você ou pelo próprio bot
    if (message.fromMe || message.id.fromMe) return;

    // REGRA DE OURO 2: Ignora se a mensagem vier de um grupo
    if (message.from.endsWith('@g.us')) {
        console.log(`Mensagem recebida em grupo (${message.from}). Ignorando...`);
        return;
    }

    // CORREÇÃO MÁXIMA: Ignora atualizações e respostas de STATUS / STORIES
    if (message.from === 'status@broadcast' || message.from.endsWith('@status')) {
        return;
    }

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

        // --- TRATAMENTO ISOLADO PARA ÁUDIO DO CLIENTE ---
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            
            if (media && media.mimetype.startsWith('audio')) {
                if (clientesAguardando[numero]) {
                    console.log(`Áudio recebido de ${numero}, mas o cliente já está aguardando suporte. Ignorado.`);
                    return;
                }

                registrarInteracao(numero, "mensagem", "[Mensagem de Áudio 🎤]");

                console.log("Áudio recebido do cliente. Aplicando delay de 3 segundos...");
                await delay(3000); 
                
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

        const texto = (message.body || "").trim().toLowerCase();
        
        // Evita duplicar o registro caso o cliente use comandos de sistema ou opções numéricas
        if (texto !== "menu" && !menu[texto]) {
            registrarInteracao(numero, "mensagem", message.body);
        }

        // MENU (Quando o cliente digita "menu")
        if (texto === "menu") {
            console.log("Enviando menu... Aplicando delay de 2 segundos...");
            clientesAguardando[numero] = false;
            clientesAtendidos[numero] = true; 
            
            registrarInteracao(numero, "mensagem", "Digitou: Menu");

            await delay(2000); 
            await message.reply(gerarMenu());
            return;
        }

        // Primeira mensagem de texto do cliente
        if (!clientesAtendidos[numero]) {
            clientesAtendidos[numero] = true;
            
            console.log("Primeira mensagem de texto. Aplicando delay de 3 segundos...");
            await delay(3000); 
            await message.reply(gerarMenu());
            return;
        }

        // Opções do menu (1, 2, 3 ou 4)
        if (menu[texto]) {
            console.log("PASSOU AQUI - OPCAO");

            registrarInteracao(numero, "opcao", `${texto} - ${menu[texto]}`);
            
            await delay(2000); 
            await message.reply(menu[texto]);
            return;
        }

        // Já recebeu aviso de espera (ignora textos repetidos para não fludar)
        if (clientesAguardando[numero]) {
            return;
        }

        // Qualquer outro texto fora do menu (Aviso de encaminhamento para suporte)
        console.log("Texto fora do menu. Aplicando delay de 3 segundos antes do aviso...");
        
        await delay(3000); 
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

// Inicialização do cliente
client.initialize();
