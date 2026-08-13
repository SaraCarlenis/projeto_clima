const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;

/**
 * Converte o código meteorológico da Open-Meteo
 * em uma descrição compreensível.
 *
 * @param {number} code Código meteorológico.
 * @returns {string} Descrição das condições climáticas. Se o código não for
 *   reconhecido, retorna "Condição climática desconhecida" (nunca lança erro).
 * @example
 * obterDescricaoClima(0);  // "Céu limpo"
 * obterDescricaoClima(63); // "Chuva"
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
 * Faz uma requisição HTTP(S) utilizando apenas módulos nativos do Node.js.
 *
 * Escolhe automaticamente o módulo `http` ou `https` de acordo com o
 * protocolo da URL informada. Isso permite que, em produção, a aplicação
 * continue consultando a Open-Meteo via HTTPS normalmente, e que os
 * testes automatizados apontem para servidores HTTP locais (sem exigir
 * certificados TLS).
 *
 * @param {string} url URL da API.
 * @returns {Promise<Object>} Dados retornados pela API, convertidos de JSON.
 * @throws {Error} Se a API responder com status fora da faixa 2xx, se o
 *   corpo da resposta não for um JSON válido, ou se ocorrer um erro de
 *   rede (ex.: host inexistente, conexão recusada).
 * @example
 * const dados = await consultarApiHttps("https://api.open-meteo.com/v1/forecast?...");
 */
