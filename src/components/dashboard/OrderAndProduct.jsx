import { useEffect, useState, useCallback } from "react";
import { getDatas } from "../../api/common/common";
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function OrderAndProduct() {

    // States
    const [recentOrdersData, setRecentOrdersData] = useState([]);
    const [loading, setLoading]                   = useState(false);
    const [products, setProducts]                 = useState([]);

    const [orderFilter, setOrderFilter]           = useState("today");
    const [orderRange, setOrderRange]             = useState(null);

    const [productFilter, setProductFilter]       = useState("today");
    const [productRange, setProductRange]         = useState(null);

    const getOrders = useCallback(async (filter, range) => {
        try {
            setLoading(true);
            const params = { paginate_size : 10, filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.start_date = range[0].format('YYYY-MM-DD');
                params.end_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas("/admin/order/reports", params);

            setRecentOrdersData(res?.result?.orders?.data || []);
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }, []);

    const getTopSellingProduct = useCallback(async (filter, range) => {
        try {
            const params = { paginate_size : 10, filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.from_date = range[0].format('YYYY-MM-DD');
                params.to_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas('/admin/order/reports/by-selling', params);

            if(res && res?.success){
                setProducts(res?.result?.data);
            }
        } catch (error) {
            console.log(error);
        }
    }, [])

    useEffect(() => {
        getOrders(orderFilter, orderRange);
    }, [orderFilter, orderRange, getOrders]);

    useEffect(() => {
        getTopSellingProduct(productFilter, productRange);
    }, [productFilter, productRange, getTopSellingProduct]);

    return (
        <div className="g2">
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Recent orders
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {orderFilter === 'custom' && (
                            <RangePicker size="small" value={orderRange} onChange={(values) => setOrderRange(values)}
                                style={{
                                    borderRadius: "6px",
                                    border      : "1px solid var(--border-md)",
                                    background  : "var(--bg-card)",
                                    height      : "32px",
                                    fontSize    : "12px"
                                }}
                                placeholder={['Start', 'End']}
                            />
                        )}
                        <select className="date-chip" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}
                            style={{ outline: "none", cursor: "pointer", fontFamily: "inherit", height: "32px" }}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                            <option value="year">This year</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                </div>
                
                <table className="tbl">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4">Loading...</td>
                            </tr>
                        ) : recentOrdersData?.length > 0 ? (
                            recentOrdersData.map((item) => (
                                <tr key={item.key}>
                                    <td className="tid">{item.invoice_number}</td>
                                    <td>
                                        {item.customer_name}
                                        <br/>
                                        <small>{item.phone_number}</small>
                                    </td>
                                    <td>
                                        <span className="chip" style={{backgroundColor: item?.current_status?.bg_color, color:item?.current_status?.text_color}}>
                                            {item?.current_status?.name}
                                        </span>
                                    </td>
                                    <td className="tr">{item.payable_price}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4">No orders found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Top selling products
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {productFilter === 'custom' && (
                            <RangePicker size="small" value={productRange} onChange={(values) => setProductRange(values)}
                                style={{
                                    borderRadius: "6px",
                                    border      : "1px solid var(--border-md)",
                                    background  : "var(--bg-card)",
                                    height      : "32px",
                                    fontSize    : "12px"
                                }}
                                placeholder={['Start', 'End']}
                            />
                        )}
                        <select className="date-chip" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
                            style={{ outline: "none", cursor: "pointer", fontFamily: "inherit", height: "32px" }}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                            <option value="year">This year</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                </div>

                {products?.length > 0 && (
                    products?.map((item) => (
                        <div className="product-row" key={item.id}>
                            <div className="product-img">
                                <img src={item?.img_path} alt="Product Image"/>
                            </div>

                            <div>
                                <div className="product-name">
                                    {item?.name}
                                </div>

                                <div className="product-meta">
                                    Stock: {item?.current_stock || 0} &nbsp;&bull;&nbsp; Orders: {item?.order_count || 0}
                                </div>
                            </div>

                            <div className="product-price">
                                ৳{item?.sell_price || 0}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
