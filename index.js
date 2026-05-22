const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;


/*
    ROTA PRINCIPAL
*/
app.get("/", (req, res) => {

    res.send("Bem-vindo ao chatbot");

});


/*
    CHATBOT
*/
app.get("/chatbot/:opcao", (req, res) => {

    const opcao = req.params.opcao;

    if (opcao === "1") {

        res.json({
            status: "sucesso",
            resposta: "Nosso horário é das 08h às 18h"
        });

    } else if (opcao === "2") {

        res.json({
            status: "sucesso",
            resposta: "Estamos na Avenida Brasil, 100"
        });

    } else if (opcao === "3") {

        res.json({
            status: "sucesso",
            resposta: "Nosso suporte é pelo WhatsApp"
        });

    } else {

        res.json({
            status: "erro",
            resposta: "Opção inválida"
        });

    }

});

/*
    INICIAR SERVIDOR
*/
app.listen(PORT, () => {

    console.log(`Servidor rodando em http://localhost:${PORT}`);

});