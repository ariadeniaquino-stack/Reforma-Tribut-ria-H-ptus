import { XMLParser } from "fast-xml-parser";

/**
 * Configuração endurecida do fast-xml-parser.
 * - processEntities:false → mitiga XXE / Billion Laughs (não expande entidades).
 * - removeNSPrefix:true   → remove prefixos de namespace (essencial p/ NFS-e).
 */
export function createXmlParser(
  isArray?: (name: string) => boolean,
): XMLParser {
  const options: Record<string, unknown> = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
    removeNSPrefix: true,
    processEntities: false,
  };
  if (isArray) options.isArray = (name: string) => isArray(name);
  return new XMLParser(options);
}

/** Retorna o primeiro filho de um grupo (ex.: ICMS00, ICMS20...). */
export function firstChild(node: unknown): Record<string, unknown> | undefined {
  if (!node || typeof node !== "object") return undefined;
  const values = Object.values(node as Record<string, unknown>);
  const obj = values.find((v) => v && typeof v === "object");
  return obj as Record<string, unknown> | undefined;
}
