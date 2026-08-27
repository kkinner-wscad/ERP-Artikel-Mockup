"use client";

import { FormEvent, useMemo, useState } from "react";
import { bomItems, endpointCatalog, initialParts, Part, projects } from "./mock-data";

type View = "dashboard" | "parts" | "sync" | "bom" | "api" | "settings";
type Environment = "mock" | "live";
type Notice = { tone: "success" | "warning" | "error" | "info"; text: string } | null;

const navItems: { id: View; number: string; label: string; subtitle: string }[] = [
  { id: "dashboard", number: "01", label: "Übersicht", subtitle: "Status und Schnellaktionen" },
  { id: "parts", number: "02", label: "Artikel", subtitle: "Stammdaten verwalten" },
  { id: "sync", number: "03", label: "Synchronisation", subtitle: "ERP → ELECTRIX" },
  { id: "bom", number: "04", label: "Stücklisten", subtitle: "ELECTRIX → ERP" },
  { id: "api", number: "05", label: "API-Konsole", subtitle: "Endpoints testen" },
];

function statusClass(status: string) { return `status-badge ${status.toLowerCase().replaceAll(" ", "-").replace("ä", "a")}`; }
function money(value: number) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value); }
function now() { return new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); }

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [environment, setEnvironment] = useState<Environment>("mock");
  const [parts, setParts] = useState(initialParts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alle Status");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [syncState, setSyncState] = useState<"idle" | "validating" | "running" | "completed">("idle");
  const [syncProgress, setSyncProgress] = useState(0);
  const [bomState, setBomState] = useState<"idle" | "running" | "generated" | "imported">("idle");
  const [projectId, setProjectId] = useState(projects[0].id);
  const [apiEndpoint, setApiEndpoint] = useState(0);
  const [apiBody, setApiBody] = useState("{}");
  const [apiResponse, setApiResponse] = useState("Noch kein Request ausgeführt.");
  const [apiBusy, setApiBusy] = useState(false);
  const [baseUrl, setBaseUrl] = useState("http://localhost:10384");
  const [token, setToken] = useState("");

  const filteredParts = useMemo(() => parts.filter((part) => {
    const term = query.trim().toLowerCase();
    const matchesText = !term || [part.partNumber, part.externalId, part.name, part.manufacturer].some((value) => value.toLowerCase().includes(term));
    const matchesStatus = statusFilter === "Alle Status" || part.status === statusFilter;
    return matchesText && matchesStatus;
  }), [parts, query, statusFilter]);

  function go(next: View) { setView(next); setNotice(null); }

  function runSync() {
    setSyncState("validating"); setSyncProgress(12); setNotice({ tone: "info", text: "248 ERP-Datensätze werden gegen den geplanten Parts-Vertrag validiert." });
    window.setTimeout(() => { setSyncState("running"); setSyncProgress(46); }, 650);
    window.setTimeout(() => setSyncProgress(78), 1250);
    window.setTimeout(() => { setSyncState("completed"); setSyncProgress(100); setNotice({ tone: "success", text: "Synchronisation abgeschlossen: 15 angelegt, 228 aktualisiert, 3 unverändert, 2 mit Fehlern." }); }, 1950);
  }

  function generateBom() {
    setBomState("running"); setNotice({ tone: "info", text: "Der vorhandene Materiallisten-Endpoint wurde gestartet. Task-Status wird abgefragt." });
    window.setTimeout(() => { setBomState("generated"); setNotice({ tone: "success", text: "Materialliste wurde im Mock-Modus erzeugt. 4 Positionen stehen zur ERP-Übernahme bereit." }); }, 1300);
  }

  function importBom() {
    setBomState("imported"); setNotice({ tone: "success", text: "Stückliste ERP-BOM-2026-00841 wurde angelegt und dem Auftrag 45000815 zugeordnet." });
  }

  function savePart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPart) return;
    const form = new FormData(event.currentTarget);
    const updated: Part = { ...selectedPart, name: String(form.get("name")), manufacturer: String(form.get("manufacturer")), price: Number(form.get("price")), revision: String(form.get("revision")), status: String(form.get("status")) as Part["status"], changedAt: `Heute, ${now()}` };
    setParts((current) => current.map((part) => part.id === updated.id ? updated : part));
    setSelectedPart(null);
    setNotice({ tone: "success", text: environment === "mock" ? `${updated.partNumber} wurde im ERP-Mockup aktualisiert. Der Upsert-Request ist vorbereitet.` : `${updated.partNumber} wurde für den Live-Upsert vorbereitet.` });
  }

  async function runApi() {
    const [method, path, contract] = endpointCatalog[apiEndpoint];
    setApiBusy(true); setApiResponse("Request läuft …");
    try {
      if (environment === "mock" || contract === "Geplant") {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        setApiResponse(JSON.stringify({ mock: true, method, path, status: contract === "Geplant" ? "simulated" : "success", timestamp: new Date().toISOString(), result: method === "GET" ? { items: initialParts.slice(0, 3), totalCount: 12486 } : { id: crypto.randomUUID(), state: "Completed", result: { accepted: true } } }, null, 2));
      } else {
        const response = await fetch("/api/wscad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl, token, path: path.replace("{id}", "00000000-0000-0000-0000-000000000000"), method, body: method === "GET" ? undefined : JSON.parse(apiBody) }) });
        setApiResponse(JSON.stringify(await response.json(), null, 2));
      }
    } catch (error) { setApiResponse(JSON.stringify({ error: error instanceof Error ? error.message : "Request fehlgeschlagen" }, null, 2)); }
    finally { setApiBusy(false); }
  }

  const activeProject = projects.find((project) => project.id === projectId) || projects[0];
  const bomTotal = bomItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => go("dashboard")}><span className="brand-mark">E</span><span><strong>ERP Control</strong><small>ELECTRIX Integration</small></span></button>
      <nav aria-label="Hauptnavigation">{navItems.map((item) => <button className={view === item.id ? "nav-item active" : "nav-item"} key={item.id} onClick={() => go(item.id)}><span className="nav-number">{item.number}</span><span><strong>{item.label}</strong><small>{item.subtitle}</small></span></button>)}</nav>
      <button className="settings-link" onClick={() => go("settings")}><span>⚙</span> Verbindung & Einstellungen</button>
      <div className="sidebar-status"><span className={environment === "mock" ? "status-dot" : "status-dot live"} /><div><strong>{environment === "mock" ? "Mock-Modus" : "Live-Modus"}</strong><small>{environment === "mock" ? "Keine WSCAD-Daten werden verändert" : "Aufrufe gehen an die lokale API"}</small></div></div>
    </aside>

    <main className="workspace">
      <header className="topbar"><div><p className="eyebrow">ERP als führendes System</p><h1>{navItems.find((item) => item.id === view)?.label || "Einstellungen"}</h1></div><div className="top-actions"><button className="secondary environment-button" onClick={() => setEnvironment((current) => current === "mock" ? "live" : "mock")}><span className={environment === "mock" ? "mode-dot" : "mode-dot live"} /> Umgebung: {environment === "mock" ? "Mock" : "Live"}</button><button className="primary" onClick={() => go("sync")}>Neuen Sync starten</button></div></header>
      {notice && <div className={`notice ${notice.tone}`} role="status"><span>{notice.tone === "success" ? "✓" : notice.tone === "warning" ? "!" : notice.tone === "error" ? "×" : "i"}</span><p>{notice.text}</p><button onClick={() => setNotice(null)} aria-label="Hinweis schließen">×</button></div>}
      {view === "dashboard" && <Dashboard go={go} parts={parts} />}
      {view === "parts" && <PartsView parts={filteredParts} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setSelectedPart={setSelectedPart} />}
      {view === "sync" && <SyncView state={syncState} progress={syncProgress} onRun={runSync} />}
      {view === "bom" && <BomView state={bomState} projectId={projectId} setProjectId={setProjectId} activeProject={activeProject} total={bomTotal} onGenerate={generateBom} onImport={importBom} />}
      {view === "api" && <ApiView selected={apiEndpoint} setSelected={setApiEndpoint} body={apiBody} setBody={setApiBody} response={apiResponse} run={runApi} busy={apiBusy} />}
      {view === "settings" && <Settings environment={environment} setEnvironment={setEnvironment} baseUrl={baseUrl} setBaseUrl={setBaseUrl} token={token} setToken={setToken} />}
    </main>

    {selectedPart && <div className="drawer-backdrop" onMouseDown={() => setSelectedPart(null)}><aside className="drawer" onMouseDown={(event) => event.stopPropagation()}><form onSubmit={savePart}><header><div><p className="eyebrow">ERP-Artikel bearbeiten</p><h2>{selectedPart.partNumber}</h2><small>{selectedPart.externalId}</small></div><button type="button" className="close-button" onClick={() => setSelectedPart(null)}>×</button></header><div className="drawer-body"><label>Bezeichnung<input name="name" defaultValue={selectedPart.name} required /></label><label>Hersteller<input name="manufacturer" defaultValue={selectedPart.manufacturer} required /></label><div className="form-row"><label>Preis<input name="price" type="number" step="0.01" defaultValue={selectedPart.price} required /></label><label>Revision<input name="revision" defaultValue={selectedPart.revision} required /></label></div><label>Status<select name="status" defaultValue={selectedPart.status}><option>Aktiv</option><option>Freigabe ausstehend</option><option>Abgekündigt</option><option>Konflikt</option></select></label><div className="validation-box"><strong>Vor dem Speichern</strong><p>Der Mockup erzeugt zunächst einen Request für <code>POST /api/v1/parts/validate</code> und anschließend für <code>POST /api/v1/parts/upsert</code>.</p></div></div><footer><button type="button" className="secondary" onClick={() => setSelectedPart(null)}>Abbrechen</button><button className="primary">Validieren & speichern</button></footer></form></aside></div>}
  </div>;
}

