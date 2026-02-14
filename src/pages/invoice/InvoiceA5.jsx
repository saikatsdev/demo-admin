import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Barcode from "react-barcode";
import { getDatas, putData } from "../../api/common/common";
import { useAppSettings } from "../../contexts/useAppSettings";
import useTitle from "../../hooks/useTitle";
import "./css/a5.css";

export default function InvoiceA5() {
    // Hook
    useTitle("A5 Invoice");

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

    const numberToWords = (n) => {
        const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];
        const teens=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
        const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
        const thousands=["","Thousand","Million","Billion"];
        if (!Number.isFinite(n) || n <= 0) return "Zero";
        let word=""; const helper=(x,i)=>x===0?"":(x<10?ones[x]:x<20?teens[x-10]:x<100?tens[Math.floor(x/10)]+(x%10?" "+ones[x%10]:""):ones[Math.floor(x/100)]+" Hundred"+(x%100?" "+helper(x%100,i):""))+(x?" "+thousands[i]:"");
        let i=0; while(n>0){ if(n%1000!==0) word=helper(n%1000,i)+" "+word; n=Math.floor(n/1000); i++; }
        return word.trim();
    };

    const totalPriceInWords = useMemo(() => {
        const amt = orderDetails?.payable_price ? Number(orderDetails.payable_price) : 0;
        return `${numberToWords(amt)} Taka`;
    }, [orderDetails?.payable_price]);

    const formattedDate = useMemo(() => new Date().toLocaleDateString("en-GB"), []);

    const handlePrint = async () => {
        try {
            const res = await putData(`/admin/orders/invoice/update/${id}`);
        
            if (res?.success) {
                console.log("Multi-invoice API success:", res);
                
                setTimeout(() => window.print(), 200);
        
            } else {
                alert("API failed: " + (res?.message || "Unknown error"));
            }
        
        } catch (error) {
            console.error("Print API error:", error);
            alert("Failed to send invoice to server.");
        }
    };

    const payablePrice    = Number(orderDetails?.payable_price || 0);
    const advancedPayment = Number(orderDetails?.advance_payment || 0);
    const finalPayable    = advancedPayment > 0 ? payablePrice - advancedPayment : payablePrice;
    const specialDiscount = Number(orderDetails?.special_discount || 0);

    const subTotal = orderDetails?.details?.reduce((sum, item) => {
        const price = Number(item?.sell_price || 0);
        const qty = Number(item?.quantity || 0);
        return sum + price * qty;
    }, 0);

    if (loading)
        return (
        <div className="a5-invoice-css">
            <span style={{ marginRight: 8 }}>⏳</span>
            Loading invoices…
        </div>
    );

    if (!orderDetails) return <div style={{ padding: 24 }}>No data found.</div>;

    console.log(settings);

    return (
        <div style={{ margin:0, padding:0, fontFamily:'"Lato", sans-serif', color:"black" }}>
            <div className="no-print" style={{ margin:"0 0 20px" }}>
                <h4>A5 Invoice</h4><hr />
            </div>
        
            <div className="printable invoice-page-a5" style={{ background:"#fff", margin:"0 auto", padding:"12px", border:"1px solid #3f3f3f" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                        {settings.logo ? <img src={settings.logo} alt="Logo" style={{ width: 80 }} /> : null}
                        <div style={{ fontSize:12 }}>
                            <p style={{ marginBottom:3 }}>{settings.address}</p>
                            <p style={{ marginBottom:3 }}>Contact: {settings.phone_number}</p>
                            <p style={{ marginBottom:0 }}>Email: {settings.footer_email}</p>
                        </div>
                    </div>
        
                    <div>
                        <table style={{ borderCollapse:"collapse", width:"auto", minWidth:200, fontWeight:600, fontSize:12 }}>
                            <tbody>
                                <tr>
                                    <td style={{ border:"1px solid #555555ff", padding:"4px 6px" }}>Invoice No:</td>
                                    <td style={{ border:"1px solid #555555ff", padding:"4px 6px" }}>{orderDetails.invoice_number}</td>
                                </tr>
                                <tr>
                                    <td style={{ border:"1px solid #555555ff", padding:"4px 6px" }}>Date:</td>
                                    <td style={{ border:"1px solid #555555ff", padding:"4px 6px" }}>{formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style={{ border:"1px solid #555555ff", padding:"4px 6px" }}>Order No:</td>
                                    <td style={{ border:"1px solid #555555ff", padding:"4px 6px" }}>{orderDetails.id}</td>
                                </tr>
                            </tbody>
                        </table>
            
                        {orderDetails?.id ? (
                            <div style={{ textAlign:"center", marginTop:6 }}>
                                <Barcode value={String(orderDetails.invoice_number)} format="CODE128" displayValue={false} height={35} width={2.5} margin={0} background="#ffffff" lineColor="#000000" />
                                <small style={{ color:"#6c757d", fontSize:10 }}>{orderDetails.invoice_number}</small>
                            </div>
                        ) : null}
                    </div>
                </div>
    
                <h4 style={{ textAlign:"center", fontWeight:"bold", margin:"0 0 12px" }}>INVOICE</h4>
    
                <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:10 }}>
                    <tbody>
                        <tr>
                            <td style={{ fontWeight:600, border:"1px solid #555555ff", width:"26%", padding:"6px" }}> Name:</td>
                            <td style={{ border:"1px solid #555555ff", padding:"6px" }}>{orderDetails.customer_name}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight:600, border:"1px solid #555555ff", width:"26%", padding:"6px" }}>Phone:</td>
                            <td style={{ border:"1px solid #555555ff", padding:"6px" }}>{orderDetails.phone_number}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight:600, border:"1px solid #555555ff", width:"26%", padding:"6px" }}>Address:</td>
                            <td style={{ border:"1px solid #555555ff", padding:"6px" }}>{orderDetails.address_details}</td>
                        </tr>
                    </tbody>
                </table>
    
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                        <tr>
                            {["Sl#", "Image", "Description", "SKU","Qty","MRP","Total"].map((h,i)=>(
                                <th key={i} style={{ border:"1px solid #555555ff", padding:"6px", fontSize:11, background:"#f5f5f5",textAlign:"center" }}> 
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {orderDetails?.details?.map((item, index) => (
                            <tr key={index}>
                            <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"4px 8px", fontSize:11 }}>{index+1}</td>
                            <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"6px 10px" }}>
                                <img className="a5-invoice-img" src={item?.product?.img_path}  alt={item?.product?.name || "Product Image"} />
                            </td>
                            
                            <td style={{ border:"1px solid #555555ff", padding:"4px 8px", fontSize:11 }}>
                                {item?.product?.name}

                                {item?.attribute_value_1 && (<small style={{ display:"block", color:"#6c757d", fontSize:10 }}>
                                [{item.attribute_value_1.attribute.name}: {item.attribute_value_1.value}]
                                </small>)}

                                {item?.attribute_value_2 && (<small style={{ display:"block", color:"#6c757d", fontSize:10 }}>
                                [{item.attribute_value_2.attribute.name}: {item.attribute_value_2.value}]
                                </small>)}

                                {item?.attribute_value_3 && (<small style={{ display:"block", color:"#6c757d", fontSize:10 }}>
                                [{item.attribute_value_3.attribute.name}: {item.attribute_value_3.value}]
                                </small>)}
                            </td>
            
                            <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"4px 8px", fontSize:11 }}>{item?.product?.sku || "N/A"}</td>
            
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"center", fontSize:11, padding:"4px 8px", paddingRight:"12px" }}>
                                {item?.quantity}
                            </td>
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"4px 8px", paddingRight:"12px" }}>
                                {Number(item?.sell_price || 0).toFixed(2)} Tk
                            </td>
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"4px 8px", paddingRight:"12px" }}>
                                {(Number(item?.sell_price || 0) * Number(item?.quantity || 0)).toFixed(2)} Tk
                            </td>
                            </tr>
                        ))}
        
                        <tr>
                            <td colSpan="5" style={{ border:"0" }} />
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                Sub Total
                            </td>
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                {subTotal.toFixed(2)} Tk
                            </td>
                        </tr>
        
                        {specialDiscount > 0 && (
                            <tr>
                                <td colSpan="5" style={{ border:"0" }} />
                                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                    Special Discount
                                </td>
                                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                    {specialDiscount.toFixed(2)} Tk
                                </td>
                            </tr>
                        )}
        
                        <tr>
                            <td colSpan="5" style={{ border:"0" }} />
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                Delivery
                            </td>
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                {orderDetails?.delivery_charge} Tk
                            </td>
                        </tr>
        
                        {Number(advancedPayment) > 0 && (
                            <tr>
                                <td colSpan="5" style={{ border:"0" }} />
                                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                    Advanced
                                </td>
                                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                    {advancedPayment} Tk
                                </td>
                            </tr>
                        )}
        
                        <tr>
                            <td colSpan="5" style={{ border:"0" }} />
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                Payable
                            </td>
                            <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontSize:11, padding:"6px 8px", paddingRight:"12px" }}>
                                {finalPayable} Tk
                            </td>
                        </tr>
        
                    </tbody>
                </table>
                
                <div style={{ fontWeight:600, fontSize:11 }}>
                    In Words: {totalPriceInWords}
                </div>

                <hr />

                <div style={{ textAlign:"center", marginTop:15 }}>
                    <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}>
                        Customer Note: {orderDetails?.note }
                    </div>

                    <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}>
                        Company Note: {settings?.invoice_text || "প্রোডাক্ট হাতে পেয়ে কুরিয়ার ম্যানের সামনে চেক করে নিন। কোনো সমস্যা থাকলে সাথে সাথে আমাদের কল সেন্টারে জানান।"}
                    </div>

                    <h6 style={{ fontWeight:"bold", marginBottom:2 }}>Thank you for choosing us</h6>
                    <p style={{ fontSize:11, marginBottom: 0 }}>{settings.title}</p>
                </div>
            </div>
        
            <div style={{ textAlign: "end", marginTop: "15px" }} className="no-print">
                <button className="a5-invoice-btn" onClick={handlePrint}>
                    Print Invoice
                </button>
            </div>
        
            <style>{`.pe-3{padding-right:1rem !important;}`}</style>
        </div>
    )
}
