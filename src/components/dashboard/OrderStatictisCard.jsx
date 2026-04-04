import {ShoppingCart,CheckCircle,FileText,Truck,PauseCircle,Package,XCircle,RotateCcw,AlertTriangle,Clock,Archive} from "lucide-react";

import { getDatas } from "../../api/common/common";
import { useEffect, useState } from "react";
import DateFilter from "../filter/DateFilter";
import useDateFilter from "../../hooks/DateFilter";
import { Skeleton } from "antd";

export default function OrderStatictisCard() {
    // State
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);

    const orderFilter = useDateFilter("today");

    const statusIcons = {
        "new-order"       : ShoppingCart,
        "approved"        : CheckCircle,
        "invoiced"        : FileText,
        "in-courier"      : Truck,
        "on-hold"         : PauseCircle,
        "stock-pending"   : Clock,
        "delivered"       : Package,
        "canceled"        : XCircle,
        "pending-returned": RotateCcw,
        "returned"        : RotateCcw,
        "partial-returned": RotateCcw,
        "damaged"         : AlertTriangle,
        "courier-pending" : Archive,
        "courier-received": Archive,
    };

    const fetchedOrderStatus = async () => {
        try {
            setLoading(true);

            const params = {
                filter: orderFilter.filter,
                start_date: orderFilter.range?.[0]?.format("YYYY-MM-DD"),
                end_date: orderFilter.range?.[1]?.format("YYYY-MM-DD"),
            };

            const res = await getDatas("/admin/statuses", params);

            if (res && res.success) {
                setStatuses(res.result?.data || []);
            }

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchedOrderStatus();
    }, [orderFilter.filter, orderFilter.range]);

    return (
        <>
            <div className="cust-product">
                <h4></h4>

                <DateFilter value={orderFilter.filter} range={orderFilter.range} onChange={orderFilter.setFilter} onRangeChange={orderFilter.setRange}/>
            </div>

            <div className="order-stats-container">

                {loading &&
                    Array.from({ length: 8 }).map((_, index) => (
                        <div className="order-stats-card" key={index}>
                            <div className="order-stats-content">
                                <Skeleton.Input active size="small" style={{ width: 120 }} />
                                <br />
                                <Skeleton.Input active size="small" style={{ width: 60 }} />
                                <br />
                                <Skeleton.Input active size="small" style={{ width: 80 }} />
                            </div>

                            <div className="order-stats-icon-container">
                                <Skeleton.Avatar active shape="circle" size="small" />
                            </div>
                        </div>
                    ))
                }

                {!loading && statuses.map((item) => {

                    const Icon = statusIcons[item.slug] || ShoppingCart;

                    return (
                        <div className="order-stats-card" key={item.id}>

                            <div className="order-stats-content">
                                <span className="order-stats-title">{item.name}</span>

                                <span className="order-stats-value">
                                    {item.orders_count || 0}
                                </span>

                                <span className="order-stats-subvalue">
                                    {item.total_amount || 0} ৳
                                </span>
                            </div>

                            <div className="order-stats-icon-container" style={{ background: item.bg_color }}>
                                <Icon size={20} color={item.text_color} />
                            </div>

                        </div>
                    );
                })}
            </div>
        </>
    );
}