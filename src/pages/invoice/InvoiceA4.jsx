import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getDatas, putData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import { useAppSettings } from "../../contexts/useAppSettings";
import { Facebook, Mail, Globe, MapPin, Scissors } from "lucide-react";
import "./css/a4.css";

export default function InvoiceA4() {
    // Hook
    useTitle("A4 Invoice");

    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState(null);
    const {settings} = useAppSettings();

    const loadOrder = async (orderId) => {
        try {
            setLoading(true);
            const res = await getDatas(`/admin/orders/${orderId}`);
            if (res?.success) setOrderDetails(res?.result);
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder(id);
    }, [id]);

    const formattedDateString = useMemo(() => {
        return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }, []);

    const handlePrint = async () => {
        try {
            const res = await putData(`/admin/orders/invoice/update/${id}`);
            if (res?.success) {
                setTimeout(() => window.print(), 200);
            } else {
                alert("API failed: " + (res?.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Print API error:", error);
            alert("Failed to send invoice to server.");
        }
    };

    if (loading)
        return (
        <div className="a4-invoice-loader">
            <span style={{ marginRight: 8 }}>⏳</span>
            Loading invoices…
        </div>
    );

    if (!orderDetails) return <div style={{ padding: 24 }}>No data found.</div>;

    const payablePrice    = Number(orderDetails?.payable_price || 0);
    const advancedPayment = Number(orderDetails?.advance_payment || 0);
    const finalPayable    = advancedPayment > 0 ? payablePrice - advancedPayment : payablePrice;
    const specialDiscount = Number(orderDetails?.special_discount || 0);

    const subTotal = orderDetails?.details?.reduce((sum, item) => {
        const price = Number(item?.sell_price || 0);
        const qty = Number(item?.quantity || 0);
        return sum + price * qty;
    }, 0);

    const deliveryFee = Number(orderDetails?.delivery_charge || 0);
    const grandTotal = subTotal - specialDiscount + deliveryFee;

    const details = orderDetails?.details || [];

    return (
        <div style={{ margin: 0, padding: 0, fontFamily: '"Lato", sans-serif', color: "#333", fontSize: "14px", backgroundColor: "#f9f9f9" }}>
            <div className="no-print" style={{ margin: "0 0 24px", padding: "20px 20px 0 20px" }}>
                <h4>A4 Invoice</h4><hr />
            </div>
    
            <div className="printable invoice-page-a4" style={{ padding: "40px 40px 10px 40px", border: "none", maxWidth: "800px", margin: "0 auto", background: "white", color: "#222" }}>
                
                {/* TOP HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <div style={{ width: "120px" }}>
                        {settings?.header_logo ? (
                            <img src={settings.header_logo} alt="Logo" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover" }} />
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

                {/* BILLING INFO */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "14px", lineHeight: "1.5" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: "600", color: "#111" }}>Bill To:</p>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#111", textTransform:"capitalize" }}>{orderDetails.customer_name}</p>
                        <p style={{ margin: 0 }}>{orderDetails.phone_number}</p>
                        <p style={{ margin: 0, maxWidth: "300px" }}>{orderDetails.address_details}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#111" }}>Invoice No: <span style={{ fontWeight: "700" }}>{orderDetails.invoice_number}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Delivery Partner: <span style={{ fontWeight: "600" }}>{orderDetails?.delivery_partner || "Pathao"}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Date: <span style={{ fontWeight: "600" }}>{formattedDateString}</span></p>
                    </div>
                </div>

                {/* TABLE */}
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

                {/* TOTALS AND FOOTER INFO */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                    {/* Contact Info (Left) */}
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
                            <span>{settings?.address || "44/4, Mugda Bishoroad, Atish Diponkor\nRoad (3rd floor), Dhaka - 1214"}</span>
                        </div>
                    </div>

                    {/* Totals (Right) */}
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

                {/* Support & Notice */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", fontSize: "13px" }}>
                    <div style={{ color: "#111" }}>Hotline <span style={{ fontWeight: "600" }}>{settings?.phone_number || "+8801886046042"}</span></div>
                    <div style={{ color: "#111" }}>Bkash/Nagad <span style={{ fontWeight: "600" }}>{"01851557805"}</span></div>
                    <div style={{ fontWeight: "600", color: "#111" }}>শুঁটকি ডিপ ফ্রিজে সংরক্ষণ করতে হবে।</div>
                </div>

                {/* Banner */}
                <div style={{ backgroundColor: "#eaeaea", textAlign: "center", padding: "12px", marginTop: "20px", fontWeight: "600", fontSize: "14px", color: "#111" }}>
                    দেশজুড়ে ক্যাশ অন হোম ডেলিভারি: রকমারি চাপা, নোনা ইলিশ, বালাচাও, সিদল, দেশি ও সামুদ্রিক শুঁটকি
                </div>

                {/* Scissors line */}
                <div style={{ marginTop: "50px", marginBottom: "50px", borderBottom: "1px dashed #777", position: "relative" }}>
                    <Scissors size={20} style={{ position: "absolute", right: "-5px", top: "-10px", background: "white", padding: "0 2px", color: "#555" }} />
                </div>

                {/* BOTTOM SLIP */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                    <div style={{ width: "90px" }}>
                        {settings?.header_logo ? (
                            <img src={settings.header_logo} alt="Logo" style={{ width: "65px", height: "65px", borderRadius: "50%", objectFit: "cover" }} />
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
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#111", textTransform: 'capitalize' }}>{orderDetails.customer_name}</p>
                        <p style={{ margin: 0 }}>{orderDetails.phone_number}</p>
                        <p style={{ margin: 0, maxWidth: "300px" }}>{orderDetails.address_details}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#111" }}>Invoice No: <span style={{ fontWeight: "700" }}>{orderDetails.invoice_number}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Delivery Partner: <span style={{ fontWeight: "600" }}>{orderDetails?.delivery_partner || "Pathao"}</span></p>
                        <p style={{ margin: 0, color: "#111" }}>Date: <span style={{ fontWeight: "600" }}>{formattedDateString}</span></p>
                        <div style={{ backgroundColor: "#222", color: "#fff", padding: "8px 20px", fontWeight: "600", marginTop: "12px", display: "inline-block" }}>
                            Due Amount: BDT {finalPayable.toFixed(2)}
                        </div>
                        <p style={{ margin: "12px 0 0 0", fontWeight: "600", color: "#111" }}>Contact: {settings?.phone_number || "+8801886046042"}</p>
                    </div>
                </div>

            </div>
    
            <div style={{ textAlign: "end", marginTop: "20px", padding: "20px", maxWidth: "800px", margin: "0 auto" }} className="no-print">
                <button className="a4-invoice-btn" onClick={handlePrint} style={{ cursor: "pointer", background: "#1c558b", color: "white", padding: "10px 24px", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "600" }}>
                    Print Invoice
                </button>
            </div>
        </div>
    )
}