function Dashboard({ go, parts }: { go: (view: View) => void; parts: Part[] }) {
  const metrics = [
    { label: "ERP-Artikel", value: "12.486", note: "+84 seit gestern", tone: "blue" },
    { label: "Warten auf Freigabe", value: String(parts.filter((part) => part.status === "Freigabe ausstehend").length + 22), note: "7 mit Warnungen", tone: "amber" },
    { label: "Letzter Sync", value: "10:42", note: "248 erfolgreich", tone: "green" },
    { label: "Offene Konflikte", value: "4", note: "Prüfung erforderlich", tone: "red" },
  ];
  return <><section className="hero-card"><div><span className="pill">SYSTEMBEREIT</span><h2>Artikel- und Stücklistendaten sicher zwischen ERP und ELECTRIX übertragen.</h2><p>Fachliche Workflows testen, geplante Endpoints simulieren und vorhandene WSCAD-API-Aufrufe kontrolliert ausführen.</p></div><div className="flow" aria-label="Datenfluss ERP zu ELECTRIX"><div><span>ERP</span><small>führend</small></div><b>→</b><div><span>API</span><small>validiert</small></div><b>⇄</b><div><span>ELECTRIX</span><small>konsumiert</small></div></div></section><section className="metric-grid">{metrics.map((metric) => <article className={`metric ${metric.tone}`} key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</section><section className="content-grid"><article className="panel"><PanelHeading eyebrow="Arbeitsbereich" title="Schnellaktionen" tag="POC" /><div className="quick-grid"><Quick code="ART" title="Artikel bearbeiten" text="Stammdaten prüfen und Upsert vorbereiten" onClick={() => go("parts")} /><Quick code="SYN" title="Synchronisation" text="Einzel- oder Stapellauf simulieren" onClick={() => go("sync")} /><Quick code="BOM" title="Materialliste übernehmen" text="Report erzeugen und als ERP-Stückliste speichern" onClick={() => go("bom")} /><Quick code="API" title="Endpoint testen" text="Request und Response technisch untersuchen" onClick={() => go("api")} /></div></article><article className="panel"><PanelHeading eyebrow="Protokoll" title="Letzte Vorgänge" /><div className="activity-list">{[["Bulk-Upsert", "248 Artikel", "Erfolgreich", "10:42"], ["Materialliste", "Projekt P-2026-0815", "Übertragen", "09:18"], ["Artikelprüfung", "3 Warnungen", "Prüfen", "Gestern"]].map(([name, detail, state, time]) => <div className="activity" key={`${name}-${time}`}><span className="activity-icon">{name[0]}</span><div><strong>{name}</strong><small>{detail}</small></div><span className="state">{state}</span><time>{time}</time></div>)}</div></article></section></>;
}

function PartsView({ parts, query, setQuery, statusFilter, setStatusFilter, setSelectedPart }: { parts: Part[]; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; setSelectedPart: (part: Part) => void }) {
  return <section className="page-stack"><div className="section-intro"><div><h2>Artikelstammdaten</h2><p>ERP-Daten prüfen und die geplanten Validate-, Upsert- und Lifecycle-Aufrufe vorbereiten.</p></div><button className="primary" onClick={() => setSelectedPart(initialParts[1])}>+ Artikel anlegen</button></div><div className="toolbar"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Artikelnummer, Bezeichnung oder Hersteller suchen" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Alle Status</option><option>Aktiv</option><option>Freigabe ausstehend</option><option>Abgekündigt</option><option>Konflikt</option></select><button className="secondary">Weitere Filter</button></div><div className="table-card"><table><thead><tr><th>Artikelnummer</th><th>Bezeichnung</th><th>Hersteller</th><th>Preis</th><th>Rev.</th><th>Status</th><th>Geändert</th><th /></tr></thead><tbody>{parts.map((part) => <tr key={part.id}><td><strong>{part.partNumber}</strong><small>{part.externalId}</small></td><td>{part.name}<small>{part.category}</small></td><td>{part.manufacturer}</td><td>{money(part.price)}</td><td>{part.revision}</td><td><span className={statusClass(part.status)}>{part.status}</span></td><td>{part.changedAt}</td><td><button className="row-action" onClick={() => setSelectedPart(part)}>Bearbeiten</button></td></tr>)}</tbody></table>{parts.length === 0 && <div className="empty-state"><strong>Keine Artikel gefunden</strong><p>Ändere den Suchbegriff oder den Statusfilter.</p></div>}<footer className="table-footer"><span>{parts.length} von 12.486 Artikeln</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><button>›</button></div></footer></div></section>;
}

function SyncView({ state, progress, onRun }: { state: string; progress: number; onRun: () => void }) {
  return <section className="page-stack"><div className="section-intro"><div><h2>ERP → ELECTRIX</h2><p>Bulk-Upsert mit Validierung, Task-Verfolgung und Ergebnis je Artikel simulieren.</p></div><button className="primary" onClick={onRun} disabled={state === "running" || state === "validating"}>{state === "running" || state === "validating" ? "Synchronisierung läuft …" : "Synchronisierung starten"}</button></div><div className="workflow-grid"><article className="panel sync-config"><PanelHeading eyebrow="Konfiguration" title="Synchronisationslauf" tag="Mock-Daten" /><div className="definition-list"><div><span>Quelle</span><strong>SAP S/4HANA – Materialstamm</strong></div><div><span>Auswahl</span><strong>Seit letztem Cursor · 248 Datensätze</strong></div><div><span>Schreibmodus</span><strong>ProvidedFieldsOnly</strong></div><div><span>Transaktion</span><strong>PerPart · bei Fehler fortsetzen</strong></div><div><span>Freigabestatus</span><strong>PendingApproval</strong></div></div><div className="code-path"><code>POST /api/v1/parts/batch/validate</code><span>→</span><code>POST /api/v1/parts/batch/upsert</code><span>→</span><code>GET /api/v1/tasks/&#123;id&#125;</code></div></article><article className="panel progress-card"><PanelHeading eyebrow="Task" title={state === "idle" ? "Bereit zum Start" : state === "completed" ? "Verarbeitung abgeschlossen" : "Verarbeitung läuft"} /><div className={`progress-ring ${state}`} style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div><div className="progress-bar"><span style={{ width: `${progress}%` }} /></div><p>{state === "idle" ? "Der Lauf verändert im Mock-Modus keine echte Artikeldatenbank." : state === "validating" ? "Requests und Relationen werden validiert …" : state === "running" ? "Artikel werden paketweise verarbeitet …" : "15 angelegt · 228 aktualisiert · 3 unverändert · 2 fehlgeschlagen"}</p></article></div><article className="panel"><PanelHeading eyebrow="Ergebnisvorschau" title="Datensätze" /><table className="compact-table"><thead><tr><th>Client-ID</th><th>Artikel</th><th>Erwartete Aktion</th><th>Prüfung</th></tr></thead><tbody><tr><td>SAP-10001</td><td>10001</td><td>Updated</td><td><span className="status-badge aktiv">Gültig</span></td></tr><tr><td>MAT-2904602</td><td>2904602</td><td>Updated</td><td><span className="status-badge aktiv">Gültig</span></td></tr><tr><td>ERP-7508212</td><td>750-8212</td><td>Conflict</td><td><span className="status-badge konflikt">Version abweichend</span></td></tr></tbody></table></article></section>;
}

function BomView({ state, projectId, setProjectId, activeProject, total, onGenerate, onImport }: { state: string; projectId: string; setProjectId: (id: string) => void; activeProject: typeof projects[number]; total: number; onGenerate: () => void; onImport: () => void }) {
  return <section className="page-stack"><div className="section-intro"><div><h2>ELECTRIX → ERP</h2><p>Materialliste als Stückliste an das führende ERP-System übergeben.</p></div><span className="direction-badge">Rückkanal</span></div><div className="bom-flow"><div className="bom-step done"><span>1</span><div><strong>Projekt auswählen</strong><small>Vorhandener Projects-Endpoint</small></div></div><b>→</b><div className={`bom-step ${state !== "idle" ? "done" : ""}`}><span>2</span><div><strong>Report erzeugen</strong><small>Vorhandener Materiallisten-Endpoint</small></div></div><b>→</b><div className={`bom-step ${state === "generated" || state === "imported" ? "done" : ""}`}><span>3</span><div><strong>Ergebnis übernehmen</strong><small>ERP-Stückliste anlegen</small></div></div></div><div className="workflow-grid bom-grid"><article className="panel"><PanelHeading eyebrow="Quelle" title="ELECTRIX-Projekt" /><label className="stacked-label">Projekt<select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option value={project.id} key={project.id}>{project.number} · {project.name}</option>)}</select></label><div className="project-summary"><span className="project-monogram">P</span><div><strong>{activeProject.name}</strong><small>{activeProject.customer}</small></div><span className="status-badge aktiv">{activeProject.state}</span></div><div className="definition-list compact"><div><span>ERP-Auftrag</span><strong>45000815</strong></div><div><span>Sortierung</span><strong>Artikelnummer</strong></div><div><span>Gruppierung</span><strong>Gesamtprojekt</strong></div></div><button className="primary full" onClick={onGenerate} disabled={state === "running"}>{state === "running" ? "Report-Task läuft …" : "Materialliste erzeugen"}</button><code className="endpoint-label">POST /api/v1/reports/generate-material-list-excel-report</code></article><article className="panel bom-preview"><PanelHeading eyebrow="Ziel" title="ERP-Stückliste" tag={state === "imported" ? "Übernommen" : "Vorschau"} />{state === "idle" || state === "running" ? <div className="empty-illustration"><span>BOM</span><strong>{state === "running" ? "Materialliste wird erzeugt …" : "Noch keine Materialliste"}</strong><p>Starte links die Reporterzeugung. Danach werden die Stücklistenpositionen hier geprüft.</p></div> : <><div className="bom-summary"><div><span>Positionen</span><strong>{bomItems.length}</strong></div><div><span>Gesamtmenge</span><strong>{bomItems.reduce((sum, item) => sum + item.quantity, 0)}</strong></div><div><span>Materialwert</span><strong>{money(total)}</strong></div></div><table className="compact-table"><thead><tr><th>Pos.</th><th>Artikel</th><th>Menge</th><th>Wert</th></tr></thead><tbody>{bomItems.map((item) => <tr key={item.position}><td>{item.position}</td><td><strong>{item.partNumber}</strong><small>{item.description}</small></td><td>{item.quantity} {item.unit}</td><td>{money(item.quantity * item.price)}</td></tr>)}</tbody></table><button className="primary full" onClick={onImport} disabled={state === "imported"}>{state === "imported" ? "ERP-Stückliste angelegt" : "Als ERP-Stückliste übernehmen"}</button></>}</article></div><div className="gap-callout"><span>API-LÜCKE</span><div><strong>Automatische Übergabe des erzeugten Reports ist noch nicht vollständig dokumentiert.</strong><p>Der vorhandene Endpoint liefert laut OpenAPI nur <code>TaskDetails</code>. Für einen vollautomatischen Live-Workflow muss das Task-Ergebnis zusätzlich einen abrufbaren Dateiverweis liefern oder ein strukturierter Stücklisten-Endpoint ergänzt werden. Der Mock-Modus simuliert diesen Schritt bereits.</p></div></div></section>;
}

