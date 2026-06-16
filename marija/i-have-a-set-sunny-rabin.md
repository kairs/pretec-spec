# Plan: Introduce a central EF Core (PostgreSQL) read layer to replace Omnium reads

## Context

The microservices (this repo, `gcc-catalog-omnium`, is the example) currently serve catalog
data by reading from the external **Omnium** system at request time: controllers → MediatR
query handlers → Omnium SDK clients (`IOmniumProductClient`, `IOmniumCategoryClient`,
`IInventoryClient`). There is no relational persistence today (only MongoDB for custom-field
mappings).

The goal is to read catalog data from a **PostgreSQL database via Entity Framework Core**
instead of Omnium, **without changing any REST endpoint signatures or return types**. This
plan covers building the DB layer and swapping the example features. **Populating** the
database (Omnium→DB sync/ingestion) is explicitly out of scope — we build the schema and the
read path and assume the DB is filled by a separate process.

### Confirmed decisions
1. **Scope:** read layer + schema only. No sync/ingestion design.
2. **Engine:** PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`).
3. **Structure:** ONE central shared DB project holding all entities + one `DbContext` +
   migrations, backed by a single central database. Lives in the **`lib/gcc` shared submodule**
   as `Geta.Cloud.Shared.Database`, referenced by every service (same as the other
   `Geta.Cloud.Shared.*` projects).
4. **Schema:** fully normalized — every nested collection / value object becomes its own table
   with foreign keys; `Properties` dictionaries become key/value tables.
5. **Migrations:** automatic (applied on startup). Phased: **Round 1** creates tables with NO
   foreign keys; **Round 2** adds foreign keys.
6. **Swap:** hard replacement, no feature flag. Replace the Omnium data source outright.
7. **No renaming** of existing returned classes. The in-scope read endpoints return
   `OmniumProductCategory`, `OmniumProductCategoryTreeViewModel`, and `GccOmniumProduct`
   (NOT the lightweight `Models/Product.cs` family). EF entities are new classes mapped back
   to these exact types so signatures stay identical.

### Key challenge to keep in view
A single shared database + one migration history across independently-deployed services is
strong coupling (shared `__EFMigrationsHistory`, deploy-ordering, one blast radius; with
auto-migrate-on-startup a bad migration from any service can block the fleet). Accepted for a
consolidated read model now; revisit (per-service schemas + explicit migration job) before any
service writes to it.

---

## Phase 0 — Prerequisites

- Check out the shared submodule (currently an empty pinned submodule):
  `git submodule update --init lib/gcc` (or work in the sibling `shared/` checkout used by the
  `Overview` build configuration).
- A local PostgreSQL instance for development; connection string added to config (Phase 1).
- Install EF tooling: `dotnet tool install --global dotnet-ef` (or solution-local).

---

## Phase 1 — Central DB project + entities (scalar only) + Round 1 migration (NO FKs)

**New project:** `lib/gcc/src/Geta.Cloud.Shared.Database/Geta.Cloud.Shared.Database.csproj`
- `net9.0`, `ImplicitUsings=enable`, `Nullable=enable`, `<Configurations>Debug;Release;Overview</Configurations>` (match sibling shared libs, e.g. `Geta.Cloud.Shared.MongoDb`).
- Packages: `Microsoft.EntityFrameworkCore` 9.*, `Microsoft.EntityFrameworkCore.Relational` 9.*,
  `Npgsql.EntityFrameworkCore.PostgreSQL` 9.*, and `Microsoft.EntityFrameworkCore.Design` 9.*
  with `<PrivateAssets>all</PrivateAssets>` (copy the `NSwag.MSBuild` PrivateAssets pattern in
  `Geta.Cloud.Catalog.Omnium.Api.csproj:19-22`).
- Add to `Geta.Cloud.Catalog.Omnium.sln` (same `lib\gcc\src\...` form as other shared projects)
  and add a `<ProjectReference>` in **both** the Debug/Release and Overview ItemGroups of
  `src/Geta.Cloud.Catalog.Omnium.Api/Geta.Cloud.Catalog.Omnium.Api.csproj:26-46`.

**Infrastructure files in the new project:**
- `GccDbContext : DbContext` — single context; `OnModelCreating` calls
  `modelBuilder.ApplyConfigurationsFromAssembly(typeof(GccDbContext).Assembly)` so entity
  configs are auto-discovered. Use PostgreSQL schemas (e.g. `catalog`) for logical per-domain
  separation within the one context.
- `GccDbContextFactory : IDesignTimeDbContextFactory<GccDbContext>` — so `dotnet ef` runs
  without booting the API; reads connection from `GCC_DB_CONNECTION` env var (dev fallback);
  sets `npg => npg.MigrationsAssembly(typeof(GccDbContext).Assembly.FullName)`.
- `ServiceCollectionExtensions.AddGccDatabase(this IServiceCollection, IConfiguration)` —
  `AddDbContext<GccDbContext>(opt => opt.UseNpgsql(cs, npg => npg.MigrationsAssembly(...)))`,
  reading `configuration.GetConnectionString("postgres")`.
- `DatabaseMigrationHostedService : IHostedService` — on `StartAsync`, scope-resolve
  `GccDbContext` and `await db.Database.MigrateAsync(ct)` (auto-migrate before traffic).
- `Migrations/` folder (migrations assembly = this project).

**Wire into this service:**
- `src/Geta.Cloud.Catalog.Omnium.Api/Startup.cs` — add `services.AddGccDatabase(configuration);`
  next to `builder.AddMongoDb();` (~line 65). No `Program.cs` change needed (hosted service runs
  on host start).
- `src/Geta.Cloud.Catalog.Omnium.Api/appsettings.Development.json:2-5` — add
  `connectionStrings:postgres` alongside the existing `mongoDb` key. Production supplies it via
  `ConnectionStrings__postgres` env var (no secrets committed).

**Entities — Round 1 shape (scalar only, NO navigation properties, NO relationship config):**
New namespace `Geta.Cloud.Shared.Database` (catalog entities + their `IEntityTypeConfiguration`
classes). Would-be FK columns are present as plain scalars; configs may set keys/columns/indexes
but must NOT call `HasOne/HasMany/WithMany/HasForeignKey`. Fully-normalized table set (table
prefix `catalog_`, snake_case):

| Table | PK | Owner-id column (FK target in R2) |
|---|---|---|
| `catalog_product` | `Id` (string, language-suffixed; keep as-is) | — root |
| `catalog_variant` | `Sku` (string) | ProductId |
| `catalog_category` | `Id` (string) | ParentId (self-ref) |
| `catalog_product_category` (junction) | bigint identity | ProductId, CategoryId |
| `catalog_product_price` / `catalog_variant_price` (split per owner) | bigint identity | ProductId / VariantSku; PromotionId |
| `catalog_product_asset` / `catalog_variant_asset` / `catalog_category_asset` | bigint identity | owner id |
| `catalog_badge` | bigint identity | ProductId / VariantSku |
| `catalog_inventory` + `catalog_inventory_item` | bigint identity | ProductId/VariantSku; InventoryId |
| `catalog_promotion` | `Id` (string) | — reference data |
| `catalog_product_seo` / `catalog_variant_seo` (1:1) | bigint identity | owner id |
| `catalog_related_product_group` + `catalog_related_product_item` | bigint identity | ProductId; GroupId |
| `catalog_unit_conversion_factor` | bigint identity | ProductId / VariantSku |
| `catalog_*_property` (product/variant/category/price/inventory_item KV) | bigint identity | owner id; columns Key, Value, ValueType, KeyGroup |
| `catalog_product_tag` / `catalog_product_market` / `catalog_product_store` | bigint identity | ProductId |

Identifier rules: preserve string natural keys (`Product.Id`, `Variant.Sku`, `Category.Id`,
`Promotion.Id`); use `bigint identity` surrogate keys only for nameless child/junction rows
(autonumber, **not** GUIDs). Keep `catalog_product.ParentId` + `Language` as indexed scalar
columns to reproduce the existing `FetchVariantsByParentId` behavior; no separate "translation"
table.

**Generate Round 1 migration:**
```
dotnet ef migrations add R1_CreateTables_NoFk \
  --project lib/gcc/src/Geta.Cloud.Shared.Database \
  --startup-project lib/gcc/src/Geta.Cloud.Shared.Database
