-- ─────────────────────────────────────────────────────────────────────────────
-- Stock tracking: auto-decrement on order, restore on cancel
-- Run this once in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Decrement stock when an order_item is inserted
CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - NEW.quantity, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON order_items;
CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION decrement_product_stock();

-- 2. Restore stock when an order is cancelled
CREATE OR REPLACE FUNCTION restore_product_stock_on_cancel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE products p
    SET stock = stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_stock_on_cancel ON orders;
CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION restore_product_stock_on_cancel();
