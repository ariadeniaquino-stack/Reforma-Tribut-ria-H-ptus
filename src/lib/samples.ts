// Amostras de XMLs para demonstração (permite testar sem arquivos próprios).
// Empresa analisada nas amostras: "COMERCIO BETA LTDA" (CNPJ 98765432000111).

const NFE_RPA = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00"><NFe><infNFe Id="NFe35260312345678000190550010000000011000000017" versao="4.00">
<ide><mod>55</mod><dhEmi>2026-03-15T10:00:00-03:00</dhEmi><finNFe>1</finNFe></ide>
<emit><CNPJ>12345678000190</CNPJ><xNome>INDUSTRIA ALFA LTDA</xNome><enderEmit><UF>SP</UF></enderEmit><CRT>3</CRT></emit>
<dest><CNPJ>98765432000111</CNPJ><xNome>COMERCIO BETA LTDA</xNome><enderDest><UF>RJ</UF></enderDest></dest>
<det nItem="1"><prod><xProd>MATERIA PRIMA</xProd><CFOP>6102</CFOP><NCM>84713012</NCM><vProd>10000.00</vProd><vDesc>0.00</vDesc></prod>
<imposto><ICMS><ICMS00><CST>00</CST><vBC>10000.00</vBC><vICMS>1800.00</vICMS></ICMS00></ICMS>
<IBSCBS><CST>001</CST><gIBSCBS><vBC>10000.00</vBC><gIBSUF><pIBSUF>8.00</pIBSUF><vIBSUF>800.00</vIBSUF></gIBSUF>
<gIBSMun><pIBSMun>2.00</pIBSMun><vIBSMun>200.00</vIBSMun></gIBSMun><vIBS>1000.00</vIBS><gCBS><pCBS>9.00</pCBS><vCBS>900.00</vCBS></gCBS></gIBSCBS></IBSCBS></imposto></det>
<total><ICMSTot><vProd>10000.00</vProd><vNF>10000.00</vNF></ICMSTot><IBSCBSTot><vBCIBSCBS>10000.00</vBCIBSCBS><gIBS><vIBS>1000.00</vIBS></gIBS><gCBS><vCBS>900.00</vCBS></gCBS></IBSCBSTot></total>
</infNFe></NFe></nfeProc>`;

const NFE_VENDA = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00"><NFe><infNFe Id="NFe33260498765432000111550010000000091000000098" versao="4.00">
<ide><mod>55</mod><dhEmi>2026-04-12T14:00:00-03:00</dhEmi><finNFe>1</finNFe></ide>
<emit><CNPJ>98765432000111</CNPJ><xNome>COMERCIO BETA LTDA</xNome><enderEmit><UF>RJ</UF></enderEmit><CRT>3</CRT></emit>
<dest><CNPJ>44444444000144</CNPJ><xNome>CLIENTE EMPRESA LTDA</xNome><enderDest><UF>RJ</UF></enderDest></dest>
<det nItem="1"><prod><xProd>PRODUTO ACABADO</xProd><CFOP>5102</CFOP><NCM>84713012</NCM><vProd>18000.00</vProd><vDesc>0.00</vDesc></prod>
<imposto><ICMS><ICMS00><CST>00</CST><vBC>18000.00</vBC><vICMS>3240.00</vICMS></ICMS00></ICMS>
<IBSCBS><CST>001</CST><gIBSCBS><vBC>18000.00</vBC><gIBSUF><pIBSUF>8.00</pIBSUF><vIBSUF>1440.00</vIBSUF></gIBSUF>
<gIBSMun><pIBSMun>2.00</pIBSMun><vIBSMun>360.00</vIBSMun></gIBSMun><vIBS>1800.00</vIBS><gCBS><pCBS>9.00</pCBS><vCBS>1620.00</vCBS></gCBS></gIBSCBS></IBSCBS></imposto></det>
<total><ICMSTot><vProd>18000.00</vProd><vNF>18000.00</vNF></ICMSTot><IBSCBSTot><vBCIBSCBS>18000.00</vBCIBSCBS><gIBS><vIBS>1800.00</vIBS></gIBS><gCBS><vCBS>1620.00</vCBS></gCBS></IBSCBSTot></total>
</infNFe></NFe></nfeProc>`;

const CTE = `<?xml version="1.0" encoding="UTF-8"?>
<cteProc versao="3.00"><CTe><infCte Id="CTe35260555555555000155570010000000041000000042" versao="3.00">
<ide><CFOP>6352</CFOP><dhEmi>2026-03-20T14:00:00-03:00</dhEmi><finCTe>0</finCTe></ide>
<emit><CNPJ>55555555000155</CNPJ><xNome>TRANSPORTADORA GAMA LTDA</xNome><enderEmit><UF>SP</UF></enderEmit><CRT>3</CRT></emit>
<rem><CNPJ>12345678000190</CNPJ><xNome>INDUSTRIA ALFA LTDA</xNome></rem>
<dest><CNPJ>98765432000111</CNPJ><xNome>COMERCIO BETA LTDA</xNome><enderDest><UF>RJ</UF></enderDest></dest>
<vPrest><vTPrest>600.00</vTPrest><Comp><xNome>Frete Peso</xNome><vComp>550.00</vComp></Comp><Comp><xNome>Pedagio</xNome><vComp>50.00</vComp></Comp></vPrest>
<imp><vTotTrib>108.00</vTotTrib><IBSCBS><CST>001</CST><gIBSCBS><vBC>600.00</vBC><vIBS>60.00</vIBS><gCBS><pCBS>9.00</pCBS><vCBS>54.00</vCBS></gCBS></gIBSCBS></IBSCBS></imp>
</infCte></CTe></cteProc>`;

