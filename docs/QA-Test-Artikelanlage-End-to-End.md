# QA Test: Artikel über das ERP-Mockup anlegen und wieder auslesen

## Testfall-ID

`QA-ERP-PART-001`

## Ziel des Tests

Der Test weist nach, dass ein API-Konsument einen neuen Artikel in der aktiven ELECTRIX-Artikeldatenbank vollständig und konsistent verarbeiten kann.

Geprüft werden:

- Ermittlung des verwendeten Artikeldatenbank-Kontexts,
- Ermittlung der verfügbaren Artikelfelder, sofern der Metadaten-Endpoint bereits implementiert ist,
- Existenzprüfung über die Artikelnummer,
- Anlage eines Artikels mit mehreren Datenfeldern,
- erfolgreiche Rückmeldung der Anlage,
- Zurücklesen und Prüfen der gespeicherten Daten,
- Ablehnung eines zweiten Anlageversuchs mit derselben Artikelnummer,
- unveränderter Bestand nach dem abgelehnten zweiten Anlageversuch.

## Sicherheit und Testumgebung

- Der Test schreibt einen Artikel in die konfigurierte Artikeldatenbank.
- Der Test darf ausschließlich gegen eine freigegebene QA-/Testdatenbank ausgeführt werden.
- Vor dem Test muss bekannt sein, wie die Testdatenbank wiederhergestellt werden kann.
- Da kein Lösch-Endpoint Bestandteil dieses Tests ist, bleibt der erfolgreich angelegte Testartikel in der Datenbank erhalten.
- Für jeden Testlauf muss eine neue, eindeutig erkennbare Artikelnummer verwendet werden.

## Voraussetzungen

1. Ein ELECTRIX Developer-/QA-Build mit den zu prüfenden Parts-Endpunkten ist installiert und gestartet.
2. Eine beschreibbare QA-Artikeldatenbank ist in ELECTRIX konfiguriert.
3. Die ELECTRIX API ist erreichbar, standardmäßig beispielsweise unter `http://localhost:10384`.
4. Das ERP-Mockup ist gestartet:
   - `ERP-Artikel-Mockup-starten.cmd` ausführen,
   - anschließend `http://localhost:3010` öffnen.
5. Falls der Build bereits API-Zugriffstoken verlangt, liegt ein gültiger Token vor.
6. Im ERP-Mockup wurde unter **Verbindung & Anmeldung** die ELECTRIX-Serveradresse eingetragen und die Verbindung erfolgreich geprüft.
7. Die noch offene Entscheidung zum öffentlichen `{articleKey}` ist für den getesteten Build bekannt. Falls der Build die Artikelnummer als Schlüssel verwendet, wird im Test die Artikelnummer eingesetzt.

## Testdaten

Für jeden Testlauf eine neue Artikelnummer verwenden. Empfohlenes Format:

```text
QA-ERP-YYYYMMDD-NNN
```

Beispiel:

```text
QA-ERP-20261008-001
```

Weitere Testwerte:

| Feld | Testwert |
|---|---|
| Artikelnummer | `QA-ERP-20261008-001` |
| Bezeichnung DE | `QA API Test-Leistungsschütz` |
| Hersteller | `QA Test Manufacturer` |
| Listenpreis | `42.50` |
| Währung | `EUR` |
| Klassifikation/Beschreibung | `QA API End-to-End Test` |

Wenn Hersteller automatisch angelegt werden können, ist ein ausdrücklich dafür vorgesehener QA-Hersteller zu verwenden. Andernfalls muss ein bereits vorhandener Hersteller verwendet werden.

## Übersicht der API-Aufrufe

