import { FileTextOutlined, PrinterOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useAppSettings } from "../../../../contexts/useAppSettings";

const { Text } = Typography;

const money = (value) => `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

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

export default function PurchaseInvoice({ purchase, onClose }) {
    const { settings } = useAppSettings();

    if (!purchase) return null;

    const companyName = settings?.title || "Company";
    const companyLogo = settings?.header_logo || settings?.logo || settings?.favicon_icon || "";
    const address     = settings?.address || "";
    const email       = settings?.footer_email || settings?.email || "";
    const phone       = settings?.footer_phone || settings?.phone || "";
    const items       = purchase.items || [];

    const printInvoice = () => {
        const rows = items.map((item, index) => `
            <tr>
                <td class="center">${index + 1}</td>
                <td>
                    <div class="item-name">${escapeHtml(item.product_name || "")}</div>
                    ${item.variation_name ? `<div class="muted">${escapeHtml(item.variation_name)}</div>` : ""}
                    ${item.sku ? `<div class="sku">${escapeHtml(item.sku)}</div>` : ""}
                </td>
                <td class="center">${escapeHtml(item.quantity)}</td>
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
<title>Purchase Invoice - ${escapeHtml(purchase.purchase_no)}</title>
<style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; background: #eef2f7; }
.sheet { max-width: 794px; margin: 24px auto; background: #fff; padding: 34px; box-shadow: 0 14px 45px rgba(15,23,42,.12); }
.top { display:flex; justify-content:space-between; gap:30px; padding-bottom:22px; border-bottom:2px solid #172033; }
.brand { display:flex; gap:14px; align-items:center; min-width:0; }
.logo { width:62px; height:62px; border-radius:14px; object-fit:contain; border:1px solid #e5eaf1; padding:5px; }
.logo-fallback { width:62px; height:62px; border-radius:14px; display:grid; place-items:center; background:#eef4ff; color:#2563eb; font-size:24px; font-weight:800; }
.company h1 { margin:0 0 5px; font-size:22px; }
.company p { margin:2px 0; color:#667085; font-size:12px; line-height:1.45; }
.invoice-title { text-align:right; }
.invoice-title .label { color:#2563eb; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; }
.invoice-title h2 { margin:4px 0 4px; font-size:26px; }
.invoice-title p { margin:2px 0; color:#667085; font-size:12px; }
.info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin:24px 0; }
.info-box { border:1px solid #e5eaf1; border-radius:10px; padding:13px 14px; }
.info-box .k { color:#7b8799; font-size:10px; text-transform:uppercase; letter-spacing:.08em; font-weight:700; margin-bottom:5px; }
.info-box .v { font-size:13px; font-weight:700; line-height:1.45; }
.info-box .sub { color:#667085; font-size:11px; margin-top:3px; }
table { width:100%; border-collapse:collapse; font-size:11.5px; }
thead th { background:#172033; color:#fff; padding:10px 8px; font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
tbody td { padding:10px 8px; border-bottom:1px solid #edf0f4; vertical-align:top; }
tbody tr:nth-child(even) { background:#fafbfc; }
.center { text-align:center; } .right { text-align:right; } .strong { font-weight:800; }
.item-name { font-weight:700; } .muted { color:#7b8799; font-size:10px; margin-top:2px; } .sku { display:inline-block; color:#2563eb; background:#edf4ff; padding:2px 5px; border-radius:4px; margin-top:4px; font-size:9px; font-weight:700; }
.bottom { display:grid; grid-template-columns:1fr 300px; gap:28px; margin-top:22px; }
.note { color:#667085; font-size:11px; line-height:1.6; }
.note strong { color:#172033; display:block; margin-bottom:5px; }
.totals { border:1px solid #e5eaf1; border-radius:10px; overflow:hidden; }
.total-row { display:flex; justify-content:space-between; gap:15px; padding:8px 12px; font-size:11px; border-bottom:1px solid #edf0f4; }
.total-row:last-child { border-bottom:0; }
.total-row.grand { background:#eef4ff; color:#134f9c; font-size:14px; font-weight:800; padding:12px; }
.total-row.due { color:#c62828; font-weight:700; }
.footer { display:flex; justify-content:space-between; gap:20px; margin-top:36px; padding-top:14px; border-top:1px solid #e5eaf1; color:#7b8799; font-size:10px; }
.status { display:inline-block; padding:4px 8px; border-radius:999px; background:#eef4ff; color:#2563eb; font-size:10px; font-weight:700; text-transform:capitalize; }
@media print {
  body { background:#fff; }
  .sheet { margin:0; max-width:none; padding:0; box-shadow:none; }
}
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
            <div class="label">Purchase Invoice</div>
            <h2>${escapeHtml(purchase.purchase_no)}</h2>
            <p>${purchase.purchase_date ? dayjs(purchase.purchase_date).format("DD MMM YYYY") : "—"}</p>
            <span class="status">${escapeHtml(purchase.status)}</span>
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
            <div class="k">Payment</div>
            <div class="v" style="text-transform:capitalize">${escapeHtml(purchase.payment_status || "—")}</div>
            <div class="sub">Paid: ${money(purchase.paid_amount)} · Due: ${money(purchase.due_amount)}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:42px">SL</th>
                <th>Product</th>
                <th style="width:55px">Qty</th>
                <th style="width:100px;text-align:right">Buy Price</th>
                <th style="width:90px;text-align:right">Discount</th>
                <th style="width:80px;text-align:right">Tax</th>
                <th style="width:105px;text-align:right">Total</th>
            </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="7" class="center">No items found</td></tr>`}</tbody>
    </table>

    <div class="bottom">
        <div class="note">
            <strong>Note</strong>
            ${escapeHtml(purchase.note || "No note was added for this purchase.")}
            ${purchase.transaction_reference ? `<br/><br/><strong>Transaction reference</strong>${escapeHtml(purchase.transaction_reference)}` : ""}
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
        <span>Generated from ${escapeHtml(companyName)} Inventory & Stock</span>
        <span>Printed ${dayjs().format("DD MMM YYYY, hh:mm A")}</span>
    </div>
</div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`);
        popup.document.close();
    };

    return (
        <Modal
            open
            onCancel={onClose}
            width={980}
            title={null}
            className="purchase-invoice-modal"
            footer={[
                <Button key="close" onClick={onClose}>Close</Button>,
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={printInvoice}>Print Invoice</Button>,
            ]}
        >
            <div className="purchase-invoice-sheet">
                <div className="purchase-invoice-top">
                    <div className="purchase-invoice-brand">
                        {companyLogo ? (
                            <img src={companyLogo} alt="Company logo" className="purchase-invoice-logo" />
                        ) : (
                            <div className="purchase-invoice-logo-fallback"><ShopOutlined /></div>
                        )}
                        <div>
                            <h2>{companyName}</h2>
                            {address && <p>{address}</p>}
                            <div className="purchase-invoice-contact">
                                {phone && <span>{phone}</span>}
                                {email && <span>{email}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="purchase-invoice-heading">
                        <div className="purchase-invoice-label"><FileTextOutlined /> Purchase Invoice</div>
                        <h1>{purchase.purchase_no}</h1>
                        <p>{purchase.purchase_date ? dayjs(purchase.purchase_date).format("DD MMM YYYY") : "—"}</p>
                        <div>
                            <Tag color={tagColor(purchase.status)}>{purchase.status}</Tag>
                            <Tag color={tagColor(purchase.payment_status)}>{purchase.payment_status}</Tag>
                        </div>
                    </div>
                </div>

                <div className="purchase-invoice-info-grid">
                    <div className="purchase-invoice-info-card">
                        <span>Supplier</span>
                        <strong>{purchase.supplier?.name || "—"}</strong>
                        <Text type="secondary">{purchase.supplier?.code || ""}{purchase.supplier?.phone_number ? ` · ${purchase.supplier.phone_number}` : ""}</Text>
                    </div>
                    <div className="purchase-invoice-info-card">
                        <span>Warehouse</span>
                        <strong>{purchase.warehouse?.name || "—"}</strong>
                        <Text type="secondary">{purchase.warehouse?.code || ""}</Text>
                    </div>
                    <div className="purchase-invoice-info-card">
                        <span>Payment Summary</span>
                        <strong>{money(purchase.paid_amount)} paid</strong>
                        <Text type="secondary">Due {money(purchase.due_amount)}</Text>
                    </div>
                </div>

                <div className="purchase-invoice-table-wrap">
                    <table className="purchase-invoice-table">
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Product</th>
                                <th className="center">Qty</th>
                                <th className="right">Buy Price</th>
                                <th className="right">Discount</th>
                                <th className="right">Tax</th>
                                <th className="right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length ? items.map((item, index) => (
                                <tr key={item.id || `${item.product_id}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <strong>{item.product_name}</strong>
                                        {item.variation_name && <small>{item.variation_name}</small>}
                                        {item.sku && <em>{item.sku}</em>}
                                    </td>
                                    <td className="center">{item.quantity}</td>
                                    <td className="right">{money(item.unit_cost)}</td>
                                    <td className="right">{money(item.discount_amount)}</td>
                                    <td className="right">{money(item.tax_amount)}</td>
                                    <td className="right"><strong>{money(item.line_total)}</strong></td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="center">No purchase items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="purchase-invoice-bottom">
                    <div className="purchase-invoice-note">
                        <span>Internal Note</span>
                        <p>{purchase.note || "No note was added for this purchase."}</p>
                        {purchase.transaction_reference && (
                            <div><strong>Transaction Ref:</strong> {purchase.transaction_reference}</div>
                        )}
                    </div>

                    <div className="purchase-invoice-totals">
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
