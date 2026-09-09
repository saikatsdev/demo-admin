import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Barcode from "react-barcode";
import { getDatas } from "../../api/common/common";
import { useAppSettings } from "../../contexts/useAppSettings";
import useTitle from "../../hooks/useTitle";
import { Facebook, Mail, Globe, MapPin, Scissors } from "lucide-react";
import "./css/multi.css";

const isDataURL = (s) => /^data:/i.test(s || "");

function makeLocalProxyURL(absHref) {
    const u = new URL(absHref, window.location.href);
    return `/_img${u.pathname}${u.search}`;
}

function makeWeservURL(absHref) {
    const u = new URL(absHref, window.location.href);
    return `https://images.weserv.nl/?url=${u.host}${u.pathname}${u.search}`;
}

function probeImage(url, timeout = 6000) {
    return new Promise((resolve) => {
        const img = new Image();

        let done = false;

        const to = setTimeout(() => {
            if (!done) { done = true; resolve(false); }
        }, timeout);

        img.onload = () => { if (!done) { done = true; clearTimeout(to); resolve(true); } };

        img.onerror = () => { if (!done) { done = true; clearTimeout(to); resolve(false); } };

        img.crossOrigin = "anonymous";

        img.src = url;
    });
}

async function pickLoadableLogoSrc(raw) {
    if (!raw) return "";
    const abs = new URL(raw, window.location.href).href;
    if (abs.startsWith(window.location.origin) || isDataURL(abs)) return abs;

    const candidates = [makeLocalProxyURL(abs), makeWeservURL(abs)];
    for (const c of candidates) {
        if (await probeImage(c)) return c;
    }
    return "";
}

async function waitForImages(root) {
    const imgs = Array.from(root.querySelectorAll("img"));

    await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })));
}

const numberToWords = (num) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const thousands = ["", "Thousand", "Million", "Billion"];

    if (!Number.isFinite(num) || num <= 0) return "Zero";

    let word = "";

    const helper = (n, idx) => {
        if (n === 0) return "";
        let str = "";
        if (n < 10) str = ones[n];
        else if (n < 20) str = teens[n - 10];
        else if (n < 100) str = tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        else str = ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + helper(n % 100, idx) : "");
        return str + (n ? " " + thousands[idx] : "");
    };

    let idx = 0;

    while (num > 0) {
        if (num % 1000 !== 0) word = helper(num % 1000, idx) + " " + word;
        num = Math.floor(num / 1000);
        idx++;
    }

    return word.trim();
};

const getToday = () => new Date().toLocaleDateString("en-GB");
const BC = "#555555ff";

