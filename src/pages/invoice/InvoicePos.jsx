// src/pages/Invoice/InvoicePos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Barcode from "react-barcode";
import { getDatas, putData } from "../../api/common/common";

const InvoicePos = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [settings, setSettings] = useState({
    title: "",
    logo: "",
    phoneNumber: "",
    address: "",
    email: "",
    invoiceText: "",
    note: "",
  });

  const loadSettings = async () => {
    // A4 এর মতো keys দিয়ে আনলে ভালো (কম ডাটা)
    const keys = [
      "phone_number",
      "title",
      "header_logo",
      "footer_address",
      "footer_email",
      "invoice_text",
      "note",
    ];

    // যদি তোমার backend keys support করে:
    const res = await getDatas(`/admin/settings?keys=${keys.join(",")}`);

    // যদি backend keys support না করে, তাহলে আগেরটা ব্যবহার করবে:
    // const res = await getDatas("/admin/settings");

    if (res?.success) {
      const next = {
        title: "",
        logo: "",
        phoneNumber: "",
        address: "",
        email: "",
        invoiceText: "",
        note: "",
      };

      res?.result?.data?.forEach((i) => {
        if (i.key === "title") next.title = i.value;
        if (i.key === "header_logo") next.logo = i.value;
        if (i.key === "phone_number") next.phoneNumber = i.value;
        if (i.key === "footer_address") next.address = i.value;
        if (i.key === "footer_email") next.email = i.value;
        if (i.key === "invoice_text") next.invoiceText = i.value;
        if (i.key === "note") next.note = i.value;
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
      try {
        await Promise.all([loadSettings(), loadOrder(id)]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const formattedDate = useMemo(
    () => new Date().toLocaleDateString("en-GB"),
    []
  );

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
      <div style={{ padding: 16, fontFamily: "monospace", color: "red" }}>
        Loading invoice...
      </div>
    );
  if (!orderDetails)
    return (
      <div style={{ padding: 16, fontFamily: "monospace" }}>No data found.</div>
    );

  const companyNote =
    settings?.invoiceText ||
    settings?.note ||
    "প্রোডাক্ট হাতে পেয়ে কুরিয়ার ম্যানের সামনে চেক করে নিন। কোনো সমস্যা থাকলে সাথে সাথে আমাদের কল সেন্টারে জানান।";

  return (
    <div style={{ fontFamily: "monospace", color: "black" }}>
      <div className="no-print" style={{ margin: "0 0 25px" }}>
        <h4>POS Invoice</h4>
        <hr />
      </div>

      <div
        className="printable receipt-80"
        style={{
          padding: "10px",
          width: "80mm",
          margin: "0 auto",
          border: "1px solid #000",
          marginTop: "10px",
          background: "white",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "1px dashed #000",
            marginBottom: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <div>
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  style={{
                    width: "50px",
                    height: "auto",
                    marginBottom: "4px",
                  }}
                />
              ) : null}
            </div>

            <div>
              {orderDetails?.id ? (
                <div style={{ textAlign: "center" }}>
                  <Barcode
                    value={String(orderDetails.id)}
                    format="CODE128"
                    displayValue={false}
                    height={30}
                    width={1.5}
                    margin={0}
                    background="#ffffff"
                    lineColor="#000000"
                  />
                </div>
              ) : null}
              <small style={{ color: "#6c757d" }}>{orderDetails.id}</small>
            </div>
          </div>

          <div style={{ fontSize: "12px", lineHeight: "1.3em", marginTop: 4 }}>
            <strong>{settings.title}</strong>
            <br />
            {settings.address}
            <br />
            Phone: {settings.phoneNumber}
            <br />
            {settings.email}
          </div>
        </div>

        {/* Invoice Info */}
        <table style={{ width: "100%", fontSize: "12px", marginBottom: "5px" }}>
          <tbody>
            <tr>
              <td>Invoice:</td>
              <td style={{ textAlign: "right" }}>{`PNP/000${orderDetails.id}`}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td style={{ textAlign: "right" }}>{formattedDate}</td>
            </tr>
          </tbody>
        </table>

        {/* Customer Info */}
        <div
          style={{
            borderTop: "1px dashed #000",
            borderBottom: "1px dashed #000",
            margin: "5px 0",
            padding: "3px 0",
            fontSize: "12px",
          }}
        >
          <div>Customer: {orderDetails.customer_name}</div>
          <div>Phone: {orderDetails.phone_number}</div>
          {orderDetails.address_details ? (
            <div style={{ marginTop: 2 }}>Addr: {orderDetails.address_details}</div>
          ) : null}
        </div>

        {/* Product List */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            marginBottom: "5px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: "60%",
                  textAlign: "left",
                  padding: "4px 6px",
                  borderBottom: "1px dashed #000",
                }}
              >
                Item
              </th>
              <th
                style={{
                  width: "10%",
                  textAlign: "right",
                  padding: "4px 6px",
                  borderBottom: "1px dashed #000",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  width: "30%",
                  textAlign: "right",
                  padding: "4px 6px",
                  borderBottom: "1px dashed #000",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orderDetails?.details?.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: "3px 6px" }}>
                  {item?.product?.name}
                  {item?.attribute_value_1 && (
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
                <td
                  className="pe-3"
                  style={{
                    textAlign: "right",
                    padding: "3px 6px",
                    paddingRight: "12px",
                  }}
                >
                  {item?.quantity}
                </td>
                <td
                  className="pe-3"
                  style={{
                    textAlign: "right",
                    padding: "3px 6px",
                    paddingRight: "12px",
                  }}
                >
                  {Number(item?.mrp) * Number(item?.quantity)} Tk
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <table style={{ width: "100%", fontSize: "12px", marginTop: "5px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "3px 6px" }}>Subtotal:</td>
              <td
                className="pe-3"
                style={{
                  textAlign: "right",
                  padding: "3px 6px",
                  paddingRight: "12px",
                }}
              >
                {orderDetails?.mrp} Tk
              </td>
            </tr>
            <tr>
              <td style={{ padding: "3px 6px" }}>Delivery:</td>
              <td
                className="pe-3"
                style={{
                  textAlign: "right",
                  padding: "3px 6px",
                  paddingRight: "12px",
                }}
              >
                {orderDetails?.delivery_charge} Tk
              </td>
            </tr>
            <tr style={{ borderTop: "1px dashed #000" }}>
              <td style={{ padding: "3px 6px" }}>
                <strong>Total:</strong>
              </td>
              <td
                className="pe-3"
                style={{
                  textAlign: "right",
                  padding: "3px 6px",
                  paddingRight: "12px",
                }}
              >
                <strong>{orderDetails?.payable_price} Tk</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ✅ Notes (NEW) */}
        <div
          style={{
            borderTop: "1px dashed #000",
            marginTop: "8px",
            paddingTop: "6px",
            fontSize: "11px",
            lineHeight: "1.35em",
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 700 }}>Customer Note:</div>
          <div style={{ marginBottom: 6 }}>
            {orderDetails?.note ? orderDetails.note : "N/A"}
          </div>

          <div style={{ fontWeight: 700 }}>Company Note:</div>
          <div>{companyNote}</div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            borderTop: "1px dashed #000",
            marginTop: "8px",
            paddingTop: "5px",
            fontSize: "11px",
          }}
        >
          Thank you for your purchase!
          <br />
          <strong>{settings.title}</strong>
        </div>
          
        {/* screen only */}
        <div className="no-print" style={{ textAlign: "center", marginTop: "10px" }}>
          <button
            onClick={handlePrint}
            style={{
              background: "#ffb24c",
              border: "1px solid #000",
              fontWeight: 600,
              padding: "6px 15px",
              cursor: "pointer",
            }}
          >
            Print Invoice
          </button>
        </div>
      </div>

      <style>{`.pe-3{padding-right:1rem !important;}`}</style>
    </div>
  );
};

export default InvoicePos;
