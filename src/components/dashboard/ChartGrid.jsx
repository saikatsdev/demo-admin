import {Bar,BarChart,CartesianGrid,Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,LineChart,Line,YAxis} from "recharts";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Select, DatePicker } from "antd";
import { getDatas } from "../../api/common/common";
import DateFilter from "../filter/DateFilter";
import useDateFilter from "../../hooks/DateFilter";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ChartGrid() {
    // State
    const orderFilter         = useDateFilter("today");
    const locationOrderFilter = useDateFilter("today");
    const [orderByStatus, setOrderByStatus] = useState([]);
    
    const fetchChartData = async () => {
        const res = await getDatas('/admin/statuses');

        if(res && res?.success){
            setOrderByStatus(res?.result?.data || []);
        }
    };

    useEffect(() => {
        fetchChartData();
    }, []);


    const COLORS = [
        "#1E40AF",
        "#FECACA",
        "#22C55E",
        "#06B6D4",
        "#A78BFA",
        "#795548",
        "#00897B",
        "#EF4444",
        "#F59E0B",
    ];

    const OrdersBySourceChart = [
        { source: "Website", orders: 450 },
        { source: "Mobile App", orders: 320 },
        { source: "Marketplace", orders: 210 },
        { source: "Phone Orders", orders: 90 },
        { source: "Social Media", orders: 140 },
        { source: "Email Campaign", orders: 75 },
    ];

    const GRADIENTS = [
        { from: "#1C558B", to: "#4F81BD" },
        { from: "#81C995", to: "#4CAF50" },
        { from: "#F28B82", to: "#F0625A" },
        { from: "#FDD663", to: "#FFC107" },
        { from: "#AECBFA", to: "#2196F3" },
        { from: "#CE93D8", to: "#9C27B0" },
    ];

    const OrderStatusData = {
        weekly: [
            { status: "Pending", value: 120 },
            { status: "On Hold", value: 50 },
            { status: "Approved", value: 80 },
            { status: "Processing", value: 70 },
            { status: "Ready To Ship", value: 90 },
            { status: "In-Transit", value: 60 },
            { status: "Delivered", value: 200 },
            { status: "Cancelled", value: 100 },
            { status: "Flagged", value: 10 },
        ],
        monthly: [
            { status: "Pending", value: 500 },
            { status: "On Hold", value: 200 },
            { status: "Approved", value: 350 },
            { status: "Processing", value: 300 },
            { status: "Ready To Ship", value: 280 },
            { status: "In-Transit", value: 450 },
            { status: "Delivered", value: 650 },
            { status: "Cancelled", value: 350 },
            { status: "Flagged", value: 40 },
        ],
        yearly: [
            { status: "Pending", value: 3200 },
            { status: "On Hold", value: 1800 },
            { status: "Approved", value: 2500 },
            { status: "Processing", value: 2100 },
            { status: "Ready To Ship", value: 2200 },
            { status: "In-Transit", value: 2700 },
            { status: "Delivered", value: 3800 },
            { status: "Cancelled", value: 2200 },
            { status: "Flagged", value: 200 },
        ],
    };

    const filteredStatusData = orderByStatus.map(item => ({
        name: item.name,
        value: item.orders_count,
    }));

    const totalStatusOrders = filteredStatusData.reduce(
        (sum, item) => sum + item.value,
        0
    );

    return (
        <>
            <div className="row">
                <div className="col-lg-6 col-12">
                    <div className="chart4">
                        <div className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title">Orders by Source</h3>
                                <DateFilter value={locationOrderFilter.filter} range={locationOrderFilter.range} onChange={locationOrderFilter.setFilter} onRangeChange={locationOrderFilter.setRange}/>
                            </div>

                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart layout="vertical" data={OrdersBySourceChart} margin={{ top: 20, right: 20, left: 60, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="0" stroke="transparent" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="source" tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => [`${value} Orders`]} contentStyle={{borderRadius: "8px",border: "none",boxShadow: "0 2px 6px rgba(0,0,0,0.1)",}}/>
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {OrdersBySourceChart.map((entry, index) => (
                                        <Bar key={index} dataKey="orders" barSize={22} radius={[5, 5, 5, 5]} fill={`url(#gradient${index})`}/>
                                    ))}
                                    {GRADIENTS.map((grad, i) => (
                                        <defs key={i}>
                                            <linearGradient id={`gradient${i}`} x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor={grad.from} />
                                                <stop offset="100%" stopColor={grad.to} />
                                            </linearGradient>
                                        </defs>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6 col-12 chart5">
                    <div className="chart-container">
                        <div className="chart-header">
                            <h4>
                                Order Status Percentage <Info size={16} style={{ marginLeft: 6 }} />
                            </h4>
                            <DateFilter value={orderFilter.filter} range={orderFilter.range} onChange={orderFilter.setFilter} onRangeChange={orderFilter.setRange}/>
                        </div>

                        <ResponsiveContainer width="100%" height={340}>
                            <PieChart>
                                <Pie data={filteredStatusData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4} dataKey="value" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}>
                                    {filteredStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} Orders`]} />
                                <Legend layout="vertical" align="left" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="chart-footer">
                            <p>
                                <strong>Total Orders:</strong> {totalStatusOrders}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