| Reihenfolge | Aufruf | Wirkung |
|---|---|---|
| 1 | `GET /api/v1/part-database/status` | Liest nur den aktiven Datenbankkontext; verändert keine Daten. |
| 2 | `GET /api/v1/part-database/fields` | Liest die verfügbaren Standard- und Benutzerfelder; verändert keine Daten. |
| 3 | `GET /api/v1/parts?partnumber={partNumber}` | Prüft, ob die Testartikelnummer bereits vorhanden ist; verändert keine Daten. |
| 4 | `POST /api/v1/parts` | Legt den Artikel und seine mitgesendeten abhängigen Daten transaktional an. |
| 5 | `GET /api/v1/parts/{articleKey}` | Liest den vollständig gespeicherten Artikel zur Kontrolle zurück. |
| 6 | `POST /api/v1/parts` mit derselben Artikelnummer | Muss die Dublette ablehnen und darf keine Daten verändern. |
| 7 | `GET /api/v1/parts/{articleKey}` | Kontrolliert, dass der zuerst angelegte Artikel unverändert geblieben ist. |

Die Aufrufe 1, 2 und 5 werden derzeit über die **API-Konsole** des ERP-Mockups ausgeführt. Die Existenzprüfung und die Anlage können über **Direkte Aufrufe** ausgeführt werden.

## Testdurchführung

### Schritt 1 – ERP-Mockup mit der ELECTRIX API verbinden

1. Im ERP-Mockup **Verbindung & Einstellungen** öffnen.
2. **ELECTRIX Live** auswählen.
3. Die Serveradresse des Developer-/QA-Builds eintragen.
4. Falls erforderlich, den API-Zugriffstoken eintragen.
5. **Anmelden & Verbindung prüfen** auswählen.

Erwartetes Ergebnis:

- Das Mockup zeigt an, dass ELECTRIX verbunden ist.
- Ein Verbindungsfehler muss vor der weiteren Testdurchführung geklärt werden.

### Schritt 2 – Aktive Artikeldatenbank prüfen

1. Die **API-Konsole** öffnen.
2. Einen vorhandenen `GET`-Eintrag auswählen.
3. Den Request-Pfad auf folgenden Wert ändern:

```http
/api/v1/part-database/status
```

4. **Request direkt ausführen** auswählen.

Erwartetes Ergebnis:

```http
200 OK
```

Der Response identifiziert mindestens:

- die erwartete QA-Datenbank über einen nicht geheimen Schlüssel oder Anzeigenamen,
- den Provider, beispielsweise `SQLite` oder `SqlServer`,
- die Schema-/Datenbankversion,
- den Schreibstatus.

Beispiel:

```json
{
  "databaseKey": "qa-article-database",
  "displayName": "ELECTRIX QA Articles",
  "provider": "SqlServer",
  "schemaVersion": "2027.1",
  "writable": true
}
```

Abbruchkriterien:

- Es ist nicht eindeutig erkennbar, welche Datenbank verwendet wird.
- Die falsche Datenbank ist aktiv.
- `writable` ist `false`.
- Der Endpoint antwortet mit `404` oder `405`. In diesem Fall ist die für diesen Test benötigte Datenbankkontext-Funktion im Build noch nicht implementiert.

### Schritt 3 – Verfügbare Artikelfelder prüfen

1. In der **API-Konsole** den Request-Pfad ändern:

```http
/api/v1/part-database/fields
```

2. Den `GET`-Request ausführen.

Erwartetes Ergebnis:

```http
200 OK
```

Der Response enthält mindestens die Definition von `partNumber` und beschreibt vorhandene dynamische Benutzerfelder mit öffentlichem Namen und Datentyp.

Dieser Schritt soll nicht die physischen Spaltennamen wie `artNumber` oder interne Schlüssel wie `artAutoValue` an den API-Konsumenten weitergeben.

Falls der Metadaten-Endpoint im Developer-Build noch nicht implementiert ist, wird dieser Schritt als **Blocked – endpoint not implemented** protokolliert. Die nachfolgenden Schritte können mit den bereits dokumentierten Feldern trotzdem ausgeführt werden.

### Schritt 4 – Prüfen, dass die Testartikelnummer noch nicht vorhanden ist

