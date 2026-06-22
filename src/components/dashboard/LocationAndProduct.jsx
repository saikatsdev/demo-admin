import { useEffect, useState, useCallback } from 'react'
import { getDatas } from '../../api/common/common';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export default function LocationAndProduct() {
    // States
    const [locationData, setLocationData] = useState([]);
    const [lowStockData, setLowStockData] = useState([]);
    const [cancelOrders, setCancelOrders] = useState([]);
    const [customers, setCustomers]       = useState([]);

    const [locationFilter, setLocationFilter] = useState("today");
    const [locationRange, setLocationRange]   = useState(null);

    const [lowStockFilter, setLowStockFilter] = useState("today");
    const [lowStockRange, setLowStockRange]   = useState(null);

    const [cancelFilter, setCancelFilter]     = useState("today");
    const [cancelRange, setCancelRange]       = useState(null);

    const [customerFilter, setCustomerFilter] = useState("today");
    const [customerRange, setCustomerRange]   = useState(null);

    const getLocationWiseData = useCallback(async (filter, range) => {
        try {
            const params = { paginate_size : 10, filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.from_date = range[0].format('YYYY-MM-DD');
                params.to_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas("/admin/order/reports/by-location", params);

            if(res && res?.success){
                setLocationData(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    const getLowestProducts = useCallback(async (filter, range) => {
        try {
            const params = { paginate_size : 10, filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.from_date = range[0].format('YYYY-MM-DD');
                params.to_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas("/admin/lowest/stock/products", params);

            if(res && res?.success){
                setLowStockData(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    const getCancelOrders = useCallback(async (filter, range) => {
        try {
            const params = { paginate_size : 10, filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.from_date = range[0].format('YYYY-MM-DD');
                params.to_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas("/admin/order/reports/cancel", params);

            if(res && res?.success){
                setCancelOrders(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    const getCustomer = useCallback(async (filter, range) => {
        try {
            const params = { paginate_size : 10, filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.from_date = range[0].format('YYYY-MM-DD');
                params.to_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas("/admin/order/reports/by-customer", params);

            if(res && res?.success){
                setCustomers(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    useEffect(() => {
        getLocationWiseData(locationFilter, locationRange);
    }, [locationFilter, locationRange, getLocationWiseData]);

    useEffect(() => {
        getLowestProducts(lowStockFilter, lowStockRange);
    }, [lowStockFilter, lowStockRange, getLowestProducts]);

    useEffect(() => {
        getCancelOrders(cancelFilter, cancelRange);
    }, [cancelFilter, cancelRange, getCancelOrders]);

    useEffect(() => {
        getCustomer(customerFilter, customerRange);
    }, [customerFilter, customerRange, getCustomer]);

    return (
        <div className="g2-last">
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Top locations
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {locationFilter === 'custom' && (
                            <RangePicker size="small" value={locationRange} onChange={(values) => setLocationRange(values)}
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
                        <select className="date-chip" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
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
                            <th>#</th>
                            <th>Location</th>
                            <th style={{ textAlign: "right" }}>Orders</th>
                        </tr>
                    </thead>

                    <tbody>
                        {locationData?.length > 0 && (
                            locationData?.map((item,index) => (
                                <tr key={item.key}>
                                    <td className="tid">{index+1}</td>
                                    <td>{item?.district_name}</td>
                                    <td className="tr">{item?.order_count}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Low stock alert
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {lowStockFilter === 'custom' && (
                            <RangePicker size="small" value={lowStockRange} onChange={(values) => setLowStockRange(values)}
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
                        <select className="date-chip" value={lowStockFilter} onChange={(e) => setLowStockFilter(e.target.value)}
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

                {lowStockData.length > 0 && (
                    lowStockData.map((item) => (
                        <div className="product-row" key={item.key}>
                            <div className="product-img">
                                <img src={item.img_path} alt="Product Image" />
                            </div>

                            <div>
                                <div className="product-name">
                                    {item.name}
                                </div>
                                <div className="product-meta">
                                    Restock urgently
                                </div>
                            </div>
                            <span className="chip chip-red">{item?.sold_qty || 0}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="card">
                <div className="card-header" style={{ marginBottom: "0.875rem" }}>
                    <div className="card-title">
                        Recent cancellations
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cancelFilter === 'custom' && (
                            <RangePicker size="small" value={cancelRange} onChange={(values) => setCancelRange(values)}
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
                        <select className="date-chip" value={cancelFilter} onChange={(e) => setCancelFilter(e.target.value)}
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
                            <th>Date</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cancelOrders?.length > 0 && (
                            cancelOrders?.map((item) => (
                                <tr item={item.key}>
                                    <td className="tid">#{item.invoice_number}</td>
                                    <td>{item?.customer_name}</td>
                                    <td style={{ fontSize: "11px", color: "var(--text-3)" }}>
                                        {new Date(item?.created_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "2-digit",
                                        })}
                                    </td>
                                    <td className="tr">৳{item?.payable_price || 0}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Top Customer
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {customerFilter === 'custom' && (
                            <RangePicker size="small" value={customerRange} onChange={(values) => setCustomerRange(values)}
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
                        <select className="date-chip" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}
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
                            <th>Name</th>
                            <th>Phone Number</th>
                            <th>Orders</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {customers?.length > 0 && (
                            customers?.map((item) => (
                                <tr key={item.key}>
                                    <td>{item?.customer_name}</td>
                                    <td>{item?.phone_number}</td>
                                    <td>{item?.order_count || 0}</td>
                                    <td className="tr">{item?.order_value || 0}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
