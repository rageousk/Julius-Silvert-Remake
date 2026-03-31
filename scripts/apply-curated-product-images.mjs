/**
 * One explicit food / dish / ingredient image per SKU (no humans, animals, nature, or empty packaging).
 * Unsplash CDN ids chosen from food search captions.
 *
 * Run: node scripts/apply-curated-product-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const filePath = path.join(root, "mock-data", "products.json");

function u(slug) {
  return `https://images.unsplash.com/photo-${slug}?auto=format&fit=crop&w=600&h=400&q=80`;
}

/** SKU → image URL. Each photo slug must appear at most once. */
const BY_SKU = {
  "JS-MP-001": u("1753440343939-13984b0e9aa7"),
  "JS-MP-002": u("1544025162-d76694265947"),
  "JS-MP-003": u("1682991136736-a2b44623eeba"),
  "JS-MP-004": u("1587593810167-a84920ea0781"),
  "JS-MP-005": u("1764620931673-ba46205f2e4e"),
  "JS-MP-006": u("1546010361-3b7b468209e3"),
  "JS-MP-007": u("1648141294089-ccf942b889ca"),
  "JS-MP-008": u("1607599355943-640ad627fa0b"),
  "JS-MP-009": u("1617954096142-d712bc1dad61"),
  "JS-MP-010": u("1759670338079-8633e15653f2"),

  "JS-DE-001": u("1645802734040-26f0265830c7"),
  "JS-DE-002": u("1581868164904-77b124b80242"),
  "JS-DE-003": u("1635436338433-89747d0ca0ef"),
  "JS-DE-004": u("1768850418252-37af725e46bb"),
  "JS-DE-005": u("1771748649027-a84e8e3c5fd9"),
  "JS-DE-006": u("1760273464017-4bb7dfa42d91"),
  "JS-DE-007": u("1773332585749-5146862ba746"),
  "JS-DE-008": u("1712056407271-e51fdc896637"),
  "JS-DE-009": u("1745256698394-867c94a3a0b4"),
  "JS-DE-010": u("1627935722051-395636b0d8a5"),

  "JS-CC-001": u("1590912710024-6d51a6771abd"),
  "JS-CC-002": u("1706512998255-c2d2dcf2ace9"),
  "JS-CC-003": u("1519411792752-25c2468cccb3"),
  "JS-CC-004": u("1688381691547-36831dd5f435"),
  "JS-CC-005": u("1579445767201-7a5b4e0070a9"),
  "JS-CC-006": u("1767500539097-d913d9aa731b"),
  "JS-CC-007": u("1764436988814-4eff7322ee9c"),
  "JS-CC-008": u("1771626577210-286aca285737"),
  "JS-CC-009": u("1632862900366-24c6a79e38f8"),
  "JS-CC-010": u("1646576248496-bd427f77bb17"),

  "JS-SU-001": u("1767469576701-b05165afd418"),
  "JS-SU-002": u("1663430218462-8024770c830e"),
  "JS-SU-003": u("1772285253181-b1257afb3698"),
  "JS-SU-004": u("1612156723470-10f426219f63"),
  "JS-SU-005": u("1764158156827-0df193e9783c"),
  "JS-SU-006": u("1768716574889-e9af8e7f7ae8"),
  "JS-SU-007": u("1644203542040-2df37e3580ef"),
  "JS-SU-008": u("1605940374327-ca3508431b42"),
  "JS-SU-009": u("1572442388796-11668a67e53d"),
  "JS-SU-010": u("1758346971377-31a61f90a3e7"),

  "JS-PA-001": u("1619566636858-b78c636a75b4"),
  "JS-PA-002": u("1760445529715-24d3245ce80d"),
  "JS-PA-003": u("1586201376326-cb89e7a087e2"),
  "JS-PA-004": u("1624968665982-84bac2a2821e"),
  "JS-PA-005": u("1596797038530-2c107229654b"),
  "JS-PA-006": u("1547592166-23ac45744acd"),
  "JS-PA-007": u("1542838132-92c53300491e"),
  "JS-PA-008": u("1563805042-7684c019e1cb"),
  "JS-PA-009": u("1512058564366-18510be2db19"),
  "JS-PA-010": u("1609770424775-39ec362f2d94"),

  "JS-SF-001": u("1559058789-672da06263d8"),
  "JS-SF-002": u("1756364084889-9a8d9ece6112"),
  "JS-SF-003": u("1770839112008-f6a165687cca"),
  "JS-SF-004": u("1772155657429-bf1f7d64934b"),
  "JS-SF-005": u("1768725845685-b88ca2aa192a"),
  "JS-SF-006": u("1710508852956-f1eba75d7580"),
  "JS-SF-007": u("1758384075930-6e3835d22b1d"),
  "JS-SF-008": u("1605493624470-1e1b5ba0078e"),
  "JS-SF-009": u("1739785938237-73b3654200d5"),
  "JS-SF-010": u("1739785938093-c2b6befeca2f"),

  "JS-FR-001": u("1684815495679-f6e6bc0634ec"),
  "JS-FR-002": u("1466637574441-749b8f19452f"),
  "JS-FR-003": u("1624174503860-478619028ab3"),
  "JS-FR-004": u("1617177447175-7b9640e3966b"),
  "JS-FR-005": u("1458917524587-d3236cc8c2c8"),
  "JS-FR-006": u("1748342319942-223b99937d4e"),
  "JS-FR-007": u("1555507036-ab1f4038808a"),
  "JS-FR-008": u("1564988208597-e5c88b4cd007"),
  "JS-FR-009": u("1717838208427-57ce44a503e2"),
  "JS-FR-010": u("1772984613890-e3bfbca7f245"),

  "JS-PR-001": u("1745256489409-7dc5d3dab8e1"),
  "JS-PR-002": u("1631021967261-c57ee4dfa9bb"),
  "JS-PR-003": u("1634114042751-527be6421f41"),
  "JS-PR-004": u("1609869882537-6a860e45a0d6"),
  "JS-PR-005": u("1718196917011-801cddb84334"),
  "JS-PR-006": u("1573566291259-fd494a326b60"),
  "JS-PR-007": u("1660255940824-b712b5b03caf"),
  "JS-PR-008": u("1756574747685-257ddaebe519"),
  "JS-PR-009": u("1709111573644-867fb9b0d185"),
  "JS-PR-010": u("1512621776951-a57141f2eefd"),

  "JS-BP-001": u("1760445528355-19c965df8d4d"),
  "JS-BP-002": u("1760445528974-e6dedad99336"),
  "JS-BP-003": u("1576186726580-a816e8b12896"),
  "JS-BP-004": u("1591274603033-b63d98dd3b2e"),
  "JS-BP-005": u("1772915516557-2d57f94b0bd0"),
  "JS-BP-006": u("1668723969147-ec60e25b250d"),
  "JS-BP-007": u("1497534446932-c925b458314e"),
  "JS-BP-008": u("1509440159596-0249088772ff"),
  "JS-BP-009": u("1551185618-07fd482ff86e"),
  "JS-BP-010": u("1638792958866-9b3f787ec709"),

  "JS-OV-001": u("1759749597968-d9f3a5057405"),
  "JS-OV-002": u("1758524152053-2d0ff084142d"),
  "JS-OV-003": u("1568708297860-2197031e5db6"),
  "JS-OV-004": u("1760445528823-fd942d4b459b"),
  "JS-OV-005": u("1760445529098-949fcfc7c9a9"),
  "JS-OV-006": u("1759749597861-e90685f026b4"),
  "JS-OV-007": u("1760445530321-e6875af0b415"),
  "JS-OV-008": u("1759749597905-e2fed85d8cd5"),
  "JS-OV-009": u("1579113800032-c38bd7635818"),
  "JS-OV-010": u("1759749597823-3673f3325e8d"),
};

const allSlugs = Object.values(BY_SKU).flatMap((url) => {
  const m = url.match(/photo-([0-9]+-[a-f0-9]+)/);
  return m ? [m[1]] : [];
});
if (allSlugs.length !== Object.keys(BY_SKU).length) {
  console.error("Each BY_SKU entry must contain one photo slug.");
  process.exit(1);
}
const slugSeen = new Set();
for (const s of allSlugs) {
  if (slugSeen.has(s)) {
    console.error("Duplicate photo slug in BY_SKU:", s);
    process.exit(1);
  }
  slugSeen.add(s);
}

const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
const used = new Set();
for (const p of data) {
  const url = BY_SKU[p.sku];
  if (!url) {
    console.error("Missing image mapping for SKU:", p.sku);
    process.exit(1);
  }
  if (used.has(url)) {
    console.error("Duplicate image URL for SKU:", p.sku, url);
    process.exit(1);
  }
  used.add(url);
  p.imageUrl = url;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
console.log("Updated", data.length, "products with food-only image URLs.");
