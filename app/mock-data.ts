export type PartStatus = "Aktiv" | "Freigabe ausstehend" | "Abgekündigt" | "Konflikt";

export type Part = {
  id: number;
  partNumber: string;
  externalId: string;
  name: string;
  manufacturer: string;
  category: string;
  price: number;
  currency: string;
  revision: string;
  status: PartStatus;
  changedAt: string;
};

export const initialParts: Part[] = [
  { id: 84512, partNumber: "2904602", externalId: "MAT-2904602", name: "QUINT Stromversorgung 24 V / 10 A", manufacturer: "Phoenix Contact", category: "Stromversorgung", price: 134.9, currency: "EUR", revision: "B", status: "Aktiv", changedAt: "Heute, 10:41" },
  { id: 84513, partNumber: "10001", externalId: "SAP-10001", name: "Leistungsschütz 3-polig", manufacturer: "Siemens", category: "Schaltgerät", price: 48.2, currency: "EUR", revision: "A", status: "Freigabe ausstehend", changedAt: "Heute, 10:36" },
  { id: 84514, partNumber: "A9F04216", externalId: "MAT-A9F04216", name: "Leitungsschutzschalter C16", manufacturer: "Schneider Electric", category: "Schutzgerät", price: 12.7, currency: "EUR", revision: "03", status: "Aktiv", changedAt: "Heute, 09:58" },
  { id: 84515, partNumber: "750-8212", externalId: "ERP-7508212", name: "Controller PFC200", manufacturer: "WAGO", category: "Steuerung", price: 486, currency: "EUR", revision: "C", status: "Konflikt", changedAt: "Gestern, 16:22" },
  { id: 84516, partNumber: "3RV2011-1GA10", externalId: "SAP-3RV2011", name: "Motorschutzschalter 4,5–6,3 A", manufacturer: "Siemens", category: "Motorschutz", price: 71.4, currency: "EUR", revision: "02", status: "Abgekündigt", changedAt: "Gestern, 14:08" },
  { id: 84517, partNumber: "PLC-RSC-24DC/21", externalId: "MAT-PLC-RSC", name: "Relaismodul 24 V DC", manufacturer: "Phoenix Contact", category: "Relais", price: 18.35, currency: "EUR", revision: "A", status: "Aktiv", changedAt: "26.08., 17:31" },
];

export const projects = [
  { id: "b52213e5-b67d-43c8-8aaa-a1ac7b711ad2", number: "P-2026-0815", name: "Verpackungslinie Süd", customer: "Muster Maschinenbau GmbH", state: "Aktiv" },
  { id: "ab9b3bf0-1c83-47f5-8870-90a878aae513", number: "P-2026-0798", name: "Schaltschrank Retrofit", customer: "Beispiel AG", state: "Bereit" },
  { id: "ee9f0508-d345-4984-a279-84d901399b36", number: "P-2026-0762", name: "Förderanlage Halle 4", customer: "Logistik Nord GmbH", state: "Bereit" },
];

export const bomItems = [
  { position: "10", partNumber: "2904602", description: "QUINT Stromversorgung 24 V / 10 A", quantity: 2, unit: "Stk", price: 134.9 },
  { position: "20", partNumber: "A9F04216", description: "Leitungsschutzschalter C16", quantity: 8, unit: "Stk", price: 12.7 },
  { position: "30", partNumber: "PLC-RSC-24DC/21", description: "Relaismodul 24 V DC", quantity: 16, unit: "Stk", price: 18.35 },
  { position: "40", partNumber: "750-8212", description: "Controller PFC200", quantity: 1, unit: "Stk", price: 486 },
];

export const endpointCatalog = [
  ["GET", "/api/v1/parts", "Vorhanden", "Artikel filtern und seitenweise laden"],
  ["GET", "/api/v1/parts/search", "Vorhanden", "Interaktive Artikelsuche"],
  ["GET", "/api/v1/parts/usage", "Vorhanden", "Verwendung eines Artikels ermitteln"],
  ["GET", "/api/v1/tasks/{id}", "Vorhanden", "Asynchronen Task verfolgen"],
  ["POST", "/api/v1/reports/generate-material-list-excel-report", "Vorhanden", "Materiallisten-Excel-Report erzeugen"],
  ["GET", "/api/v1/parts/{partId}", "Geplant", "Vollständigen Artikel lesen"],
  ["POST", "/api/v1/parts/validate", "Geplant", "Artikel prüfen, ohne zu speichern"],
  ["POST", "/api/v1/parts/upsert", "Geplant", "Artikel anhand des Business-Key schreiben"],
  ["POST", "/api/v1/parts/batch/upsert", "Geplant", "Mehrere Artikel asynchron verarbeiten"],
  ["GET", "/api/v1/parts/changes", "Geplant", "Änderungen über Cursor abrufen"],
  ["POST", "/api/v1/parts/{partId}/approve", "Geplant", "Artikel fachlich freigeben"],
  ["PATCH", "/api/v1/parts/{partId}/lifecycle", "Geplant", "Lifecycle und Revision ändern"],
  ["POST", "/api/v1/parts/replacements/preview", "Geplant", "Artikelersetzung prüfen"],
  ["GET", "/api/v1/business-partners", "Geplant", "Hersteller und Lieferanten suchen"],
  ["GET", "/api/v1/part-database/status", "Geplant", "Provider und Schreibfähigkeit prüfen"],
] as const;
