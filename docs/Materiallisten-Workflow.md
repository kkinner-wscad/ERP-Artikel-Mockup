# Materialliste aus ELECTRIX an das ERP übergeben

## Ziel

Das ERP bleibt führend für Artikel und verwaltet zusätzlich die Stückliste eines Auftrags oder Projekts. ELECTRIX liefert dafür die tatsächlich im Projekt verwendeten Artikel und Mengen.

## Bereits verwendbare Endpoints

1. `GET /api/v1/projects` – Projekt auswählen.
2. `GET /api/v1/projects/{id}` – Projektkontext prüfen.
3. `POST /api/v1/reports/generate-material-list-excel-report` – Materiallisten-Excel-Report starten.
4. `GET /api/v1/tasks/{id}` – Reporterzeugung bis `Completed` oder `Failed` verfolgen.

## Im Mockup abgebildeter Ablauf

1. ELECTRIX-Projekt auswählen.
2. ERP-Auftrag und gewünschte Gruppierung festlegen.
3. Materiallisten-Report starten.
4. Taskstatus verfolgen.
5. Positionen vor der Übernahme anzeigen.
6. ERP-Stückliste anlegen oder aktualisieren.
7. Ergebnis mit Projekt, Auftrag, Task-ID und Zeitstempel protokollieren.

## Offene API-Lücke

`TaskDetails.Result` ist in der vorhandenen OpenAPI nicht typisiert. Der Report-Request enthält außerdem keinen dokumentierten Ausgabepfad. Deshalb ist nicht vertraglich festgelegt, wie ein Client nach Taskabschluss die erzeugte Excel-Datei automatisch erhält.

Für einen produktiven automatischen Workflow sollte mindestens eine der folgenden Varianten festgelegt werden:

- `TaskDetails.Result` enthält `artifactId`, Dateiname, Medientyp und einen abrufbaren Downloadpfad.
- Ein zusätzlicher Endpoint stellt ein erzeugtes Report-Artefakt bereit, zum Beispiel `GET /api/v1/reports/artifacts/{artifactId}`.
- Ein strukturierter Stücklisten-Endpoint liefert Positionen direkt als JSON und der Excel-Report bleibt eine separate Benutzerfunktion.
- Alternativ wird ein verbindlicher, gemeinsam erreichbarer Ausgabeordner dokumentiert. Diese Variante ist weniger portabel und schwieriger abzusichern.

## Empfehlung

Für ERP-Integrationen ist ein strukturierter JSON-Response oder ein Download-Artefakt belastbarer als die Überwachung eines Dateisystemordners. Der bestehende Excel-Report kann weiterverwendet werden; lediglich die Übergabe seines Ergebnisses muss vertraglich ergänzt werden.
