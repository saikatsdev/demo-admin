import {ArrowLeftOutlined,BarcodeOutlined,CopyOutlined,DeleteOutlined,DownloadOutlined,EditOutlined,ShoppingCartOutlined,EyeOutlined,FilterOutlined,FormOutlined,GlobalOutlined,InfoCircleOutlined,PlaySquareOutlined,PlusOutlined,ReloadOutlined} from "@ant-design/icons";
import {Input as AntInput,Typography,Breadcrumb,Badge,Tabs,Button,Col,Card,DatePicker,Descriptions,Empty,Flex,InputNumber,Modal,Form,Row,Divider,Select,Space,Table,Tag,Tooltip,message,Spin} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {deleteData,getDatas,postData} from "../../api/common/common";
import { useDebounce } from "../../hooks/useDebounce";
import useTitle from "../../hooks/useTitle";
import "./Product.css";
import { cachedFetch } from "../../utils/cacheApi";
import { usePermission } from "../../hooks/usePermission";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useAppSettings } from "../../contexts/useAppSettings";
import { exportData } from "../../api/common/common";

const { Option } = Select;

const { Text, Title } = Typography;
const DEFAULT_PRODUCT_PAGE_SIZE = 25;
const PRODUCT_PAGE_SIZE_OPTIONS = [25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
const PRODUCT_RETURN_FOCUS_KEY = "product_return_focus_id";

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
    const location = useLocation();

    const [searchQuery, setSearchQuery]                   = useState("");
    const [selectedRowKeys, setSelectedRowKeys]           = useState([]);
    const [loading, setLoading]                           = useState(false);
    const [products, setProducts]                         = useState([]);
    const [tableData, setTableData]                       = useState(null);
    const [currentPage, setCurrentPage]                   = useState(1);
    const [pageSize, setPageSize]                         = useState(DEFAULT_PRODUCT_PAGE_SIZE);
    const [productStatus, setProductStatus]               = useState("active");
    const [selectedAction, setSelectedAction]             = useState("");
    const [isActionShow, setIsActionShow]                 = useState(false);
    const [filtersOpen, setFiltersOpen]                   = useState(false);
    const [activeCount, setActiveCount]                   = useState(0);
    const [inactiveCount, setInactiveCount]               = useState(0);
    const [activeTab, setActiveTab]                       = useState("active");
    const [previewModal, setPreviewModal]                 = useState(false);
    const [imagePreviewModal, setImagePreviewModal]       = useState(false);
    const [bulkStatusModal, setBulkStatusModal]           = useState(false);
    const [previewData, setPreviewData]                   = useState(null);
    const [previewImage, setPreviewImage]                 = useState("");
    const [selectedPreviewImage, setSelectedPreviewImage] = useState("");
    const [bulkStatusValue, setBulkStatusValue]           = useState("");
    const [brandIds, setBrandIds]                         = useState([]);
    const [categoryIds, setCategoryIds]                   = useState([]);
    const [subCategoryIds, setSubCategoryIds]             = useState([]);
    const [subSubCategoryIds, setSubSubCategoryIds]       = useState([]);
    const [attributeValueIds, setAttributeValueIds]       = useState([]);
    const [tagIds, setTagIds]                             = useState([]);
    const [dateRange, setDateRange]                       = useState([null, null]);
    const [minPrice, setMinPrice]                         = useState();
    const [maxPrice, setMaxPrice]                         = useState();
    const [minStock, setMinStock]                         = useState();
    const [maxStock, setMaxStock]                         = useState();
    const [productTypeId, setProductTypeId]               = useState(null);
    const [brands, setBrands]                             = useState([]);
    const [categories, setCategories]                     = useState([]);
    const [subCategories, setSubCategories]               = useState([]);
    const [subCategoryList, setSubCategoryList]           = useState([]);
    const [subSubCategories, setSubSubCategories]         = useState([]);
    const [subSubCategoryList, setSubSubCategoryList]     = useState([]);
    const [attributeValues, setAttributeValues]           = useState([]);
    const [productTypes, setProductTypes]                 = useState([]);
    const [modal, modalContextHolder]                     = Modal.useModal();
    const [messageApi, contextHolder]                     = message.useMessage();
    const [settingsData, setSettingsData]                 = useState(null);
    const [isModalOpen, setIsModalOpen]                   = useState(false);
    const [selectedProduct, setSelectedProduct]           = useState(null);
    const [copyLoadingId, setCopyLoadingId]               = useState(null);
    const [quickEditOpen, setQuickEditOpen]               = useState(false);
    const [editingProduct, setEditingProduct]             = useState(null);
    const [quickEditLoading, setQuickEditLoading]         = useState(false);
    const [slugLoading, setSlugLoading]                   = useState(false);
    const [highlightedProductId, setHighlightedProductId] = useState(null);
    const [csvExportLoading, setCsvExportLoading]         = useState(false);
    const [form]                                          = Form.useForm();

    const slugTimer = useRef(null);
    const returnFocusConsumedRef = useRef(null);

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
            width: 120,
            render: (src, record) => (
                <div className="product-image-container" onClick={() => handleImagePreview(src)}>
                    <img src={src} alt={record.name} className="product-table-image" />
                    <div className="image-overlay">
                        <EyeOutlined style={{ color: '#fff', fontSize: '20px' }} />
                    </div>
                </div>
            ),
        },
        {
            title: "Product Name",
            dataIndex: "name",
            key: "name",
            width: 200,
            render: (text, record) => (
                <div className="product-name-column">
                    <div className="name-with-info">
                        <Text strong className="product-name-text" ellipsis={{ tooltip: text }}>
                            {text}
                        </Text>
                        <Tooltip title="View Quick Info" color="#1677ff">
                            <Button type="text" size="small" className="info-trigger-btn" icon={<InfoCircleOutlined style={{ color: '#1677ff' }} />} onClick={() => handleProductInfo(record)}/>
                        </Tooltip>
                        {record.is_combo === 1 && (
                            <Tag color="purple" style={{ margin: 0, marginLeft: 4, fontSize: '10px', borderRadius: '4px', border: 'none', fontWeight: 600 }}>
                                COMBO
                            </Tag>
                        )}
                    </div>
                    {record.slug && (
                        <Text type="secondary" className="product-slug-text">
                            {record.slug}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: "Identity & Type",
            key: "sku",
            width: 280,
            render: (_, record) => (
                <div className="product-identity-card">
                    <div className="status-sku-header">
                        <Tag 
                            color={record.status === "active" ? "#f6ffed" : "#fff1f0"} 
                            style={{ 
                                color: record.status === "active" ? "#52c41a" : "#f5222d", 
                                borderColor: record.status === "active" ? "#b7eb8f" : "#ffa39e",
                                fontWeight: 700,
                                borderRadius: '4px',
                                fontSize: '10px'
                            }}
                        >
                            {record.status === "active" ? "ACTIVE" : "INACTIVE"}
                        </Tag>
                        {record.sku && (
                            <span className="sku-text">
                                <BarcodeOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                                {record.sku}
                            </span>
                        )}
                    </div>
                    
                    <div className="classification-details">
                        {record.product_type?.name && (
                            <div className="detail-item">
                                <span className="label">Type:</span>
                                <span className="value type-tag">{record.product_type.name}</span>
                            </div>
                        )}
                        
                        {record.brand?.name && (
                            <div className="detail-item">
                                <span className="label">Brand:</span>
                                <span className="value brand-name">{record.brand.name}</span>
                            </div>
                        )}

                        <div className="category-hierarchy">
                            {record.categories?.map((cat, index) => (
                                <span key={cat.id} className="cat-node">
                                    {cat.name}
                                    {index < record.categories.length - 1 || record.sub_categories?.length > 0 ? <span className="cat-sep">/</span> : null}
                                </span>
                            ))}
                            {record.sub_categories?.map((sub, index) => (
                                <span key={sub.id} className="cat-node sub">
                                    {sub.name}
                                    {index < record.sub_categories.length - 1 || record.sub_sub_categories?.length > 0 ? <span className="cat-sep">/</span> : null}
                                </span>
                            ))}
                            {record.sub_sub_categories?.map((ss) => (
                                <span key={ss.id} className="cat-node sub-sub">
                                    {ss.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Price Configuration",
            key: "product_prices",
            width: 220,
            render: (_, record) => {
                const hasVariations = record?.variations?.length > 0;
                
                if (hasVariations) {
                    const minPrice = Number(record?.variation_price_range?.min_price) || 0;
                    const maxPrice = Number(record?.variation_price_range?.max_price) || 0;
                    
                    return (
                        <div style={{ background: '#f0f5ff', padding: '12px', borderRadius: '10px', border: '1px solid #adc6ff' }}>
                             <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#2f54eb', fontWeight: 600 }}>Variation Price</Text>
                            </div>
                            <div style={{ textAlign: 'center', padding: '4px 0' }}>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d39c4' }}>
                                    ৳{minPrice.toLocaleString()} — ৳{maxPrice.toLocaleString()}
                                </div>
                                <Tag color="blue" style={{ marginTop: '8px', borderRadius: '4px', border: 'none', fontWeight: 600 }}>{record.variations.length} Variations</Tag>
                            </div>
                        </div>
                    );
                }

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

                            {record.free_shipping && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                                    padding: '5px 14px', borderRadius: 20, marginTop: 4,
                                    boxShadow: '0 3px 10px rgba(82, 196, 26, 0.35)',
                                }}>
                                    <ShoppingCartOutlined style={{ color: '#fff', fontSize: 14 }} />
                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 0.3 }}>Free Shipping</span>
                                </div>
                            )}
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
                const current = Number(record?.current_stock - record?.total_sell_qty) || 0;
                const purchase = Number(record?.total_purchase_qty) || 0;
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
        setMinStock(undefined);
        setMaxStock(undefined);
        setProductTypeId(null);
        setProductStatus("active");
        setActiveTab("active");
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handlePreview = async (record) => {
        if (!record || !record.id) return;
    
        setPreviewModal(true);
        setPreviewData(record);
        setSelectedPreviewImage(record.image || "/free.jpg");
        setSettingsData(settings?.frontend_base_url || "http://localhost:3000/");
    };


    const handleImagePreview = (imageSrc) => {
        setPreviewImage(imageSrc);
        setImagePreviewModal(true);
    };

    const handleEdit = (record) => {
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("paginate_size", pageSize);
        params.append("highlight_product_id", record.id);
        sessionStorage.setItem(PRODUCT_RETURN_FOCUS_KEY, String(record.id));
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
        setPageSize(parseInt(params.get("paginate_size")) || DEFAULT_PRODUCT_PAGE_SIZE);
        setSearchQuery(params.get("search") || "");
        
        const initialStatus = params.get("status") || "active";
        setProductStatus(initialStatus);
        setActiveTab(initialStatus);
        
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
        setMinStock(params.get("min_stock") ? Number(params.get("min_stock")) : undefined);
        setMaxStock(params.get("max_stock") ? Number(params.get("max_stock")) : undefined);
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

    const fetchProductsData = useCallback(async () => {
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

            if (minStock !== undefined && minStock !== null && minStock !== "") {
                params.append("min_stock", String(minStock));
            }

            if (maxStock !== undefined && maxStock !== null && maxStock !== "") {
                params.append("max_stock", String(maxStock));
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
    }, [currentPage,pageSize,productStatus,debouncedSearchQuery,brandIds,categoryIds,subCategoryIds,subSubCategoryIds,attributeValueIds,tagIds,dateRange,minPrice,maxPrice,minStock,maxStock,productTypeId]);

    useEffect(() => {
        fetchProductsData();
    }, [fetchProductsData]);

    useEffect(() => {
        if (!products.length) return;

        const params = new URLSearchParams(location.search);
        const focusProductId = params.get("highlight_product_id") || sessionStorage.getItem(PRODUCT_RETURN_FOCUS_KEY);

        if (!focusProductId || !products.some((product) => String(product.id) === String(focusProductId))) return;
        if (String(returnFocusConsumedRef.current) === String(focusProductId)) return;

        returnFocusConsumedRef.current = focusProductId;
        setHighlightedProductId(focusProductId);
        sessionStorage.removeItem(PRODUCT_RETURN_FOCUS_KEY);

        const scrollTimer = setTimeout(() => {
            const tableRow = document.querySelector(`.product-table-desktop tr[data-row-key="${focusProductId}"]`);
            const mobileRow = document.querySelector(`[data-product-id="${focusProductId}"]`);
            const targetRow = tableRow || mobileRow;

            targetRow?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);

        const highlightTimer = setTimeout(() => {
            setHighlightedProductId(null);
        }, 3500);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(highlightTimer);
        };
    }, [products, location.search]);


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

    const handleExportCSV = async () => {
        try {
            setCsvExportLoading(true);
            const response = await exportData(
                "/admin/products/export-csv",
                {},
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type: "text/csv;charset=utf-8;",
            });

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "products.csv";
            link.click();

            window.URL.revokeObjectURL(url);
            messageApi.success("Products exported successfully");
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to export products");
        } finally {
            setCsvExportLoading(false);
        }
    };

    return (
        <>
            {modalContextHolder}
            {contextHolder}

            <div className="prd-page">
            <div className="pagehead prd-pagehead">
                <div className="head-left">
                    <div className="prd-page-title-block">
                        <span className="prd-page-title-icon">
                            <ShoppingCartOutlined />
                        </span>
                        <div>
                            <h1 className="title">All Products</h1>
                            <p className="prd-page-subtitle">Manage catalog, stock and product status</p>
                        </div>
                    </div>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "All Products" }]}/>
                </div>
            </div>

            <div className="product-filter-section prd-toolbar-card" style={{ marginBottom: 16 }}>
                <div className="filter-desktop-actions" style={{ marginBottom: 12 }}>
                    <Row gutter={16} justify="space-between" align="middle">
                        <Col>
                            <Tabs
                                className="prd-status-tabs"
                                activeKey={activeTab}
                                onChange={(key) => {setActiveTab(key);setProductStatus(key);}}
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
                            <Space wrap className="prd-action-bar">
                                <Button className="prd-btn prd-btn--ghost" icon={<FilterOutlined />} onClick={() => setFiltersOpen((v) => !v)}>
                                    {filtersOpen ? "Hide Filters" : "Show Filters"}
                                </Button>
            
                                {isActionShow && (
                                    <Select value={selectedAction} onChange={handleBulkAction} placeholder="Action" style={{ width: 160 }}>
                                        <Option value="bulk-status-update">Bulk Status Update</Option>
                                    </Select>
                                )}
            
                                {isActionShow && (
                                    <Select value={selectedAction} onChange={handleBulkDelete} placeholder="Action" style={{ width: 140 }}>
                                        <Option value="bulk-delete">Bulk Delete</Option>
                                    </Select>
                                )}
            
                                {productCreate && (
                                    <Button className="prd-btn prd-btn--primary" type="primary" icon={<PlusOutlined />} onClick={handleProductAdd}>
                                        Add Product
                                    </Button>
                                )}

                                {productCreate && (
                                    <Button
                                        className="prd-btn prd-btn--export"
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={handleExportCSV}
                                        loading={csvExportLoading}
                                    >
                                        Export CSV
                                    </Button>
                                )}
            
                                {productDelete && (
                                    <Button className="prd-btn prd-btn--danger" danger icon={<DeleteOutlined />} onClick={handleToggleTrash}>
                                        Trash
                                    </Button>
                                )}
            
                                <Button className="prd-btn prd-btn--ghost" icon={<ReloadOutlined />} onClick={fetchProductsData}>
                                    Refresh
                                </Button>

                                <Button className="prd-btn prd-btn--ghost" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                                    Back
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
        
                {/* Mobile Actions (Always Visible) */}
                <div className="filter-mobile-actions" style={{ marginBottom: 12 }}>
                    <Space size="small" style={{ width: "100%" }} wrap className="prd-action-bar">
                        <Button className="prd-btn prd-btn--ghost" icon={<FilterOutlined />} onClick={() => setFiltersOpen((v) => !v)} style={{ flex: 1 }}>
                            {filtersOpen ? "Hide" : "Filters"}
                        </Button>
        
                        {isActionShow && (
                            <Select value={selectedAction} onChange={handleBulkAction} placeholder="Action" style={{ flex: 1 }}>
                                <Option value="bulk-status-update">Bulk Status Update</Option>
                            </Select>
                        )}
        
                        {productCreate && (
                            <Button className="prd-btn prd-btn--primary" type="primary" icon={<PlusOutlined />} onClick={handleProductAdd} style={{ flex: 1 }}>
                                Add
                            </Button>
                        )}

                        {productCreate && (
                            <Button
                                className="prd-btn prd-btn--export"
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleExportCSV}
                                loading={csvExportLoading}
                                style={{ flex: 1 }}
                            >
                                Export
                            </Button>
                        )}
        
                        {productDelete && (
                            <Button className="prd-btn prd-btn--danger" danger icon={<DeleteOutlined />} onClick={handleToggleTrash} style={{ flex: 1 }}>
                                Trash
                            </Button>
                        )}
        
                        <Button className="prd-btn prd-btn--ghost" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ flex: 1 }}>
                            Back
                        </Button>
                    </Space>
                </div>
        
                <div className={`product-filter-collapsible ${filtersOpen ? "is-open" : ""}`} aria-hidden={!filtersOpen} aria-expanded={filtersOpen}>
                    <div className="filter-desktop prd-filter-panel">
                        <div className="prd-filter-panel__head">Filters</div>
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

                                    <InputNumber value={minStock} onChange={setMinStock} placeholder="Min Stock" style={{ width: 120 }} min={0}/>
                
                                    <InputNumber value={maxStock} onChange={setMaxStock} placeholder="Max Stock" style={{ width: 120 }} min={0}/>
                
                                    <Button className="prd-btn prd-btn--ghost" onClick={clearFilters}>Clear Filters</Button>
                                </Space>
                            </Col>
                        </Row>
                    </div>
        
                    <div className="filter-mobile prd-filter-panel">
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
            
                            <Button className="prd-btn prd-btn--ghost" onClick={clearFilters} block>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="prd-table-section">
                <Flex gap="middle" vertical>
                    {hasSelected ? (
                        <div className="prd-selection-bar">
                            <span className="prd-selection-count">{selectedRowKeys.length} selected</span>
                            <span className="prd-selection-text">products ready for bulk action</span>
                        </div>
                    ) : null}
        
                    <div className="product-table-desktop prd-table-card">
                        <Table
                            rowSelection={rowSelection}
                            columns={columns}
                            dataSource={products}
                            loading={loading}
                            tableLayout="fixed"
                            size="small"
                            bordered
                            scroll={{ x: "max-content", y: "calc(100vh - 320px)" }}
                            rowKey="id"
                            rowClassName={(record) => String(record.id) === String(highlightedProductId) ? "product-return-highlight-row" : ""}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: tableData?.total || 0,
                                showSizeChanger: true,
                                pageSizeOptions: PRODUCT_PAGE_SIZE_OPTIONS,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
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
                                    <div key={item.id} data-product-id={item.id} className={`mobile-card ${String(item.id) === String(highlightedProductId) ? "product-return-highlight-card" : ""}`}>
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
            </div>

            <Modal title={null} open={previewModal} onCancel={() => setPreviewModal(false)} footer={null} width={950} centered className="product-preview-modal" destroyOnClose>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 12, color: "#64748b" }}>Loading product details...</div>
                    </div>
                ) : previewData ? (
                    <div className="preview-modal-wrapper" style={{ padding: "4px 0" }}>
                        <div
                            style={{
                                display       : "flex",
                                alignItems    : "center",
                                justifyContent: "space-between",
                                paddingBottom : 16,
                                marginBottom  : 20,
                                borderBottom  : "1px solid #f1f5f9",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div
                                    style={{
                                        width         : 44,
                                        height        : 44,
                                        borderRadius  : 12,
                                        background    : "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                                        display       : "flex",
                                        alignItems    : "center",
                                        justifyContent: "center",
                                        color         : "#fff",
                                        fontSize      : 20,
                                        boxShadow     : "0 4px 12px rgba(22, 119, 255, 0.25)",
                                    }}
                                >
                                    <EyeOutlined />
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                                            Product Quick View
                                        </Title>
                                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                                            ID: #{previewData.id}
                                        </Tag>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12, color: "#64748b" }}>
                                        Detailed specification & live information
                                    </Text>
                                </div>
                            </div>

                            <Space size="small">
                                {previewData.slug && (
                                    <Button
                                        type="primary"
                                        icon={<GlobalOutlined />}
                                        onClick={() =>
                                            window.open(`${(settingsData || "").replace(/\/$/, "")}/product/${previewData.slug}`,"_blank")
                                        }
                                        style={{
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            background: "linear-gradient(135deg, #1677ff, #0958d9)",
                                        }}
                                    >
                                        View in Store
                                    </Button>
                                )}
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                        setPreviewModal(false);
                                        handleEdit(previewData);
                                    }}
                                    style={{ borderRadius: 8, fontWeight: 600 }}
                                >
                                    Edit Product
                                </Button>
                            </Space>
                        </div>

                        {/* Main Content Grid */}
                        <Row gutter={[24, 24]}>
                            {/* Left Column: Gallery & Badges */}
                            <Col xs={24} md={10}>
                                <div style={{ position: "relative" }}>
                                    {/* Main Image View */}
                                    <div
                                        className="preview-main-image-box"
                                        style={{
                                            width: "100%",
                                            height: 320,
                                            borderRadius: 14,
                                            overflow: "hidden",
                                            border: "1px solid #e2e8f0",
                                            background: "#f8fafc",
                                            position: "relative",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleImagePreview(selectedPreviewImage || previewData.image || "/free.jpg")}
                                    >
                                        <img
                                            src={selectedPreviewImage || previewData.image || "/free.jpg"}
                                            alt={previewData.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                padding: 12,
                                                transition: "transform 0.3s ease",
                                            }}
                                        />
                                        {/* Hover Overlay */}
                                        <div className="main-img-overlay">
                                            <EyeOutlined style={{ color: "#fff", fontSize: 24 }} />
                                            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                                                Click to Enlarge
                                            </span>
                                        </div>

                                        {/* Floating Badges */}
                                        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                            <Tag
                                                color={previewData.status === "active" ? "#52c41a" : "#f5222d"}
                                                style={{
                                                    fontWeight: 700,
                                                    borderRadius: 6,
                                                    padding: "2px 8px",
                                                    fontSize: 11,
                                                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                                    margin: 0,
                                                }}
                                            >
                                                {previewData.status === "active" ? "ACTIVE" : "INACTIVE"}
                                            </Tag>
                                            {previewData.is_combo === 1 && (
                                                <Tag
                                                    color="purple"
                                                    style={{
                                                        fontWeight: 700,
                                                        borderRadius: 6,
                                                        padding: "2px 8px",
                                                        fontSize: 11,
                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                                        margin: 0,
                                                    }}
                                                >
                                                    COMBO PRODUCT
                                                </Tag>
                                            )}
                                            {previewData.free_shipping && (
                                                <Tag
                                                    color="green"
                                                    style={{
                                                        fontWeight: 700,
                                                        borderRadius: 6,
                                                        padding: "2px 8px",
                                                        fontSize: 11,
                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                                        margin: 0,
                                                    }}
                                                >
                                                    FREE SHIPPING
                                                </Tag>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gallery Thumbnails List */}
                                    {((previewData.images && previewData.images.length > 0) || previewData.image) && (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                marginTop: 12,
                                                overflowX: "auto",
                                                paddingBottom: 4,
                                            }}
                                        >
                                            {/* Main image thumbnail */}
                                            {previewData.image && (
                                                <div
                                                    onClick={() => setSelectedPreviewImage(previewData.image)}
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 8,
                                                        overflow: "hidden",
                                                        border: (selectedPreviewImage || previewData.image) === previewData.image ? "2px solid #1677ff" : "1px solid #cbd5e1",
                                                        cursor: "pointer",
                                                        flexShrink: 0,
                                                        padding: 2,
                                                        background: "#fff",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    <img
                                                        src={previewData.image}
                                                        alt="Thumbnail main"
                                                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
                                                    />
                                                </div>
                                            )}
                                            {/* Extra gallery images */}
                                            {previewData.images?.map((imgObj, idx) => {
                                                const imgUrl = typeof imgObj === "string" ? imgObj : imgObj?.image;
                                                if (!imgUrl) return null;
                                                const isSelected = selectedPreviewImage === imgUrl;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedPreviewImage(imgUrl)}
                                                        style={{
                                                            width: 56,
                                                            height: 56,
                                                            borderRadius: 8,
                                                            overflow: "hidden",
                                                            border: isSelected ? "2px solid #1677ff" : "1px solid #cbd5e1",
                                                            cursor: "pointer",
                                                            flexShrink: 0,
                                                            padding: 2,
                                                            background: "#fff",
                                                            transition: "all 0.2s ease",
                                                        }}
                                                    >
                                                        <img
                                                            src={imgUrl}
                                                            alt={`Thumbnail ${idx}`}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Col>

                            {/* Right Column: Key Details & Metrics */}
                            <Col xs={24} md={14}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {/* Title & SKU */}
                                    <div>
                                        <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                                            {previewData.name}
                                        </Title>
                                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 8 }}>
                                            {previewData.sku && (
                                                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                    <BarcodeOutlined style={{ color: "#64748b" }} />
                                                    SKU: <Text code style={{ margin: 0 }}>{previewData.sku}</Text>
                                                </span>
                                            )}
                                            {previewData.brand?.name && (
                                                <Tag color="volcano" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                                                    Brand: {previewData.brand.name}
                                                </Tag>
                                            )}
                                        </div>

                                        {/* Category Hierarchy pill list */}
                                        {((previewData.categories && previewData.categories.length > 0) ||
                                          (previewData.sub_categories && previewData.sub_categories.length > 0) ||
                                          (previewData.sub_sub_categories && previewData.sub_sub_categories.length > 0)) && (
                                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 }}>
                                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Taxonomy:</Text>
                                                {previewData.categories?.map((c) => (
                                                    <Tag key={c.id} color="blue" style={{ borderRadius: 6, margin: 0 }}>{c.name}</Tag>
                                                ))}
                                                {previewData.sub_categories?.map((sc) => (
                                                    <Tag key={sc.id} color="cyan" style={{ borderRadius: 6, margin: 0 }}>› {sc.name}</Tag>
                                                ))}
                                                {previewData.sub_sub_categories?.map((ssc) => (
                                                    <Tag key={ssc.id} color="geekblue" style={{ borderRadius: 6, margin: 0 }}>› {ssc.name}</Tag>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Commercial Pricing Card */}
                                    <div
                                        style={{
                                            background: "linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)",
                                            padding: 16,
                                            borderRadius: 12,
                                            border: "1px solid #bae0ff",
                                            boxShadow: "0 2px 8px rgba(22,119,255,0.06)",
                                        }}
                                    >
                                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#1677ff" }}>
                                            Pricing & Commercials
                                        </Text>

                                        {previewData.variation_price_range?.min_price && Number(previewData.variation_price_range.min_price) > 0 ? (
                                            <div style={{ marginTop: 6 }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: "#0958d9" }}>
                                                    ৳{Number(previewData.variation_price_range.min_price).toLocaleString()} — ৳{Number(previewData.variation_price_range.max_price).toLocaleString()}
                                                </div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Includes variant pricing configuration</Text>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6, flexWrap: "wrap", gap: 12 }}>
                                                <div>
                                                    {Number(previewData.mrp) > 0 && Number(previewData.mrp) > Number(previewData.sell_price) && (
                                                        <div style={{ fontSize: 13, color: "#94a3b8" }}>
                                                            MRP: <Text delete style={{ color: "#94a3b8" }}>৳{Number(previewData.mrp).toLocaleString()}</Text>
                                                        </div>
                                                    )}
                                                    {Number(previewData.offer_price) > 0 && Number(previewData.offer_price) !== Number(previewData.sell_price) && (
                                                        <div style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                                                            Special Offer: ৳{Number(previewData.offer_price).toLocaleString()}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: 24, fontWeight: 800, color: "#0958d9", lineHeight: 1.2 }}>
                                                        ৳{Number(previewData.sell_price || previewData.mrp || 0).toLocaleString()}
                                                    </div>
                                                </div>

                                                {(Number(previewData.discount) > 0 || Number(previewData.offer_percent) > 0) && (
                                                    <Tag color="error" style={{ fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, border: "none" }}>
                                                        {previewData.discount || previewData.offer_percent}% DISCOUNT
                                                    </Tag>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stock & Quantity Grid */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                                            gap: 10,
                                            background: "#fafafa",
                                            padding: 12,
                                            borderRadius: 12,
                                            border: "1px solid #f0f0f0",
                                        }}
                                    >
                                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Stock Status</Text>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: Number(previewData.current_stock) > 0 ? "#52c41a" : "#ff4d4f" }}>
                                                {previewData.current_stock ?? 0} <span style={{ fontSize: 11, fontWeight: 500 }}>units</span>
                                            </div>
                                        </div>
                                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Purchased Qty</Text>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                                                {previewData.total_purchase_qty ?? 0}
                                            </div>
                                        </div>
                                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Total Sold</Text>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: "#1677ff" }}>
                                                {previewData.total_sell_qty ?? 0}
                                            </div>
                                        </div>
                                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Min Order Qty</Text>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>
                                                {previewData.minimum_qty ?? 1}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Bottom Content Tabs: Descriptions, Variations, SEO */}
                        <div style={{ marginTop: 20 }}>
                            <Tabs
                                defaultActiveKey="description"
                                type="card"
                                items={[
                                    {
                                        key: "description",
                                        label: "Description & Details",
                                        children: (
                                            <div style={{ padding: "12px 4px" }}>
                                                {previewData.short_description && (
                                                    <div style={{ marginBottom: 16, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                                        <Text strong style={{ fontSize: 13, color: "#334155", display: "block", marginBottom: 4 }}>
                                                            Short Description:
                                                        </Text>
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: previewData.short_description }}
                                                            style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}
                                                        />
                                                    </div>
                                                )}

                                                {previewData.description ? (
                                                    <div>
                                                        <Text strong style={{ fontSize: 13, color: "#334155", display: "block", marginBottom: 6 }}>
                                                            Full Description:
                                                        </Text>
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: previewData.description }}
                                                            style={{
                                                                fontSize: 13,
                                                                color: "#334155",
                                                                lineHeight: 1.6,
                                                                maxHeight: 260,
                                                                overflowY: "auto",
                                                                paddingRight: 6,
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <Empty description="No full description available for this product." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                )}
                                            </div>
                                        ),
                                    },
                                    (Array.isArray(previewData.variations) ? previewData.variations : previewData.variations?.data)?.length > 0
                                        ? {
                                              key: "variations",
                                              label: `Variations (${(Array.isArray(previewData.variations) ? previewData.variations : previewData.variations?.data).length})`,
                                              children: (
                                                  <div style={{ padding: "12px 0" }}>
                                                      <Table
                                                          columns={[
                                                              { title: "Variant", dataIndex: "name", key: "name", render: (t, r) => t || r.title || r.attributes?.map(a => a.value).join(" / ") || "Variant" },
                                                              { title: "SKU", dataIndex: "sku", key: "sku", render: (s) => s ? <Text code>{s}</Text> : "—" },
                                                              { title: "Price", key: "price", render: (_, r) => <Text strong style={{ color: "#1677ff" }}>৳{r.sell_price || r.price || "—"}</Text> },
                                                              { title: "Stock", dataIndex: "current_stock", key: "stock", render: (st) => <Tag color={Number(st) > 0 ? "success" : "error"}>{st ?? 0}</Tag> },
                                                          ]}
                                                          dataSource={Array.isArray(previewData.variations) ? previewData.variations : previewData.variations?.data}
                                                          rowKey="id"
                                                          pagination={false}
                                                          size="small"
                                                          bordered
                                                      />
                                                  </div>
                                              ),
                                          }
                                        : null,
                                    (previewData.meta_title || previewData.meta_keywords || previewData.meta_description || previewData.video_url)
                                        ? {
                                              key: "seo",
                                              label: "SEO & Media",
                                              children: (
                                                  <div style={{ padding: "12px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
                                                      {previewData.video_url && (
                                                          <div style={{ marginBottom: 6 }}>
                                                              <Text strong style={{ fontSize: 13 }}>Product Video: </Text>
                                                              <Button
                                                                  type="link"
                                                                  icon={<PlaySquareOutlined />}
                                                                  onClick={() => window.open(previewData.video_url, "_blank")}
                                                                  style={{ padding: 0 }}
                                                              >
                                                                  Watch Video
                                                              </Button>
                                                          </div>
                                                      )}
                                                      {previewData.meta_title && (
                                                          <div>
                                                              <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Meta Title</Text>
                                                              <Text strong style={{ fontSize: 13 }}>{previewData.meta_title}</Text>
                                                          </div>
                                                      )}
                                                      {previewData.meta_keywords && (
                                                          <div>
                                                              <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Meta Keywords</Text>
                                                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                                                                  {previewData.meta_keywords.split(",").map((kw, i) => (
                                                                      <Tag key={i} color="default" style={{ fontSize: 11 }}>{kw.trim()}</Tag>
                                                                  ))}
                                                              </div>
                                                          </div>
                                                      )}
                                                      {previewData.meta_description && (
                                                          <div>
                                                              <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Meta Description</Text>
                                                              <Text style={{ fontSize: 12, color: "#475569" }}>{previewData.meta_description}</Text>
                                                          </div>
                                                      )}
                                                  </div>
                                              ),
                                          }
                                        : null,
                                ].filter(Boolean)}
                            />
                        </div>
                    </div>
                ) : null}
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

            <Modal title={<Space><InfoCircleOutlined style={{ color: '#1677ff' }} />Product Details</Space>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={900}>
                {selectedProduct ? (
                    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 0 20px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 20 }}>
                            <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #f0f0f0' }}>
                                <img src={selectedProduct.image || "/free.jpg"} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Title level={5} style={{ margin: 0, marginBottom: 4 }}>{selectedProduct.name}</Title>
                                <Space size={12} wrap>
                                    <Text type="secondary" style={{ fontSize: 12 }}>ID: <Text code style={{ fontSize: 12 }}>{selectedProduct.id}</Text></Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>SKU: <Text strong style={{ fontSize: 12 }}>{selectedProduct.sku || "N/A"}</Text></Text>
                                    <Tag color={selectedProduct.status === "active" ? "green" : "red"} style={{ margin: 0 }}>{selectedProduct.status === "active" ? "Active" : "Inactive"}</Tag>
                                </Space>
                            </div>
                            <Space direction="vertical" size={4}>
                                {selectedProduct.slug && (
                                    <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => window.open(`${settingsData?.replace(/\/$/, "")}/product/${selectedProduct.slug}`, "_blank")}>
                                        View
                                    </Button>
                                )}
                                <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(selectedProduct.id)}>Copy ID</Button>
                            </Space>
                        </div>

                        <Row gutter={[24, 24]}>
                            {/* Left Column */}
                            <Col span={12}>
                                {/* Pricing */}
                                <Card size="small" title="Pricing" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="MRP">৳{selectedProduct.mrp || "0"}</Descriptions.Item>
                                        <Descriptions.Item label="Sell Price">৳{selectedProduct.sell_price || "0"}</Descriptions.Item>
                                        <Descriptions.Item label="Offer Price">৳{selectedProduct.offer_price || "0"}</Descriptions.Item>
                                        <Descriptions.Item label="Discount">৳{selectedProduct.discount || "0"} {selectedProduct.offer_percent ? `(${selectedProduct.offer_percent}%)` : ""}</Descriptions.Item>
                                        <Descriptions.Item label="Buy Price">৳{selectedProduct.buy_price || "N/A"}</Descriptions.Item>
                                    </Descriptions>
                                </Card>

                                {/* Stock */}
                                <Card size="small" title="Stock & Inventory" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Current Stock">{selectedProduct.current_stock}</Descriptions.Item>
                                        <Descriptions.Item label="Total Sold">{selectedProduct.total_sell_qty}</Descriptions.Item>
                                        <Descriptions.Item label="Total Purchased">{selectedProduct.total_purchase_qty}</Descriptions.Item>
                                        <Descriptions.Item label="Min. Order Qty">{selectedProduct.minimum_qty}</Descriptions.Item>
                                        <Descriptions.Item label="Alert Qty">{selectedProduct.alert_qty ?? "N/A"}</Descriptions.Item>
                                    </Descriptions>
                                </Card>

                                {/* Variations */}
                                <Card size="small" title="Variations & Attributes" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                                    {normalizedVariations.length === 0 ? (
                                        <Text type="secondary" style={{ fontSize: 13 }}>This product has no variations.</Text>
                                    ) : (
                                        normalizedVariations.map(({ variationId, attrs }) => (
                                            <div key={variationId} style={{ padding: 10, border: "1px solid #f5f5f5", borderRadius: 8, marginBottom: 8, background: '#fafafa' }}>
                                                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Variation #{variationId}</Text>
                                                {attrs.length === 0 ? (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>No attributes</Text>
                                                ) : (
                                                    <Space wrap size={[6, 6]}>
                                                        {attrs.map((a) => (
                                                            <Tag key={`${variationId}-${a.slot}`} color="blue" style={{ margin: 0 }}>
                                                                {a.value}{" "}
                                                                <Text style={{ fontSize: 10, opacity: 0.7, cursor: 'pointer' }} onClick={() => copyToClipboard(a.valueId)}>({a.valueId})</Text>
                                                            </Tag>
                                                        ))}
                                                    </Space>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </Card>
                            </Col>

                            <Col span={12}>
                                <Card size="small" title="Categorization" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Brand">{selectedProduct.brand?.name || "N/A"}</Descriptions.Item>
                                        <Descriptions.Item label="Categories">
                                            {selectedProduct.categories?.length ? selectedProduct.categories.map(c => c.name).join(", ") : "N/A"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Sub Categories">
                                            {selectedProduct.sub_categories?.length ? selectedProduct.sub_categories.map(c => c.name).join(", ") : "N/A"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Sub Sub Categories">
                                            {selectedProduct.sub_sub_categories?.length ? selectedProduct.sub_sub_categories.map(c => c.name).join(", ") : "N/A"}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>

                                <Card size="small" title="Shipping & Type" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Free Shipping">
                                            <Tag color={selectedProduct.free_shipping ? "green" : "default"}>{selectedProduct.free_shipping ? "Yes" : "No"}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Is Combo">
                                            <Tag color={selectedProduct.is_combo ? "purple" : "default"}>{selectedProduct.is_combo ? "Yes" : "No"}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Variation Range">
                                            {selectedProduct.variation_price_range?.min_price > 0
                                                ? `৳${selectedProduct.variation_price_range.min_price} - ৳${selectedProduct.variation_price_range.max_price}`
                                                : "N/A"}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>

                                {selectedProduct.is_combo && selectedProduct.combo_items?.length > 0 && (
                                    <Card size="small" title="Combo Items" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                            {selectedProduct.combo_items.map((item) => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fafafa', borderRadius: 6 }}>
                                                    <Text style={{ fontSize: 13 }}>Product #{item.product_id}</Text>
                                                    <Tag color="blue">Qty: {item.quantity}</Tag>
                                                </div>
                                            ))}
                                        </Space>
                                    </Card>
                                )}

                                {(selectedProduct.meta_title || selectedProduct.meta_keywords || selectedProduct.meta_description) && (
                                    <Card size="small" title="SEO Meta" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                                        <Descriptions column={1} size="small">
                                            {selectedProduct.meta_title && <Descriptions.Item label="Meta Title">{selectedProduct.meta_title}</Descriptions.Item>}
                                            {selectedProduct.meta_keywords && <Descriptions.Item label="Meta Keywords">{selectedProduct.meta_keywords}</Descriptions.Item>}
                                            {selectedProduct.meta_description && <Descriptions.Item label="Meta Description">{selectedProduct.meta_description}</Descriptions.Item>}
                                        </Descriptions>
                                    </Card>
                                )}
                            </Col>
                        </Row>

                        {(selectedProduct.short_description || selectedProduct.description) && (
                            <div style={{ marginTop: 16 }}>
                                {selectedProduct.short_description && (
                                    <Card size="small" title="Short Description" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 12 }}>
                                        <div dangerouslySetInnerHTML={{ __html: selectedProduct.short_description }} style={{ maxHeight: 150, overflowY: 'auto', fontSize: 13 }} />
                                    </Card>
                                )}
                                {selectedProduct.description && (
                                    <Card size="small" title="Full Description" variant="borderless" style={{ borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                                        <div dangerouslySetInnerHTML={{ __html: selectedProduct.description }} style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13 }} />
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Text type="secondary">No product selected.</Text>
                    </div>
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
