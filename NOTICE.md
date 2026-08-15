# NOTICE — Atribuições de Terceiros

Este projeto consome os seguintes serviços e recursos de terceiros. As
atribuições abaixo cumprem as obrigações de licenciamento de cada um.

## Open-Meteo

- **O que é usado:** API de geocodificação e API de previsão do tempo (`geocoding-api.open-meteo.com` e `api.open-meteo.com`), consumidas em tempo de execução via requisições HTTP.
- **Licença dos dados:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Atribuição:**
  > Dados meteorológicos por [Open-Meteo.com](https://open-meteo.com/), sob licença CC BY 4.0.
- **Nota:** este projeto não redistribui nem incorpora o código-fonte da Open-Meteo (que é licenciado sob AGPLv3) — apenas consome a API pública. O uso gratuito da API é restrito a fins não-comerciais (ver `LICENSE_COMPLIANCE.md`).

## Weather Icons

- **O que é usado:** fonte de ícones e folha de estilos, carregadas via CDN (`cdnjs.cloudflare.com/ajax/libs/weather-icons`).
- **Autor:** Erik Flowers ([erikflowers.github.io/weather-icons](https://erikflowers.github.io/weather-icons/))
- **Licenças:**
  - Fonte (arquivos de ícones): [SIL Open Font License 1.1](http://scripts.sil.org/OFL)
  - Código (CSS/LESS/SCSS): [Licença MIT](http://opensource.org/licenses/mit-license.html)
  - Documentação: [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
- **Atribuição:** incluída no rodapé da aplicação (`index.html`).

## Node.js (módulos nativos)

- **O que é usado:** módulos nativos `http`, `https` e `url`, parte do runtime do Node.js. Nenhum pacote de terceiros via npm é utilizado no backend.
- **Licença:** licença do próprio Node.js (estilo MIT), não requer atribuição adicional em projetos que o utilizam como runtime.