import { useCallback, useEffect, useState } from "react";
import { Avatar, Empty, Select, Skeleton, Tooltip } from "antd";
import {
    CrownFilled,
    ReloadOutlined,
    ShoppingOutlined,
    TrophyFilled,
    UserOutlined,
} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import "./css/PerformanceLeaderboards.css";

const PERIOD_OPTIONS = [
    { value: "month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
];

const money = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
});

const Rank = ({ rank }) => {
    if (rank === 1) return <span className="pl-rank pl-rank--gold"><CrownFilled /></span>;
    if (rank === 2) return <span className="pl-rank pl-rank--silver">2</span>;
    if (rank === 3) return <span className="pl-rank pl-rank--bronze">3</span>;
    return <span className="pl-rank">{rank}</span>;
};

const Person = ({ performer }) => (
    <div className="pl-person">
        <Avatar size={38} src={performer.image || undefined} icon={<UserOutlined />} />
        <div className="pl-person__copy">
            <strong title={performer.name}>{performer.name || "Employee"}</strong>
            <span>{performer.employee_code || "Team member"}</span>
        </div>
    </div>
);

const MyPosition = ({ position, type }) => {
    if (!position) return null;

    return (
        <div className="pl-my-position">
            <span>Your position</span>
            <strong>#{position.rank}</strong>
            <small>
                {type === "sales"
                    ? `${Number(position.delivered_orders || 0).toLocaleString()} delivered orders`
                    : `${Number(position.approved_packages || 0).toLocaleString()} packages completed`}
            </small>
        </div>
    );
};

const LeaderboardCard = ({ type, performers, myPosition }) => {
    const isSales = type === "sales";

    return (
        <article className={`pl-card pl-card--${type}`}>
            <div className="pl-card__head">
                <div className="pl-card__icon">
                    {isSales ? <TrophyFilled /> : <ShoppingOutlined />}
                </div>
                <div>
                    <h3>{isSales ? "Sales Top 10" : "Packaging Top 10"}</h3>
                    <p>{isSales ? "Ranked by delivered sales" : "Ranked by approved packages"}</p>
                </div>
            </div>

            {performers.length ? (
                <div className="pl-list">
                    {performers.map((performer) => {
                        const isMe = Number(myPosition?.employee_profile_id) === Number(performer.employee_profile_id);

                        return (
                            <div
                                className={`pl-row${isMe ? " pl-row--me" : ""}`}
                                key={performer.employee_profile_id}
                            >
                                <Rank rank={performer.rank} />
                                <Person performer={performer} />
                                <div className="pl-metrics">
                                    <strong>
                                        {isSales
                                            ? money.format(Number(performer.delivered_sales || 0))
                                            : Number(performer.approved_packages || 0).toLocaleString()}
                                    </strong>
                                    <span>
                                        {isSales
                                            ? `${Number(performer.delivered_orders || 0).toLocaleString()} orders`
                                            : `${Number(performer.accuracy_rate || 0).toFixed(1)}% accuracy`}
                                    </span>
                                </div>
                                {isMe && <span className="pl-you">You</span>}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No performance data for this period" />
            )}

            <MyPosition position={myPosition} type={type} />
        </article>
    );
};

export default function PerformanceLeaderboards({
    endpoint = "/admin/employee-self/performance/leaderboards",
    showPersonalPosition = true,
}) {
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLeaderboards = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getDatas(endpoint, { period });

            if (!response?.success) {
                throw new Error(response?.message || response?.msg || "Unable to load performance rankings");
            }

            setData(response.result || null);
        } catch (requestError) {
            setError(requestError?.response?.data?.message || requestError?.message || "Unable to load performance rankings");
        } finally {
            setLoading(false);
        }
    }, [endpoint, period]);

    useEffect(() => {
        loadLeaderboards();
    }, [loadLeaderboards]);

    return (
        <section className="ed-section pl-section">
            <div className="ed-section__head pl-section__head">
                <div>
                    <p className="pl-eyebrow">TEAM PERFORMANCE</p>
                    <h2 className="ed-section__title">Top Performers</h2>
                    <p className="ed-section__subtitle">
                        See the leading sales and packaging performers for the selected period.
                    </p>
                </div>
                <div className="pl-actions">
                    <Select
                        aria-label="Performance period"
                        options={PERIOD_OPTIONS}
                        value={period}
                        onChange={setPeriod}
                        className="pl-period"
                    />
                    <Tooltip title="Refresh rankings">
                        <button className="pl-refresh" type="button" onClick={loadLeaderboards} disabled={loading}>
                            <ReloadOutlined spin={loading} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {error ? (
                <div className="pl-error">
                    <span>{error}</span>
                    <button type="button" onClick={loadLeaderboards}>Try again</button>
                </div>
            ) : loading ? (
                <div className="pl-grid">
                    {[1, 2].map((item) => (
                        <div className="pl-card pl-card--loading" key={item}>
                            <Skeleton active avatar paragraph={{ rows: 6 }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="pl-grid">
                    <LeaderboardCard
                        type="sales"
                        performers={data?.sales?.top_performers || []}
                        myPosition={showPersonalPosition ? data?.sales?.my_position : null}
                    />
                    <LeaderboardCard
                        type="packaging"
                        performers={data?.packaging?.top_performers || []}
                        myPosition={showPersonalPosition ? data?.packaging?.my_position : null}
                    />
                </div>
            )}
        </section>
    );
}
