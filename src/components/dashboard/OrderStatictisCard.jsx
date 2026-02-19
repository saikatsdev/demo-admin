import {ShoppingCart,CheckCircle,FileText,Truck,PauseCircle,Package,XCircle,RotateCcw,AlertTriangle,Clock,Archive} from "lucide-react";
import { getDatas } from "../../api/common/common";
import { useEffect, useState } from "react";
import DateFilter from "../filter/DateFilter";
import useDateFilter from "../../hooks/DateFilter";


export default function OrderStatictisCard() {
    const [statuses, setStatuses] = useState([]);

    const orderFilter         = useDateFilter("today");

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
        const res = await getDatas('/admin/statuses');

        if(res && res?.success){
            setStatuses(res?.result?.data);
        }
    }

    useEffect(() => {
        fetchedOrderStatus();
    }, []);

    return (
        <>
            <div className="cust-product">
                <h4></h4>
                
                <DateFilter value={orderFilter.filter} range={orderFilter.range} onChange={orderFilter.setFilter} onRangeChange={orderFilter.setRange}/>
            </div>
            
            <div className="order-stats-container">
                {statuses.length > 0 &&
                    statuses.map((item) => {
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
    )
}
