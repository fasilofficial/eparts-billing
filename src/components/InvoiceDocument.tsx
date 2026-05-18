import { fmtDate, fmtMoney, type Bill, type Branch } from "@/lib/store";

export function InvoiceDocument({ bill, branch }: { bill: Bill; branch?: Branch }) {
  return (
    <div className="mx-auto w-full max-w-2xl bg-white text-black border border-border print-area">
      <div className="p-5 sm:p-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500">Ledger</div>
            <div className="font-display text-3xl mt-1">Invoice</div>
          </div>
          <div className="text-right text-xs">
            <div className="font-medium">{bill.number}</div>
            <div className="text-neutral-500">{fmtDate(bill.createdAt)}</div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 text-xs sm:grid-cols-2">
          <div>
            <div className="uppercase tracking-widest text-neutral-500">From</div>
            <div className="mt-1.5 font-medium">{branch?.name ?? "Branch"}</div>
            <div className="text-neutral-600">{branch?.address ?? "—"}</div>
            <div className="text-neutral-600">{branch?.email}</div>
          </div>
          <div>
            <div className="uppercase tracking-widest text-neutral-500">Billed to</div>
            <div className="mt-1.5 font-medium">{bill.customer || "Walk-in customer"}</div>
            <div className="text-neutral-600">Cash / Card</div>
          </div>
        </div>

        <div className="responsive-table mt-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium text-right">Qty</th>
                <th className="py-2 font-medium text-right">Price</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((it, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-3">{it.name}</td>
                  <td className="py-3 text-right num">{it.qty}</td>
                  <td className="py-3 text-right num">{fmtMoney(it.price)}</td>
                  <td className="py-3 text-right num">{fmtMoney(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto w-full max-w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span className="num">{fmtMoney(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Tax (5%)</span>
            <span className="num">{fmtMoney(bill.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-display text-xl">
            <span>Total</span>
            <span className="num">{fmtMoney(bill.total)}</span>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-4 text-[10px] uppercase tracking-widest text-neutral-500">
          Thank you for your business · {bill.number}
        </div>
      </div>
    </div>
  );
}
