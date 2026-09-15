import { drizzle } from "drizzle-orm/d1";
import { requireRuntimeDatabase } from "../app/server/runtime-bindings";
import * as schema from "./schema";

let schemaReady: Promise<void> | undefined;

async function columnsFor(database: D1Database, table: string) {
  const result = await database.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  return new Set((result.results ?? []).map((column) => column.name));
}

async function addMissingColumns(
  database: D1Database,
  table: string,
  additions: ReadonlyArray<readonly [string, string]>,
) {
  const existing = await columnsFor(database, table);
  const missing = additions
    .filter(([name]) => !existing.has(name))
    .map(([, statement]) => database.prepare(statement));
  if (missing.length) await database.batch(missing);
}

async function ensureSchema(database: D1Database) {
  schemaReady ??= (async () => {
    // Tables come first. Indexes are created only after older databases have
    // received any columns introduced by later versions of the app.
    await database.batch([
      database.prepare(`CREATE TABLE IF NOT EXISTS orders (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_number text NOT NULL,
        branch_id text NOT NULL,
        original_branch_id text DEFAULT '' NOT NULL,
        branch_name text NOT NULL,
        city text NOT NULL,
        customer_name text NOT NULL,
        phone text NOT NULL,
        address text NOT NULL,
        latitude real NOT NULL,
        longitude real NOT NULL,
        distance_km real NOT NULL,
        fulfilment text NOT NULL,
        subtotal integer NOT NULL,
        delivery_fee integer NOT NULL,
        total integer NOT NULL,
        payment_method text NOT NULL,
        payment_status text DEFAULT 'unpaid' NOT NULL,
        status text DEFAULT 'new' NOT NULL,
        notes text DEFAULT '' NOT NULL,
        source text DEFAULT 'online' NOT NULL,
        cashier_employee_id integer,
        cashier_name text DEFAULT '' NOT NULL,
        receipt_token_hash text DEFAULT '' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS order_items (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_id integer NOT NULL,
        item_id text NOT NULL,
        item_name text NOT NULL,
        variant_label text NOT NULL,
        choice text DEFAULT '' NOT NULL,
        unit_price integer NOT NULL,
        quantity integer NOT NULL,
        line_total integer NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE cascade
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS inventory (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        branch_id text NOT NULL,
        sku text NOT NULL,
        name text NOT NULL,
        category text NOT NULL,
        unit text NOT NULL,
        current_stock real DEFAULT 0 NOT NULL,
        reorder_level real DEFAULT 0 NOT NULL,
        unit_cost integer DEFAULT 0 NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS inventory_movements (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        inventory_id integer NOT NULL,
        branch_id text NOT NULL,
        item_name text NOT NULL,
        previous_stock real NOT NULL,
        new_stock real NOT NULL,
        reason text DEFAULT 'Manual count' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE cascade
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS branch_product_inventory (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        branch_id text NOT NULL,
        city_id text NOT NULL,
        product_id text NOT NULL,
        product_name text NOT NULL,
        available integer DEFAULT 1 NOT NULL,
        track_quantity integer DEFAULT 0 NOT NULL,
        current_stock real DEFAULT 0 NOT NULL,
        reorder_level real DEFAULT 3 NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS stock_requests (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_id integer NOT NULL,
        order_number text NOT NULL,
        source_branch_id text NOT NULL,
        target_branch_id text NOT NULL,
        candidate_rank integer DEFAULT 1 NOT NULL,
        requested_products_json text DEFAULT '[]' NOT NULL,
        missing_products_json text DEFAULT '[]' NOT NULL,
        status text DEFAULT 'pending' NOT NULL,
        response_note text DEFAULT '' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        resolved_at text DEFAULT '' NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE cascade
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS employees (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        employee_key text NOT NULL,
        branch_id text NOT NULL,
        name text NOT NULL,
        role text DEFAULT 'team' NOT NULL,
        active integer DEFAULT 1 NOT NULL,
        username text,
        password_salt text DEFAULT '' NOT NULL,
        password_hash text DEFAULT '' NOT NULL,
        setup_token_hash text DEFAULT '' NOT NULL,
        setup_expires_at text DEFAULT '' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS branch_profiles (
        branch_id text PRIMARY KEY NOT NULL,
        manager_employee_id integer,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (manager_employee_id) REFERENCES employees(id) ON DELETE set null
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS catalog_products (
        id text PRIMARY KEY NOT NULL,
        city_id text NOT NULL,
        category text NOT NULL,
        name text NOT NULL,
        note text DEFAULT '' NOT NULL,
        variants_json text NOT NULL,
        choices_json text DEFAULT '[]' NOT NULL,
        image_key text DEFAULT '' NOT NULL,
        image_url text DEFAULT '' NOT NULL,
        enabled integer DEFAULT 1 NOT NULL,
        sort_order integer DEFAULT 0 NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS site_assets (
        slot text PRIMARY KEY NOT NULL,
        label text NOT NULL,
        image_key text DEFAULT '' NOT NULL,
        fallback_url text DEFAULT '' NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS app_settings (
        key text PRIMARY KEY NOT NULL,
        value text DEFAULT '' NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS media_assets (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        label text NOT NULL,
        image_key text NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
    ]);

    await addMissingColumns(database, "orders", [
      ["original_branch_id", "ALTER TABLE orders ADD COLUMN original_branch_id text DEFAULT '' NOT NULL"],
      ["source", "ALTER TABLE orders ADD COLUMN source text DEFAULT 'online' NOT NULL"],
      ["cashier_employee_id", "ALTER TABLE orders ADD COLUMN cashier_employee_id integer"],
      ["cashier_name", "ALTER TABLE orders ADD COLUMN cashier_name text DEFAULT '' NOT NULL"],
      ["receipt_token_hash", "ALTER TABLE orders ADD COLUMN receipt_token_hash text DEFAULT '' NOT NULL"],
    ]);

    await addMissingColumns(database, "stock_requests", [
      ["missing_products_json", "ALTER TABLE stock_requests ADD COLUMN missing_products_json text DEFAULT '[]' NOT NULL"],
    ]);

    // Self-heal databases created by early staff-dashboard builds. This is the
    // common cause of cashier setup failing after a source-only upgrade.
    await addMissingColumns(database, "employees", [
      ["employee_key", "ALTER TABLE employees ADD COLUMN employee_key text DEFAULT '' NOT NULL"],
      ["branch_id", "ALTER TABLE employees ADD COLUMN branch_id text DEFAULT '' NOT NULL"],
      ["name", "ALTER TABLE employees ADD COLUMN name text DEFAULT 'Employee' NOT NULL"],
      ["role", "ALTER TABLE employees ADD COLUMN role text DEFAULT 'team' NOT NULL"],
      ["active", "ALTER TABLE employees ADD COLUMN active integer DEFAULT 1 NOT NULL"],
      ["username", "ALTER TABLE employees ADD COLUMN username text"],
      ["password_salt", "ALTER TABLE employees ADD COLUMN password_salt text DEFAULT '' NOT NULL"],
      ["password_hash", "ALTER TABLE employees ADD COLUMN password_hash text DEFAULT '' NOT NULL"],
      ["setup_token_hash", "ALTER TABLE employees ADD COLUMN setup_token_hash text DEFAULT '' NOT NULL"],
      ["setup_expires_at", "ALTER TABLE employees ADD COLUMN setup_expires_at text DEFAULT '' NOT NULL"],
      ["created_at", "ALTER TABLE employees ADD COLUMN created_at text DEFAULT '' NOT NULL"],
      ["updated_at", "ALTER TABLE employees ADD COLUMN updated_at text DEFAULT '' NOT NULL"],
    ]);

    await database.batch([
      database.prepare("UPDATE orders SET original_branch_id = branch_id WHERE original_branch_id = ''"),
      database.prepare("UPDATE employees SET employee_key = 'legacy-' || id WHERE employee_key = ''"),
      database.prepare("UPDATE employees SET created_at = CURRENT_TIMESTAMP WHERE created_at = ''"),
      database.prepare("UPDATE employees SET updated_at = CURRENT_TIMESTAMP WHERE updated_at = ''"),
      database.prepare("UPDATE employees SET username = NULL, password_salt = '', password_hash = '' WHERE username IS NOT NULL AND id NOT IN (SELECT MIN(id) FROM employees WHERE username IS NOT NULL GROUP BY username)"),
    ]);

    await database.batch([
      database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON orders (order_number)"),
      database.prepare("CREATE INDEX IF NOT EXISTS orders_branch_status_idx ON orders (branch_id, status)"),
      database.prepare("CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at)"),
      database.prepare("CREATE INDEX IF NOT EXISTS orders_cashier_created_idx ON orders (cashier_employee_id, created_at)"),
      database.prepare("CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id)"),
      database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS inventory_branch_sku_unique ON inventory (branch_id, sku)"),
      database.prepare("CREATE INDEX IF NOT EXISTS inventory_branch_idx ON inventory (branch_id)"),
      database.prepare("CREATE INDEX IF NOT EXISTS inventory_movements_branch_idx ON inventory_movements (branch_id, created_at)"),
      database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS branch_product_inventory_unique ON branch_product_inventory (branch_id, product_id)"),
      database.prepare("CREATE INDEX IF NOT EXISTS branch_product_inventory_branch_idx ON branch_product_inventory (branch_id, available)"),
      database.prepare("CREATE INDEX IF NOT EXISTS branch_product_inventory_product_idx ON branch_product_inventory (product_id, available)"),
      database.prepare("CREATE INDEX IF NOT EXISTS stock_requests_target_status_idx ON stock_requests (target_branch_id, status, created_at)"),
      database.prepare("CREATE INDEX IF NOT EXISTS stock_requests_order_idx ON stock_requests (order_id, created_at)"),
      database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS employees_employee_key_unique ON employees (employee_key)"),
      database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS employees_username_unique ON employees (username)"),
      database.prepare("CREATE INDEX IF NOT EXISTS employees_branch_idx ON employees (branch_id, active)"),
      database.prepare("CREATE INDEX IF NOT EXISTS catalog_products_city_category_idx ON catalog_products (city_id, category, sort_order)"),
    ]);
  })().catch((error) => {
    schemaReady = undefined;
    throw error;
  });

  await schemaReady;
}

export async function getDb() {
  const database = requireRuntimeDatabase();
  await ensureSchema(database);
  return drizzle(database, { schema });
}
