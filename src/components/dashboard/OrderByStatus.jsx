import {Bar,BarChart,CartesianGrid,Cell,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import { useEffect, useState } from 'react'
import useDateFilter from '../../hooks/DateFilter';
import DateFilter from '../filter/DateFilter';
import { getDatas } from "../../api/common/common";

export default function OrderByStatus() {
    // State
    const [orderByStatus, setOrderByStatus] = useState([]);
    const orderCancelFilter                 = useDateFilter("today");

    const fetchedOrderStatus = async () => {
        const res = await getDatas('/admin/statuses');

        if(res && res?.success){
            setOrderByStatus(res?.result?.data || []);
        }
    }

    useEffect(() => {
        fetchedOrderStatus();
    }, []);

    const chartData = orderByStatus.map(item => ({
        name: item.name,
        value: item.orders_count,
        color: item.bg_color
    }));

    return (
        <>
            <div className='row'>
                <div className="col-lg-12 col-12">
                    <div className="chart3 summary-card-top">

                        <div style={{display:"flex", justifyContent:"space-between"}}>
                            <div></div>
                            <DateFilter value={orderCancelFilter.filter} range={orderCancelFilter.range} onChange={orderCancelFilter.setFilter} onRangeChange={orderCancelFilter.setRange}/>
                        </div>

                        <ResponsiveContainer width="100%" height={340}>
                            <BarChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 80 }} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>

                                <defs>
                                    {chartData.map((item, index) => (
                                        <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={item.fill} stopOpacity={0.9} />
                                            <stop offset="100%" stopColor={item.fill} stopOpacity={0.25} />
                                        </linearGradient>
                                    ))}
                                </defs>

                                <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{fontSize: 12,fill: "#64748B",fontWeight: 500,}} axisLine={false} tickLine={false}/>

                                <YAxis tick={{fontSize: 12,fill: "#94A3B8",}} axisLine={false} tickLine={false}/>

                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{borderRadius: "12px",border: "none",boxShadow: "0 10px 25px rgba(0,0,0,0.1)",fontSize: "13px",}} formatter={(value) => [`${value} Orders`, "Total Orders"]}/>

                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell fill={entry.color} key={index} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    )
}
