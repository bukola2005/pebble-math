// A stand-in for Supabase, for the reload tests: just enough of its REST
// API, over tables kept in memory, that what the game saves is what a
// reload of the page reads back. Nothing here knows about the game: it
// stores rows, filters them and returns them, as PostgREST would.
import { createServer } from "node:http";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, HEAD, OPTIONS",
  "access-control-expose-headers": "content-range",
};

// Rows that can't be added twice, as the real tables' keys have it.
const KEYS = { players: ["id"], stall_progress: ["player_id", "stall_id"] };
const NOT_FILTERS = ["select", "order", "limit", "offset", "columns", "on_conflict"];

const parse = (value) => (value === "true" ? true : value === "false" ? false : value === "null" ? null : value);

const shaped = (row, select) => {
  if (!select || select === "*") return { ...row };
  const out = {};
  for (const column of select.split(",").map((c) => c.trim()).filter(Boolean)) out[column] = row[column] ?? null;
  return out;
};

const matches = (row, filters) =>
  filters.every(({ column, op, value }) => {
    if (op === "eq") return String(row[column]) === String(parse(value));
    if (op === "in") return value.replace(/^\(|\)$/g, "").split(",").includes(String(row[column]));
    if (op === "is") return row[column] === parse(value);
    return true;
  });

/**
 * Starts it on a free port. Returns:
 *   url            where it is
 *   seed(tables)   replaces every table: { players: [...], stall_progress: [...] }.
 *                  `missing: [...]` names columns to answer for as if they
 *                  had not been added yet (Postgres error 42703)
 *   tables()       every table, as it is now
 *   close()
 */
export async function startStandIn() {
  let db = {};
  let missing = [];

  const server = createServer((req, res) => {
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { "content-type": "application/json", ...cors, ...headers });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };
    if (req.method === "OPTIONS") return send(204);
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const url = new URL(req.url, "http://localhost");
      const body = raw ? JSON.parse(raw) : null;
      // Whoever the stored session says is signed in.
      if (url.pathname === "/auth/v1/user") {
        return send(200, { id: "parent-1", aud: "authenticated", role: "authenticated", email: "parent@example.com" });
      }
      const table = url.pathname.match(/^\/rest\/v1\/(\w+)$/)?.[1];
      if (!table) return send(404, { message: `not in the stand-in: ${req.method} ${url.pathname}` });
      db[table] ??= [];

      const select = url.searchParams.get("select");
      const filters = [...url.searchParams]
        .filter(([key]) => !NOT_FILTERS.includes(key))
        .map(([column, expression]) => {
          const [op, ...rest] = expression.split(".");
          return { column, op, value: rest.join(".") };
        });
      const named = [
        ...(select ?? "").split(","),
        ...Object.keys(body && !Array.isArray(body) ? body : {}),
        ...filters.map((filter) => filter.column),
      ].map((column) => column.trim());
      const gone = named.find((column) => missing.includes(column));
      if (gone) return send(400, { code: "42703", message: `column ${table}.${gone} does not exist` });

      const wantsRows = Boolean(select) || (req.headers.prefer ?? "").includes("return=representation");
      const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
      const reply = (rows, status = 200) => {
        const out = rows.map((row) => shaped(row, select));
        const headers = { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` };
        if (!single) return send(status, out, headers);
        return out.length === 1 ? send(status, out[0], headers) : send(406, { code: "PGRST116", message: "not one row" });
      };

      if (req.method === "GET" || req.method === "HEAD") return reply(db[table].filter((row) => matches(row, filters)));
      if (req.method === "POST") {
        const rows = (Array.isArray(body) ? body : [body]).map((row) => ({ created_at: new Date().toISOString(), ...row }));
        const key = KEYS[table];
        if (key && rows.some((row) => db[table].some((kept) => key.every((k) => kept[k] === row[k])))) {
          return send(409, { code: "23505", message: "duplicate key value violates unique constraint" });
        }
        db[table].push(...rows);
        return wantsRows ? reply(rows, 201) : send(201);
      }
      if (req.method === "PATCH") {
        const hit = db[table].filter((row) => matches(row, filters));
        for (const row of hit) Object.assign(row, body);
        return wantsRows ? reply(hit) : send(204);
      }
      if (req.method === "DELETE") {
        const out = db[table].filter((row) => matches(row, filters));
        db[table] = db[table].filter((row) => !matches(row, filters));
        return wantsRows ? reply(out) : send(204);
      }
      return send(405, { message: "not in the stand-in" });
    });
  });

  await new Promise((resolve) => server.listen(0, "localhost", resolve));
  return {
    url: `http://localhost:${server.address().port}`,
    seed({ missing: columns = [], ...tables }) {
      missing = columns;
      db = structuredClone(tables);
    },
    tables: () => db,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
