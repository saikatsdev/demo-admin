import {Bar,BarChart,CartesianGrid,Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { getDatas } from "../../api/common/common";
import DateFilter from "../filter/DateFilter";
import useDateFilter from "../../hooks/DateFilter";
import "./css/ChartGrid.css";

export default function ChartGrid() {
    // State
    const orderFilter = useDateFilter("today");
    const locationOrderFilter = useDateFilter("today");
    const [orderByStatus, setOrderByStatus] = useState([]);

    const fetchChartData = async () => {
        const res = await getDatas('/admin/statuses');
        if (res && res?.success) {
            setOrderByStatus(res?.result?.data || []);
        }
    };

    useEffect(() => {
        fetchChartData();
    }, []);

    const COLORS = [
        "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
        "#06b6d4", "#ec4899", "#64748b", "#1e293b"
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
        { from: "#4f46e5", to: "#6366f1" },
        { from: "#059669", to: "#10b981" },
        { from: "#ea580c", to: "#f59e0b" },
        { from: "#dc2626", to: "#ef4444" },
        { from: "#7c3aed", to: "#8b5cf6" },
        { from: "#0891b2", to: "#06b6d4" },
    ];

    const filteredStatusData = orderByStatus.map(item => ({
        name: item.name,
        value: item.orders_count,
    }));

    const totalStatusOrders = filteredStatusData.reduce(
        (sum, item) => sum + item.value,
        0
    );

    return (
        <div className="charts-grid-container">
            {/* Orders by Source Chart */}
            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Orders by Source</h3>
                    <DateFilter 
                        value={locationOrderFilter.filter} 
                        range={locationOrderFilter.range} 
                        onChange={locationOrderFilter.setFilter} 
                        onRangeChange={locationOrderFilter.setRange} 
                    />
                </div>

                <div className="chart-visual-wrapper">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart 
                            layout="vertical" 
                            data={OrdersBySourceChart} 
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <defs>
                                {GRADIENTS.map((grad, i) => (
                                    <linearGradient id={`chartGradient${i}`} key={i} x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={grad.from} />
                                        <stop offset="100%" stopColor={grad.to} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis 
                                type="category" 
                                dataKey="source" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                    borderRadius: "12px", 
                                    border: "none", 
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    padding: "10px 15px"
                                }}
                            />
                            <Bar dataKey="orders" barSize={18} radius={[0, 4, 4, 0]}>
                                {OrdersBySourceChart.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#chartGradient${index % GRADIENTS.length})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Order Status Percentage Chart */}
            <div className="chart-card">
                <div className="chart-card-header">
                    <h4>
                        Order Status Percentage <Info size={16} className="info-icon" style={{ marginLeft: 8 }} />
                    </h4>
                    <DateFilter 
                        value={orderFilter.filter} 
                        range={orderFilter.range} 
                        onChange={orderFilter.setFilter} 
                        onRangeChange={orderFilter.setRange} 
                    />
                </div>

                <div className="chart-visual-wrapper">
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie 
                                data={filteredStatusData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={100} 
                                paddingAngle={5} 
                                dataKey="value" 
                                stroke="none"
                            >
                                {filteredStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: "12px", 
                                    border: "none", 
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" 
                                }} 
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                align="center" 
                                iconType="circle" 
                                wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card-footer">
                    <div className="total-badge">
                        <strong>Total Orders:</strong> {totalStatusOrders.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
