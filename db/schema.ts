import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull(),
  branchId: text("branch_id").notNull(),
  originalBranchId: text("original_branch_id").notNull().default(""),
  branchName: text("branch_name").notNull(),
  city: text("city").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  distanceKm: real("distance_km").notNull(),
  fulfilment: text("fulfilment").notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  status: text("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("online"),
  cashierEmployeeId: integer("cashier_employee_id"),
  cashierName: text("cashier_name").notNull().default(""),
  receiptTokenHash: text("receipt_token_hash").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("orders_order_number_unique").on(table.orderNumber),
  index("orders_branch_status_idx").on(table.branchId, table.status),
  index("orders_created_at_idx").on(table.createdAt),
  index("orders_cashier_created_idx").on(table.cashierEmployeeId, table.createdAt),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  itemName: text("item_name").notNull(),
  variantLabel: text("variant_label").notNull(),
  choice: text("choice").notNull().default(""),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: text("branch_id").notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  currentStock: real("current_stock").notNull().default(0),
  reorderLevel: real("reorder_level").notNull().default(0),
  unitCost: integer("unit_cost").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("inventory_branch_sku_unique").on(table.branchId, table.sku),
  index("inventory_branch_idx").on(table.branchId),
]);

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id, { onDelete: "cascade" }),
  branchId: text("branch_id").notNull(),
  itemName: text("item_name").notNull(),
  previousStock: real("previous_stock").notNull(),
  newStock: real("new_stock").notNull(),
  reason: text("reason").notNull().default("Manual count"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("inventory_movements_branch_idx").on(table.branchId, table.createdAt),
]);

export const branchProductInventory = sqliteTable("branch_product_inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: text("branch_id").notNull(),
  cityId: text("city_id").notNull(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  trackQuantity: integer("track_quantity", { mode: "boolean" }).notNull().default(false),
  currentStock: real("current_stock").notNull().default(0),
  reorderLevel: real("reorder_level").notNull().default(3),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("branch_product_inventory_unique").on(table.branchId, table.productId),
  index("branch_product_inventory_branch_idx").on(table.branchId, table.available),
  index("branch_product_inventory_product_idx").on(table.productId, table.available),
]);

export const stockRequests = sqliteTable("stock_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  orderNumber: text("order_number").notNull(),
  sourceBranchId: text("source_branch_id").notNull(),
  targetBranchId: text("target_branch_id").notNull(),
  candidateRank: integer("candidate_rank").notNull().default(1),
  requestedProductsJson: text("requested_products_json").notNull().default("[]"),
  missingProductsJson: text("missing_products_json").notNull().default("[]"),
  status: text("status").notNull().default("pending"),
  responseNote: text("response_note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at").notNull().default(""),
}, (table) => [
  index("stock_requests_target_status_idx").on(table.targetBranchId, table.status, table.createdAt),
  index("stock_requests_order_idx").on(table.orderId, table.createdAt),
]);

export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeKey: text("employee_key").notNull(),
  branchId: text("branch_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("team"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  username: text("username"),
  passwordSalt: text("password_salt").notNull().default(""),
  passwordHash: text("password_hash").notNull().default(""),
  setupTokenHash: text("setup_token_hash").notNull().default(""),
  setupExpiresAt: text("setup_expires_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("employees_employee_key_unique").on(table.employeeKey),
  uniqueIndex("employees_username_unique").on(table.username),
  index("employees_branch_idx").on(table.branchId, table.active),
]);

export const branchProfiles = sqliteTable("branch_profiles", {
  branchId: text("branch_id").primaryKey(),
  managerEmployeeId: integer("manager_employee_id").references(() => employees.id, { onDelete: "set null" }),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogProducts = sqliteTable("catalog_products", {
  id: text("id").primaryKey(),
  cityId: text("city_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  note: text("note").notNull().default(""),
  variantsJson: text("variants_json").notNull(),
  choicesJson: text("choices_json").notNull().default("[]"),
  imageKey: text("image_key").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("catalog_products_city_category_idx").on(table.cityId, table.category, table.sortOrder),
]);

export const siteAssets = sqliteTable("site_assets", {
  slot: text("slot").primaryKey(),
  label: text("label").notNull(),
  imageKey: text("image_key").notNull().default(""),
  fallbackUrl: text("fallback_url").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const mediaAssets = sqliteTable("media_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  imageKey: text("image_key").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