1. **Direkte Aufrufe** öffnen.
2. **1 · Existenz prüfen** auswählen.
3. Die neue Testartikelnummer eingeben.
4. **Jetzt prüfen** auswählen.

Ausgeführter API-Aufruf:

```http
GET /api/v1/parts?partnumber=QA-ERP-20261008-001
```

Erwartetes Ergebnis:

- Der Response enthält keinen Artikel mit der Testartikelnummer.
- Abhängig vom finalen API-Vertrag kann dies als leere Trefferliste oder `404 Not Found` dargestellt werden.
- Für den Test muss eindeutig erkennbar sein, dass der Artikel nicht existiert.

Wenn der Artikel bereits existiert, ist eine neue Testartikelnummer zu verwenden. Der vorhandene Artikel darf nicht überschrieben werden.

### Schritt 5 – Artikel mit Daten anlegen

1. Unter **Direkte Aufrufe** die Funktion **2 · Neu anlegen** auswählen.
2. Folgende Testdaten eintragen:
   - Artikelnummer: `QA-ERP-20261008-001`
   - Bezeichnung: `QA API Test-Leistungsschütz`
   - Hersteller: `QA Test Manufacturer`
   - Listenpreis: `42.50`
   - Währung: `EUR`
   - Klassifikation/Beschreibung: `QA API End-to-End Test`
3. **Jetzt direkt anlegen** auswählen.

Das Mockup sendet sinngemäß folgenden Request:

```http
POST /api/v1/parts
Content-Type: application/json
```

```json
{
  "partNumber": "QA-ERP-20261008-001",
  "descriptions": {
    "de": "QA API Test-Leistungsschütz"
  },
  "manufacturer": {
    "name": "QA Test Manufacturer"
  },
  "commercial": {
    "listPrice": 42.50,
    "currency": "EUR"
  },
  "classification": {
    "description": "QA API End-to-End Test"
  }
}
```

Erwartetes Ergebnis:

```http
201 Created
```

Der Response enthält mindestens:

```json
{
  "operation": "Created",
  "partNumber": "QA-ERP-20261008-001",
  "version": "1"
}
```

Falls der öffentliche Artikelschlüssel nicht mit `partNumber` identisch ist, enthält der Response zusätzlich den dokumentierten öffentlichen Schlüssel. Eine interne Datenbank-ID wie `artAutoValue` wird nicht als öffentliche `partId` vorausgesetzt.

### Schritt 6 – Angelegten Artikel vollständig zurücklesen

1. Den öffentlichen `{articleKey}` aus dem Create-Response verwenden. Solange für den getesteten Build `partNumber` als Schlüssel vereinbart ist, die Testartikelnummer verwenden.
2. Die **API-Konsole** öffnen.
3. Einen `GET`-Eintrag auswählen.
4. Den Request-Pfad eintragen:

```http
/api/v1/parts/{articleKey}
```

Beispiel bei Verwendung der Artikelnummer:

```http
/api/v1/parts/QA-ERP-20261008-001
```

5. Den Request ausführen.

Erwartetes Ergebnis:

```http
200 OK
```

Folgende Werte stimmen mit dem Create-Request überein:

- Artikelnummer,
- deutsche Bezeichnung,
- Hersteller,
- Listenpreis,
- Währung,
- Klassifikation/Beschreibung.

Zusätzlich wird geprüft:

- Interne Datenbankfelder und interne Fremdschlüssel werden nicht als schreibbare öffentliche Felder ausgegeben.
- Der Response enthält keine unvollständigen oder widersprüchlichen abhängigen Daten.
- Die vom Create-Response gelieferte Version stimmt mit der gespeicherten Version überein.

### Schritt 7 – Optional vollständige Feldstruktur abfragen

Wenn der Build diese Option unterstützt, folgenden Request ausführen:

```http
GET /api/v1/parts/{articleKey}?includeEmpty=true
```

Erwartetes Ergebnis:

