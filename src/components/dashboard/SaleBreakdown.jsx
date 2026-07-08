const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 0,
    });
};

export default function SaleBreakdown({dashboardSummary}) {
    return (
        <>
            <div className="sec-label" style={{ marginTop: "0.25rem" }}>
                Sales breakdown
            </div>

            <div className="g3" style={{ marginBottom: 0 }}>
                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#5B21B6" }}></span>Total upsell
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#5B21B6" }}>৳{formatNumber(dashboardSummary?.crosssell_today || 0)}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.crosssell_this_month || 0)}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#8B5CF6" }}>৳{formatNumber(dashboardSummary?.crosssell_this_year || 0)}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.crosssell_all_time || 0)}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>

                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#0D7377" }}></span>Total downsell
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#0D7377" }}>৳{formatNumber(dashboardSummary?.downsell_today || 0)}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.downsell_this_month || 0)}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#14B8A6" }}>৳{formatNumber(dashboardSummary?.downsell_this_year || 0)}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.downsell_all_time || 0)}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>

                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#D4537E" }}></span>Total cross sell
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#D4537E" }}>৳0</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳0</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#F472B6" }}>৳0</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳0</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="g3" style={{ marginTop: "10px", marginBottom: "1.25rem" }}>
                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#EA580C" }}></span>Total followup sell
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#EA580C" }}>৳{formatNumber(dashboardSummary?.followup_today || 0)}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.followup_this_month || 0)}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#FB923C" }}>৳{formatNumber(dashboardSummary?.followup_this_year || 0)}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.followup_all_time || 0)}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>

                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#92400E" }}></span>Total return
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#92400E" }}>৳{formatNumber(dashboardSummary?.today_returned || 0)}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.this_month_returned || 0)}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#D97706" }}>৳{formatNumber(dashboardSummary?.this_year_returned || 0)}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.all_time_returned || 0)}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>

                <div className="wh-card">
                    <div className="wh-title">
                        <span className="wh-dot" style={{ background: "#B91C1C" }}></span>Total cancel
                    </div>

                    <div className="wh-grid">
                        <div className="wh-cell">
                            <div className="wh-val" style={{ color: "#B91C1C" }}>৳{formatNumber(dashboardSummary?.today_cancel || 0)}</div>
                            <div className="wh-lbl">Today</div>
                        </div>

                        <div className="wh-cell wh-br">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.this_month_cancel || 0)}</div>
                            <div className="wh-lbl">This month</div>
                        </div>

                        <div className="wh-cell wh-bt">
                            <div className="wh-val" style={{ color: "#E05A5A" }}>৳{formatNumber(dashboardSummary?.this_year_cancel || 0)}</div>
                            <div className="wh-lbl">This year</div>
                        </div>

                        <div className="wh-cell wh-br wh-bt">
                            <div className="wh-val wh-dark">৳{formatNumber(dashboardSummary?.all_time_cancel || 0)}</div>
                            <div className="wh-lbl">All time</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
