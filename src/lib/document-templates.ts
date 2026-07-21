export type PartyLike = { id: string; role: string };

// Resolves the seller and buyer strictly from role tags (BUYER/BOTH for buyer, SELLER/BOTH for
// seller), always excluding whichever party already filled the other slot. Unlike the previous
// version, this never falls back to clients[0] for a missing role — a matter with only one party,
// or no seller-role party, comes back with seller: undefined rather than silently reusing the
// buyer, which previously let Agreement of Sale documents name one person as both sides.
export function resolveSellerAndBuyer<T extends PartyLike>(clients: T[]): { seller: T | undefined; buyer: T | undefined } {
  const buyer = clients.find((c) => c.role === "BUYER") ?? clients.find((c) => c.role === "BOTH");
  const seller =
    clients.find((c) => c.role === "SELLER" && c.id !== buyer?.id) ??
    clients.find((c) => c.role === "BOTH" && c.id !== buyer?.id);
  return { seller, buyer };
}

export type DocMatterData = {
  reference: string;
  type: string;
  priceCents: number;
  openedDate: string;
  responsibleName: string;
  property: { standNo: string; suburb: string; city: string; titleDeedNo: string; surveyDiagram: string; size: string };
  seller: { name: string; idNumber: string; address: string };
  buyer: { name: string; idNumber: string; address: string };
  // False when the matter doesn't have two distinct resolvable parties (e.g. only one party
  // recorded, or no seller-role party) — every template here names both sides, so generation
  // must be blocked rather than rendering a placeholder or duplicate name into a legal document.
  partiesComplete: boolean;
};

export const DOC_TEMPLATES = [
  { id: "aos", name: "Agreement of Sale", icon: "📝" },
  { id: "poa", name: "Power of Attorney", icon: "✍️" },
  { id: "transfer", name: "Deed of Transfer (Draft)", icon: "🔑" },
  { id: "affidavit", name: "Affidavit", icon: "📋" },
  { id: "clearance", name: "Clearance Letter", icon: "✅" },
  { id: "engagement", name: "Client Engagement Letter", icon: "🤝" },
  { id: "receipt", name: "Trust Account Receipt", icon: "💳" },
  { id: "invoice", name: "Invoice", icon: "🧾" },
] as const;