- Alle unterstützten Standardfelder sind im Response enthalten.
- Nicht gepflegte Standardfelder sind entsprechend dem Vertrag `null`, leere Objekte oder leere Listen.
- Befüllte dynamische Attribute und Benutzerfelder sind enthalten.
- Das Ergebnis enthält keine internen physischen Datenbankfelder.

Wenn `includeEmpty` noch nicht Teil des vereinbarten Vertrags ist, wird dieser Schritt nicht bewertet und als **Not applicable** dokumentiert.

### Schritt 8 – Dieselbe Artikelnummer erneut anlegen

1. Zu **Direkte Aufrufe** zurückkehren.
2. **2 · Neu anlegen** auswählen.
3. Exakt dieselbe Artikelnummer und dieselben Daten erneut eingeben.
4. **Jetzt direkt anlegen** auswählen.

Erwartetes Ergebnis:

```http
409 Conflict
```

```json
{
  "code": "PART_ALREADY_EXISTS",
  "message": "Article number QA-ERP-20261008-001 already exists.",
  "correlationId": "..."
}
```

Der Response darf nicht `201 Created` enthalten. `401 Unauthorized` darf nicht zur Meldung einer Dublette verwendet werden.

### Schritt 9 – Unveränderten Artikelbestand kontrollieren

1. Den Artikel erneut wie in Schritt 6 auslesen.
2. Zusätzlich die exakte Suche ausführen:

```http
GET /api/v1/parts?partnumber=QA-ERP-20261008-001
```

Erwartetes Ergebnis:

- Es existiert genau ein Artikel mit dieser Artikelnummer.
- Alle in Schritt 5 gespeicherten Werte sind unverändert.
- Die Version wurde durch den abgelehnten Anlageversuch nicht erhöht.
- Es wurden keine doppelten abhängigen Datensätze erzeugt.

## Erwartete Gesamtbewertung

Der Test ist **Passed**, wenn:

- die erwartete QA-Datenbank eindeutig festgestellt werden kann,
- der Artikel vor der Anlage nicht vorhanden ist,
- die Anlage mit `201 Created` erfolgreich ist,
- alle übertragenen Werte korrekt zurückgelesen werden,
- der zweite Anlageversuch mit `409 PART_ALREADY_EXISTS` abgelehnt wird,
- anschließend weiterhin genau ein unveränderter Artikel vorhanden ist.

Der Test ist **Failed**, wenn:

- in die falsche Datenbank geschrieben wird,
- der Artikel nur teilweise gespeichert wird,
- übertragene Werte fehlen oder verändert zurückgegeben werden,
- eine Dublette angelegt oder der vorhandene Artikel überschrieben wird,
- interne Datenbankschlüssel als erforderliche öffentliche Artikel-ID verwendet werden,
- der abgelehnte zweite Anlageversuch den Artikel oder abhängige Daten verändert.

Der Test ist **Blocked**, wenn ein für den Kernablauf benötigter Endpoint im getesteten Build mit `404 Not Found` oder `405 Method Not Allowed` antwortet. Ein noch nicht vereinbarter optionaler Endpoint wie `includeEmpty` wird dagegen als **Not applicable** dokumentiert.

## Zu protokollierende Nachweise

QA dokumentiert für jeden Lauf:

- getestete ELECTRIX-Buildnummer,
- ERP-Mockup-Version beziehungsweise Git-Commit,
- Datenbank-Key/Anzeigename und Provider,
- verwendete Testartikelnummer,
- HTTP-Status und Response jedes Aufrufs,
- Create-Response und öffentlicher `{articleKey}`,
- Read-after-Write-Response,
- Response des Dublettenversuchs,
- abschließende Such- und Read-Responses,
- Ergebnis `Passed`, `Failed`, `Blocked` oder `Not applicable` je optionalem Schritt.

Tokens, Kennwörter, Connection Strings und andere Geheimnisse dürfen nicht in den Testnachweis kopiert werden.
