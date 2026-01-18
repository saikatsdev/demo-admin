// src/pages/Invoice/InvoiceA4.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Barcode from "react-barcode";
import { getDatas, putData } from "../../api/common/common";

const InvoiceA4 = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [settings, setSettings] = useState({
    title: "", logo: "", phoneNumber: "", address: "", email: "", invoiceText:"", note: "",
  });

  const loadSettings = async () => {
     const keys = [
      "invoice_number",
      "phone_number",
      "title",
      "admin_base_url",
      "invoice_text",
      "note",
    ];

    const res = await getDatas(`/admin/settings?keys=${keys.join(",")}`);
    console.log(res);
    
    if (res?.success) {
      const next = { title: "", logo: "", phoneNumber: "", address: "", email: "", invoiceText:"", note:"", };
      res?.result?.data?.forEach((i) => {
        if (i.key === "title") next.title = i.value;
        if (i.key === "header_logo") next.logo = i.value;
        if (i.key === "phone_number") next.phoneNumber = i.value;
        if (i.key === "footer_address") next.address = i.value;
        if (i.key === "footer_email") next.email = i.value;
        if (i.key === "invoice_text") next.invoiceText = i.value;
        if (i.key === "note") next.invoiceText = i.value;

      });
      setSettings(next);
    }
  };

  

  const loadOrder = async (orderId) => {
    const res = await getDatas(`/admin/orders/${orderId}`);
    
    if (res?.success) setOrderDetails(res?.result);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try { await Promise.all([loadSettings(), loadOrder(id)]); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  const numberToWords = (num) => {
    const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];
    const teens=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const thousands=["","Thousand","Million","Billion"];
    if (!Number.isFinite(num) || num <= 0) return "Zero";
    let word=""; const helper=(n,idx)=>{if(n===0)return"";let s="";if(n<10)s=ones[n];else if(n<20)s=teens[n-10];else if(n<100)s=tens[Math.floor(n/10)]+(n%10?" "+ones[n%10]:"");else s=ones[Math.floor(n/100)]+" Hundred"+(n%100?" "+helper(n%100,idx):"");return s+(n?" "+thousands[idx]:"");};
    let i=0; while(num>0){ if(num%1000!==0) word=helper(num%1000,i)+" "+word; num=Math.floor(num/1000); i++; }
    return word.trim();
  };

  const totalPriceInWords = useMemo(() => {
    const amt = orderDetails?.payable_price ? Number(orderDetails.payable_price) : 0;
    return `${numberToWords(amt)} Taka`;
  }, [orderDetails?.payable_price]);

  const formattedDate = useMemo(() => new Date().toLocaleDateString("en-GB"), []);
  // const handlePrint = () => setTimeout(() => window.print(), 200);

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


  if (loading) return <div style={{ padding: 24, color:"red" }}>Loading invoice...</div>;
  if (!orderDetails) return <div style={{ padding: 24 }}>No data found.</div>;


  console.log(settings);
  

  return (
    <div style={{ margin: 0, padding: 0, fontFamily: '"Lato", sans-serif', color: "black" }}>
      <div className="no-print" style={{ margin: "0 0 24px" }}>
        <h4>A4 Invoice</h4><hr />
      </div>

      {/* Screen-এও বর্ডার দেখাতে inline border রেখেছি; print.css নিজে সামলায় */}
      <div className="printable invoice-page-a4"
           style={{ background:"white", margin:"0 auto", padding:"12px", border:"1px solid #3f3f3f" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"10px" }}>
          <div style={{ display:"flex", alignItems:"flex-start" }}>
            {settings.logo ? <img src={settings.logo} alt="Logo" style={{ width: 80 }} /> : null}
            <div style={{ marginLeft: 20, fontSize: 14 }}>
              <p style={{ marginBottom: 5 }}>{settings.address}</p>
              <p style={{ marginBottom: 5 }}>Contact: {settings.phoneNumber}</p>
              <p style={{ marginBottom: 0 }}>Email: {settings.email}</p>
            </div>
          </div>

          <div>
            <table style={{ borderCollapse:"collapse", width:"auto", minWidth:250, fontWeight:600, fontSize:14 }}>
              <tbody>
                <tr>
                  <td style={{ border:"1px solid #555555ff", padding:"6px 8px" }}>Invoice No:</td>
                  <td style={{ border:"1px solid #555555ff", padding:"6px 8px" }}>{`PNP/000${orderDetails.id}`}</td>
                </tr>
                <tr>
                  <td style={{ border:"1px solid #555555ff", padding:"6px 8px" }}>Date:</td>
                  <td style={{ border:"1px solid #555555ff", padding:"6px 8px" }}>{formattedDate}</td>
                </tr>
                <tr>
                  <td style={{ border:"1px solid #555555ff", padding:"6px 8px" }}>Order No:</td>
                  <td style={{ border:"1px solid #555555ff", padding:"6px 8px" }}>{orderDetails.id}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign:"center", marginTop:10 }}>
              {orderDetails?.id ? (
                <Barcode value={String(orderDetails.id)} format="CODE128"
                         displayValue={false} height={40} width={3} margin={0}
                         background="#ffffff" lineColor="#000000" />
              ) : null}
              <small style={{ color:"#6c757d" }}>{orderDetails.id}</small>
            </div>
          </div>
        </div>

        <h4 style={{ textAlign:"center", fontWeight:"bold", margin:"0 0 12px" }}>INVOICE</h4>

        {/* Customer Info */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:15 }}>
          <tbody>
            <tr>
              <td style={{ fontWeight:600, border:"1px solid #555555ff", width:"20%", padding:"8px" }}>Customer Name:</td>
              <td style={{ border:"1px solid #555555ff", padding:"8px" }}>{orderDetails.customer_name}</td>
            </tr>
            <tr>
              <td style={{ fontWeight:600, border:"1px solid #555555ff", width:"20%", padding:"8px" }}>Phone:</td>
              <td style={{ border:"1px solid #555555ff", padding:"8px" }}>{orderDetails.phone_number}</td>
            </tr>
            <tr>
              <td style={{ fontWeight:600, border:"1px solid #555555ff", width:"20%", padding:"8px" }}>Address:</td>
              <td style={{ border:"1px solid #555555ff", padding:"8px" }}>{orderDetails.address_details}</td>
            </tr>
          </tbody>
        </table>

        {/* Product Table */}
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              {["Sl#", "Image", "Product Description", "SKU", "Qty", "Unit Price", "Total"].map((h, i) => (
                <th key={i}
                    style={{ border:"1px solid #555555ff", padding:"8px 10px", fontSize:14, background:"#f5f5f5",
                             textAlign:"center" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderDetails?.details?.map((item, index) => (
              <tr key={index}>
                <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"6px 10px" }}>{index + 1}</td>
                <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"6px 10px" }}>
                  <img 
                    src={item?.product?.img_path} 
                    alt={item?.product?.name || "Product Image"} 
                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                  />
                </td>
                <td style={{ border:"1px solid #555555ff", padding:"6px 10px", }}>
                  {item?.product?.name}
                  {item?.attribute_value_1 && (
                    <small style={{ display:"block", color:"#6c757d" }}>
                      [{item.attribute_value_1.attribute.name}: {item.attribute_value_1.value}]
                    </small>
                  )}
                  {item?.attribute_value_2 && (
                    <small style={{ display:"block", color:"#6c757d" }}>
                      [{item.attribute_value_2.attribute.name}: {item.attribute_value_2.value}]
                    </small>
                  )}
                  {item?.attribute_value_3 && (
                    <small style={{ display:"block", color:"#6c757d" }}>
                      [{item.attribute_value_3.attribute.name}: {item.attribute_value_3.value}]
                    </small>
                  )}
                </td>
                <td style={{ border:"1px solid #555555ff", textAlign:"center", padding:"4px 8px", fontSize:11 }}>{item?.product?.sku || "N/A"}</td>
                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"center", padding:"6px 10px", paddingRight:"12px" }}>
                  {item?.quantity}
                </td>
                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", padding:"6px 10px", paddingRight:"12px" }}>
                  {item?.mrp} Tk
                </td>
                <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", padding:"6px 10px", paddingRight:"12px" }}>
                  {Number(item?.mrp) * Number(item?.quantity)} Tk
                </td>
              </tr>
            ))}
            <tr>
              
              <td colSpan="5" style={{ border:"0" }} />
              <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, padding:"8px 10px", paddingRight:"12px" }}>
                Sub Total
              </td>
              <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", padding:"8px 10px", paddingRight:"12px" }}>
                {orderDetails?.mrp} Tk
              </td>
            </tr>
            <tr>
              
              <td colSpan="5" style={{ border:"0" }} />
              <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, padding:"8px 10px", paddingRight:"12px" }}>
                Delivery Charge
              </td>
              <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", padding:"8px 10px", paddingRight:"12px" }}>
                {orderDetails?.delivery_charge} Tk
              </td>
            </tr>
            <tr>
              
              <td colSpan="5" style={{ border:"0" }} />
              <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", fontWeight:600, padding:"8px 10px", paddingRight:"12px" }}>
                Payable Amount
              </td>
              <td className="pe-3" style={{ border:"1px solid #555555ff", textAlign:"right", padding:"8px 10px", paddingRight:"12px" }}>
                {orderDetails?.payable_price} Tk
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontWeight:600, marginTop:15 }}>In Words: {totalPriceInWords}</div>
        <hr />
        <div style={{ textAlign:"center", marginTop:15 }}>
        <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}>Customer Note: {orderDetails?.note }</div>
        <div style={{ fontWeight:600, fontSize:11, textAlign:"start", }}> Company Note: {settings?.invoiceText || "প্রোডাক্ট হাতে পেয়ে কুরিয়ার ম্যানের সামনে চেক করে নিন। কোনো সমস্যা থাকলে সাথে সাথে আমাদের কল সেন্টারে জানান।"}</div>
          <h6 style={{ fontWeight:"bold" }}>Thank you for choosing us</h6>
          <p style={{ marginBottom: 0 }}>{settings.title}</p>
        </div>
      </div>

      <div style={{ textAlign: "end", marginTop: "20px" }} className="no-print">
        <button
          onClick={handlePrint}
          style={{
            backgroundColor: "#1C558B",
            borderRadius: "3px",
            border: "2px solid black",
            color: "#111",
            fontWeight: "500",
            fontSize: "18px",
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Print Invoice
        </button>
      </div>

      {/* যদি bootstrap না থাকে — pe-3 fallback */}
      <style>{`.pe-3{padding-right:1rem !important;}`}</style>
    </div>
  );
};

export default InvoiceA4;
