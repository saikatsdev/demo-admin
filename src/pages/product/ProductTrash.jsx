import {ArrowLeftOutlined,DeleteOutlined,InfoCircleOutlined,ReloadOutlined} from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Card,Col,Divider,Modal as AntModal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,Typography,message,} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, putData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import "./Product.css";

const { Option } = Select;
const { Text, Title } = Typography;

export default function ProductTrash() {
    // Hook
    useTitle("Product Trash List");

    const navigate = useNavigate();

    // State
    const [trashData, setTrashData]               = useState([]);
    const [tableMeta, setTableMeta]               = useState(null);
    const [loading, setLoading]                   = useState(false);
    const [messageApi, contextHolder]             = message.useMessage();
    const [currentPage, setCurrentPage]           = useState(1);
    const [pageSize, setPageSize]                 = useState(10);
    const [selectedRowKeys, setSelectedRowKeys]   = useState([]);
    const [isActionShow, setIsActionShow]         = useState(false);
    const [loadingId, setLoadingId]               = useState(null);
    const [restoreLoadingId, setRestoreLoadingId] = useState(null);
    const [bulkLoading, setBulkLoading]           = useState(false);

    // Modal States
    const [previewModal, setPreviewModal]         = useState(false);
    const [previewData, setPreviewData]           = useState(null);
    const [imagePreviewModal, setImagePreviewModal] = useState(false);
    const [previewImage, setPreviewImage]         = useState("");

    // Filter states
    const [searchQuery, setSearchQuery]         = useState("");
    const [categoryIds, setCategoryIds]         = useState([]);
    const [subCategoryIds, setSubCategoryIds]   = useState([]);
    const [brandIds, setBrandIds]               = useState([]);
    const [status, setStatus]                  = useState(null);

    // Filter options
    const [categories, setCategories]           = useState([]);
    const [subCategories, setSubCategories]     = useState([]);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [brands, setBrands]                   = useState([]);

    const fetchTrashList = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            params.append("page", currentPage);
            params.append("paginate_size", pageSize);

            if (searchQuery) {
                params.append("search_key", searchQuery);
            }

            if (status) {
                params.append("status", status);
            }

            if (categoryIds.length > 0) {
                categoryIds.forEach((id) => {
                    params.append("category_id[]", id);
                });
            }

            if (subCategoryIds.length > 0) {
                subCategoryIds.forEach((id) => {
                    params.append("sub_category_ids[]", id);
                });
            }

            if (brandIds.length > 0) {
                brandIds.forEach((id) => {
                    params.append("brand_ids[]", id);
                });
            }

            const res = await getDatas(`/admin/products/trash?${params.toString()}`);

            if (res?.success) {
                setTrashData(res?.result?.data || []);
                setTableMeta(res?.result?.meta || null);
            }
        } catch (error) {
            console.error("Error fetching trash list:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                getDatas("/admin/categories/list"),
                getDatas("/admin/brands/list"),
            ]);

            setCategories(catRes?.result || []);
            setBrands(brandRes?.result || []);
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }
    };

    const fetchSubCategories = async (ids) => {
        if (!ids || ids.length === 0) {
            setSubCategories([]);
            return;
        }

        try {
            setSubCategoriesLoading(true);
            const params = new URLSearchParams();
            ids.forEach((id) => params.append("category_ids[]", id));

            const res = await getDatas(`/admin/sub-categories/list?${params.toString()}`);
            setSubCategories(res?.result || []);
        } catch (error) {
            console.error("Error fetching sub categories:", error);
        } finally {
            setSubCategoriesLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
        setIsActionShow(newSelectedRowKeys.length > 0);
    };

    const clearSelection = () => {
        setSelectedRowKeys([]);
        setIsActionShow(false);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleRestore = async (id) => {
        try {
            setRestoreLoadingId(id);

            const res = await putData(`/admin/products/${id}/restore`, {});
            if (res?.success) {
                messageApi.success("Product restored");
                setTrashData((prev) => prev.filter((p) => p.id !== id));
            } else {
                messageApi.error(res?.msg || "Restore failed");
            }
        } catch {
            messageApi.error("Restore failed");
        } finally {
            setRestoreLoadingId(null);
        }
    };

    const handlePermanentDelete = async (id) => {
        try {
            setLoadingId(id);

            const res = await deleteData(`/admin/products/${id}/permanent-delete`, {});
            if (res?.success) {
                messageApi.success("Permanently deleted");
                setTrashData((prev) => prev.filter((p) => p.id !== id));
            } else {
                messageApi.error(res?.message || "Delete failed");
            }
        } catch {
            messageApi.error("Delete failed");
        } finally {
            setLoadingId(null);
        }
    };

    const handleBulkTrashAction = async (action) => {
        if (!selectedRowKeys.length) {
            return messageApi.error("Select at least one product");
        }

        if (action === "bulk-restore") {
            try {
                setBulkLoading(true);

                const res = await putData("/admin/products/bulk/restore", {
                    product_ids: selectedRowKeys,
                });

                if (res?.success) {
                    messageApi.success("Bulk restore done");

                    setTrashData((prev) =>
                        prev.filter((p) => !selectedRowKeys.includes(p.id))
                    );

                    setSelectedRowKeys([]);
                    setIsActionShow(false);
                } else {
                    messageApi.error(res?.message || "Bulk restore failed");
                }
            } catch {
                messageApi.error("Bulk restore failed");
            } finally {
                setBulkLoading(false);
            }
        }

        if (action === "bulk-permanent-delete") {
            try {
                setBulkLoading(true);

                const res = await deleteData("/admin/products/bulk/permanent-delete", {
                    data: {
                        product_ids: selectedRowKeys,
                    },
                });

                if (res?.success) {
                    messageApi.success("Bulk permanent delete done");

                    setTrashData((prev) =>
                        prev.filter((p) => !selectedRowKeys.includes(p.id))
                    );

                    setSelectedRowKeys([]);
                    setIsActionShow(false);
                } else {
                    messageApi.error(res?.message || "Bulk delete failed");
                }
            } catch {
                messageApi.error("Bulk delete failed");
            } finally {
                setBulkLoading(false);
            }
        }
    };

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: "center",
            render: (_, __, i) => (currentPage - 1) * pageSize + i + 1,
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 100,
            align: "center",
            render: (src, record) => (
                <div
                    style={{
                        position: "relative",
                        width: 65,
                        height: 65,
                        margin: "0 auto",
                        cursor: "pointer",
                        borderRadius: 6,
                        overflow: "hidden",
                        border: "1px solid #f0f0f0",
                        background: "#fafafa",
                    }}
                    onClick={() => {
                        setPreviewImage(src || "http://127.0.0.1:8000/uploads/default.png");
                        setImagePreviewModal(true);
                    }}
                >
                    <img
                        src={src || "http://127.0.0.1:8000/uploads/default.png"}
                        alt={record.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>
            ),
        },
        {
            title: "Product Info",
            dataIndex: "name",
            key: "name",
            width: 240,
            render: (text, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Text strong style={{ fontSize: 14, color: "#1f2937" }} ellipsis={{ tooltip: text }}>
                            {text}
                        </Text>
                        <Tooltip title="View Details">
                            <Button
                                type="text"
                                size="small"
                                icon={<InfoCircleOutlined style={{ color: "#1677ff", fontSize: 14 }} />}
                                onClick={() => {
                                    setPreviewData(record);
                                    setPreviewModal(true);
                                }}
                                style={{ padding: "0 4px", height: "auto" }}
                            />
                        </Tooltip>
                    </div>
                    {record.slug && (
                        <Text type="secondary" style={{ fontSize: 11, color: "#6b7280" }}>
                            Slug: {record.slug}
                        </Text>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                        {record.is_combo === 1 && (
                            <Tag color="purple" style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                                COMBO
                            </Tag>
                        )}
                        {record.free_shipping && (
                            <Tag color="green" style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                                Free Shipping
                            </Tag>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Identity & Category",
            key: "identity",
            width: 220,
            render: (_, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                    {record.sku && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>SKU: </Text>
                            <Tag color="blue" style={{ fontSize: 11, fontWeight: 600 }}>{record.sku}</Tag>
                        </div>
                    )}
                    {record.brand?.name && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>Brand: </Text>
                            <Text strong style={{ fontSize: 12, color: "#374151" }}>{record.brand.name}</Text>
                        </div>
                    )}
                    {record.categories && record.categories.length > 0 && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>Category: </Text>
                            <span style={{ color: "#4b5563" }}>
                                {record.categories.map((c) => c.name).join(", ")}
                            </span>
                        </div>
                    )}
                    {record.sub_categories && record.sub_categories.length > 0 && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>Sub Cat: </Text>
                            <span style={{ color: "#6b7280" }}>
                                {record.sub_categories.map((sc) => sc.name).join(", ")}
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Pricing",
            key: "pricing",
            width: 180,
            render: (_, record) => {
                const hasVariationRange =
                    record.variation_price_range?.min_price && record.variation_price_range?.max_price;
                if (hasVariationRange) {
                    return (
                        <div>
                            <Text strong style={{ color: "#1d39c4", fontSize: 13 }}>
                                ৳{Number(record.variation_price_range.min_price).toLocaleString()} - ৳
                                {Number(record.variation_price_range.max_price).toLocaleString()}
                            </Text>
                            <Tag color="cyan" style={{ fontSize: 10, display: "block", width: "fit-content", marginTop: 4 }}>
                                Variant Pricing
                            </Tag>
                        </div>
                    );
                }

                const mrp = Number(record.mrp) || 0;
                const sellPrice = Number(record.sell_price) || Number(record.offer_price) || 0;
                const offerPrice = Number(record.offer_price) || 0;
                const discountPercent = Number(record.discount) || Number(record.offer_percent) || 0;

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {mrp > 0 && (
                            <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                                MRP:{" "}
                                <Text
                                    delete={sellPrice < mrp}
                                    style={{ color: sellPrice < mrp ? "#bfbfbf" : "#434343", fontSize: 11 }}
                                >
                                    ৳{mrp.toFixed(2)}
                                </Text>
                            </div>
                        )}
                        {offerPrice > 0 && offerPrice !== sellPrice && (
                            <div style={{ fontSize: 11, color: "#fa8c16" }}>
                                Offer: <strong>৳{offerPrice.toFixed(2)}</strong>
                            </div>
                        )}
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1677ff" }}>
                            ৳{sellPrice.toFixed(2)}
                        </div>
                        {discountPercent > 0 && (
                            <Tag color="error" style={{ fontSize: 10, fontWeight: 700, borderRadius: 4, width: "fit-content", margin: 0 }}>
                                {discountPercent}% OFF
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Stock & Qty",
            key: "stock",
            width: 160,
            render: (_, record) => {
                const stock = record.current_stock ?? record.current_stock_range?.total_current_stock ?? 0;
                const purchaseQty = record.total_purchase_qty ?? record.current_stock_range?.total_purchase_qty ?? 0;
                const sellQty = record.total_sell_qty ?? record.current_stock_range?.total_sell_qty ?? 0;

                let stockStatusColor = "#52c41a";
                let stockStatusText = "In Stock";
                if (stock <= 0) {
                    stockStatusColor = "#ff4d4f";
                    stockStatusText = "Out of Stock";
                } else if (record.alert_qty && stock <= record.alert_qty) {
                    stockStatusColor = "#faad14";
                    stockStatusText = "Low Stock";
                }

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Text strong style={{ fontSize: 13, color: "#1f2937" }}>
                                {stock}
                            </Text>
                            <Tag color={stockStatusColor} style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>
                                {stockStatusText}
                            </Tag>
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                            Purchased: <Text strong style={{ fontSize: 11 }}>{purchaseQty}</Text>
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                            Sold: <Text strong style={{ fontSize: 11 }}>{sellQty}</Text>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            align: "center",
            render: (st) => (
                <Tag
                    color={st === "active" ? "success" : "error"}
                    style={{ textTransform: "uppercase", fontWeight: 600, fontSize: 11 }}
                >
                    {st || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 180,
            fixed: "right",
            align: "center",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<ReloadOutlined />}
                        onClick={() => handleRestore(record.id)}
                        loading={restoreLoadingId === record.id}
                    >
                        Restore
                    </Button>

                    <Popconfirm
                        title="Delete permanently?"
                        description="This action cannot be undone"
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        onConfirm={() => handlePermanentDelete(record.id)}
                    >
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            loading={loadingId === record.id}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        fetchTrashList();
        setSelectedRowKeys([]);
        setIsActionShow(false);
    }, [currentPage, pageSize, searchQuery, categoryIds, subCategoryIds, brandIds, status]);

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (values) => {
        setCategoryIds(values || []);
        setSubCategoryIds([]);
        setSubCategories([]);
        setCurrentPage(1);

        if (values && values.length > 0) {
            fetchSubCategories(values);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setCategoryIds([]);
        setSubCategoryIds([]);
        setBrandIds([]);
        setStatus(null);
        setSubCategories([]);
        setCurrentPage(1);
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Trash Products</h1>
                </div>

                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Trash Products" },
                        ]}
                    />
                </div>
            </div>

            <div className="product-filter-section" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                    <Col>
                        <AntInput
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Select
                            placeholder="Category"
                            mode="multiple"
                            value={categoryIds}
                            onChange={handleCategoryChange}
                            style={{ width: 200 }}
                            allowClear
                            maxTagCount={1}
                        >
                            {categories.map((cat) => (
                                <Option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Sub Category"
                            mode="multiple"
                            value={subCategoryIds}
                            onChange={(vals) => {
                                setSubCategoryIds(vals || []);
                                setCurrentPage(1);
                            }}
                            style={{ width: 200 }}
                            allowClear
                            maxTagCount={1}
                            loading={subCategoriesLoading}
                            disabled={categoryIds.length === 0}
                        >
                            {subCategories.map((sub) => (
                                <Option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Brand"
                            mode="multiple"
                            value={brandIds}
                            onChange={(vals) => {
                                setBrandIds(vals || []);
                                setCurrentPage(1);
                            }}
                            style={{ width: 180 }}
                            allowClear
                            maxTagCount={1}
                        >
                            {brands.map((brand) => (
                                <Option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Status"
                            value={status}
                            onChange={(val) => {
                                setStatus(val);
                                setCurrentPage(1);
                            }}
                            style={{ width: 120 }}
                            allowClear
                        >
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Button size="small" onClick={handleClearFilters}>
                            Clear Filters
                        </Button>
                    </Col>
                </Row>

                <div className="filter-desktop-actions" style={{ marginBottom: 12 }}>
                    <Row gutter={16} justify="space-between" align="middle">
                        <Col>
                            {isActionShow && (
                                <Space>
                                    <span>Selected {selectedRowKeys.length} items</span>
                                    <Button size="small" onClick={clearSelection}>
                                        Clear
                                    </Button>
                                </Space>
                            )}
                        </Col>
                        <Col>
                            <Space wrap>
                                {isActionShow && (
                                    <Select
                                        defaultValue=""
                                        onChange={handleBulkTrashAction}
                                        placeholder="Bulk Action"
                                        style={{ width: 180 }}
                                        loading={bulkLoading}
                                        disabled={bulkLoading}
                                    >
                                        <Option value="bulk-restore">Bulk Restore</Option>
                                        <Option value="bulk-permanent-delete">
                                            Bulk Permanent Delete
                                        </Option>
                                    </Select>
                                )}

                                <Button
                                    size="small"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate("/products")}
                                >
                                    Back to List
                                </Button>

                                <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() => fetchTrashList()}
                                >
                                    Refresh
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </div>

            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={trashData}
                loading={loading}
                tableLayout="fixed"
                size="small"
                bordered
                scroll={{ x: "max-content" }}
                rowKey="id"
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: tableMeta?.total || 0,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 25, 50, 100],
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
            />

            {/* Product Quick Info Modal */}
            <AntModal
                title={
                    <Space>
                        <InfoCircleOutlined style={{ color: "#1677ff" }} />
                        <span>Product Trash Details</span>
                    </Space>
                }
                open={previewModal}
                onCancel={() => {
                    setPreviewModal(false);
                    setPreviewData(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setPreviewModal(false);
                            setPreviewData(null);
                        }}
                    >
                        Close
                    </Button>,
                    previewData && (
                        <Button
                            key="restore"
                            type="primary"
                            icon={<ReloadOutlined />}
                            loading={restoreLoadingId === previewData.id}
                            onClick={() => {
                                handleRestore(previewData.id);
                                setPreviewModal(false);
                            }}
                        >
                            Restore Product
                        </Button>
                    ),
                ]}
                width={700}
            >
                {previewData && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col span={6}>
                                <img
                                    src={previewData.image || "http://127.0.0.1:8000/uploads/default.png"}
                                    alt={previewData.name}
                                    style={{ width: "100%", borderRadius: 8, border: "1px solid #f0f0f0", objectFit: "cover" }}
                                />
                            </Col>
                            <Col span={18}>
                                <Title level={4} style={{ margin: 0 }}>
                                    {previewData.name}
                                </Title>
                                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                                    Slug: {previewData.slug}
                                </Text>
                                <Space wrap>
                                    <Tag color="blue">SKU: {previewData.sku}</Tag>
                                    <Tag color={previewData.status === "active" ? "success" : "error"}>
                                        STATUS: {(previewData.status || "").toUpperCase()}
                                    </Tag>
                                    {previewData.brand?.name && (
                                        <Tag color="geekblue">Brand: {previewData.brand.name}</Tag>
                                    )}
                                    {previewData.is_combo === 1 && <Tag color="purple">COMBO</Tag>}
                                    {previewData.free_shipping && <Tag color="green">Free Shipping</Tag>}
                                </Space>
                            </Col>
                        </Row>

                        <Divider style={{ margin: "8px 0" }} />

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card size="small" title="Pricing Details" style={{ height: "100%" }}>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>MRP:</strong> ৳{previewData.mrp}
                                    </p>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Offer Price:</strong> ৳{previewData.offer_price || "—"}
                                    </p>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Sell Price:</strong> ৳{previewData.sell_price}
                                    </p>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Discount:</strong>{" "}
                                        {previewData.discount || previewData.offer_percent
                                            ? `${previewData.discount || previewData.offer_percent}%`
                                            : "—"}
                                    </p>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Stock Details" style={{ height: "100%" }}>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Current Stock:</strong> {previewData.current_stock ?? "—"}
                                    </p>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Total Purchase Qty:</strong> {previewData.total_purchase_qty ?? "—"}
                                    </p>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Total Sell Qty:</strong> {previewData.total_sell_qty ?? "—"}
                                    </p>
                                    <p style={{ margin: "4px 0" }}>
                                        <strong>Min Qty / Alert Qty:</strong> {previewData.minimum_qty ?? 1} /{" "}
                                        {previewData.alert_qty ?? "—"}
                                    </p>
                                </Card>
                            </Col>
                        </Row>

                        {(previewData.short_description || previewData.description) && (
                            <Card size="small" title="Description">
                                {previewData.short_description && (
                                    <div style={{ marginBottom: 8 }}>
                                        <strong>Short Description:</strong>
                                        <p style={{ margin: "4px 0", color: "#4b5563" }}>{previewData.short_description}</p>
                                    </div>
                                )}
                                {previewData.description && (
                                    <div>
                                        <strong>Full Description:</strong>
                                        <p style={{ margin: "4px 0", color: "#4b5563", whiteSpace: "pre-line" }}>
                                            {previewData.description}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {(previewData.meta_title || previewData.meta_keywords || previewData.meta_description) && (
                            <Card size="small" title="SEO / Meta Info">
                                {previewData.meta_title && (
                                    <p style={{ margin: "2px 0" }}>
                                        <strong>Meta Title:</strong> {previewData.meta_title}
                                    </p>
                                )}
                                {previewData.meta_keywords && (
                                    <p style={{ margin: "2px 0" }}>
                                        <strong>Meta Keywords:</strong> {previewData.meta_keywords}
                                    </p>
                                )}
                                {previewData.meta_description && (
                                    <p style={{ margin: "2px 0" }}>
                                        <strong>Meta Description:</strong> {previewData.meta_description}
                                    </p>
                                )}
                            </Card>
                        )}
                    </div>
                )}
            </AntModal>

            {/* Image Preview Modal */}
            <AntModal
                open={imagePreviewModal}
                footer={null}
                onCancel={() => setImagePreviewModal(false)}
                centered
                width={500}
            >
                <img
                    src={previewImage}
                    alt="Product Preview"
                    style={{ width: "100%", height: "auto", borderRadius: 8, marginTop: 16 }}
                />
            </AntModal>
        </>
    );
}
