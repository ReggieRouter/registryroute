# Registry Route — SOS Search Tier Research (Top-20 States)

**Date:** 2026-06-12 · **Feeds:** LEN-301 redesign tier model (`searchTemplate` pre-fill vs manual) + future `canSurfaceInline` flag
**Companion data file:** `states-tier-data.json` (same directory)
**Method:** baseline URLs from `~/Desktop/RR/states.json` verified via live curl/WebFetch where possible; where bot walls blocked direct fetches, mechanics were read from the sites' own served/archived JavaScript (Wayback Machine), official agency pages, and search-engine-indexed live result pages. Each finding labels what was actually fetched vs inferred.

---

## Summary

| Tier | Count | States |
|---|---|---|
| **Pre-fill capable** (GET deep-link with `{query}`) | **1** | FL |
| **Manual** (POST-only / SPA / captcha — confirmed) | **18** | CA, TX, NY, PA, IL, OH, GA, NC, MI, NJ, VA, WA, AZ, TN, MA, IN, MO, MD |
| **Unverified** (bot-blocking prevented any test) | **1** | CO (likely manual; Struts POST historically) |

| `canSurfaceInlineCandidate` | Count | States |
|---|---|---|
| true | 11 | TX, FL, NY, IL, GA, NC, NJ, MA, IN, MO, CO |
| false | 9 | CA, PA, OH, MI, VA, WA, AZ, TN, MD\* |

\* MD is recorded **true** in the JSON (server-rendered results) but is captcha-gated in practice — see per-state note. Counting MD as true: 12 true / 8 false.

### Stale states.json URLs (5, plus 1 cosmetic)

| State | states.json URL | What happened | Replacement |
|---|---|---|---|
| **NJ** | `njportal.com/DOR/BusinessNameSearch` | now 302s to my.nj.gov state LOGIN | `https://www.njportal.com/DOR/BusinessNameSearch/Search/BusinessName` (still anonymous) |
| **WA** | `sos.wa.gov/corps/search.aspx` | redirects; corps app retired | `https://ccfs.sos.wa.gov/#/BusinessSearch` |
| **AZ** | `apps.azsos.gov/apps/tntp/se.html` | 403; and it was the trade-NAME search, wrong system — entities live at the Corporation Commission; eCorp itself decommissioned 2026-01-02 | `https://arizonabusinesscenter.azcc.gov/businesssearch` (launched 2026-01-12) |
| **MO** | `sos.mo.gov/BusinessEntity/soskb/csearch.asp` | old SOSKB gone, 302s away | `https://bsd.sos.mo.gov/BusinessEntity/BESearch.aspx?SearchType=0` |
| **IL** | `ilsos.gov/corporatellc/` | double-302s to new app (works, but two hops) | `https://apps.ilsos.gov/businessentitysearch/` |
| FL (cosmetic) | `dos.myflorida.com/sunbiz/search/` | domain renamed, 301 | `https://dos.fl.gov/sunbiz/search/` (search app itself: `search.sunbiz.org`) |

### Cross-cutting findings

- **GET deep-linking is nearly extinct** among major states: only Florida's Sunbiz (server-rendered ASP.NET MVC, indexed by Google) still executes a search from a URL. Everything else is a JS SPA, a VIEWSTATE/anti-forgery POST, or captcha-gated.
- **Bot-blocking is the norm**: Cloudflare challenges (FL search host, PA, OH, GA, NC, MI, TN, CO), Imperva Incapsula (CA, MA), connection-level fingerprint blocking (NY), captcha-in-the-search-path (VA, IN, MD, AZ; TN has the plumbing). Any future scraping layer needs a headless browser or official APIs, not curl.
- **Official machine-readable side doors exist** in four states and are the best long-term `canSurfaceInline` paths: TX Comptroller JSON GET (open), CO Socrata open-data API (open), CA "calico" keyed API (free key), OH `businesssearchapi.ohiosos.gov` (Cloudflare-bound).
- **Entity-DETAIL deep links** (need an ID first) exist even where search deep links don't: OH `?=businessDetails/{id}`, GA `BusinessInformation?businessId={id}`, IL `CorporateLlcController?command=mms&fileNbr={n}`, VA `BusinessInformation?businessId={id}` (documented).

