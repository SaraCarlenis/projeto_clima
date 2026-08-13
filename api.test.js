const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const {
    obterDescricaoClima,
    consultarApiHttps,
    consultarApiHttpsComTentativas,
    criarServidor,
} = require("./api.js");


// ==========================================
// UTILITÁRIOS DE TESTE
// ==========================================

/**
 * Sobe um servidor HTTP local mock e retorna a instância já escutando
 * numa porta aleatória (evita colisão entre testes).
 */
function criarServidorMock(handler) {

    return new Promise((resolve) => {

        const servidor = http.createServer(handler);

        servidor.listen(0, "127.0.0.1", () => resolve(servidor));
    });
}

function urlDoServidor(servidor) {

    const endereco = servidor.address();

    return `http://127.0.0.1:${endereco.port}`;
}

/**
 * Sobe (sem porta fixa) uma instância do servidor da aplicação para testes
 * de integração da rota /clima.
 */
function subirServidorTeste(config) {

    return new Promise((resolve) => {

        const servidor = criarServidor(config);

        servidor.listen(0, "127.0.0.1", () => resolve(servidor));
    });
}


// ==========================================
// obterDescricaoClima
// ==========================================

test("obterDescricaoClima - retorna descrições corretas para códigos conhecidos", () => {

    assert.equal(obterDescricaoClima(0), "Céu limpo");
    assert.equal(obterDescricaoClima(1), "Principalmente limpo");
    assert.equal(obterDescricaoClima(2), "Parcialmente nublado");
    assert.equal(obterDescricaoClima(3), "Nublado");
    assert.equal(obterDescricaoClima(46), "Nevoeiro");
    assert.equal(obterDescricaoClima(55), "Chuvisco");
    assert.equal(obterDescricaoClima(63), "Chuva");
    assert.equal(obterDescricaoClima(75), "Neve");
    assert.equal(obterDescricaoClima(81), "Pancadas de chuva");
    assert.equal(obterDescricaoClima(85), "Pancadas de neve");
    assert.equal(obterDescricaoClima(96), "Trovoada");
});

test("obterDescricaoClima - retorna mensagem padrão para código desconhecido", () => {

    assert.equal(obterDescricaoClima(999), "Condição climática desconhecida");
});


// ==========================================
// consultarApiHttps
// ==========================================

test("consultarApiHttps - resolve com o JSON retornado quando o status é 2xx", async () => {

    const servidor = await criarServidorMock((req, res) => {
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
    });

    const dados = await consultarApiHttps(urlDoServidor(servidor));

    assert.deepEqual(dados, { ok: true });

    servidor.close();
});

test("consultarApiHttps - rejeita quando a API responde com erro HTTP", async () => {

    const servidor = await criarServidorMock((req, res) => {
        res.statusCode = 500;
        res.end("erro interno");
    });

    await assert.rejects(
        () => consultarApiHttps(urlDoServidor(servidor)),
        /status 500/
    );

    servidor.close();
});

test("consultarApiHttps - rejeita quando a resposta não é um JSON válido", async () => {

    const servidor = await criarServidorMock((req, res) => {
        res.statusCode = 200;
        res.end("isso não é json");
    });

    await assert.rejects(
        () => consultarApiHttps(urlDoServidor(servidor)),
        /JSON válido/
    );

    servidor.close();
});

test("consultarApiHttps - rejeita em caso de erro de rede (conexão recusada)", async () => {

    // Porta sem nenhum servidor escutando -> erro de conexão
    await assert.rejects(
        () => consultarApiHttps("http://127.0.0.1:1")
    );
});


// ==========================================
// consultarApiHttpsComTentativas
// ==========================================

test("consultarApiHttpsComTentativas - tenta novamente após falha e depois retorna sucesso", async () => {

    let chamadas = 0;

    const servidor = await criarServidorMock((req, res) => {

        chamadas++;

        if (chamadas < 2) {
            res.statusCode = 500;
            res.end("falha temporária");
            return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ tentativa: chamadas }));
    });

    const dados = await consultarApiHttpsComTentativas(
        urlDoServidor(servidor), 3, 10
    );

    assert.equal(chamadas, 2);
    assert.deepEqual(dados, { tentativa: 2 });

    servidor.close();
});

