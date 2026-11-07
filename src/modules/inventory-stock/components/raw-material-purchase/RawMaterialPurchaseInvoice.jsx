import { ExperimentOutlined, FileTextOutlined, PrinterOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useAppSettings } from "../../../../contexts/useAppSettings";
import "../../styles/raw-material-purchase-invoice.css";

const { Text } = Typography;

const money = (value) => `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const qty = (value) => Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
});

const tagColor = (status) => ({
    draft: "gold",
    completed: "green",
    paid: "green",
    partial: "blue",
    unpaid: "red",
    cancelled: "red",
}[status] || "default");

const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export default function RawMaterialPurchaseInvoice({ purchase, onClose }) {
    const { settings } = useAppSettings();

    if (!purchase) return null;

    const companyName = typeof settings?.title === "string" && settings.title.trim() ? settings.title : "Company";
    const companyLogo = [settings?.header_logo, settings?.logo, settings?.favicon_icon].find(v => typeof v === "string" && v.trim()) || "";
    const address     = typeof settings?.address === "string" ? settings.address : "";
    const email       = [settings?.footer_email, settings?.email].find(v => typeof v === "string" && v.trim()) || "";
    const phone       = [settings?.footer_phone, settings?.phone].find(v => typeof v === "string" && v.trim()) || "";
    const items       = Array.isArray(purchase?.items) ? purchase.items : [];

    const printInvoice = () => {
        const rows = items.map((item, index) => `
            <tr>
                <td class="center">${index + 1}</td>
                <td>
                    <div class="item-name">${escapeHtml(item.material_name || "")}</div>
                    ${item.material_code ? `<span class="material-code">${escapeHtml(item.material_code)}</span>` : ""}
                </td>
                <td class="center">${escapeHtml(item.unit || "—")}</td>
                <td class="right">${qty(item.quantity)}</td>
                <td class="right">${money(item.unit_cost)}</td>
                <td class="right">${money(item.discount_amount)}</td>
                <td class="right">${money(item.tax_amount)}</td>
                <td class="right strong">${money(item.line_total)}</td>
            </tr>
        `).join("");

        const popup = window.open("", "_blank", "width=1100,height=850");
        if (!popup) return;

        popup.document.write(`<!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>Raw Material Purchase Invoice - ${escapeHtml(purchase.purchase_no)}</title>
                <style>
                    @page { size: A4; margin: 11mm; }
                    * { box-sizing: border-box; }
                    body { margin:0; background:#eef5f3; color:#17312b; font-family:Arial,Helvetica,sans-serif; }
                    .sheet { max-width:794px; margin:24px auto; padding:34px; background:#fff; box-shadow:0 16px 50px rgba(15,58,49,.13); }
                    .top { display:flex; justify-content:space-between; gap:28px; padding-bottom:22px; border-bottom:2px solid #163c34; }
                    .brand { display:flex; align-items:center; gap:14px; min-width:0; }
                    .logo,.logo-fallback { width:62px; height:62px; border-radius:15px; }
                    .logo { object-fit:contain; padding:5px; border:1px solid #dfeae6; }
                    .logo-fallback { display:grid; place-items:center; background:#eaf6f2; color:#13705c; font-size:24px; font-weight:800; }
                    .company h1 { margin:0 0 5px; font-size:22px; }
                    .company p { margin:2px 0; color:#6b7f78; font-size:11px; line-height:1.45; }
                    .invoice-title { text-align:right; }
                    .invoice-title .label { color:#13866d; font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
                    .invoice-title h2 { margin:5px 0; font-size:25px; }
                    .invoice-title p { margin:2px 0 7px; color:#6b7f78; font-size:11px; }
                    .status { display:inline-block; padding:4px 9px; border-radius:999px; background:#e9f6f2; color:#13705c; font-size:10px; font-weight:700; text-transform:capitalize; }
                    .info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:13px; margin:22px 0; }
                    .info-box { min-height:78px; padding:13px 14px; border:1px solid #dfeae6; border-radius:11px; background:#fbfdfc; }
                    .info-box .k { margin-bottom:5px; color:#7c8e88; font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
                    .info-box .v { font-size:13px; font-weight:800; line-height:1.45; }
                    .info-box .sub { margin-top:3px; color:#71837d; font-size:10px; line-height:1.5; }
                    table { width:100%; border-collapse:collapse; font-size:10.5px; }
                    thead th { padding:10px 7px; background:#173f36; color:#fff; font-size:9px; letter-spacing:.035em; text-transform:uppercase; }
                    tbody td { padding:10px 7px; border-bottom:1px solid #edf3f1; vertical-align:top; }
                    tbody tr:nth-child(even) { background:#fafcfb; }
                    .center { text-align:center; } .right { text-align:right; } .strong { font-weight:800; }
                    .item-name { font-weight:800; }
                    .material-code { display:inline-block; margin-top:4px; padding:2px 6px; border-radius:4px; background:#eaf6f2; color:#13705c; font-size:8px; font-weight:800; }
                    .bottom { display:grid; grid-template-columns:1fr 292px; gap:28px; margin-top:22px; }
                    .note { padding:14px; border:1px dashed #cdded8; border-radius:10px; color:#6b7f78; font-size:10.5px; line-height:1.6; }
                    .note strong { display:block; margin-bottom:5px; color:#17312b; }
                    .totals { overflow:hidden; border:1px solid #dfeae6; border-radius:11px; }
                    .total-row { display:flex; justify-content:space-between; gap:15px; padding:8px 12px; border-bottom:1px solid #edf3f1; font-size:10.5px; }
                    .total-row:last-child { border-bottom:0; }
                    .total-row.grand { padding:12px; background:#eaf6f2; color:#11604f; font-size:14px; font-weight:800; }
                    .total-row.due { color:#c0392b; font-weight:800; }
                    .footer { display:flex; justify-content:space-between; gap:18px; margin-top:34px; padding-top:13px; border-top:1px solid #dfeae6; color:#7b8c86; font-size:9.5px; }
                    @media print { body { background:#fff; } .sheet { max-width:none; margin:0; padding:0; box-shadow:none; } }
                </style>
            </head>
            <body>
                <div class="sheet">
                <div class="top">
                    <div class="brand">
                    ${companyLogo ? `<img class="logo" src="${escapeHtml(companyLogo)}" alt="Logo" />` : `<div class="logo-fallback">${escapeHtml(companyName.slice(0,1).toUpperCase())}</div>`}
                    <div class="company">
                        <h1>${escapeHtml(companyName)}</h1>
                        ${address ? `<p>${escapeHtml(address)}</p>` : ""}
                        ${phone ? `<p>${escapeHtml(phone)}</p>` : ""}
                        ${email ? `<p>${escapeHtml(email)}</p>` : ""}
                    </div>
                    </div>
                    <div class="invoice-title">
                    <div class="label">Raw Material Purchase Invoice</div>
                    <h2>${escapeHtml(purchase.purchase_no)}</h2>
                    <p>${purchase.purchase_date ? dayjs(purchase.purchase_date).format("DD MMM YYYY") : "—"}</p>
                    <span class="status">${escapeHtml(purchase.status || "")}</span>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-box">
                    <div class="k">Supplier</div>
                    <div class="v">${escapeHtml(purchase.supplier?.name || "—")}</div>
                    <div class="sub">${escapeHtml(purchase.supplier?.code || "")}${purchase.supplier?.phone_number ? ` · ${escapeHtml(purchase.supplier.phone_number)}` : ""}</div>
                    </div>
                    <div class="info-box">
                    <div class="k">Warehouse</div>
                    <div class="v">${escapeHtml(purchase.warehouse?.name || "—")}</div>
                    <div class="sub">${escapeHtml(purchase.warehouse?.code || "")}</div>
                    </div>
                    <div class="info-box">
                    <div class="k">Payment Summary</div>
                    <div class="v" style="text-transform:capitalize">${escapeHtml(purchase.payment_status || "—")}</div>
                    <div class="sub">Paid ${money(purchase.paid_amount)} · Due ${money(purchase.due_amount)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                    <tr>
                        <th style="width:38px">SL</th>
                        <th>Raw Material</th>
                        <th style="width:60px">Unit</th>
                        <th style="width:70px;text-align:right">Qty</th>
                        <th style="width:88px;text-align:right">Rate</th>
                        <th style="width:78px;text-align:right">Discount</th>
                        <th style="width:70px;text-align:right">Tax</th>
                        <th style="width:96px;text-align:right">Total</th>
                    </tr>
                    </thead>
                    <tbody>${rows || `<tr><td colspan="8" class="center">No raw material items found</td></tr>`}</tbody>
                </table>

                <div class="bottom">
                    <div class="note">
                    <strong>Purchase Note</strong>
                    ${escapeHtml(purchase.note || "No note was added for this purchase.")}
                    ${purchase.transaction_reference ? `<br/><br/><strong>Transaction Reference</strong>${escapeHtml(purchase.transaction_reference)}` : ""}
                    ${purchase.payment_note ? `<br/><br/><strong>Payment Note</strong>${escapeHtml(purchase.payment_note)}` : ""}
                    </div>
                    <div class="totals">
                    <div class="total-row"><span>Subtotal</span><strong>${money(purchase.subtotal)}</strong></div>
                    <div class="total-row"><span>Discount</span><strong>- ${money(purchase.discount_amount)}</strong></div>
                    <div class="total-row"><span>VAT</span><strong>${money(purchase.vat_amount)}</strong></div>
                    <div class="total-row"><span>Transport</span><strong>${money(purchase.transport_cost)}</strong></div>
                    <div class="total-row"><span>Other Cost</span><strong>${money(purchase.other_cost)}</strong></div>
                    <div class="total-row grand"><span>Grand Total</span><strong>${money(purchase.grand_total)}</strong></div>
                    <div class="total-row"><span>Paid</span><strong>${money(purchase.paid_amount)}</strong></div>
                    <div class="total-row due"><span>Due</span><strong>${money(purchase.due_amount)}</strong></div>
                    </div>
                </div>

                <div class="footer">
                    <span>Generated from Inventory & Stock Management</span>
                    <span>${escapeHtml(purchase.purchase_no)}</span>
                </div>
                </div>
                <script>window.onload = () => { window.print(); };</script>
            </body>
        </html>`);
        popup.document.close();
    };

    return (
        <Modal
            open
            onCancel={onClose}
            width={1040}
            className="raw-purchase-invoice-modal"
            title={null}
            footer={[
                <Button key="close" onClick={onClose}>Close</Button>,
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={printInvoice}>
                    Print Invoice
                </Button>,
            ]}
        >
            <div className="raw-purchase-invoice-sheet">
                <div className="raw-purchase-invoice-top">
                    <div className="raw-purchase-invoice-brand">
                        {companyLogo ? (
                            <img className="raw-purchase-invoice-logo" src={companyLogo} alt={companyName} />
                        ) : (
                            <div className="raw-purchase-invoice-logo-fallback"><ShopOutlined /></div>
                        )}
                        <div>
                            <h2>{companyName}</h2>
                            {address && <p>{address}</p>}
                            <div className="raw-purchase-invoice-contact">
                                {phone && <span>{phone}</span>}
                                {email && <span>{email}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="raw-purchase-invoice-heading">
                        <div className="raw-purchase-invoice-label"><ExperimentOutlined /> Raw Material Purchase Invoice</div>
                        <h1>{purchase.purchase_no}</h1>
                        <p>{purchase.purchase_date ? dayjs(purchase.purchase_date).format("DD MMM YYYY") : "—"}</p>
                        <div>
                            <Tag color={tagColor(purchase.status)}>{String(purchase.status || "unknown")}</Tag>
                            <Tag color={tagColor(purchase.payment_status)}>{String(purchase.payment_status || "unknown")}</Tag>
                        </div>
                    </div>
                </div>

                <div className="raw-purchase-invoice-info-grid">
                    <div className="raw-purchase-invoice-info-card">
                        <span>Supplier</span>
                        <strong>{purchase.supplier?.name || "—"}</strong>
                        <Text type="secondary">{purchase.supplier?.code || ""}{purchase.supplier?.phone_number ? ` · ${purchase.supplier.phone_number}` : ""}</Text>
                    </div>
                    <div className="raw-purchase-invoice-info-card">
                        <span>Warehouse</span>
                        <strong>{purchase.warehouse?.name || "—"}</strong>
                        <Text type="secondary">{purchase.warehouse?.code || ""}</Text>
                    </div>
                    <div className="raw-purchase-invoice-info-card">
                        <span>Payment Summary</span>
                        <strong>{money(purchase.paid_amount)} paid</strong>
                        <Text type="secondary">Due {money(purchase.due_amount)}</Text>
                    </div>
                </div>

                <div className="raw-purchase-invoice-table-wrap">
                    <table className="raw-purchase-invoice-table">
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Raw Material</th>
                                <th className="center">Unit</th>
                                <th className="right">Quantity</th>
                                <th className="right">Rate</th>
                                <th className="right">Discount</th>
                                <th className="right">Tax</th>
                                <th className="right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length ? items.map((item, index) => (
                                <tr key={item.id || `${item.raw_material_id}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <strong>{item.material_name || "—"}</strong>
                                        {item.material_code && <em>{item.material_code}</em>}
                                    </td>
                                    <td className="center"><span className="raw-purchase-unit">{item.unit || "—"}</span></td>
                                    <td className="right">{qty(item.quantity)}</td>
                                    <td className="right">{money(item.unit_cost)}</td>
                                    <td className="right">{money(item.discount_amount)}</td>
                                    <td className="right">{money(item.tax_amount)}</td>
                                    <td className="right"><strong>{money(item.line_total)}</strong></td>
                                </tr>
                            )) : (
                                <tr><td colSpan={8} className="center">No raw material items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="raw-purchase-invoice-bottom">
                    <div className="raw-purchase-invoice-note">
                        <span>Purchase Note</span>
                        <p>{purchase.note || "No note was added for this purchase."}</p>
                        {purchase.transaction_reference && <div><strong>Transaction Ref:</strong> {purchase.transaction_reference}</div>}
                        {purchase.payment_note && <div><strong>Payment Note:</strong> {purchase.payment_note}</div>}
                    </div>

                    <div className="raw-purchase-invoice-totals">
                        <div><span>Subtotal</span><strong>{money(purchase.subtotal)}</strong></div>
                        <div><span>Discount</span><strong>- {money(purchase.discount_amount)}</strong></div>
                        <div><span>VAT</span><strong>{money(purchase.vat_amount)}</strong></div>
                        <div><span>Transport</span><strong>{money(purchase.transport_cost)}</strong></div>
                        <div><span>Other Cost</span><strong>{money(purchase.other_cost)}</strong></div>
                        <div className="grand"><span>Grand Total</span><strong>{money(purchase.grand_total)}</strong></div>
                        <div><span>Paid</span><strong>{money(purchase.paid_amount)}</strong></div>
                        <div className="due"><span>Due</span><strong>{money(purchase.due_amount)}</strong></div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
