import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  LineChart,
  Line,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Select, Modal, DatePicker } from "antd";
import { getDatas } from "../../api/common/common";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ChartGrid() {
  const [filter, setFilter] = useState("today");
  const [filter2, setFilter2] = useState("monthly");
  const [incompleteChartData, setIncompleteChartData] = useState([]);
  const [orderByStatus, setOrderByStatus] = useState([]);

  // Custom date modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customRange, setCustomRange] = useState(null); 

  const fetchChartData = async (start = null, end = null) => {
    let url = "/admin/dashboard";
    if (start && end) {
      url += `?start=${start}&end=${end}`;
    }

    const res = await getDatas(url);
    if (res && res.success) {
      const formattedIncomplete = res.result.incompleteOrders.map((item) => ({
        name: item.date,
        orders: item.orders,
      }));

      const raw = res.result.orderByStatus;

      const statusMap = {
        Pending: ["Pending", "On Hold", "Stock Pending"],
        Completed: ["Approved", "Ready To Picked", "On Way", "Delivered"],
        Cancelled: ["Canceled"],
        Returned: ["Returned"],
      };

      const chartRow = {
        status: "All",
        Pending: 0,
        Completed: 0,
        Cancelled: 0,
        Returned: 0,
      };

      raw.forEach((item) => {
        const statusName = item.name;
        const count = item.total_orders;

        if (statusMap.Pending.includes(statusName)) chartRow.Pending += count;
        if (statusMap.Completed.includes(statusName)) chartRow.Completed += count;
        if (statusMap.Cancelled.includes(statusName)) chartRow.Cancelled += count;
        if (statusMap.Returned.includes(statusName)) chartRow.Returned += count;
      });

      setOrderByStatus([chartRow]);
      setIncompleteChartData(formattedIncomplete);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  // Open modal when user picks "custom"
  const handleAnySelectChange = (value) => {
    setFilter(value);
    if (value === "custom") {
      setIsCustomModalOpen(true);
    }
  };

  // Apply custom range: format and fetch
  const applyCustomRange = () => {
    if (!customRange || customRange.length < 2) {
      setIsCustomModalOpen(false);
      return;
    }

    const start = customRange[0].format ? customRange[0].format("YYYY-MM-DD") : customRange[0];
    const end = customRange[1].format ? customRange[1].format("YYYY-MM-DD") : customRange[1];

    setFilter("custom");
    fetchChartData(start, end);
    setIsCustomModalOpen(false);
  };

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

  // Category Data (Bar Chart)
  const categoryData = [
    { status: "Mon", Pending: 12, Completed: 30, Cancelled: 5, Returned: 2 },
    { status: "Tue", Pending: 15, Completed: 25, Cancelled: 3, Returned: 1 },
    { status: "Wed", Pending: 10, Completed: 28, Cancelled: 4, Returned: 3 },
    { status: "Thu", Pending: 20, Completed: 22, Cancelled: 2, Returned: 2 },
    { status: "Fri", Pending: 18, Completed: 35, Cancelled: 6, Returned: 0 },
    { status: "Sat", Pending: 5, Completed: 40, Cancelled: 1, Returned: 1 },
    { status: "Sun", Pending: 8, Completed: 32, Cancelled: 0, Returned: 2 },
  ];

  // Orders by Source
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

  // Chart5 – Order Status Percentage Data
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

  const filteredStatusData = OrderStatusData[filter2] || [];
  const totalStatusOrders = filteredStatusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <div className="row">
        <div className="col-lg-6 col-12">
          <div className="chart2">
            <div className="chart-container">
              <div className="chart-box">
                <div className="chart-header">
                  <h4>Total Incomplete Orders</h4>
                  <Select
                    value={filter}
                    size="small"
                    style={{ width: 140 }}
                    popupMatchSelectWidth={false}
                    onChange={handleAnySelectChange}
                  >
                    <Option value="today">Today</Option>
                    <Option value="Yesterday">Yesterday</Option>
                    <Option value="Last7days">Last 7 days</Option>
                    <Option value="Last30days">Last 30 days</Option>
                    <Option value="Month">This Month</Option>
                    <Option value="year">This Year</Option>
                    <Option value="custom">Custom</Option>
                  </Select>
                </div>

                <ResponsiveContainer width="100%" height={315}>
                  <LineChart data={incompleteChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#1C558B"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-12">
          <div className="chart3 summary-card-top">
            <div className="chart-header">
              <h3 className="chart-title">Orders by Status</h3>
              <Select
                defaultValue="today"
                size="small"
                style={{ width: 110 }}
                popupMatchSelectWidth={false}
                onChange={handleAnySelectChange}
              >
                <Option value="today">Today</Option>
                <Option value="Yesterday">Yesterday</Option>
                <Option value="Last7days">Last 7 days</Option>
                <Option value="Last30days">Last 30 days</Option>
                <Option value="Month">This Month</Option>
                <Option value="year">This Year</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={orderByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pending" fill={COLORS[0]} />
                <Bar dataKey="Completed" fill={COLORS[1]} />
                <Bar dataKey="Cancelled" fill={COLORS[7]} />
                <Bar dataKey="Returned" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-lg-6 col-12">
          <div className="chart4">
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Orders by Source</h3>
                <Select
                  defaultValue="today"
                  size="small"
                  style={{ width: 110 }}
                  popupMatchSelectWidth={false}
                  onChange={handleAnySelectChange}
                >
                  <Option value="today">Today</Option>
                  <Option value="Yesterday">Yesterday</Option>
                  <Option value="Last7days">Last 7 days</Option>
                  <Option value="Last30days">Last 30 days</Option>
                  <Option value="Month">This Month</Option>
                  <Option value="year">This Year</Option>
                  <Option value="custom">Custom</Option>
                </Select>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  layout="vertical"
                  data={OrdersBySourceChart}
                  margin={{ top: 20, right: 20, left: 60, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="0" stroke="transparent" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} Orders`]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {OrdersBySourceChart.map((entry, index) => (
                    <Bar
                      key={index}
                      dataKey="orders"
                      barSize={22}
                      radius={[5, 5, 5, 5]}
                      fill={`url(#gradient${index})`}
                    />
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
              <Select
                defaultValue="today"
                size="small"
                style={{ width: 110 }}
                popupMatchSelectWidth={false}
                onChange={handleAnySelectChange}
              >
                <Option value="today">Today</Option>
                <Option value="Yesterday">Yesterday</Option>
                <Option value="Last7days">Last 7 days</Option>
                <Option value="Last30days">Last 30 days</Option>
                <Option value="Month">This Month</Option>
                <Option value="year">This Year</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={filteredStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
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

      {/* Custom Date Modal */}
      <Modal
        title="Select Custom Date Range"
        open={isCustomModalOpen}
        onOk={applyCustomRange}
        onCancel={() => setIsCustomModalOpen(false)}
        okText="Apply"
        cancelText="Cancel"
      >
        <RangePicker
          style={{ width: "100%" }}
          value={customRange}
          onChange={(values) => setCustomRange(values)}
          allowClear
        />
      </Modal>
    </>
  );
}
