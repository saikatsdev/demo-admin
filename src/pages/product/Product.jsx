import {ArrowLeftOutlined,CopyOutlined,DeleteOutlined,EditOutlined,EyeOutlined,FilterOutlined,FormOutlined,InfoCircleOutlined,PlusOutlined} from "@ant-design/icons";
import {Input as AntInput,Typography,Breadcrumb,Badge,Tabs,Button,Col,DatePicker,Empty,Flex,InputNumber,Modal,Form,Row,Divider,Select,Space,Table,Tag,Tooltip,message,Spin} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {deleteData,getDatas,postData} from "../../api/common/common";
import { useDebounce } from "../../hooks/useDebounce";
import useTitle from "../../hooks/useTitle";
import "./Product.css";
import { cachedFetch } from "../../utils/cacheApi";
import { usePermission } from "../../hooks/usePermission";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useAppSettings } from "../../contexts/useAppSettings";

const { Option } = Select;

const { Text, Title } = Typography;

export default function Product() {
    // Hook
    useTitle("All Products");

    const {permissions} = usePermission();

    const {settings} = useAppSettings();

    const productCreate = permissions?.includes("products-create");
    const productDelete = permissions?.includes("products-delete");
    const productUpdate = permissions?.includes("products-update");

    // Variable
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery]               = useState("");
    const [selectedRowKeys, setSelectedRowKeys]       = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [products, setProducts]                     = useState([]);
    const [tableData, setTableData]                   = useState(null);
    const [currentPage, setCurrentPage]               = useState(1);
    const [pageSize, setPageSize]                     = useState(10);
    const [productStatus, setProductStatus]           = useState("active");
    const [selectedAction, setSelectedAction]         = useState("");
    const [isActionShow, setIsActionShow]             = useState(false);
    const [filtersOpen, setFiltersOpen]               = useState(true);
    const [activeCount, setActiveCount]               = useState(0);
    const [inactiveCount, setInactiveCount]           = useState(0);
    const [activeTab, setActiveTab]                   = useState("active");
    const [previewModal, setPreviewModal]             = useState(false);
    const [imagePreviewModal, setImagePreviewModal]   = useState(false);
    const [bulkStatusModal, setBulkStatusModal]       = useState(false);
    const [previewData, setPreviewData]               = useState(null);
    const [previewImage, setPreviewImage]             = useState("");
    const [bulkStatusValue, setBulkStatusValue]       = useState("");
    const [brandIds, setBrandIds]                     = useState([]);
    const [categoryIds, setCategoryIds]               = useState([]);
    const [subCategoryIds, setSubCategoryIds]         = useState([]);
    const [subSubCategoryIds, setSubSubCategoryIds]   = useState([]);
    const [attributeValueIds, setAttributeValueIds]   = useState([]);
    const [tagIds, setTagIds]                         = useState([]);
    const [dateRange, setDateRange]                   = useState([null, null]);
    const [minPrice, setMinPrice]                     = useState();
    const [maxPrice, setMaxPrice]                     = useState();
    const [productTypeId, setProductTypeId]           = useState(null);
    const [brands, setBrands]                         = useState([]);
    const [categories, setCategories]                 = useState([]);
    const [subCategories, setSubCategories]           = useState([]);
    const [subCategoryList, setSubCategoryList]       = useState([]);
    const [subSubCategories, setSubSubCategories]     = useState([]);
    const [subSubCategoryList, setSubSubCategoryList] = useState([]);
    const [attributeValues, setAttributeValues]       = useState([]);
    const [productTypes, setProductTypes]             = useState([]);
    const [modal, modalContextHolder]                 = Modal.useModal();
    const [messageApi, contextHolder]                 = message.useMessage();
    const [settingsData, setSettingsData]             = useState(null);
    const [isModalOpen, setIsModalOpen]               = useState(false);
    const [selectedProduct, setSelectedProduct]       = useState(null);
    const [copyLoadingId, setCopyLoadingId]           = useState(null);
    const [quickEditOpen, setQuickEditOpen]           = useState(false);
    const [editingProduct, setEditingProduct]         = useState(null);
    const [quickEditLoading, setQuickEditLoading]     = useState(false);
    const [slugLoading, setSlugLoading]               = useState(false);
    const [form]                                      = Form.useForm();

    const slugTimer = useRef(null);

    // Debounced search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [brands, categories,subCategories, subSubCategories,productTypes, attributeValues] =
                await Promise.all([
                    cachedFetch("brands", () => getDatas("/admin/brands/list")),
                    cachedFetch("categories", () => getDatas("/admin/categories/list")),
                    cachedFetch("subCategories", () => getDatas("/admin/sub-categories/list")),
                    cachedFetch("subSubCategories", () => getDatas("/admin/sub-sub-categories/list")),
                    cachedFetch("productTypes", () => getDatas("/admin/product-types/list")),
                    cachedFetch("attributeValues", () => getDatas("/admin/attribute-values/list")),
                ]);

                setBrands(brands?.result || []);
                setCategories(categories?.result || []);
                setSubCategoryList(subCategories?.result || []);
                setSubSubCategoryList(subSubCategories?.result || []);
                setProductTypes(productTypes?.result || []);
                setAttributeValues(attributeValues?.result || []);

            } catch (error) {
                console.error("Error loading filter options:", error);
            }
        };

        fetchFilterOptions();
    }, []);

    const handleCategoryChange = async (selectedIds) => {
        setCategoryIds(selectedIds);
        setSubCategoryIds([]);

        if (selectedIds.length > 0) {
            try {
                const res = await getDatas(`/admin/sub-categories/list?category_ids=${selectedIds.join(',')}`);
                setSubCategories(res?.result || []);
            } catch (err) {
                console.error("Failed to fetch subcategories:", err);
                setSubCategories([]);
            }
        } else {
            setSubCategories([]);
        }
    };

    const handleSubCategoryChange = async (selectedIds) => {
        setSubCategoryIds(selectedIds);

        setSubSubCategoryIds([]);

        if (selectedIds.length === 0) {
            setSubSubCategories([]);
            return;
        }

        try {
            const res = await getDatas(`/admin/sub-sub-categories/list?sub_category_ids=${selectedIds.join(",")}`);

            setSubSubCategories(res?.result || []);
        } catch (err) {
            console.error("Failed to fetch sub sub categories:", err);
            setSubSubCategories([]);
        }
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 110,
            render: (src, record) => (
                <img src={src} alt={record.name} style={{width: "95px",height: "95px",objectFit: "fill",borderRadius: "4px",cursor: "pointer",}} onClick={() => handleImagePreview(src)}/>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            width: 160,
            ellipsis: true,
            render: (text, record) => (
                <span>
                    {text}
                    
                    <InfoCircleOutlined style={{ marginLeft: 6, color: "#1677ff", cursor: "pointer" }} onClick={() => {handleProductInfo(record)}}/>
                </span>
            ),
        },
        {
            title: "SKU & Type",
            key: "sku",
            width: 260,
            render: (_, record) => (
                <div style={{overflow: "hidden",whiteSpace: "nowrap",textOverflow: "ellipsis",}}>
                    <Tag color={record.status === "active" ? "green" : "red"}>
                        {record.status === "active" ? "Active" : "Inactive"}
                    </Tag>

                    {record.sku && (
                        <p style={{ margin: 0 }}>
                            SKU: <span style={{ fontWeight: 300 }}>{record.sku}</span>
                        </p>
                    )}

                    {record.product_type?.name && (
                        <p style={{ margin: 0 }}>
                            Product Type:{" "}
                            <span style={{ fontWeight: 300 }}>
                                {record.product_type.name}
                            </span>
                        </p>
                    )}
                
                    <div>
                        {record.brand?.name && (
                            <p style={{ margin: 0, fontWeight: 700 }}>
                                Brand:{" "}
                                <span style={{ fontWeight: 300 }}>{record.brand.name}</span>
                            </p>
                        )}

                        {record.categories?.length > 0 && (
                            <p style={{ margin: 0, fontWeight: 700 }}>
                                Category:{" "}
                                <span style={{ fontWeight: 300 }}>
                                    {record.categories.map(cat => cat.name).join(", ")}
                                </span>
                            </p>
                        )}

                        {record.sub_categories?.length > 0 && (
                            <p style={{ margin: 0, fontWeight: 700 }}>
                                Sub Category:{" "}
                                <span style={{ fontWeight: 300 }}>
                                    {record.sub_categories.map(item => item.name).join(", ")}
                                </span>
                            </p>
                        )}

                        {record.sub_sub_categories?.length > 0 && (
                            <p style={{ margin: 0, fontWeight: 700 }}>
                                Sub Sub Category:{" "}
                                <span style={{ fontWeight: 300 }}>
                                    {record.sub_sub_categories.map(item => item.name).join(", ")}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Price Configuration",
            key: "product_prices",
            width: 220,
            render: (_, record) => {
                const mrp = Number(record.mrp) || 0;
                const offer = Number(record.offer_price) || 0;
                const sell = Number(record.sell_price) || 0;
                const discount = mrp > 0 && sell < mrp ? Math.round(((mrp - sell) / mrp) * 100) : 0;

                return (
                    <div style={{ background: '#fafafa', padding: '12px', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Commercials</Text>
                        </div>
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>MRP:</Text>
                                <Text delete={sell < mrp} style={{ fontSize: '12px', color: sell < mrp ? '#bfbfbf' : '#434343' }}>৳{mrp.toLocaleString()}</Text>
                            </div>
                            {offer > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Offer:</Text>
                                    <Text strong style={{ fontSize: '12px', color: '#fa8c16' }}>৳{offer.toLocaleString()}</Text>
                                </div>
                            )}
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text strong style={{ fontSize: '13px', color: '#262626', marginTop: '4px' }}>Selling:</Text>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1677ff', lineHeight: 1 }}>৳{sell.toLocaleString()}</div>
                                    {discount > 0 && <Tag color="error" style={{ fontSize: '10px', margin: 0, marginTop: '4px', borderRadius: '4px', border: 'none', fontWeight: 700 }}>{discount}% OFF</Tag>}
                                </div>
                            </div>
                        </Space>
                    </div>
                );
            },
        },
        {
            title: "Inventory Metrics",
            key: "stock_report",
            width: 240,
            render: (_, record) => {
                const current = Number(record.current_stock_range?.total_current_stock) || 0;
                const purchase = Number(record.current_stock_range?.total_purchase_qty) || 0;
                const sell = Number(record?.total_sell_qty) || 0;
                
                return (
                    <div style={{ background: '#f6ffed', padding: '12px', borderRadius: '10px', border: '1px solid #b7eb8f' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#389e0d', fontWeight: 600 }}>Stock Status</Text>
                        </div>
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: '12px', color: '#135200' }}>Current Stock:</Text>
                                <Badge count={current} showZero overflowCount={9999} 
                                    style={{ backgroundColor: current > 5 ? '#52c41a' : '#ff4d4f', boxShadow: 'none' }} 
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Total Purchased:</Text>
                                <Text strong style={{ fontSize: '12px' }}>{purchase}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Total Sold:</Text>
                                <Text strong style={{ fontSize: '12px' }}>{sell}</Text>
                            </div>
                        </Space>
                    </div>
                );
            },
        },
        {
            title: "Actions",
            key: "actions",
            width: 220,
            fixed: "right",
            render: (_, record) => (
                <div className="action-buttons-wrapper">
                    <Tooltip title="Quick Edit" color="#1677ff">
                        <Button className="action-btn quick-edit" size="small" icon={<FormOutlined />} onClick={() => handleQuickEdit(record)} />
                    </Tooltip>

                    <Tooltip title="Product View" color="#13c2c2">
                        <Button className="action-btn view" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)} />
                    </Tooltip>

                    {productUpdate && (
                        <Tooltip title="Product Edit" color="#722ed1">
                            <Button className="action-btn edit" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                        </Tooltip>
                    )}
        
                    {productCreate && (
                        <Tooltip title="Product Duplicate" color="#fa8c16">
                            <Button className="action-btn duplicate" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.id)} loading={copyLoadingId === record.id} />
                        </Tooltip>
                    )}

                    {productDelete && (
                        <Tooltip title="Product Delete" color="#ff4d4f">
                            <Button className="action-btn delete" size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ];

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(String(text));
            messageApi.open({
                type: "success",
                content: "Copied to clipboard",
            });
        } catch {
            messageApi.open({
                type: "error",
                content: "Copy failed",
            });
        }
    };

    const normalizedVariations = useMemo(() => {
        if (!selectedProduct?.variations?.length) return [];

        return selectedProduct.variations.map((v) => {
            const attrs = [];
            for (let i = 1; i <= 3; i++) {
                const key = `attribute_value_${i}`;
                const av = v?.[key];
                if (av && typeof av === "object") {
                    attrs.push({slot: i,attributeId: av.attribute_id,attributeName: av.attribute?.name ?? `Attribute ${i}`,valueId: av.id,value: av.value});
                }
            }
            return {variationId: v.id,attrs};
        });
    }, [selectedProduct]);

    const handleProductInfo = (record) => {
        setSelectedProduct(record);
        setIsModalOpen(true);
    }

    const handleQuickEdit = async (item) => {
        setEditingProduct(item);
        setQuickEditOpen(true);
        setQuickEditLoading(true);

        const categoryIds = item?.categories?.map(item => item.id) || [];
        const subCategoryIds = item?.sub_categories?.map(item => item.id) || [];

        form.setFieldsValue({
            name                : item?.name,
            slug                : item?.slug,
            sku                 : item?.sku,
            category_ids        : categoryIds,
            sub_category_ids    : subCategoryIds,
            sub_sub_category_ids: item?.sub_sub_categories?.map(sub => sub.id),
            brand_id            : item?.brand?.id,
            current_stock       : item?.current_stock,
            total_sell_qty      : item?.total_sell_qty,
            minimum_qty         : item?.minimum_qty,
            video_url           : item?.video_url,
            status              : item?.status,
            mrp                 : item?.mrp,
            offer_price         : item?.offer_price,
            sell_price          : item?.sell_price,
            description         : item?.description,
            short_description   : item?.short_description,
        });

        setQuickEditLoading(false);
    };

    const handleSearch = (value) => {
        const cleaned = value.trim();
        setSearchQuery(cleaned);
        setCurrentPage(1);
    };

    const handleStatusChange = (value) => {
        setProductStatus(value);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setBrandIds([]);
        setCategoryIds([]);
        setSubCategoryIds([]);
        setSubSubCategoryIds([]);
        setAttributeValueIds([]);
        setTagIds([]);
        setDateRange([null, null]);
        setMinPrice(undefined);
        setMaxPrice(undefined);
        setProductTypeId(null);
        setProductStatus("active");
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handlePreview = async (record) => {

        if (!record || !record.id) return;
    
        setPreviewModal(true);

        setPreviewData(record);

        setSettingsData(settings.frontend_base_url || "http://localhost:3000/");
    };


    const handleImagePreview = (imageSrc) => {
        setPreviewImage(imageSrc);
        setImagePreviewModal(true);
    };

    const handleEdit = (record) => {
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("paginate_size", pageSize);
        if (searchQuery) params.append("search", searchQuery);
        if (productStatus) params.append("status", productStatus);
        if (brandIds.length) params.append("brands", brandIds.join(","));
        if (categoryIds.length) params.append("categories", categoryIds.join(","));
        if (subCategoryIds.length) params.append("sub_categories", subCategoryIds.join(","));
        if (subSubCategoryIds.length) params.append("sub_sub_categories", subSubCategoryIds.join(","));
        if (attributeValueIds.length) params.append("attributes", attributeValueIds.join(","));
        if (minPrice) params.append("min_price", minPrice);
        if (maxPrice) params.append("max_price", maxPrice);
        if (dateRange && dateRange.length === 2) {
            params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
            params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
        }

        navigate(`/product-edit/${record.id}?${params.toString()}`);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);

        setCurrentPage(parseInt(params.get("page")) || 1);
        setPageSize(parseInt(params.get("paginate_size")) || 10);
        setSearchQuery(params.get("search") || "");
        setProductStatus(params.get("status") || "");
        setBrandIds(params.get("brands") ? params.get("brands").split(",").map(Number) : []);

        const categoriesFromQuery = params.get("categories") ? params.get("categories").split(",").map(Number) : [];
        if (categoriesFromQuery.length > 0) {
            handleCategoryChange(categoriesFromQuery);
            setCategoryIds(categoriesFromQuery);
        }

        setSubCategoryIds(params.get("sub_categories") ? params.get("sub_categories").split(",").map(Number) : []);
        setSubSubCategoryIds(params.get("sub_sub_categories") ? params.get("sub_sub_categories").split(",").map(Number) : []);
        setAttributeValueIds(params.get("attributes") ? params.get("attributes").split(",").map(Number) : []);
        setDateRange(params.get("start_date") && params.get("end_date") ? [dayjs(params.get("start_date")), dayjs(params.get("end_date"))] : []);
        setMinPrice(params.get("min_price") ? Number(params.get("min_price")) : undefined);
        setMaxPrice(params.get("max_price") ? Number(params.get("max_price")) : undefined);
    }, [location.search]);

    const handleCopy = async (id) => {
        if (productCreate) {
            try {
                setCopyLoadingId(id);

                const res = await postData(`/admin/products/copy/${id}`);
                if (res?.success) {
                    
                    messageApi.open({
                        type: "success",
                        content: "Product copied successfully",
                    });

                    window.location.reload();
                }
            } catch {
                messageApi.open({
                    type: "error",
                    content: "Error copying product",
                });
            }finally{
                setCopyLoadingId(null);
            }
        } else {
            messageApi.open({
                type: "warning",
                content: "You don't have permission to copy Product",
            });
        }
    };

    const handleDelete = async (record) => {
        if (!productDelete) {
            message.error("You don't have permission to delete Product");
            return;
        }

        modal.confirm({
            title: "Are you sure you want to delete this product?",
            content: "This action cannot be undone.",
            okText: "Yes, delete",
            cancelText: "No",
            okType: "danger",
            centered: true,
            maskClosable: false,
            zIndex: 2000,
            onOk: async () => {
                try {
                    const res = await deleteData(`/admin/products/${record.id}`, {}, "DELETE");

                    if (res?.success) {
                        messageApi.open({
                            type: "success",
                            content: "Product deleted successfully",
                        });

                        if (products.length === 1 && currentPage > 1) {
                            setCurrentPage((p) => p - 1);
                        }

                        setProducts((prev) => prev.filter((p) => p.id !== record.id));

                        setTableData((prev) => ({
                            ...prev,
                            total: prev.total - 1,
                        }));

                    } else {
                        message.error(res?.message || "Delete failed");
                    }
                } catch (e) {
                    console.error(e);
                    message.error("Error deleting product");
                }
            }
        });
    };

    const handleProductAdd = () => {
        if (productCreate) {
            navigate("/product-add");
        } else {
            message.error("You don't have permission to create Product");
        }
    };

    const handleBulkAction = (value) => {
        if (value === "bulk-status-update") {
            setBulkStatusModal(true);
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatusValue) {
            message.error("Please select a status");
            return;
        }
    
        try {
            const res = await postData("/admin/products/bulk/update/status", {product_ids: selectedRowKeys,status: bulkStatusValue});
    
          if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: "Products updated successfully",
                });

                setBulkStatusModal(false);
                setSelectedAction("");
                setSelectedRowKeys([]);
                setBulkStatusValue("");
                setIsActionShow(false);
    
                const refreshData = async () => {
                    setLoading(true);
                    try {
                        const res = await getDatas("/admin/products", {page: currentPage,paginate_size: pageSize,search_key: debouncedSearchQuery,status: productStatus});
            
                        if (res?.success) {
                            setTableData(res?.result);
                            setProducts(res?.result?.data || []);
                        }
                    } catch {
                        message.error("Error fetching products");
                    } finally {
                        setLoading(false);
                    }
                };
    
            refreshData();
          }
        } catch {
          message.error("Error updating products");
        }
    };


    const handleToggleTrash = () => {
        navigate("/product/trash");
    };

    const handleBulkDelete = async (action) => {
        if (selectedRowKeys.length === 0) return message.error("Select at least one product");

        if (action === "bulk-delete") {
            try {
                const res = await deleteData("/admin/products/bulk/delete", {data: {product_ids: selectedRowKeys}});
                if (res && res?.success) {
                    messageApi.open({
                        type: "success",
                        content: "Product deleted successfully",
                    });
                    setSelectedRowKeys([]);
                    setIsActionShow(false);
                } else {
                    message.error(res?.msg || "Bulk delete failed");
                }
            } catch {
                message.error("Bulk delete failed");
            }
        }
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
        setIsActionShow(newSelectedRowKeys.length > 0);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const hasSelected = selectedRowKeys.length > 0;

    useEffect(() => {
        const fetchProductsData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
        
                params.append("page", currentPage);
                params.append("paginate_size", pageSize);

                if (debouncedSearchQuery) {
                    params.append("search_key", debouncedSearchQuery);
                }

                params.append("status", productStatus);
        
                if (brandIds.length > 0) {
                    brandIds.forEach((id) => params.append("brand_ids[]", id));
                }

                if (categoryIds.length > 0) {
                    categoryIds.forEach((id) => params.append("category_ids[]", id));
                }

                if (subCategoryIds.length > 0) {
                    subCategoryIds.forEach((id) =>
                        params.append("sub_category_ids[]", id)
                    );
                }

                if (subSubCategoryIds.length > 0) {
                    subSubCategoryIds.forEach((id) =>
                        params.append("sub_sub_category_ids[]", id)
                    );
                }

                if (attributeValueIds.length > 0) {
                    attributeValueIds.forEach((id) =>
                        params.append("attribute_value_ids[]", id)
                    );
                }

                if (tagIds.length > 0) {
                    tagIds.forEach((id) => params.append("tag_ids[]", id));
                }

                if (productTypeId) {
                    params.append("product_type_id", productTypeId);
                }
        
                if (dateRange?.[0] && dateRange?.[1]) {
                    params.append("start_date", dayjs(dateRange[0]).format("YYYY-MM-DD"));
                    params.append("end_date", dayjs(dateRange[1]).format("YYYY-MM-DD"));
                }
        
                if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
                    params.append("min_price", String(minPrice));
                }

                if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
                    params.append("max_price", String(maxPrice));
                }
        
                const paramsObj = {};

                params.forEach((value, key) => {
                    if (paramsObj[key]) {
                        if (Array.isArray(paramsObj[key])) {
                            paramsObj[key].push(value);
                        } else {
                            paramsObj[key] = [paramsObj[key], value];
                        }
                    } else {
                        paramsObj[key] = value;
                    }
                });
        
                const res = await getDatas("/admin/products", paramsObj);
        
                if (res?.success) {
                    setTableData(res?.result?.meta);
                    const allProducts = res?.result?.data || [];
            
                    setActiveCount(res?.result?.totalActiveCount || 0);
                    setInactiveCount(res?.result?.totalInactiveCount || 0);
            
                    setProducts(allProducts);
                }
            } catch {
                message.error("Error fetching products");
            } finally {
                setLoading(false);
            }
        };
    
        fetchProductsData();
    }, [currentPage,pageSize,productStatus,debouncedSearchQuery,brandIds,categoryIds,subCategoryIds,subSubCategoryIds,attributeValueIds,tagIds,dateRange,minPrice,maxPrice,productTypeId]);


    const handleQuickUpdate = async (values) => {
        const formData = new FormData();

        if(values.name) formData.append('name', values.name);
        if(values.slug) formData.append('slug', values.slug);
        if(values.sku) formData.append('sku', values.sku);

        values.category_ids?.forEach(id => {
            formData.append('category_ids[]', id);
        })

        values.sub_category_ids?.forEach(id => {
            formData.append('sub_category_ids[]', id);
        })

        values.sub_sub_category_ids?.forEach(id => {
            formData.append('sub_sub_category_ids[]', id);
        })

        if(values.brand_id) formData.append('brand_id', values.brand_id);
        if(values.current_stock) formData.append('current_stock', values.current_stock);
        if(values.video_url) formData.append('video_url', values.video_url);
        if(values.total_sell_qty) formData.append('total_sell_qty', values.total_sell_qty);
        if(values.minimum_qty) formData.append('minimum_qty', values.minimum_qty);
        if(values.mrp) formData.append('mrp', values.mrp);
        if(values.offer_price) formData.append('offer_price', values.offer_price);
        if(values.description) formData.append('description', values.description);
        if(values.short_description) formData.append('short_description', values.short_description);
        if(values.status) formData.append('status', values.status);

        formData.append('_method', 'PUT');

        try {
            setQuickEditLoading(true);

            const res = await postData(`/admin/products/${editingProduct.id}`, formData);

            if(res && res?.success){
                const updatedProduct = res.result;

                setProducts(prevData => prevData.map(product =>
                    product.id === updatedProduct.id ? updatedProduct : product
                ));

                messageApi.open({
                    type: "success",
                    content: res?.msg,
                });
            }else{
               messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                }); 
            }
        } catch (error) {
            console.log(error);
        }finally{
            setQuickEditLoading(false);
            setQuickEditOpen(false);
        }
    };

    const handleSlugChange = (e) => {
        const value = e.target.value;

        setSlugLoading(true);

        clearTimeout(slugTimer.current);

        slugTimer.current = setTimeout(() => {
            console.log("Typing finished:", value);

            checkSlugFromDB(value);
        }, 600);
    };

    const checkSlugFromDB = async (slug) => {
        try {
            const res = await getDatas(`/admin/products/check-slug?slug=${slug}`);

            const finalSlug = res.result;

            form.setFieldValue("slug", finalSlug);
        } finally {
            setSlugLoading(false);
        }
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
            ],
            handlers: {
                image: function () {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");
                    input.setAttribute("accept", "image/*");
                    input.click();

                    input.onchange = () => {
                        const file = input.files[0];
                        const reader = new FileReader();
                        reader.onload = () => {
                            const quill = this.quill;
                            const range = quill.getSelection();
                            quill.insertEmbed(range.index, "image", reader.result);
                        };
                        reader.readAsDataURL(file);
                    };
                },
            },
        },
        history: {
            delay: 500,
            maxStack: 100,
            userOnly: true,
        },
    }), []);

    return (
        <>
            {modalContextHolder}
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Products</h1>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "All Products" }]}/>
                </div>
            </div>

            <div className="product-filter-section" style={{ marginBottom: 16 }}>
                <div className="filter-desktop-actions" style={{ marginBottom: 12 }}>
                    <Row gutter={16} justify="space-between" align="middle">
                        <Col>
                            <Tabs activeKey={activeTab} onChange={(key) => {setActiveTab(key);setProductStatus(key);}}
                                items={
                                [
                                    {
                                        key: "active",
                                        label: (
                                            <span>
                                                Active <strong>({activeCount})</strong>
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "inactive",
                                        label: (
                                            <span>
                                                Inactive <strong>({inactiveCount})</strong>
                                            </span>
                                        ),
                                    },
                                ]}
                            />
                        </Col>
            
                        <Col>
                            <Space>
                                <Button size="small" icon={<FilterOutlined />} onClick={() => setFiltersOpen((v) => !v)}>
                                    {filtersOpen ? "Hide Filters" : "Show Filters"}
                                </Button>
            
                                {isActionShow && (
                                    <Select value={selectedAction} onChange={handleBulkAction} placeholder="Action" style={{ width: 150 }}>
                                        <Option value="bulk-status-update">Bulk Status Update</Option>
                                    </Select>
                                )}
            
                                {isActionShow && (
                                    <Select value={selectedAction} onChange={handleBulkDelete} placeholder="Action" style={{ width: 150 }}>
                                        <Option value="bulk-delete">Bulk Delete</Option>
                                    </Select>
                                )}
            
                                {productCreate && (
                                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleProductAdd}>
                                        Add
                                    </Button>
                                )}
            
                                {productDelete && (
                                    <Button size="small" danger icon={<DeleteOutlined />} onClick={handleToggleTrash}>
                                        Trash
                                    </Button>
                                )}
            
                                <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                                    Back
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
        
                {/* Mobile Actions (Always Visible) */}
                <div className="filter-mobile-actions" style={{ marginBottom: 12 }}>
                    <Space size="small" style={{ width: "100%" }}>
                        <Button icon={<FilterOutlined />} onClick={() => setFiltersOpen((v) => !v)} style={{ flex: 1 }}>
                            {filtersOpen ? "Hide" : "Filters"}
                        </Button>
        
                        {isActionShow && (
                            <Select value={selectedAction} onChange={handleBulkAction} placeholder="Action" style={{ flex: 1 }}>
                                <Option value="bulk-status-update">Bulk Status Update</Option>
                            </Select>
                        )}
        
                        {productCreate && (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleProductAdd} style={{ flex: 1 }}>
                                Add
                            </Button>
                        )}
        
                        {productDelete && (
                            <Button type="primary" icon={<DeleteOutlined />} onClick={handleToggleTrash} style={{ flex: 1 }}>
                                Trash
                            </Button>
                        )}
        
                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ flex: 1 }}>
                            Back
                        </Button>
                    </Space>
                </div>
        
                <div className={`product-filter-collapsible ${filtersOpen ? "is-open" : ""}`} aria-hidden={!filtersOpen} aria-expanded={filtersOpen}>
                    <div className="filter-desktop">
                        <Row gutter={16} justify="space-between" align="middle">
                            <Col>
                                <Space wrap>
                                    <AntInput placeholder="Search Key..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} style={{ width: 200 }}/>
                
                                    <Select value={productStatus} onChange={handleStatusChange} placeholder="Select Status" style={{ width: 150 }}>
                                        <Option value="active">Active</Option>
                                        <Option value="inactive">Inactive</Option>
                                    </Select>
                
                                    {/* Brand Filter */}
                                    <Select mode="multiple" value={brandIds} onChange={setBrandIds} placeholder="Select Brand" style={{ width: 180 }} allowClear>
                                        {brands?.map((b) => (
                                            <Option key={b.id} value={b.id}>
                                                {b.name}
                                            </Option>
                                        ))}
                                    </Select>
                
                                    {/* Category Filter */}
                                    <Select mode="multiple" value={categoryIds} onChange={handleCategoryChange} placeholder="Select Category" style={{ width: 180 }} allowClear>
                                        {Array.isArray(categories) &&
                                            categories.map((c) => (
                                            <Option key={c.id} value={c.id}>
                                                {c.name}
                                            </Option>
                                        ))}
                                    </Select>
                
                                    <Select mode="multiple" value={subCategoryIds} onChange={handleSubCategoryChange} placeholder="Select Sub Category" style={{ width: 180 }} allowClear>
                                        {Array.isArray(subCategories) &&
                                            subCategories.map((s) => (
                                            <Option key={s.id} value={s.id}>
                                                {s.name}
                                            </Option>
                                        ))}
                                    </Select>

                                    <Select mode="multiple" value={subSubCategoryIds} onChange={setSubSubCategoryIds} placeholder="Select Sub Sub Category" style={{ width: 200 }} allowClear>
                                        {Array.isArray(subCategories) && 
                                            subSubCategories.map((ssc) => (
                                            <Option key={ssc.id} value={ssc.id}>
                                                {ssc.name}
                                            </Option>
                                        ))}
                                    </Select>
                
                                    <Select value={productTypeId} onChange={setProductTypeId} placeholder="Select Product Type" style={{ width: 180 }} allowClear>
                                        {productTypes.map((t) => (
                                            <Option key={t.id} value={t.id}>
                                                {t.name}
                                            </Option>
                                        ))}
                                    </Select>
                
                                    <Select mode="multiple" value={attributeValueIds} onChange={setAttributeValueIds} placeholder="Select Attribute Values" style={{ width: 240 }} allowClear maxTagCount="responsive" showSearch optionFilterProp="children">
                                        {attributeValues.map((av) => (
                                            <Option key={av.id} value={av.id}>
                                                {av.attribute?.name ? `${av.attribute.name} — ${av.value}` : av.value}
                                            </Option>
                                        ))}
                                    </Select>
                
                                    <DatePicker.RangePicker value={dateRange} onChange={(v) => setDateRange(v)} style={{ width: 260 }} allowEmpty={[true, true]}/>
                
                                    <InputNumber value={minPrice} onChange={setMinPrice} placeholder="Min Price" style={{ width: 120 }} min={0}/>
                
                                    <InputNumber value={maxPrice} onChange={setMaxPrice} placeholder="Max Price" style={{ width: 120 }} min={0}/>
                
                                    <Button onClick={clearFilters}>Clear Filters</Button>
                                </Space>
                            </Col>
                        </Row>
                    </div>
        
                    <div className="filter-mobile">
                        <div className="filter-mobile-inputs">
                            <AntInput placeholder="Search..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)}/>
            
                            <Select value={productStatus} onChange={handleStatusChange} placeholder="Status" style={{ width: "100%" }}>
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
            
                            <Select mode="multiple" value={brandIds} onChange={setBrandIds} placeholder="Brand" allowClear style={{ width: "100%" }}>
                                {brands.map((b) => (
                                    <Option key={b.id} value={b.id}>
                                        {b.name}
                                    </Option>
                                ))}
                            </Select>
            
                            <Select mode="multiple" value={categoryIds} onChange={setCategoryIds} placeholder="Category" allowClear style={{ width: "100%" }}>
                                {categories.map((c) => (
                                    <Option key={c.id} value={c.id}>
                                        {c.name}
                                    </Option>
                                ))}
                            </Select>
            
                            <Select mode="multiple" value={subCategoryIds} onChange={setSubCategoryIds} placeholder="Sub Category" allowClear style={{ width: "100%" }}>
                                {subCategories.map((s) => (
                                    <Option key={s.id} value={s.id}>
                                        {s.name}
                                    </Option>
                                ))}
                            </Select>
            
                            <Select value={productTypeId} onChange={setProductTypeId} placeholder="Product Type" allowClear style={{ width: "100%" }}>
                                {productTypes.map((t) => (
                                    <Option key={t.id} value={t.id}>
                                        {t.name}
                                    </Option>
                                ))}
                            </Select>
            
                            <Select mode="multiple" value={subSubCategoryIds} onChange={setSubSubCategoryIds} placeholder="Sub Sub Category" allowClear style={{ width: "100%" }}>
                                {subSubCategories.map((ssc) => (
                                    <Option key={ssc.id} value={ssc.id}>
                                        {ssc.name}
                                    </Option>
                                ))}
                            </Select>
            
                            <Select mode="multiple" value={attributeValueIds} onChange={setAttributeValueIds} placeholder="Attribute Values" allowClear style={{ width: "100%" }} maxTagCount="responsive" showSearch optionFilterProp="children">
                                {attributeValues.map((av) => (
                                    <Option key={av.id} value={av.id}>
                                        {av.attribute?.name ? `${av.attribute.name} — ${av.value}` : av.value}
                                    </Option>
                                ))}
                            </Select>
            
                            <DatePicker.RangePicker value={dateRange} onChange={(v) => setDateRange(v)} style={{ width: "100%" }} allowEmpty={[true, true]}/>
            
                            <InputNumber value={minPrice} onChange={setMinPrice} placeholder="Min Price" style={{ width: "100%" }} min={0}/>

                            <InputNumber value={maxPrice} onChange={setMaxPrice} placeholder="Max Price" style={{ width: "100%" }} min={0}/>
            
                            <Button onClick={clearFilters} block>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <Flex gap="middle" vertical>
                    <Flex align="center" gap="middle">
                        {hasSelected ? `Selected ${selectedRowKeys.length} items` : null}
                    </Flex>
        
                    <div className="product-table-desktop">
                        <Table rowSelection={rowSelection} columns={columns} dataSource={products} loading={loading} tableLayout="fixed" size="small" bordered scroll={{ x: "max-content" }} rowKey="id"
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: tableData?.total || 0,
                                showSizeChanger: true,
                                pageSizeOptions: [10, 20, 50, 100],
                                showQuickJumper: true,
                                showTotal: (total, range) =>`${range[0]}-${range[1]} of ${total} items`,
                                onChange: (page, size) => {setCurrentPage(page);setPageSize(size);},
                            }}
                        />
                    </div>
        
                    <div className="product-table-mobile">
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                Loading...
                            </div>
                        ) : products.length > 0 ? (
                            products.map((item) => {
                                const hasVariations = item?.variations && item?.variations.length > 0;
                                const minPrice = item?.variation_price_range?.min_price || 0;
                                const maxPrice = item?.variation_price_range?.max_price || 0;
            
                                return (
                                    <div key={item.id} className="mobile-card">
                                        <div className="mobile-top">
                                            <img
                                            src={item.image}
                                            alt={item.name}
                                            className="mobile-image"
                                            onClick={() => handleImagePreview(item.image)}
                                            />
                    
                                            <div className="mobile-info">
                                            <h4>{item.name}</h4>
                    
                                            <div className="info-pairs">
                                                <div className="pair-left">
                                                <p>
                                                    <strong>Brand:</strong>{" "}
                                                    {item.brand?.name || "N/A"}
                                                </p>
                                                <p>
                                                    <strong>Category:</strong>{" "}
                                                    {item.category?.name || "N/A"}
                                                </p>
                                                </div>
                                                <div className="divider"></div>
                                                <div className="pair-right">
                                                <p>
                                                    <strong>SKU:</strong> {item.sku || "N/A"}
                                                </p>
                                                <p>
                                                    <strong>Sub Category:</strong>{" "}
                                                    {item.sub_category?.name || "N/A"}
                                                </p>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                
                                        {!hasVariations ? (
                                            <div className="mobile-price-section">
                                            <div className="price-pair-row">
                                                <div className="price-left">
                                                <span>
                                                    <strong>Buy Price:</strong> {item.buy_price || 0}
                                                </span>
                                                </div>
                                                <div className="divider"></div>
                                                <div className="price-right">
                                                <span>
                                                    <strong>MRP:</strong> {item.mrp || 0}
                                                </span>
                                                </div>
                                            </div>
                    
                                            <div className="price-pair-row">
                                                <div className="price-left">
                                                <span>
                                                    <strong>Offer:</strong> {item.offer_price || 0}
                                                </span>
                                                </div>
                                                <div className="divider"></div>
                                                <div className="price-right">
                                                <span>
                                                    <strong>Sell:</strong> {item.sell_price || 0}
                                                </span>
                                                </div>
                                            </div>
                                            </div>
                                        ) : (
                                            <div className="mobile-price-section">
                                                <p className="variation-price">
                                                    <strong>Variation Price:</strong> {minPrice} —{" "}
                                                    {maxPrice}
                                                </p>
                                            </div>
                                        )}
                
                                        <div className="mobile-bottom">
                                            <div className="mobile-actions action-buttons-wrapper">
                                                <Tooltip title="Quick Edit" color="#1677ff">
                                                    <Button 
                                                        className="action-btn quick-edit"
                                                        size="small" 
                                                        icon={<FormOutlined />} 
                                                        onClick={() => handleQuickEdit(item)}
                                                    />
                                                </Tooltip>

                                                <Tooltip title="Product View" color="#13c2c2">
                                                    <Button 
                                                        className="action-btn view"
                                                        size="small" 
                                                        icon={<EyeOutlined />} 
                                                        onClick={() => handlePreview(item)}
                                                    />
                                                </Tooltip>

                                                {productUpdate && (
                                                    <Tooltip title="Product Edit" color="#722ed1">
                                                        <Button 
                                                            className="action-btn edit"
                                                            size="small" 
                                                            icon={<EditOutlined />} 
                                                            onClick={() => handleEdit(item)}
                                                        />
                                                    </Tooltip>
                                                )}

                                                {productCreate && (
                                                    <Tooltip title="Product Copy" color="#fa8c16">
                                                        <Button 
                                                            className="action-btn duplicate"
                                                            size="small" 
                                                            icon={<CopyOutlined />} 
                                                            onClick={() => handleCopy(item.id)} 
                                                            loading={copyLoadingId === item.id}
                                                        />
                                                    </Tooltip>
                                                )}

                                                {productDelete && (
                                                    <Tooltip title="Product Delete" color="#ff4d4f">
                                                        <Button 
                                                            className="action-btn delete"
                                                            size="small" 
                                                            icon={<DeleteOutlined />} 
                                                            onClick={() => handleDelete(item)}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </div>
                    
                                            <div className="mobile-status">
                                                <Tag color="blue">
                                                    {item.free_shipping === false ? "No" : "Yes"}
                                                </Tag>

                                                <Tag color={item.status === "active" ? "green" : "red"}>
                                                    {item.status === "active" ? "Active" : "Inactive"}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <Empty description="No Products Found" />
                        )}
                    </div>
                </Flex>
            </div>

            <Modal title="Product Preview" open={previewModal} onCancel={() => setPreviewModal(false)} footer={null} width={900}>
                {loading ? (
                    <Spin />
                ) : (
                    previewData && (
                        <Row gutter={24}>
                            <Col span={10}>
                                <img src={previewData.image || "/free.jpg"} alt={previewData.name} style={{ width: "100%", borderRadius: 8 }}/>
                                {previewData.images && previewData.images.length > 0 && (
                                    <Row gutter={8} style={{ marginTop: 8 }}>
                                        {previewData.images.map((img, idx) => (
                                            <Col key={idx} span={6}>
                                                <img src={img.image} alt={`variation-${idx}`} style={{ width: "100%", borderRadius: 4 }}/>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Col>
            
                            {/* Right: Product Info */}
                            <Col span={14}>
                                <h3 className="view-product-header">
                                    <span className="product-name">{previewData.name}</span>
                
                                    {previewData.slug && (
                                        <Button type="primary" size="small" icon={<EyeOutlined />} title="View Product" onClick={() => window.open(`${settingsData.replace(/\/$/, "")}/product/${previewData.slug}`,"_blank")}className="view-button">
                                            View
                                        </Button>
                                    )}
                                </h3>
            
                                <p>
                                    <strong>SKU:</strong> {previewData.sku || "N/A"}
                                </p>
            
                                <p>
                                    <strong>Status:</strong>{" "}
                                        <Tag color={previewData.status === "active" ? "green" : "red"} style={{ marginLeft: 8 }}>
                                        {previewData.status === "active" ? "Active" : "Inactive"}
                                    </Tag>
                                </p>
            
                                {previewData.categories.length > 0 && (
                                    <p>
                                        <strong>Category:</strong> {previewData.categories.map(item => item.name).join(", ")}
                                    </p>
                                )}

                                {previewData.sub_categories.length > 0 && (
                                    <p>
                                        <strong>Sub Category:</strong> {previewData.sub_categories.map(item => item.name).join(", ")}
                                    </p>
                                )}

                                {previewData.sub_sub_categories.length > 0 && (
                                    <p>
                                        <strong>Sub Sub Category:</strong> {previewData.sub_sub_categories.map(item => item.name).join(", ")}
                                    </p>
                                )}

                                {previewData.brand_id && (
                                    <p>
                                        <strong>Brand:</strong> {previewData.brand.name}
                                    </p>
                                )}
            
                                {previewData.variation_price_range.min_price > 0 ? (
                                    <p style={{ fontSize: 18, fontWeight: 600, color: "#27ae60" }}>
                                        {previewData.variation_price_range.min_price} Tk -{" "}
                                        {previewData.variation_price_range.max_price} Tk
                                    </p>
                                ) : (
                                   <p style={{ fontSize: 18, fontWeight: 600, color: "#27ae60" }}>
                                        {previewData.sell_price} Tk 
                                    </p> 
                                )}
            
                                {previewData.short_description && (
                                    <div style={{ marginTop: 16 }}>
                                        <h4>Short Description:</h4>
                                        <div dangerouslySetInnerHTML={{__html: previewData.short_description}} style={{ maxHeight: 200, overflowY: "auto" }}/>
                                    </div>
                                )}
            
                                {previewData.description && (
                                    <div style={{ marginTop: 16 }}>
                                        <h4>Description:</h4>
                                        <div dangerouslySetInnerHTML={{__html: previewData.description}} style={{ maxHeight: 200, overflowY: "auto" }}/>
                                    </div>
                                )}
            
                                {previewData.variations?.data?.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <Table columns={columns} dataSource={previewData.variations.data} rowKey="id" pagination={false} size="small"/>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    )
                )}
            </Modal>

            <Modal title="Image Preview" open={imagePreviewModal} onCancel={() => setImagePreviewModal(false)} footer={null}>
                {previewImage && (
                    <img src={previewImage} alt="Preview" style={{ width: "100%" }} />
                )}
            </Modal>

            <Modal title="Change Product Status" open={bulkStatusModal} onOk={handleBulkStatusUpdate} onCancel={() => {setBulkStatusModal(false);setBulkStatusValue("");}} width={300}>
                <Select value={bulkStatusValue} onChange={setBulkStatusValue} placeholder="Select Status" style={{ width: "100%" }}>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                </Select>
            </Modal>

            <Modal title="Product Details" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => setIsModalOpen(false)} width={800}>
                {selectedProduct ? (
                    <div>
                        <Space align="center" size="middle" wrap>
                            <Title level={5} style={{ margin: 0 }}>Product ID:</Title>
                            <Text code>{selectedProduct.id}</Text>
                            <Button type="default" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(selectedProduct.id)}>
                                Copy
                            </Button>
                        </Space>
        
                        <Divider />
        
                        {normalizedVariations.length === 0 ? (
                            <Text type="secondary">This product has no variations.</Text>
                        ) : (
                            <div>
                                <Title level={5} style={{ marginBottom: 12 }}>
                                    Variations & Attribute Values
                                </Title>
            
                                {normalizedVariations.map(({ variationId, attrs }) => (
                                    <div key={variationId} style={{ padding: 12, border: "1px solid #f0f0f0", borderRadius: 8, marginBottom: 12 }}>
                                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    
                                            {attrs.length === 0 ? (
                                                <Text type="secondary">No attributes on this variation.</Text>
                                            ) : (
                                                attrs.map((a) => (
                                                    <div key={`${variationId}-${a.slot}`} style={{ paddingLeft: 8 }}>
                                                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                                            <Space wrap>
                                                                <Tag>Attribute Value</Tag>

                                                                <Text code>{a.value} - {a.valueId}</Text>
                                                                
                                                                <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(a.valueId)}>
                                                                    Copy
                                                                </Button>
                                                            </Space>
                                                        </Space>
                                                    </div>
                                                ))
                                            )}
                                        </Space>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <Text type="secondary">No product selected.</Text>
                )}
            </Modal>

            <Modal title="Quick Edit Product" open={quickEditOpen} onCancel={() => setQuickEditOpen(false)} onOk={() => form.submit()} width={900} loading={quickEditLoading}>
                <Form layout="vertical" form={form} onFinish={handleQuickUpdate}>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="name" label="Product Name" required>
                                <AntInput />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="slug" label="Slug">
                                <AntInput onChange={handleSlugChange} suffix={slugLoading ? <Spin size="small" /> : null}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="sku" label="SKU">
                                <AntInput />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="category_ids" label="Category">
                                <Select mode="multiple"
                                    options={categories?.map(item => ({
                                        label: item.name,
                                        value: item.id
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="sub_category_ids" label="Sub Category">
                                <Select mode="multiple" placeholder="Select Sub Category" options={subCategoryList?.map(item => ({
                                    label: item.name,
                                    value:item.id
                                }))}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="sub_sub_category_ids" label="Sub Sub Category">
                                <Select mode="multiple" placeholder="Select Sub Sub Category" options={subSubCategoryList?.map(item => ({
                                    label: item?.name,
                                    value: item?.id
                                }))}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="brand_id" label="Brand">
                                <Select placeholder="Select Brand" options={brands?.map(item => ({
                                    label: item.name,
                                    value:item.id
                                }))}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="current_stock" label="Current Stock">
                                <AntInput placeholder="0"/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="total_sell_qty" label="Sold Quantity">
                                <AntInput placeholder="0"/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="minimum_qty" label="Minimum Quantity">
                                <AntInput placeholder="0"/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="video_url" label="Video Url">
                                <AntInput placeholder="Add Video Url"/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="status" label="Status">
                                <Select placeholder="Select" options={[{ label: "Active", value: "active" },{ label: "Inactive", value: "inactive" },]}/>
                            </Form.Item>
                        </Col>

                        {editingProduct?.variations?.length === 0 && (
                            <>
                                <Col span={8}>
                                    <Form.Item name="mrp" label="Regular Price">
                                        <AntInput />
                                    </Form.Item>
                                </Col>

                                <Col span={8}>
                                    <Form.Item name="offer_price" label="Offer Price">
                                        <AntInput />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        {editingProduct?.variations?.length === 0 && (
                            <>
                                <Col span={24}>
                                    <Form.Item name="short_description" label="Short Description">
                                        <ReactQuill theme="snow" placeholder="Write your short description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item name="description" label="Description">
                                        <ReactQuill theme="snow" placeholder="Write your description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px",}}/>
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                    </Row>
                </Form>
            </Modal>
        </>
    )
}
