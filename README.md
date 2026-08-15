# Previsão do Tempo

Aplicação web simples para consultar a previsão do tempo atual de qualquer cidade do mundo, usando a [API pública Open-Meteo](https://open-meteo.com/).

## Funcionalidades

- Busca de clima por nome de cidade (ex.: *São Paulo*, *Roma*, *Lisboa*)
- Geocodificação automática (converte o nome da cidade em latitude/longitude)
- Exibição de temperatura, descrição do clima, umidade e velocidade do vento
- **Previsão para os próximos 5 dias**, com temperaturas máxima e mínima diárias
- Ícones visuais de acordo com a condição climática (Weather Icons)
- **Fundo animado** que muda conforme a condição climática (sol, nuvens, sol entre nuvens, chuva e raios em tempestade)
- Tema claro/escuro automático conforme o horário (dia/noite) da cidade consultada
- Data e hora completas da consulta
- Tratamento de erros para cidade inválida, falha na API e problemas de rede

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript puro (sem frameworks ou bibliotecas de UI)
- **Backend:** JavaScript puro sobre Node.js (módulos nativos `http`/`https`, sem frameworks como Express)
- **Testes:** test runner nativo do Node (`node:test` + `node:assert`), sem dependências externas
- **API externa:** [Open-Meteo](https://open-meteo.com/) (geocodificação e previsão do tempo), gratuita e sem necessidade de autenticação

## Estrutura do projeto

```
projeto_clima/
├── index.html      # Frontend: formulário e exibição do resultado
├── style.css        # Estilos, responsividade, temas dia/noite e fundo animado
├── api.js            # Backend: servidor HTTP e consumo da API Open-Meteo
├── api.test.js       # Testes automatizados do backend
├── README.md
├── SECURITY.md       # Auditoria de segurança e privacidade
├── COMPLIANCE.md     # Auditoria de licenciamento e conformidade
├── LICENSE           # Licença do projeto (MIT — inglês e português)
└── NOTICE.md         # Créditos e atribuições de terceiros
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior instalado (o projeto usa `fetch` e o test runner nativos)

## Como executar

1. Clone o repositório e entre na pasta do projeto:
   ```bash
   git clone <url-do-repositorio>
   cd projeto_clima
   ```

2. Inicie o backend (fica escutando em `http://localhost:3000`):
   ```bash
   node api.js
   ```

3. Em outra aba/janela, abra o `index.html` no navegador (duplo clique no arquivo, ou usando uma extensão como *Live Server* no VS Code).

4. Digite o nome de uma cidade no campo de busca e clique em **Consultar**.

> O backend precisa estar rodando (passo 2) para o frontend conseguir buscar os dados — o `index.html` faz requisições para `http://localhost:3000/clima`.

## Como rodar os testes

O projeto usa o test runner nativo do Node, então não é necessário instalar nada:

```bash
node --test
```

Isso executa automaticamente todos os arquivos `*.test.js` da pasta e mostra um resumo com o total de testes, quantos passaram e quantos falharam.

## Exemplo de uso da API interna

O backend expõe uma única rota:

```
GET /clima?cidade=São Paulo
```

Resposta de sucesso (200):
```json
{
  "cidade": "São Paulo",
  "latitude": -23.55,
  "longitude": -46.63,
  "temperatura": 24.5,
  "descricao": "Principalmente limpo",
  "horario": "2026-08-13T10:00",
  "codigoClima": 1,
  "isDay": 1,
  "umidade": 60,
  "velocidadeVento": 10,
  "timezone": "America/Sao_Paulo",
  "previsao5Dias": [
    {
      "data": "2026-08-13",
      "temperaturaMaxima": 25.1,
      "temperaturaMinima": 15.3,
      "descricao": "Principalmente limpo",
      "codigoClima": 1
    }
  ]
}
```

Possíveis respostas de erro:
| Situação | Status | Corpo |
|---|---|---|
| Cidade não informada | 400 | `{ "erro": "Informe o nome de uma cidade." }` |
| Cidade não encontrada | 404 | `{ "erro": "Cidade não encontrada." }` |
| Falha na API externa / rede | 500 | `{ "erro": "⚠️ Não foi possível consultar o clima no momento..." }` |

## Privacidade

Esta aplicação **não coleta, armazena nem compartilha dados pessoais**. O
único dado enviado a terceiros é o nome da cidade digitado pelo usuário,
que é repassado à API de geocodificação da Open-Meteo apenas para
localizar suas coordenadas geográficas. Não há cookies, `localStorage`,
contas de usuário ou rastreamento de qualquer tipo.

Detalhes completos na auditoria: [`SECURITY.md`](./SECURITY.md).

## Status do projeto

Projeto completo até a etapa de Ética e Segurança (`06_etica_seguranca`),
incluindo testes automatizados, documentação, previsão estendida de 5
dias, fundo animado por condição climática, e auditorias de segurança e
licenciamento.

## Licenciamento

Este projeto é distribuído sob a [licença MIT](./LICENSE) (texto em
inglês e português).

O projeto consome serviços e recursos de terceiros com suas próprias
licenças — Open-Meteo (CC BY 4.0, uso gratuito restrito a fins
não-comerciais) e Weather Icons (SIL OFL 1.1 / MIT). Créditos completos
em [`NOTICE.md`](./NOTICE.md) e análise de compatibilidade em
[`COMPLIANCE.md`](./COMPLIANCE.md).