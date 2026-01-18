import "./OrderInfoModal.css";

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
};

const formatMoney = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("en-BD", {
        style                : "currency",
        currency             : "BDT",
        minimumFractionDigits: 2,
    });
};

export default function OrderInfoModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    const {start_date,end_date,note,order_id,order = {}} = data;

    
    const {invoice_number,customer_name,phone_number,address_details,delivery_area,net_order_price,payable_price,delivery_charge,discount,special_discount,coupon_value,sell_price,mrp,
    paid_status,created_at,note: order_note,details = []} = order;

    return (
        <div className="follow-order-modal-backdrop" onClick={onClose}>
            <div className="follow-order-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="follow-order-modal__header">
                    <div>
                        <h2>Order #{order_id}</h2>
                        <p className="follow-order-modal__subtitle">
                            Invoice: <span>{invoice_number}</span>
                        </p>
                    </div>
                    <div className="follow-order-modal__header-right">
                        <span className={`follow-order-status-pill ${paid_status === "paid" ? "follow-order-status-pill--paid" : "follow-order-status-pill--unpaid"}`}>
                            {paid_status || "unknown"}
                        </span>
                        <button className="follow-order-modal__close" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="follow-order-modal__meta">
                    <div>
                        <span className="follow-label">Created at</span>
                        <span className="follow-value">{formatDate(created_at)}</span>
                    </div>
                    <div>
                        <span className="follow-label">Start date</span>
                        <span className="follow-value">{formatDate(start_date)}</span>
                    </div>
                    <div>
                        <span className="follow-label">End date</span>
                        <span className="follow-value">{formatDate(end_date)}</span>
                    </div>
                </div>

                <div className="follow-order-modal__grid">
                    <div className="follow-order-card">
                        <h3>Customer Info</h3>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Name</span>
                            <span className="follow-value">{customer_name || "-"}</span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Phone</span>
                            <a href={`tel:${phone_number}`} className="follow-value follow-link">
                                {phone_number || "-"}
                            </a>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Address</span>
                            <span className="follow-value">{address_details || "-"}</span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Area</span>
                            <span className="follow-value">{delivery_area || "-"}</span>
                        </div>

                        <div className="follow-order-card__divider" />

                        <h4>Follow-up / Schedule</h4>
                        <div className="follow-order-card__row">
                            <span className="follow-label">Reminder note</span>
                            <span className="follow-value">{note || "-"}</span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Order note</span>
                            <span className="follow-value">{order_note || "—"}</span>
                        </div>
                    </div>

                    <div className="follow-order-card">
                        <h3>Order Summary</h3>

                        <div className="follow-order-card__row">
                            <span className="follow-label">MRP</span>
                            <span className="follow-value">{formatMoney(mrp)}</span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Order price (before discount)</span>
                            <span className="follow-value">{formatMoney(net_order_price || sell_price)}</span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Discount</span>
                            <span className="follow-value">
                                {formatMoney(discount)} {special_discount && `(+ ${formatMoney(special_discount)} special)`}
                            </span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Coupon</span>
                            <span className="follow-value">{formatMoney(coupon_value)}</span>
                        </div>

                        <div className="follow-order-card__row">
                            <span className="follow-label">Delivery charge</span>
                            <span className="follow-value">{formatMoney(delivery_charge)}</span>
                        </div>

                        <div className="follow-order-card__divider" />

                        <div className="follow-order-card__row follow-order-card__row--total">
                            <span className="follow-label">Payable price</span>
                            <span className="follow-value">{formatMoney(payable_price || sell_price)}</span>
                        </div>
                    </div>
                </div>

                {/* Products table */}
                <div className="follow-order-products">
                    <h3>Products</h3>
                    <div className="follow-order-products__table-wrapper">
                        <table className="follow-order-products__table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>MRP</th>
                                    <th>Sell price</th>
                                    <th>Discount</th>
                                    <th>Line total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="follow-order-products__empty">
                                        No products found for this order.
                                        </td>
                                    </tr>
                                )}

                                {details.map((item) => {
                                    const {id,quantity,mrp: itemMrp,sell_price: itemSellPrice,discount: itemDiscount,product,} = item;

                                    const lineTotal = Number(itemSellPrice || 0) * Number(quantity || 0);
                                    const img = product?.img_path;

                                    return (
                                        <tr key={id}>
                                            <td>
                                                {img ? (
                                                <img src={img} alt={product?.name} className="follow-order-products__img"/>
                                                ) : (
                                                    <div className="follow-order-products__img-placeholder">No image</div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="follow-order-products__name">
                                                    {product?.name || "Unnamed product"}
                                                </div>
                                                <div className="follow-order-products__sub">
                                                    Stock: {product?.current_stock ?? 0}
                                                </div>
                                            </td>
                                            <td>{quantity}</td>
                                            <td>{formatMoney(itemMrp)}</td>
                                            <td>{formatMoney(itemSellPrice)}</td>
                                            <td>{formatMoney(itemDiscount)}</td>
                                            <td>{formatMoney(lineTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="follow-order-modal__footer">
                    <button className="follow-order-modal__btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
