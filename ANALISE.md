# Análise de Falhas e Melhorias — Simples Apuração RTC

Este documento registra a análise crítica das especificações fornecidas
(`PROMPT_INICIO_PROJETO.md`, `ROADMAP.md`, `SPEC_ARCHITECTURE_v3.md`,
`SPEC_BUSINESS_RULES.md`, `SPEC_XML_MAPPING_v2.md`) e o que foi decidido na
implementação a partir delas. Para HAPTUS Assessoria Contábil · Junho/2026.

---

## 1. Falhas e inconsistências encontradas na documentação

### 1.1 Contradição sobre o que determina crédito/débito (crítica)

A `SPEC_BUSINESS_RULES` (§4) trazia tabelas em que o **CFOP** determinava o impacto
(SALE → débito, RETURN → crédito etc.), enquanto a `SPEC_XML_MAPPING_v2` corrigia esse
modelo logo na abertura, afirmando que o **único driver é a direção** (INBOUND/OUTBOUND)
e que o CFOP só serve para excluir operações não-comerciais. As duas regras coexistiam
nos documentos e poderiam levar duas pessoas a implementar lógicas diferentes.

**Decisão adotada:** seguimos o modelo corrigido (mais recente e correto à luz da
não-cumulatividade plena da LC 214/2025). O `TaxAnalyzerService.impactFor` usa direção
como driver; o CFOP entra apenas em `isExcludedCfop` (remessas, brindes, exportação).
A categorização de CFOP permanece como metadado informativo na exportação.

### 1.2 Coerção numérica corromperia dados fiscais (bug real, corrigido)

A configuração sugerida do parser previa `parseTagValue`/`parseAttributeValue` ativados.
Na prática, isso converte para `number` campos que **precisam ser string**: a chave de
acesso de 44 dígitos vira notação científica (perde precisão), CNPJs perdem zeros à
esquerda, e códigos como CFOP/NBS/NCM (`010701`) perdem o zero inicial. Detectamos isso
nos testes e **desativamos a coerção** — todos os valores são lidos como string e
convertidos explicitamente por `num()` onde é seguro. Esta é a “armadilha” mais cara que
o projeto teria em produção.

### 1.3 Modelo de domínio com tipos duplicados/ausentes

A `SPEC_XML_MAPPING_v2` (Parte 5) já apontava que `DocumentType` precisava de `NFCE`,
`TaxRegime` precisava de `MEI` e havia uma duplicata de `RPA` a remover. Implementamos os
tipos já consolidados (`'NFE' | 'NFCE' | 'CTE' | 'NFSE' | 'UNKNOWN'` e
`'SIMPLES_NACIONAL' | 'MEI' | 'RPA' | 'UNKNOWN'`).

### 1.4 Identificação do declarante não estava especificada

Toda a lógica de direção depende de saber **qual CNPJ é o da empresa analisada**, mas
nenhum documento definia como descobri-lo a partir de um lote de XMLs. Implementamos a
heurística “raiz de CNPJ (8 dígitos) mais frequente no lote” (`determineOwnerRoot`).
Funciona bem para lotes de uma única empresa — que é o escopo do MVP — mas **classifica
errado lotes com múltiplas empresas misturadas**. Isso conecta diretamente ao Sprint 8
(multi-empresa) do ROADMAP e está sinalizado como limitação conhecida.

### 1.5 Detecção de NFS-e ambígua por causa de namespace

O regex sugerido `/<infNFSe/i` colide, sem distinção de maiúsculas, com o `<InfNfse>` do
padrão ABRASF antigo — que deve ser rejeitado. Reordenamos a detecção para descartar
ABRASF (`<CompNfse>`) **antes** e identificar o padrão nacional pelo namespace
`sped.fazenda.gov.br/nfse` ou pela presença do nó `DPS`.

---

## 2. Riscos de segurança e dependências