function ApiView({ selected, setSelected, body, setBody, response, run, busy }: { selected: number; setSelected: (value: number) => void; body: string; setBody: (value: string) => void; response: string; run: () => void; busy: boolean }) {
  const endpoint = endpointCatalog[selected];
  return <section className="page-stack"><div className="section-intro"><div><h2>Endpoint-Testlabor</h2><p>Vorhandene ELECTRIX-Aufrufe live und geplante Artikel-Endpoints als Mock testen.</p></div><span className="direction-badge neutral">15 ausgewählte Endpoints</span></div><div className="api-layout"><aside className="endpoint-list">{endpointCatalog.map(([method, path, status], index) => <button key={`${method}-${path}`} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}><span className={`method ${method.toLowerCase()}`}>{method}</span><div><strong>{path}</strong><small>{status}</small></div></button>)}</aside><article className="api-workbench"><header><div><span className={`method ${endpoint[0].toLowerCase()}`}>{endpoint[0]}</span><code>{endpoint[1]}</code></div><span className={endpoint[2] === "Vorhanden" ? "contract existing" : "contract planned"}>{endpoint[2]}</span></header><p>{endpoint[3]}</p><label>Request Body<textarea spellCheck={false} value={body} onChange={(event) => setBody(event.target.value)} /></label><button className="primary" onClick={run} disabled={busy}>{busy ? "Wird ausgeführt …" : "Request ausführen"}</button><div className="response-box"><div><strong>Response</strong><button onClick={() => navigator.clipboard?.writeText(response)}>Kopieren</button></div><pre>{response}</pre></div></article></div></section>;
}

