const http = require("http");
const { URL } = require("url");

const PORT = 3000;

/**
 * Converte o código meteorológico da Open-Meteo
 * em uma descrição compreensível.
 *
 * @param {number} code Código meteorológico.
 * @returns {string} Descrição das condições climáticas.
 */
function obterDescricaoClima(code) {

    if (code === 0) {
        return "Céu limpo";
    }

    if (code >= 1 && code <= 3) {
        return "Parcialmente nublado";
    }

    if (code >= 45 && code <= 48) {
        return "Nevoeiro";
    }

    if (code >= 51 && code <= 57) {
        return "Chuvisco";
    }

    if (code >= 61 && code <= 67) {
        return "Chuva";
    }

    if (code >= 71 && code <= 77) {
        return "Neve";
    }

    if (code >= 80 && code <= 82) {
        return "Pancadas de chuva";
    }

    if (code >= 85 && code <= 86) {
        return "Pancadas de neve";
    }

    if (code >= 95 && code <= 99) {
        return "Trovoada";
    }

    return "Condição climática desconhecida";
}

const server = http.createServer(async (req, res) => {

    // Permite requisições do navegador
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Define o formato da resposta
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    // Cria uma URL a partir da requisição
    const url = new URL(req.url, `http://${req.headers.host}`);

    console.log("Requisição recebida:", url.pathname);

    // Verifica se a rota é /clima
    if (url.pathname === "/clima") {

        // Obtém o nome da cidade enviado na URL
        const cidade = url.searchParams.get("cidade");

        console.log("Cidade recebida:", cidade);

        // Verifica se a cidade foi informada
        if (!cidade) {
            res.statusCode = 400;

            res.end(JSON.stringify({
                erro: "Informe o nome de uma cidade."
            }));

            return;
        }

        try {

            // Monta a URL da API de geocodificação
            const geocodingUrl =
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;

            // Faz a requisição para a API de geocodificação
            const resposta = await fetch(geocodingUrl);

            // Verifica se a API respondeu com erro HTTP
            if (!resposta.ok) {
                throw new Error(
                    "Erro ao consultar a API de geocodificação."
                );
            }

            // Converte a resposta para JSON
            const dados = await resposta.json();

            // Verifica se a cidade foi encontrada
            if (!dados.results || dados.results.length === 0) {
                res.statusCode = 404;

                res.end(JSON.stringify({
                    erro: "Cidade não encontrada."
                }));

                return;
            }

            // Obtém os dados da primeira cidade encontrada
            const localizacao = dados.results[0];

            // Obtém latitude e longitude
            const latitude = localizacao.latitude;
            const longitude = localizacao.longitude;

            // Monta a URL da API de previsão do tempo
            const weatherUrl =
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;

            // Consulta a API de previsão
            const respostaClima = await fetch(weatherUrl);

            // Verifica se a API de previsão respondeu com erro
            if (!respostaClima.ok) {
                throw new Error(
                    "Erro ao consultar a API de previsão do tempo."
                );
            }

            // Converte a resposta para JSON
            const dadosClima = await respostaClima.json();

            // Obtém a temperatura atual
            const temperatura =
                dadosClima.current.temperature_2m;

            // Obtém o código meteorológico
            const weatherCode =
                dadosClima.current.weather_code;

            // Converte o código em descrição
            const descricao =
                obterDescricaoClima(weatherCode);

            // Retorna os dados para o Frontend
            res.statusCode = 200;

            res.end(JSON.stringify({
                cidade: localizacao.name,
                latitude: latitude,
                longitude: longitude,
                temperatura: temperatura,
                descricao: descricao
            }));

        } catch (erro) {

            // Registra o erro somente no servidor
            console.error("Erro completo:", erro);

            res.statusCode = 500;

            // Não expõe detalhes internos ao usuário
            res.end(JSON.stringify({
                erro: "Não foi possível consultar os dados do clima."
            }));
        }

        return;
    }

    // Rota não encontrada
    res.statusCode = 404;

    res.end(JSON.stringify({
        erro: "Rota não encontrada."
    }));
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});