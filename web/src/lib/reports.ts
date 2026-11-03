import { all, get, setting } from "./db";
import { debtSince } from "./debt";
import { monthRange } from "./format";

/** UC-18: lãi lỗ theo tháng. Giá vốn lấy theo lô (FIFO) lúc bán */
export function profitLoss(month: string) {
  const [from, to] = monthRange(month);
  const s = get<{ revenue: number; cost: number; n: number }>(
    "SELECT COALESCE(SUM(total), 0) AS revenue, COALESCE(SUM(cost_total), 0) AS cost, COUNT(*) AS n FROM sales WHERE created_at >= ? AND created_at < ?",
    from, to,
  )!;
  const r = get<{ total: number; cost: number }>(
    "SELECT COALESCE(SUM(total), 0) AS total, COALESCE(SUM(cost_total), 0) AS cost FROM returns WHERE created_at >= ? AND created_at < ?",
    from, to,
  )!;
  const net = s.revenue - r.total;
  const cogs = s.cost - r.cost;
  return { sales: s.n, revenue: s.revenue, returns: r.total, net, cogs, gross: net - cogs };
}

export function lastMonths(month: string, count: number) {
  const [y, m] = month.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

/** UC-17: công nợ khách hàng trong tháng */
export function debtReport(month: string) {
  const [from, to] = monthRange(month);
  return all<{ id: number; name: string; opening: number; increase: number; decrease: number; closing: number }>(
    `SELECT c.id, c.name,
       COALESCE(SUM(CASE WHEN d.created_at < ? THEN d.amount END), 0) AS opening,
       COALESCE(SUM(CASE WHEN d.created_at >= ? AND d.created_at < ? AND d.amount > 0 THEN d.amount END), 0) AS increase,
       COALESCE(SUM(CASE WHEN d.created_at >= ? AND d.created_at < ? AND d.amount < 0 THEN -d.amount END), 0) AS decrease,
       COALESCE(SUM(CASE WHEN d.created_at < ? THEN d.amount END), 0) AS closing
     FROM customers c JOIN debt_entries d ON d.customer_id = c.id
     GROUP BY c.id HAVING opening <> 0 OR increase <> 0 OR decrease <> 0 OR closing <> 0
     ORDER BY closing DESC`,
    from, from, to, from, to, to,
  ).map((r) => ({ ...r, since: r.closing > 0 ? debtSince(r.id) : null }));
}

/** UC-22: doanh số theo nhân viên, để tính thưởng */
export function salesByStaff(month: string) {
  const [from, to] = monthRange(month);
  return all<{ id: number; full_name: string; sales: number; revenue: number; returns: number; net: number }>(
    `SELECT u.id, u.full_name,
       (SELECT COUNT(*) FROM sales s WHERE s.user_id = u.id AND s.created_at >= ? AND s.created_at < ?) AS sales,
       (SELECT COALESCE(SUM(total), 0) FROM sales s WHERE s.user_id = u.id AND s.created_at >= ? AND s.created_at < ?) AS revenue,
       (SELECT COALESCE(SUM(r.total), 0) FROM returns r JOIN sales s ON s.id = r.sale_id
          WHERE s.user_id = u.id AND r.created_at >= ? AND r.created_at < ?) AS returns,
       0 AS net
     FROM users u WHERE u.role IN ('NV', 'CH')`,
    from, to, from, to, from, to,
  )
    .map((r) => ({ ...r, net: r.revenue - r.returns }))
    .filter((r) => r.sales > 0 || r.returns > 0)
    .sort((a, b) => b.net - a.net);
}

/** UC-20: hàng dưới mức tồn tối thiểu */
export function lowStock() {
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString();
  return all<{ id: number; code: string; name: string; base_unit: string; stock: number; min_stock: number; sold_28d: number; supplier: string | null }>(
    `SELECT p.id, p.code, p.name, p.base_unit, p.min_stock,
       COALESCE((SELECT SUM(qty_left) FROM batches b WHERE b.product_id = p.id), 0) AS stock,
       COALESCE((SELECT SUM(i.base_qty) FROM sale_items i JOIN sales s ON s.id = i.sale_id
                 WHERE i.product_id = p.id AND s.created_at >= ?), 0) AS sold_28d,
       (SELECT su.name FROM import_items ii JOIN imports im ON im.id = ii.import_id JOIN suppliers su ON su.id = im.supplier_id
          WHERE ii.product_id = p.id ORDER BY im.created_at DESC LIMIT 1) AS supplier
     FROM products p WHERE p.active = 1 AND stock < p.min_stock ORDER BY stock * 1.0 / p.min_stock`,
    since,
  );
}

/** UC-19: hàng tồn lâu không bán được (ngưỡng tháng lấy từ cấu hình) */
export function slowMoving() {
  const months = setting("slow_moving_months");
  const cutoff = new Date(Date.now() - months * 30 * 86_400_000).toISOString();
  const rows = all<{ id: number; code: string; name: string; base_unit: string; stock: number; value: number; last_sale: string | null; oldest: string }>(
    `SELECT p.id, p.code, p.name, p.base_unit,
       SUM(b.qty_left) AS stock, SUM(b.qty_left * b.unit_cost) AS value, MIN(b.created_at) AS oldest,
       (SELECT MAX(s.created_at) FROM sale_items i JOIN sales s ON s.id = i.sale_id WHERE i.product_id = p.id) AS last_sale
     FROM products p JOIN batches b ON b.product_id = p.id AND b.qty_left > 0
     WHERE p.active = 1 GROUP BY p.id`,
  );
  return {
    months,
    rows: rows.filter((r) => r.oldest < cutoff && (r.last_sale === null || r.last_sale < cutoff))
      .sort((a, b) => b.value - a.value),
  };
}

/** UC-21: chênh lệch kiểm kê chờ chủ duyệt và đã xử lý */
export function stockDiffs() {
  return all<{ id: number; code: string; finished_at: string; product: string; base_unit: string; book_qty: number; actual_qty: number; reason: string; status: string; user: string }>(
    `SELECT i.id, s.code, s.finished_at, p.name AS product, p.base_unit, i.book_qty, i.actual_qty, i.reason, i.status, u.full_name AS user
     FROM stocktake_items i JOIN stocktakes s ON s.id = i.stocktake_id JOIN products p ON p.id = i.product_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'DONE' AND i.actual_qty IS NOT NULL AND ABS(i.actual_qty - i.book_qty) > 1e-9
     ORDER BY i.status = 'PENDING' DESC, s.finished_at DESC`,
  );
}
