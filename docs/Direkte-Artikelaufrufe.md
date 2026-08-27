# Direkte Artikelaufrufe

## Zielbild

Das ERP ist das führende System. Jede Benutzeraktion wird unmittelbar gegen die ELECTRIX API ausgeführt. Es gibt keine Austauschdatenbank, keinen periodischen Synchronisationslauf und keinen lokalen Warteschlangenprozess im ERP Control MVP.

## Kernabläufe

1. Existenz prüfen: `GET /api/v1/parts?partnumber={articleNumber}`
2. Neu anlegen: `POST /api/v1/parts`
3. Selektiv ändern: `PATCH /api/v1/parts/{partId}`
4. Projektliste laden: `GET /api/v1/projects`
5. Projekt öffnen: `POST /api/v1/projects/{id}/open`
6. Materialliste starten: `POST /api/v1/reports/generate-material-list-excel-report`
7. Report-Task verfolgen: `GET /api/v1/tasks/{id}`

Die vorherige Existenzprüfung ist komfortabel, aber nicht verpflichtend. Der Server muss konkurrierende oder direkte Erstellversuche selbst sicher behandeln.

## Statuscodes für das Anlegen

- `201 Created`: Artikel wurde in einer Transaktion vollständig angelegt.
- `409 Conflict`: Der Business-Key, zunächst die Artikelnummer, ist bereits vorhanden. Fehlercode `PART_ALREADY_EXISTS`.
- `401 Unauthorized`: Bearer-Token fehlt oder ist ungültig. Dieser Code darf nicht für Dubletten verwendet werden.
- `422 Unprocessable Entity`: Der Request ist syntaktisch gültig, verletzt aber fachliche Regeln.
- `500 Internal Server Error`: Unerwarteter Fehler; die Artikeltransaktion wurde vollständig zurückgerollt.

## Datenhaltung

ELECTRIX löst Hersteller, Lieferanten und alle abhängigen Tabellen intern auf. Physische Felder wie `artManufacturer` oder `adrAutoValue` sind keine schreibbaren öffentlichen API-Eigenschaften. Ein Artikel wird nicht physisch gelöscht, sondern über seinen Lifecycle-Status abgekündigt oder gesperrt.

## MVP-Abgrenzung

Die Oberfläche kann alle 95 Operationen der gelieferten ELECTRIX OpenAPI lokal ausführen. Neu benötigte Parts-Operationen sind im Overlay dokumentiert und im Demo-Modus bereits fachlich testbar. Im Live-Modus werden sie bewusst ebenfalls aufgerufen; bis zur Serverimplementierung ist dort eine `404`- oder `405`-Antwort erwartbar.

Der vorhandene Materiallisten-Endpoint liefert laut Vertrag einen Task. Für eine produktive ERP-Stücklistenübernahme fehlt noch ein dokumentiertes strukturiertes JSON-Ergebnis oder ein stabiler Download-Verweis im Task-Ergebnis.
