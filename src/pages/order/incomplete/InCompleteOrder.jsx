import {ArrowLeftOutlined,ShoppingCartOutlined,CheckCircleOutlined,DeleteOutlined,ThunderboltOutlined,FireOutlined,ExportOutlined,BarChartOutlined,InfoCircleOutlined} from "@ant-design/icons";
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
    const [showTrash, setShowTrash]                 = useState(false);
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
            const params = {};

            if (dateRange?.[0] && dateRange?.[1]) {
                params.start_date = dayjs(dateRange[0]).format("YYYY-MM-DD");
                params.end_date = dayjs(dateRange[1]).format("YYYY-MM-DD");
            }

            if (activeStatus) {
                params.status_id = activeStatus;
            }

            if (showTrash) {
                params.trash = 1;
                params.status_id = null;
            }

            const res = await getDatas("/admin/incomplete-orders", params);

            if (res && res?.success) {
                setIncompleteOrders(res.result?.orders?.data || []);

                const summary = res?.result?.summary;

                setOrderCounts({total:summary.total_orders,pending:summary?.total_pending,approved:summary?.total_approved, canceled:summary?.total_cancelled});
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
    }, [dateRange, activeStatus, showTrash]);

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

                    const totalRevenue = orders.reduce(
                        (sum, order) => sum + parseFloat(order.payable_price || 0),
                        0
                    );
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
                                <div key={index} style={{display: "flex",gap: 10,marginBottom: 8,paddingBottom: 8,borderBottom: index !== record.items.length - 1 ? "1px dashed #ddd" : "none"}}>
                                    <Image src={product?.image} alt={product?.name || "Product"} width={40} height={50} style={{ objectFit: "cover", borderRadius: 4 }} preview={{ mask: "Preview" }}/>

                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {product?.name || "N/A"}
                                        </div>

                                        {variations.length > 0 && (
                                            <div style={{ fontSize: 12, color: "#666" }}>
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
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number",
            render: (text) => (
                <Space>
                    {text}
                    <InfoCircleOutlined style={{ color: "#1C558B", cursor: "pointer" }} onClick={() => handleOpenModal(text)}/>
                </Space>
            ),
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
        },
        {
            title: "Ip Address",
            dataIndex: "ip_address",
            key: "ip_address",
        },
        {
            title: "Created_at",
            dataIndex: "created_at",
            key: "created_at",
            render: (created_at) => created_at ? dayjs(created_at).format("MMMM DD, YYYY hh:mm:ss A") : "N/A",
        },
        {
            title: "Status",
            key: "status",
            render: (_, record) => (
                <span style={{color: "#007bff", backgroundColor: "#e6f2ff",padding: "6px 12px",borderRadius: "20px",fontWeight: "600",fontSize: "12px",display: "inline-block",letterSpacing: "0.3px",lineHeight: 1}}>
                    {record.status?.name || "N/A"}
                </span>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 160,
            render: (_, record) => (
                <Space>
                    {showTrash ? (
                        <Space>
                            <Popconfirm title="Restore this order?" okText="Yes" cancelText="No" onConfirm={() => onRestore(record.id)}>
                                <Button size="small" type="primary">
                                    Restore
                                </Button>
                            </Popconfirm>

                            <Popconfirm title="Permanently delete this order?" description="This action cannot be undone!" okText="Delete" cancelText="Cancel" onConfirm={() => onForceDelete(record.id)}>
                                <Button size="small" danger>
                                    Delete Permanently
                                </Button>
                            </Popconfirm>
                        </Space>
                        ) : (
                        <>
                            {record.status.id === 1 && (
                                <>
                                    <Button size="small" className="incomplete-edit" onClick={() => onEdit(record.id)}>
                                        Edit
                                    </Button>

                                    <Button size="small" className="incomplete-convert" onClick={() => handleOrder(record)}>
                                        Convert to Order
                                    </Button>
                                </>
                            )}

                            <Popconfirm title="Delete Order?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                                <Button size="small" className="incomplete-delete">
                                    Delete
                                </Button>
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

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
            const orderData = {
                id           : record.id,
                name         : record.name,
                phone_number : record.phone_number,
                address      : record.address,
                status       : record.status,
                items        : res?.result?.items,
                is_incomplete: 1
            };

            setLoading(false);

            navigate("/order-add", { state: orderData });
        }
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/incomplete-orders/${id}`);
        
        if (res?.success) {
            const refreshed = await getDatas("/admin/incomplete-orders");
            
            setIncompleteOrders(refreshed?.result?.orders?.data || []);

            messageApi.open({
                type: "success",
                content: res?.msg,
            });
        }
    };

    const onRestore = async (id) => {
        await restoreIncompleteOrder(id);
        fetchIncompleteOrders();
    };

    const onForceDelete = async (id) => {
        await forceDeleteIncompleteOrder(id);
        fetchIncompleteOrders();
    };

    const restoreIncompleteOrder = async (id) => {
        const res = await postData(`/admin/incomplete-orders/${id}/restore`);

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res?.message,
            });
        }else if(res?.success === false){
            messageApi.open({
                type: "success",
                content: res?.message,
            });
        }
    }

    const forceDeleteIncompleteOrder = async (id) => {
        const res = await deleteData(`/admin/incomplete-orders/${id}/permanent`);

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res?.msg,
            });
        }
    }

    const handleBulkConvert = async () => {
        if (selectedOrders?.length === 0) {
            message.warning("Please select at least one incomplete order.");
            return;
        }

        Modal.confirm({
            title: "Confirm Bulk Convert",
            content: `Are you sure you want to convert ${selectedOrders?.length} orders to completed?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
                try {
                    const orderIds = selectedOrders?.map((order) => order.id);

                    const res = await postData("/admin/orders/bulk-convert", {
                        ids: orderIds,
                    });

                    if (res.success) {
                        message.success(
                        `${selectedOrders?.length} orders converted successfully.`
                        );
                        setSelectedRowKeys([]);
                    } else {
                        message.error("Bulk convert failed.");
                    }
                } catch (err) {
                    message.error("Something went wrong!", err);
                }
            },
        });
    };

    const handleBulkDelete = async () => {
        if (selectedOrders?.length === 0) {
            message.warning("Please select at least one incomplete order.");
            return;
        }

        Modal.confirm({
            title: "Confirm Bulk Convert",
            content: `Are you sure you want to convert ${selectedOrders?.length} orders to completed?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
                try {
                    const orderIds = selectedOrders?.map((order) => order.id);

                    const res = await postData("/admin/orders/bulk-convert", {
                        ids: orderIds,
                    });

                    if (res.success) {
                        message.success(`${selectedOrders?.length} orders converted successfully.`);
                        setSelectedRowKeys([]);
                    } else {
                        message.error("Bulk convert failed.");
                    }
                } catch (err) {
                    message.error("Something went wrong!", err);
                }
            },
        });
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

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: "600" }}>
                        All In Complete Order List
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "All In Complete Order List" },]}/>
                </div>
            </div>

            <div className="incomplete-order-head">
                <AntInput.Search allowClear placeholder="Search by Invoice / Phone / Name" style={{ width: 300 }} onChange={(e) => {setSearchText(e.target.value);setCurrentPage(1);}}/>
                <Space>
                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div className="page-header-block">
                <div className="filter-data">
                    <Space style={{ marginBottom: 16 }}>
                        <DatePicker.RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} format="YYYY-MM-DD" placeholder={['Start Date', 'End Date']}/>

                        <Button onClick={() => setDateRange(null)}>Clear Dates</Button>
                    </Space>
                </div>

                <div className="incomplete-bulk-action">
                    <Space style={{ marginBottom: 16 }}>
                        <Button icon={<ShoppingCartOutlined />} disabled={selectedOrders?.length === 0} onClick={() => handleBulkConvert()}>
                            Bulk Convert
                        </Button>

                        <Button icon={<DeleteOutlined />} disabled={selectedOrders?.length === 0} onClick={() => handleBulkDelete()}>
                            Bulk Delete
                        </Button>

                        <Tooltip title={showTrash ? "Show Active" : "Show Trash"}>
                            <Button danger={ !showTrash } icon={<DeleteOutlined />} onClick={() => setShowTrash(prev => !prev)}>
                                {showTrash ? "Back to List" : "Show Trash"}
                            </Button>
                        </Tooltip>

                        <Button icon={<ExportOutlined />} onClick={handleExport}>
                            {csvLoader ? "Exporting..." : "Export CSV"}
                        </Button>

                        <Button icon={<BarChartOutlined />} onClick={handleStatistics}>
                            Statistics
                        </Button>
                    </Space>
                </div>
            </div>

            <div className="page-item-data-wrapper" style={{marginBottom:10}}>
                <Space wrap size="middle">
                    <Button type={activeStatus === null ? "primary" : "default"} onClick={() => setActiveStatus(null)}>
                        Total <span className="count-badge">{orderCounts.total}</span>
                    </Button>

                    <Button type={activeStatus === 1 ? "primary" : "default"} onClick={() => setActiveStatus(1)}>
                        Pending <span className="count-badge">{orderCounts.pending}</span>
                    </Button>

                    <Button type={activeStatus === 3 ? "primary" : "default"} onClick={() => setActiveStatus(3)}>
                        Approved <span className="count-badge">{orderCounts.approved}</span>
                    </Button>

                    <Button danger type={activeStatus === 8 ? "primary" : "default"} onClick={() => setActiveStatus(8)}>
                        Canceled <span className="count-badge">{orderCounts.canceled}</span>
                    </Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns} dataSource={filteredOrders} rowSelection={rowSelection} rowKey="id"
                pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: filteredOrders.length,
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