const InvoiceA4 = ({ order, settings }) => {
    const formattedDateString = useMemo(() => {
        return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }, []);

    const payablePrice    = Number(order?.payable_price || 0);
    const advancedPayment = Number(order?.advance_payment || 0);
    const finalPayable    = advancedPayment > 0 ? payablePrice - advancedPayment : payablePrice;
    const specialDiscount = Number(order?.special_discount || 0);

    const subTotal = order?.details?.reduce((sum, item) => {
        const price = Number(item?.sell_price || 0);
        const qty = Number(item?.quantity || 0);
        return sum + price * qty;
    }, 0);

    const deliveryFee = Number(order?.delivery_charge || 0);
    const grandTotal = subTotal - specialDiscount + deliveryFee;

    const details = order?.details || [];

    return (
        <div className="invoice-a4 invoice-section invoice-wrapper-to-capture" style={{ margin: 0, padding: 0, fontFamily: '"Lato", sans-serif', color: "#333", fontSize: "14px", backgroundColor: "#fff" }}>
            <div className="printable invoice-page-a4" style={{ padding: "40px 40px 10px 40px", border: "none", maxWidth: "800px", margin: "0 auto", background: "white", color: "#222" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <div style={{ width: "120px" }}>
                        {settings?.header_logo ? (
                            <img src={settings.header_logo} alt="Logo" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover" }} data-invoice-logo="1" />
                        ) : (
                            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "#ccc" }}></div>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#111" }}>{settings?.title || "Shutki Dotcom"}</h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#333" }}>An online shop of various dried fishes of fresh water and sea.</p>
                    </div>
                    
                    <div style={{ width: "120px" }}></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "14px", lineHeight: "1.5" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: "600", color: "#111" }}>Bill To:</p>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#111", textTransform: 'capitalize' }}>{order?.customer_name}</p>
                        <p style={{ margin: 0 }}>{order?.phone_number}</p>
                        <p style={{ margin: 0, maxWidth: "300px" }}>{order?.address_details}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#111" }}>Invoice No: <span style={{ fontWeight: "700" }}>{order?.invoice_number}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Delivery Partner: <span style={{ fontWeight: "600" }}>{order?.delivery_partner || "Pathao"}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Date: <span style={{ fontWeight: "600" }}>{formattedDateString}</span></p>
                    </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0px", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                            <th style={{ padding: "8px 4px", width: "5%", fontWeight: "600", color: "#111" }}>SL</th>
                            <th style={{ padding: "8px 4px", width: "40%", fontWeight: "600", color: "#111" }}>Item Name</th>
                            <th style={{ padding: "8px 4px", width: "15%", textAlign: "center", fontWeight: "600", color: "#111" }}>Weight</th>
                            <th style={{ padding: "8px 4px", width: "15%", textAlign: "center", fontWeight: "600", color: "#111" }}>Unit Price (BDT)</th>
                            <th style={{ padding: "8px 4px", width: "10%", textAlign: "center", fontWeight: "600", color: "#111" }}>Qty</th>
                            <th style={{ padding: "8px 4px", width: "15%", textAlign: "right", fontWeight: "600", color: "#111" }}>Amount (BDT)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 8 }).map((_, i) => {
                            const item = details[i];
                            const isLast = i === 7;
                            return (
                                <tr key={i} style={{ borderBottom: isLast ? "1px solid #ddd" : "none", height: "32px" }}>
                                    <td style={{ padding: "4px" }}>{i + 1}</td>
                                    <td style={{ padding: "4px" }}>{item ? item.product?.name : ""}</td>
                                    <td style={{ padding: "4px", textAlign: "center" }}>{item ? item.attribute_value_1?.value || "" : ""}</td>
                                    <td style={{ padding: "4px", textAlign: "center" }}>{item ? Number(item.sell_price).toFixed(2) : ""}</td>
                                    <td style={{ padding: "4px", textAlign: "center" }}>{item ? item.quantity : ""}</td>
                                    <td style={{ padding: "4px", textAlign: "right" }}>{item ? (Number(item.sell_price) * Number(item.quantity)).toFixed(2) : ""}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                    <div style={{ width: "45%", fontSize: "12px", color: "#444", marginTop: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
                            <Facebook size={14} style={{ marginRight: "10px", flexShrink: 0 }} />
                            <span>{"https://www.facebook.com/shutkidotcom"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
                            <Mail size={14} style={{ marginRight: "10px", flexShrink: 0 }} />
                            <span>{settings?.footer_email || "shutki.info@gmail.com"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
                            <Globe size={14} style={{ marginRight: "10px", flexShrink: 0 }} />
                            <span>{"https://shutki.com.bd/"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "6px" }}>
                            <MapPin size={14} style={{ marginRight: "10px", marginTop: "2px", flexShrink: 0 }} />
                            <span>{settings?.address || "44/4, Mugda Bishoroad, Atish Diponkor Road (3rd floor), Dhaka - 1214"}</span>
                        </div>
                    </div>

                    <div style={{ width: "45%", fontSize: "13px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#555" }}>Sub Total</td>
                                    <td style={{ padding: "5px 10px", textAlign: "right", width: "100px", color: "#111" }}>{subTotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#555" }}>Discount</td>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#111" }}>- {specialDiscount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#555" }}>Delivery Fee</td>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#111" }}>{deliveryFee.toFixed(2)}</td>
                                </tr>
                                <tr style={{ backgroundColor: "#e8e8e8" }}>
                                    <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: "600", color: "#111" }}>Grand Total</td>
                                    <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: "600", color: "#111" }}>{grandTotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#555" }}>Payment</td>
                                    <td style={{ padding: "5px 10px", textAlign: "right", color: "#111" }}>{advancedPayment.toFixed(2)}</td>
                                </tr>
                                <tr style={{ backgroundColor: "#222", color: "#fff" }}>
                                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "600" }}>Due Amount</td>
                                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "600" }}>{finalPayable.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", fontSize: "13px" }}>
                    <div style={{ color: "#111" }}>Hotline <span style={{ fontWeight: "600" }}>{settings?.phone_number || "+8801886046042"}</span></div>
                    <div style={{ color: "#111" }}>Bkash/Nagad <span style={{ fontWeight: "600" }}>{"01851557805"}</span></div>
                    <div style={{ fontWeight: "600", color: "#111" }}>শুঁটকি ডিপ ফ্রিজে সংরক্ষণ করতে হবে।</div>
                </div>

                <div style={{ backgroundColor: "#eaeaea", textAlign: "center", padding: "12px", marginTop: "20px", fontWeight: "600", fontSize: "14px", color: "#111" }}>
                    দেশজুড়ে ক্যাশ অন হোম ডেলিভারি: রকমারি চাপা, নোনা ইলিশ, বালাচাও, সিদল, দেশি ও সামুদ্রিক শুঁটকি
                </div>

                <div style={{ marginTop: "50px", marginBottom: "50px", borderBottom: "1px dashed #777", position: "relative" }}>
                    <Scissors size={20} style={{ position: "absolute", right: "-5px", top: "-10px", background: "white", padding: "0 2px", color: "#555" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                    <div style={{ width: "90px" }}>
                        {settings?.header_logo ? (
                            <img src={settings.header_logo} alt="Logo" style={{ width: "65px", height: "65px", borderRadius: "50%", objectFit: "cover" }} data-invoice-logo="1" />
                        ) : (
                            <div style={{ width: "65px", height: "65px", borderRadius: "50%", background: "#ccc" }}></div>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#111" }}>{settings?.title || "Shutki Dotcom"}</h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#333" }}>An online shop of various dried fishes of fresh water and sea.</p>
                    </div>
                    
                    <div style={{ width: "90px" }}></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "14px", lineHeight: "1.5" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: "600", color: "#111" }}>Bill To:</p>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#111", textTransform: 'capitalize' }}>{order?.customer_name}</p>
                        <p style={{ margin: 0 }}>{order?.phone_number}</p>
                        <p style={{ margin: 0, maxWidth: "300px" }}>{order?.address_details}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#111" }}>Invoice No: <span style={{ fontWeight: "700" }}>{order?.invoice_number}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Delivery Partner: <span style={{ fontWeight: "600" }}>{order?.delivery_partner || "Pathao"}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Date: <span style={{ fontWeight: "600" }}>{formattedDateString}</span></p>
                        <div style={{ backgroundColor: "#222", color: "#fff", padding: "8px 20px", fontWeight: "600", marginTop: "12px", display: "inline-block" }}>
                            Due Amount: BDT {finalPayable.toFixed(2)}
                        </div>
                        <p style={{ margin: "12px 0 0 0", fontWeight: "600", color: "#111" }}>Contact: {settings?.phone_number || "+8801886046042"}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

const InvoiceA5 = ({ order, settings }) => {
    const totalPriceInWords = `${numberToWords(Number(order?.payable_price) || 0)} Taka`;
    const formattedDate = getToday();

    const payablePrice    = Number(order?.payable_price || 0);
    const advancedPayment = Number(order?.advance_payment || 0);
    const finalPayable    = advancedPayment > 0 ? payablePrice - advancedPayment : payablePrice;
    const specialDiscount = Number(order?.special_discount || 0);

    const subTotal = order?.details?.reduce((sum, item) => {
        const price = Number(item?.sell_price || 0);
        const qty = Number(item?.quantity || 0);
        return sum + price * qty;
    }, 0);

    return (
        <div className="invoice-a5 invoice-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    {!!settings.logo && <img src={settings.logo} alt="Logo" style={{ width: 80 }} data-invoice-logo="1" />}
                    <div style={{ fontSize: 12, lineHeight: 1.35 }}>
                        <p style={{ marginBottom: 3 }}>{settings.address}</p>
                        <p style={{ marginBottom: 3 }}>Contact: {settings.phone_number}</p>
                        <p style={{ marginBottom: 0 }}>Email: {settings.footer_email}</p>
                    </div>
                </div>

                <div>
                <table style={{ borderCollapse: "collapse", width: "auto", minWidth: 200, fontWeight: 600, fontSize: 12 }}>
                    <tbody>
                        <tr>
                            <td style={{ border: `1px solid ${BC}`, padding: 4 }}>Invoice No:</td>
                            <td style={{ border: `1px solid ${BC}`, padding: 4 }}>{order?.invoice_number}</td>
                        </tr>
                        <tr>
                            <td style={{ border: `1px solid ${BC}`, padding: 4 }}>Date:</td>
                            <td style={{ border: `1px solid ${BC}`, padding: 4 }}>{formattedDate}</td>
                        </tr>
                        <tr>
                            <td style={{ border: `1px solid ${BC}`, padding: 4 }}>Order No:</td>
                            <td style={{ border: `1px solid ${BC}`, padding: 4 }}>{order?.id}</td>
                        </tr>
                    </tbody>
                </table>

                {order?.id ? (
                    <div style={{ textAlign: "center", marginTop: 6 }}>
                        <Barcode value={String(order.invoice_number)} format="CODE128" displayValue={false} height={35} width={2.5} margin={0} background="#fff" lineColor="#000" />
                        <small style={{ color: "#6c757d", fontSize: 10, display: "block" }}>{order?.invoice_number}</small>
                    </div>
                ) : null}
                </div>
            </div>

            <h5 style={{ textAlign: "center", fontWeight: "bold", margin: "0 0 12px" }}>INVOICE</h5>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, tableLayout: "fixed" }}>
                <colgroup>
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "74%" }} />
                </colgroup>
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 600, border: `1px solid ${BC}`, padding: 6, fontSize: 12 }}> Name:</td>
                        <td style={{ border: `1px solid ${BC}`, padding: 6, fontSize: 12 }}>{order?.customer_name}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 600, border: `1px solid ${BC}`, padding: 6, fontSize: 12 }}>Phone:</td>
                        <td style={{ border: `1px solid ${BC}`, padding: 6, fontSize: 12 }}>{order?.phone_number}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 600, border: `1px solid ${BC}`, padding: 6, fontSize: 12 }}>Address:</td>
                        <td style={{ border: `1px solid ${BC}`, padding: 6, fontSize: 12 }}>{order?.address_details}</td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "16%" }} />
                </colgroup>

                <thead>
                    <tr>
                        {["Sl#", "Image", "Description", "SKU", "Qty", "Unit Price", "Total"].map((h, i) => (
                            <th key={i} style={{ border: `1px solid ${BC}`, padding: "6px 6px", fontSize: 11, background: "#f5f5f5", textAlign: "center" }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {(order?.details || []).map((item, index) => (
                        <tr key={index}>
                            <td style={{ border: `1px solid ${BC}`, textAlign: "center", padding: 6, fontSize: 11 }}>{index + 1}</td>

                            <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"6px 10px" }}>
                                <img className="a5-invoice-image" src={item?.product?.img_path} alt={item?.product?.name || "Product Image"}                                     />
                            </td>

                            <td style={{ border: `1px solid ${BC}`, padding: 6, fontSize: 11, lineHeight: 1.35 }}>
                                {item?.product?.name}
                                {item?.attribute_value_1 && <small style={{ display: "block", color: "#6c757d", fontSize: 10 }}>[{item?.attribute_value_1?.attribute?.name}: {item?.attribute_value_1?.value}]</small>}
                                {item?.attribute_value_2 && <small style={{ display: "block", color: "#6c757d", fontSize: 10 }}>[{item?.attribute_value_2?.attribute?.name}: {item?.attribute_value_2?.value}]</small>}
                                {item?.attribute_value_3 && <small style={{ display: "block", color: "#6c757d", fontSize: 10 }}>[{item?.attribute_value_3?.attribute?.name}: {item?.attribute_value_3?.value}]</small>}
                            </td>

                            <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"4px 8px", fontSize:11 }}>{item?.product?.sku || "N/A"}</td>

                            <td style={{ border: `1px solid ${BC}`, textAlign: "center", fontSize: 11 }}>{item?.quantity}</td>

                            <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontSize: 11, paddingRight: 10 }}>{item?.sell_price} Tk</td>

                            <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontSize: 11, paddingRight: 10 }}>
                                {(Number(item?.sell_price) || 0) * (Number(item?.quantity) || 0)} Tk
                            </td>
                        </tr>
                    ))}

                    <tr>
                        <td colSpan="5" className="t-empty"></td>
                        <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontWeight: 600, fontSize: 11, paddingRight: 10 }}>Sub Total</td>
                        <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontSize: 11, paddingRight: 10 }}>{subTotal.toFixed(2)} Tk</td>
                    </tr>

                    {specialDiscount > 0 && (
                        <tr>
                            <td colSpan="5" className="t-empty"></td>
                            <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontWeight: 600, fontSize: 11, paddingRight: 10 }}>Special Discount</td>
                            <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontSize: 11, paddingRight: 10 }}>{specialDiscount.toFixed(2)} Tk</td>
                        </tr>
                    )}

                    <tr>
                        <td colSpan="5" className="t-empty"></td>
                        <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontWeight: 600, fontSize: 11, paddingRight: 10 }}>Delivery Charge</td>
                        <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontSize: 11, paddingRight: 10 }}>{order?.delivery_charge} Tk</td>
                    </tr>

                    <tr>
                        <td colSpan="5" className="t-empty"></td>
                        <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontWeight: 600, fontSize: 11, paddingRight: 10 }}>Payable</td>
                        <td style={{ border: `1px solid ${BC}`, textAlign: "right", fontSize: 11, paddingRight: 10 }}>{finalPayable.toFixed(2)} Tk</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ fontWeight: 600, fontSize: 11, marginTop: 8 }}>
                In Words: {totalPriceInWords}
            </div>

            <hr style={{ border: 0, borderTop: `1px solid ${BC}`, margin: "8px 0 0" }} />

            <div style={{ textAlign: "center", marginTop: 10 }}>

                <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}>
                    Customer Note: {order?.note }
                </div>

                <div style={{ fontWeight:600, fontSize:11, textAlign:"start" }}>
                    Company Note: {settings?.invoice_text || "প্রোডাক্ট হাতে পেয়ে কুরিয়ার ম্যানের সামনে চেক করে নিন। কোনো সমস্যা থাকলে সাথে সাথে আমাদের কল সেন্টারে জানান।"}
                </div>

                <h6 style={{ fontWeight: "bold", margin: "0 0 2px" }}>Thank you for choosing us</h6>
                <p style={{ fontSize: 11, margin: 0 }}>{settings.title}</p>
            </div>
        </div>
    );
};

