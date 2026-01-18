import { Calendar, CheckSquare, CreditCard, Package, RotateCcw, ShoppingCart, Truck, Users } from "lucide-react";


export default function OrderStatictisCard({dashboardSummary}) {
    return (
        <>
            <div className="order-stats-container">
                {/* Total Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Total Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.order_count || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.order_value || "0.00"} ৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <ShoppingCart size={20} color="#36cfc9" />
                    </div>
                </div>

                {/* New Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">New Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.submitted_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.submitted_order_value || "0.00"}{" "}৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <ShoppingCart size={20} color="#52c41a" />
                    </div>
                </div>

                {/* Cancel Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Cancel Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.canceled_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.canceled_order_value || "0.00"} ৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <RotateCcw size={20} color="#f5222d" />
                    </div>
                </div>

                {/* Confirm Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Confirm Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.confirm_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.confirm_order_value || "0.00"} ৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <CheckSquare size={20} color="#faad14" />
                    </div>
                </div>

                {/* Return Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Return Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.returned_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.returned_order_value || "0.00"} ৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <RotateCcw size={20} color="#eb2f96" />
                    </div>
                </div>

                {/* Delivered Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Delivered Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.delivered_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.delivered_order_value || "0.00"}{" "}৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <Truck size={20} color="#1890ff" />
                    </div>
                </div>

                {/* Paid Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Paid Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.paid_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.paid_order_value || "0.00"} ৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <CreditCard size={20} color="#8c8c8c" />
                    </div>
                </div>

                {/* Unpaid Order */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Unpaid Order</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.order_report?.unpaid_order || 0}
                        </span>
                        <span className="order-stats-subvalue">
                            {dashboardSummary?.order_report?.unpaid_order_value || "0.00"} ৳
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <Calendar size={20} color="#722ed1" />
                    </div>
                </div>

                {/* Total User */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Total User</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.total_users || 0}
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <Users size={20} color="#13c2c2" />
                    </div>
                </div>

                {/* Total Products */}
                <div className="order-stats-card">
                    <div className="order-stats-content">
                        <span className="order-stats-title">Total Products</span>
                        <span className="order-stats-value">
                            {dashboardSummary?.total_products || 0}
                        </span>
                    </div>
                    <div className="order-stats-icon-container">
                        <Package size={20} color="#13c2c2" />
                    </div>
                </div>
            </div>
        </>
    )
}
