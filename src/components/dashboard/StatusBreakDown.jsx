import { useEffect, useRef } from "react";

export default function StatusBreakDown({statuses}) {

    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx                 = canvas.getContext("2d");
            const dpr                 = window.devicePixelRatio || 1;
            canvas.width        = 140 * dpr;
            canvas.height       = 140 * dpr;
            canvas.style.width  = "140px";
            canvas.style.height = "140px";
            
            ctx.scale(dpr, dpr);

            ctx.clearRect(0, 0, 140, 140);
            const total = statuses.reduce((sum, s) => sum + s.orders_count, 0);
            
            let startAngle = -Math.PI / 2;
            const cx = 70;
            const cy = 70;
            const outerRadius = 65;
            const innerRadius = 38;

            statuses.forEach((s) => {
                const sliceAngle = (s.orders_count / total) * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(cx, cy, outerRadius, startAngle, startAngle + sliceAngle);
                ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = s.bg_color;
                ctx.fill();
                startAngle += sliceAngle;
            });
        }
    }, [statuses]);

    const totalStatusOrders = statuses.reduce((sum, s) => sum + s.orders_count, 0);

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    Order status breakdown
                </div>

                <div className="date-chip">
                    {totalStatusOrders.toLocaleString()} total
                </div>
            </div>

            <div className="donut-wrap">
                <canvas ref={canvasRef} style={{ flexShrink: 0 }}></canvas>
                <div style={{ flex: 1, maxHeight: "220px", overflowY: "auto", paddingRight: "5px" }}>
                    {statuses.map((s, index) => {
                        const percentage = ((s.orders_count / totalStatusOrders) * 100).toFixed(1);
                        return (
                            <div className="legend-item" key={index}>
                                <span className="legend-dot" style={{ background: s.bg_color }}></span>
                                <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{s.name}</span>
                                <span className="legend-val" style={{ fontSize: "12px", fontWeight: "600" }}>{s.orders_count} ({percentage}%)</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}