const NFE_SIMPLES = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00"><NFe><infNFe Id="NFe35260411111111000111550010000000021000000028" versao="4.00">
<ide><mod>55</mod><dhEmi>2026-04-10T09:00:00-03:00</dhEmi><finNFe>1</finNFe></ide>
<emit><CNPJ>11111111000111</CNPJ><xNome>FORNECEDOR SIMPLES ME</xNome><enderEmit><UF>SP</UF></enderEmit><CRT>1</CRT></emit>
<dest><CNPJ>98765432000111</CNPJ><xNome>COMERCIO BETA LTDA</xNome><enderDest><UF>SP</UF></enderDest></dest>
<det nItem="1"><prod><xProd>MATERIAL DE CONSUMO</xProd><CFOP>5102</CFOP><NCM>48201000</NCM><vProd>1200.00</vProd><vDesc>0.00</vDesc></prod>
<imposto><ICMS><ICMSSN102><CSOSN>102</CSOSN></ICMSSN102></ICMS></imposto></det>
<total><ICMSTot><vProd>1200.00</vProd><vNF>1200.00</vNF></ICMSTot></total>
</infNFe></NFe></nfeProc>`;

const NFE_INCONFORME = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00"><NFe><infNFe Id="NFe35260577777777000177550010000000051000000059" versao="4.00">
<ide><mod>55</mod><dhEmi>2026-05-18T08:00:00-03:00</dhEmi><finNFe>1</finNFe></ide>
<emit><CNPJ>77777777000177</CNPJ><xNome>FORNECEDOR NORMAL LTDA</xNome><enderEmit><UF>MG</UF></enderEmit><CRT>3</CRT></emit>
<dest><CNPJ>98765432000111</CNPJ><xNome>COMERCIO BETA LTDA</xNome><enderDest><UF>SP</UF></enderDest></dest>
<det nItem="1"><prod><xProd>INSUMO SEM DESTAQUE IBS</xProd><CFOP>6102</CFOP><NCM>84713012</NCM><vProd>4000.00</vProd><vDesc>0.00</vDesc></prod>
<imposto><ICMS><ICMS00><CST>00</CST><vBC>4000.00</vBC><vICMS>720.00</vICMS></ICMS00></ICMS></imposto></det>
<total><ICMSTot><vProd>4000.00</vProd><vNF>4000.00</vNF></ICMSTot></total>
</infNFe></NFe></nfeProc>`;

const NFSE = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00"><infNFSe Id="NFSe35012345678000190000000000051">
<nNFSe>51</nNFSe><cLocEmi>3550308</cLocEmi><dhEmi>2026-04-25T11:00:00-03:00</dhEmi><tpEmit>1</tpEmit>
<DPS><infDPS><prest><CNPJ>22222222000122</CNPJ><IM>123456</IM><xNome>CONSULTORIA DELTA LTDA</xNome><regTrib><opSimpNac>0</opSimpNac></regTrib></prest>
<toma><CNPJ>98765432000111</CNPJ><xNome>COMERCIO BETA LTDA</xNome></toma>
<serv><locPrest><cLocPrestacao>3550308</cLocPrestacao></locPrest><cServ><cTribNac>010701</cTribNac><cTribMun>01234</cTribMun></cServ><xDescServ>SERVICOS DE CONSULTORIA</xDescServ></serv>
<valores><vServPrest><vServ>3000.00</vServ></vServPrest><vDescCondIncond><vDescIncond>0.00</vDescIncond></vDescCondIncond>
<trib><tribMun><tribISSQN><vBC>3000.00</vBC><pAliq>5.00</pAliq><tpRetISSQN>1</tpRetISSQN></tribISSQN></tribMun>
<tribFed><IBSCBS><CST>001</CST><vBC>3000.00</vBC><pIBS>10.00</pIBS><vIBS>300.00</vIBS><pCBS>9.00</pCBS><vCBS>270.00</vCBS></IBSCBS></tribFed>
<totTrib><vTotTrib>570.00</vTotTrib></totTrib></trib></valores></infDPS></DPS></infNFSe></NFSe>`;

const SAMPLES: Array<{ name: string; xml: string }> = [
  { name: "nfe-compra-insumo.xml", xml: NFE_RPA },
  { name: "nfe-venda-cliente.xml", xml: NFE_VENDA },
  { name: "cte-frete-entrada.xml", xml: CTE },
  { name: "nfe-compra-simples.xml", xml: NFE_SIMPLES },
  { name: "nfe-fornecedor-inconforme.xml", xml: NFE_INCONFORME },
  { name: "nfse-servico-consultoria.xml", xml: NFSE },
];

export function getSampleFiles(): File[] {
  return SAMPLES.map(
    ({ name, xml }) => new File([xml], name, { type: "text/xml" }),
  );
}
