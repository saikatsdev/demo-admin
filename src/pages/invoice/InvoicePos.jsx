import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Barcode from "react-barcode";
import { getDatas, putData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import { useAppSettings } from "../../contexts/useAppSettings";
import "./css/pos.css";

export default function InvoicePos() {
    // Hook
    useTitle("Pos Invoice");

    const { id }                          = useParams();
    const {settings}                      = useAppSettings();
    const [loading, setLoading]           = useState(true);
    const [orderDetails, setOrderDetails] = useState(null);

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

    const formattedDate = useMemo(() => new Date().toLocaleDateString("en-GB"),[]);

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

    const companyNote = settings?.invoice_text || "প্রোডাক্ট হাতে পেয়ে কুরিয়ার ম্যানের সামনে চেক করে নিন। কোনো সমস্যা থাকলে সাথে সাথে আমাদের কল সেন্টারে জানান।";

    const deliveryCharge  = Number(orderDetails?.delivery_charge || 0);
    const advancedPayment = Number(orderDetails?.advance_payment || 0);
    const specialDiscount = Number(orderDetails?.special_discount || 0);

    const subTotal = orderDetails?.details?.reduce((sum, item) => {
        const price = Number(item?.product?.sell_price || 0);
        const qty = Number(item?.quantity || 0);
        return sum + price * qty;
    }, 0) || 0;

    const finalPayable = subTotal + deliveryCharge - specialDiscount - advancedPayment;

    if (loading)
    return (
        <div className="invoice-loader">
            <span style={{ marginRight: 8 }}>⏳</span>
            Loading invoices…
        </div>
    );

    if (!orderDetails) return (<div style={{ padding: 16, fontFamily: "monospace" }}>No data found.</div>);

    return (
        <>
            <div style={{ fontFamily: "monospace", color: "black" }}>
                <div className="no-print" style={{ margin: "0 0 25px" }}>
                    <h4>POS Invoice</h4>
                    <hr />
                </div>
        
                <div className="printable receipt-80">
                    <div className="invoice-head-reciept">
                        <div className="invoice-head-reciept-dis">
                            <div>
                                {settings.logo ? (
                                    <img src={settings.logo} alt="Logo" style={{width: "50px",height: "auto",marginBottom: "4px",}}/>
                                ) : null}
                            </div>
            
                            <div>
                                {orderDetails?.id ? (
                                    <div style={{ textAlign: "center" }}>
                                        <Barcode value={String(orderDetails.invoice_number)} format="CODE128" displayValue={false} height={30} width={1.5} margin={0} background="#ffffff" lineColor="#000000"/>
                                    </div>
                                ) : null}
                                <small style={{ color: "#6c757d" }}>{orderDetails.invoice_number}</small>
                            </div>
                        </div>
            
                        <div style={{ fontSize: "12px", lineHeight: "1.3em", marginTop: 4 }}>
                            <strong>{settings.title}</strong>
                            <br />
                            {settings.address}
                            <br />
                            Phone: {settings.phone_number}
                            <br />
                            {settings.footer_email}
                        </div>
                    </div>
        
                    <table style={{ width: "100%", fontSize: "12px", marginBottom: "5px" }}>
                        <tbody>
                            <tr>
                                <td>Invoice:</td>
                                <td style={{ textAlign: "right" }}>{orderDetails.invoice_number}</td>
                            </tr>
                            <tr>
                                <td>Date:</td>
                                <td style={{ textAlign: "right" }}>{formattedDate}</td>
                            </tr>
                        </tbody>
                    </table>
        
                    <div className="invoice-customer-info">
                        <div>Customer: {orderDetails.customer_name}</div>
                        <div>Phone: {orderDetails.phone_number}</div>
                        {orderDetails.address_details ? (
                            <div style={{ marginTop: 2 }}>Addr: {orderDetails.address_details}</div>
                        ) : null}
                    </div>
        
                    <table className="invoice-product-table">
                        <thead>
                            <tr>
                                <th className="invoice-product-table-head">
                                    Item
                                </th>

                                <th className="invoice-product-table-head-right">
                                    Qty
                                </th>

                                <th className="invoice-product-table-head1-right">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {orderDetails?.details?.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ padding: "3px 6px" }}>
                                        {item?.product?.name} {item?.attribute_value_1 && (
                                            <div style={{ fontSize: "10px" }}>
                                                [{item.attribute_value_1.attribute.name}:{" "}
                                                {item.attribute_value_1.value}]
                                            </div>
                                        )}

                                        {item?.attribute_value_2 && (
                                            <div style={{ fontSize: "10px" }}>
                                                [{item.attribute_value_2.attribute.name}:{" "}
                                                {item.attribute_value_2.value}]
                                            </div>
                                        )}

                                        {item?.attribute_value_3 && (
                                            <div style={{ fontSize: "10px" }}>
                                                [{item.attribute_value_3.attribute.name}:{" "}
                                                {item.attribute_value_3.value}]
                                            </div>
                                        )}
                                    </td>

                                    <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px"}}>
                                        {item?.quantity}
                                    </td>

                                    <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px"}}>
                                        {Number(item?.product?.sell_price) * Number(item?.quantity)} Tk
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
        
                    <table className="invoice-summary-table">
                        <tbody>
                            <tr>
                                <td style={{ padding: "3px 6px" }}>Subtotal:</td>
                                <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px"}}>
                                    {subTotal} Tk
                                </td>
                            </tr>
            
                            {specialDiscount > 0 && (
                                <tr>
                                    <td style={{ padding: "3px 6px" }}>Special Discount:</td>
                                    <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px"}}>
                                        {specialDiscount} Tk
                                    </td>
                                </tr>
                            )}
            
                            <tr>
                                <td style={{ padding: "3px 6px" }}>Delivery:</td>
                                <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px"}}>
                                    {orderDetails?.delivery_charge} Tk
                                </td>
                            </tr>
            
                            {advancedPayment > 0 && (
                                <tr>
                                    <td style={{ padding: "3px 6px" }}>Delivery:</td>
                                    <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px"}}>
                                        {advancedPayment} Tk
                                    </td>
                                </tr>
                            )}
            
                            <tr style={{ borderTop: "1px dashed #000" }}>
                                <td style={{ padding: "3px 6px" }}>
                                    <strong>Total:</strong>
                                </td>

                                <td className="pe-3" style={{textAlign: "right",padding: "3px 6px",paddingRight: "12px",}}>
                                    <strong>{finalPayable} Tk</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
        
                    <div className="invoice-note-div">
                        <div style={{ fontWeight: 700 }}>Customer Note:</div>
                        <div style={{ marginBottom: 6 }}>
                            {orderDetails?.note ? orderDetails.note : "N/A"}
                        </div>
            
                        <div style={{ fontWeight: 700 }}>Company Note:</div>
                        <div>{companyNote}</div>
                    </div>
        
                    <div className="invoice-footer-div">
                        Thank you for your purchase!
                        <br />
                        <strong>{settings.title}</strong>
                    </div>
                    
                    <div className="no-print" style={{ textAlign: "center", marginTop: "10px" }}>
                        <button className="no-print-btn" onClick={handlePrint}>
                            Print Invoice
                        </button>
                    </div>
                </div>
        
                <style>{`.pe-3{padding-right:1rem !important;}`}</style>
            </div>
        </>
    )
}
