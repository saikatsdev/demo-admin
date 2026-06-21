import { useState, useEffect } from "react";
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Cell} from "recharts";
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export default function OrderStatictisCard({statuses, onFilterChange}) {
    // State
    const [activeFilter, setActiveFilter] = useState("today");
    const [dateRange, setDateRange]       = useState(null);

    // Effect to notify parent of filter changes
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange(activeFilter, dateRange);
        }
    }, [activeFilter, dateRange, onFilterChange]);

    // Methods to handle internal change
    const handleFilterChange = (val) => {
        setActiveFilter(val);
    }

    const handleDateRangeChange = (values) => {
        setDateRange(values);
    }

    return (
        <>
            <div className="sec-label" style={{ marginTop: "1.25rem" }}>
                Order by status
            </div>

            <div className="card" style={{ marginBottom: "1.25rem" }}>
                <div className="card-header">
                    <div className="card-title">
                        Order by status
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeFilter === 'custom' && (
                            <RangePicker 
                                size="small"
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                style={{
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-md)",
                                    background: "var(--bg-card)",
                                    height: "32px",
                                    fontSize: "12px"
                                }}
                                placeholder={['Start', 'End']}
                            />
                        )}
                        <select 
                            className="date-chip" 
                            value={activeFilter} 
                            onChange={(e) => handleFilterChange(e.target.value)}
                            style={{ 
                                outline: "none", 
                                cursor: "pointer", 
                                fontFamily: "inherit",
                                height: "32px"
                            }}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                            <option value="year">This year</option>
                            <option value="custom">Custom...</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: "auto", width: "100%" }}>
                    <div style={{ width: "100%", minWidth: "680px", height: "240px", padding: "0 0.5rem" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statuses || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}/>

                                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}/>

                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }}
                                    contentStyle={{
                                        backgroundColor: "#0F1724",
                                        borderRadius   : "8px",
                                        border         : "none",
                                        color          : "#FFF",
                                        fontSize       : "12px"
                                    }}
                                    itemStyle={{ color: "#D1D5DB" }}
                                    formatter={(value) => [`${value} orders`]}
                                />

                                <Bar dataKey="orders_count" radius={[6, 6, 0, 0]} barSize={24}>
                                    {statuses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.bg_color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
}