import { prisma } from "@/lib/db";
import { fmtMoney, fmtDate } from "@/lib/constants";
import { setInvoiceStatus } from "@/app/actions/invoices";
import StatusSelect from "@/components/status-select";
import { requireNavAccess } from "@/lib/dal";
import RecordTrustTransactionForm from "./record-trust-transaction-form";

const INVOICE_STATUS_LABELS = { OUTSTANDING: "Outstanding", PAID: "Paid", OVERDUE: "Overdue" } as const;
const VAT_RATE = 0.15;

export default async function FinancialsPage() {
  await requireNavAccess("financials");

  const [invoices, trust, matters, balancesByMatter] = await Promise.all([
    prisma.invoice.findMany({ include: { matter: true }, orderBy: { date: "desc" } }),
    prisma.trustTransaction.findMany({ include: { matter: true }, orderBy: { date: "desc" } }),
    prisma.matter.findMany({ select: { id: true, reference: true }, orderBy: { reference: "asc" } }),
    prisma.trustTransaction.groupBy({ by: ["matterId"], _sum: { amountCents: true } }),
  ]);

  const totalOf = (i: (typeof invoices)[number]) => i.feesCents + i.disbursementsCents + Math.round(i.feesCents * VAT_RATE);
  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + totalOf(i), 0);
  const outstanding = invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + totalOf(i), 0);
  const trustBalance = balancesByMatter.reduce((s, b) => s + (b._sum.amountCents ?? 0), 0);

  const balanceByMatterId = new Map(balancesByMatter.map((b) => [b.matterId, b._sum.amountCents ?? 0]));
  const matterReferenceById = new Map(matters.map((m) => [m.id, m.reference]));

  return (
    <>
      <div className="grid grid-4 mb16">
        <div className="card stat-card">
          <div className="label">Revenue Collected</div>
          <div className="value">{fmtMoney(paid)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Outstanding</div>
          <div className="value">{fmtMoney(outstanding)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Trust Account Balance</div>
          <div className="value">{fmtMoney(trustBalance)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Invoices this period</div>
          <div className="value">{invoices.length}</div>
        </div>
      </div>

      <div className="card mb16">
        <h3>Invoices</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Matter</th>
                <th>Description</th>
                <th>Fees</th>
                <th>Disb.</th>
                <th>VAT (15%)</th>
                <th>Total</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => {
                const vat = Math.round(i.feesCents * VAT_RATE);
                const total = i.feesCents + i.disbursementsCents + vat;
                return (
                  <tr key={i.id}>
                    <td className="small">{i.matter.reference}</td>
                    <td className="small">{i.description}</td>
                    <td className="small">{fmtMoney(i.feesCents)}</td>
                    <td className="small">{fmtMoney(i.disbursementsCents)}</td>
                    <td className="small">{fmtMoney(vat)}</td>
                    <td className="small">
                      <b>{fmtMoney(total)}</b>
                    </td>
                    <td className="small">{fmtDate(i.dueDate)}</td>
                    <td>
                      <StatusSelect
                        id={i.id}
                        value={i.status}
                        options={["OUTSTANDING", "PAID", "OVERDUE"]}
                        labels={INVOICE_STATUS_LABELS}
                        onChange={setInvoiceStatus}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2 mb16">
        <div className="card">
          <h3>Trust Balances by Matter</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Matter</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {[...balanceByMatterId.entries()].map(([matterId, balance]) => (
                  <tr key={matterId}>
                    <td className="small">{matterReferenceById.get(matterId) ?? "—"}</td>
                    <td className="small" style={{ color: balance < 0 ? "var(--red)" : "var(--text)", fontWeight: 600 }}>
                      {fmtMoney(balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Record Trust Transaction</h3>
          <RecordTrustTransactionForm matters={matters} />
        </div>
      </div>

      <div className="card">
        <h3>Trust Account Ledger</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Matter</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {trust.map((t) => (
                <tr key={t.id}>
                  <td className="small">{fmtDate(t.date)}</td>
                  <td className="small">{t.matter.reference}</td>
                  <td>
                    <span className={`badge ${t.type === "DEPOSIT" ? "badge-green" : "badge-amber"}`}>
                      {t.type === "DEPOSIT" ? "Deposit" : "Payment Out"}
                    </span>
                  </td>
                  <td className="small">{t.description}</td>
                  <td className="small" style={{ color: t.amountCents < 0 ? "var(--red)" : "var(--green)", fontWeight: 600 }}>
                    {t.amountCents < 0 ? "-" : ""}
                    {fmtMoney(Math.abs(t.amountCents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
