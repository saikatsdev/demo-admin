import {ArrowLeftOutlined,SearchOutlined,MailOutlined,CalendarOutlined,EditOutlined,ShoppingOutlined,WalletOutlined,CheckCircleOutlined,TeamOutlined,UserAddOutlined,WhatsAppOutlined,CopyOutlined,DownloadOutlined,CloseCircleOutlined,CrownOutlined,StarOutlined,SafetyCertificateOutlined} from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Space, Table, Tooltip, Typography, Card, Modal,Select,DatePicker,Row, InputNumber,Form, Col, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";
import "./Customer.css";

const { Title, Text } = Typography;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 150, 200, 250, 300];
const CUSTOMER_TYPE_IDS = {
    new: 1,
    regular: 2,
    vip: 3,
    elite: 4,
};

const getRowKey = (record) => record.phone_number || record.last_order_id || record.customer_name;

export default function Customer() {
    // Hook
    useTitle("All Customer");

    // Variable
    const navigate = useNavigate();

    const [users, setUsers]                             = useState(null);
    const [loading, setLoading]                         = useState(false);
    const [customerSummary, setCustomerSummary]         = useState(null);
    const [currentPage, setCurrentPage]                 = useState(1);
    const [pageSize, setPageSize]                       = useState(25);
    const [searchTerm, setSearchTerm]                   = useState("");
    const [activeFilter, setActiveFilter]               = useState("all");
    const [selectedRowKeys, setSelectedRowKeys]         = useState([]);
    const [csvExportLoading, setCsvExportLoading]       = useState(false);
    const [profileOpen, setProfileOpen]                 = useState(false);
    const [profileSaving, setProfileSaving]             = useState(false);
    const [loadingProfilePhone, setLoadingProfilePhone] = useState(null);
    const [profileError, setProfileError]               = useState("");
    const [jobTypes, setJobTypes]                       = useState([]);
    const [jobsLoading, setJobsLoading]                 = useState(false);
    const [jobsError, setJobsError]                     = useState("");
    const [profileForm]                                 = Form.useForm();
    const [messageApi, contextHolder]                   = message.useMessage();

    const loadJobTypes = async () => {
        setJobsLoading(true);
        setJobsError("");
        try {
            const res = await getDatas("/admin/job-types");
            if (res?.success && Array.isArray(res.result)) {
                setJobTypes(res.result);
            } else {
                setJobsError(res?.message || res?.msg || "Unable to load job types.");
            }
        } catch {
            setJobsError("Unable to load job types. Please try again.");
        } finally {
            setJobsLoading(false);
        }
    };

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
        {
            title: "Action",
            key: "action",
            width: 180,
            render: (_, record) => (
                <Button type="primary" icon={<EditOutlined />} onClick={() => openProfile(record)} loading={loadingProfilePhone !== null && loadingProfilePhone === record.phone_number} disabled={!record.phone_number || profileSaving || loadingProfilePhone !== null}>
                    Update Profile
                </Button>
            ),
        },
    ];

    const openProfile = async (record) => {
        if (loadingProfilePhone !== null || profileSaving) return;
        setLoadingProfilePhone(record.phone_number);
        try {
            const res = await getDatas("/admin/customer-profiles", { phone_number: record.phone_number });
            const found = res?.result && typeof res.result === "object" && !Array.isArray(res.result);
            if (!res?.success || (!found && res.result !== "Profile not found")) {
                messageApi.error(res?.message || res?.msg || "Unable to load customer profile. Please try again.");
                return;
            }

            const profile = found ? res.result : {};
            const parseDate = (value) => value && dayjs(value).isValid() ? dayjs(value) : null;
            profileForm.resetFields();
            profileForm.setFieldsValue({
                phone_number    : profile.phone_number ?? record.phone_number,
                customer_name   : profile.customer_name ?? record.customer_name ?? "",
                job_type_id     : profile.job_type_id == null ? undefined : Number(profile.job_type_id),
                home_address    : profile.home_address ?? "",
                office_address  : profile.office_address ?? "",
                date_of_birth   : parseDate(profile.date_of_birth),
                anniversary_date: parseDate(profile.anniversary_date),
                marital_status  : profile.marital_status ?? "unmarried",
                children_count  : Number(profile.children_count ?? 0),
            });
            setProfileError("");
            setProfileOpen(true);
            loadJobTypes();
        } catch {
            messageApi.error("Unable to load customer profile. Please try again.");
        } finally {
            setLoadingProfilePhone(null);
        }
    };

    const saveProfile = async (values) => {
        if (profileSaving || jobsLoading || jobsError) return;
        setProfileSaving(true);
        setProfileError("");
        try {
            const payload = {
                phone_number    : values.phone_number,
                job_type_id     : values.job_type_id ?? null,
                customer_name   : values.customer_name.trim(),
                home_address    : values.home_address?.trim() || null,
                office_address  : values.office_address?.trim() || null,
                date_of_birth   : values.date_of_birth?.format("YYYY-MM-DD") || null,
                anniversary_date: values.anniversary_date?.format("YYYY-MM-DD") || null,
                marital_status  : values.marital_status ?? "unmarried",
                children_count  : values.children_count ?? 0,
            };
            const res = await postData("/admin/customer-profiles", payload);
            if (!res?.success) {
                setProfileError(res?.message || res?.msg || "Unable to save customer profile. Please try again.");
                if (res?.errors) {
                    profileForm.setFields(Object.keys(payload).filter((name) => res.errors[name]).map((name) => ({
                        name,
                        errors: Array.isArray(res.errors[name]) ? res.errors[name] : [String(res.errors[name])],
                    })));
                }
                return;
            }
            messageApi.success(res.msg || "Customer profile updated.");
            setProfileOpen(false);
            await fetchUsers(currentPage, pageSize, searchTerm, activeFilter);
        } catch {
            setProfileError("Unable to save customer profile. Please try again.");
        } finally {
            setProfileSaving(false);
        }
    };

    const styles = {
        container: {
            padding: '24px',
            background: '#f8fafc',
            minHeight: '100vh',
        },
        header: {
            background: '#ffffff',
            padding: '24px 30px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            border: '1px solid #e2e8f0',
        },
        statCard: {
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            transition: 'transform 0.2s ease',
            cursor: 'pointer',
        },
        tableCard: {
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
        },
        searchInput: {
            borderRadius: '10px',
            width: 320,
            height: '42px',
        },
        actionBtn: {
            borderRadius: '8px',
            height: '35px',
            fontWeight: 500,
        },
        addBtn: {
            borderRadius: '8px',
            height: '35px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            fontWeight: 600,
        }
    };

    const fetchUsers = async (page = 1, limit = pageSize, search = searchTerm, type = activeFilter) => {
        try {
            setLoading(true);

            let url = `/admin/customers?page=${page}&paginate_size=${limit}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const customerTypeId = CUSTOMER_TYPE_IDS[type];
            if (customerTypeId) {
                url += `&customer_type_id=${customerTypeId}`;
            } else if (type && type !== "all") {
                url += `&type=${encodeURIComponent(type)}`;
            }

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
    }, [searchTerm, activeFilter]);

    const overviewCards = [
        { key: "all", label: "Total Customers", value: customerSummary?.total_customers, meta: "Audience Base", icon: <TeamOutlined />, color: "#1c558b", soft: "#e8f1f8" },
        { key: "current_month", label: "Current Month", value: customerSummary?.current_month_customers, meta: "Joined This Month", icon: <CalendarOutlined />, color: "#0891b2", soft: "#ecfeff", filterable: false },
        { key: "active", label: "Active Customers", value: customerSummary?.active_customers, meta: "Currently Active", icon: <CheckCircleOutlined />, color: "#059669", soft: "#ecfdf5" },
    ];

    const customerTypeCards = [
        { key: "new", label: "New Customers", value: customerSummary?.new_customers, meta: "New Segment", icon: <UserAddOutlined />, color: "#2563eb", soft: "#eff6ff" },
        { key: "regular", label: "Regular Customers", value: customerSummary?.regular_customers, meta: "Returning Buyers", icon: <SafetyCertificateOutlined />, color: "#7c3aed", soft: "#f5f3ff" },
        { key: "vip", label: "VIP Customers", value: customerSummary?.vip_customers, meta: "High Value", icon: <StarOutlined />, color: "#d97706", soft: "#fffbeb" },
        { key: "elite", label: "Elite Customers", value: customerSummary?.elite_customers, meta: "Top Tier", icon: <CrownOutlined />, color: "#db2777", soft: "#fdf2f8" },
    ];

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
                    <Button style={styles.actionBtn} onClick={() => navigate('/job/type')}>
                        Job Type
                    </Button>

                    <Button className="cus-btn-export" type="primary" icon={<DownloadOutlined />} loading={csvExportLoading} onClick={handleExportCSV}>
                        Export CSV
                        {selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ""}
                    </Button>
                    <Button className="cus-btn-ghost" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </div>
            </div>

            <div className="cus-stats cus-stats--overview">
                {overviewCards.map((card) => {
                    const isFilterable = card.filterable !== false;
                    const isActive = isFilterable && activeFilter === card.key;

                    return (
                        <Card
                            key={card.key}
                            className={`cus-stat-card ${isActive ? "is-active" : ""} ${isFilterable ? "is-filterable" : ""}`}
                            onClick={isFilterable ? () => setActiveFilter(card.key) : undefined}
                            styles={{ body: { padding: "12px 14px" } }}
                            style={{ "--stat-color": card.color, "--stat-soft": card.soft }}
                        >
                            <div className="cus-stat-topline">
                                <div className="cus-stat-label">{card.label}</div>
                                <span className="cus-stat-icon">{card.icon}</span>
                            </div>
                            <Title level={2} className="cus-stat-value">
                                {(Number(card.value) || 0).toLocaleString()}
                            </Title>
                            <span className="cus-stat-meta">{card.meta}</span>
                        </Card>
                    );
                })}
            </div>

            <div className="cus-type-section">
                <div className="cus-section-heading">
                    <div>
                        <h2>Customer Types</h2>
                        <p>Customers grouped by their purchase profile</p>
                    </div>
                </div>
                <div className="cus-stats cus-stats--types">
                    {customerTypeCards.map((card) => {
                        const isActive = activeFilter === card.key;

                        return (
                            <Card
                                key={card.key}
                                className={`cus-stat-card is-filterable ${isActive ? "is-active" : ""}`}
                                onClick={() => setActiveFilter(card.key)}
                                styles={{ body: { padding: "12px 14px" } }}
                                style={{ "--stat-color": card.color, "--stat-soft": card.soft }}
                            >
                                <div className="cus-stat-topline">
                                    <div className="cus-stat-label">{card.label}</div>
                                    <span className="cus-stat-icon">{card.icon}</span>
                                </div>
                                <Title level={2} className="cus-stat-value">
                                    {(Number(card.value) || 0).toLocaleString()}
                                </Title>
                                <span className="cus-stat-meta">{card.meta}</span>
                            </Card>
                        );
                    })}
                </div>
            </div>

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

            <Modal
                title="Update Customer Profile"
                open={profileOpen}
                forceRender
                width={720}
                onOk={() => profileForm.submit()}
                onCancel={() => { if (!profileSaving) setProfileOpen(false); }}
                okText="Save Profile"
                confirmLoading={profileSaving}
                okButtonProps={{ disabled: jobsLoading || Boolean(jobsError) }}
                cancelButtonProps={{ disabled: profileSaving }}
                closable={!profileSaving}
                maskClosable={!profileSaving}
                keyboard={!profileSaving}
            >
                {profileError && <Alert type="error" showIcon message={profileError} style={{ marginBottom: 16 }} />}
                {jobsError && <Alert type="error" showIcon message={jobsError} action={<Button size="small" onClick={loadJobTypes}>Retry</Button>} style={{ marginBottom: 16 }} />}
                <Form form={profileForm} layout="vertical" onFinish={saveProfile} disabled={profileSaving}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="phone_number" label="Phone Number" rules={[{ required: true, message: "Phone number is required." }]}>
                                <AntInput readOnly />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="customer_name" label="Customer Name" rules={[{ required: true, whitespace: true, message: "Please enter the customer name." }]}>
                                <AntInput placeholder="Enter customer name" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="job_type_id" label="Job Type">
                                <Select allowClear showSearch optionFilterProp="label" placeholder="Select job type" loading={jobsLoading} disabled={jobsLoading || profileSaving} options={jobTypes.map((job) => ({ value: Number(job.id), label: job.name }))} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="marital_status" label="Marital Status" rules={[{ required: true, message: "Please select marital status." }]}>
                                <Select options={[{ value: "unmarried", label: "Unmarried" }, { value: "married", label: "Married" }, { value: "divorced", label: "Divorced" }, { value: "widows", label: "Widows" }]} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="date_of_birth" label="Date of Birth">
                                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="anniversary_date" label="Anniversary Date">
                                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="children_count" label="Children Count" rules={[{ type: "integer", min: 0, message: "Enter a whole number of 0 or more." }]}>
                                <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="home_address" label="Home Address">
                                <AntInput.TextArea rows={2} placeholder="Enter home address" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="office_address" label="Office Address">
                                <AntInput.TextArea rows={2} placeholder="Enter office address" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

        </div>
    );
}
