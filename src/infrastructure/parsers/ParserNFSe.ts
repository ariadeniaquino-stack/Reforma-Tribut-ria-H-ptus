import type { IXmlParser } from "./IXmlParser";
import type {
  FiscalDocument,
  FiscalItem,
  RtcFields,
  TaxRegime,
} from "@/domain/models/FiscalDocument";
import { createXmlParser } from "./xmlConfig";
import { num, str } from "@/lib/utils";

function regimeFromOpSimpNac(op: unknown): TaxRegime {
  const c = str(op);
  if (c === "1") return "MEI";
  if (c === "2" || c === "3") return "SIMPLES_NACIONAL";
  if (c === "0") return "RPA";
  return "UNKNOWN";
}

function extractRtc(tribFed: Record<string, unknown> | undefined): RtcFields {
  const ibscbs = tribFed?.["IBSCBS"] as Record<string, unknown> | undefined;
  if (!ibscbs) return {};
  return {
    cst: str(ibscbs["CST"]) || undefined,
    vBC: num(ibscbs["vBC"]),
    vIBS: num(ibscbs["vIBS"]),
    pCBS: num(ibscbs["pCBS"]) || undefined,
    vCBS: num(ibscbs["vCBS"]),
  };
}

export class ParserNFSe implements IXmlParser {
  parse(xml: string, filename: string): FiscalDocument {
    const parser = createXmlParser();
    const root = parser.parse(xml);

    const nfse = root?.NFSe ?? root?.nfse;
    const infNFSe = nfse?.infNFSe ?? root?.infNFSe;
    if (!infNFSe) {
      throw new Error("XML de NFS-e (padrão nacional) inválido: infNFSe ausente.");
    }

    const dps = infNFSe.DPS?.infDPS ?? {};
    const prest = dps.prest ?? {};
    const toma = dps.toma ?? {};
    const serv = dps.serv ?? {};
    const valores = dps.valores ?? {};
    const trib = valores.trib ?? {};
    const tribMun = trib.tribMun?.tribISSQN ?? {};
    const tribFed = trib.tribFed ?? {};
    const retTrib = tribFed.retTrib ?? {};

    const accessKey = str(infNFSe["@_Id"]).replace(/^NFSe/i, "");
    const vServ = num(valores.vServPrest?.vServ);
    const vDescIncond = num(valores.vDescCondIncond?.vDescIncond);
    const rtc = extractRtc(tribFed);

    const item: FiscalItem = {
      item_number: 1,
      description: str(serv.xDescServ) || "Serviço",
      cfop: str(serv.cServ?.cTribNac), // código NBS
      ncm: str(serv.cServ?.cTribMun), // código tributação municipal
      gross_value: vServ,
      discount_value: vDescIncond,
      net_value: vServ - vDescIncond,
      taxes_current: {
        iss_base: num(tribMun.vBC),
        iss_rate: num(tribMun.pAliq),
        iss_value: num(tribMun.vBC) * (num(tribMun.pAliq) / 100),
        iss_retained: str(tribMun.tpRetISSQN) === "2",
        ir_value: num(retTrib.vRetIRRF),
        pis_value: num(retTrib.vRetPIS),
        cofins_value: num(retTrib.vRetCOFINS),
        csll_value: num(retTrib.vRetCSLL),
        inss_value: num(retTrib.vRetINSS),
      },
      rtc,
      rtc_impact: "NONE",
    };

    return {
      access_key: accessKey,
      document_type: "NFSE",
      version: str(nfse?.["@_versao"]) || "1.00",
      issue_date: str(infNFSe.dhEmi),
      purpose: "NORMAL",
      tax_regime: regimeFromOpSimpNac(prest.regTrib?.opSimpNac),
      direction: "UNKNOWN",
      issuer: {
        cnpj_cpf: str(prest.CNPJ || prest.CPF),
        name: str(prest.xNome),
      },
      receiver: {
        cnpj_cpf: str(toma.CNPJ || toma.CPF),
        name: str(toma.xNome) || "—",
      },
      total_value: vServ,
      totals: {
        vISS: num(tribMun.vBC) * (num(tribMun.pAliq) / 100),
        vTotTrib: num(trib.totTrib?.vTotTrib),
        vIBS: rtc.vIBS,
        vCBS: rtc.vCBS,
        vBCIBSCBS: rtc.vBC,
      },
      items: [item],
      status: "VALID",
      municipality_code: str(serv.locPrest?.cLocPrestacao || infNFSe.cLocEmi) || undefined,
      source_filename: filename,
      raw_xml: xml,
    };
  }
}
