import { BarChart } from "lucide-react";


export default function SummaryCard({dashboardSummary}) {

  const sectionsData = {
    "Total Orders": [
      { title: "Today", value: dashboardSummary?.today_orders || 0},
      { title: "This Month", value: dashboardSummary?.this_month_orders || 0 },
      { title: "This Year", value: dashboardSummary?.this_month_orders || 0 },
      { title: "All Time", value: dashboardSummary?.order_report?.order_count || 0 },
    ],
    "Total Sales": [
      { title: "Today", value: dashboardSummary?.today_sales || 0 },
      { title: "This Month", value: dashboardSummary?.this_month_sales || 0 },
      { title: "This Year", value: dashboardSummary?.this_year_sales || 0 },
      { title: "All Time", value: dashboardSummary?.all_time_sales || 0 },
    ],
    "Total Upsell": [
      { title: "Today", value: dashboardSummary?.upsell_today || 0 },
      { title: "This Month", value: dashboardSummary?.upsell_this_month || 0 },
      { title: "This Year", value: dashboardSummary?.upsell_this_year || 0 },
      { title: "All Time", value: dashboardSummary?.upsell_all_time || 0 },
    ],

    "Total Downsell": [
      { title: "Today", value: dashboardSummary?.downsell_today || 0 },
      { title: "This Month", value: dashboardSummary?.downsell_this_month || 0 },
      { title: "This Year", value: dashboardSummary?.downsell_this_year || 0 },
      { title: "All Time", value: dashboardSummary?.all_time_amount || 0 },
    ],

    "Total Cross Sell": [
      { title: "Today", value: "0" },
      { title: "This Month", value: "0" },
      { title: "This Year", value: "0" },
      { title: "All Time", value: "0" },
    ],

    "Total Followup Sell": [
      { title: "Today", value: dashboardSummary?.followup_today || 0 },
      { title: "This Month", value: dashboardSummary?.followup_this_month || 0 },
      { title: "This Year", value: dashboardSummary?.followup_this_year || 0 },
      { title: "All Time", value: dashboardSummary?.followup_all_time || 0 },
    ],

    "Total Cancel": [
      { title: "Today", value: dashboardSummary?.today_cancel || 0 },
      { title: "This Month", value: dashboardSummary?.this_month_cancel || 0 },
      { title: "This Year", value: dashboardSummary?.this_year_cancel || 0 },
      { title: "All Time", value: dashboardSummary?.all_time_cancel || 0 },
    ],

    "Total Return": [
      { title: "Today", value: dashboardSummary?.today_returned || 0 },
      { title: "This Month", value: dashboardSummary?.this_month_returned || 0 },
      { title: "This Year", value: dashboardSummary?.this_year_returned || 0 },
      { title: "All Time", value: dashboardSummary?.all_time_returned || 0 },
    ],
  };

  return (
    <div className="summary-card-top">
      <div className="row g-3">
        {Object.entries(sectionsData).map(([section, cards], idx) => (
          <div key={idx} className="col-12 col-lg-6 col-xl-6 col-xxl-4">
            <div className="main-card">
              <div className="top-title">
                <h5>{section}</h5>
              </div>
              <div className="row g-3">
                {cards.map((card, i) => (
                  <div key={i} className="col-lg-6 col-md-6 col-12">
                    <div className="summary-card">
                      <div className="summary-icon">
                        <BarChart size={20} />
                      </div>
                      <div>
                        <h3>
                          {card.value}
                          {section !== "Total Orders" && section !== "Cancel Orders" && section !== "Return Orders" && " Tk"}
                        </h3>
                        <h5>{card.title}</h5>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
