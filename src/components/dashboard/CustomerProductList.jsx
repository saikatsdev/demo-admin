import { Card, Table } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";

import DateFilter from "../../components/filter/DateFilter";
import useDateFilter from "../../hooks/DateFilter";


export default function CustomerProductList() {
    const [customerData, setCustomerData]           = useState([]);
    const [topSellingProduct, setTopSellingProduct] = useState([]);

    const customerFilter = useDateFilter("today");
    const productFilter  = useDateFilter();

    const customerColumns = [
        { title: "SL", dataIndex: "sl", key: "sl", width: 50 },
        { title: "Customer Name", dataIndex: "customerName", key: "customerName" },
        { title: "Phone Number", dataIndex: "phoneNumber", key: "phoneNumber" },
        { title: "Total Order", dataIndex: "totalOrder", key: "totalOrder", width: 100 },
        { title: "Order Value", dataIndex: "orderValue", key: "orderValue", width: 120 },
    ];

    const getTopCustomer = async () => {
        const params = new URLSearchParams(
            customerFilter.buildParams()
        ).toString();

        const response = await getDatas(
            `/admin/order/reports/by-customer?${params}`
        );

        if (response.success) {
            setCustomerData(
                response.result.map((item, index) => ({
                    key: index + 1,
                    sl: index + 1,
                    customerName: item.customer_name,
                    phoneNumber: item.phone_number,
                    totalOrder: item.order_count,
                    orderValue: item.order_value,
                }))
            );
        }
    };

    const getTopSellingProduct = async () => {
        const params = new URLSearchParams(
            productFilter.buildParams()
        ).toString();

        const response = await getDatas(
            `/admin/order/reports/by-selling?${params}`
        );

        if (response.success) {
            setTopSellingProduct(
                response.result.map((item, index) => ({
                    key: index + 1,
                    id: item.id,
                    name: item.name,
                    image: item.img_path,
                    price:
                        item.offer_price !== "0.00"
                            ? item.offer_price
                            : item.mrp,
                    stock: item.current_stock,
                    orderCount: item.order_count,
                }))
            );
        }
    };

    useEffect(() => {
        getTopCustomer();
    }, [customerFilter.filter, customerFilter.range]);

    useEffect(() => {
        getTopSellingProduct();
    }, [productFilter.filter, productFilter.range]);

    return (
        <div className="cart-section">
            <div className="customer-list">
                <Card className="table-card modern-card">
                    <div className="cust-product">
                        <h4>Top 10 Customer List</h4>

                        <DateFilter value={customerFilter.filter} range={customerFilter.range} onChange={customerFilter.setFilter} onRangeChange={customerFilter.setRange}/>
                    </div>

                    <Table columns={customerColumns} dataSource={customerData} pagination={false} size="small" scroll={{ y: 350 }}/>
                </Card>
            </div>

            <div className="product-list">
                <Card className="table-card modern-card">
                    <div className="cust-product">
                        <h4>Top 10 Selling Products</h4>

                        <DateFilter value={productFilter.filter} range={productFilter.range} onChange={productFilter.setFilter} onRangeChange={productFilter.setRange}/>
                    </div>

                    <div className="products-container">
                        {topSellingProduct.length > 0 ? (
                            topSellingProduct.map(product => (
                                <div key={product.id} className="product-card">
                                    <img src={product.image} alt={product.name} className="product-image"/>

                                    <div className="product-info">
                                        <h4>{product.name}</h4>
                                        <p>৳ {product.price}</p>
                                        <p>Stock: {product.stock}</p>
                                        <p>Orders: {product.orderCount}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-product">
                                No top selling products found.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