test("consultarApiHttpsComTentativas - lança erro depois de esgotar as tentativas", async () => {

    let chamadas = 0;

    const servidor = await criarServidorMock((req, res) => {
        chamadas++;
        res.statusCode = 500;
        res.end("sempre falha");
    });

    await assert.rejects(
        () => consultarApiHttpsComTentativas(urlDoServidor(servidor), 2, 10)
    );

    assert.equal(chamadas, 2);

    servidor.close();
});


// ==========================================
// Rota /clima (testes de integração)
// ==========================================

test("/clima - retorna 400 quando a cidade não é informada", async () => {

    const servidorTeste = await subirServidorTeste();

    const resposta = await fetch(`${urlDoServidor(servidorTeste)}/clima`);
    const dados = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(dados.erro, "Informe o nome de uma cidade.");

    servidorTeste.close();
});

test("/clima - retorna 404 quando a cidade não é encontrada na geocodificação", async () => {

    const servidorGeo = await criarServidorMock((req, res) => {
        res.statusCode = 200;
        res.end(JSON.stringify({ results: [] }));
    });

    const servidorTeste = await subirServidorTeste({
        geocodingBaseUrl: urlDoServidor(servidorGeo),
    });

    const resposta = await fetch(
        `${urlDoServidor(servidorTeste)}/clima?cidade=CidadeQueNaoExiste`
    );
    const dados = await resposta.json();

    assert.equal(resposta.status, 404);
    assert.equal(dados.erro, "Cidade não encontrada.");

    servidorGeo.close();
    servidorTeste.close();
});

test("/clima - retorna os dados do clima quando a cidade é encontrada", async () => {

    const servidorGeo = await criarServidorMock((req, res) => {
        res.statusCode = 200;
        res.end(JSON.stringify({
            results: [{ name: "São Paulo", latitude: -23.55, longitude: -46.63 }],
        }));
    });

    const servidorClima = await criarServidorMock((req, res) => {
        res.statusCode = 200;
        res.end(JSON.stringify({
            timezone: "America/Sao_Paulo",
            current: {
                temperature_2m: 24.5,
                weather_code: 1,
                is_day: 1,
                relative_humidity_2m: 60,
                wind_speed_10m: 10,
                time: "2026-08-13T10:00",
            },
        }));
    });

    const servidorTeste = await subirServidorTeste({
        geocodingBaseUrl: urlDoServidor(servidorGeo),
        weatherBaseUrl: urlDoServidor(servidorClima),
    });

    const resposta = await fetch(
        `${urlDoServidor(servidorTeste)}/clima?cidade=${encodeURIComponent("São Paulo")}`
    );
    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.cidade, "São Paulo");
    assert.equal(dados.temperatura, 24.5);
    assert.equal(dados.descricao, "Principalmente limpo");
    assert.equal(dados.umidade, 60);
    assert.equal(dados.velocidadeVento, 10);

    servidorGeo.close();
    servidorClima.close();
    servidorTeste.close();
});

test("/clima - retorna 500 quando a API externa falha", async () => {

    const servidorGeo = await criarServidorMock((req, res) => {
        res.statusCode = 500;
        res.end("erro");
    });

    const servidorTeste = await subirServidorTeste({
        geocodingBaseUrl: urlDoServidor(servidorGeo),
        tentativas: 1,
        delayMs: 10,
    });

    const resposta = await fetch(
        `${urlDoServidor(servidorTeste)}/clima?cidade=Teste`
    );
    const dados = await resposta.json();

    assert.equal(resposta.status, 500);
    assert.match(dados.erro, /Não foi possível consultar/);

    servidorGeo.close();
    servidorTeste.close();
});

test("/clima - retorna 500 quando ocorre erro de rede (host de geocodificação inexistente)", async () => {

    const servidorTeste = await subirServidorTeste({
        geocodingBaseUrl: "http://127.0.0.1:1",
        tentativas: 1,
        delayMs: 10,
    });

    const resposta = await fetch(
        `${urlDoServidor(servidorTeste)}/clima?cidade=Teste`
    );
    const dados = await resposta.json();

    assert.equal(resposta.status, 500);
    assert.match(dados.erro, /Não foi possível consultar/);

    servidorTeste.close();
});

test("rota desconhecida - retorna 404", async () => {

    const servidorTeste = await subirServidorTeste();

    const resposta = await fetch(`${urlDoServidor(servidorTeste)}/rota-que-nao-existe`);
    const dados = await resposta.json();

    assert.equal(resposta.status, 404);
    assert.equal(dados.erro, "Rota não encontrada.");

    servidorTeste.close();
});