function fmtMoney(cents: number) {
  return "US$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Thrown by generateDocument itself, independent of whatever the caller already checked — every
// template below names both a seller and a buyer, so this is a second, defense-in-depth guard
// against the matter-creation flow ever having let an incomplete matter through.
export class IncompletePartiesError extends Error {}

export function generateDocument(templateId: string, m: DocMatterData): { title: string; body: string } {
  if (!m.partiesComplete) {
    throw new IncompletePartiesError(
      "This matter doesn't have two distinct parties on record (a buyer and a seller). Add the missing party on the matter before generating this document.",
    );
  }
  const { property: prop, seller, buyer } = m;
  const today = fmtDate(new Date().toISOString());

  switch (templateId) {
    case "aos":
      return {
        title: "Agreement of Sale",
        body: `AGREEMENT OF SALE

Made and entered into at Harare on this ${today}

BETWEEN

${seller.name} (ID/Reg: ${seller.idNumber}) of ${seller.address} ("the Seller")

AND

${buyer.name} (ID/Reg: ${buyer.idNumber}) of ${buyer.address} ("the Purchaser")

WHEREAS the Seller is the registered owner of ${prop.standNo}, ${prop.suburb}, ${prop.city}, held under
Title Deed No. ${prop.titleDeedNo}, measuring ${prop.size} ("the Property");

AND WHEREAS the Seller has agreed to sell and the Purchaser has agreed to purchase the Property on the
terms set out below.

1. PURCHASE PRICE
   The purchase price is ${fmtMoney(m.priceCents)}, payable as follows: 10% deposit on signature, balance on
   registration of transfer.

2. PROPERTY
   ${prop.standNo}, held under Title Deed ${prop.titleDeedNo}, Survey Diagram ${prop.surveyDiagram}.

3. TRANSFER
   Transfer shall be effected by Deeds360 Legal Practitioners, Conveyancers, who shall attend to all
   requirements including tax clearance, rates clearance and transfer duty.

4. POSSESSION
   Possession shall pass to the Purchaser on registration of transfer, unless otherwise agreed in writing.

5. VOETSTOOTS
   The Property is sold voetstoots (as is), subject to all servitudes and conditions of title.

SIGNED at Harare on ${today}


_________________________              _________________________
SELLER: ${seller.name}                  PURCHASER: ${buyer.name}

This document was auto-populated by Deeds360 from matter ${m.reference}. It must be reviewed and approved
by a registered legal practitioner before signature.`,
      };
    case "poa":
      return {
        title: "Power of Attorney",
        body: `POWER OF ATTORNEY

I, the undersigned, ${seller.name}, ID/Reg No. ${seller.idNumber}, of ${seller.address}, do hereby
nominate, constitute and appoint the Conveyancer of Deeds360 Legal Practitioners, with power of
substitution, to be my lawful attorney and agent, to represent me and to act on my behalf for the purpose
of signing all documents and doing all things necessary to effect transfer of ${prop.standNo}
(Title Deed ${prop.titleDeedNo}) to ${buyer.name}, and generally to do and perform any act which I could
lawfully do if personally present, in connection with matter ${m.reference}.

SIGNED at Harare on ${today}


_________________________
${seller.name}

Auto-generated by Deeds360 — for practitioner review before execution.`,
      };
    case "transfer":
      return {
        title: "Deed of Transfer (Draft)",
        body: `DRAFT DEED OF TRANSFER

BE IT KNOWN that ${seller.name} ("the Transferor") does hereby, in terms of a Deed of Sale dated
${fmtDate(m.openedDate)}, cede and transfer to ${buyer.name} ("the Transferee"), Certain: ${prop.standNo},
Situate in the district of ${prop.city}, Measuring: ${prop.size}, Held under Title Deed No. ${prop.titleDeedNo}.

SUBJECT to the conditions referred to in the aforementioned title deed, and to any registered servitudes.

Purchase consideration: ${fmtMoney(m.priceCents)}.

Prepared for lodgement at the Deeds Office by Deeds360 Legal Practitioners, matter ${m.reference}.
This is a draft for practitioner review and is not a substitute for the final Deeds Office lodgement document.`,
      };
    case "affidavit":
      return {
        title: "Affidavit",
        body: `AFFIDAVIT

I, the undersigned, ${seller.name}, ID/Reg No. ${seller.idNumber}, do hereby make oath and state that:

1. I am the registered owner / duly authorised representative in respect of ${prop.standNo}, held under
   Title Deed No. ${prop.titleDeedNo}.
2. The information supplied by me in connection with matter ${m.reference} is true and correct to the best of
   my knowledge and belief.
3. I make this affidavit in support of the transfer of the above property to ${buyer.name}.

SIGNED AND SWORN TO at Harare on ${today}, the Deponent having acknowledged that he/she knows and
understands the contents of this affidavit.


_________________________               _________________________
DEPONENT                                 COMMISSIONER OF OATHS

Auto-generated by Deeds360 — for practitioner review before commissioning.`,
      };
    case "clearance":
      return {
        title: "Clearance Request Letter",
        body: `${today}

To: Zimbabwe Revenue Authority (ZIMRA) / ${prop.city} City Council

Re: Application for Clearance — ${prop.standNo}, Title Deed ${prop.titleDeedNo}

Dear Sir/Madam,

We act on behalf of ${seller.name} in connection with the sale of the above property to ${buyer.name}
(our matter reference ${m.reference}).

We kindly request that a clearance certificate be issued in respect of the above property to enable us to
proceed with transfer. Please find attached the relevant supporting documents.

We thank you for your assistance and look forward to your prompt response.

Yours faithfully,


_________________________
Deeds360 Legal Practitioners
On behalf of ${seller.name}`,
      };
    case "engagement":
      return {
        title: "Client Engagement Letter",
        body: `${today}

Dear ${seller.name} / ${buyer.name},

Re: Engagement Letter — Conveyancing of ${prop.standNo} (Matter ${m.reference})

We refer to your instructions to act on your behalf in respect of the ${m.type.toLowerCase()} of the
above property at a purchase price of ${fmtMoney(m.priceCents)}.

Our fees for this matter will be charged in accordance with our standard conveyancing fee scale, plus
applicable disbursements (Deeds Office fees, clearance fees, and other out-of-pocket expenses), plus VAT
at the applicable rate.

Kindly sign and return a copy of this letter to confirm your instructions.

Yours faithfully,


_________________________
${m.responsibleName}
Deeds360 Legal Practitioners`,
      };
    case "receipt":
      return {
        title: "Trust Account Receipt",
        body: `DEEDS360 LEGAL PRACTITIONERS — TRUST ACCOUNT RECEIPT

Date: ${today}
Matter: ${m.reference}
Received from: ${buyer.name}
Amount: ${fmtMoney(Math.round(m.priceCents * 0.1))}
Description: Deposit received in trust re purchase of ${prop.standNo}

We confirm receipt of the above amount which has been deposited into our Trust Account and will be held
in accordance with the Legal Practitioners Act and applicable trust accounting rules, pending transfer.


_________________________
Accounts Officer, Deeds360 Legal Practitioners`,
      };
    case "invoice": {
      const fees = Math.round(m.priceCents * 0.025);
      const vat = Math.round(fees * 0.15);
      return {
        title: "Invoice",
        body: `DEEDS360 LEGAL PRACTITIONERS
Tax Invoice

Date: ${today}
Invoice To: ${buyer.name}
Matter: ${m.reference} — ${prop.standNo}

Description                                            Amount
--------------------------------------------------------------
Conveyancing fees (${m.type})                          ${fmtMoney(fees)}
Disbursements (Deeds Office, clearances, search fees)  ${fmtMoney(35000)}
VAT (15%)                                              ${fmtMoney(vat)}
--------------------------------------------------------------
TOTAL DUE                                              ${fmtMoney(fees + 35000 + vat)}

Payment due within 14 days. Please make payment to our Trust Account and quote the matter reference.

Thank you for your instruction.`,
      };
    }
    default:
      return { title: "", body: "" };
  }
}
