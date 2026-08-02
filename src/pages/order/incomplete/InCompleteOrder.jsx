import {ArrowLeftOutlined,ShoppingCartOutlined,WhatsAppOutlined,CopyOutlined,CheckCircleOutlined,DeleteOutlined,ThunderboltOutlined,FireOutlined,ExportOutlined,BarChartOutlined,InfoCircleOutlined,EditOutlined,SwapOutlined,ClockCircleOutlined,CloseCircleOutlined,UnorderedListOutlined} from "@ant-design/icons";
import * as XLSX from "xlsx";
import {Input as AntInput,Breadcrumb,Button,message,DatePicker,Popconfirm,Space,Table,Modal,Tooltip,Image} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./css/incomplete-order.css";
import DeliveryReportModal from "../../../components/order/DeliveryReportModal";

export default function InCompleteOrder() {
    // Hook
    useTitle("All Incomplete Order");

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
    const [orderCounts, setOrderCounts]             = useState({total:0,pending:0,approved:0,canceled:0});
    const [activeStatus, setActiveStatus]           = useState(1);
    const [activePeriod, setActivePeriod]           = useState("week");
    const [recentActivity, setRecentActivity]       = useState([]);
    const [abandonedProducts, setAbandonedProducts] = useState([]);

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
                params.end_date = dayjs(dayjs(dateRange[1])).format("YYYY-MM-DD");
            }

            if (activeStatus) {
                params.status_id = activeStatus;
            }

            const res = await getDatas("/admin/incomplete-orders", params);

            if (res && res?.success) {
                setIncompleteOrders(res.result?.orders?.data || res.result?.orders || []);
                setTotalOrders(res.result?.orders?.total || (res.result?.orders?.length || 0));

                const summary = res?.result?.summary;
                if (summary) {
                    setOrderCounts({
                        total: summary.total_orders,
                        pending: summary?.total_pending,
                        approved: summary?.total_approved,
                        canceled: summary?.total_cancelled
                    });
                }
            }
        } catch (err) {
            console.log(err);
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
                    setTotalOrders(res?.result?.orders_count);

                    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.payable_price || 0),0);
                    
                    setTotalRevenue(totalRevenue);
                }
            }
        };

        getCompleteOrders();

        return () => {
            isMounted = false;
        };
    }, []);

    const accuracyRate = totalOrders > 0 ? ((completeOrders?.length / totalOrders) * 100).toFixed(2) : 0;

    const formatCurrency = (amount) => `৳${Number(amount).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    const stats = 
    [
        {
            key: "incomplete",
            label: "Total Incomplete Orders",
            value: incompleteOrders?.length || 0,
            icon: <ShoppingCartOutlined />,
            colorClass: "io-badge--incomplete",
        },
        {
            key: "recovered",
            label: "Successfully Recovered",
            value: completeOrders?.length || 0,
            icon: <CheckCircleOutlined />,
            colorClass: "io-badge--recovered",
        },
        {
            key: "rate",
            label: "Recovery Rate",
            value: `${accuracyRate}%`,
            icon: <ThunderboltOutlined />,
            colorClass: "io-badge--rate",
        },
        {
            key: "revenue",
            label: "Revenue Recovered",
            value: formatCurrency(totalRevenue),
            icon: <FireOutlined />,
            colorClass: "io-badge--revenue",
        },
    ];

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Products",
            key: "products",
            width: 360,
            render: (_, record) => {
                if (!record?.items?.length) return "N/A";

                return (
                    <div>
                        {record.items.map((item, index) => {
                            const product = item?.product;

                            if (!product) return "N/A";

                            const variations = [item?.attribute_value_1, item?.attribute_value_2, item?.attribute_value_3].filter(val => val && typeof val === "string");

                            return (
                                <div key={index} className="io-product-item">
                                    <Image src={product?.image} alt={product?.name || "Product"} width={40} height={50} className="io-product-item__img" preview={{ mask: "Preview" }}/>

                                    <div>
                                        <div className="io-product-item__name">
                                            {product?.name || "N/A"}
                                        </div>

                                        {variations.length > 0 && (
                                            <div className="io-product-item__variation">
                                                Variation: {variations.join(" / ")}
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
            title: "Name",
            dataIndex: "name",
            key: "name",
            width:140,
            render: (name) => <span className="io-customer-name">{name || "N/A"}</span>,
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number",
            render: (text) => (
                <div className="io-phone-cell">
                    <span className="io-phone-cell__number">{text}</span>

                    <Tooltip title="Copy Phone Number.">
                        <CopyOutlined className="io-icon-btn io-icon-btn--copy" onClick={() => copyPhoneNo(text)}/>
                    </Tooltip>

                    <Tooltip title="WhatsApp">
                        <WhatsAppOutlined className="io-icon-btn io-icon-btn--whatsapp" onClick={() => openWhatsApp(text)}/>
                    </Tooltip>

                    <Tooltip title="View delivery report">
                        <InfoCircleOutlined className="io-icon-btn io-icon-btn--info" onClick={() => handleOpenModal(text)}/>
                    </Tooltip>
                </div>
            ),
            width:250
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
            render: (address) => <span className="io-address-cell">{address || "N/A"}</span>,
        },
        {
            title: "Ip Address",
            dataIndex: "ip_address",
            key: "ip_address",
            render: (ip) => <span className="io-meta-cell">{ip || "N/A"}</span>,
        },
        {
            title: "Created_at",
            dataIndex: "created_at",
            key: "created_at",
            render: (created_at) => (
                <span className="io-date-cell">
                    {created_at ? dayjs(created_at).format("MMMM DD, YYYY hh:mm:ss A") : "N/A"}
                </span>
            ),
            width:150
        },
        {
            title: "Status",
            key: "status",
            render: (_, record) => (
                <span className="io-status-pill">
                    {record.status?.name || "N/A"}
                </span>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 140,
            align: "center",
            render: (_, record) => (
                <Space size={6}>
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
            console.log(err);
            message.error("Failed to copy phone number");
        }
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;

        let formattedPhone = phone.replace(/\D/g, "");

        if (!formattedPhone.startsWith("88")) {
            formattedPhone = "88" + formattedPhone;
        }

        const whatsappUrl = `https://wa.me/${formattedPhone}`;
        window.open(whatsappUrl, "_blank");
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

        const res = await getDatas("/admin/incomplete/order/reports");

        if (res && res.success) {
            const data = res.result;

            setAbandonedProducts(data.products || []);

            setRecentActivity([
                {
                    title: "Today",
                    new: data.today_orders,
                    converted: data.today_converted_orders,
                },
                {
                    title: "Yesterday",
                    new: data.yesterday_orders,
                    converted: data.yesterday_converted_orders,
                },
                {
                    title: "Last 7 Days",
                    new: data.this_week_orders,
                    converted: data.this_week_converted_orders,
                },
            ]);
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

            await new Promise((resolve) => setTimeout(resolve, 500));

            const worksheet = XLSX.utils.json_to_sheet(incompleteOrders);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

            XLSX.writeFile(workbook, "exported_data.csv");
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setCsvLoader(false);
        }
    };

    const statusFilters = [
        { key: null, label: "Total", count: orderCounts.total, icon: <UnorderedListOutlined /> },
        { key: 1, label: "Pending", count: orderCounts.pending, icon: <ClockCircleOutlined /> },
        { key: 3, label: "Approved", count: orderCounts.approved, icon: <CheckCircleOutlined /> },
        { key: 8, label: "Canceled", count: orderCounts.canceled, icon: <CloseCircleOutlined />, danger: true },
    ];

    return (
        <>
            {contextHolder}
            <div className="io-page">
                <div className="pagehead">
                    <div className="head-left">
                        <h1 className="title">Incomplete Orders</h1>
                        <p className="subtitle">Track abandoned carts and recover lost sales</p>
                    </div>
                    <div className="head-actions">
                        <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Incomplete Orders" }]}/>
                    </div>
                </div>

                <div className="io-toolbar">
                    <AntInput.Search
                        allowClear
                        className="io-toolbar__search"
                        placeholder="Search by Invoice / Phone / Name"
                        onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                    />
                    <div className="io-toolbar__actions">
                        <Button className="io-btn-ghost-brand" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </div>
                </div>

                <div className="io-filters-row">
                    <Space wrap>
                        <DatePicker.RangePicker
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates)}
                            format="YYYY-MM-DD"
                            placeholder={["Start Date", "End Date"]}
                        />
                        <Button onClick={() => setDateRange(null)}>Clear Dates</Button>
                    </Space>

                    <div className="io-bulk-actions">
                        <Button icon={<DeleteOutlined />} danger disabled={selectedOrders?.length === 0} onClick={() => handleBulkDelete()}>
                            Bulk Delete
                        </Button>

                        <Tooltip title="Show Trash">
                            <Button danger icon={<DeleteOutlined />} onClick={() => navigate("/incomplete/orders-trash")}>
                                Show Trash
                            </Button>
                        </Tooltip>

                        <Button icon={<ExportOutlined />} onClick={handleExport}>
                            {csvLoader ? "Exporting..." : "Export CSV"}
                        </Button>

                        <Button className="io-btn-primary" icon={<BarChartOutlined />} onClick={handleStatistics}>
                            Statistics
                        </Button>
                    </div>
                </div>

                <div className="io-status-grid">
                    {statusFilters.map(({ key, label, count, icon, danger }) => (
                        <button
                            key={String(key)}
                            type="button"
                            className={`io-status-card${activeStatus === key ? " io-status-card--active" : ""}${danger ? " io-status-card--danger" : ""}`}
                            onClick={() => setActiveStatus(key)}
                        >
                            <div>
                                <div className="io-status-card__label">{label}</div>
                                <div className="io-status-card__value">{count ?? 0}</div>
                            </div>
                            <div className="io-status-card__icon">{icon}</div>
                        </button>
                    ))}
                </div>

                {selectedRowKeys.length > 0 && (
                    <div className="io-selection-bar">
                        <Space>
                            <span className="io-selection-bar__count">{selectedRowKeys.length} selected</span>
                            <span className="io-selection-bar__hint">Bulk actions apply to selected rows</span>
                        </Space>
                        <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedOrders([]); }}>
                            Clear selection
                        </Button>
                    </div>
                )}

                <div className="io-table-card">
                    <Table
                        bordered
                        loading={loading}
                        columns={columns}
                        dataSource={filteredOrders}
                        rowSelection={rowSelection}
                        rowKey="id"
                        scroll={{ x: 1200 }}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: totalOrders,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50", "100"],
                            showQuickJumper: true,
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            },
                            showTotal: (total, range) =>
                                `${range[0]}–${range[1]} of ${total} items`,
                        }}
                    />
                </div>
            </div>

            <Modal title="Incomplete Order Statistics" open={isModalOpen} onOk={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} className="io-modal" width={1000}>
                <div className="io-cards">
                    {stats.map((s) => (
                        <div key={s.key} className="io-card">
                            <div className={`io-badge ${s.colorClass}`}>{s.icon}</div>
                            <div className="io-card-body">
                                <div className="io-card-label">{s.label}</div>
                                <div className="io-card-value">{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="recent-activity-container">
                    <h4>
                        <ThunderboltOutlined /> Recent Activity
                    </h4>

                    <div className="activity-buttons">
                        <Button size="small" type={activePeriod === "week" ? "primary" : "default"} onClick={handleWeekClick}>Last 7 Days</Button>
                        <Button size="small" type={activePeriod === "month" ? "primary" : "default"} onClick={handleMonthClick}>
                        Last 30 Days
                        </Button>
                    </div>

                    <div className="activity-stats">
                        {recentActivity.map((item, index) => (
                            <div key={index} className="activity-card">
                                <p>{item.title}</p>
                                <p>
                                    New: <span className="new">{item.new}</span>
                                </p>
                                <p>
                                    Converted: <span className="converted">{item.converted}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="abandoned-products-container mb-4">
                    <h4>
                        <ShoppingCartOutlined /> Top 10 Abandoned Products
                    </h4>

                    <div className="product-list">
                        {abandonedProducts.map((product, index) => (
                            <div key={index} className="product-item">
                                <img src={product.img_path} alt={product.name} />
                                <span>{product.name}</span>
                                <span className="badge">{product.incomplete_order_count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <DeliveryReportModal visible={modalVisible} phoneNumber={selectedPhone} onClose={handleCloseModal}/>
        </>
    )
}
