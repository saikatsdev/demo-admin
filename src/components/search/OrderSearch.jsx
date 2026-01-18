import { useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function OrderSearch({ getDatas }) {
    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [orders, setOrders] = useState([]);
    const [activeCustomer, setActiveCustomer] = useState(null);
    const [loading, setLoading] = useState(false);

    // Variable
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const res = await getDatas("/admin/orders", {phone_number: searchQuery,paginate_size: 10});

            if (res?.success) {
                setOrders(res.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const groupedByName = Object.values(
        orders.reduce((acc, order) => {
            const key = order.customer_name?.trim() || "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(order);
            return acc;
        }, {})
    );

    const activeGroup = groupedByName.find((g) => g[0].customer_name === activeCustomer);

    if (!activeCustomer && groupedByName.length > 0) {setActiveCustomer(groupedByName[0][0].customer_name)}

    return (
        <div className="order-search">
            <form className="search" role="search" onSubmit={handleSearch}>
                <input type="search" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                <button type="submit">
                    <SearchOutlined />
                </button>
            </form>

            {searchQuery.trim() && !loading && orders.length > 0 && (
                <div className="search-results-dropdown">
                    {groupedByName.length > 1 && (
                        <div className="customer-tabs">
                            {groupedByName.map((group, index) => {
                                const name = group[0].customer_name || "Unknown";
                                return (
                                    <button key={index} className={`tab-btn ${activeCustomer === name ? "active" : ""}`} onClick={() => setActiveCustomer(name)}>
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {activeGroup && (
                        <div className="profile-block">
                            <button className="close-search-btn" onClick={() => {setSearchQuery("");setOrders([]);setActiveCustomer(null);}}>
                                ✖
                            </button>

                        {activeGroup.map((order) => (
                            <div key={order.id} className="search-result-item" onClick={() => navigate(`/order-edit/${order.id}`)}>
                                <div className="search-result-header">
                                    <span>#{order.invoice_number}</span>
                                    <span className="status-badge" style={{backgroundColor: order?.current_status?.bg_color,color: order?.current_status?.text_color}}>
                                        {order?.current_status?.name ?? "N/A"}
                                    </span>
                                </div>

                                <div className="search-result-body">
                                    <strong>{order.customer_name}</strong>
                                    <span>{order.phone_number}</span>
                                    <span>৳{order.net_order_price}</span>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
