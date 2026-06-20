import { describe, it, expect } from "vitest";
import { DocumentDetector } from "@/infrastructure/parsers/DocumentDetector";
import { loadFixture } from "./helpers";

describe("DocumentDetector", () => {
  it("detecta NF-e (mod 55)", () => {
    expect(DocumentDetector.detect(loadFixture("nfe_rpa_com_ibs.xml"))).toBe("NFE");
  });
  it("detecta NFC-e (mod 65)", () => {
    expect(DocumentDetector.detect(loadFixture("nfce_consumidor.xml"))).toBe("NFCE");
  });
  it("detecta CT-e", () => {
    expect(DocumentDetector.detect(loadFixture("cte_rpa_com_ibs.xml"))).toBe("CTE");
  });
  it("detecta NFS-e nacional", () => {
    expect(DocumentDetector.detect(loadFixture("nfse_nacional_com_ibs.xml"))).toBe("NFSE");
  });
  it("retorna UNKNOWN para ABRASF municipal", () => {
    const abrasf = `<?xml version="1.0"?><CompNfse><Nfse><InfNfse><Numero>1</Numero></InfNfse></Nfse></CompNfse>`;
    expect(DocumentDetector.detect(abrasf)).toBe("UNKNOWN");
  });
  it("retorna UNKNOWN para vazio", () => {
    expect(DocumentDetector.detect("")).toBe("UNKNOWN");
  });
});
