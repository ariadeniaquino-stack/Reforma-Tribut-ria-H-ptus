import { describe, it, expect } from "vitest";
import { ParserFactory } from "@/infrastructure/parsers/ParserFactory";
import { loadFixture } from "./helpers";

describe("ParserNFe (NF-e e NFC-e)", () => {
  it("faz parse de NF-e RPA com IBS/CBS", () => {
    const doc = ParserFactory.parse(loadFixture("nfe_rpa_com_ibs.xml"), "nfe.xml");
    expect(doc.document_type).toBe("NFE");
    expect(doc.version).toBe("4.00");
    expect(doc.access_key).toHaveLength(44);
    expect(doc.tax_regime).toBe("RPA");
    expect(doc.issuer.cnpj_cpf).toBe("12345678000190");
    expect(doc.receiver.cnpj_cpf).toBe("98765432000111");
    expect(doc.items).toHaveLength(2);
    expect(doc.total_value).toBe(1500);
    expect(doc.totals.vIBS).toBe(150);
    expect(doc.totals.vCBS).toBe(135);
  });

  it("extrai IBS/CBS por item (UF + Mun)", () => {
    const doc = ParserFactory.parse(loadFixture("nfe_rpa_com_ibs.xml"), "nfe.xml");
    const item = doc.items[0];
    expect(item.rtc.vIBS).toBe(100);
    expect(item.rtc.vIBSUF).toBe(80);
    expect(item.rtc.vIBSMun).toBe(20);
    expect(item.rtc.vCBS).toBe(90);
    expect(item.cfop).toBe("6102");
    expect(item.ncm).toBe("84713012");
  });

  it("NF-e do Simples não destaca IBS/CBS", () => {
    const doc = ParserFactory.parse(loadFixture("nfe_simples_sem_ibs.xml"), "s.xml");
    expect(doc.tax_regime).toBe("SIMPLES_NACIONAL");
    expect(doc.items[0].rtc.vIBS).toBeUndefined();
  });

  it("NFC-e detecta mod 65 e consumidor final", () => {
    const doc = ParserFactory.parse(loadFixture("nfce_consumidor.xml"), "nfce.xml");
    expect(doc.document_type).toBe("NFCE");
    expect(doc.receiver.cnpj_cpf).toBe("CONSUMIDOR_FINAL");
    expect(doc.items[0].rtc.vIBS).toBe(5);
  });
});
