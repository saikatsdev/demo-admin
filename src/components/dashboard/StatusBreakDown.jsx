import { useEffect, useRef, useState, useCallback } from "react";
import { getDatas } from "../../api/common/common";
import { DatePicker } from "antd";

const { RangePicker } = DatePicker;

export default function StatusBreakDown() {
    // States
    const canvasRef                       = useRef(null);
    const [statuses, setStatuses]         = useState([]);
    const [activeFilter, setActiveFilter] = useState("today");
    const [dateRange, setDateRange]       = useState(null);

    const getStatusData = useCallback(async (filter, range) => {
        try {
            const params = { filter };
            if (filter === "custom" && range?.[0] && range?.[1]) {
                params.start_date = range[0].format("YYYY-MM-DD");
                params.end_date = range[1].format("YYYY-MM-DD");
            }
            const res = await getDatas("/admin/statuses", params);
            if (res?.success) {
                setStatuses(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    useEffect(() => {
        getStatusData(activeFilter, dateRange);
    }, [activeFilter, dateRange, getStatusData]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 140 * dpr;
        canvas.height = 140 * dpr;
        canvas.style.width = "140px";
        canvas.style.height = "140px";

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 140, 140);

        const cx = 70;
        const cy = 70;
        const outerRadius = 65;
        const innerRadius = 38;

        const slices = statuses.filter((s) => Number(s.orders_count) > 0);
        const total = slices.reduce((sum, s) => sum + Number(s.orders_count), 0);

        if (total <= 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
            ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = "#f3f4f6";
            ctx.fill();
            return;
        }

        let startAngle = -Math.PI / 2;

        slices.forEach((s) => {
            const sliceAngle = (Number(s.orders_count) / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = s.bg_color || "#d1d5db";
            ctx.fill();
            startAngle += sliceAngle;
        });
    }, [statuses]);

    const totalStatusOrders = statuses.reduce(
        (sum, s) => sum + Number(s.orders_count || 0),
        0
    );

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">Order status breakdown</div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {activeFilter === "custom" && (
                        <RangePicker size="small" value={dateRange}
                            onChange={(values) => setDateRange(values)}
                            style={{
                                borderRadius: "6px",
                                border      : "1px solid var(--border-md)",
                                background  : "var(--bg-card)",
                                height      : "32px",
                                fontSize    : "12px",
                            }}
                            placeholder={["Start", "End"]}
                        />
                    )}
                    <select className="date-chip" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
                        style={{
                            outline   : "none",
                            cursor    : "pointer",
                            fontFamily: "inherit",
                            height    : "32px",
                        }}
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                        <option value="year">This year</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div className="date-chip">{totalStatusOrders.toLocaleString()} total</div>
                </div>
            </div>

            <div className="donut-wrap">
                <canvas ref={canvasRef} style={{ flexShrink: 0 }} />
                <div id="statusLegend" style={{ flex: 1, maxHeight: "220px", overflowY: "auto", paddingRight: "5px" }}>
                    {statuses.map((s, index) => {
                        const count = Number(s.orders_count || 0);
                        const percentage = totalStatusOrders > 0 ? ((count / totalStatusOrders) * 100).toFixed(1) : "0.0";
                        return (
                            <div className="legend-item" key={s.id ?? index}>
                                <span className="legend-dot" style={{ background: s.bg_color || "#d1d5db" }}/>

                                <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
                                    {s.name}
                                </span>

                                <span className="legend-val" style={{ fontSize: "12px", fontWeight: "600" }}>
                                    {count} ({percentage}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
