# Auditoria de Licenciamento e Conformidade

## Escopo

Verificação de todas as dependências, bibliotecas e serviços de terceiros usados pelo projeto, quanto à compatibilidade de licença com uso comercial e/ou educacional.

## Dependências do projeto

O projeto **não possui `package.json` nem dependências instaladas via npm** — backend e frontend usam apenas:
- Módulos nativos do Node.js (`http`, `https`, `url`) — parte do runtime, sob a licença do próprio Node.js (MIT-like), sem obrigação de atribuição separada.
- APIs e uma biblioteca de terceiros carregadas em tempo de execução (detalhadas abaixo).

Isso reduz bastante a superfície de risco de conformidade: não há risco de "supply chain" via `node_modules`.

## Serviços e bibliotecas de terceiros

| Componente | Uso no projeto | Licença | Uso comercial permitido? | Exige atribuição? |
|---|---|---|---|---|
| **Open-Meteo API** (dados climáticos + geocodificação) | Consumida em tempo de execução via HTTP | Dados: **CC BY 4.0**. Código-fonte do serviço Open-Meteo (que este projeto *não* usa/redistribui): AGPLv3 | Free tier: **apenas uso não-comercial**, até 10.000 chamadas/dia | **Sim** — atribuição obrigatória com link visível |
| **Weather Icons** (ícones de clima, via CDN) | Fonte + CSS carregados de `cdnjs.cloudflare.com` | Fonte: **SIL OFL 1.1** · Código/CSS: **MIT** · Documentação: CC BY 3.0 | Sim, ambas as licenças permitem uso comercial | Não é obrigatório por lei, mas é boa prática — feito por cortesia |

### Sobre a Open-Meteo — ponto de atenção

- O plano gratuito da API Open-Meteo é licenciado **apenas para uso não-comercial**. Se este projeto for usado comercialmente (ex.: vendido, monetizado com anúncios, incorporado a um produto pago), é necessário migrar para um plano pago da Open-Meteo.
- O AGPLv3 se aplica ao **código-fonte do servidor da Open-Meteo**, que roda nos servidores deles — este projeto não copia nem redistribui esse código, apenas consome a API pública HTTP. Portanto, **o AGPLv3 não se propaga para este projeto**.
- Os **dados** retornados pela API (temperatura, previsão, etc.) são licenciados sob CC BY 4.0. Como o projeto exibe esses dados na tela, a atribuição é obrigatória — **já implementada** no rodapé do `index.html` (ver `NOTICE.md`).

### Sobre o Weather Icons

- Carregado via CDN (não incluso no repositório), então não há arquivos de fonte para redistribuir diretamente — reduz a complexidade de conformidade.
- Ambas as licenças (SIL OFL para a fonte, MIT para o CSS) permitem uso comercial e educacional livremente, sem exigir atribuição obrigatória — mas o crédito foi incluído por transparência.

## Conclusão

**Para uso educacional (como este projeto):** sem conflitos de licenciamento. Todas as fontes usadas permitem uso não-comercial livremente, com a exigência de atribuição já atendida.

**Para uso comercial:** seria necessário contratar um plano pago da Open-Meteo antes de publicar o projeto comercialmente; o Weather Icons não teria restrição adicional.

Ver `LICENSE` para a licença deste próprio projeto, e `NOTICE.md` para os créditos e atribuições de terceiros.