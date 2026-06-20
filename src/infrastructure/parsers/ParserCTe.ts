import type { IXmlParser } from "./IXmlParser";
import type {
  FiscalDocument,
  FiscalItem,
  Purpose,
  RtcFields,
  TaxRegime,
} from "@/domain/models/FiscalDocument";
import { createXmlParser } from "./xmlConfig";
import { num, str, toArray } from "@/lib/utils";

const PURPOSE_MAP: Record<string, Purpose> = {
  "0": "NORMAL",
  "1": "COMPLEMENTAR",
  "2": "AJUSTE",
  "3": "NORMAL",
};

function regimeFromCRT(crt: unknown): TaxRegime {
  const c = str(crt);
  if (c === "1" || c === "2") return "SIMPLES_NACIONAL";
  if (c === "4") return "MEI";
  if (c === "3") return "RPA";
  return "UNKNOWN";
}

function extractRtcDoc(imp: Record<string, unknown> | undefined): RtcFields {
  const ibscbs = imp?.["IBSCBS"] as Record<string, unknown> | undefined;
  const g = ibscbs?.["gIBSCBS"] as Record<string, unknown> | undefined;
  if (!g) return {};
  const gCBS = g["gCBS"] as Record<string, unknown> | undefined;
  return {
    cst: str(ibscbs?.["CST"]) || undefined,
    vBC: num(g["vBC"]),
    vIBS: num(g["vIBS"]),
    pCBS: gCBS ? num(gCBS["pCBS"]) : undefined,
    vCBS: gCBS ? num(gCBS["vCBS"]) : undefined,
  };
}

export class ParserCTe implements IXmlParser {
  parse(xml: string, filename: string): FiscalDocument {
    const parser = createXmlParser(
      (name) => name === "Comp" || name === "infNFe",
    );
    const root = parser.parse(xml);

    const cte = root?.cteProc?.CTe ?? root?.CTe;
    const infCte = cte?.infCte;
    if (!infCte) throw new Error("XML de CT-e inválido: infCte ausente.");

    const ide = infCte.ide ?? {};
    const emit = infCte.emit ?? {};
    const rem = infCte.rem ?? {};
    const dest = infCte.dest ?? {};
    const imp = infCte.imp ?? {};
    const vPrest = infCte.vPrest ?? {};

    const accessKey = str(infCte["@_Id"]).replace(/^CTe/i, "");
    const rtc = extractRtcDoc(imp);
    const cfop = str(ide.CFOP);

    const comps = toArray(vPrest.Comp);
    const items: FiscalItem[] = (comps.length ? comps : [{ xNome: "Prestação de Serviço", vComp: vPrest.vTPrest }]).map(
      (c: any, i: number) => ({
        item_number: i + 1,
        description: str(c.xNome) || "Componente de Frete",
        cfop,
        ncm: "N/A",
        gross_value: num(c.vComp),
        discount_value: 0,
        net_value: num(c.vComp),
        taxes_current: {},
        // Tributos do CT-e são do documento inteiro → apenas no items[0].
        rtc: i === 0 ? rtc : {},
        rtc_impact: "NONE",
      }),
    );

    const referenced = toArray(infCte.infCTeNorm?.infDoc?.infNFe)
      .map((n: any) => str(n.chave))
      .filter(Boolean);

    return {
      access_key: accessKey,
      document_type: "CTE",
      version: str(infCte["@_versao"]) || "3.00",
      issue_date: str(ide.dhEmi),
      purpose: PURPOSE_MAP[str(ide.finCTe)] ?? "NORMAL",
      tax_regime: regimeFromCRT(emit.CRT),
      direction: "UNKNOWN",
      issuer: {
        cnpj_cpf: str(emit.CNPJ || emit.CPF),
        name: str(emit.xNome),
        uf: str(emit.enderEmit?.UF) || undefined,
      },
      receiver: {
        cnpj_cpf: str(dest.CNPJ || dest.CPF),
        name: str(dest.xNome),
        uf: str(dest.enderDest?.UF) || undefined,
      },
      sender: {
        cnpj_cpf: str(rem.CNPJ || rem.CPF),
        name: str(rem.xNome),
      },
      total_value: num(vPrest.vTPrest),
      totals: {
        vTotTrib: num(imp.vTotTrib),
        vBCIBSCBS: rtc.vBC,
        vIBS: rtc.vIBS,
        vCBS: rtc.vCBS,
      },
      items,
      status: "VALID",
      source_filename: filename,
      referenced_keys: referenced.length ? referenced : undefined,
      raw_xml: xml,
    };
  }
}
