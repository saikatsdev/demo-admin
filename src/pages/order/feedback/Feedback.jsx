import { Link } from "react-router-dom";
import {EditOutlined,WhatsAppOutlined,CopyOutlined,ArrowLeftOutlined, StarFilled, ShoppingCartOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import {Input as AntInput, Breadcrumb, Table, Button, Space, message,Modal,DatePicker,Tooltip, Divider,Tag, Select, Radio, Drawer, Row, Col, Typography, Card, Image, Form, Timeline, Empty} from "antd";
import useTitle from "../../../hooks/useTitle";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";

export default function Feedback() {
    // Hook
    useTitle("All Feedback Order");

    // State
    const [feedbackOrders, setFeedbackOrders]                       = useState([]);
    const [loading, setLoading]                                     = useState(false);
    const [pagination, setPagination]                               = useState({current: 1,pageSize: 25,total: 0});
    const [feedbackDrawerOpen, setFeedbackDrawerOpen]               = useState(false);
    const [form]                                                    = Form.useForm();
    const [selectedNoteRecord, setSelectedNoteRecord]               = useState(null);
    const [messageApi, contextHolder]                               = message.useMessage();
    const [isStatusModalOpen, setIsStatusModalOpen]                 = useState(false);
    const [selectedOrder, setSelectedOrder]                         = useState(null);
    const [newStatus, setNewStatus]                                 = useState("");
    const [statusLoader, setStatusLoader]                           = useState(false);
    const [submitLoading, setSubmitLoading]                         = useState(false);
    const [interactionModalOpen, setInteractionModalOpen]           = useState(false);
    const [selectedInteractionRecord, setSelectedInteractionRecord] = useState(null);
    const [feedbacks, setFeedbacks]                                 = useState([]);

    // Filters State
    const [keyword, setKeyword]             = useState("");
    const [assignedEmp, setAssignedEmp]     = useState(null);
    const [deliveredDate, setDeliveredDate] = useState(null);
    const [quickFilter, setQuickFilter]     = useState("all");
    const [employeeList, setEmployeeList]   = useState([]);
    const [summary, setSummary]             = useState({});
    const [summaryFilter, setSummaryFilter] = useState("total_orders");

    const copyPhoneNo = (phone) => {
        navigator.clipboard.writeText(phone);
        messageApi.open({
            type: "success",
            content: "Phone number copied.",
        });
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;
        const cleaned = phone.replace(/\D/g, "");
        const finalNumber = cleaned.startsWith("880") ? cleaned : `880${cleaned}`;
        window.open(`https://wa.me/${finalNumber}`, "_blank");
    };

    const handleNote = (record) => {
        setSelectedNoteRecord(record);
        form.resetFields();
        setFeedbackDrawerOpen(true);
    };

    const handleStatus = (record) => {
        setSelectedOrder(record);
        setNewStatus(record?.status);
        setIsStatusModalOpen(true);
    };

    const handleInteractionDetails = (record) => {
        setSelectedInteractionRecord(record);
        setInteractionModalOpen(true);
    };

    const getInteractions = (record) => {
        const interactions = record?.interactions;
        if (Array.isArray(interactions)) return interactions;
        if (interactions && typeof interactions === "object") return Object.values(interactions);
        return [];
    };

    // Columns for AntD Table
    const columns = [
        {
            title: "SL",
            key: "sl",
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
            align: "center",
        },
        {
            title: "Invoice",
            dataIndex: "invoice_number",
            key: "invoice_number",
            render: (text, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontWeight: 600, color: "#1677ff", fontSize: "14px" }}>{text || "N/A"}</span>
                    <span style={{ fontSize: 11, color: "#8c8c8c", fontWeight: 600, letterSpacing: "0.2px" }}>Delivered:</span>
                    <span style={{ color: "#595959", fontSize: 12, whiteSpace: "nowrap" }}>
                        {record.delivered_at ? dayjs(record.delivered_at).format("DD MMM YY, hh:mm A") : "N/A"}
                    </span>
                </div>
            ),
        },
        {
            title: "Customer",
            key: "customer",
            render: (_, record) => {
                const name = record.customer_name || "N/A";
                const phone = record.phone_number || "N/A";
                const address = record.customer_address || record.order?.customer_address || "";
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: 600, color: "#262626", fontSize: "14px" }}>{name}</span>
                        <Space size="small">
                            <span style={{ fontSize: "13px", color: "#595959" }}>{phone}</span>
                            {phone !== "N/A" && (
                                <>
                                    <Tooltip title="Copy Phone">
                                        <CopyOutlined style={{ fontSize: 13, color: "#1677ff", cursor: "pointer" }} onClick={() => copyPhoneNo(phone)}/>
                                    </Tooltip>

                                    <Tooltip title="WhatsApp">
                                        <WhatsAppOutlined style={{ fontSize: 13, color: "#25D366", cursor: "pointer" }} onClick={() => openWhatsApp(phone)}/>
                                    </Tooltip>
                                </>
                            )}
                        </Space>
                        {address ? (
                            <Tooltip title={address}>
                                <span style={{ fontSize: "12px", color: "#8c8c8c", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {address}
                                </span>
                            </Tooltip>
                        ) : (
                            <span style={{ fontSize: "12px", color: "#bfbfbf", fontStyle: "italic" }}>No address</span>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Products",
            key: "products",
            render: (_, record) => {
                const products = record.products || [];
                if (products.length === 0) return <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: "13px" }}>No products</span>;
                
                const displayProducts = products.slice(0, 2);
                const remaining = products.length - 2;

                const tooltipContent = (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto", padding: "4px" }}>
                        {products.map((p, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: i !== products.length - 1 ? "1px solid #434343" : "none", paddingBottom: i !== products.length - 1 ? "8px" : "0" }}>
                                {p.image && <img src={p.image} alt={p.name} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: "4px", backgroundColor: "#fff" }} />}
                                <div>
                                    <div style={{ fontSize: "13px", color: "#fff", lineHeight: "1.2" }}>{p.name}</div>
                                    <div style={{ fontSize: "12px", color: "#fa8c16", marginTop: "2px" }}>Qty: {p.quantity}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {displayProducts.map((p, i) => (
                            <div key={i} style={{ fontSize: "13px", color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "220px" }}>
                                <span style={{ color: "#8c8c8c", marginRight: "4px" }}>•</span>
                                {p.name} <span style={{ color: "#1677ff", fontWeight: 500, marginLeft: "4px" }}>x{p.quantity}</span>
                            </div>
                        ))}
                        
                        {products.length > 0 && (
                           <Tooltip title={tooltipContent} color="#262626">
                                <span style={{ color: remaining > 0 ? "#fa8c16" : "#8c8c8c", fontSize: "12px", cursor: "pointer", fontWeight: 500, display: "inline-block", marginTop: "2px" }}>
                                    {remaining > 0 ? `+ ${remaining} more...` : "View details..."}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Order Amount",
            dataIndex: "payable_price",
            key: "payable_price",
            render: (text) => <span style={{ fontWeight: 600, color: "#262626" }}>৳{Number(text || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>,
        },
        {
            title: "Assigned To",
            key: "assigned_to",
            render: (_, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                    {record.employee != null ? (
                        <Tag color="purple" style={{ borderRadius: "10px", padding: "2px 10px", textTransform: "capitalize", margin: 0 }}>
                            {record?.employee?.username}
                        </Tag>
                    ) : (
                        <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: "13px" }}>Unassigned</span>
                    )}
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleInteractionDetails(record)}
                        style={{ fontSize: 12, padding: "0 10px", height: 28 }}
                    >
                        Details
                    </Button>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status, record) => {
                const currentStatus = status || "active";
                const colors = {
                    active     : "green",
                    converted  : "orange",
                    cancelled  : "red",
                    auto_closed: "blue",
                };
                return (
                    <Tag style={{ textTransform: "capitalize", cursor: "pointer", borderRadius: "10px", padding: "2px 12px", fontWeight: 500, fontSize: "13px" }} color={colors[currentStatus] || "default"} onClick={() => handleStatus(record)}>
                        {currentStatus}
                    </Tag>
                );
            },
            align: "center",
        },
        {
            title: "Action",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button type="primary" ghost shape="round" icon={<EditOutlined />} onClick={() => handleNote(record)} size="small" style={{ fontSize: "13px", padding: "0 10px", height: "30px", display: "flex", alignItems: "center" }}>
                        Start Feedback
                    </Button>
                </Space>
            ),
            align: "center",
        },
    ];

    const fetchFeedbackOrders = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            const params = { page, paginate_size: pageSize };

            if (keyword) params.search_key = keyword;
            if (assignedEmp) params.employee_id = assignedEmp;
            if (deliveredDate && deliveredDate[0] && deliveredDate[1]) {
                params.from_date = deliveredDate[0].format("YYYY-MM-DD 00:00:00");
                params.to_date = deliveredDate[1].format("YYYY-MM-DD 23:59:59");
            }
            
            if (quickFilter === "today") {
                params.from_date = dayjs().format("YYYY-MM-DD 00:00:00");
                params.to_date = dayjs().format("YYYY-MM-DD 23:59:59");
            } else if (quickFilter === "this_week") {
                params.from_date = dayjs().startOf("week").format("YYYY-MM-DD 00:00:00");
                params.to_date = dayjs().endOf("week").format("YYYY-MM-DD 23:59:59");
            }

            if (summaryFilter === "today_orders") {
                params.from_date = dayjs().format("YYYY-MM-DD 00:00:00");
                params.to_date = dayjs().format("YYYY-MM-DD 23:59:59");
            } else if (summaryFilter === "active_orders") {
                params.status = "active";
            } else if (summaryFilter === "cancelled_orders") {
                params.status = "cancelled";
            }

            const res = await getDatas("/admin/feedback", params);

            if (res && res.success) {
                setFeedbackOrders(res?.result?.data?.data || []);

                setSummary(res?.result?.summary || {});

                setPagination({
                    current: res?.result?.data?.meta?.current_page,
                    pageSize: res?.result?.data?.meta?.per_page,
                    total: res?.result?.data?.meta?.total,
                });
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch feedback orders");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeList = async () => {
        try {
            const res = await getDatas("/admin/users/list");
            if (res && res.success) {
                setEmployeeList(
                    (res?.result?.data || []).map((u) => ({
                        label: u.username,
                        value: u.id,
                    }))
                );
            }
        } catch (err) {
            console.error("Failed to fetch employee list", err);
        }
    };

    const getFeedbacks = async () => {
        try {
            const res = await getDatas("/admin/customer/feedback", { page: 1, paginate_size: 500 });

            if (res?.success) {
                setFeedbacks(res?.result?.data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchFeedbackOrders(1, pagination.pageSize);
    }, [keyword, assignedEmp, deliveredDate, quickFilter, summaryFilter]);

    useEffect(() => {
        getFeedbacks();
        fetchEmployeeList();
    }, []);

    const handleTableChange = (pag) => {
        fetchFeedbackOrders(pag.current, pag.pageSize);
    };

    const handleFeedbackSubmit = async (values) => {
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            formData.append("_method", "PUT");
            
            if (values.call_status) formData.append("call_status", values.call_status);
            if (values.customer_feedback) formData.append("customer_feedback", values.customer_feedback);
            if (values.rating) formData.append("rating", values.rating);
            if (values.remarks) formData.append("remarks", values.remarks);
            if (values.next_action) formData.append("next_action", values.next_action);
            if (values.next_followup_date) formData.append("next_followup_date", values.next_followup_date.format("YYYY-MM-DD"));

            const res = await postData(`/admin/feedback/${selectedNoteRecord.id}`, formData);

            if(res && res?.success){
                fetchFeedbackOrders(pagination.current, pagination.pageSize);
                
                messageApi.open({
                    type: "success",
                    content: res.msg || "Feedback submitted successfully",
                });
                setFeedbackDrawerOpen(false);
            }
        } catch (err) {
            console.error(err);
            message.error("Something went wrong while submitting feedback");
        } finally {
            setSubmitLoading(false);
        }
    };

    const submitStatus = async () => {
        if (!newStatus || !selectedOrder) return;

        try {
            setStatusLoader(true);

            const res = await postData(`/admin/feedback/${selectedOrder.id}/update-status`, {
                status: newStatus,
            });

            if (res.success) {
                
                messageApi.open({
                    type: "success",
                    content: "Status updated successfully",
                });

                setIsStatusModalOpen(false);

                fetchFeedbackOrders(pagination.current, pagination.pageSize);
            } else {
                message.error(res.msg || "Failed to update status");
            }
        } catch (err) {
            console.error(err);
            message.error("Something went wrong!");
        }finally{
            setStatusLoader(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Feedback Order List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Feedback Order List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ padding: "16px", background: "#fff", borderRadius: "8px", marginBottom: "16px", border: "1px solid #f0f0f0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                <Space wrap size="middle" style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space wrap size="middle">
                        <AntInput.Search allowClear placeholder="Search Invoice / Phone / Name..." onSearch={(val) => setKeyword(val)} style={{ width: 280 }}/>

                        <Select
                            placeholder="Assigned Employee"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            style={{ width: 200 }}
                            value={assignedEmp}
                            onChange={(val) => setAssignedEmp(val)}
                            options={employeeList}
                        />

                        <DatePicker.RangePicker format="YYYY-MM-DD" value={deliveredDate} onChange={(val) => setDeliveredDate(val)}/>
                    </Space>
                    
                    <Space wrap size="middle">
                        <Radio.Group value={quickFilter} onChange={(e) => {
                                const val = e.target.value;
                                setQuickFilter(val);
                                if (val === "all") setSummaryFilter("total_orders");
                                else if (val === "today") setSummaryFilter("today_orders");
                                else setSummaryFilter("total_orders");
                            }} buttonStyle="solid">
                            <Radio.Button value="all">All</Radio.Button>
                            <Radio.Button value="today">Today's Feedback</Radio.Button>
                            <Radio.Button value="this_week">This Week</Radio.Button>
                        </Radio.Group>
                        
                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </Space>
                </Space>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { 
                        key  : "total_orders",
                        label: "Total Orders",
                        value: summary?.all_orders,
                        icon : <ShoppingCartOutlined />,
                        color: "#1677ff",                bg: "#e6f4ff"
                    },
                    { 
                        key  : "today_orders",
                        label: "Today Orders",
                        value: summary?.today_orders,
                        icon : <ClockCircleOutlined />,
                        color: "#52c41a",               bg: "#f6ffed"
                    },
                    { 
                        key  : "active_orders",
                        label: "Total Active",
                        value: summary?.active_orders,
                        icon : <CheckCircleOutlined />,
                        color: "#fa8c16",
                        bg   : "#fff7e6"
                    },
                    { 
                        key  : "cancelled_orders",
                        label: "Total Cancelled",
                        value: summary?.cancelled_orders,
                        icon : <CloseCircleOutlined />,
                        color: "#ff4d4f",
                        bg   : "#fff2f0"
                    },
                ].map((item) => (
                    <Col span={6} key={item.key}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 10,
                                cursor: "pointer",
                                border: summaryFilter === item.key ? `2px solid ${item.color}` : "1px solid #f0f0f0",
                                background: summaryFilter === item.key ? item.bg : "#fff",
                                transition: "all 0.2s",
                            }}
                            styles={{ body: { padding: "20px 24px" } }}
                            onClick={() => {
                                setSummaryFilter(item.key);
                                if (item.key === "total_orders") setQuickFilter("all");
                                else if (item.key === "today_orders") setQuickFilter("today");
                                else setQuickFilter("all");
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <span style={{ fontSize: 13, color: "#8c8c8c", fontWeight: 500 }}>{item.label}</span>
                                    <span style={{ fontSize: 24, fontWeight: 700, color: "#262626" }}>{item.value ?? 0}</span>
                                </div>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: summaryFilter === item.key ? item.color : "#f5f5f5",
                                    fontSize: 22, color: summaryFilter === item.key ? "#fff" : item.color,
                                    transition: "all 0.2s",
                                }}>
                                    {item.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Table rowKey="id" columns={columns} dataSource={feedbackOrders} loading={loading}
                pagination={{ 
                    current: pagination.current, 
                    pageSize: pagination.pageSize, 
                    total: pagination.total, 
                    showSizeChanger: true, 
                    pageSizeOptions: ["25", "50", "100","150","200","250","300","350","400","450","500"]}}
                onChange={handleTableChange}
            />

            <Drawer
                title={<span style={{ fontSize: "16px", fontWeight: 600 }}>Feedback for #{selectedNoteRecord?.invoice_number}</span>}
                width={1100}
                onClose={() => setFeedbackDrawerOpen(false)}
                open={feedbackDrawerOpen}
                styles={{ body: { padding: 0, overflow: "hidden" } }}
            >
                <Row style={{ height: "100%", margin: 0 }}>
                    <Col span={7} style={{ borderRight: "1px solid #f0f0f0", padding: "24px", background: "#fcfcfc", height: "100%", overflowY: "auto" }}>
                        <Typography.Title level={5} style={{ marginTop: 0, color: "#1f1f1f" }}>Customer Details</Typography.Title>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Invoice
                                </div>
                                <div style={{ fontWeight: 600, color: "#1677ff", fontSize: "15px" }}>
                                    {selectedNoteRecord?.invoice_number || "N/A"}
                                </div>
                            </div>

                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Customer Name
                                </div>

                                <div style={{ fontWeight: 500, fontSize: "15px" }}>
                                    {selectedNoteRecord?.customer_name || "N/A"}
                                </div>
                            </div>

                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Phone Number
                                </div>
                                <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                                    {selectedNoteRecord?.phone_number || "N/A"}
                                    {selectedNoteRecord?.phone_number && (
                                        <>
                                            <CopyOutlined style={{ color: "#1677ff", cursor: "pointer" }} onClick={() => copyPhoneNo(selectedNoteRecord.phone_number)}/>
                                            <WhatsAppOutlined style={{ color: "#25D366", cursor: "pointer", fontSize: "16px" }} onClick={() => openWhatsApp(selectedNoteRecord.phone_number)}/>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Address
                                </div>
                                <div style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                                    {selectedNoteRecord?.customer_address || selectedNoteRecord?.order?.customer_address || "N/A"}
                                </div>
                            </div>

                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Delivered At
                                </div>

                                <div style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
                                    {dayjs(selectedNoteRecord?.delivered_at).format("DD MMM, YYYY hh:mm A") || "N/A"}
                                </div>
                            </div>

                            <Divider style={{ margin: "12px 0" }} />

                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Order Amount
                                </div>

                                <div style={{ fontWeight: 600, color: "#fa541c", fontSize: "16px" }}>
                                    ৳{Number(selectedNoteRecord?.payable_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </div>
                            </div>

                            <div>
                                <div style={{ color: "#8c8c8c", fontSize: "13px", marginBottom: "2px" }}>
                                    Delivery Charge
                                </div>

                                <div style={{ fontWeight: 500 }}>
                                    ৳{Number(selectedNoteRecord?.delivery_charge || selectedNoteRecord?.order?.delivery_charge || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </div>
                            </div>
                        </div>
                    </Col>

                    <Col span={9} style={{ borderRight: "1px solid #f0f0f0", padding: "24px", height: "100%", overflowY: "auto", background: "#fff" }}>
                        <Typography.Title level={5} style={{ marginTop: 0, color: "#1f1f1f" }}>Ordered Products</Typography.Title>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
                            {selectedNoteRecord?.products?.map((p, i) => (
                                <Card key={i} size="small" bordered style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)", borderRadius: "8px" }}>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                        {p.image ? (
                                            <Image width={56} height={56} src={p.image} style={{ objectFit: "cover", borderRadius: "6px" }} />
                                        ) : (
                                            <div style={{ width: 56, height: 56, background: "#f0f0f0", borderRadius: "6px" }}></div>
                                        )}
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: "1.2", color: "#262626" }}>
                                                {p.name}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#8c8c8c", fontWeight: 500 }}>
                                                Price: ৳{Number(p.sell_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: "#fa8c16", fontSize: "15px", padding: "0 8px" }}>
                                            x{p.quantity}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {(!selectedNoteRecord?.products || selectedNoteRecord.products.length === 0) && (
                                <div style={{ color: "#bfbfbf", textAlign: "center", marginTop: "40px", fontSize: "14px" }}>No products found</div>
                            )}
                        </div>
                    </Col>

                    <Col span={8} style={{ padding: "24px", height: "100%", overflowY: "auto", background: "#fff", display: "flex", flexDirection: "column" }}>
                        <Typography.Title level={5} style={{ marginTop: 0, color: "#1f1f1f" }}>Feedback Form</Typography.Title>
                        <div style={{ marginTop: "24px", flex: 1 }}>
                            <Form form={form} layout="vertical" onFinish={handleFeedbackSubmit} requiredMark="optional">
                                <Form.Item name="call_status" label={<span style={{fontWeight: 500}}>Call Status</span>} rules={[{ required: true, message: 'Required' }]}>
                                    <Select placeholder="Select Status" size="large" options={[
                                        { value: "answered", label: "Answered" },
                                        { value: "no_answer", label: "No Answer" },
                                        { value: "busy", label: "Busy" },
                                        { value: "switched_off", label: "Switched Off" },
                                        { value: "wrong_number", label: "Wrong Number" },
                                        { value: "call_rejected", label: "Call Rejected" },
                                    ]} />
                                </Form.Item>

                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.call_status !== curr.call_status}>
                                    {({ getFieldValue }) => 
                                        getFieldValue('call_status') === 'answered' ? (
                                            <>
                                                <Form.Item name="customer_feedback" label={<span style={{fontWeight: 500}}>Customer Feedback</span>} rules={[{ required: true, message: 'Required' }]}>
                                                    <Select
                                                        placeholder="Select Customer Feedback"
                                                        size="large"
                                                        showSearch
                                                        optionFilterProp="label"
                                                        options={feedbacks
                                                            .filter((item) => item.status === "active")
                                                            .map((item) => ({
                                                                value: item.title,
                                                                label: item.title,
                                                            }))}
                                                    />
                                                </Form.Item>

                                                <Form.Item name="rating" label={<span style={{fontWeight: 500}}>Product Rating</span>}>
                                                    <Select placeholder="Select Rating" size="large" allowClear options={[1, 2, 3, 4, 5].map(num => ({
                                                        value: num,
                                                        label: (
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fffbe6", color: "#faad14", padding: "2px 10px", borderRadius: "6px", border: "1px solid #ffe58f", fontWeight: 600 }}>
                                                                {num} <StarFilled style={{ fontSize: "14px" }} />
                                                            </span>
                                                        )
                                                    }))} />
                                                </Form.Item>
                                            </>
                                        ) : null
                                    }
                                </Form.Item>

                                <Form.Item name="remarks" label={<span style={{fontWeight: 500}}>Remarks</span>} rules={[{ required: true, message: 'Required' }]}>
                                    <AntInput.TextArea rows={4} placeholder="e.g. Customer is satisfied..." style={{ resize: "none" }} />
                                </Form.Item>

                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.call_status !== curr.call_status}>
                                    {({ getFieldValue }) =>
                                        ['answered', 'no_answer', 'wrong_number'].includes(
                                            getFieldValue('call_status')
                                        ) ? (
                                            <Form.Item name="next_action" label={<span style={{ fontWeight: 500 }}>Next Action</span>}>
                                                <Select
                                                    placeholder="Select Next Action"
                                                    size="large"
                                                    options={[
                                                        { value: "followup", label: "Move to Follow-up" },
                                                        { value: "converted", label: "Converted" },
                                                        { value: "cancelled", label: "Cancelled" },
                                                    ]}
                                                />
                                            </Form.Item>
                                        ) : null
                                    }
                                </Form.Item>

                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.next_action !== curr.next_action || prev.call_status !== curr.call_status}>
                                    {({ getFieldValue }) => 
                                        getFieldValue('call_status') === 'answered' && getFieldValue('next_action') === 'followup' ? (
                                            <Form.Item name="next_followup_date" label={<span style={{fontWeight: 500}}>Next Follow-up Date</span>} rules={[{ required: true, message: 'Required' }]}>
                                                <DatePicker size="large" style={{ width: "100%" }} />
                                            </Form.Item>
                                        ) : null
                                    }
                                </Form.Item>

                                <div style={{ marginTop: "32px", paddingBottom: "24px" }}>
                                    <Button type="primary" htmlType="submit" size="large" block loading={submitLoading} style={{ height: "45px", fontWeight: 600, fontSize: "16px" }}>
                                        Submit Feedback
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Drawer>

            <Modal
                title={null}
                open={interactionModalOpen}
                onCancel={() => setInteractionModalOpen(false)}
                footer={null}
                width={760}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: "24px 28px 8px", borderBottom: "1px solid #f0f0f0", background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)" }}>
                    <Typography.Title level={4} style={{ margin: 0, color: "#1C558B" }}>
                        Interaction Details
                    </Typography.Title>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#595959" }}>
                        <span><strong style={{ color: "#262626" }}>Invoice:</strong> {selectedInteractionRecord?.invoice_number || "N/A"}</span>
                        <span><strong style={{ color: "#262626" }}>Customer:</strong> {selectedInteractionRecord?.customer_name || "N/A"}</span>
                        <span><strong style={{ color: "#262626" }}>Delivered:</strong> {selectedInteractionRecord?.delivered_at ? dayjs(selectedInteractionRecord.delivered_at).format("DD MMM YY, hh:mm A") : "N/A"}</span>
                    </div>
                </div>

                <div style={{ padding: "20px 28px 28px", maxHeight: "65vh", overflowY: "auto", background: "#fafafa" }}>
                    {getInteractions(selectedInteractionRecord).length > 0 ? (
                        <Timeline>
                            {getInteractions(selectedInteractionRecord).map((interaction, index) => (
                                <Timeline.Item
                                    key={interaction.id || index}
                                    color={interaction.call_status === "answered" ? "green" : "red"}
                                >
                                    <Card
                                        size="small"
                                        bordered={false}
                                        style={{ borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                                        styles={{ body: { padding: "14px 16px" } }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                                            <div>
                                                <div style={{ fontSize: 13, color: "#595959", fontWeight: 500 }}>
                                                    {interaction.created_at ? dayjs(interaction.created_at).format("DD MMM, YY hh:mm A") : "N/A"}
                                                </div>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: "#1C558B", marginTop: 4 }}>
                                                    By: {interaction.employee?.username || "Unknown"}
                                                </div>
                                            </div>
                                            <Space wrap size={[6, 6]}>
                                                <Tag color={interaction.call_status === "answered" ? "success" : "volcano"} style={{ textTransform: "capitalize", borderRadius: 12, border: "none", fontWeight: 500, margin: 0 }}>
                                                    {(interaction.call_status || "N/A").replace(/_/g, " ")}
                                                </Tag>
                                                {interaction.customer_feedback && (
                                                    <Tag color="cyan" style={{ borderRadius: 12, border: "none", fontWeight: 500, margin: 0 }}>{interaction.customer_feedback}</Tag>
                                                )}
                                                {interaction.rating && (
                                                    <Tag color="gold" style={{ borderRadius: 12, border: "none", fontWeight: 600, margin: 0 }}>{interaction.rating} <StarFilled style={{ fontSize: 11 }} /></Tag>
                                                )}
                                                {interaction.next_action && (
                                                    <Tag color="purple" style={{ borderRadius: 12, border: "none", fontWeight: 500, margin: 0 }}>Action: {interaction.next_action}</Tag>
                                                )}
                                            </Space>
                                        </div>

                                        {interaction.remarks ? (
                                            <div style={{ color: "#262626", fontSize: 14, lineHeight: 1.6, background: "#f5f5f5", padding: "10px 12px", borderRadius: 8, borderLeft: "3px solid #1C558B" }}>
                                                <span style={{ fontWeight: 600, color: "#8c8c8c", marginRight: 6 }}>Remarks:</span>
                                                {interaction.remarks}
                                            </div>
                                        ) : (
                                            <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: 13 }}>No remarks added</span>
                                        )}

                                        {interaction.next_followup_date && (
                                            <div style={{ marginTop: 10, fontSize: 12, color: "#8c8c8c" }}>
                                                <strong style={{ color: "#595959" }}>Next Follow-up:</strong> {dayjs(interaction.next_followup_date).format("DD MMM, YYYY")}
                                            </div>
                                        )}
                                    </Card>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    ) : (
                        <Empty description="No interactions found" />
                    )}
                </div>
            </Modal>

            <Modal title={`Update Status for Order #${selectedOrder?.order_id || selectedOrder?.id}`} open={isStatusModalOpen} onCancel={() => setIsStatusModalOpen(false)} onOk={submitStatus} loading={statusLoader}>
                <Select  value={newStatus} onChange={(value) => setNewStatus(value)} style={{ width: 200 }}>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
            </Modal>
        </>
    );
}
