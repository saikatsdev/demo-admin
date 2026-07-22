import { Link, useNavigate } from "react-router-dom";
import {WhatsAppOutlined, CopyOutlined, SwapOutlined, ArrowLeftOutlined, UserOutlined,PhoneOutlined, ReloadOutlined, EyeOutlined, EditOutlined, ShoppingOutlined,TeamOutlined, CalendarOutlined, ClockCircleOutlined, FireOutlined,CheckCircleOutlined, ExclamationCircleOutlined, PhoneFilled, HistoryOutlined, UserSwitchOutlined, CloseCircleOutlined, FlagOutlined} from '@ant-design/icons';
import {Input as AntInput, Breadcrumb, Table, Button, Space, message, Modal,DatePicker, Tooltip, Tag, Select, Row, Col, Card, Avatar, Typography, Spin, Badge} from "antd";
import useTitle from "../../../hooks/useTitle";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";
import { useRole } from "../../../hooks/useRole";

dayjs.extend(relativeTime);

const pulseStyle = `
@keyframes lc-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%        { opacity: .5; transform: scale(1.4); }
}
.lc-pulse { animation: lc-pulse 1.8s ease-in-out infinite; }
`;
if (!document.getElementById("lc-pulse-style")) {
    const el = document.createElement("style");
    el.id = "lc-pulse-style";
    el.textContent = pulseStyle;
    document.head.appendChild(el);
}


const getStepConfig = (step) => {
    const cfg = {
        1: { 
            color: "blue",   
            bg: "#e6f4ff", 
            text: "#1677ff", 
            label: "Step 1" 
        },
        2: { 
            color: "orange", 
            bg: "#fff7e6", 
            text: "#fa8c16", 
            label: "Step 2" 
        },
        3: { 
            color: "red",    
            bg: "#fff2f0", 
            text: "#ff4d4f", 
            label: "Step 3" 
        },
        4: { 
            color: "purple", 
            bg: "#f9f0ff", 
            text: "#722ed1", 
            label: "Step 4" 
        },
        5: { 
            color: "cyan", 
            bg: "#e6fffb", 
            text: "#13c2c2", 
            label: "Step 5" 
        },
    };
    return cfg[step] || { color: "default", bg: "#f5f5f5", text: "#8c8c8c", label: `Step ${step}` };
};

const FOLLOWUP_STEP_OPTIONS = [1, 2, 3, 4, 5].map((step) => ({
    value: step,
    label: `Step ${step}`,
}));

const normalizeFollowupSummary = (raw) => {
    const s = raw && typeof raw === "object" ? raw : {};
    const num = (key, altKey) => {
        const val = s[key] ?? (altKey ? s[altKey] : undefined);
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
    };
    return {
        all_followups: num("all_followups"),
        today_followups: num("today_followups"),
        overdue_followups: num("overdue_followups"),
        step_1: num("step_1", "step1"),
        step_2: num("step_2", "step2"),
        step_3: num("step_3", "step3"),
        step_4: num("step_4", "step4"),
        step_5: num("step_5", "step5"),
    };
};

const extractFollowupSummary = (result) => {
    if (!result || typeof result !== "object") return {};
    if (result.summary && typeof result.summary === "object") return result.summary;
    if (result.data?.summary && typeof result.data.summary === "object") return result.data.summary;
    return {};
};

const getFollowupLabel = (dateStr) => {
    if (!dateStr) return { label: "Not Set", color: "#bfbfbf", bg: "#fafafa", dot: "#d9d9d9" };
    const now   = dayjs();
    const date  = dayjs(dateStr);
    const diff  = date.startOf("day").diff(now.startOf("day"), "day");

    if (diff < 0)  return { label: `Overdue ${Math.abs(diff)}d`, color: "#ff4d4f", bg: "#fff2f0", dot: "#ff4d4f" };
    if (diff === 0) return { label: "Today",    color: "#52c41a", bg: "#f6ffed", dot: "#52c41a" };
    if (diff === 1) return { label: "Tomorrow",  color: "#fa8c16", bg: "#fff7e6", dot: "#fa8c16" };
    return { label: `${diff} Days Left`, color: "#1677ff", bg: "#e6f4ff", dot: "#1677ff" };
};

const getPriority = (dateStr) => {
    if (!dateStr) return { label: "Upcoming", color: "blue" };
    const diff = dayjs(dateStr).startOf("day").diff(dayjs().startOf("day"), "day");
    if (diff < 0)  return { label: "Overdue",  color: "red"    };
    if (diff === 0) return { label: "Today",   color: "orange" };
    return { label: "Upcoming", color: "blue" };
};