function Settings({ environment, setEnvironment, baseUrl, setBaseUrl, token, setToken }: { environment: Environment; setEnvironment: (value: Environment) => void; baseUrl: string; setBaseUrl: (value: string) => void; token: string; setToken: (value: string) => void }) {
  return <section className="page-stack"><div className="section-intro"><div><h2>Verbindung & Einstellungen</h2><p>Der Token wird nur im aktuellen Browserzustand gehalten und nicht in Projektdateien gespeichert.</p></div></div><div className="settings-grid"><article className="panel"><PanelHeading eyebrow="Betriebsart" title="Umgebung" /><div className="mode-cards"><button className={environment === "mock" ? "active" : ""} onClick={() => setEnvironment("mock")}><span>MOCK</span><strong>Simulation</strong><small>Alle geplanten Workflows ohne ELECTRIX testen.</small></button><button className={environment === "live" ? "active" : ""} onClick={() => setEnvironment("live")}><span>LIVE</span><strong>Lokale API</strong><small>Vorhandene Endpoints gegen ELECTRIX aufrufen.</small></button></div></article><article className="panel connection-form"><PanelHeading eyebrow="ELECTRIX API" title="Lokale Verbindung" /><label>Serveradresse<input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></label><label>Bearer-Token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Token nur für diese Sitzung" /></label><button className="primary">Verbindung prüfen</button><p className="security-note">Zulässig sind ausschließlich localhost, 127.0.0.1 und ::1 mit Pfaden unter /api/v1/.</p></article></div></section>;
}

function PanelHeading({ eyebrow, title, tag }: { eyebrow: string; title: string; tag?: string }) { return <div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>{tag && <span>{tag}</span>}</div>; }
function Quick({ code, title, text, onClick }: { code: string; title: string; text: string; onClick: () => void }) { return <button onClick={onClick}><span>{code}</span><strong>{title}</strong><small>{text}</small></button>; }