function consultarApiHttps(url) {

    return new Promise((resolve, reject) => {

        const protocolo = url.startsWith("https:") ? https : http;

        protocolo.get(url, (res) => {

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
 * Faz uma requisição HTTP(S) com tentativas automáticas.
 *
 * Se ocorrer uma falha, a função tenta novamente
 * até atingir o número máximo de tentativas.
 *
 * @param {string} url URL da API.
 * @param {number} [tentativas=3] Número máximo de tentativas.
 * @param {number} [delayMs=1000] Tempo de espera (ms) entre tentativas.
 * @returns {Promise<Object>} Dados retornados pela API.
 * @throws {Error} O erro da última tentativa, se todas as tentativas falharem.
 * @example
 * // Tenta até 5 vezes, esperando 2s entre cada uma
 * const dados = await consultarApiHttpsComTentativas(url, 5, 2000);
 */
async function consultarApiHttpsComTentativas(url, tentativas = 3, delayMs = 1000) {

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

            // Aguarda antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}


/**
 * Busca a localização (latitude/longitude) de uma cidade, usando a API de
 * geocodificação da Open-Meteo.
 *
 * @param {string} cidade Nome da cidade a ser buscada.
 * @param {Object} config Configuração da consulta.
 * @param {string} config.geocodingBaseUrl URL base da API de geocodificação.
 * @param {number} config.tentativas Número de tentativas em caso de falha.
 * @param {number} config.delayMs Tempo de espera (ms) entre tentativas.
 * @returns {Promise<Object|null>} Um objeto com `name`, `latitude` e
 *   `longitude` da primeira cidade encontrada, ou `null` se nenhuma
 *   cidade corresponder ao nome informado.
 * @throws {Error} Se a requisição à API de geocodificação falhar após
 *   esgotar as tentativas (erro HTTP, JSON inválido ou erro de rede).
 * @example
 * const local = await buscarLocalizacao("São Paulo", {
 *     geocodingBaseUrl: "https://geocoding-api.open-meteo.com",
 *     tentativas: 3,
 *     delayMs: 1000,
 * });
 * // { name: "São Paulo", latitude: -23.55, longitude: -46.63 }
 */
async function buscarLocalizacao(cidade, config) {

    const geocodingUrl =
        `${config.geocodingBaseUrl}/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;

    console.log(
        "Consultando geocodificação..."
    );

    const dados =
        await consultarApiHttpsComTentativas(
            geocodingUrl,
            config.tentativas,
            config.delayMs
        );

    if (
        !dados.results ||
        dados.results.length === 0
    ) {
        return null;
    }

    return dados.results[0];
}


/**
 * Busca a previsão do tempo atual para uma coordenada geográfica, usando a
 * API de previsão da Open-Meteo.
 *
 * @param {number} latitude Latitude da localização.
 * @param {number} longitude Longitude da localização.
 * @param {Object} config Configuração da consulta.
 * @param {string} config.weatherBaseUrl URL base da API de previsão do tempo.
 * @param {number} config.tentativas Número de tentativas em caso de falha.
 * @param {number} config.delayMs Tempo de espera (ms) entre tentativas.
 * @returns {Promise<Object>} Os dados brutos retornados pela API, contendo
 *   `timezone` e um objeto `current` com temperatura, código do clima,
 *   umidade, vento, etc.
 * @throws {Error} Se a requisição à API de previsão falhar após esgotar
 *   as tentativas (erro HTTP, JSON inválido ou erro de rede).
 * @example
 * const previsao = await buscarPrevisao(-23.55, -46.63, {
 *     weatherBaseUrl: "https://api.open-meteo.com",
 *     tentativas: 3,
 *     delayMs: 1000,
 * });
 * // { timezone: "America/Sao_Paulo", current: { temperature_2m: 24.5, ... } }
 */
async function buscarPrevisao(latitude, longitude, config) {

    const weatherUrl =
        `${config.weatherBaseUrl}/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    console.log(
        "Consultando previsão do tempo..."
    );

    return consultarApiHttpsComTentativas(
        weatherUrl,
        config.tentativas,
        config.delayMs
    );
}


/**
 * Cria (sem iniciar) o servidor HTTP da aplicação.
 *
 * As URLs base da API de geocodificação e de previsão do tempo, o número
 * de tentativas e o tempo entre elas são configuráveis. Isso permite que
 * os testes automatizados injetem servidores mock locais no lugar da
 * Open-Meteo real, sem alterar o comportamento em produção (que usa os
 * valores padrão).
 *
 * @param {Object} [config] Configuração opcional.
 * @param {string} [config.geocodingBaseUrl] URL base da API de geocodificação.
 * @param {string} [config.weatherBaseUrl] URL base da API de previsão do tempo.
 * @param {number} [config.tentativas] Número de tentativas por requisição externa.
 * @param {number} [config.delayMs] Tempo de espera (ms) entre tentativas.
 * @returns {http.Server} Instância do servidor HTTP (ainda não escutando).
 */
function criarServidor(config = {}) {

    const geocodingBaseUrl =
        config.geocodingBaseUrl || "https://geocoding-api.open-meteo.com";

    const weatherBaseUrl =
        config.weatherBaseUrl || "https://api.open-meteo.com";

    const tentativas = config.tentativas || 3;

    const delayMs = config.delayMs || 1000;

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


            const config = { geocodingBaseUrl, weatherBaseUrl, tentativas, delayMs };

            try {

                // ==========================================
                // 1. GEOCODIFICAÇÃO
                // ==========================================

                const localizacao =
                    await buscarLocalizacao(cidade, config);


                // Verifica se a cidade foi encontrada
                if (!localizacao) {

                    res.statusCode = 404;

                    res.end(
                        JSON.stringify({
                            erro: "Cidade não encontrada."
                        })
                    );

                    return;
                }


                // Obtém latitude e longitude
                const latitude =
                    localizacao.latitude;

                const longitude =
                    localizacao.longitude;


                // ==========================================
                // 2. PREVISÃO DO TEMPO
                // ==========================================

                const dadosClima =
                    await buscarPrevisao(latitude, longitude, config);


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

    return server;
}


// ==========================================
// INICIA O SERVIDOR (apenas quando executado diretamente)
// ==========================================

if (require.main === module) {

    criarServidor().listen(PORT, () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

    });
}


module.exports = {
    obterDescricaoClima,
    consultarApiHttps,
    consultarApiHttpsComTentativas,
    buscarLocalizacao,
    buscarPrevisao,
    criarServidor,
};