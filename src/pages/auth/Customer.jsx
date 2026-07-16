import {ArrowLeftOutlined,SearchOutlined,MailOutlined,CalendarOutlined,ShoppingOutlined,WalletOutlined,CheckCircleOutlined,TeamOutlined,UserAddOutlined,WhatsAppOutlined,CopyOutlined,DownloadOutlined,CloseCircleOutlined} from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Space, Table, Tooltip, Typography, Card, Row, Col, message } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";
import "./Customer.css";

const { Title, Text } = Typography;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 150, 200, 250, 300];

const getRowKey = (record) =>
    record.phone_number || record.last_order_id || record.customer_name;

export default function Customer() {
    useTitle("All Customer");

    const [users, setUsers] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customerSummary, setCustomerSummary] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [csvExportLoading, setCsvExportLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const copyPhone = (phone) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        messageApi.success("Phone number copied");
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;
        const clean = String(phone).replace(/\D/g, "");
        const num = clean.startsWith("880") ? clean : `880${clean.replace(/^0/, "")}`;
        window.open(`https://wa.me/${num}`, "_blank");
    };

    const handleExportCSV = () => {
        try {
            setCsvExportLoading(true);
            const rows = users?.data || [];
            const exportRows =
                selectedRowKeys.length > 0
                    ? rows.filter((r) => selectedRowKeys.includes(getRowKey(r)))
                    : rows;

            if (!exportRows.length) {
                messageApi.warning("No customers to export");
                return;
            }

            const headers = [
                "Customer Name",
                "Email",
                "Phone",
                "Total Orders",
                "Total Spent",
                "Status",
                "Last Order Date",
                "Last Invoice",
            ];

            const escapeCsv = (val) => {
                const str = String(val ?? "");
                if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
                return str;
            };

            const lines = [
                headers.join(","),
                ...exportRows.map((r) =>
                    [
                        r.customer_name,
                        r.email,
                        r.phone_number,
                        r.total_orders || 0,
                        r.total_spent || 0,
                        r.status || "active",
                        r.last_order_date
                            ? dayjs(r.last_order_date).format("YYYY-MM-DD HH:mm")
                            : "",
                        r.last_invoice_number || "",
                    ]
                        .map(escapeCsv)
                        .join(",")
                ),
            ];

            const blob = new Blob([lines.join("\n")], {
                type: "text/csv;charset=utf-8;",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `customers_${dayjs().format("YYYYMMDD_HHmm")}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
            messageApi.success(
                selectedRowKeys.length > 0
                    ? `${exportRows.length} selected customer(s) exported`
                    : "Customers exported successfully"
            );
        } catch (error) {
            console.log(error);
            messageApi.error("Failed to export customers");
        } finally {
            setCsvExportLoading(false);
        }
    };

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 64,
            align: "center",
            render: (_, __, index) => (
                <span style={{ fontWeight: 600, color: "#64748b" }}>
                    {(currentPage - 1) * (users?.per_page || pageSize) + index + 1}
                </span>
            ),
        },
        {
            title: "Customer",
            dataIndex: "customer_name",
            key: "customer",
            width: 260,
            render: (text, record) => (
                <div className="cus-customer">
                    <span className="cus-customer__name">{text || "—"}</span>
                    <span className="cus-customer__email">
                        <MailOutlined />
                        {record.email || "No email"}
                    </span>
                </div>
            ),
        },
        {
            title: "Contact",
            dataIndex: "phone_number",
            key: "phone_number",
            width: 200,
            render: (phone) =>
                phone ? (
                    <div className="cus-phone">
                        <span className="cus-phone__number">{phone}</span>
                        <span className="cus-phone__actions">
                            <Tooltip title="WhatsApp">
                                <Button
                                    type="text"
                                    className="cus-phone-btn cus-phone-btn--wa"
                                    icon={<WhatsAppOutlined />}
                                    onClick={() => openWhatsApp(phone)}
                                />
                            </Tooltip>
                            <Tooltip title="Copy phone">
                                <Button
                                    type="text"
                                    className="cus-phone-btn cus-phone-btn--copy"
                                    icon={<CopyOutlined />}
                                    onClick={() => copyPhone(phone)}
                                />
                            </Tooltip>
                        </span>
                    </div>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Financials",
            key: "financials",
            width: 180,
            render: (record) => (
                <div className="cus-finance">
                    <div className="cus-finance__row">
                        <ShoppingOutlined style={{ color: "#1c558b" }} />
                        Orders: <strong>{record.total_orders || 0}</strong>
                    </div>
                    <div className="cus-finance__row cus-finance__spent">
                        <WalletOutlined />
                        Spent: <strong>৳{Number(record.total_spent || 0).toLocaleString()}</strong>
                    </div>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const isActive = (status || "active") === "active";
                return (
                    <span className={`cus-status ${isActive ? "cus-status--active" : "cus-status--inactive"}`}>
                        ● {status || "active"}
                    </span>
                );
            },
        },
        {
            title: "Recent Activity",
            key: "last_order",
            width: 220,
            render: (record) => {
                const date = record.last_order_date
                    ? dayjs(record.last_order_date).format("DD MMM YYYY")
                    : null;
                const time = record.last_order_date
                    ? dayjs(record.last_order_date).format("hh:mm A")
                    : null;
                const invoice = record.last_invoice_number;

                if (!date) return <Text type="secondary">No orders yet</Text>;

                return (
                    <div className="cus-activity">
                        <div className="cus-activity__date">
                            <CalendarOutlined style={{ color: "#94a3b8" }} />
                            {date}
                            <span className="cus-activity__time">{time}</span>
                        </div>
                        {invoice && (
                            <span className="cus-activity__invoice">#{invoice}</span>
                        )}
                    </div>
                );
            },
        },
    ];

    const fetchUsers = async (page = 1, limit = pageSize, search = searchTerm, type = activeFilter) => {
        try {
            setLoading(true);

            let url = `/admin/customers?page=${page}&paginate_size=${limit}`;
            if (search) url += `&search=${search}`;
            if (type && type !== "all") url += `&type=${type}`;

            const res = await getDatas(url);

            if (res && res?.success) {
                setUsers(res?.result?.customers);
                setCustomerSummary(res?.result?.summary || null);
                setCurrentPage(res?.result?.customers?.current_page || 1);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setSelectedRowKeys([]);
            fetchUsers(1, pageSize, searchTerm, activeFilter);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!searchTerm) {
            setSelectedRowKeys([]);
            fetchUsers(1, pageSize, "", activeFilter);
        }
    }, [activeFilter]);

    return (
        <div className="cus-page">
            {contextHolder}

            <div className="cus-pagehead">
                <div className="cus-page-title-block">
                    <span className="cus-page-title-icon">
                        <TeamOutlined />
                    </span>
                    <div>
                        <h1>Customer Directory</h1>
                        <p>Browse, filter and export your customer base</p>
                        <Breadcrumb
                            style={{ marginTop: 8 }}
                            items={[
                                { title: <Link to="/dashboard">Dashboard</Link> },
                                { title: "All Customers" },
                            ]}
                        />
                    </div>
                </div>
                <div className="cus-pagehead__actions">
                    <Button
                        className="cus-btn-export"
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={csvExportLoading}
                        onClick={handleExportCSV}
                    >
                        Export CSV
                        {selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ""}
                    </Button>
                    <Button
                        className="cus-btn-ghost"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} className="cus-stats">
                <Col xs={24} md={8}>
                    <Card
                        className={`cus-stat-card ${activeFilter === "all" ? "is-active" : ""}`}
                        onClick={() => setActiveFilter("all")}
                        styles={{ body: { padding: "18px 20px" } }}
                    >
                        <div className="cus-stat-label">Total Customers</div>
                        <Title level={2} className="cus-stat-value">
                            {Number(customerSummary?.total_customers) || 0}
                        </Title>
                        <span className="cus-stat-meta">
                            <TeamOutlined /> Audience Base
                        </span>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card
                        className={`cus-stat-card ${activeFilter === "new" ? "is-active" : ""}`}
                        onClick={() => setActiveFilter("new")}
                        styles={{ body: { padding: "18px 20px" } }}
                    >
                        <div className="cus-stat-label">New Customers</div>
                        <Title level={2} className="cus-stat-value" style={{ color: activeFilter === "new" ? undefined : "#1c558b" }}>
                            {Number(customerSummary?.current_month_customers) || 0}
                        </Title>
                        <span className="cus-stat-meta">
                            <UserAddOutlined /> Recent Orders
                        </span>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card
                        className={`cus-stat-card ${activeFilter === "active" ? "is-active-green" : ""}`}
                        onClick={() => setActiveFilter("active")}
                        styles={{ body: { padding: "18px 20px" } }}
                    >
                        <div className="cus-stat-label">Active Customers</div>
                        <Title level={2} className="cus-stat-value" style={{ color: activeFilter === "active" ? undefined : "#059669" }}>
                            {Number(customerSummary?.active_customers) || 0}
                        </Title>
                        <span className="cus-stat-meta" style={{ color: activeFilter === "active" ? undefined : "#059669" }}>
                            <CheckCircleOutlined /> Active
                        </span>
                    </Card>
                </Col>
            </Row>

            <div className="cus-toolbar">
                <h3 className="cus-toolbar__title">Customer Base</h3>
                <AntInput
                    placeholder="Search by name, email or phone..."
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    allowClear
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {selectedRowKeys.length > 0 && (
                <div className="cus-selection">
                    <Space wrap>
                        <span className="cus-selection__count">{selectedRowKeys.length} selected</span>
                        <span className="cus-selection__text">customers selected</span>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            loading={csvExportLoading}
                            onClick={handleExportCSV}
                        >
                            Export Selected
                        </Button>
                    </Space>
                    <Button
                        type="link"
                        icon={<CloseCircleOutlined />}
                        onClick={() => setSelectedRowKeys([])}
                        style={{ padding: 0, color: "#1c558b" }}
                    >
                        Clear selection
                    </Button>
                </div>
            )}

            <div className="cus-table-card">
                <Table
                    rowKey={getRowKey}
                    loading={loading}
                    columns={columns}
                    dataSource={users?.data || []}
                    scroll={{ x: 1100, y: "calc(100vh - 340px)" }}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                        columnWidth: 48,
                    }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: users?.total || 0,
                        onChange: (page, size) => {
                            setSelectedRowKeys([]);
                            setPageSize(size);
                            fetchUsers(page, size);
                        },
                        showSizeChanger: true,
                        pageSizeOptions: PAGE_SIZE_OPTIONS,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}–${range[1]} of ${total} customers`,
                    }}
                />
            </div>
        </div>
    );
}