```
Verify the generated `Up()` contains only `CreateTable`/`CreateIndex` and **zero**
`AddForeignKey`/`ForeignKey(...)` calls.

---

## Phase 2 — Round 2 migration (add foreign keys)

- Add navigation properties to the entities (`Variant.Product`, `Product.Variants`,
  `Category.Parent`/`Children`, etc.) and configure relationships in the
  `IEntityTypeConfiguration` classes (`HasOne/WithMany/HasForeignKey`) onto the **existing**
  Round 1 scalar columns. Self-ref `catalog_category.ParentId` → `OnDelete(Restrict)`; child
  collections → `OnDelete(Cascade)`; `*_price.PromotionId` → nullable FK to `catalog_promotion`.
- `dotnet ef migrations add R2_AddForeignKeys` — because columns/types are unchanged, the diff
  emits only `AddForeignKey` (+ supporting `CreateIndex`), no table re-creation. Both migrations
  apply in order automatically on startup via `MigrateAsync`.

---

## Phase 3 — Repositories + EF→type mappers ("DB classes and non-migration definition")

In `Geta.Cloud.Catalog.Omnium.Core` add a `Persistence/` area (repositories + EF→type mappers)
that returns the **exact existing types** the handlers use:

- `ICatalogCategoryReadRepository`
  - `Task<OmniumProductCategory> GetCategoryById(string id, string language, CancellationToken)`
  - `Task<IEnumerable<OmniumProductCategoryTreeViewModel>> GetCategoryTree(string rootId, CategoryTreeFilter, CancellationToken)`
- `ICatalogProductReadRepository`
  - `Task<GccOmniumProduct> GetProductById(string id, string marketId, string storeId, CancellationToken)`
  - `Task<IEnumerable<GccOmniumProduct>> GetProductsByParentId(string parentId, string marketId, string storeId, CancellationToken)`

Implementation notes:
- `AsNoTracking()` everywhere; prefer `.Select(...)` projection into the target SDK/Gcc types
  (or `Include`/`ThenInclude` where projection is awkward). Avoid N+1.
- Category tree: load subtree under `rootId` (recursive CTE on `ParentId` or load-then-build
  in memory as the current handler does) and assemble `OmniumProductCategoryTreeViewModel`
  (SubCategories + ProductCount).
- EF→type mapping reuses the existing `ICreateFrom<,>` idiom (see
  `src/Geta.Cloud.Catalog.Omnium.Api/Features/Categories/ProductCategoryResponse.cs:40-97` and
  `Core/Features/Products/Models/SeoMetadata.cs`). Rebuild `Properties` from the KV tables into
  `List<OmniumPropertyItem>` (preserve `ValueType`/`KeyGroup` so `GetCombinedKey()`/`GetValue()`
  still work); rebuild `Prices`, `Assets`, `Badges`, `Inventory`, `RelatedProducts`, `Units`,
  `SeoInfo`, `Categories`.
- Hard mappings to mirror current behavior: filter prices/variants by market/store
  (`WHERE MarketId=@m AND (StoreId=@s OR StoreId IS NULL)`; "empty list = all" branch in C#);
  resolve the scalar "active" price in the mapper using today's rule.

Register `AddGccDatabase` already done in Phase 1; register the repositories in
`src/Geta.Cloud.Catalog.Omnium.Api/Extensions/ServiceCollectionExtensions.cs` (`AddOmniumServices`).

---

## Phase 4 — Hard-swap Omnium → DB for the example features (Categories + Product read)

No feature flag. Replace the data source so handlers keep returning the same types and the
controllers/caching are untouched.

- **GET /categories/{id}** — `Core/Features/ProductCategories/GetProductCategory.cs`: replace
  `IOmniumCategoryClient.GetCategoryById(...)` with `ICatalogCategoryReadRepository.GetCategoryById(...)`.
  Return type stays `OmniumProductCategory`; `ProductCategoriesController.cs:51` mapper unchanged.
- **GET /categories** — `Core/Features/ProductCategories/GetProductCategoryTree.cs`: replace the
  `SearchCategoryTree(...)` call (the data fetch only) with `GetCategoryTree(...)`. **Keep** the
  validator, customer-category-restriction logic, hidden-node filtering, sorting, and zero-product
  pruning unchanged. Controller cache wrapper (`ProductCategoriesController.cs:66-99`) unchanged.
- **GET /products/{id}** — `Core/Features/Products/GetProductById.cs`: replace
  `_productClient.SearchProducts(...)` (line ~202) and the parent-id second search in
  `AddVariantsAndPricesByParentId` (line ~83) with the new repo calls. **Keep** the in-handler
  `IGccCache` wrapper (key/TTL), customer-group/category logic, and all market/store/variant/
  warehouse post-filtering — they operate on `GccOmniumProduct` in memory and are source-agnostic.
- DI: in `ServiceCollectionExtensions.AddOmniumServices`, register the DB-backed repositories and
  remove (stop registering) the Omnium client(s) for the swapped features. Leave Omnium clients
  registered only where still used by not-yet-migrated features.

Caching requires no code changes in either feature; first-miss now hits PostgreSQL.

---

## Phase 5 — Index suggestions (next phase)

Derive index candidates from the predicates the handlers/repositories actually use, then add them
to `Geta.Cloud.Shared.Database` as a new migration (`HasIndex(...)` + `dotnet ef migrations add
AddCatalogReadIndexes`). Validate against real generated SQL with `EXPLAIN ANALYZE`.

| Table | Columns | Notes |
|---|---|---|
| catalog_product | `(ParentId)` | variant/group aggregation |
| catalog_product | `(IsActive, IsPublished)` partial `WHERE IsActive` | ubiquitous predicate |
| catalog_variant | `(Sku)` unique | SKU/inventory lookups |
| catalog_product_market | `(MarketId, ProductId)` | market membership |
| catalog_product_store | `(StoreId, ProductId)` | store membership |
| catalog_product_category | `(CategoryId, ProductId)` | include/exclude + per-category counts |
| catalog_category | `(ParentId)` (+ partial `WHERE NOT IsHidden`) | tree traversal (recursive CTE) |
| catalog_inventory_item | `(Sku, WarehouseCode)` | warehouse availability |
| catalog_promotion | `(IsActive, StartDate, EndDate)` | active-promotion search |

Prefer composite indexes with the most-selective equality column first; partial indexes for the
constant `IsActive=true` / `NOT IsHidden` predicates.

---

## Per-feature rollout sequencing (beyond the example)

Categories → Products(read) → ProductGroups → Variants → Promotions → Packages → Inventory →
Facets → Search. Inventory (real-time stock), Facets (aggregation), and Search (full-text +
relevance) are hard and may need PG full-text/`tsvector` or a separate index — treat as their own
efforts. `IProductRepository.GetAll` (feed/streaming) is a clean secondary seam: it already
returns the domain `Product`, so a DB-backed implementation slots in with no signature change.

---

## Discovery method for the other repos

This is a multi-repo initiative — the same Omnium→DB read-layer migration is applied to each
microservice in turn (this repo is the example). For every new repo, identify which objects must
be modeled in the DB by **statically tracing read endpoints to their data source**, and produce
an inventory table for sign-off **before** designing entities:

1. `grep` for `: CloudControllerBase` to find controllers.
2. Enumerate `[HttpGet]` read endpoints and their return types (writes/admin are out of scope —
   read layer only).
3. Follow each endpoint to its source: `mediator.Send(Query)` → `Handler`, or a direct
   service/repository call or `ICreateFrom<,>` mapper.
4. Detect the Omnium dependency in the handler/repo: an injected `IOmnium*Client`,
   `IInventoryClient`, the SDK `IClient` (`Geta.Integration.Omnium.Sdk`), or a repository that
   wraps one (e.g. `IProductRepository`).
5. Verdict per endpoint: Omnium-backed read → model the return type; reads from Mongo/compute/
   config → skip; writes/admin → skip; Search / Facets / real-time Inventory → "needs-decision"
   (don't auto-include — they don't map cleanly to a relational read model).

**Deliverable per repo** — a table to confirm before entity design:

| Controller | Endpoint (verb/route) | Handler | Omnium call? (client/method) | Return type | Verdict |
|---|---|---|---|---|---|

**Needs human confirmation (not derivable from code alone):** calls that funnel into the
un-checked-out `lib/gcc` shared submodule (implementation not visible); endpoints mixing Omnium
with other sources; config/tenant-gated branches that only call Omnium under certain settings.

## Critical files
- NEW: `lib/gcc/src/Geta.Cloud.Shared.Database/` (`*.csproj`, `GccDbContext.cs`,
  `GccDbContextFactory.cs`, `DatabaseMigrationHostedService.cs`, `ServiceCollectionExtensions.cs`,
  entities + `Configurations/`, `Migrations/`)
- `Geta.Cloud.Catalog.Omnium.sln` (register new project)
- `src/Geta.Cloud.Catalog.Omnium.Api/Geta.Cloud.Catalog.Omnium.Api.csproj:26-46` (project refs, both configs)
- `src/Geta.Cloud.Catalog.Omnium.Api/Startup.cs` (~line 65, `AddGccDatabase`)
- `src/Geta.Cloud.Catalog.Omnium.Api/appsettings.Development.json:2-5` (`connectionStrings:postgres`)
- `src/Geta.Cloud.Catalog.Omnium.Api/Extensions/ServiceCollectionExtensions.cs` (repo registration, drop Omnium client regs for swapped features)
- NEW: `src/Geta.Cloud.Catalog.Omnium.Core/Persistence/` (repositories + EF→type mappers)
- `src/Geta.Cloud.Catalog.Omnium.Core/Features/ProductCategories/GetProductCategory.cs`, `GetProductCategoryTree.cs`
- `src/Geta.Cloud.Catalog.Omnium.Core/Features/Products/GetProductById.cs`

## Verification
- **Build:** `dotnet build Geta.Cloud.Catalog.Omnium.sln` (after submodule checkout).
- **Migrations:** against a local Postgres, confirm R1 `Up()` has no FKs and R2 adds only FKs;
  start the API and confirm `MigrateAsync` applies both (tables + FKs present;
  `__EFMigrationsHistory` has both rows).
- **Endpoint parity:** seed the DB with a few categories/products, then call the unchanged
  endpoints and confirm identical response shape/status vs Omnium:
  - `GET /categories/{id}` (200 + `ProductCategory` JSON; 404 for missing)
  - `GET /categories` (category tree; verify `Include`/`Level`/filter behavior + caching)
  - `GET /products/{id}` (verify variants, prices, properties, market/store filtering)
  Use existing tests in `tests/Geta.Cloud.Catalog.Omnium.Api.Tests/` and add repository/mapper
  unit tests asserting EF→`OmniumProductCategory`/`GccOmniumProduct` parity.
- **Indexes (Phase 5):** `EXPLAIN ANALYZE` the repo queries to confirm index usage.
