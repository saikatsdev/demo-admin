import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { UserOutlined, ShoppingCartOutlined, CheckCircleOutlined, HourglassOutlined, InboxOutlined, ArrowRightOutlined, CalendarOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import "./css/EmployeeDashboard.css";
import AttendanceWorkspace from "./AttendanceWorkspace";
import IncentiveWorkspace from "./IncentiveWorkspace";
import PerformanceLeaderboards from "./PerformanceLeaderboards";

const countOrdersByStatus = (statuses = [], matchers = []) => {
    if (!Array.isArray(statuses) || !matchers.length) return 0;

    return statuses
        .filter((status) =>
            matchers.some((matcher) => {
                if (typeof matcher === "number") return Number(status.id) === matcher;
                return String(status.name || "").toLowerCase().includes(String(matcher).toLowerCase());
            })
        )
        .reduce((sum, status) => sum + Number(status.orders_count || 0), 0);
};

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const data     = user ?? {};
    const navigate = useNavigate();

    const { id, username, status, is_verified } = data;

    const [employeeMetrics, setEmployeeMetrics] = useState(null);

    useEffect(() => {
        if (!id) return;

        let mounted = true;

        const loadEmployeeMetrics = async () => {
            try {
                const res = await getDatas("/admin/team/dashboard");

                if (!mounted || !res?.success) return;

                const me = (res.result?.employees || []).find(
                    (employee) => String(employee.id) === String(id)
                );

                setEmployeeMetrics(me || null);
            } catch (error) {
                console.error(error);
            }
        };

        loadEmployeeMetrics();

        return () => {
            mounted = false;
        };
    }, [id]);

    const safeStatus = useMemo(() => {
        const s = String(status || "unknown").toLowerCase();
        if (["active", "inactive", "suspended"].includes(s)) return s;
        return "unknown";
    }, [status]);

    const statusLabel = useMemo(() => {
        if (safeStatus === "active") return "ACTIVE";
        if (safeStatus === "inactive") return "INACTIVE";
        if (safeStatus === "suspended") return "SUSPENDED";
        return status ? String(status).toUpperCase() : "UNKNOWN";
    }, [safeStatus, status]);

    const orderOverview = useMemo(() => {
        const assigned = employeeMetrics?.assigned_metrics || data?.assigned_metrics || {};
        const prepared = employeeMetrics?.prepared_metrics || data?.prepared_metrics || {};
        const statuses = assigned.order_statuses || [];

        const totalComplete = countOrdersByStatus(statuses, ["deliver", "complete", 7]);
        const pendingFromStatus = countOrdersByStatus(statuses, ["pending", 1]);

        return {
            totalOrders: Number(assigned.total_orders || 0),
            totalComplete: totalComplete,
            pendingOrders:
                pendingFromStatus || Number(assigned.unprepared_orders || 0),
            totalPrepared:
                Number(assigned.prepared_orders || 0) ||
                Number(prepared.total_orders || 0),
        };
    }, [employeeMetrics, data?.assigned_metrics, data?.prepared_metrics]);

    const orderStatCards = 
    [
        {
            key: "total",
            label: "Total Orders",
            hint: "Assigned to you",
            value: orderOverview.totalOrders,
            icon: <ShoppingCartOutlined />,
            tone: "brand",
        },
        {
            key: "complete",
            label: "Total Complete",
            hint: "Delivered / completed",
            value: orderOverview.totalComplete,
            icon: <CheckCircleOutlined />,
            tone: "success",
        },
        {
            key: "pending",
            label: "Pending Orders",
            hint: "Awaiting action",
            value: orderOverview.pendingOrders,
            icon: <HourglassOutlined />,
            tone: "warning",
        },
        {
            key: "prepared",
            label: "Total Prepared",
            hint: "Marked as prepared",
            value: orderOverview.totalPrepared,
            icon: <InboxOutlined />,
            tone: "indigo",
        },
    ];

    return (
        <div className="ed-dashboard">
            <header className="ed-hero">
                <div className="ed-hero__content">
                    <p className="ed-hero__eyebrow">Employee workspace</p>
                    <h1 className="ed-hero__title">Welcome back, {username ?? "Employee"}</h1>
                    <p className="ed-hero__subtitle">
                        Track your orders, account details, and daily activity from one place.
                    </p>
                </div>

                <div className="ed-hero__badges">
                    {is_verified ? (
                        <span className="ed-verifiedBadge">
                            <span className="ed-verifiedBadge__icon">✓</span>
                            Verified Account
                        </span>
                    ) : (
                        <span className="ed-unverifiedBadge">Unverified Account</span>
                    )}
                    <span className={`ed-pill ed-pill--status-${safeStatus}`}>{statusLabel}</span>
                    <Button
                        className="ed-view-profile-btn"
                        icon={<CalendarOutlined />}
                        onClick={() => navigate("/hrm/my-leaves")}
                    >
                        My Leave
                    </Button>
                    <Button
                        className="ed-view-profile-btn"
                        icon={<UserOutlined />}
                        onClick={() => navigate("/system/user-management")}
                    >
                        View Full Profile <ArrowRightOutlined />
                    </Button>
                </div>
            </header>

            <AttendanceWorkspace />

            <IncentiveWorkspace />

            <PerformanceLeaderboards />

            <section className="ed-section">
                <div className="ed-section__head">
                    <div>
                        <h2 className="ed-section__title">Order Overview</h2>
                        <p className="ed-section__subtitle">Your assigned order performance at a glance</p>
                    </div>
                </div>

                <div className="ed-order-stats">
                    {orderStatCards.map((card) => (
                        <article key={card.key} className={`ed-order-stat ed-order-stat--${card.tone}`}>
                            <div className="ed-order-stat__icon">{card.icon}</div>
                            <div className="ed-order-stat__body">
                                <p className="ed-order-stat__label">{card.label}</p>
                                <p className="ed-order-stat__value">{card.value.toLocaleString()}</p>
                                <p className="ed-order-stat__hint">{card.hint}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

        </div>
    );
}
