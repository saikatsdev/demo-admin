import { ArrowLeftOutlined,ShoppingCartOutlined,WhatsAppOutlined,CopyOutlined,CheckCircleOutlined,DeleteOutlined,ThunderboltOutlined,FireOutlined,ExportOutlined,BarChartOutlined,InfoCircleOutlined,EditOutlined,SwapOutlined,ClockCircleOutlined,CloseCircleOutlined,UnorderedListOutlined,SearchOutlined,FilterOutlined,CalendarOutlined,ReloadOutlined} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { Input, Breadcrumb, Button, message, DatePicker, Popconfirm, Space, Table, Modal, Tooltip, Image, Select, Tag, Typography, Badge, Row, Col, Divider, Spin } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "../../report/report.css";
import "./css/incomplete-order.css";
import DeliveryReportModal from "../../../components/order/DeliveryReportModal";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function InCompleteOrder() {
    // Hook
    useTitle("All Incomplete Orders");

    // State
    const [incompleteOrders, setIncompleteOrders]   = useState([]);
    const [loading, setLoading]                     = useState(false);
    const [messageApi, contextHolder]               = message.useMessage();
    const [isModalOpen, setIsModalOpen]             = useState(false);
    const [modalVisible, setModalVisible]           = useState(false);
    const [selectedPhone, setSelectedPhone]         = useState(null);
    const [completeOrders, setCompleteOrders]       = useState([]);
    const [totalOrders, setTotalOrders]             = useState(0);
    const [totalRevenue, setTotalRevenue]           = useState(0);
    const [selectedRowKeys, setSelectedRowKeys]     = useState([]);
    const [selectedOrders, setSelectedOrders]       = useState([]);
    const [csvLoader, setCsvLoader]                 = useState(false);
    const [dateRange, setDateRange]                 = useState(null);
    const [currentPage, setCurrentPage]             = useState(1);
    const [pageSize, setPageSize]                   = useState(10);
    const [orderCounts, setOrderCounts]             = useState({ total: 0, pending: 0, approved: 0, canceled: 0 });
    const [activeStatus, setActiveStatus]           = useState(1);
    const [activePeriod, setActivePeriod]           = useState("week");
    const [recentActivity, setRecentActivity]       = useState([]);
    const [abandonedProducts, setAbandonedProducts] = useState([]);
    const [statsSummary, setStatsSummary]           = useState(null);
    const [statsLoading, setStatsLoading]           = useState(false);

    const [searchText, setSearchText]               = useState("");

    // Variable
    const navigate = useNavigate();

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys, selectedRows) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedOrders(selectedRows);
        },
        getCheckboxProps: (record) => ({
            disabled: record.status?.name === "Delivered",
        }),
    };

    const fetchIncompleteOrders = async () => {
        setLoading(true);

        try {
            const params = {
                search_key: searchText,
                page: currentPage,
                per_page: pageSize,
            };

            if (dateRange?.[0] && dateRange?.[1]) {
                params.start_date = dayjs(dateRange[0]).format("YYYY-MM-DD");
                params.end_date = dayjs(dateRange[1]).format("YYYY-MM-DD");
            }

            if (activeStatus != null) {
                params.status_id = activeStatus;
            }

            const res = await getDatas("/admin/incomplete-orders", params);

            if (res && res?.success) {
                setIncompleteOrders(res.result?.orders?.data || res.result?.orders || []);
                setTotalOrders(res.result?.orders?.total || (res.result?.orders?.length || 0));

                const summary = res?.result?.summary;
                if (summary) {
                    setOrderCounts({
                        total: summary.total_orders || 0,
                        pending: summary?.total_pending || 0,
                        approved: summary?.total_approved || 0,
                        canceled: summary?.total_cancelled || 0
                    });
                }
            }
        } catch (err) {
            console.error(err);
            message.error("Error fetching incomplete orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncompleteOrders();
    }, [dateRange, activeStatus, searchText, currentPage, pageSize]);

    const filteredOrders = incompleteOrders.filter((order) => {
        if (!searchText) return true;
        const key = searchText.toLowerCase();
        return (
            order?.invoice_number?.toLowerCase().includes(key) ||
            order?.phone_number?.toLowerCase().includes(key) ||
            order?.name?.toLowerCase().includes(key) ||
            order?.customer_name?.toLowerCase().includes(key)
        );
    });

    useEffect(() => {
        let isMounted = true;

        const getCompleteOrders = async () => {
            const res = await getDatas("/admin/orders", { current_status_id: 7 });

            if (res && res.success) {
                if (isMounted) {
                    const orders = res?.result?.data || [];
                    setCompleteOrders(orders);
                    setTotalOrders(res?.result?.orders_count || orders.length);
                    const revenue = orders.reduce((sum, order) => sum + parseFloat(order.payable_price || 0), 0);
                    setTotalRevenue(revenue);
                }
            }
        };

        getCompleteOrders();

        return () => {
            isMounted = false;
        };
    }, []);

    const accuracyRate = totalOrders > 0 ? ((completeOrders?.length / totalOrders) * 100).toFixed(2) : 0;
    const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const columns = [
        {
            title: "#",
            key: "sl",
            width: 55,
            align: "center",
            fixed: "left",
            render: (_, __, index) => (
                <span className="sl-badge">
                    {(currentPage - 1) * pageSize + index + 1}
                </span>
            ),
        },
        {
            title: "Products",
            key: "products",
            width: 320,
            fixed: "left",
            render: (_, record) => {
                if (!record?.items?.length) return <Text type="secondary">N/A</Text>;

                return (
                    <div>
                        {record.items.map((item, index) => {
                            const product = item?.product;
                            if (!product) return null;

                            const variations = [item?.attribute_value_1, item?.attribute_value_2, item?.attribute_value_3].filter(val => val && typeof val === "string");

                            return (
                                <div key={index} className="io-product-item">
                                    <Image src={product?.image} alt={product?.name || "Product"} width={38} height={46} className="io-product-item__img" preview={{ mask: "View" }} />
                                    <div>
                                        <Text strong className="io-product-item__name">
                                            {product?.name || "N/A"}
                                        </Text>
                                        {variations.length > 0 && (
                                            <div className="io-product-item__variation">
                                                Var: {variations.join(" / ")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            title: "Customer Name",
            dataIndex: "name",
            key: "name",
            width: 140,
            render: (name) => <span className="io-customer-name">{name || "N/A"}</span>,
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number",
            width: 220,
            render: (text) => (
                <div className="io-phone-cell">
                    <span className="io-phone-cell__number">{text || "N/A"}</span>
                    {text && (
                        <>
                            <Tooltip title="Copy Phone Number">
                                <CopyOutlined className="io-icon-btn io-icon-btn--copy" onClick={() => copyPhoneNo(text)}/>
                            </Tooltip>

                            <Tooltip title="WhatsApp">
                                <WhatsAppOutlined className="io-icon-btn io-icon-btn--whatsapp" onClick={() => openWhatsApp(text)}/>
                            </Tooltip>

                            <Tooltip title="Delivery Report">
                                <InfoCircleOutlined className="io-icon-btn io-icon-btn--info" onClick={() => handleOpenModal(text)}/>
                            </Tooltip>
                        </>
                    )}
                </div>
            ),
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
            width: 180,
            render: (address) => <span className="io-address-cell">{address || "N/A"}</span>,
        },
        {
            title: "IP Address",
            dataIndex: "ip_address",
            key: "ip_address",
            width: 120,
            render: (ip) => <span className="io-meta-cell">{ip || "N/A"}</span>,
        },
        {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            width: 160,
            render: (created_at) => (
                <span className="io-date-cell">
                    {created_at ? dayjs(created_at).format("DD MMM YYYY, hh:mm A") : "N/A"}
                </span>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 110,
            align: "center",
            render: (_, record) => (
                <Tag color={record.status?.name === 'Approved' ? 'success' : record.status?.name === 'Canceled' ? 'error' : 'processing'} style={{ margin: 0, borderRadius: 10, fontWeight: 700, fontSize: 11 }}>
                    {record.status?.name || "Pending"}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 130,
            align: "center",
            fixed: "right",
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Edit Order">
                        <Button size="small" type="text" className="io-action-btn io-action-btn--edit" icon={<EditOutlined />} onClick={() => onEdit(record.id)} />
                    </Tooltip>

                    <Tooltip title="Convert to Order">
                        <Button size="small" type="text" className="io-action-btn io-action-btn--convert" icon={<SwapOutlined />} onClick={() => handleOrder(record)} />
                    </Tooltip>

                    <Tooltip title="Delete Order">
                        <Popconfirm title="Delete Order?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                            <Button size="small" type="text" danger className="io-action-btn io-action-btn--delete" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const copyPhoneNo = async (phoneNumber) => {
        if (!phoneNumber) return;
        try {
            await navigator.clipboard.writeText(phoneNumber);
            messageApi.open({
                type: "success",
                content: "Phone Number Copied",
            });
        } catch (err) {
            console.error(err);
            message.error("Failed to copy phone number");
        }
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;
        let formattedPhone = phone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("88")) {
            formattedPhone = "88" + formattedPhone;
        }
        window.open(`https://wa.me/${formattedPhone}`, "_blank");
    };

    const handleOpenModal = (phoneNumber) => {
        setSelectedPhone(phoneNumber);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedPhone(null);
    };

    const onEdit = (id) => {
        navigate(`/edit/incomplete-order/${id}`);
    };

    const handleStatistics = async () => {
        setIsModalOpen(true);
        setStatsLoading(true);

        try {
            let res = await getDatas("/admin/order/reports/incomplete");
            if (!res || !res.success) {
                res = await getDatas("/admin/incomplete/order/reports");
            }

            if (res && res.success && res.result) {
                const data = res.result;
                setStatsSummary(data.summary || null);
                setAbandonedProducts(data.top_abandoned_products || data.products || []);

                const pb = data.period_breakdown || {};

                setRecentActivity([
                    {
                        title: "Today",
                        new: data.today_orders ?? pb.today?.incomplete_orders ?? 0,
                        converted: data.today_converted_orders ?? pb.today?.converted_orders ?? 0,
                        revenue: pb.today?.converted_revenue ?? 0,
                    },
                    {
                        title: "Yesterday",
                        new: data.yesterday_orders ?? pb.yesterday?.incomplete_orders ?? 0,
                        converted: data.yesterday_converted_orders ?? pb.yesterday?.converted_orders ?? 0,
                        revenue: pb.yesterday?.converted_revenue ?? 0,
                    },
                    {
                        title: "Last 7 Days (This Week)",
                        new: data.this_week_orders ?? pb.this_week?.incomplete_orders ?? 0,
                        converted: data.this_week_converted_orders ?? pb.this_week?.converted_orders ?? 0,
                        revenue: pb.this_week?.converted_revenue ?? 0,
                    },
                    {
                        title: "Last 30 Days (This Month)",
                        new: data.this_month_orders ?? pb.this_month?.incomplete_orders ?? 0,
                        converted: data.this_month_converted_orders ?? pb.this_month?.converted_orders ?? 0,
                        revenue: pb.this_month?.converted_revenue ?? 0,
                    },
                ]);
            }
        } catch (err) {
            console.error("Error fetching statistics:", err);
            message.error("Failed to load statistics report");
        } finally {
            setStatsLoading(false);
        }
    };

    const handleOrder = async (record) => {
        setLoading(true);
        const res = await getDatas(`/admin/incomplete-orders/${record.id}`);

        if (res && res?.success) {
            const itemsWithVariations = res.result.items.map(item => {
                const variations = [
                    item.attribute_value_1,
                    item.attribute_value_2,
                    item.attribute_value_3
                ].filter(Boolean);

                return {
                    ...item,
                    variations
                };
            });

            const orderData = {
                id           : record.id,
                name         : record.name,
                phone_number : record.phone_number,
                address      : record.address,
                status       : record.status,
                items        : itemsWithVariations,
                is_incomplete: 1
            };            

            setLoading(false);
            navigate("/order-add", { state: orderData });
        }
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/incomplete-orders/${id}`);
        if (res && res?.success) {
            message.success(res?.msg || "Order moved to trash");
            fetchIncompleteOrders();
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedOrders?.length) {
            alert("Please select at least one order.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${selectedOrders.length} orders?`
        );

        if (!confirmDelete) return;

        try {
            const orderIds = selectedOrders.map(o => o.id);
            const res = await postData("/admin/incomplete-orders/bulk-delete", {
                ids: orderIds,
            });

            if (res.success) {
                messageApi.open({
                    type: "success",
                    content: "Orders deleted successfully.",
                    duration: 1.5,
                    onClose: () => {
                        setSelectedRowKeys([]);
                        fetchIncompleteOrders();
                    },
                });
            } else {
                message.error("Bulk delete failed.");
            }
        } catch (err) {
            message.error("Something went wrong!", err);
        }
    };

    const handleWeekClick = () => {
        setActivePeriod("week");
    };

    const handleMonthClick = () => {
        setActivePeriod("month");
    };

    const handleExport = async () => {
        if (!incompleteOrders || incompleteOrders?.length === 0) {
            alert("No data to export!");
            return;
        }

        try {
            setCsvLoader(true);
            await new Promise((resolve) => setTimeout(resolve, 300));

            const worksheet = XLSX.utils.json_to_sheet(incompleteOrders);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
            XLSX.writeFile(workbook, `Incomplete_Orders_${dayjs().format('YYYY-MM-DD')}.csv`);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setCsvLoader(false);
        }
    };

    const modalStatsList = [
        {
            key: "incomplete",
            label: "Total Incomplete Orders",
            value: statsSummary?.total_incomplete_orders ?? (incompleteOrders?.length || 0),
            subtext: `Total Attempts: ${statsSummary?.total_attempts ?? 0}`,
            icon: <ShoppingCartOutlined />,
            colorClass: "io-badge--incomplete",
        },
        {
            key: "recovered",
            label: "Total Converted Orders",
            value: statsSummary?.total_converted_orders ?? (completeOrders?.length || 0),
            subtext: `Attempt Conv: ${statsSummary?.conversion_rate_of_total_attempts ?? 0}%`,
            icon: <CheckCircleOutlined />,
            colorClass: "io-badge--recovered",
        },
        {
            key: "rate",
            label: "Conversion Rate",
            value: `${statsSummary?.conversion_rate ?? accuracyRate}%`,
            subtext: `Attempt Conv: ${statsSummary?.conversion_rate_of_total_attempts ?? 0}%`,
            icon: <ThunderboltOutlined />,
            colorClass: "io-badge--rate",
        },
        {
            key: "revenue",
            label: "Converted Revenue",
            value: formatCurrency(statsSummary?.converted_order_revenue ?? totalRevenue),
            subtext: `Avg Order Val: ${formatCurrency(statsSummary?.average_converted_order_value ?? 0)}`,
            icon: <FireOutlined />,
            colorClass: "io-badge--revenue",
        },
    ];

    const filteredRecentActivity = activePeriod === "week"
        ? recentActivity.filter(a => a.title.includes("Today") || a.title.includes("Yesterday") || a.title.includes("7 Days"))
        : recentActivity;

    return (
        <>
            {contextHolder}
            <div className="io-page">
                {/* Header Top Bar */}
                <div className="topBar no-print flex-between">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                                Incomplete Orders
                            </Title>
                            <Badge count={`${(orderCounts.total || totalOrders || 0).toLocaleString()} Orders`} style={{ backgroundColor: '#1c558b' }}/>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Track abandoned carts and recover lost sales
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Incomplete Orders" }]}/>
                    </div>
                </div>

                <Divider className="no-print" style={{ margin: '14px 0' }} />

                {/* Metric Summary Cards */}
                <div className="no-print" style={{ marginBottom: 16 }}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Incomplete Orders</span>
                                        <div className="mini-card-val">
                                            {(incompleteOrders?.length || totalOrders || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Pending {orderCounts.pending || 0}</span>
                                    <span className="footer-pill red">Canceled {orderCounts.canceled || 0}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <CheckCircleOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Recovered Orders</span>
                                            <span className="mini-badge-pill">{accuracyRate}% Rate</span>
                                        </div>
                                        <div className="mini-card-val text-green">
                                            {completeOrders?.length || 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Success {completeOrders?.length || 0}</span>
                                    <span className="footer-pill">Total {totalOrders || 0}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <ThunderboltOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Recovery Accuracy</span>
                                        <div className="mini-card-val">
                                            {accuracyRate}%
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">{completeOrders?.length || 0} Recovered</span>
                                    <span className="footer-pill">Of {totalOrders || 0} Total</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <FireOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Recovered Revenue</span>
                                        <div className="mini-card-val text-green">
                                            {formatCurrency(totalRevenue)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Total {formatCurrency(totalRevenue)}</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* SINGLE-LINE FILTER TOOLBAR */}
                <div className="filter-toolbar no-print">
                    <Space wrap size="middle" align="center">
                        {/* Search Input */}
                        <Input 
                            placeholder="Search Invoice / Phone / Name..." 
                            allowClear 
                            value={searchText} 
                            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} 
                            className="search-input" 
                            style={{ width: 260 }}
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        />

                        {/* Status Select Filter */}
                        <Select 
                            placeholder="Filter Status" 
                            value={activeStatus} 
                            style={{ width: 160 }} 
                            onChange={(val) => { setActiveStatus(val); setCurrentPage(1); }}
                            allowClear
                            suffixIcon={<FilterOutlined style={{ color: '#94a3b8' }} />}
                        >
                            <Option value={null}>All Statuses ({orderCounts.total || 0})</Option>
                            <Option value={1}>Pending ({orderCounts.pending || 0})</Option>
                            <Option value={3}>Approved ({orderCounts.approved || 0})</Option>
                            <Option value={8}>Canceled ({orderCounts.canceled || 0})</Option>
                        </Select>

                        {/* Date Range Picker */}
                        <RangePicker 
                            value={dateRange} 
                            onChange={(dates) => { setDateRange(dates); setCurrentPage(1); }} 
                            allowClear 
                            style={{ width: 240 }} 
                        />

                        {/* Reset / Clear Filters Button */}
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => {
                                setSearchText("");
                                setActiveStatus(null);
                                setDateRange(null);
                                setCurrentPage(1);
                                setSelectedRowKeys([]);
                                setSelectedOrders([]);
                            }} 
                            className="reset-btn"
                        >
                            Reset
                        </Button>
                    </Space>

                    <Space size="middle" align="center" className="export-actions" wrap>
                        {selectedRowKeys.length > 0 && (
                            <Button 
                                icon={<DeleteOutlined />} 
                                danger 
                                onClick={handleBulkDelete}
                            >
                                Bulk Delete ({selectedRowKeys.length})
                            </Button>
                        )}

                        <Button 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => navigate("/incomplete/orders-trash")}
                        >
                            Show Trash
                        </Button>

                        <Button 
                            type="primary" 
                            icon={<ExportOutlined />} 
                            onClick={handleExport} 
                            className="btn-csv"
                        >
                            {csvLoader ? "Exporting..." : "Export CSV"}
                        </Button>

                        <Button 
                            type="primary" 
                            icon={<BarChartOutlined />} 
                            onClick={handleStatistics} 
                            style={{ background: '#1c558b', borderColor: '#1c558b' }}
                        >
                            Statistics
                        </Button>

                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => window.history.back()} 
                            className="back-btn"
                        >
                            Back
                        </Button>
                    </Space>
                </div>

                {/* Selection Bar */}
                {selectedRowKeys.length > 0 && (
                    <div className="io-selection-bar no-print">
                        <Space>
                            <span className="io-selection-bar__count">{selectedRowKeys.length} selected</span>
                            <span className="io-selection-bar__hint">Bulk actions apply to selected rows</span>
                        </Space>
                        <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedOrders([]); }}>
                            Clear selection
                        </Button>
                    </div>
                )}

                {/* Orders Table */}
                <div className="printable order-table-container">
                    <Table
                        bordered
                        loading={loading}
                        columns={columns}
                        dataSource={filteredOrders}
                        rowSelection={rowSelection}
                        rowKey="id"
                        scroll={{ x: 1300 }}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: totalOrders,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "25", "50", "100"],
                            showQuickJumper: true,
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            },
                            showTotal: (total, range) =>
                                `Showing ${range[0]}–${range[1]} of ${total} incomplete orders`,
                        }}
                        className="order-intelligence-table"
                    />
                </div>
            </div>

            {/* Statistics Modal */}
            <Modal 
                title="Incomplete Order Statistics" 
                open={isModalOpen} 
                onOk={() => setIsModalOpen(false)} 
                onCancel={() => setIsModalOpen(false)} 
                className="io-modal" 
                width={1000}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>
                        Close
                    </Button>
                ]}
            >
                <Spin spinning={statsLoading}>
                    {/* Summary Cards */}
                    <div className="io-cards">
                        {modalStatsList.map((s) => (
                            <div key={s.key} className="io-card">
                                <div className={`io-badge ${s.colorClass}`}>{s.icon}</div>
                                <div className="io-card-body">
                                    <div className="io-card-label">{s.label}</div>
                                    <div className="io-card-value">{s.value}</div>
                                    {s.subtext && (
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                            {s.subtext}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity Section */}
                    <div className="recent-activity-container">
                        <h4>
                            <ThunderboltOutlined /> Recent Activity
                        </h4>

                        <div className="activity-buttons">
                            <Button size="small" type={activePeriod === "week" ? "primary" : "default"} onClick={handleWeekClick}>
                                Last 7 Days
                            </Button>
                            <Button size="small" type={activePeriod === "month" ? "primary" : "default"} onClick={handleMonthClick}>
                                Last 30 Days
                            </Button>
                        </div>

                        <div className="activity-stats">
                            {(filteredRecentActivity.length > 0 ? filteredRecentActivity : recentActivity).map((item, index) => (
                                <div key={index} className="activity-card">
                                    <p>{item.title}</p>
                                    <p>
                                        Incomplete: <span className="new">{item.new}</span>
                                    </p>
                                    <p>
                                        Converted: <span className="converted">{item.converted}</span>
                                    </p>
                                    {item.revenue != null && item.revenue > 0 && (
                                        <p style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                                            Rev: ৳{Number(item.revenue).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Abandoned Products Section */}
                    <div className="abandoned-products-container mb-4" style={{ marginTop: 24 }}>
                        <h4>
                            <ShoppingCartOutlined /> Top Abandoned Products ({abandonedProducts.length})
                        </h4>

                        <div className="product-list">
                            {abandonedProducts.map((product, index) => {
                                const count = product.period_abandoned_count ?? product.total_abandoned_items ?? product.incomplete_order_count ?? 0;
                                return (
                                    <div key={product.id || index} className="product-item">
                                        <img 
                                            src={product.img_path} 
                                            alt={product.name} 
                                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                                {product.name}
                                            </span>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: '#64748b' }}>
                                                <span>SKU: {product.sku || 'N/A'}</span>
                                                {product.current_stock != null && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Stock: {product.current_stock}</span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span>Price: ৳{Number(product.sell_price || product.mrp || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className="badge" style={{ background: '#1c558b', color: '#fff', padding: '4px 10px', borderRadius: 12, fontWeight: 700, fontSize: 11 }}>
                                            {count} Abandoned
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Spin>
            </Modal>

            <DeliveryReportModal visible={modalVisible} phoneNumber={selectedPhone} onClose={handleCloseModal}/>
        </>
    );
}
