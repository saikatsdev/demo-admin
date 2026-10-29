import { Breadcrumb } from "antd";
import {BarChartOutlined,SafetyCertificateOutlined,TeamOutlined,TrophyOutlined} from "@ant-design/icons";
import { Link } from "react-router-dom";
import PerformanceLeaderboards from "../../../../components/dashboard/PerformanceLeaderboards";
import useTitle from "../../../../hooks/useTitle";
import "./Performance.css";

const highlights = [
    {
        icon: <TrophyOutlined />,
        title: "Sales Ranking",
        text: "Delivered revenue and completed orders",
        tone: "amber",
    },
    {
        icon: <SafetyCertificateOutlined />,
        title: "Packaging Ranking",
        text: "Approved packages and entry accuracy",
        tone: "green",
    },
    {
        icon: <BarChartOutlined />,
        title: "Flexible Periods",
        text: "Monthly, quarterly and yearly views",
        tone: "blue",
    },
];

export default function Performance() {
    useTitle("Employee Performance");

    return (
        <div className="performance-page">
            <header className="performance-page__hero">
                <div className="performance-page__title">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "HRM" },
                            { title: "Performance" },
                        ]}
                    />
                    <div className="performance-page__heading">
                        <span className="performance-page__heading-icon"><TeamOutlined /></span>
                        <div>
                            <h1>Employee Performance</h1>
                            <p>Compare the highest-performing sales and packaging team members.</p>
                        </div>
                    </div>
                </div>

                <div className="performance-page__highlights">
                    {highlights.map((item) => (
                        <article className={`performance-highlight performance-highlight--${item.tone}`} key={item.title}>
                            <span>{item.icon}</span>
                            <div>
                                <strong>{item.title}</strong>
                                <small>{item.text}</small>
                            </div>
                        </article>
                    ))}
                </div>
            </header>

            <PerformanceLeaderboards
                endpoint="/admin/performance/leaderboards"
                showPersonalPosition={false}
            />
        </div>
    );
}
