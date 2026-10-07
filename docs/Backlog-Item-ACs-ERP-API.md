# Backlog Item: Comprehensive Editing of the ELECTRIX Article Database via API Endpoints

## Title

Provide API endpoints for reading, creating, and updating complete ELECTRIX articles

## User Story

As a customer using a leading ERP, PIM, or PLM system, I want to read and edit the ELECTRIX article database through clearly defined API endpoints so that articles can be created and updated in ELECTRIX immediately and consistently.

## Functional Basis from the ELECTRIX Wiki

The ELECTRIX Wiki describes **Article Management** (*Artikelverwaltung*) as the main editor of the central article database. An article represents a real, orderable product. Article Management currently supports, among other things:

- searching and filtering articles,
- creating and updating articles,
- general article data such as article number, manufacturer, type designation, price, and weight,
- category and subcategory,
- **outline/form (Bauform)** and dimensions,
- discipline-specific symbol assignments,
- article attributes,
- user-defined fields,
- 3D and representation data,
- additional and combined article information,
- multilingual article texts.

The article database can be operated as either a SQLite or a Microsoft SQL Server database. The public API must use the existing ELECTRIX domain rules and must not require the API consumer to manage internal table relationships.

## Goal

All data required for the functional maintenance of an article shall be readable, validatable, creatable, and updateable through the existing `/api/v1/parts` resource. The API shall internally resolve and maintain all required relationships and persist the complete operation transactionally in the existing tables.

No separate or parallel article-database API shall be introduced.

## Clarification Required for the Public Article Identifier

The available **Legacy Part-Database Field Reference** distinguishes between:

- `artAutoValue`: a technical, automatically generated surrogate key used exclusively within the database,
- `artNumber`: the functional business key or catalogue/article number.

This description does not establish a public `partId` for the API contract. Therefore, `artAutoValue` must not be used or exposed as a public identifier without further functional and technical approval.

The following questions must be resolved before the endpoints are finalized:

- Is `artNumber` unique by itself in all currently supported databases?
- Do manufacturer and article number jointly form the business key?
- Which normalization rules apply to case, whitespace, and leading zeros?
- Does the legacy field catalogue still fully match the current SQLite and SQL Server schemas?
- How shall article numbers containing URL-special characters be transmitted safely as resource keys?

Until these questions are resolved, this backlog item uses the neutral placeholder `{articleKey}`. It represents the public functional article key that is still to be defined and explicitly does not represent `artAutoValue`.

## Scope

This story covers only API functions for searching, reading, validating, creating, and updating article data, including the dependent master data and relationships required for a complete article. Other functional areas are covered by separate backlog items.

## Intended Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/parts` | Filter articles and check whether an article number exists |
| `GET` | `/api/v1/parts/search` | Perform a free-text article search |
| `GET` | `/api/v1/parts/{articleKey}` | Read a complete article using the public article key that is still to be defined |
| `POST` | `/api/v1/parts` | Create a new article |
| `PATCH` | `/api/v1/parts/{articleKey}` | Update selected sections of an article using the public article key that is still to be defined |
| `POST` | `/api/v1/parts/validate` | Validate article data without saving it |
| `POST` | `/api/v1/parts/upsert` | Create or update an article using a business key |
| `POST` | `/api/v1/parts/batch/validate` | Validate multiple articles |
| `POST` | `/api/v1/parts/batch/upsert` | Process multiple articles |
| `GET` | `/api/v1/parts/batch/{batchId}/results` | Retrieve the results of a batch operation |
| `GET` | `/api/v1/business-partners` | Search for manufacturers and suppliers |
| `POST` | `/api/v1/business-partners` | Create a manufacturer or supplier if this is part of the agreed functional behaviour |

## Acceptance Criteria

### AC01 – Existing articles can be filtered and searched

- `GET /api/v1/parts` supports filters at least for article number, article name, and manufacturer.
- Only articles matching the specified filters are returned.
- An exact article-number query can be used as an existence check before creating an article.
- `GET /api/v1/parts/search` provides a free-text search equivalent to the existing ELECTRIX article search.

### AC02 – A complete article can be read

