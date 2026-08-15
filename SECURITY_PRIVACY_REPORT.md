# Relatório de Segurança e Privacidade

*Relatório gerado com auxílio de IA como parte da etapa de Ética e Segurança do projeto.*

## Escopo

Auditoria do código-fonte de `api.js` (backend) e `index.html`/`style.css` (frontend) quanto a:
- armazenamento de segredos/chaves
- tratamento de dados de localização
- segurança da comunicação com APIs externas
- exposição de informações sensíveis a usuários finais

## Resumo

O projeto tem uma superfície de risco pequena: não há autenticação, não há banco de dados, não há chaves de API (a Open-Meteo não exige), e nenhum dado é persistido entre requisições. As correções abaixo já foram aplicadas ao código nesta etapa.

## Achados e correções aplicadas

### 1. Ausência de atribuição obrigatória da fonte de dados — **corrigido**
Os dados da Open-Meteo são licenciados sob CC BY 4.0, que exige atribuição visível com link. O projeto não exibia essa atribuição.
**Correção:** adicionado rodapé em `index.html` com link para `open-meteo.com` e para a licença CC BY 4.0, no formato recomendado pela própria Open-Meteo.

### 2. Nenhum aviso sobre o uso do nome da cidade — **corrigido**
O usuário não era informado de que o texto digitado é enviado a um serviço de terceiros (Open-Meteo) para geocodificação.
**Correção:** adicionado aviso de privacidade visível abaixo do formulário, explicando o que é enviado e para onde.

### 3. CORS totalmente aberto (`Access-Control-Allow-Origin: *`) — **aceito, com ressalva**
O backend permite requisições de qualquer origem. Para esta aplicação (proxy de leitura, sem autenticação, sem dados sensíveis), isso não expõe informação privada — mas, se o projeto crescer para incluir autenticação ou dados de usuário no futuro, o CORS deve ser restringido a origens conhecidas antes disso acontecer. **Recomendação para produção:** substituir `*` pelo domínio real do frontend.

### 4. Ícones carregados via CDN sem Subresource Integrity (SRI) — **recomendação, não aplicada**
O `index.html` carrega o CSS do Weather Icons de `cdnjs.cloudflare.com` sem atributo `integrity`. Se o CDN for comprometido, um arquivo malicioso poderia ser servido no lugar do original.
**Recomendação:** adicionar `integrity` e `crossorigin="anonymous"` ao `<link>`, usando o hash disponibilizado pelo próprio cdnjs.

### 5. Logs do servidor contêm entrada do usuário — **aceito, com ressalva**
`api.js` usa `console.log` para registrar a cidade recebida e as URLs consultadas. Em ambiente local/educacional isso é útil para depuração. **Recomendação para produção:** remover ou reduzir esses logs (ou usar um logger com rotação/expiração), já que texto livre do usuário não deveria ficar retido indefinidamente em arquivos de log.

### 6. Nenhuma coleta de dados pessoais identificada — **positivo**
- Não há geolocalização do navegador (`navigator.geolocation`) em uso — só o nome de cidade digitado manualmente.
- Não há cookies, `localStorage` ou qualquer armazenamento persistente no frontend.
- Não há criação de contas, login ou coleta de identificadores de usuário.
- Segundo os termos públicos da Open-Meteo, o serviço não coleta nem compartilha dados pessoais de quem consulta a API.

### 7. Comunicação com a API externa via HTTPS — **positivo**
Todas as chamadas a `geocoding-api.open-meteo.com` e `api.open-meteo.com` usam HTTPS. O input da cidade é tratado com `encodeURIComponent` antes de compor a URL, evitando injeção via querystring.

### 8. Erros não vazam detalhes internos ao cliente — **positivo**
O backend loga o erro completo apenas no servidor (`console.error`) e retorna ao usuário uma mensagem genérica (`"Não foi possível consultar o clima..."`), sem stack trace, caminho de arquivo ou detalhes de implementação.

## Recomendações para o ambiente de produção

1. Restringir `Access-Control-Allow-Origin` ao domínio real do frontend.
2. Adicionar `integrity`/`crossorigin` ao link do Weather Icons (SRI).
3. Servir o backend também via HTTPS (hoje roda em HTTP puro, aceitável apenas em `localhost`).
4. Reduzir ou remover logs com texto livre do usuário, ou aplicar política de retenção curta.
5. Adicionar um limite de taxa (rate limit) simples no backend, já que a Open-Meteo também limita chamadas (10.000/dia no plano gratuito) — evita que um uso indevido do seu backend estoure a cota compartilhada.