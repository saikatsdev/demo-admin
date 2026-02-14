import { Card, Table, Select } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";
import "./css/order-list.css";
import useDateFilter from "../../hooks/DateFilter";
import DateFilter from "../filter/DateFilter";

export default function OrderList() {
    // State
    const [recentOrdersData, setRecentOrdersData] = useState([]);
    const [loading, setLoading]                   = useState(false);
    const [locationData, setLocationData]         = useState([]);
    const [cancelOrders, setCancelOrders]         = useState([]);
    const [lowStockData, setLowStockData]         = useState([]);

    const orderFilter         = useDateFilter("today");
    const orderCancelFilter   = useDateFilter("today");
    const locationOrderFilter = useDateFilter("today");
    const stockFilter         = useDateFilter("today");

    // Columns
    const orderColumns = 
    [
        { 
            title: "SL", 
            dataIndex: "sl", 
            key: "sl", 
            width: 50,
            render:(_, __, index) => index + 1 
        },
        { 
            title: "Oder Id", 
            dataIndex: "orderId", 
            key: "orderId", 
            width: 90 
        },
        { 
            title: "Name", 
            dataIndex: "customerName", 
            key: "customerName", 
            width: 90 
        },
        { 
            title: "Phone", 
            dataIndex: "phoneNumber", 
            key: "phoneNumber" 
        },
        { 
            title: "Date", 
            dataIndex: "date", 
            key: "date", 
            width: 120 
        },
        {
            title: "Payable Amount",
            dataIndex: "payableAmount",
            key: "payableAmount",
            width: 130,
        },
    ];

    const cancelOrderColumns = 
    [
        { 
            title: "SL", 
            dataIndex: "sl", 
            key: "sl", 
            width: 50,
            render:(_, __, index) => index + 1 
        },
        { 
            title: "Order ID", 
            dataIndex: "id", 
            key: "id", 
            width: 90 
        },
        { 
            title: "Name", 
            dataIndex: "customer_name", 
            key: "customer_name", 
            width: 90 
        },
        { 
            title: "Phone", 
            dataIndex: "phone_number", 
            key: "phone_number" 
        },
        { 
            title: "Date", 
            dataIndex: "created_at", 
            key: "created_at", 
            width: 120,
            render: (value) => value ? value.split("T")[0] : ""
        },
        {
            title: "Payable Amount",
            dataIndex: "payable_price",
            key: "payable_price",
            width: 130,
        },
    ];

    const locationColumns = 
    [
        { 
            title: "SL",
            dataIndex: "sl",
            key: "sl",
            width: 60,
            render: (_, __, index) => index + 1
        },
        { 
            title: "Location",
            dataIndex: "district_name",
            key: "district_name",
        },
        {
            title: "Total Orders",
            dataIndex: "order_count",
            key: "order_count",
            width: 120,
        },
    ];

    const lowStockColumns = 
    [
        { 
            title: "SL", 
            dataIndex: "sl", 
            key: "sl", 
            width: 50,
            render:(_, __, index) => index + 1
        },
        {
            title: "Image",
            dataIndex: "img_path",
            key: "img_path",
            width: 70,
            render: (src, record) => (
                <img src={src} alt={record.name} style={{width: 32,height: 32,borderRadius: 4,objectFit: "cover"}}/>
            ),
        },
        { 
            title: "Product Name", 
            dataIndex: "name", 
            key: "name" 
        },
        { 
            title: "Stock", 
            dataIndex: "current_stock", 
            key: "current_stock", 
            width: 80 
        },
    ];

    const getLocationWiseData = async () => {
        const res = await getDatas("/admin/order/reports/by-location");

        if(res && res?.success){
            setLocationData(res?.result?.data || []);
        }
    }

    const getOrders = async () => {
        setLoading(true);

        const res = await getDatas("/admin/orders?page=1&paginate_size=10");

        const formattedData = res?.result?.data.map((item, index) => ({
            key          : index + 1,
            sl           : index + 1,
            orderId      : item?.invoice_number,
            customerName : item?.customer_name,
            phoneNumber  : item?.phone_number,
            date         : new Date(item?.created_at).toLocaleDateString("en-GB"),
            payableAmount: `${item?.payable_price} Tk`,
            status       : item?.current_status?.name || "N/A",
            paymentMethod: item?.payment_gateway?.name || "N/A",
        }));

        setRecentOrdersData(formattedData);
        setLoading(false);
    };

    const getCancelOrders = async () => {
        const res = await getDatas("/admin/order/reports/cancel");

        if(res && res?.success){
            setCancelOrders(res?.result?.data || []);
        }
    }

    const getLowestProducts = async () => {
        const res = await getDatas("/admin/lowest/stock/products");

        if(res && res?.success){
            setLowStockData(res?.result?.data || []);
        }
    }

    useEffect(() => {
        getOrders();
        getLocationWiseData();
        getCancelOrders();
        getLowestProducts();
    }, []);

    if (loading) {
        return (
            <div className="summary-card-loader" style={{ textAlign: "center", padding: "40px" }}>
                <div className="spinner" />
                <p>Loading Order List...</p>
            </div>
        );
    }

    return (
        <>
            <div className="dash-order-list">
                <div style={{ flex: "1 1 300px", minWidth: "300px" }}>
                    <Card className="table-card">
                        <div className="cust-product">
                            <h4>Recent 10-Orders List</h4>
                            
                            <DateFilter value={orderFilter.filter} range={orderFilter.range} onChange={orderFilter.setFilter} onRangeChange={orderFilter.setRange}/>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <Table columns={orderColumns} dataSource={recentOrdersData} pagination={false} size="small" scroll={{ y: 350, x: "max-content" }}/>
                        </div>
                    </Card>
                </div>

                <div style={{ flex: "1 1 300px", minWidth: "300px" }}>
                    <Card className="table-card">
                        <div className="cust-product">
                            <h4>Last 10 Cancel Orders List</h4>
                            
                            <DateFilter value={orderCancelFilter.filter} range={orderCancelFilter.range} onChange={orderCancelFilter.setFilter} onRangeChange={orderCancelFilter.setRange}/>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <Table columns={cancelOrderColumns} dataSource={cancelOrders} pagination={false} size="small" scroll={{ y: 350, x: "max-content" }}/>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="dash-order-list" style={{ marginTop: "20px" }}>
                <div style={{ flex: "1 1 300px", minWidth: "300px" }}>
                    <Card className="table-card">
                        <div className="cust-product">
                            <h4>Top 10 Locations</h4>
                            <DateFilter value={locationOrderFilter.filter} range={locationOrderFilter.range} onChange={locationOrderFilter.setFilter} onRangeChange={locationOrderFilter.setRange}/>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <Table columns={locationColumns} dataSource={locationData} pagination={false} size="small" scroll={{ y: 350, x: "max-content" }}/>
                        </div>
                    </Card>
                </div>

                <div style={{ flex: "1 1 300px", minWidth: "300px" }}>
                    <Card className="table-card">
                        <div className="cust-product">
                            <h4>Lowest Stock Products</h4>
                            <DateFilter value={stockFilter.filter} range={stockFilter.range} onChange={stockFilter.setFilter} onRangeChange={stockFilter.setRange}/>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <Table columns={lowStockColumns} dataSource={lowStockData} pagination={false} size="small" scroll={{ y: 350, x: "max-content" }}/>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    )
}
