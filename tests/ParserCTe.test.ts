import { describe, it, expect } from "vitest";
import { ParserFactory } from "@/infrastructure/parsers/ParserFactory";
import { loadFixture } from "./helpers";

describe("ParserCTe", () => {
  const doc = ParserFactory.parse(loadFixture("cte_rpa_com_ibs.xml"), "cte.xml");

  it("identifica CT-e v3.00", () => {
    expect(doc.document_type).toBe("CTE");
    expect(doc.version).toBe("3.00");
    expect(doc.access_key).toHaveLength(44);
  });

  it("extrai IBS/CBS no nível do documento", () => {
    expect(doc.totals.vIBS).toBe(30);
    expect(doc.totals.vCBS).toBe(27);
    expect(doc.total_value).toBe(300);
  });

  it("componentes do frete viram itens; tributos só no items[0]", () => {
    expect(doc.items).toHaveLength(2);
    expect(doc.items[0].rtc.vIBS).toBe(30);
    expect(doc.items[1].rtc.vIBS).toBeUndefined();
    expect(doc.items[0].description).toBe("Frete Peso");
  });

  it("captura chave NF-e referenciada", () => {
    expect(doc.referenced_keys?.[0]).toHaveLength(44);
  });
});
