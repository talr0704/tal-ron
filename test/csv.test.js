import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGuests, exportGuests } from "../src/services/csv.js";
test("CSV imports Hebrew quoted fields, phones, BOM and Windows newlines", () => {
  const [g] = parseGuests(
    '\uFEFFname,phone,side,maxAdults,maxChildren,maxUnder5\r\n"ישראלי, נועה",0501234567,tal,1,2,0\r\n',
  );
  assert.equal(g.name, "ישראלי, נועה");
  assert.equal(g.phone, "0501234567");
  assert.equal(g.maxChildren, 2);
});
test("CSV rejects missing headers and invalid adult quotas before writing", () => {
  assert.throws(() => parseGuests("name\nאורח"));
  assert.throws(() =>
    parseGuests(
      "name,phone,side,maxAdults,maxChildren,maxUnder5\nאורח,,tal,0,0,0",
    ),
  );
});
test("CSV export has Excel BOM, neutralizes formulas and excludes tokens", () => {
  const text = exportGuests([
    {
      name: '=HYPERLINK("test")',
      phone: "+972500000000",
      side: "ron",
      maxAdults: 1,
      maxChildren: 0,
      maxUnder5: 0,
      token: "secret",
    },
  ]);
  assert.ok(text.startsWith("\uFEFF"));
  assert.ok(text.includes("'=HYPERLINK"));
  assert.ok(!text.includes("secret"));
  assert.ok(text.includes("\r\n"));
});
