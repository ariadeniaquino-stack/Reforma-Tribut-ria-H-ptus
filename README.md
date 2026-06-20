# Simples Apuração RTC

Ferramenta web para apuração de créditos e débitos de **IBS/CBS** — os tributos da
Reforma Tributária do Consumo (EC 132/2023 · LC 214/2025). Lê XMLs de **NF-e, NFC-e,
CT-e e NFS-e (padrão nacional)** e calcula a apuração do declarante, com análise
temporal, conformidade e geração de um dossiê tributário por IA.

Desenvolvido por **HAPTUS Assessoria Contábil**.

> ⚠️ A regulamentação da Reforma ainda está em construção. As alíquotas de 2026–2032
> são de transição. A ferramenta usa os valores efetivamente destacados nos XMLs e
> comunica as premissas assumidas na própria interface.

---

## Destaques

- **100% client-side no processamento fiscal** — os XMLs são lidos e apurados no
  navegador. Nenhum documento, CNPJ ou chave de acesso sai da máquina do usuário.
- **Guardião de privacidade da IA** — o dossiê é gerado a partir de estatísticas
  agregadas; CNPJs, nomes e chaves nunca são enviados ao modelo (auditado por testes).
- **Quatro parsers** com extração das tags `vIBS`/`vCBS` por item e por documento.
- **Apuração correta por direção** — crédito/débito é determinado pela posição do
  declarante (entrada → crédito, saída → débito); o CFOP serve apenas para excluir
  operações não-comerciais.
- **Visual clean** na identidade HAPTUS (verde-petróleo + grafite).
- **29 testes automatizados** · build de produção limpo.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript 5 (strict) · Zustand 5 ·
fast-xml-parser 5 · JSZip · SheetJS (escrita) · Recharts · Lucide ·
react-markdown + remark-gfm · Supabase Auth (opcional) · Google Gemini (opcional) ·
Vitest. Estilo via design tokens em CSS (sem dependência de build de Tailwind).

## Como rodar

```bash
npm install
cp .env.example .env.local   # opcional — veja abaixo
npm run dev                   # http://localhost:3000
```

Sem nenhuma variável de ambiente, a aplicação roda em **modo demonstração**
(sem login) e você pode clicar em **“Carregar dados de exemplo”** na tela de Upload
para testar todo o fluxo.

### Variáveis de ambiente (todas opcionais para testar)

| Variável | Onde | Para quê |
|---|---|---|
| `GEMINI_API_KEY` | servidor | Habilita o Dossiê Tributário (Google AI Studio, Free Tier) |
| `NEXT_PUBLIC_SUPABASE_URL` | público | Habilita login por e-mail/senha |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | Idem |
| `NEXT_PUBLIC_APP_URL` | servidor | Domínio canônico p/ validação de origem em `/api/ai` |

Se as variáveis do Supabase não forem definidas, o login é desativado (modo demo).
Se `GEMINI_API_KEY` não for definida, todo o app funciona, exceto a geração do dossiê.

## Scripts

```bash
npm run dev            # desenvolvimento
npm run build          # build de produção (TypeScript + Next)
npm start              # servir build de produção
npm test               # 29 testes (Vitest)
npm run test:coverage  # cobertura
```

## Estrutura

```
src/
├── domain/models/          Tipos centrais (FiscalDocument, AiContext)
├── infrastructure/parsers/ DocumentDetector, ParserFactory, 4 parsers
├── application/
│   ├── services/           TaxAnalyzer, AiContext (privacidade), Export, Ingest, AiPrompt
│   └── store/              Zustand (documentos em memória, settings persistidas)
├── app/
│   ├── (main)/             Páginas com shell (upload, explorer, analysis, temporal, reports, ai, settings)
│   ├── login/              Autenticação
│   └── api/ai/             Route Handler do dossiê (streaming) + status
├── components/             Sidebar, Header, marca HAPTUS, UploadZone
├── lib/                    utils, cfop, samples, clientes Supabase
└── middleware.ts           Proteção de rotas (Edge, cookie síncrono)
tests/                      29 testes + fixtures XML reais
```

## Deploy (Vercel)

1. Suba o repositório no GitHub e importe no Vercel.
2. Configure as variáveis de ambiente desejadas.
3. `git push` na branch `main` → deploy automático.

## Licença

MIT — veja [LICENSE](./LICENSE).

---

Veja **[ANALISE.md](./ANALISE.md)** para o relatório de falhas e melhorias
identificadas na documentação de origem e implementadas neste projeto.