- `GET /api/v1/parts/{articleKey}` returns the complete public article identified by the documented functional article key.
- The response contains all sections maintained for this article and supported by the API.
- `404 Not Found` is returned when the article does not exist.

### AC03 – The public article model is functional and stable

- The public API model uses stable and understandable sections such as `partNumber`, `manufacturer`, `supplier`, `classification`, `descriptions`, `commercial`, `technical`, `dimensions`, `representations`, `attributes`, `userFields`, and `additionalParts`.
- Multilingual texts can be assigned unambiguously to their languages.
- Physical database fields and internal keys such as `artManufacturer` and `adrAutoValue` are not exposed as writable public properties.
- Internal table names are not part of the public contract.

### AC04 – A complete article can be created

- `POST /api/v1/parts` creates a new article including all valid supplied dependent data.
- A successful response returns `201 Created`.
- The response contains at least `operation=Created`, `partNumber`, and a version, as well as the final public article key if it is not identical to `partNumber`.
- A subsequent `GET /api/v1/parts/{articleKey}` request returns the stored data.

### AC05 – Duplicate article numbers are reliably prevented

- An existing article number cannot be created again through `POST /api/v1/parts`.
- No duplicate article is created and the existing article is not overwritten.
- No incomplete dependent records remain in the database.
- The response returns `409 Conflict`.
- The response contains the stable error code `PART_ALREADY_EXISTS` and an understandable message identifying the existing article number.

### AC06 – Duplicate prevention is safe under concurrent requests

- If two requests attempt to create the same new article number concurrently, exactly one article is created.
- Exactly one request returns `201 Created`.
- The other request returns `409 Conflict` with `PART_ALREADY_EXISTS`.
- Uniqueness is enforced within the database transaction and not only through a preceding search request.

### AC07 – Selected article sections can be updated

- `PATCH /api/v1/parts/{articleKey}` updates only the supplied fields and article sections.
- Article data omitted from the request remains unchanged.
- Explicit empty values are processed according to the documented PATCH semantics.
- The response contains `operation=Updated`, the article identity, and the new version.
- `404 Not Found` is returned when the article does not exist.

### AC08 – Concurrent updates do not overwrite each other silently

- An update based on an outdated article version does not overwrite a newer update.
- The response returns `409 Conflict` and contains a stable error code for the version conflict.
- The article remains in the last successfully persisted state.

### AC09 – Article data can be validated without being saved

- `POST /api/v1/parts/validate` executes the same required-field, format, value-range, relationship, and business-rule validations as a write operation.
- The result contains errors and warnings with a stable code, a public field path, and an understandable message.
- Validation does not modify the article or any dependent data.

### AC10 – Upsert uses an explicit business key

- `POST /api/v1/parts/upsert` uses a documented match expression as its business key.
- If exactly one article matches, that article is updated using `ProvidedFieldsOnly`.
- If no article matches, a new article is created only when `createIfMissing=true`.
- The result clearly identifies `Created`, `Updated`, or `Unchanged`.
- Multiple matches return `409 Conflict` without modifying any data.

### AC11 – Manufacturers and suppliers are resolved correctly internally

- ELECTRIX resolves manufacturers and suppliers using a documented stable identifier.
- ELECTRIX maintains all required internal keys and relationships itself.
- A new business partner is created only in accordance with the documented functional behaviour.
- Duplicate business partners are prevented using the defined business key.
- A business partner that cannot be resolved unambiguously produces a business validation error without partially storing the article.

### AC12 – All supported article sections are stored consistently

- Create and PATCH requests store all supported sections through the existing ELECTRIX domain rules and in the appropriate existing structures.
- Where supplied in the request and supported for the article, this includes:

  - general article data,
  - category and subcategory,
  - manufacturers and suppliers,
  - multilingual article texts,
  - commercial data such as price and weight,
  - technical properties,
  - article attributes,
  - user-defined fields,
  - discipline-specific symbol assignments,
  - **outline/form (Bauform)**, dimensions, and pin/contact positions,
  - 3D and other representation data,
  - additional articles and combined-article relationships,
  - communication profiles and other already supported article-related detail data.

