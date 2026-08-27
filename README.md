# ERP Control – ELECTRIX API POC/MVP

Eigenständige, lokal laufende Oberfläche für die direkte Integration eines führenden ERP-Systems mit der WSCAD ELECTRIX API. Es gibt keinen Synchronisationslauf und keine Zwischendatenbank: Eine ERP-Aktion erzeugt unmittelbar einen API-Aufruf und erhält unmittelbar die ELECTRIX-Antwort.

## Funktionsumfang

- Artikel über die bestehende Parts API suchen und filtern
- Artikelnummer prüfen sowie Artikel direkt anlegen oder ändern
- Konfliktfall `409 PART_ALREADY_EXISTS` reproduzierbar testen
- echte ELECTRIX-Projekte laden und öffnen
- vorhandenen Materiallisten-Report als Ausgangspunkt für einen ERP-Stücklistenworkflow verwenden
- alle 95 vorhandenen OpenAPI-Operationen in der API-Konsole auswählen und lokal ausführen
- geplante Parts-Endpoints anhand des Overlay-Vertrags im Demo- oder Live-Modus aufrufen

## Start

`ERP-Artikel-Mockup-starten.cmd` doppelklicken. Anschließend öffnet sich `http://localhost:3010`. Es ist keine ChatGPT-Anmeldung erforderlich.

## Sicherheit

Die lokale Proxy-Route akzeptiert ausschließlich `localhost`, `127.0.0.1` oder `::1` und nur Pfade unter `/api/v1/`. Der Bearer-Token wird nicht in Dateien gespeichert.

## Verträge und Quellen

- `contracts/wscad-existing.openapi.json`: vorhandene WSCAD-OpenAPI
- `contracts/electrix-parts-overlay.openapi.yaml`: für das ERP-Szenario geplante Endpoints
- `docs/quellen/ERP-Parts-API-Userstory.txt`: bereitgestellte API-User-Story
- `docs/Direkte-Artikelaufrufe.md`: Direktaufrufe, Statuscodes und MVP-Abgrenzung
- `docs/quellen/WSCAD-Artikel-API-Direkte-Datenbankintegration.md`: fachliche Ausgangsanforderung
- `docs/Materiallisten-Workflow.md`: Stücklistenübergabe und offene API-Frage

## Materiallisten-Workflow

Der vorhandene Endpoint `POST /api/v1/reports/generate-material-list-excel-report` startet die Reporterzeugung und liefert `TaskDetails`. Da die OpenAPI keine Struktur für den erzeugten Dateiverweis dokumentiert, simuliert der Mockup die anschließende ERP-Übernahme. Für einen vollständig automatisierten Live-Betrieb wird ein abrufbarer Report-Artefakt-Verweis oder ein strukturierter Stücklisten-Endpoint benötigt.
