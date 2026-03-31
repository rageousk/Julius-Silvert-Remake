import { CartTable } from "@/components/CartTable";

export default function CartPage() {
  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>
      <h2 className="section-title">Your Cart</h2>
      <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
        Quantity caps at 200 per SKU. Manual typing and +/− steppers are supported.
      </p>
      <CartTable />
    </div>
  );
}