const callStatusLabel = (status) => {
    const map = {
        answered:     { label: "Connected",  color: "#52c41a" },
        no_answer:    { label: "No Answer",  color: "#fa8c16" },
        busy:         { label: "Busy",       color: "#faad14" },
        switched_off: { label: "Switched Off", color: "#ff4d4f" },
        wrong_number: { label: "Wrong No",   color: "#722ed1" },
        call_rejected:{ label: "Rejected",   color: "#c41d7f" },
    };
    return map[status] || { label: status || "—", color: "#8c8c8c" };
};

export default function FollowupSell() {
    // Hook
    useTitle("Follow Up Orders");

    const navigate = useNavigate();
    const { hasAnyRole } = useRole();
    const isAdminOrSuperAdmin = hasAnyRole(["admin", "superadmin"]);

    // core state
    const [followUpOrders, setFollowUpOrders] = useState([]);
    const [loading, setLoading]               = useState(false);
    const [pagination, setPagination]         = useState({ current: 1, pageSize: 25, total: 0 });
    const [summary, setSummary]               = useState(() => normalizeFollowupSummary({}));
    const [messageApi, contextHolder]         = message.useMessage();

    // filter state
    const [search, setSearch]               = useState("");
    const [filterStep, setFilterStep]       = useState(null);
    const [filterStatus, setFilterStatus]   = useState('active');
    const [filterPriority, setFilterPriority] = useState(null);
    const [filterAssign, setFilterAssign]     = useState("assigned");
    const [dateRange, setDateRange]         = useState(null);
    const [summaryKey, setSummaryKey]       = useState("all");

    // assign selection (Non Assign mode)
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [employees, setEmployees]             = useState([]);
    const [employeeLoading, setEmployeeLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [assignLoading, setAssignLoading]     = useState(false);

    // modal state
    const [editRecord, setEditRecord]       = useState(null);
    const [followupDate, setFollowupDate]   = useState(null);
    const [stepValue, setStepValue]         = useState(null);
    const [statusValue, setStatusValue]     = useState(null);
    const [callStatusValue, setCallStatusValue] = useState(null);
    const [closeReasonValue, setCloseReasonValue] = useState("");
    const [noteValue, setNoteValue]         = useState("");
    const [saveLoading, setSaveLoading]     = useState(false);
    const [detailRecord, setDetailRecord]   = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 52,
            align: "center",
            render: (_, __, i) => (
                <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                    {(pagination.current - 1) * pagination.pageSize + i + 1}
                </span>
            ),
        },
        {
            title: "Customer",
            key: "customer",
            render: (_, record) => {
                const name  = record.customer_name || record.order?.customer_name || "N/A";
                const phone = record.phone_number  || record.order?.phone_number  || "N/A";
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar size={36} icon={<UserOutlined />}
                            style={{ background: "#e6f4ff", color: "#1677ff", flexShrink: 0 }} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#262626" }}>{name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <span style={{ fontSize: 12, color: "#595959" }}>{phone}</span>
                                {phone !== "N/A" && (
                                    <>
                                        <Tooltip title="Copy"><CopyOutlined style={{ fontSize: 12, color: "#1677ff", cursor: "pointer" }} onClick={() => copyPhone(phone)} /></Tooltip>
                                        <Tooltip title="WhatsApp"><WhatsAppOutlined style={{ fontSize: 12, color: "#25D366", cursor: "pointer" }} onClick={() => openWhatsApp(phone)} /></Tooltip>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Order",
            key: "order",
            render: (_, record) => {
                const inv       = record.order?.invoice_number || "—";
                const delivered = record.order?.delivered_at;
                return (
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1677ff" }}>{inv}</div>
                        <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                            Delivered: {delivered ? dayjs(delivered).format("DD MMM YYYY") : "—"}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Products",
            key: "products",
            render: (_, record) => {
                const products = record.order?.products || [];
                if (!products.length) return <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: 12 }}>No products</span>;

                const display   = products.slice(0, 2);
                const remaining = products.length - 2;

                const tooltipContent = (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto", padding: 4 }}>
                        {products.map((p, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: i < products.length - 1 ? "1px solid #3a3a3a" : "none", paddingBottom: i < products.length - 1 ? 6 : 0 }}>
                                {p.image && <img src={p.image} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
                                <div>
                                    <div style={{ fontSize: 12, color: "#fff" }}>{p.name || "—"}</div>
                                    <div style={{ fontSize: 11, color: "#fa8c16" }}>×{p.quantity}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {display.map((p, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {p.image
                                    ? <img src={p.image} alt="" style={{ width: 22, height: 22, borderRadius: 3, objectFit: "cover" }} />
                                    : <ShoppingOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
                                }
                                <span style={{ fontSize: 12, color: "#262626", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {p.name || "—"}
                                </span>
                                <span style={{ fontSize: 11, color: "#1677ff", fontWeight: 600 }}>×{p.quantity}</span>
                            </div>
                        ))}
                        {products.length > 0 && (
                            <Tooltip title={tooltipContent} color="#1d1d1d">
                                <span style={{ fontSize: 11, color: remaining > 0 ? "#fa8c16" : "#8c8c8c", cursor: "pointer", fontWeight: 500 }}>
                                    {remaining > 0 ? `+${remaining} more` : "View all"}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Step",
            key: "step",
            width: 90,
            align: "center",
            render: (_, record) => {
                const cfg = getStepConfig(record.current_step);
                return (
                    <Tag style={{ borderRadius: 20, padding: "2px 12px", fontWeight: 600, fontSize: 12, border: "none", background: cfg.bg, color: cfg.text }}>
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: "Next Follow-up",
            key: "next_followup",
            render: (_, record) => {
                const followup = record.next_followup_at;
                const info     = getFollowupLabel(followup);
                return (
                    <div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: info.bg, padding: "3px 10px", borderRadius: 20 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: info.dot, display: "inline-block" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
                        </div>
                        {followup && (
                            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 3 }}>
                                {dayjs(followup).format("DD MMM YYYY")}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Last Call",
            key: "last_call",
            render: (_, record) => {
                const interaction = record.last_interaction;
                if (!interaction) return <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: 12 }}>No call yet</span>;

                const cfg  = callStatusLabel(interaction.call_status);
                const when = record.last_contact_at ? dayjs(record.last_contact_at).fromNow() : "—";
                return (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span
                            className="lc-pulse"
                            style={{
                                marginTop: 4, width: 7, height: 7, borderRadius: "50%",
                                background: cfg.color, flexShrink: 0, display: "inline-block",
                            }}
                        />
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 1 }}>{when}</div>
                            <span onClick={() => handleShowDetails(record)} style={{
                                fontSize: 10, color: "#1677ff", marginTop: 2, display: "inline-flex",
                                alignItems: "center", gap: 3, cursor: "pointer",
                            }}>
                                <HistoryOutlined /> Details ▾
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Assigned",
            key: "assigned",
            render: (_, record) => {
                const emp = record.employee;
                if (!emp) return <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: 12 }}>Unassigned</span>;
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Avatar size={28} icon={<TeamOutlined />}
                            style={{ background: "#f9f0ff", color: "#722ed1", fontSize: 13, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#262626", textTransform: "capitalize" }}>
                            {emp.username}
                        </span>
                    </div>
                );
            },
        },
        {
            title: "Priority",
            key: "priority",
            width: 100,
            align: "center",
            render: (_, record) => {
                const p = getPriority(record.next_followup_at);
                return <Tag color={p.color} style={{ borderRadius: 20, padding: "2px 10px", fontWeight: 600, fontSize: 11, border: "none" }}>{p.label}</Tag>;
            },
        },
        {
            title: "Status",
            key: "status",
            align: "center",
            render: (_, record) => {
                const status = record.status;
                let color = "default";
                let label = status;

                switch (status) {
                    case "active":
                        color = "success";
                        label = "Active";
                        break;
                    case "converted":
                        color = "processing";
                        label = "Converted";
                        break;
                    case "cancelled":
                        color = "error";
                        label = "Cancelled";
                        break;
                    case "closed":
                        color = "warning";
                        label = "Closed";
                        break;
                    case "auto_closed":
                        color = "warning";
                        label = "Auto Closed";
                        break;
                    case "lost":
                        color = "default";
                        label = "Lost";
                        break;
                    default:
                        color = "default";
                        label = status;
                }

                return <Tag color={color} style={{ borderRadius: 20, padding: "2px 10px", fontWeight: 600, fontSize: 11, border: "none" }}>{label}</Tag>;
            }
        },
        {
            title: "Action",
            key: "action",
            align: "center",
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="View Order">
                        <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: "#1677ff" }} onClick={() => handleView(record.order_id)} />
                    </Tooltip>

                    <Tooltip title="Convert to Order">
                        <Button type="text" size="small" icon={<SwapOutlined />} style={{ color: "#faad14", backgroundColor: "#fff7e6" }} onClick={() => handleConvert(record)} />
                    </Tooltip>
                    
                    <Tooltip title="Update Follow-up">
                        <Button type="primary" ghost size="small" icon={<EditOutlined />} style={{ fontSize: 12 }} onClick={() => handleEdit(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const copyPhone = (phone) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        messageApi.success("Phone number copied.");
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;
        const clean = phone.replace(/\D/g, "");
        const num   = clean.startsWith("880") ? clean : `880${clean}`;
        window.open(`https://wa.me/${num}`, "_blank");
    };

    const handleView = (orderid) => {
        navigate(`/order-edit/${orderid}`);
    };

    const handleShowDetails = async (record) => {
        setDetailRecord({});
        try {
            setDetailLoading(true);
            const res = await getDatas(`/admin/followup/${record.id}`);
            if (res?.success) {
                setDetailRecord(res.result);
            } else {
                setDetailRecord(null);
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to load details");
            setDetailRecord(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleConvert = async (record) => {
        const orderId = record.order_id || record.order?.id;

        const buildNavigateState = (orderInfo = null) => {
            const customerName =
                orderInfo?.customer_name ||
                record.customer_name ||
                record.order?.customer_name ||
                "";
            const customerPhone =
                orderInfo?.phone_number ||
                record.phone_number ||
                record.order?.phone_number ||
                "";
            const customerAddress =
                orderInfo?.address_details ||
                record.address ||
                record.address_details ||
                record.order?.customer_address ||
                "";

            const details = orderInfo?.details || [];
            const fallbackProducts = record.order?.products || [];

            const items = details.length
                ? details.map((item) => ({
                    product: item.product,
                    quantity: item.quantity || 1,
                    mrp: item.mrp,
                    sell_price: item.sell_price,
                    offer_price: item.sell_price,
                    discount: item.discount,
                    buy_price: item.buy_price,
                    attribute_value_1: item.attribute_value_1,
                    attribute_value_2: item.attribute_value_2,
                    attribute_value_3: item.attribute_value_3,
                }))
                : fallbackProducts.map((p) => ({
                    product: {
                        id: p.product_id || p.id,
                        name: p.name,
                        image: p.image || p.img_path,
                        img_path: p.image || p.img_path,
                        mrp: p.mrp,
                        sell_price: p.sell_price,
                        offer_price: p.offer_price || p.sell_price,
                        discount: p.discount,
                        buy_price: p.buy_price,
                    },
                    quantity: p.quantity || 1,
                    mrp: p.mrp,
                    sell_price: p.sell_price,
                    offer_price: p.offer_price || p.sell_price,
                    discount: p.discount,
                    buy_price: p.buy_price,
                }));

            return {
                name: customerName,
                customer_name: customerName,
                phone_number: customerPhone,
                customer_phone: customerPhone,
                address: customerAddress,
                customer_address: customerAddress,
                district_id: orderInfo?.district?.id || record.order?.district_id || null,
                followup_id: record.id,
                source_order_id: orderId || null,
                items,
            };
        };

        try {
            if (orderId) {
                messageApi.open({ type: "loading", content: "Loading order for conversion...", duration: 0, key: "convert" });
                const res = await getDatas(`/admin/orders/${orderId}`);
                messageApi.destroy("convert");

                if (res?.success) {
                    navigate("/order-add", { state: buildNavigateState(res.result) });
                    return;
                }
            }

            navigate("/order-add", { state: buildNavigateState() });
        } catch (err) {
            messageApi.destroy("convert");
            console.error(err);
            message.error("Conversion failed");
        }
    };

    const handleEdit = (record) => {
        setEditRecord(record);
        setFollowupDate(record.next_followup_at ? dayjs(record.next_followup_at) : null);
        setStatusValue(record.status ?? null);
        setCallStatusValue(record.last_interaction?.call_status ?? null);
        setStepValue(record.current_step ?? null);
        setCloseReasonValue("");
        setNoteValue("");
    };

    const fetchOrders = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const params = { page, paginate_size: pageSize };
            if (search)         params.search_key = search;
            if (filterStep)     params.step       = filterStep;
            if (filterStatus) params.status = filterStatus;
            if (filterAssign === "assigned") params.is_assign = 1;
            else if (filterAssign === "unassigned") params.is_assign = 0;

            if (filterPriority === "overdue") {
                params.to_date = dayjs().subtract(1, "day").format("YYYY-MM-DD 23:59:59");
            } else if (filterPriority === "today") {
                params.from_date = dayjs().format("YYYY-MM-DD 00:00:00");
                params.to_date   = dayjs().format("YYYY-MM-DD 23:59:59");
            }

            if (dateRange?.[0] && dateRange?.[1]) {
                params.from_date = dateRange[0].format("YYYY-MM-DD 00:00:00");
                params.to_date   = dateRange[1].format("YYYY-MM-DD 23:59:59");
            }

            if (summaryKey !== "all") {
                if (summaryKey === "today") {
                    params.from_date = dayjs().format("YYYY-MM-DD 00:00:00");
                    params.to_date   = dayjs().format("YYYY-MM-DD 23:59:59");
                    params.status    = filterStatus || "active";
                } else if (summaryKey === "overdue") {
                    params.to_date = dayjs().subtract(1, "day").format("YYYY-MM-DD 23:59:59");
                    params.status  = filterStatus || "active";
                } else if (summaryKey === "step1") {
                    params.step = 1;
                    params.status       = filterStatus || "active";
                } else if (summaryKey === "step2") {
                    params.step = 2;
                    params.status       = filterStatus || "active";
                } else if (summaryKey === "step3") {
                    params.step = 3;
                    params.status       = filterStatus || "active";
                } else if (summaryKey === "step4") {
                    params.step = 4;
                    params.status       = filterStatus || "active";
                } else if (summaryKey === "step5") {
                    params.step = 5;
                    params.status       = filterStatus || "active";
                }
            }

            const res = await getDatas("/admin/followup", params);

            if (res?.success) {
                setFollowUpOrders(res.result?.data?.data || []);
                setSummary((prev) =>
                    normalizeFollowupSummary({
                        ...prev,
                        ...extractFollowupSummary(res.result),
                    })
                );
                setPagination({
                    current:  res.result?.data?.meta?.current_page,
                    pageSize: res.result?.data?.meta?.per_page,
                    total:    res.result?.data?.meta?.total,
                });
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch follow-up orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        setSelectedRowKeys([]);
        fetchOrders(1, pagination.pageSize); 
    },[search, filterStep, filterStatus, filterPriority, filterAssign, dateRange, summaryKey]);

    const handleTableChange = (pag) => {
        setSelectedRowKeys([]);
        fetchOrders(pag.current, pag.pageSize);
    };

    const fetchEmployees = async () => {
        try {
            setEmployeeLoading(true);
            const res = await getDatas("/admin/users/list");
            if (res?.success) {
                setEmployees(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setEmployeeLoading(false);
        }
    };

    const handleAssignOpen = () => {
        if (selectedRowKeys.length === 0) {
            message.warning("Please select at least one order");
            return;
        }
        setSelectedEmployee(null);
        setAssignModalOpen(true);
        fetchEmployees();
    };

    const handleAssignSubmit = async () => {
        if (!selectedEmployee) {
            message.warning("Please select an employee");
            return;
        }

        const orderIds = followUpOrders
            .filter((row) => selectedRowKeys.includes(row.id))
            .map((row) => row.order_id || row.order?.id)
            .filter(Boolean);

        if (orderIds.length === 0) {
            message.warning("No valid order IDs found for assignment");
            return;
        }

        try {
            setAssignLoading(true);

            const res = await postData("/admin/followup/assign", {
                ids: orderIds,
                user_id: selectedEmployee,
            });

            if (res?.success) {
                messageApi.success(res?.msg || "Orders assigned successfully");
                setSelectedRowKeys([]);
                setAssignModalOpen(false);
                fetchOrders(pagination.current, pagination.pageSize);
            } else {
                message.error(res?.msg || "Failed to assign orders");
            }
        } catch (error) {
            console.log(error);
            message.error("Failed to assign orders");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editRecord) return;
        setSaveLoading(true);
        try {
            const formData = new FormData();
            formData.append("_method", "PUT");
            if (followupDate)  formData.append("next_followup_at", followupDate.format("YYYY-MM-DD"));
            if (stepValue)     formData.append("current_step", stepValue);
            if (statusValue)   formData.append("status", statusValue);
            if (statusValue === "closed" && closeReasonValue) formData.append("close_reason", closeReasonValue);
            if (callStatusValue) formData.append("call_status", callStatusValue);
            if (noteValue)     formData.append("remarks", noteValue);

            const res = await postData(`/admin/followup/${editRecord.id}`, formData);

            if (res?.success) {
                messageApi.success(res.msg || "Updated successfully");
                setEditRecord(null);
                fetchOrders(pagination.current, pagination.pageSize);
            }
        } catch (err) {
            console.error(err);
            message.error("Update failed");
        } finally {
            setSaveLoading(false);
        }
    };

    const overviewSummaryCards = [
        { 
            key: "all", 
            label: "All Follow-ups", 
            value: summary.all_followups,   
            icon: <ShoppingOutlined />,        
            color: "#1677ff", bg: "#e6f4ff" 
        },
        { 
            key: "today",   
            label: "Today",          
            value: summary.today_followups,  
            icon: <ClockCircleOutlined />,     
            color: "#52c41a", bg: "#f6ffed" 
        },
        { 
            key: "overdue", 
            label: "Overdue",         
            value: summary.overdue_followups,
            icon: <ExclamationCircleOutlined />, 
            color: "#ff4d4f", bg: "#fff2f0" 
        },
    ];

    const stepSummaryCards = [
        { 
            key: "step1",   
            label: "Step 1",          
            value: summary.step_1,           
            icon: <FireOutlined />,            
            color: "#1677ff", bg: "#e6f4ff" 
        },
        { 
            key: "step2",   
            label: "Step 2",          
            value: summary.step_2,           
            icon: <CalendarOutlined />,        
            color: "#fa8c16", bg: "#fff7e6" 
        },
        { 
            key: "step3",   
            label: "Step 3",          
            value: summary.step_3,           
            icon: <CheckCircleOutlined />,     
            color: "#ff4d4f", bg: "#fff2f0" 
        },
        { 
            key: "step4",   
            label: "Step 4",          
            value: summary.step_4,           
            icon: <HistoryOutlined />,        
            color: "#722ed1", bg: "#f9f0ff" 
        },
        { 
            key: "step5",   
            label: "Step 5",          
            value: summary.step_5,           
            icon: <FlagOutlined />,        
            color: "#13c2c2", bg: "#e6fffb" 
        },
    ];

    const allSummaryCards = [...overviewSummaryCards, ...stepSummaryCards];

    const renderSummaryCard = (c) => (
        <Card
            hoverable
            onClick={() => setSummaryKey(c.key)}
            styles={{ body: { padding: "14px 18px" } }}
            style={{
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 0.2s",
                border: summaryKey === c.key ? `2px solid ${c.color}` : "1px solid #f0f0f0",
                background: summaryKey === c.key ? c.bg : "#fff",
                height: "100%",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontSize: 11, color: "#8c8c8c", fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#262626", marginTop: 2 }}>{c.value ?? 0}</div>
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 18, display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                    background: summaryKey === c.key ? c.color : "#f5f5f5",
                    color: summaryKey === c.key ? "#fff" : c.color,
                }}>
                    {c.icon}
                </div>
            </div>
        </Card>
    );

    const assignOrder = () => {
        if (filterAssign === "unassigned") {
            handleAssignOpen();
            return;
        }
        navigate('/assign/orders');
    };

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Follow-Up Orders</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Follow-Up Orders" },
                    ]} />
                </div>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {allSummaryCards.map((c) => (
                    <Col key={c.key} xs={24} sm={12} md={8} lg={6} xl={3}>
                        {renderSummaryCard(c)}
                    </Col>
                ))}
            </Row>

            <div style={{ padding: "14px 16px", background: "#fff", borderRadius: 8, marginBottom: 16, border: "1px solid #f0f0f0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                <Space wrap size="middle" style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space wrap size="middle">
                        <AntInput.Search allowClear placeholder="Search Invoice / Phone / Name..." onSearch={(v) => setSearch(v)} style={{ width: 260 }}/>

                        <Select placeholder="Step" allowClear style={{ width: 110 }} value={filterStep} onChange={setFilterStep} options={FOLLOWUP_STEP_OPTIONS}/>

                        <Select placeholder="Status" allowClear style={{ width: 120 }} value={filterStatus} onChange={setFilterStatus}
                            options={[
                                { 
                                    value: "active", 
                                    label: "Active" 
                                }, 
                                {
                                    value: "cancelled",
                                    label: "Cancelled"
                                },
                                { 
                                    value: "converted", 
                                    label: "Converted" 
                                }, 
                                { 
                                    value: "closed", 
                                    label: "Closed" 
                                },
                                {
                                    value : "auto_closed",
                                    label : "Auto Closed"
                                },
                                {
                                    value : "lost",
                                    label : "Lost"
                                }
                            ]}
                        />
                        <Select placeholder="Priority" allowClear style={{ width: 120 }} value={filterPriority} onChange={setFilterPriority}
                            options={[{ value: "overdue", label: "🔴 Overdue" }, { value: "today", label: "🟠 Today" }, { value: "upcoming", label: "🔵 Upcoming" }]}
                        />
                        {isAdminOrSuperAdmin && (
                            <Select
                                placeholder="Assign"
                                style={{ width: 130 }}
                                value={filterAssign}
                                onChange={(value) => setFilterAssign(value)}
                                options={[
                                    { value: "assigned", label: "Assigned" },
                                    { value: "unassigned", label: "Non Assign" },
                                ]}
                            />
                        )}
                        <DatePicker.RangePicker format="YYYY-MM-DD" value={dateRange} onChange={setDateRange} />
                    </Space>
                    <Space>
                        {isAdminOrSuperAdmin && (
                            <Button type={filterAssign === "unassigned" && selectedRowKeys.length > 0 ? "primary" : "default"} icon={<UserSwitchOutlined />} onClick={() => assignOrder()}>
                                Assign Orders
                                {filterAssign === "unassigned" && selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ""}
                            </Button>
                        )}
                        <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(1, pagination.pageSize)}>Refresh</Button>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                    </Space>
                </Space>
            </div>

            {isAdminOrSuperAdmin && filterAssign === "unassigned" && selectedRowKeys.length > 0 && (
                <div style={{
                    display       : "flex",
                    alignItems    : "center",
                    justifyContent: "space-between",
                    gap           : 12,
                    flexWrap      : "wrap",
                    padding       : "12px 16px",
                    marginBottom  : 16,
                    background    : "#fff",
                    border        : "1px solid #e8edf5",
                    borderLeft    : "4px solid #1c558b",
                    borderRadius  : 8,
                }}>
                    <Space wrap>
                        <Badge count={selectedRowKeys.length} style={{ backgroundColor: "#1c558b" }} />
                        <span style={{ fontWeight: 600, color: "#262626" }}>
                            {selectedRowKeys.length} order(s) selected
                        </span>
                        <Button type="primary" icon={<UserSwitchOutlined />} onClick={handleAssignOpen}>
                            Assign to Employee
                        </Button>
                    </Space>
                    <Button
                        type="link"
                        icon={<CloseCircleOutlined />}
                        onClick={() => setSelectedRowKeys([])}
                        style={{ padding: 0 }}
                    >
                        Clear selection
                    </Button>
                </div>
            )}

            {/* Table */}
            <Table
                rowKey="id"
                columns={columns}
                dataSource={followUpOrders}
                loading={loading}
                rowSelection={
                    isAdminOrSuperAdmin && filterAssign === "unassigned"
                        ? {
                              selectedRowKeys,
                              onChange: setSelectedRowKeys,
                              columnWidth: 48,
                          }
                        : undefined
                }
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["25", "50", "100", "150", "200","250","300","350","400","450","500"],
                    showTotal: (total) => <span style={{ color: "#8c8c8c" }}>Total {total} records</span>,
                }}
                onChange={handleTableChange}
                rowClassName={(_, idx) => idx % 2 === 0 ? "" : "ant-table-row-striped"}
            />

            <Modal
                title="Assign Orders to Employee"
                open={assignModalOpen}
                onOk={handleAssignSubmit}
                onCancel={() => setAssignModalOpen(false)}
                confirmLoading={assignLoading}
                okText="Assign"
                destroyOnClose
            >
                <div style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    background: "#e8f1f8",
                    border: "1px solid #d0e4f2",
                    borderRadius: 8,
                    color: "#1c558b",
                    fontWeight: 600,
                    fontSize: 13,
                }}>
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
            </Modal>

            <Modal title={<span style={{ fontWeight: 600 }}>Update Follow-up — <span style={{ color: "#1677ff" }}>{editRecord?.order?.invoice_number}</span></span>}
                open={!!editRecord} onCancel={() => setEditRecord(null)} onOk={handleSave} okText="Save" confirmLoading={saveLoading} width={420}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Next Follow-up Date</Typography.Text>
                        <DatePicker style={{ width: "100%" }} value={followupDate} onChange={setFollowupDate} />
                    </div>

                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Current Step</Typography.Text>
                        <Select
                            placeholder="Select step"
                            style={{ width: "100%" }}
                            value={stepValue}
                            onChange={setStepValue}
                            options={FOLLOWUP_STEP_OPTIONS}
                        />
                    </div>

                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Call Status</Typography.Text>
                        <Select
                            placeholder="Select call status"
                            style={{ width: "100%" }}
                            value={callStatusValue}
                            onChange={setCallStatusValue}
                            options={[
                                { value: 'answered',      label: 'Answered' },
                                { value: 'busy',           label: 'Busy' },
                                { value: 'no_answer',      label: 'No Answer' },
                                { value: 'switched_off',   label: 'Switched Off' },
                                { value: 'wrong_number',   label: 'Wrong Number' },
                                { value: 'call_rejected',  label: 'Call Rejected' },
                            ]}
                        />
                    </div>

                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Remarks</Typography.Text>
                        <AntInput.TextArea rows={4} value={noteValue} onChange={(e) => setNoteValue(e.target.value)} placeholder="Write your remarks..." />
                    </div>

                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Status</Typography.Text>
                        <Select
                            placeholder="Select status"
                            style={{ width: "100%" }}
                            value={statusValue}
                            onChange={setStatusValue}
                            options={[
                                { 
                                    value: 'active', 
                                    label: "Active" 
                                },
                                { 
                                    value: 'converted', 
                                    label: "Converted" 
                                },
                                { 
                                    value: 'closed', 
                                    label: "Closed" 
                                },
                                { 
                                    value: 'lost', 
                                    label: "Lost" 
                                },
                                { 
                                    value: 'cancelled', 
                                    label: "Cancelled" 
                                },
                            ]}
                        />
                    </div>

                    {statusValue === "closed" && (
                        <div>
                            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Close Reason</Typography.Text>
                            <AntInput.TextArea rows={3} value={closeReasonValue} onChange={(e) => setCloseReasonValue(e.target.value)} placeholder="Enter reason for closing..." />
                        </div>
                    )}
                </div>
            </Modal>

            <Modal title={<span style={{ fontWeight: 600 }}>Interaction History — <span style={{ color: "#1677ff" }}>{detailRecord?.invoice_number}</span></span>}
                open={!!detailRecord} onCancel={() => setDetailRecord(null)} footer={null} width={600}>
                {detailLoading ? (
                    <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
                ) : (
                    <div style={{ maxHeight: 480, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                        {detailRecord?.interactions?.length ? (
                            detailRecord.interactions.map((it) => {
                                const cfg = callStatusLabel(it.call_status);
                                return (
                                    <div key={it.id} style={{
                                        display: "flex", gap: 12,
                                        borderLeft: `3px solid ${cfg.color}`,
                                        padding: "14px 16px", borderRadius: 10, background: "#fafafa",
                                    }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <PhoneFilled style={{ color: cfg.color, fontSize: 16 }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Tag style={{ borderRadius: 12, padding: "0 10px", fontWeight: 600, fontSize: 11, border: "none", background: cfg.color + "18", color: cfg.color, margin: 0 }}>{cfg.label}</Tag>
                                                    {it.type === "feedback" && <Tag color="purple" style={{ borderRadius: 12, fontSize: 11, margin: 0 }}>Feedback</Tag>}
                                                    {it.step > 0 && <Tag color="blue" style={{ borderRadius: 12, fontSize: 11, margin: 0 }}>Step {it.step}</Tag>}
                                                </div>
                                                <span style={{ fontSize: 11, color: "#8c8c8c", whiteSpace: "nowrap" }}>{dayjs(it.created_at).format("DD MMM hh:mm A")}</span>
                                            </div>
                                            {it.remarks && (
                                                <div style={{ fontSize: 12, color: "#262626", marginTop: 4, padding: "8px 10px", background: "#fff", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                                                    “{it.remarks}”
                                                </div>
                                            )}
                                            <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "#8c8c8c" }}>
                                                {it.rating != null && <span>Rating: <span style={{ color: "#faad14", fontWeight: 600 }}>{it.rating}/5</span></span>}
                                                {it.next_followup_at && <span>Next: {dayjs(it.next_followup_at).format("DD MMM YYYY")}</span>}
                                                {it.employee && <span>By: <span style={{ color: "#262526", fontWeight: 500, textTransform: "capitalize" }}>{it.employee.username}</span></span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: "center", padding: 40, color: "#bfbfbf" }}>
                                <HistoryOutlined style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
                                No interactions recorded yet.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