---

## Per-state findings

### CA — California · MANUAL
- **URL:** `https://bizfileonline.sos.ca.gov/search/business` — verified live (HTTP 200), unchanged.
- **Deep link:** none. Tecuity "bizfile" SPA; search = `POST /api/Records/businesssearch` with JSON body. No querystring prefill documented or evident. *(pattern-documented)*
- **Inline candidate:** **false** — results render client-side from the POST API; whole host behind Imperva Incapsula (curl receives a bot-wall script).
- **Side door:** official keyed GET API documented in the SOS's own guide: `https://calico.sos.ca.gov/cbc/v1/api/BusinessEntityKeywordSearch?search-term={q}` + `BusinessEntityDetails?entity-number={n}`; free `Ocp-Apim-Subscription-Key` self-serve at calicodev.sos.ca.gov; returns up to 150 entities as JSON.
- **Sources:** curl probes; California SOS BE Public Search API Guide v1.0.4 (calicodev.sos.ca.gov PDF, read directly). **Confidence: high.**

### TX — Texas · MANUAL (but open JSON API)
- **URL:** `https://comptroller.texas.gov/taxes/franchise/account-status/search` — verified live. This is the Comptroller Taxable Entity Search, not an SOS product (the actual SOS search, SOSDirect, is paid). Old `mycpa.cpa.state.tx.us/coa/` now 302s here — baseline is canonical.
- **Deep link:** none for the page — its JS reads no URL params (grepped: no `URLSearchParams`/`location.search`). *(fetch-verified negative)*
- **Inline candidate:** **true** — the page's own unauthenticated GET JSON API was fetch-verified: `https://comptroller.texas.gov/data-search/franchise-tax?name=ACME%20BRICK` → `{"success":true,"data":[{"name":"ACME BRICK SALES COMPANY, LLC","taxpayerId":"12038834797",...}],"count":10}`. Also accepts `?taxpayerId=`, `?fileNumber=`. Caveats: payload is skinny (name, taxpayerId, mailing ZIP — no franchise status or agent in the search response) and broad queries get HTTP 413 "refine".
- **Sources:** direct curl of page + API; inline page JS. **Confidence: high.**

