import { describe, it, expect } from "vitest";
import { ParserFactory } from "@/infrastructure/parsers/ParserFactory";
import { loadFixture } from "./helpers";

describe("ParserNFSe (padrão nacional SNNFSe)", () => {
  const doc = ParserFactory.parse(loadFixture("nfse_nacional_com_ibs.xml"), "nfse.xml");

  it("identifica NFS-e nacional e prestador RPA", () => {
    expect(doc.document_type).toBe("NFSE");
    expect(doc.tax_regime).toBe("RPA");
    expect(doc.issuer.cnpj_cpf).toBe("22222222000122");
  });

  it("extrai IBS/CBS de tribFed", () => {
    expect(doc.items[0].rtc.vIBS).toBe(200);
    expect(doc.items[0].rtc.vCBS).toBe(180);
    expect(doc.totals.vIBS).toBe(200);
  });

  it("extrai ISS e retenções", () => {
    expect(doc.items[0].taxes_current.iss_rate).toBe(5);
    expect(doc.items[0].taxes_current.iss_value).toBe(100);
    expect(doc.items[0].taxes_current.ir_value).toBe(30);
  });

  it("usa código NBS como cfop e descrição do serviço", () => {
    expect(doc.items[0].cfop).toBe("010701");
    expect(doc.items[0].description).toContain("CONSULTORIA");
    expect(doc.municipality_code).toBe("3550308");
  });
});