| Item | Situação na spec | Ação adotada |
|---|---|---|
| `next@15.5.0` | versão fixada | Tem CVE-2025-66478. **Recomenda-se subir para o patch 15.5.x** mais recente antes de publicar. |
| `xlsx` (SheetJS) | ADR-10 mantinha (CVE de prototype pollution) | Mitigado: usamos **apenas escrita** (`XLSX.writeFile`/`sheet_to_csv`), nunca leitura. Migrar para `ExcelJS` continua recomendado (Sprint 7). |
| XXE / Billion Laughs | citados como seguros | Reforçado com `processEntities: false` explícito no parser. |
| CSRF em `/api/ai` | “parcial” (token p/ v2) | Mantido: validação de origem (`*.vercel.app`, `localhost`, `APP_URL`) + limite de payload de 20 KB. Token CSRF segue como recomendação. |
| Verificação de sessão no middleware | `cookie.name.includes('-auth-token')` | Mantida por ser síncrona e compatível com Edge, **mas é heurística** — não valida a assinatura do token. Adequada para uso interno; para acesso público, validar o JWT server-side. |
| Headers HTTP | definidos | Implementados em `next.config.ts` (X-Frame-Options, HSTS, etc.). CSP ainda não incluída (Sprint 7). |

---

## 3. Decisões de implementação que divergem da spec (e por quê)

- **Tipografia (@fontsource):** trocada por uma stack de fallback do sistema
  (`Outfit`/`IBM Plex Mono` quando disponíveis, senão `system-ui`). Motivo: robustez de
  build offline. Reintroduzir `@fontsource` é trivial se a fidelidade tipográfica for
  desejada — basta adicionar as dependências e importar os CSS no `layout.tsx`.
- **Tailwind:** a spec já indicava “uso mínimo — estilos via inline”. Optamos por um
  design system próprio em `globals.css` (tokens CSS), eliminando a dependência do
  pipeline do Tailwind 4. Resultado: menos superfície de build e controle total do visual
  HAPTUS.
- **IA (Gemini):** mantida conforme ADR-04. A chave fica só no servidor; o módulo degrada
  graciosamente quando ausente (o restante do app funciona normalmente).
- **Login opcional:** quando o Supabase não está configurado, o middleware libera o acesso
  (modo demonstração). Isso permite testar 100% do produto sem nenhuma infraestrutura.

---

## 4. Melhorias entregues além do documentado

- **Modo demonstração com dados de exemplo** embutidos (6 documentos representando
  compra com crédito, venda com débito, frete de entrada, fornecedor Simples, fornecedor
  inconforme e serviço de NFS-e) — permite avaliar todo o fluxo sem arquivos próprios.
- **Auditoria de privacidade testável** (`auditContextPrivacy`) que varre o contexto da IA
  procurando qualquer CNPJ, nome ou chave dos documentos — com teste de sanidade que
  injeta um vazamento proposital para garantir que o auditor realmente detecta.
- **Conformidade com premissas explícitas na UI** (pré-2026, Simples sem destaque,
  CFOP não-comercial), conforme exigido pela `SPEC_BUSINESS_RULES` §8.

---

## 5. Próximos passos recomendados (prioridade)

1. **Subir o `next` para o patch sem CVE** antes de publicar em produção.
2. **Multi-empresa (Sprint 8):** permitir o usuário escolher o CNPJ declarante quando o
   lote tiver mais de uma raiz, em vez de depender só da heurística de frequência.
3. **CSP + token CSRF** (Sprint 7) para endurecer o `/api/ai`.
4. **Migrar `xlsx` → `ExcelJS`** para eliminar de vez o CVE de prototype pollution.
5. **Cobertura de NFS-e municipais (ABRASF)** se algum cliente ainda emitir nesse padrão —
   hoje retornam `UNKNOWN` com mensagem explicativa.

---

## 6. Estado de qualidade nesta entrega

- ✅ `npm test` — **29 testes passando** (4 parsers, detector, apuração, privacidade da IA).
- ✅ `npm run build` — **limpo** (TypeScript strict, 14 rotas, middleware ativo).
- ✅ Servidor de produção sobe e serve as páginas com a identidade HAPTUS.
- ✅ Sem segredos no código; chave do Gemini apenas no servidor.
