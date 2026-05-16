import {ArrowLeftOutlined,CopyOutlined,DeleteOutlined,EditOutlined,EyeOutlined,FilterOutlined,InfoCircleOutlined,PlusOutlined,ReloadOutlined} from "@ant-design/icons";
import {Input as AntInput,Typography,Breadcrumb,Tabs,Button,Col,DatePicker,Empty,Flex,Spin,InputNumber,Modal as AntModal,Popover,Row,Divider,Select,Form,Space,Table,Tag,Tooltip,message, Popconfirm} from "antd";
import { Link,useNavigate } from "react-router-dom";
import useTitle from "../../hooks/useTitle";
import { useEffect, useState } from "react";
import { getDatas, putData, deleteData } from "../../api/common/common";

const { Option } = Select;

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

    // Filter states
    const [searchQuery, setSearchQuery]         = useState("");
    const [categoryIds, setCategoryIds]         = useState([]);
    const [subCategoryIds, setSubCategoryIds]   = useState([]);
    const [brandIds, setBrandIds]             = useState([]);
    const [status, setStatus]                = useState(null);

    // Filter options
    const [categories, setCategories]           = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [brands, setBrands]                 = useState([]);

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
                categoryIds.forEach(id => {
                    params.append("category_id[]", id);
                });
            }

            if (subCategoryIds.length > 0) {
                subCategoryIds.forEach(id => {
                    params.append("sub_category_ids[]", id);
                });
            }

            if (brandIds.length > 0) {
                brandIds.forEach(id => {
                    params.append("brand_ids[]", id);
                });
            }

            const res = await getDatas(`/admin/products/trash?${params.toString()}`);

            if (res?.success) {
                setTrashData(res?.result?.data || []);
                setTableMeta(res?.result?.meta || null);
            }

        } catch (error) {
            console.log(error);
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
        }finally{
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
        }finally{
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

                const res = await putData("/admin/products/bulk/restore",{ product_ids: selectedRowKeys });

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

                const res = await deleteData("/admin/products/bulk/permanent-delete",{
                    data : {
                        product_ids: selectedRowKeys
                    }
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
            width: 50,
            render: (_, __, i) => (currentPage - 1) * pageSize + i + 1,
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 110,
            render: (src, r) => (
                <img src={src} alt={r.name} style={{width: 95,height: 95,objectFit: "fill",borderRadius: 4,cursor: "pointer"}} onClick={() => window.open(src, "_blank")}/>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            width: 200,
            ellipsis: true,
        },
        {
            title: "SKU",
            dataIndex: "sku",
            key: "sku",
            width: 140,
            ellipsis: true,
        },
        {
            title: "Category",
            key: "category",
            width: 160,
            render: (_, r) => r?.category?.name || "—",
        },
        {
            title: "Actions",
            key: "actions",
            width: 220,
            fixed: "right",
            render: (_, record) => (
                <Space size="small">
                    <Button size="small" onClick={() => handleRestore(record.id)} loading={restoreLoadingId === record.id}>
                        Restore
                    </Button>

                    <Popconfirm title="Delete permanently?" description="This action cannot be undone" okText="Yes, Delete" cancelText="Cancel" onConfirm={() => handlePermanentDelete(record.id)}>
                        <Button size="small" danger loading={loadingId === record.id}>
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
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "Trash Products" }]}/>
                </div>
            </div>

            <div className="product-filter-section" style={{ marginBottom: 16 }}>
                <Row gutter={16} style={{ marginBottom: 12 }}>
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
                                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Sub Category"
                            mode="multiple"
                            value={subCategoryIds}
                            onChange={(vals) => { setSubCategoryIds(vals || []); setCurrentPage(1); }}
                            style={{ width: 200 }}
                            allowClear
                            maxTagCount={1}
                            loading={subCategoriesLoading}
                            disabled={categoryIds.length === 0}
                        >
                            {subCategories.map((sub) => (
                                <Option key={sub.id} value={sub.id}>{sub.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Brand"
                            mode="multiple"
                            value={brandIds}
                            onChange={(vals) => { setBrandIds(vals || []); setCurrentPage(1); }}
                            style={{ width: 180 }}
                            allowClear
                            maxTagCount={1}
                        >
                            {brands.map((brand) => (
                                <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Status"
                            value={status}
                            onChange={(val) => { setStatus(val); setCurrentPage(1); }}
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
                                <span>Selected {selectedRowKeys.length} items</span>
                            )}
                        </Col>
                        <Col>
                            <Space>
                                {isActionShow && (
                                    <>
                                        <span>Selected {selectedRowKeys.length} items</span>
                                        <Button size="small" onClick={clearSelection}>
                                            Clear
                                        </Button>
                                    </>
                                )}
                            </Space>
                        </Col>
                        <Col>
                            <Space wrap>
                                {isActionShow && (
                                    <Select defaultValue="" onChange={handleBulkTrashAction} placeholder="Bulk Action" style={{ width: 180 }} loading={bulkLoading} disabled={bulkLoading}>
                                        <Option value="bulk-restore">Bulk Restore</Option>
                                        <Option value="bulk-permanent-delete">Bulk Permanent Delete</Option>
                                    </Select>
                                )}

                                <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
                                    Back to List
                                </Button>

                                <Button size="small" icon={<ReloadOutlined />} onClick={() => fetchTrashList()}>
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
                    pageSizeOptions: [10, 20, 50, 100],
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
            />
        </>
    )
}