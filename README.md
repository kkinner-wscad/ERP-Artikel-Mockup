# ERP-Artikel-Mockup

Eigenständige Testoberfläche für die Integration eines führenden ERP-Systems mit der WSCAD ELECTRIX API.

## Funktionsumfang

- Artikel suchen, filtern und im Mock-Modus bearbeiten
- Validate- und Upsert-Abläufe für einzelne Artikel simulieren
- Bulk-Upsert inklusive Task-Fortschritt und Einzelresultaten testen
- vorhandenen Materiallisten-Report als Ausgangspunkt für einen ERP-Stücklistenworkflow verwenden
- vorhandene Endpoints im Live-Modus gegen eine lokale ELECTRIX-Instanz aufrufen
- geplante Parts-Endpoints anhand des Overlay-Vertrags simulieren
- Mock- und Live-Modus klar voneinander trennen

## Start

`ERP-Artikel-Mockup-starten.cmd` doppelklicken oder im Projektordner `pnpm dev` ausführen. Anschließend `http://localhost:3000` öffnen. Ist Port 3000 belegt, zeigt die Konsole den verwendeten Ersatzport an.

## Sicherheit

Die lokale Proxy-Route akzeptiert ausschließlich `localhost`, `127.0.0.1` oder `::1` und nur Pfade unter `/api/v1/`. Der Bearer-Token wird nicht in Dateien gespeichert.

## Verträge und Quellen

- `contracts/wscad-existing.openapi.json`: vorhandene WSCAD-OpenAPI
- `contracts/electrix-parts-overlay.openapi.yaml`: für das ERP-Szenario geplante Endpoints
- `docs/quellen/WSCAD-Artikel-API-Direkte-Datenbankintegration.md`: fachliche Ausgangsanforderung
- `docs/Materiallisten-Workflow.md`: Stücklistenübergabe und offene API-Frage

## Materiallisten-Workflow

Der vorhandene Endpoint `POST /api/v1/reports/generate-material-list-excel-report` startet die Reporterzeugung und liefert `TaskDetails`. Da die OpenAPI keine Struktur für den erzeugten Dateiverweis dokumentiert, simuliert der Mockup die anschließende ERP-Übernahme. Für einen vollständig automatisierten Live-Betrieb wird ein abrufbarer Report-Artefakt-Verweis oder ein strukturierter Stücklisten-Endpoint benötigt.
