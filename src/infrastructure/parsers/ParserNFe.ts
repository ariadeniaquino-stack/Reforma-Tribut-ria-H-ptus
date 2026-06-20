import type { IXmlParser } from "./IXmlParser";
import type {
  FiscalDocument,
  FiscalItem,
  Purpose,
  RtcFields,
  TaxRegime,
} from "@/domain/models/FiscalDocument";
import { createXmlParser, firstChild } from "./xmlConfig";
import { num, str, toArray } from "@/lib/utils";

const PURPOSE_MAP: Record<string, Purpose> = {
  "1": "NORMAL",
  "2": "COMPLEMENTAR",
  "3": "AJUSTE",
  "4": "DEVOLUCAO",
};

function regimeFromCRT(crt: unknown): TaxRegime {
  const c = str(crt);
  if (c === "1" || c === "2") return "SIMPLES_NACIONAL";
  if (c === "4") return "MEI";
  if (c === "3") return "RPA";
  return "UNKNOWN";
}

/** Extrai os campos IBS/CBS de um nó gIBSCBS (NF-e/NFC-e). */
export function extractRtc(imposto: Record<string, unknown> | undefined): RtcFields {
  const ibscbs = imposto?.["IBSCBS"] as Record<string, unknown> | undefined;
  if (!ibscbs) return {};
  const g = ibscbs["gIBSCBS"] as Record<string, unknown> | undefined;
  const gIBSUF = g?.["gIBSUF"] as Record<string, unknown> | undefined;
  const gIBSMun = g?.["gIBSMun"] as Record<string, unknown> | undefined;
  const gCBS = g?.["gCBS"] as Record<string, unknown> | undefined;

  const vIBSUF = num(gIBSUF?.["vIBSUF"]);
  const vIBSMun = num(gIBSMun?.["vIBSMun"]);
  const vIBSDirect = num(g?.["vIBS"]);

  return {
    cst: str(ibscbs["CST"]) || undefined,
    c_class_trib: str(ibscbs["cClassTrib"]) || undefined,
    vBC: g ? num(g["vBC"]) : undefined,
    pIBSUF: gIBSUF ? num(gIBSUF["pIBSUF"]) : undefined,
    vIBSUF: gIBSUF ? vIBSUF : undefined,
    pIBSMun: gIBSMun ? num(gIBSMun["pIBSMun"]) : undefined,
    vIBSMun: gIBSMun ? vIBSMun : undefined,
    vIBS: vIBSDirect || vIBSUF + vIBSMun || undefined,
    pCBS: gCBS ? num(gCBS["pCBS"]) : undefined,
    vCBS: gCBS ? num(gCBS["vCBS"]) : undefined,
  };
}

export class ParserNFe implements IXmlParser {
  parse(xml: string, filename: string): FiscalDocument {
    const parser = createXmlParser((name) => name === "det");
    const root = parser.parse(xml);

    const nfe = root?.nfeProc?.NFe ?? root?.NFe ?? root?.nfeProc?.nfe;
    const infNFe = nfe?.infNFe;
    if (!infNFe) {
      throw new Error("XML de NF-e/NFC-e inválido: infNFe ausente.");
    }

    const ide = infNFe.ide ?? {};
    const emit = infNFe.emit ?? {};
    const dest = infNFe.dest ?? {};
    const total = infNFe.total?.ICMSTot ?? {};
    const ibscbsTot = infNFe.total?.IBSCBSTot ?? {};

    const modelo = str(ide.mod);
    const documentType = modelo === "65" ? "NFCE" : "NFE";

    const accessKey = str(infNFe["@_Id"]).replace(/^NFe/i, "");
    const version = str(infNFe["@_versao"]) || "4.00";

    const items: FiscalItem[] = toArray(infNFe.det).map((det: any, i: number) => {
      const prod = det?.prod ?? {};
      const imposto = det?.imposto ?? {};
      const rtc = extractRtc(imposto);
      const icms = firstChild(imposto?.ICMS);
      const gross = num(prod.vProd);
      const disc = num(prod.vDesc);
      return {
        item_number: num(det?.["@_nItem"]) || i + 1,
        description: str(prod.xProd),
        cfop: str(prod.CFOP),
        ncm: str(prod.NCM),
        gross_value: gross,
        discount_value: disc,
        net_value: gross - disc,
        taxes_current: {
          icms_cst: str(icms?.["CST"] ?? icms?.["CSOSN"]) || undefined,
          icms_base: icms ? num(icms["vBC"]) : undefined,
          icms_value: icms ? num(icms["vICMS"]) : undefined,
        },
        rtc,
        rtc_impact: "NONE",
      } as FiscalItem;
    });

    // NFC-e: destinatário opcional → consumidor final
    const hasDest = dest && (dest.CNPJ || dest.CPF || dest.xNome);
    const receiver = hasDest
      ? {
          cnpj_cpf: str(dest.CNPJ || dest.CPF),
          name: str(dest.xNome) || "CONSUMIDOR FINAL",
          uf: str(dest.enderDest?.UF) || undefined,
        }
      : { cnpj_cpf: "CONSUMIDOR_FINAL", name: "CONSUMIDOR FINAL" };

    return {
      access_key: accessKey,
      document_type: documentType,
      version,
      issue_date: str(ide.dhEmi || ide.dEmi),
      purpose: PURPOSE_MAP[str(ide.finNFe)] ?? "NORMAL",
      tax_regime: regimeFromCRT(emit.CRT),
      direction: "UNKNOWN",
      issuer: {
        cnpj_cpf: str(emit.CNPJ || emit.CPF),
        name: str(emit.xNome),
        uf: str(emit.enderEmit?.UF) || undefined,
      },
      receiver,
      total_value: num(total.vNF),
      totals: {
        vProd: num(total.vProd),
        vDesc: num(total.vDesc),
        vFrete: num(total.vFrete),
        vTotTrib: num(total.vTotTrib),
        vICMS: num(total.vICMS),
        vPIS: num(total.vPIS),
        vCOFINS: num(total.vCOFINS),
        vBCIBSCBS: num(ibscbsTot?.vBCIBSCBS),
        vIBS: num(ibscbsTot?.gIBS?.vIBS ?? ibscbsTot?.vIBS),
        vCBS: num(ibscbsTot?.gCBS?.vCBS ?? ibscbsTot?.vCBS),
      },
      items,
      status: "VALID",
      source_filename: filename,
      raw_xml: xml,
    };
  }
}
