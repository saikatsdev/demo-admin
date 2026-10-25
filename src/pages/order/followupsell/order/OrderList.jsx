import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../../api/common/common";
import useTitle from "../../../../hooks/useTitle";
import { Breadcrumb, Button, Col, DatePicker, Input, message, Modal, Row, Select, Table, Tooltip } from "antd";
import {ArrowLeftOutlined,CloseCircleOutlined,CopyOutlined,CrownOutlined,EnvironmentOutlined,EyeOutlined,SearchOutlined,StarOutlined,UserAddOutlined,UserSwitchOutlined,ShoppingOutlined,TeamOutlined,WhatsAppOutlined} from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "./OrderList.css";

const formatMoney = (val) => {
    if (val === null || val === undefined || val === "") return "৳0";
    const num = parseFloat(String(val).replace(/,/g, ""));
    if (Number.isNaN(num)) return `৳${val}`;
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const parseAmount = (val) => {
    const num = parseFloat(String(val ?? 0).replace(/,/g, ""));
    return Number.isNaN(num) ? 0 : num;
};

export default function OrderList() {
    useTitle("UnAssign Order List");

    const [orders, setOrders] = useState([]);
    const [customerTypeCounts, setCustomerTypeCounts] = useState({
        new: 0,
        regular: 0,
        vip: 0,
        premiumVip: 0,
    });
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 50,
        total: 0,
    });
    const [selectedRowKeys, setSelectedRowKeys]   = useState([]);
    const [searchKey, setSearchKey]               = useState("");
    const [dateRange, setDateRange]               = useState(null);
    const [customerTypes, setCustomerTypes]       = useState([]);
    const [customerTypesLoading, setCustomerTypesLoading] = useState(false);
    const [customerTypeId, setCustomerTypeId]     = useState(null);
    const [assignModalOpen, setAssignModalOpen]   = useState(false);
    const [employees, setEmployees]               = useState([]);
    const [employeeLoading, setEmployeeLoading]   = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [followupDate, setFollowupDate]         = useState(null);
    const [assignLoading, setAssignLoading]       = useState(false);
    const [previewOpen, setPreviewOpen]           = useState(false);
    const [previewOrder, setPreviewOrder]         = useState(null);

    const openPreview = (record) => {
        setPreviewOrder(record);
        setPreviewOpen(true);
    };

    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewOrder(null);
    };

    const getWhatsAppNumber = (phoneNumber) => {
        const digits = String(phoneNumber || "").replace(/\D/g, "");
        if (digits.startsWith("880")) return digits;
        if (digits.startsWith("0")) return `88${digits}`;
        if (digits.startsWith("1")) return `880${digits}`;
        return digits;
    };

    const openWhatsApp = (phoneNumber) => {
        const whatsappNumber = getWhatsAppNumber(phoneNumber);
        if (!whatsappNumber) return;
        window.open(`https://wa.me/${whatsappNumber}`, "_blank", "noopener,noreferrer");
    };

    const copyPhoneNumber = async (phoneNumber) => {
        if (!phoneNumber) return;

        try {
            const value = String(phoneNumber);
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = value;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.select();
                const copied = document.execCommand("copy");
                document.body.removeChild(textArea);
                if (!copied) throw new Error("Copy command failed");
            }
            messageApi.success("Phone number copied");
        } catch {
            messageApi.error("Could not copy phone number");
        }
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 64,
            fixed: "left",
            align: "center",
            render: (_, __, index) => (
                <span style={{ fontWeight: 600, color: "#64748b" }}>
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
        },
        {
            title: "Invoice",
            key: "invoice",
            width: 150,
            fixed: "left",
            render: (_, record) => (
                <div className="ual-invoice">
                    <span className="ual-invoice__no">{record.invoice_number || "—"}</span>
                    <span className="ual-invoice__date">
                        {record.created_at ? dayjs(record.created_at).format("DD MMM YYYY, hh:mm A") : "—"}
                    </span>
                </div>
            ),
        },
        {
            title: "Customer",
            key: "customer",
            width: 240,
            render: (_, record) => {
                const customerType = record.customer_type?.name || record.customer_type;
                const customerTypeClass = String(customerType || "")
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-");

                return (
                    <div className="ual-customer">
                        <span className="ual-customer__name">{record.customer_name || "—"}</span>
                        <div className="ual-customer__phone-row">
                            <span className="ual-customer__phone">{record.phone_number || "—"}</span>
                            {record.phone_number && (
                                <span className="ual-customer__phone-actions">
                                    <Tooltip title="Open in WhatsApp">
                                        <Button
                                            type="text"
                                            size="small"
                                            className="ual-phone-action ual-phone-action--whatsapp"
                                            icon={<WhatsAppOutlined />}
                                            aria-label={`Open WhatsApp for ${record.phone_number}`}
                                            onClick={() => openWhatsApp(record.phone_number)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Copy phone number">
                                        <Button
                                            type="text"
                                            size="small"
                                            className="ual-phone-action ual-phone-action--copy"
                                            icon={<CopyOutlined />}
                                            aria-label={`Copy phone number ${record.phone_number}`}
                                            onClick={() => copyPhoneNumber(record.phone_number)}
                                        />
                                    </Tooltip>
                                </span>
                            )}
                        </div>
                        {customerType && (
                            <span className={`ual-customer-type ual-customer-type--${customerTypeClass}`}>
                                <span className="ual-customer-type__dot" aria-hidden />
                                {customerType}
                            </span>
                        )}
                        <div className="ual-customer__meta">
                            {record.district?.name && (
                                <span className="ual-customer__district">
                                    <EnvironmentOutlined style={{ fontSize: 10 }} />
                                    {record.district.name}
                                </span>
                            )}
                            {record.address_details && (
                                <Tooltip title={record.address_details}>
                                    <span className="ual-customer__address">{record.address_details}</span>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Pricing",
            key: "pricing",
            width: 200,
            render: (_, record) => {
                const discount = parseAmount(record.discount) + parseAmount(record.special_discount);
                return (
                    <div className="ual-finance">
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">MRP</span>
                            <span className="ual-finance__value ual-finance__value--muted">
                                {formatMoney(record.mrp)}
                            </span>
                        </div>
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">Sell</span>
                            <span className="ual-finance__value">{formatMoney(record.sell_price)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="ual-finance__row">
                                <span className="ual-finance__label">Discount</span>
                                <span className="ual-finance__value ual-finance__value--discount">
                                    −{formatMoney(discount)}
                                </span>
                            </div>
                        )}
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">Delivery</span>
                            <span className="ual-finance__value">{formatMoney(record.delivery_charge)}</span>
                        </div>
                        <div className="ual-finance__divider" />
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">Net</span>
                            <span className="ual-finance__value ual-finance__value--main">
                                {formatMoney(record.net_order_price)}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Payment",
            key: "payment",
            width: 180,
            render: (_, record) => {
                const payable = parseAmount(record.payable_price);
                const advance = parseAmount(record.advance_payment);
                const due     = record.due !== undefined && record.due !== null ? parseAmount(record.due) : Math.max(payable - advance, 0);

                return (
                    <div className="ual-finance">
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">Payable</span>
                            <span className="ual-finance__value ual-finance__value--main">
                                {formatMoney(record.payable_price)}
                            </span>
                        </div>
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">Advance</span>
                            <span className="ual-finance__value">{formatMoney(record.advance_payment)}</span>
                        </div>
                        <div className="ual-finance__row">
                            <span className="ual-finance__label">Due</span>
                            <span className={`ual-due ${due > 0 ? "ual-due--owed" : "ual-due--clear"}`}>
                                {formatMoney(due)}
                            </span>
                        </div>
                        <div className="ual-finance__row" style={{ marginTop: 4 }}>
                            <span
                                className={`ual-paid ${
                                    record.paid_status === "paid" ? "ual-paid--paid" : "ual-paid--unpaid"
                                }`}
                            >
                                {record.paid_status || "—"}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Status",
            key: "status",
            width: 130,
            render: (_, record) => {
                const status = record.current_status;
                if (!status?.name) {
                    return <span className="ual-logistics__empty">—</span>;
                }
                return (
                    <span
                        className="ual-status"
                        style={{
                            backgroundColor: status.bg_color || "#1c558b",
                            color: status.text_color || "#fff",
                        }}
                    >
                        {status.name}
                    </span>
                );
            },
        },
        {
            title: "Logistics",
            key: "logistics",
            width: 180,
            render: (_, record) => (
                <div className="ual-logistics">
                    <span className="ual-logistics__courier">
                        {record.courier?.name || "No courier"}
                    </span>
                    <span className="ual-logistics__gateway">
                        {record.payment_gateway?.name || "—"}
                    </span>
                    {record.tracking_code || record.consignment_id ? (
                        <Tooltip title={record.consignment_id ? `Consignment: ${record.consignment_id}` : undefined}>
                            <span className="ual-logistics__track">
                                {record.tracking_code || record.consignment_id}
                            </span>
                        </Tooltip>
                    ) : (
                        <span className="ual-logistics__empty">No tracking</span>
                    )}
                </div>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: 90,
            fixed: "right",
            align: "center",
            render: (_, record) => (
                <Tooltip title="View order">
                    <Button type="text" className="ual-view-btn" icon={<EyeOutlined />} onClick={() => openPreview(record)}/>
                </Tooltip>
            ),
        },
    ];

    const getOrders = async (page = 1, pageSize = 10, filters = {}) => {
        try {
            setLoading(true);

            const params = {
                page,
                paginate_size: pageSize,
            };

            if (filters.search_key) params.search_key = filters.search_key;
            if (filters.from_date) params.from_date = filters.from_date;
            if (filters.to_date) params.to_date = filters.to_date;
            if (filters.customer_type_id) params.customer_type_id = filters.customer_type_id;

            const res = await getDatas("/admin/followup/list", params);

            if (res && res?.success) {
                const result = res?.result || {};
                const meta = result.meta || {};
                const orderData = result.data || [];
                const groupedCounts = result.customer_type_counts || result.customer_types_count || result.customer_type_count;
                const counts = { new: 0, regular: 0, vip: 0, premiumVip: 0 };

                if (
                    result.new_customers !== undefined ||
                    result.regular_customers !== undefined ||
                    result.vip_customers !== undefined ||
                    result.premium_vip_customers !== undefined
                ) {
                    counts.new = Number(result.new_customers || 0);
                    counts.regular = Number(result.regular_customers || 0);
                    counts.vip = Number(result.vip_customers || 0);
                    counts.premiumVip = Number(result.premium_vip_customers || 0);
                } else if (Array.isArray(groupedCounts)) {
                    groupedCounts.forEach((item) => {
                        const type = String(item?.name || item?.customer_type || "").trim().toLowerCase();
                        const countKey = type === "premium vip" ? "premiumVip" : type;
                        if (Object.prototype.hasOwnProperty.call(counts, countKey)) {
                            counts[countKey] = Number(item?.count ?? item?.orders_count ?? 0);
                        }
                    });
                } else if (groupedCounts && typeof groupedCounts === "object") {
                    counts.new = Number(groupedCounts.new ?? groupedCounts.new_count ?? 0);
                    counts.regular = Number(groupedCounts.regular ?? groupedCounts.regular_count ?? 0);
                    counts.vip = Number(groupedCounts.vip ?? groupedCounts.vip_count ?? 0);
                    counts.premiumVip = Number(
                        groupedCounts.premiumVip ??
                        groupedCounts.premium_vip ??
                        groupedCounts.premium_vip_count ??
                        0
                    );
                } else {
                    orderData.forEach((order) => {
                        const type = String(order?.customer_type?.name || order?.customer_type || "").trim().toLowerCase();
                        const countKey = type === "premium vip" ? "premiumVip" : type;
                        if (Object.prototype.hasOwnProperty.call(counts, countKey)) counts[countKey] += 1;
                    });
                }

                setOrders(orderData);
                setCustomerTypeCounts(counts);
                setPagination({
                    current: meta.current_page || page,
                    pageSize: meta.per_page || pageSize,
                    total: meta.total ?? result.orders_count ?? orderData.length,
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const buildFilters = () => {
        const filters = {};
        if (searchKey.trim()) filters.search_key = searchKey.trim();
        if (dateRange && dateRange[0]) filters.from_date = dateRange[0].format("YYYY-MM-DD");
        if (dateRange && dateRange[1]) filters.to_date = dateRange[1].format("YYYY-MM-DD");
        if (customerTypeId) filters.customer_type_id = customerTypeId;
        return filters;
    };

    const handleSearch = () => {
        getOrders(1, pagination.pageSize, buildFilters());
    };

    const handleReset = () => {
        setSearchKey("");
        setDateRange(null);
        setCustomerTypeId(null);
        getOrders(1, pagination.pageSize, {});
    };

    const handleTableChange = (pag) => {
        setSelectedRowKeys([]);
        getOrders(pag.current, pag.pageSize, buildFilters());
    };

    const fetchEmployees = async () => {
        try {
            setEmployeeLoading(true);
            const res = await getDatas("/admin/users/list", {user_category_id:3});
            if (res?.success) {
                setEmployees(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setEmployeeLoading(false);
        }
    };

    const fetchCustomerTypes = async () => {
        try {
            setCustomerTypesLoading(true);
            const res = await getDatas("/admin/customer-types/list");
            if (res?.success) {
                setCustomerTypes(Array.isArray(res.result) ? res.result : res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setCustomerTypesLoading(false);
        }
    };

    const handleAssignOpen = () => {
        setSelectedEmployee(null);
        setFollowupDate(null);
        setAssignModalOpen(true);
        fetchEmployees();
    };

    const handleAssignSubmit = async () => {
        if (!selectedEmployee) {
            message.warning("Please select an employee");
            return;
        }

        if (!followupDate) {
            message.warning("Please select a follow-up date");
            return;
        }

        try {
            setAssignLoading(true);

            const res = await postData("/admin/followup", {
                order_ids    : selectedRowKeys,
                user_id      : selectedEmployee,
                followup_date: followupDate.format("YYYY-MM-DD"),
            });

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: "Orders assigned successfully",
                });
                setSelectedRowKeys([]);
                setAssignModalOpen(false);
                getOrders(pagination.current, pagination.pageSize);
            } else {
                messageApi.open({
                    type: "error",
                    content: "Failed to assign orders",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setAssignLoading(false);
        }
    };

    useEffect(() => {
        getOrders(pagination.current, pagination.pageSize);
        fetchCustomerTypes();
    }, []);

    return (
        <div className="ual-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Unassigned Order List</h1>
                    <p className="subtitle">Review and assign follow-up orders to employees</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Follow-up Orders" },
                        ]}
                    />
                </div>
            </div>

            <div className="ual-stats">
                <article className="ual-stat-card">
                    <div className="ual-stat-card__icon" aria-hidden>
                        <ShoppingOutlined />
                    </div>
                    <div className="ual-stat-card__content">
                        <p className="ual-stat-card__label">Total Orders</p>
                        <p className="ual-stat-card__value">
                            {loading ? "—" : Number(pagination.total || 0).toLocaleString()}
                        </p>
                        <p className="ual-stat-card__meta">
                            Unassigned follow-up orders matching your filters
                        </p>
                    </div>
                </article>
                <article className="ual-stat-card ual-stat-card--new">
                    <div className="ual-stat-card__icon" aria-hidden><UserAddOutlined /></div>
                    <div className="ual-stat-card__content">
                        <p className="ual-stat-card__label">New Customers</p>
                        <p className="ual-stat-card__value">{loading ? "—" : customerTypeCounts.new.toLocaleString()}</p>
                        <p className="ual-stat-card__meta">Orders from new customers</p>
                    </div>
                </article>
                <article className="ual-stat-card ual-stat-card--regular">
                    <div className="ual-stat-card__icon" aria-hidden><TeamOutlined /></div>
                    <div className="ual-stat-card__content">
                        <p className="ual-stat-card__label">Regular Customers</p>
                        <p className="ual-stat-card__value">{loading ? "—" : customerTypeCounts.regular.toLocaleString()}</p>
                        <p className="ual-stat-card__meta">Orders from regular customers</p>
                    </div>
                </article>
                <article className="ual-stat-card ual-stat-card--vip">
                    <div className="ual-stat-card__icon" aria-hidden><CrownOutlined /></div>
                    <div className="ual-stat-card__content">
                        <p className="ual-stat-card__label">VIP Customers</p>
                        <p className="ual-stat-card__value">{loading ? "—" : customerTypeCounts.vip.toLocaleString()}</p>
                        <p className="ual-stat-card__meta">Orders from VIP customers</p>
                    </div>
                </article>
                <article className="ual-stat-card ual-stat-card--premium-vip">
                    <div className="ual-stat-card__icon" aria-hidden><StarOutlined /></div>
                    <div className="ual-stat-card__content">
                        <p className="ual-stat-card__label">Premium VIP</p>
                        <p className="ual-stat-card__value">{loading ? "—" : customerTypeCounts.premiumVip.toLocaleString()}</p>
                        <p className="ual-stat-card__meta">Orders from premium VIP customers</p>
                    </div>
                </article>
            </div>

            <div className="ual-toolbar">
                <div className="ual-toolbar__filters">
                    <Input
                        placeholder="Search name, phone, invoice..."
                        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                        value={searchKey}
                        onChange={(e) => setSearchKey(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        style={{ width: 280 }}
                    />

                    <DatePicker.RangePicker value={dateRange} onChange={setDateRange} format="DD MMM YYYY" style={{ width: 280 }}/>

                    <Select
                        allowClear
                        showSearch
                        placeholder="Customer type"
                        value={customerTypeId}
                        onChange={setCustomerTypeId}
                        loading={customerTypesLoading}
                        optionFilterProp="label"
                        style={{ width: 180 }}
                        options={customerTypes.map((type) => ({
                            value: type.id,
                            label: type.name,
                        }))}
                    />

                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        Search
                    </Button>

                    <Button onClick={handleReset}>Reset</Button>
                </div>

                <Button className="ual-toolbar__back" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back
                </Button>
            </div>

            {selectedRowKeys.length > 0 && (
                <div className="ual-selection">
                    <div className="ual-selection__left">
                        <span className="ual-selection__count">{selectedRowKeys.length} selected</span>
                        <span className="ual-selection__text">
                            {selectedRowKeys.length > 1
                                ? `${selectedRowKeys.length} orders ready to assign`
                                : "1 order ready to assign"}
                        </span>
                        <Button type="primary" size="middle" icon={<UserSwitchOutlined />} onClick={handleAssignOpen}>
                            Assign to Employee
                        </Button>
                    </div>
                    <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={() => setSelectedRowKeys([])} style={{ color: "#1c558b", padding: 0 }}>
                        Clear selection
                    </Button>
                </div>
            )}

            <div className="ual-table-card">
                <Table
                    rowKey="id"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                        columnWidth: 48,
                    }}
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: [25, 50, 100,150,200,250,300,350,400,450,500],
                        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} orders`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1280, y: "calc(100vh - 300px)" }}
                    size="middle"
                />
            </div>

            <Modal
                className="ual-assign-modal"
                title="Assign Orders to Employee"
                open={assignModalOpen}
                onOk={handleAssignSubmit}
                onCancel={() => setAssignModalOpen(false)}
                confirmLoading={assignLoading}
                okText="Assign"
                destroyOnClose
            >
                <div className="ual-assign-hint">
                    {selectedRowKeys.length} order(s) will be assigned
                </div>
                <Select
                    showSearch
                    placeholder="Search and select an employee"
                    style={{ width: "100%" }}
                    loading={employeeLoading}
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    optionFilterProp="label"
                    options={employees.map((emp) => ({
                        value: emp.id,
                        label: `${emp.username} (${emp.phone_number})`,
                    }))}
                />
                <div style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 500, marginBottom: 6, display: "block" }}>
                        Follow-up Date <span style={{ color: "#ff4d4f" }}>*</span>
                    </label>
                    <DatePicker
                        style={{ width: "100%" }}
                        placeholder="Select follow-up date"
                        value={followupDate}
                        onChange={setFollowupDate}
                        format="DD MMM YYYY"
                    />
                </div>
            </Modal>

            <Modal
                className="ual-preview-modal"
                title={
                    <div className="ual-preview-title">
                        <span>Order Preview</span>
                        <span className="ual-preview-invoice">
                            {previewOrder?.invoice_number || "—"}
                        </span>
                    </div>
                }
                open={previewOpen}
                onCancel={closePreview}
                footer={null}
                width={860}
                destroyOnClose
            >
                {previewOrder && (() => {
                    const payable = parseAmount(previewOrder.payable_price);
                    const advance = parseAmount(previewOrder.advance_payment);
                    const due =
                        previewOrder.due !== undefined && previewOrder.due !== null
                            ? parseAmount(previewOrder.due)
                            : Math.max(payable - advance, 0);
                    const discount =
                        parseAmount(previewOrder.discount) +
                        parseAmount(previewOrder.special_discount);
                    const upsellCount = Array.isArray(previewOrder.up_sell_details)
                        ? previewOrder.up_sell_details.length
                        : 0;

                    return (
                        <div className="ual-preview">
                            <Row gutter={[14, 14]}>
                                <Col xs={24} md={12}>
                                    <div className="ual-preview-card">
                                        <div className="ual-preview-card__title">Customer</div>
                                        <div className="ual-preview-field">
                                            <span className="ual-preview-field__label">Name</span>
                                            <span className="ual-preview-field__value">
                                                {previewOrder.customer_name || "—"}
                                            </span>
                                        </div>
                                        <div className="ual-preview-field">
                                            <span className="ual-preview-field__label">Phone</span>
                                            <span className="ual-preview-field__value">
                                                {previewOrder.phone_number || "—"}
                                            </span>
                                        </div>
                                        <div className="ual-preview-field">
                                            <span className="ual-preview-field__label">District</span>
                                            <span className="ual-preview-field__value">
                                                {previewOrder.district?.name || "—"}
                                            </span>
                                        </div>
                                        <div className="ual-preview-field" style={{ marginBottom: 0 }}>
                                            <span className="ual-preview-field__label">Address</span>
                                            <span className="ual-preview-field__value">
                                                {previewOrder.address_details || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} md={12}>
                                    <div className="ual-preview-card">
                                        <div className="ual-preview-card__title">Order Info</div>
                                        <div className="ual-preview-field">
                                            <span className="ual-preview-field__label">Status</span>
                                            <span
                                                className="ual-status"
                                                style={{
                                                    backgroundColor:
                                                        previewOrder.current_status?.bg_color || "#1c558b",
                                                    color:
                                                        previewOrder.current_status?.text_color || "#fff",
                                                }}
                                            >
                                                {previewOrder.current_status?.name || "—"}
                                            </span>
                                        </div>
                                        <div className="ual-preview-field">
                                            <span className="ual-preview-field__label">Paid Status</span>
                                            <span
                                                className={`ual-paid ${
                                                    previewOrder.paid_status === "paid"
                                                        ? "ual-paid--paid"
                                                        : "ual-paid--unpaid"
                                                }`}
                                            >
                                                {previewOrder.paid_status || "—"}
                                            </span>
                                        </div>
                                        <div className="ual-preview-field">
                                            <span className="ual-preview-field__label">Created</span>
                                            <span className="ual-preview-field__value">
                                                {previewOrder.created_at
                                                    ? dayjs(previewOrder.created_at).format(
                                                          "DD MMM YYYY, hh:mm A"
                                                      )
                                                    : "—"}
                                            </span>
                                        </div>
                                        <div className="ual-preview-field" style={{ marginBottom: 0 }}>
                                            <span className="ual-preview-field__label">Note</span>
                                            <span className="ual-preview-field__value">
                                                {previewOrder.note || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} md={12}>
                                    <div className="ual-preview-card">
                                        <div className="ual-preview-card__title">Pricing</div>
                                        <div className="ual-preview-grid">
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">MRP</span>
                                                <span className="ual-preview-field__value">
                                                    {formatMoney(previewOrder.mrp)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Sell Price</span>
                                                <span className="ual-preview-field__value">
                                                    {formatMoney(previewOrder.sell_price)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Discount</span>
                                                <span className="ual-preview-field__value">
                                                    {formatMoney(discount)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Coupon</span>
                                                <span className="ual-preview-field__value">
                                                    {formatMoney(previewOrder.coupon_value)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Delivery</span>
                                                <span className="ual-preview-field__value">
                                                    {formatMoney(previewOrder.delivery_charge)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Net</span>
                                                <span className="ual-preview-field__value ual-preview-field__value--strong">
                                                    {formatMoney(previewOrder.net_order_price)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={24} md={12}>
                                    <div className="ual-preview-card">
                                        <div className="ual-preview-card__title">Payment & Logistics</div>
                                        <div className="ual-preview-grid">
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Payable</span>
                                                <span className="ual-preview-field__value ual-preview-field__value--strong">
                                                    {formatMoney(previewOrder.payable_price)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Advance</span>
                                                <span className="ual-preview-field__value">
                                                    {formatMoney(previewOrder.advance_payment)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Due</span>
                                                <span className={`ual-due ${due > 0 ? "ual-due--owed" : "ual-due--clear"}`}>
                                                    {formatMoney(due)}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Gateway</span>
                                                <span className="ual-preview-field__value">
                                                    {previewOrder.payment_gateway?.name || "—"}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Courier</span>
                                                <span className="ual-preview-field__value">
                                                    {previewOrder.courier?.name || "—"}
                                                </span>
                                            </div>
                                            <div className="ual-preview-field">
                                                <span className="ual-preview-field__label">Tracking</span>
                                                <span className="ual-preview-field__value">
                                                    {previewOrder.tracking_code ||
                                                        previewOrder.consignment_id ||
                                                        "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>

                                <Col span={24}>
                                    <div className="ual-preview-card">
                                        <div className="ual-preview-card__title">Upsell Details</div>
                                        {upsellCount > 0 ? (
                                            <div className="ual-preview-upsell-list">
                                                {previewOrder.up_sell_details.map((item, index) => (
                                                    <div
                                                        key={item?.id || index}
                                                        className="ual-preview-upsell-item"
                                                    >
                                                        {typeof item === "object"
                                                            ? item?.name ||
                                                              item?.product_name ||
                                                              JSON.stringify(item)
                                                            : String(item)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="ual-logistics__empty">No upsell items</span>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