### FL — Florida · **PRE-FILL CAPABLE** (the only one)
- **URL:** landing page moved `dos.myflorida.com/sunbiz/search/` → 301 → `https://dos.fl.gov/sunbiz/search/` (update states.json). Search app unchanged: `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName`.
- **Deep link:** `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=EntityName&searchTerm={query}` *(pattern-documented)* — could not fetch directly (Cloudflare JS challenge on search.sunbiz.org blocked curl AND WebFetch), but Google's index contains live result pages at exactly this URL pattern, proving the GET still executes server-side.
- **Inline candidate:** **true** — classic server-rendered ASP.NET MVC results (that's why Google can index them): Corporate Name, Document Number, Status inline + detail links. Scraper needs to pass Cloudflare (real browser / residential IP).
- **Sources:** curl of both domains; dos.fl.gov link extraction; Google-indexed SearchResults URLs. **Confidence: medium-high.**

### NY — New York · MANUAL (unverified mechanics)
- **URL:** `https://apps.dos.ny.gov/publicInquiry/` — current per the official dos.ny.gov redirect (fetched) and fresh index, but the host **reset every TCP/TLS connection** from curl and WebFetch (client-fingerprint blocking), so nothing on the app itself could be fetched.
- **Deep link:** none found — form-driven .NET app (Entity Name / DOS ID dropdown, 500-result cap); no GET pattern documented anywhere; indexed result URLs carry no query params. *(unconfirmed)*
- **Inline candidate:** **true (unverified)** — third-party docs consistently report the results grid shows entity name, DOS ID, status, type, filing date, county inline; rendering mechanism unconfirmed.
- **Sources:** dos.ny.gov/corporation-and-business-entity-database (fetched redirect body); businessanywhere.io NY guide. **Confidence: medium.**

### PA — Pennsylvania · MANUAL
- **URL:** `https://file.dos.pa.gov/search/business` — current per pa.gov's official Record Searches page (fetched); the host itself serves a Cloudflare managed challenge (403) to curl and WebFetch.
- **Deep link:** none — same Tecuity bizfile SPA platform as California (identical `/search/business` route, `POST /api/Records/businesssearch`); no querystring prefill documented for any deployment of this platform. *(pattern-documented)*
- **Inline candidate:** **false** — results grid (name, type, status, filing date, registered office per third-party docs) renders client-side from the POST JSON API, behind Cloudflare.
- **Sources:** curl headers; pa.gov Record Searches page; businessanywhere.io PA guide. **Confidence: medium.**

### IL — Illinois · MANUAL
- **URL:** states.json `ilsos.gov/corporatellc/` still works but via double 302 → **`https://apps.ilsos.gov/businessentitysearch/`** (update to final target). WAF kills non-browser connections at the HTTP/2 layer, so verification used Wayback captures (2024-06, 2025-01 redirect chain; 2023-08 app source) + current index.
- **Deep link:** none — archived form source read directly: `method="post"`, hidden `command=entitySearch`, fields `searchMethod` + `searchValue`; no GET-search capture exists in the entire archive. *(pattern-documented)* Detail pages ARE GET-linkable: `CorporateLlcController?command=mms&fileNbr={n}&type=MBR`.
- **Inline candidate:** **true** — results are server-rendered JSP tables (name, file number, status), POST-only. Note: Illinois statute explicitly prohibits bulk extraction from this database.
- **Sources:** Wayback CDX + snapshots; businessrocket.com guide. **Confidence: medium.**

### OH — Ohio · MANUAL (details-only deep link)
- **URL:** `https://businesssearch.ohiosos.gov` — unchanged; origin confirmed up (Ohio-SOS-branded Cloudflare waiting room — the strictest bot wall of the 20, defeated even a rendering proxy).
- **Deep link:** none for SEARCH — code-verified negative from the app's archived `script.min.js`: the `?=` querystring is matched **only** against `businessDetails/`, so `?=ACME` falls through to an empty form. The real (official "Copy URL") deep link is details-only: `https://businesssearch.ohiosos.gov/?=businessDetails/{entityNumber}`. *(pattern-documented, 2023 code copy)*
- **Inline candidate:** **false** — jQuery/DataTables SPA; results come from client-side GET JSON calls to `businesssearchapi.ohiosos.gov` (endpoints loaded at runtime from `/ajax/endPoints.json`), same Cloudflare zone, `withCredentials` — not anonymously scrapeable.
- **Sources:** Wayback page + JS bundles; CDX `?=businessDetails/*` captures; live CF challenge page. **Confidence: medium-high.**

### GA — Georgia · MANUAL
- **URL:** `https://ecorp.sos.ga.gov/BusinessSearch` — unchanged (Wayback captured 200 on **2026-01-02**; live host Cloudflare-challenges bots).
- **Deep link:** none — code-verified from the fresh Jan-2026 archived copy: page contains **no `<form>` at all**; Search button click handler builds `{SearchType, SearchValue, SearchCriteria}` and calls `$.submitForm('/BusinessSearch', {search: data})` — a dynamically created POST; the code never issues GET searches. *(pattern-documented)*
- **Inline candidate:** **true** — results render server-side into a table on the same page (name, control number, type, status, office address). Detail GET once id known: `/BusinessSearch/BusinessInformation?businessId={id}&businessType={type}&fromSearch=True`.
- **Sources:** Wayback snapshot 20260102 (full markup + inline JS). **Confidence: high.**

### NC — North Carolina · MANUAL
- **URL:** `https://www.sosnc.gov/online_services/search/by_title/_Business_Registration` — unchanged (archived 200 2025-09; live Cloudflare-challenged to bots).
- **Deep link:** none — decisive: form POSTs to `/online_services/search/Business_Registration_Results` with an ASP.NET Core anti-forgery `__RequestVerificationToken`, so a GET cannot pass validation; an archived bare GET of the results URL is a 302 back to the form. The `?words=` lead does not pan out. Field names for the record: `CorpSearchType`, `Words`, `SearchCriteria`. *(pattern-documented)*
- **Inline candidate:** **true** — server-rendered results table (legal name, SOSID, status, entity type); scrapeable only by replaying the POST with fresh token + cookie.
- **Sources:** Wayback snapshot 20250920 (full HTML); CDX of results URL. **Confidence: high.**

### MI — Michigan · MANUAL
- **URL:** `https://mibusinessregistry.lara.state.mi.us/search/business` — **live-verified 2026-06-12** via rendering proxy (portal notices dated 6/12/2026). This portal replaced COFS on 2025-06-23; COFS is dead.
- **Deep link:** none — **fetch-verified negative**: six variants live-tested (`/search/business:ACME`, `/search/business/ACME`, `?search=`, `?q=`, `?searchTerm=`, `?name=ACME`) — every one renders the plain empty form, zero pre-executed results.
- **Inline candidate:** **false** — JS SPA, results render client-side from internal XHR API behind Cloudflare; nothing entity-related in initial HTML. (Domain has zero Wayback captures — blocks the crawler.)
- **Sources:** live renders (base + 6 variants); michigan.gov/lara. **Confidence: high.**

### NJ — New Jersey · MANUAL · **STALE URL**
- **URL:** baseline `njportal.com/DOR/BusinessNameSearch` now **302s to the my.nj.gov state login** — record `https://www.njportal.com/DOR/BusinessNameSearch/Search/BusinessName`, which is still anonymous (fetch-verified 200).
- **Deep link:** none — fetch-verified: `?BusinessName=ACME` returns the empty form (param ignored); search is POST-only with anti-forgery token + session cookie.
- **Inline candidate:** **true** — full handshake completed during research (GET form → extract CSRF token → POST `BusinessName=ACME`): 207 KB server-rendered results table with **Business Name, Entity Id, City, Type, Incorporated Date** (no status or agent in results). No bot-blocking encountered — the only state of the 20 where results were scraped end-to-end.
- **Sources:** direct curl (redirect chain, form, POST results). **Confidence: high.**

### VA — Virginia · MANUAL
- **URL:** `https://cis.scc.virginia.gov/EntitySearch/Index` — live (root 302s to an internal cookie-consent interstitial; search page fetched after consent POST).
- **Deep link:** none — fetch-verified from the served JS: Search runs **reCAPTCHA v3**, POSTs the token to `/GoogleCaptchaHelper/VerifyReCaptcha`, then `$.submitForm` with `__RequestVerificationToken`. The name input has no `name=` attribute, so even a raw form GET is impossible.
- **Inline candidate:** **false (in practice)** — results are server-rendered on the postback, but captcha + CSRF + consent session gate every search; not automatable. Detail pattern `/EntitySearch/BusinessInformation?businessId={id}` (documented, unfetched).
- **Sources:** direct curl incl. consent handshake + page JS. **Confidence: high (mechanics) / medium (results layout).**

### WA — Washington · MANUAL · **STALE URL**
- **URL:** baseline `sos.wa.gov/corps/search.aspx` is **stale** — fetch-verified redirect to `https://ccfs.sos.wa.gov/#/` ; record `https://ccfs.sos.wa.gov/#/BusinessSearch`.
- **Deep link:** none — Angular SPA; criteria live in component state; the `#/BusinessSearch` hash fragment never reaches the server. *(fetch-verified shell-only response)*
- **Inline candidate:** **false** — results client-rendered from `POST https://ccfs-api.prod.sos.wa.gov/api/BusinessSearch/GetBusinessSearchList` (historically returned UBI, status, registered agent inline), but direct API calls now return "System verification in progress, please wait." — anti-bot gate.
- **Sources:** curl redirect trace; direct API POSTs. **Confidence: high (staleness) / medium (API schema).**

### AZ — Arizona · MANUAL · **STALE URL + WRONG SYSTEM**
- **URL:** baseline `apps.azsos.gov/apps/tntp/se.html` returned 403 — and it's the SOS **trade-name** search anyway; Arizona business *entities* are searched at the **Corporation Commission**. eCorp was decommissioned 2026-01-02; its replacement **Arizona Business Center** launched 2026-01-12 (`ecorp.azcc.gov/EntitySearch/Index` 301s there). Record `https://arizonabusinesscenter.azcc.gov/businesssearch`.
- **Deep link:** none — fetch-verified via the served Angular bundle (`main.d750da2e42a8617d.js`): navigation uses `router.navigate(["businesssearch"], {state:{..., captchaToken}})` — router state + captcha, not query params; `?businessname=ACME` returns the unbound SPA shell.
- **Inline candidate:** **false** — results from `api-azbusinessconnectonline.azcc.gov/api/businesssearch/get`, which returns **401 "Authentication Failed."** without a token.
- **Sources:** ACC launch announcement (azcc.gov, 2026-01-08); curl traces; bundle inspection. **Confidence: high.**

### TN — Tennessee · MANUAL
- **URL:** `https://tncab.tnsos.gov/business-entity-search` — live (HTTP 200) and canonical: sos.tn.gov/businesses links only here; old tnbear.tn.gov resolves in DNS but TCP times out (dead from the public internet despite stale links in search results).
- **Deep link:** none — fetch-verified: `?Name=ACME` returns 200, the param is echoed into grid sort-link querystrings but **not bound** (no input prefill, no querystring-reading JS, embedded datasource shows `"total":0`). Search is a Kendo grid AJAX `POST /WidgetManagement/GenericGrid/ExecuteSearchProc2` with **server-encrypted** procName/paramJson; replays with the page's own tokens return `[]`.
- **Inline candidate:** **false** — client-rendered JSON into a Kendo grid (no server-rendered rows); params opaque per page-load; recaptcha endpoint wired in, Cloudflare front. (Grid config does expose Control No., Name, Status, Formed In once rendered in a real browser.)
- **Sources:** direct curl of page + AJAX endpoint replays; sos.tn.gov. **Confidence: high.**

### MA — Massachusetts · MANUAL
- **URL:** `https://corp.sec.state.ma.us/CorpWeb/CorpSearch/CorpSearch.aspx` — unchanged; HEAD 200 (`x-aspnet-version: 4.0.30319`).
- **Deep link:** none — classic ASP.NET WebForms with `__VIEWSTATE`, effectively POST-only; no GET pattern documented anywhere. Caveat: the page **body** was unfetchable — Imperva **Incapsula** JS challenge intercepts GETs (HEAD passes) — so the negative rests on server headers + third-party docs, not form inspection. *(pattern-documented)*
- **Inline candidate:** **true (with caveat)** — results are a server-rendered HTML table (entity name, ID number, address) per documented behavior; Incapsula blocks naive scrapers before they get there.
- **Sources:** curl HEAD/GET; secstates.com, cobaltintelligence.com MA guides. **Confidence: medium.**

### IN — Indiana · MANUAL
- **URL:** `https://bsd.sos.in.gov/publicbusinesssearch` — unchanged, but the AWS load balancer intermittently returns **soft 404s with a near-correct body** (two 404s, then a 200 with the full app, same UA). Treat 404s as flaky; retry before declaring dead.
- **Deep link:** none — fetch-verified from the actual page JS: Search handler builds a `BusinessSearch` object (`QuickSearch.BusinessName`, `StartsWith/Contains/ExactMatch`) and submits via `$.submitForm('/publicbusinesssearch')` (POST), and calls `Validaterecapchaap()` — **reCAPTCHA required** ("You must successfully complete the Captcha"; an `isCapchaAllow` flag exists but can't be relied on).
- **Inline candidate:** **true (captcha-gated)** — post-search grid is server-rendered and the richest documented of the batch: Business ID, Business Name, Name Type, Entity Type, Principal Office Address, Registered Agent Name, Status.
- **Sources:** direct curl of page + JS; signzy.com IN guide. **Confidence: high.**

### MO — Missouri · MANUAL · **STALE URL**
- **URL:** baseline `sos.mo.gov/BusinessEntity/soskb/csearch.asp` is **stale** — fetch-verified 302 to `https://bsd.sos.mo.gov/BusinessEntity/BESearch.aspx?SearchType=0` (friendly alias `bsd.sos.mo.gov/search`). Old SOSKB system is gone.
- **Deep link:** none — fetch-verified: WebForms + Telerik RadGrid, `method="post"` with massive VIEWSTATE. Only GET param is `SearchType` (0 name / 1 agent / 2 availability / 3 charter no.) — selects the search *mode*, cannot carry the query.
- **Inline candidate:** **true — best scrape target of the 20**: server-rendered Telerik grid with **Business Name, Charter No., Type, Status, Created, Registered Agent Name**, and **no captcha or bot-blocking observed** (just `x-robots-tag: noindex`). Requires VIEWSTATE POST replay.
- **Sources:** direct curl of both URLs + full page body. **Confidence: high.**

### MD — Maryland · MANUAL
- **URL:** `https://egov.maryland.gov/BusinessExpress/EntitySearch` — baseline (lowercase path) resolves to it; fetch-verified 200, ASP.NET MVC ("Tyler Maryland").
- **Deep link:** none — fetch-verified negative on both leads: `EntitySearch/Search?businessName=ACME` and `?searchAction=Search&BusinessName=ACME` return the **byte-identical empty form** (24,943 B, zero ACME). Real form POSTs with anti-forgery token; a fully correct POST replay (token + cookie + BusinessName) was rejected: **"Unable to verify captcha. Please try again."** — invisible server-side captcha.
- **Inline candidate:** **true in principle, captcha-gated in practice** — successful searches render results server-side (Business Name, Department ID, status); no AJAX/JSON search endpoints in the page source.
- **Sources:** direct curl: form, GET attempts, authenticated POST replay. **Confidence: high.**

### CO — Colorado · UNVERIFIED (likely manual)
- **URL:** `https://www.sos.state.co.us/biz/BusinessEntityCriteriaExt.do` — still the official URL per live index, but **every** request to `/biz/*` (curl with full browser headers AND WebFetch) got a Cloudflare hard 403. Liveness inferred, not fetched.
- **Deep link:** **unconfirmed** — the `BusinessEntityResults.do?searchName=ACME` lead could not be tested (403 before reaching the app); the Struts criteria page historically POSTs and no documented working GET surfaced. Recorded as null/unconfirmed; worth retesting from a residential IP before final tiering.
- **Inline candidate:** **true — via an open-data side door, fetch-verified**: Colorado publishes the full business register as a Socrata API: `https://data.colorado.gov/resource/4ykn-tg5h.json?$where=starts_with(upper(entityname),'ACME')` returned live JSON with `entityid`, `entityname`, `entitystatus`, `entitytype`, principal/mailing addresses, registered-agent name/address (data current — included a March-2026 dissolution). This, not the SOS site, is the practical CO integration path.
- **Sources:** curl attempts; data.colorado.gov 4ykn-tg5h (fetched); llcuniversity 50-state list. **Confidence: medium (site) / high (Socrata).**

---

## Implications for the LEN-301 tier model

1. **The two-tier model collapses in practice to "Florida + everyone else"** for URL pre-fill. If the redesign's pre-fill tier is to be more than one state, consider a third tier: "machine-readable side door" (TX, CO open APIs; CA keyed API) where Registry Route could pre-execute the lookup server-side and deep-link the user to the entity *detail* page instead (OH/GA/IL/VA all have GET detail URLs).
2. **`canSurfaceInline` should distinguish "data is inline in HTML" from "data is reachable by a bot."** 12 states render results server-side, but only NJ and MO were actually scrapeable end-to-end during this research (and TX/CO via JSON APIs). Captcha (VA, IN, MD, AZ) and bot walls (CA, MA, FL, PA, OH, NC, IL, MI, TN, CO, NY, WA) gate the rest.
3. **Re-verification cadence matters**: two of the 20 systems were replaced within the last 12 months (MI 2025-06, AZ 2026-01) and five baseline URLs in states.json are already stale. Suggest re-running this sweep quarterly.