- Unknown or unsupported writable fields are not silently ignored. They are rejected with `422 Unprocessable Entity` and information identifying the affected field.

### AC13 – Dependent article information is preserved during partial updates

- Symbol assignments, attributes, user-defined fields, outline/form, 3D, text, and combined-article data omitted from a PATCH request remain unchanged.
- References are not removed or recreated unintentionally.
- A read-after-write confirms both the unchanged existing data and the intended update.

### AC14 – Every individual article operation is transactional

- Create, PATCH, and upsert operations each run within a complete database transaction.
- If any individual step fails, the entire article operation is rolled back.
- No incomplete article, orphaned record, or partially updated dependent data remains.
- The response contains a stable error code and a correlation ID.
- The operation can subsequently be repeated successfully with corrected data.

### AC15 – SQLite and SQL Server produce the same functional result

- The same read, validation, create, PATCH, and upsert operations produce functionally equivalent results for identical initial data in SQLite and SQL Server.
- Public responses, validation results, transaction boundaries, and stored functional data behave consistently for both providers.
- Provider-specific SQL, locking, transaction handling, and key generation remain inside the respective persistence provider.

### AC16 – Batch processing provides a result for every article

- Every batch entry has a unique client correlation ID.
- Every entry is processed according to the same rules as the corresponding individual operation.
- The result contains the status, operation, article identity, and any error details for every input entry.
- The relationship to the original input entry remains unambiguous.
- A failed article does not leave partially stored data.
- The documented batch transaction strategy specifies whether other valid entries are processed or the complete batch is rolled back.

### AC17 – Error responses are consistent and machine-readable

- Every error response contains at least `code`, `message`, and `correlationId`, plus `details` with a public field path for field-related errors.
- The API uses at least the following status codes consistently:

  - `400 Bad Request` for syntactically invalid requests,
  - `404 Not Found` for articles that do not exist,
  - `409 Conflict` for duplicate business keys, multiple matches, and version conflicts,
  - `422 Unprocessable Entity` for functionally invalid article data,
  - `500 Internal Server Error` for unexpected errors after a complete rollback.

### AC18 – Existing Parts API clients remain compatible

- Existing documented requests and responses of the Parts API read and search endpoints remain compatible unless a separately approved versioned change exists.
- New complete models or fields are introduced additively or through a versioned contract.
- All new operations and schemas are included in the same published OpenAPI documentation.

### AC19 – Comprehensive article editing is verified automatically

- At least one positive test and every relevant negative automated test exist for each acceptance criterion.
- The acceptance suite runs against a clean supported SQLite database and a clean supported SQL Server database.
- The tests cover at least search, complete read, validation without persistence, create, duplicate creation, concurrent duplicate creation, PATCH semantics, read-after-write, version conflicts, relationship resolution, preservation of omitted detail data, complete rollback, upsert, and batch results.
- The published OpenAPI contract is validated against the implemented routes and response schemas.
- No endpoint is accepted while it is only mocked or is not implemented server-side.

## Definition of Done

- All endpoints listed above are implemented server-side and documented in Swagger/OpenAPI.
- The publicly supported article fields and their PATCH semantics are documented.
- The uniqueness and versioning rules are documented.
- All acceptance criteria are verified automatically against SQLite and SQL Server.
- The API consumer does not require direct access to the article database.

## Open Decisions for Refinement

- **Must be resolved before implementation:** the exact public article key and business key—`partNumber` alone or a combination such as manufacturer plus article number. According to the legacy reference, `artAutoValue` is exclusively internal and is not assumed to be a public `partId`.
- Canonical representation and comparison rules for article numbers, especially case, whitespace, and leading zeros.
- Complete list of article sections and fields writable in the first release.
- Stable identification of manufacturers and suppliers.
- PATCH semantics for `null`, empty strings, empty arrays, and explicitly removing a relationship.
- Version mechanism for optimistic concurrency handling.
- Batch transaction strategy: per article or for the complete batch.
- Handling of existing user-defined fields with different data types.
- Behaviour when referenced master data for symbols, outlines/forms, or representations does not exist.
