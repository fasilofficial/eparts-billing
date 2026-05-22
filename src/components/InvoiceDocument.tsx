import logoUrl from "/logo.png";
import { fmtDate, fmtMoney, type Bill, type Branch } from "@/lib/store";

const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || "E REPAIR INNOVATIVE";
const COMPANY_ADDRESS = (import.meta.env.VITE_COMPANY_ADDRESS || "ERepair Innovative|Shalom Building LIC Junction,|Pattom, Thiruvananthapuram,|Kerala. Pin 695004").split("|");
const PAYMENT_METHODS = import.meta.env.VITE_PAYMENT_METHODS || "Cash / Card";

export function InvoiceDocument({ bill, branch }: { bill: Bill; branch?: Branch }) {
  const taxPercent = bill.subtotal > 0 ? Math.round((bill.tax / bill.subtotal) * 100) : 0;
  return (
    <div className="mx-auto w-full max-w-2xl bg-white text-black border border-border print-area">
      <div className="p-5 sm:p-10">
        {/* Header: Logo + company info left, invoice meta right */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="E Repair Innovative Logo"
              className="h-14 w-auto object-contain"
              style={{ maxWidth: 80 }}
            />
            <div>
              <div className="font-bold text-sm leading-tight tracking-wide uppercase">
                {COMPANY_NAME}
              </div>
              <div className="mt-0.5 text-[10px] text-neutral-500 leading-snug">
                {COMPANY_ADDRESS.map((line: string, i: number) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs uppercase tracking-widest text-neutral-500">Invoice</div>
            <div className="font-semibold text-sm mt-0.5">{bill.number}</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{fmtDate(bill.createdAt)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-neutral-200" />

        {/* From / Billed to */}
        <div className="grid gap-6 text-xs sm:grid-cols-2">
          <div>
            <div className="uppercase tracking-widest text-neutral-500">From</div>
            <div className="mt-1.5 font-medium">{branch?.name ?? COMPANY_NAME}</div>
            <div className="text-neutral-600 whitespace-pre-line">
              {branch?.address ?? COMPANY_ADDRESS.join("\n")}
            </div>
            {branch?.email && (
              <div className="text-neutral-600">{branch.email}</div>
            )}
          </div>
          <div>
            <div className="uppercase tracking-widest text-neutral-500">Billed to</div>
            <div className="mt-1.5 font-medium">{bill.customer || "Walk-in customer"}</div>
            <div className="text-neutral-600">{bill.paymentMethod}</div>
          </div>
        </div>

        {/* Items table */}
        <div className="responsive-table mt-8">
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

        {/* Totals */}
        <div className="mt-6 ml-auto w-full max-w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span className="num">{fmtMoney(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Tax ({taxPercent}%)</span>
            <span className="num">{fmtMoney(bill.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-display text-xl">
            <span>Total</span>
            <span className="num">{fmtMoney(bill.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-neutral-200 pt-4 text-[10px] text-neutral-500">
          <div className="uppercase tracking-widest">
            Thank you for your business · {bill.number}
          </div>
          <div className="mt-1">
            {COMPANY_NAME} &nbsp;|&nbsp; {COMPANY_ADDRESS.slice(1).join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}
