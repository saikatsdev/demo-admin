import { useEffect, useState, useCallback } from "react"
import { getDatas } from "../../api/common/common";
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export default function OrderSource() {
    // States
    const [sources, setSources]           = useState([]);
    const [activeFilter, setActiveFilter] = useState("today");
    const [dateRange, setDateRange]       = useState(null);

    const getStatus = useCallback(async (filter, range) => {
        try {
            const params = { filter };

            if (filter === 'custom' && range && range[0] && range[1]) {
                params.start_date = range[0].format('YYYY-MM-DD');
                params.end_date   = range[1].format('YYYY-MM-DD');
            }

            const res = await getDatas("/admin/order-froms", params);

            if(res && res?.success){
                setSources(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, [])

    useEffect(() => {
        getStatus(activeFilter, dateRange);
    }, [activeFilter, dateRange, getStatus]);

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    Orders by source
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeFilter === 'custom' && (
                        <RangePicker size="small" value={dateRange}
                            onChange={(values) => setDateRange(values)}
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
                    <select className="date-chip" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
                        style={{ 
                            outline   : "none",
                            cursor    : "pointer",
                            fontFamily: "inherit",
                            height    : "32px"
                        }}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "10px 0" }}>
                {sources.map((src, i) => (
                    <div className="bar-row" key={i}>
                        <div className="bar-lbl">
                            {src.name}
                        </div>

                        <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${src.orders_percentage}%`, backgroundColor: src.color }}></div>
                        </div>

                        <div className="bar-val">
                            {src.orders_count.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
