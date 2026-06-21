export default function SummaryCard({dashboardSummary}) {


    return (
        <>
            <div className="sec-label">Key metrics</div>
            <div className="g3">
                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#1E50A2" }}></span>Total orders
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#1E50A2" }}>
                                {dashboardSummary?.today_orders || 0}
                            </div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">{dashboardSummary?.this_month_orders || 0}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#5B8DD9" }}>{dashboardSummary?.this_year_orders || 0}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">{dashboardSummary?.all_time_orders || 0}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>

                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#1E7A4A" }}></span>Total sales
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#1E7A4A" }}>৳{dashboardSummary?.today_sales || 0}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{dashboardSummary?.this_month_sales || 0}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#4CAF82" }}>৳{dashboardSummary?.this_year_sales || 0}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{dashboardSummary?.all_time_sales || 0}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>

                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#B91C1C" }}></span>Total incomplete
                    </div>
                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#B91C1C" }}>৳{dashboardSummary?.incomplete_today || 0}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{dashboardSummary?.incomplete_this_month || 0}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#E05A5A" }}>৳{dashboardSummary?.incomplete_this_year || 0}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{dashboardSummary?.incomplete_all_time || 0}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
