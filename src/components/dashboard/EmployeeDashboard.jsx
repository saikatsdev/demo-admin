import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Space, Tag } from "antd";
import {UserOutlined,MailOutlined,PhoneOutlined,DollarCircleOutlined,LoginOutlined,CheckCircleFilled,WarningFilled,SafetyCertificateOutlined,EditOutlined,CustomerServiceOutlined,IdcardOutlined,ClockCircleOutlined,ShoppingCartOutlined,CheckCircleOutlined,HourglassOutlined,InboxOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import { getDatas } from "../../api/common/common";
import "./css/EmployeeDashboard.css";
import TimeTrackingBanner from "./TimeTrackingBanner";

const countOrdersByStatus = (statuses = [], matchers = []) => {
    if (!Array.isArray(statuses) || !matchers.length) return 0;

    return statuses
        .filter((status) =>
            matchers.some((matcher) => {
                if (typeof matcher === "number") return Number(status.id) === matcher;
                return String(status.name || "")
                    .toLowerCase()
                    .includes(String(matcher).toLowerCase());
            })
        )
        .reduce((sum, status) => sum + Number(status.orders_count || 0), 0);
};

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const data = user ?? {};
    const navigate = useNavigate();

    const { id, username, phone_number, email, status, salary, is_verified, image, login_at, logout_at, roles } = data;

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

    const formatMoney = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return "—";
        return n.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

    const roleBadges = useMemo(() => {
        if (!Array.isArray(roles) || roles.length === 0) return [];
        return roles.map((r, idx) => {
            const name =
                r?.name ||
                r?.title ||
                r?.role ||
                r?.slug ||
                (typeof r === "string" ? r : `Role ${idx + 1}`);
            return { key: r?.id ?? `${idx}`, name: String(name).toUpperCase() };
        });
    }, [roles]);

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

    const accountStats = 
    [
        {
            key: "salary",
            title: "Current Salary",
            value: `${formatMoney(salary || 0)} BDT`,
            hint: "Assigned monthly base",
            icon: <DollarCircleOutlined />,
            tone: "success",
        },
        {
            key: "status",
            title: "Account Status",
            value: statusLabel,
            hint: `Currently ${safeStatus}`,
            icon: safeStatus === "active" ? <CheckCircleFilled /> : <WarningFilled />,
            tone: safeStatus === "active" ? "success" : "danger",
        },
        {
            key: "login",
            title: "Last Login",
            value: login_at ? dayjs(login_at).format("HH:mm A") : "N/A",
            hint: login_at ? dayjs(login_at).format("MMM DD, YYYY") : "No recent activity",
            icon: <LoginOutlined />,
            tone: "brand",
        },
        {
            key: "id",
            title: "Employee ID",
            value: id || "—",
            hint: "Unique identification",
            icon: <IdcardOutlined />,
            tone: "indigo",
        },
    ];

    const quickLinks = [
        {
            key: "security",
            label: "Security",
            icon: <SafetyCertificateOutlined />,
            tone: "success",
        },
        {
            key: "documents",
            label: "Documents",
            icon: <IdcardOutlined />,
            tone: "brand",
        },
        {
            key: "attendance",
            label: "Attendance",
            icon: <ClockCircleOutlined />,
            tone: "warning",
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
                </div>
            </header>

            <TimeTrackingBanner userId={id} initialCheckIn={login_at} initialCheckOut={logout_at} />

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

            <section className="ed-section">
                <div className="ed-section__head">
                    <div>
                        <h2 className="ed-section__title">Account Summary</h2>
                        <p className="ed-section__subtitle">Salary, status, and profile identifiers</p>
                    </div>
                </div>

                <div className="ed-stats">
                    {accountStats.map((stat) => (
                        <article key={stat.key} className={`ed-stat-card ed-stat-card--${stat.tone}`}>
                            <div className="ed-stat-card__top">
                                <span className="ed-stat-card__title">{stat.title}</span>
                                <span className="ed-stat-card__icon">{stat.icon}</span>
                            </div>
                            <p className="ed-stat-card__value">{stat.value}</p>
                            <p className="ed-stat-card__hint">{stat.hint}</p>
                        </article>
                    ))}
                </div>
            </section>

            <div className="ed-layout">
                <aside className="ed-card ed-card--profile">
                    <div className="ed-profile-panel">
                        <Avatar
                            size={112}
                            src={image}
                            icon={<UserOutlined />}
                            className="ed-profile-panel__avatar"
                        />

                        <h3 className="ed-profile-panel__name">{username || "Unnamed User"}</h3>
                        <p className="ed-profile-panel__role">
                            {roleBadges.length > 0 ? roleBadges[0].name : "General Employee"}
                        </p>

                        <div className="ed-profile-panel__rows">
                            <div className="ed-profile-panel__row">
                                <span className="ed-profile-panel__label">
                                    <PhoneOutlined /> Phone
                                </span>
                                <span className="ed-profile-panel__value">{valueOrDash(phone_number)}</span>
                            </div>
                            <div className="ed-profile-panel__row">
                                <span className="ed-profile-panel__label">
                                    <MailOutlined /> Email
                                </span>
                                <span className="ed-profile-panel__value ed-profile-panel__value--wrap">
                                    {email || "N/A"}
                                </span>
                            </div>
                        </div>

                        <div className="ed-profile-panel__roles">
                            <p className="ed-profile-panel__roles-title">Assigned Roles</p>
                            <Space wrap size={[6, 6]}>
                                {roleBadges.map((role) => (
                                    <Tag color="blue" key={role.key}>
                                        {role.name}
                                    </Tag>
                                ))}
                                {roleBadges.length === 0 && (
                                    <span className="ed-empty-inline">No roles assigned</span>
                                )}
                            </Space>
                        </div>

                        <div className="ed-profile-panel__actions">
                            <Button
                                type="primary"
                                block
                                icon={<EditOutlined />}
                                className="ed-btn ed-btn--primary"
                                onClick={() => navigate("/system/user-management")}
                            >
                                Update Profile
                            </Button>
                            <Button block icon={<CustomerServiceOutlined />} className="ed-btn ed-btn--ghost">
                                Contact Support
                            </Button>
                        </div>
                    </div>
                </aside>

                <section className="ed-card ed-card--details">
                    <div className="ed-cardHeader">
                        <div>
                            <h3 className="ed-cardTitle">Detailed Information</h3>
                            <p className="ed-cardSub">Personal, payroll, and session details</p>
                        </div>
                        <Button type="link" icon={<ClockCircleOutlined />} className="ed-link-btn">
                            View Log History
                        </Button>
                    </div>

                    <div className="ed-details">
                        <div className="ed-detail">
                            <div className="ed-detail__label">Employee Name</div>
                            <div className="ed-detail__value ed-detail__value--cap">{username || "—"}</div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Employee ID</div>
                            <div className="ed-detail__value">{id || "—"}</div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Official Email</div>
                            <div className="ed-detail__value">{email || "—"}</div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Contact Number</div>
                            <div className="ed-detail__value">{phone_number || "—"}</div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Monthly Salary</div>
                            <div className="ed-detail__value">{formatMoney(salary)} BDT</div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Account Verification</div>
                            <div className="ed-detail__value">
                                {is_verified ? (
                                    <Tag color="success">Verified</Tag>
                                ) : (
                                    <Tag color="error">Unverified</Tag>
                                )}
                            </div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Last Login Time</div>
                            <div className="ed-detail__value">
                                {login_at ? dayjs(login_at).format("MMMM DD, YYYY hh:mm A") : "—"}
                            </div>
                        </div>
                        <div className="ed-detail">
                            <div className="ed-detail__label">Last Logout Time</div>
                            <div className="ed-detail__value">
                                {logout_at ? dayjs(logout_at).format("MMMM DD, YYYY hh:mm A") : "—"}
                            </div>
                        </div>
                        <div className="ed-detail ed-detail--full">
                            <div className="ed-detail__label">System Roles</div>
                            <div className="ed-detail__value">
                                <Space wrap>
                                    {roleBadges.map((role) => (
                                        <Tag key={role.key} color="processing">
                                            {role.name}
                                        </Tag>
                                    ))}
                                    {roleBadges.length === 0 && <span className="is-muted">—</span>}
                                </Space>
                            </div>
                        </div>
                    </div>

                    <div className="ed-quick-links">
                        <h4 className="ed-quick-links__title">Quick Links & Resources</h4>
                        <div className="ed-quick-links__grid">
                            {quickLinks.map((link) => (
                                <article key={link.key} className={`ed-quick-link ed-quick-link--${link.tone}`}>
                                    <span className="ed-quick-link__icon">{link.icon}</span>
                                    <span className="ed-quick-link__label">{link.label}</span>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
