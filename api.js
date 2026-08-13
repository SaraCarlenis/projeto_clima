const http = require("http");
const https = require("https");
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

    if (code === 1) {
        return "Principalmente limpo";
    }

    if (code === 2) {
        return "Parcialmente nublado";
    }

    if (code === 3) {
        return "Nublado";
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


/**
 * Faz uma requisição HTTPS utilizando o módulo nativo do Node.js.
 *
 * A função recebe uma URL e retorna os dados da API
 * convertidos de JSON para objeto JavaScript.
 *
 * @param {string} url URL da API.
 * @returns {Promise<Object>} Dados retornados pela API.
 */
function consultarApiHttps(url) {

    return new Promise((resolve, reject) => {

        https.get(url, (res) => {

            let dados = "";

            // Recebe os dados da API em partes
            res.on("data", (parte) => {
                dados += parte;
            });

            // Executa quando todos os dados forem recebidos
            res.on("end", () => {

                // Verifica se a API respondeu com sucesso
                if (res.statusCode >= 200 && res.statusCode < 300) {

                    try {

                        // Converte o texto JSON para objeto JavaScript
                        const json = JSON.parse(dados);

                        resolve(json);

                    } catch (erro) {

                        reject(
                            new Error(
                                "Resposta da API não é um JSON válido."
                            )
                        );
                    }

                } else {

                    reject(
                        new Error(
                            `API respondeu com status ${res.statusCode}.`
                        )
                    );
                }
            });

        }).on("error", (erro) => {

            reject(erro);

        });
    });
}


/**
 * Faz uma requisição HTTPS com tentativas automáticas.
 *
 * Se ocorrer uma falha, a função tenta novamente
 * até atingir o número máximo de tentativas.
 *
 * @param {string} url URL da API.
 * @param {number} tentativas Número máximo de tentativas.
 * @returns {Promise<Object>} Dados retornados pela API.
 */
async function consultarApiHttpsComTentativas(url, tentativas = 3) {

    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {

        try {

            console.log(
                `Tentativa ${tentativa} de ${tentativas}:`,
                url
            );

            const dados = await consultarApiHttps(url);

            return dados;

        } catch (erro) {

            console.error(
                `Falha na tentativa ${tentativa}:`,
                erro.message
            );

            // Se foi a última tentativa, envia o erro adiante
            if (tentativa === tentativas) {
                throw erro;
            }

            // Aguarda 1 segundo antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}


/**
 * Criação do servidor HTTP.
 */
const server = http.createServer(async (req, res) => {

    // Permite requisições vindas do navegador
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    // Define o formato da resposta
    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    // Cria uma URL a partir da requisição
    const url = new URL(
        req.url,
        `http://${req.headers.host}`
    );

    console.log(
        "Requisição recebida:",
        url.pathname
    );


    // ==========================================
    // ROTA /clima
    // ==========================================

    if (url.pathname === "/clima") {

        // Obtém o nome da cidade enviado na URL
        const cidade = url.searchParams.get("cidade");

        console.log(
            "Cidade recebida:",
            cidade
        );


        // Verifica se a cidade foi informada
        if (!cidade) {

            res.statusCode = 400;

            res.end(
                JSON.stringify({
                    erro: "Informe o nome de uma cidade."
                })
            );

            return;
        }


        try {

            // ==========================================
            // 1. GEOCODIFICAÇÃO
            // ==========================================

            const geocodingUrl =
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;

            console.log(
                "Consultando geocodificação..."
            );

            const dados =
                await consultarApiHttpsComTentativas(
                    geocodingUrl
                );


            // Verifica se a cidade foi encontrada
            if (
                !dados.results ||
                dados.results.length === 0
            ) {

                res.statusCode = 404;

                res.end(
                    JSON.stringify({
                        erro: "Cidade não encontrada."
                    })
                );

                return;
            }


            // Obtém os dados da primeira cidade encontrada
            const localizacao =
                dados.results[0];


            // Obtém latitude e longitude
            const latitude =
                localizacao.latitude;

            const longitude =
                localizacao.longitude;


            // ==========================================
            // 2. PREVISÃO DO TEMPO
            // ==========================================

            const weatherUrl =
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m&timezone=auto`;

            console.log(
                "Consultando previsão do tempo..."
            );


            const dadosClima =
                await consultarApiHttpsComTentativas(
                    weatherUrl
                );


            // ==========================================
            // 3. OBTÉM OS DADOS DO CLIMA
            // ==========================================

            const temperatura = dadosClima.current.temperature_2m;


            const weatherCode = dadosClima.current.weather_code;


            const isDay = dadosClima.current.is_day;


            const horario = dadosClima.current.time;

            const umidade = dadosClima.current.relative_humidity_2m;

            const velocidadeVento = dadosClima.current.wind_speed_10m;


            // Converte o código meteorológico
            // para uma descrição compreensível

            const timezone = dadosClima.timezone;

            const descricao = obterDescricaoClima(weatherCode);



            // ==========================================
            // 4. RETORNA OS DADOS PARA O FRONTEND
            // ==========================================

            res.statusCode = 200;

            res.end(
                JSON.stringify({

                    cidade: localizacao.name,
                    latitude: latitude,
                    longitude: longitude,
                    temperatura: temperatura,
                    descricao: descricao,
                    horario: horario,
                    codigoClima: weatherCode,
                    isDay: isDay,
                    umidade: umidade,
                    velocidadeVento: velocidadeVento,
                    timezone: timezone
                })
            );


        } catch (erro) {

            // Registra o erro somente no servidor
            console.error(
                "Erro completo:",
                erro
            );


            res.statusCode = 500;


            // Não expõe detalhes internos ao usuário
            res.end(
                JSON.stringify({
                    erro: "⚠️ Não foi possível consultar o clima no momento. Verifique sua conexão e tente novamente."
                })
            );
        }


        return;
    }


    // ==========================================
    // ROTA NÃO ENCONTRADA
    // ==========================================

    res.statusCode = 404;

    res.end(
        JSON.stringify({
            erro: "Rota não encontrada."
        })
    );
});


// ==========================================
// INICIA O SERVIDOR
// ==========================================

server.listen(PORT, () => {

    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );

});