# Guia de Contribuição

Obrigado por contribuir com o **Simples Apuração RTC**. Este guia resume os padrões do
projeto e as armadilhas já documentadas.

## Setup em 2 minutos

```bash
npm install
npm run dev        # http://localhost:3000  (modo demo, sem env)
npm test           # roda a suíte
```

## Processo obrigatório para qualquer mudança

1. **Design primeiro** — descreva arquivos afetados, fluxo e riscos antes de codar.
2. **Implemente com testes** — nenhuma feature nova entra sem teste.
3. **Valide** — `npm test` verde **e** `npm run build` limpo antes de abrir PR.
4. **Documente decisões** — mudanças de arquitetura viram um ADR no `ROADMAP.md`.

## Regras invioláveis

- **Privacidade:** `AiContextService` é o guardião. O `AiContext` **nunca** pode conter
  CNPJs, nomes de empresas ou chaves de acesso. Há teste auditando isso — mantenha-o verde.
- **Chaves de API:** `GEMINI_API_KEY` fica em `process.env` no servidor. Nunca use
  `NEXT_PUBLIC_` para ela.
- **Middleware:** em Next.js 15 com `src/`, o middleware **deve** ficar em
  `src/middleware.ts` (na raiz, ele é ignorado).
- **Logout:** usa `window.location.href` (navegação HTTP completa), não `router.push()` —
  garante a limpeza dos cookies antes do middleware.
- **Testes:** o baseline é 29 testes. Só pode crescer.

## Armadilhas conhecidas (não repita)

1. **Coerção numérica no parser quebra dados fiscais.** Mantenha
   `parseTagValue: false` e `parseAttributeValue: false` em `xmlConfig.ts`. Chaves de 44
   dígitos, CNPJs e CFOPs com zero à esquerda só sobrevivem como string.
2. **`isArray` no fast-xml-parser v5 precisa ser função quando presente.** Não passe
   `isArray: undefined` — omita a chave (já tratado em `createXmlParser`).
3. **Detecção de NFS-e:** descarte ABRASF (`<CompNfse>`) **antes** de testar o padrão
   nacional, senão `<InfNfse>` casa por engano.
4. **Direção depende do declarante.** Sempre rode `TaxAnalyzerService.enrich()` após
   carregar/remover documentos — é ele que recalcula direção e impacto do lote inteiro.
5. **CT-e:** os tributos são do documento inteiro; ficam só no `items[0]`. Os demais
   componentes do frete têm `rtc = {}`.

## Como adicionar um novo parser

1. Crie `src/infrastructure/parsers/ParserXyz.ts` implementando `IXmlParser`.
2. Registre o tipo em `DocumentDetector` e em `ParserFactory`.
3. Adicione uma fixture XML real em `tests/fixtures/` e um teste em `tests/`.
4. Garanta `npm test` e `npm run build` limpos.

## Estilo de código

- TypeScript strict. Sem `any` desnecessário.
- Lógica de negócio em `application/services` (pura, testável). UI fina por cima.
- Componentes que usam estado/efeitos levam `"use client"`.