const InvoicePos = ({ order, settings }) => {
    const formattedDate = getToday();

    const payablePrice    = Number(order?.payable_price || 0);
    const advancedPayment = Number(order?.advance_payment || 0);
    const finalPayable    = advancedPayment > 0 ? payablePrice - advancedPayment : payablePrice;
    const specialDiscount = Number(order?.special_discount || 0);

    const subTotal = order?.details?.reduce((sum, item) => {
        const price = Number(item?.sell_price || 0);
        const qty = Number(item?.quantity || 0);
        return sum + price * qty;
    }, 0);

    return (
        <div className="invoice-pos invoice-section">
            <div className="pos-hasher" style={{ textAlign: "center",}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>{!!settings.logo && <img src={settings.logo} alt="Logo" style={{ width: 50, marginBottom: 4 }} data-invoice-logo="1" />}</div>
                    <div style={{ textAlign: "center" }}>
                        {order?.id ? (
                            <Barcode value={String(order.invoice_number)} format="CODE128" displayValue={false} height={30} width={1.8} margin={0} background="#fff" lineColor="#000" />
                        ) : null}
                        <small style={{ color: "#6c757d" }}>{order.invoice_number}</small>
                    </div>
                </div>

                <div style={{ fontSize: 12, lineHeight: "1.3em" }}>
                    <strong>{settings.title}</strong>
                    <br />
                    {settings.address}
                    <br />
                    Phone: {settings.phone_number}
                    <br />
                    {settings.footer_email}
                </div>
            </div>

            <div style={{ borderBottom: "1px dashed #000", marginTop:10}}></div>

            <table style={{ width: "100%", fontSize: 12,  marginBottom: 5, }}>
                <tbody>
                    <tr>
                        <td>Invoice:</td>
                        <td style={{ textAlign: "right" }}>{order?.invoice_number}</td>
                    </tr>

                    <tr>
                        <td>Date:</td>
                        <td style={{ textAlign: "right" }}>{formattedDate}</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", margin: "5px 0", padding: "3px 0", fontSize: 12 }}>
                <div>Customer: {order?.customer_name}</div>
                <div>Phone: {order?.phone_number}</div>
                {order?.address_details ? <div style={{ marginTop: 2 }}>Addr: {order?.address_details}</div> : null}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 5, tableLayout: "fixed" }}>
                <colgroup>
                    <col style={{ width: "60%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "30%" }} />
                </colgroup>

                <thead>
                    <tr>
                        <th style={{ textAlign: "left" }}>Item</th>
                        <th style={{ textAlign: "right" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                </thead>

                <tbody>
                    {(order?.details || []).map((item, i) => (
                        <tr key={i}>
                            <td>
                                {item?.product?.name}
                                {item?.attribute_value_1 && <div style={{ fontSize: 10 }}>[{item?.attribute_value_1?.attribute?.name}: {item?.attribute_value_1?.value}]</div>}
                                {item?.attribute_value_2 && <div style={{ fontSize: 10 }}>[{item?.attribute_value_2?.attribute?.name}: {item?.attribute_value_2?.value}]</div>}
                                {item?.attribute_value_3 && <div style={{ fontSize: 10 }}>[{item?.attribute_value_3?.attribute?.name}: {item?.attribute_value_3?.value}]</div>}
                            </td>
                            <td style={{ textAlign: "right" }}>{item?.quantity}</td>
                            <td style={{ textAlign: "right" }}>{(Number(item?.sell_price) || 0) * (Number(item?.quantity) || 0)} Tk</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table style={{ width: "100%", fontSize: 12, marginTop: 5 }}>
                <tbody>
                    <tr>
                        <td>Subtotal:</td>
                        <td style={{ textAlign: "right" }}>{subTotal.toFixed(2)} Tk</td>
                    </tr>

                    {specialDiscount > 0 && (
                        <tr>
                            <td>Special Discount:</td>
                            <td style={{ textAlign: "right" }}>{specialDiscount.toFixed(2)} Tk</td>
                        </tr>
                    )}

                    <tr>
                        <td>Delivery Charge:</td>
                        <td style={{ textAlign: "right" }}>{order?.delivery_charge} Tk</td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Total:</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                            <strong>{finalPayable.toFixed(2)} Tk</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ textAlign: "center", borderTop: "1px dashed #000", marginTop: 8, paddingTop: 5, fontSize: 11 }}>
                <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}>
                    Customer Note: {order?.note }
                </div>

                <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}> 
                    Company Note: <span style={{fontSize:10}}>{settings?.invoice_text || "প্রোডাক্ট হাতে পেয়ে কুরিয়ার ম্যানের সামনে চেক করে নিন। কোনো সমস্যা থাকলে সাথে সাথে আমাদের কল সেন্টারে জানান।"}</span>
                </div>

                Thank you for your purchase!
                <br />
                <strong>{settings.title}</strong>
            </div>
        </div>
    );
};

export default function MultipleInvoices() {
    // Hook
    useTitle("Multi Invoice")

    const location                          = useLocation();
    const [activeLayout, setActiveLayout]   = useState("A4");
    const [orders, setOrders]               = useState([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [loading, setLoading]             = useState(true);
    const {settings}                        = useAppSettings();

    const selectedIds = useMemo(() => {
        const q = new URLSearchParams(location.search).get("orders") || "";
        return q.split(",").map((v) => Number(v.trim())).filter(Boolean);
    }, [location.search]);

    const fetchOrders = async () => {
        if (!selectedIds.length) {
            setOrders([]);
            return;
        }

        try {
            const res = await getDatas("/admin/orders/multi-invoice", { orders: selectedIds.join(",") });
            let rows = (res?.success && Array.isArray(res?.result?.data)) ? res.result.data : (Array.isArray(res?.data) ? res.data : []);

            if (rows.length) {
                setOrders(rows.map((o) => ({ ...o, details: o?.details || { data: [] } })));
                return;
            }
        } catch (err) {
            console.warn("multi-invoice failed, fallback to per-id", err);
        }

        try {
            const results = await Promise.all(selectedIds.map(async (id) => {
                try {
                    const r = await getDatas(`/admin/orders/${id}`);
                    const obj = (r?.success && r?.result) ? r.result : (r?.data && !Array.isArray(r.data) ? r.data : r) || null;
                    if (!obj) return null;
                    return { ...obj, details: obj?.details || { data: [] } };
                } catch { 
                    return null; 
                }
            }));
            setOrders(results.filter(Boolean));
        } catch (e) {
            console.error("per-id fetch failed", e);
            setOrders([]);
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try { 
                await fetchOrders(); 
            } 
            finally { 
                setLoading(false); 
            }
        })();
    }, [location.search]);

    const printSectionRef = useRef(null);

    const handleDownload = async () => {
        if (!printSectionRef.current) return;

        const mmToPx = (mm) => Math.round(mm * (96 / 25.4));
        const EXPORT_W = { A4: mmToPx(200), A5: mmToPx(138), POS: mmToPx(80) };

        const makePdf = () => {
            if (activeLayout === "A4") return new jsPDF("p", "mm", "a4");
            if (activeLayout === "A5") return new jsPDF("p", "mm", "a5");
            return new jsPDF("p", "mm", "a4");
        };

        try {
            setIsDownloading(true);

            const exportRoot = document.createElement("div");

            exportRoot.id = "export-root";

            Object.assign(exportRoot.style, {
                position: "fixed",
                left: "-10000px",
                top: "0",
                width: `${EXPORT_W[activeLayout]}px`,
                padding: "0",
                background: "#fff",
                zIndex: "-1",
            });

            const container = document.createElement("div");
            container.className = `printable multi-print layout-${activeLayout.toLowerCase()}`;
            exportRoot.appendChild(container);

            const style = document.createElement("style");

            style.textContent = `
                *{box-sizing:border-box}
                .invoice-pos{width:${EXPORT_W.POS}px!important}
                .invoice-a4{width:${EXPORT_W.A4}px!important;margin:0 auto!important}
                .invoice-a5{width:${EXPORT_W.A5}px!important;margin:0 auto!important}
                table{border-collapse:collapse;border-spacing:5}
                th,td{ line-height:1.35; vertical-align:top; padding-bottom:10px !important; margin-bottom:10px !important;}
                hr{border:0;border-top:1px solid ${BC}}
                /* print spacings */
                .invoice-wrapper-to-capture{break-inside:avoid;page-break-inside:avoid;-webkit-column-break-inside:avoid;margin:0 auto}
                .layout-a5 .invoice-a5{margin:5mm auto!important;padding:5mm!important}
                .layout-a5 .invoice-wrapper-to-capture::before{content:"";display:block;height:6mm}
                .layout-pos .invoice-pos{margin:2mm auto!important}
                .layout-pos .invoice-wrapper-to-capture::before{content:"";display:block;height:2mm}
            `;

            exportRoot.appendChild(style);

            const nodes = Array.from(printSectionRef.current.querySelectorAll(".invoice-wrapper-to-capture"));
            const clones = nodes.map((n) => {
                const c = n.cloneNode(true);
                container.appendChild(c);
                return c;
            });

            document.body.appendChild(exportRoot);

            const logoSrcForCanvas = await pickLoadableLogoSrc(settings.logo);

            for (const c of clones) {
                const logos = Array.from(c.querySelectorAll('img[data-invoice-logo="1"], img[alt="Logo"]'));
                logos.forEach((img) => {
                    if (logoSrcForCanvas) {
                        img.removeAttribute("srcset");
                        img.loading = "eager";
                        img.decoding = "sync";
                        img.src = logoSrcForCanvas;
                    }
                });
                await waitForImages(c);
            }

            const pdf = makePdf();
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();

            const marginMm = activeLayout === "A4" ? 5 : activeLayout === "A5" ? 6 : 15;
            const targetWmm = activeLayout === "POS" ? 80 : pageW - marginMm * 2;

            let cursorY = marginMm;
            let first = true;

            for (let i = 0; i < clones.length; i++) {
                const node = clones[i];
                node.style.width = `${EXPORT_W[activeLayout]}px`;

                const scale = Math.max(2, window.devicePixelRatio || 1);
                const canvas = await html2canvas(node, {
                    scale,
                    backgroundColor: "#ffffff",
                    useCORS: true,
                    imageTimeout: 10000,
                    removeContainer: true,
                });

                const img = canvas.toDataURL("image/jpeg", 0.95);
                const imgHmm = (targetWmm * canvas.height) / canvas.width;

                if (activeLayout === "A4") {
                    if (!first) pdf.addPage();
                    first = false;
                    const x = (pageW - targetWmm) / 2;
                    const y = marginMm;
                    pdf.addImage(img, "JPEG", x, y, targetWmm, imgHmm, undefined, "FAST");
                } else if (activeLayout === "A5") {
                    if (cursorY + imgHmm > pageH - marginMm) {
                        pdf.addPage();
                        cursorY = marginMm;
                    }
                    const x = (pageW - targetWmm) / 2;
                    pdf.addImage(img, "JPEG", x, cursorY, targetWmm, imgHmm, undefined, "FAST");
                    cursorY += imgHmm + marginMm;
                } else {
                    if (cursorY + imgHmm > pageH - marginMm) {
                        pdf.addPage();
                        cursorY = marginMm;
                    }
                    const x = (pageW - targetWmm) / 2;
                    pdf.addImage(img, "JPEG", x, cursorY, targetWmm, imgHmm, undefined, "FAST");
                    cursorY += imgHmm + 6;
                }
            }

            document.body.removeChild(exportRoot);

            const d = new Date();
            const fileName = `Invoices_${activeLayout}_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}.pdf`;
            pdf.save(fileName);
        } catch (e) {
            console.error("PDF generation error:", e);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => setTimeout(() => window.print(), 200);

    if (loading)
    return (
        <div className="multi-invoice-loader">
            <span style={{ marginRight: 8 }}>⏳</span>
            Loading invoices…
        </div>
    );

    if (!orders?.length) return <div style={{ padding: 16, color: "black"}}>No orders to show.</div>;

    return (
        <div style={{ background: "#fff", color: "black", padding: 10 }}>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, alignItems: "center" }}>
                <div>
                    <label style={{ marginRight: 12 }}>
                        <input type="radio" name="layout" value="A4" checked={activeLayout === "A4"} onChange={() => setActiveLayout("A4")} style={{ marginRight: 4 }} />
                        A4 Invoice
                    </label>

                    <label style={{ marginRight: 12 }}>
                        <input type="radio" name="layout" value="A5" checked={activeLayout === "A5"} onChange={() => setActiveLayout("A5")} style={{ marginRight: 4 }} />
                        A5 Invoice
                    </label>

                    <label>
                        <input type="radio" name="layout" value="POS" checked={activeLayout === "POS"} onChange={() => setActiveLayout("POS")} style={{ marginRight: 4 }} />
                        POS Invoice
                    </label>
                </div>

                <div>
                    <button onClick={handleDownload} disabled={isDownloading} className="multi-invoice-btn">
                        {isDownloading ? "Generating..." : "Download PDF"}
                    </button>

                    <button onClick={handlePrint} className="multi-invoice-print-btn">
                        Print
                    </button>
                </div>
            </div>

            <div id="print-section" className={`printable multi-print layout-${activeLayout.toLowerCase()}`} ref={printSectionRef} style={{ padding: activeLayout === "POS" ? "10px 50px 0 40px" : "0 40px" }}>
                {orders.map((order) => (
                    <div key={order.id} className="invoice-wrapper-to-capture">
                        {activeLayout === "A4" && <InvoiceA4 order={order} settings={settings} />}
                        {activeLayout === "A5" && <InvoiceA5 order={order} settings={settings} />}
                        {activeLayout === "POS" && <InvoicePos order={order} settings={settings} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
