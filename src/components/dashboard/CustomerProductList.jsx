import { Card, Table, Select } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";

export default function CustomerProductList() {
    // State
    const [customerData, setCustomerData]           = useState([]);
    const [topSellingProduct, setTopSellingProduct] = useState([]);

    // Columns
    const customerColumns = 
    [
        { 
            title: "SL", 
            dataIndex: "sl", 
            key: "sl", 
            width: 50 
        },
        { 
            title: "Customer Name", 
            dataIndex: "customerName", 
            key: "customerName" 
        },
        { 
            title: "Phone Number", 
            dataIndex: "phoneNumber", 
            key: "phoneNumber" 
        },
        {
            title: "Total Order",
            dataIndex: "totalOrder",
            key: "totalOrder",
            width: 100,
        },
        {
            title: "Order Value",
            dataIndex: "orderValue",
            key: "orderValue",
            width: 120,
        },
    ];

    // Method
    const getTopCustomer = async () => {
        const response = await getDatas("/admin/order/reports/by-customer");
        if (response.success) {
            const formattedData = response.result.map((item, index) => ({
                key         : index + 1,
                sl          : index + 1,
                customerName: item.customer_name,
                phoneNumber : item.phone_number,
                totalOrder  : item.order_count,
                orderValue  : item.order_value,
            }));
            setCustomerData(formattedData);
        }
    };

    const getTopSellingProduct = async () => {
        const response = await getDatas("/admin/order/reports/by-selling");
        if (response.success) {
            const formattedData = response.result.map((item, index) => ({
                key       : index + 1,
                id        : item.id,
                sl        : index + 1,
                name      : item.name,
                image     : item.img_path,
                price     : item.offer_price !== "0.00" ? item.offer_price: item.mrp,
                stock     : item.current_stock,
                orderCount: item.order_count,
            }));
        
            setTopSellingProduct(formattedData);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                getTopCustomer(),
                getTopSellingProduct()
            ]);
        };

        fetchData();
    }, []);

    return (
        <>
            <div className="cart-section">
                <div className="customer-list">
                    <Card className="table-card modern-card">
                        <div className="cust-product">
                            <h4>Top 10 Customer List</h4>
                            <Select defaultValue="today" size="small" style={{ width: 110 }} popupMatchSelectWidth={false}>
                                <Option value="today">Today</Option>
                                <Option value="Yesterday">Yesterday</Option>
                                <Option value="Last7days">Last 7 days</Option>
                                <Option value="Last30days">Last 30 days</Option>
                                <Option value="Month">This Month</Option>
                                <Option value="year">This Year</Option>
                            </Select>
                        </div>
                        <Table columns={customerColumns} dataSource={customerData} pagination={false} size="small" scroll={{ y: 350, x: 'max-content' }} />
                    </Card>
                </div>

                {/* Top 10 Selling Products */}
                <div className="product-list">
                    <Card className="table-card modern-card">
                        <div className="cust-product">
                            <h4>Top 10 Selling Products</h4>
                            <Select defaultValue="today" size="small" style={{ width: 110 }} popupMatchSelectWidth={false}>
                                <Option value="today">Today</Option>
                                <Option value="Yesterday">Yesterday</Option>
                                <Option value="Last7days">Last 7 days</Option>
                                <Option value="Last30days">Last 30 days</Option>
                                <Option value="Month">This Month</Option>
                                <Option value="year">This Year</Option>
                            </Select>
                        </div>

                        <div className="products-container">
                            {topSellingProduct?.length > 0 ? (
                                topSellingProduct?.map((product) => (
                                    <div key={product.id} className="product-card">
                                        <img src={product.image} alt={product.name} className="product-image" />
                                        <div className="product-info">
                                            <h4 className="product-name">{product.name}</h4>
                                            <p className="product-price">৳ {product.price}</p>
                                            <p className="product-stock">Stock: {product.stock}</p>
                                            <p className="product-order-count">
                                                Orders: {product.orderCount}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-product">No top selling products found.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    )
}
