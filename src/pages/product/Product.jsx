import {ArrowLeftOutlined,CopyOutlined,DeleteOutlined,EditOutlined,EyeOutlined,FilterOutlined,InfoCircleOutlined,PlusOutlined} from "@ant-design/icons";
import {Input as AntInput,Typography,Breadcrumb,Tabs,Button,Col,DatePicker,Empty,Flex,InputNumber,Modal,Popover,Row,Divider,Select,Space,Table,Tag,Tooltip,message,Spin} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {deleteData,getDatas,postData,putData} from "../../api/common/common";
import { useDebounce } from "../../hooks/useDebounce";
import useTitle from "../../hooks/useTitle";
import "./Product.css";

const { Option } = Select;

const { Text, Title } = Typography;

export default function Product() {
  // Hook
  useTitle("All Products");

  // Variable
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [tableData, setTableData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [productStatus, setProductStatus] = useState("active");
  const [selectedAction, setSelectedAction] = useState("");
  const [isActionShow, setIsActionShow] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [activeTab, setActiveTab] = useState("active");


  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Modal states
  const [previewModal, setPreviewModal] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState(false);
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [bulkStatusValue, setBulkStatusValue] = useState("");

  // 🔹 NEW FILTER STATES
  const [brandIds, setBrandIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subCategoryIds, setSubCategoryIds] = useState([]);
  const [subSubCategoryIds, setSubSubCategoryIds] = useState([]);
  const [attributeValueIds, setAttributeValueIds] = useState([]);
  const [tagIds, setTagIds] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [minPrice, setMinPrice] = useState();
  const [maxPrice, setMaxPrice] = useState();
  const [productTypeId, setProductTypeId] = useState(null);

  // 🔹 FILTER OPTIONS DATA
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [attributeValues, setAttributeValues] = useState([]);
  const [productTypes, setProductTypes] = useState([]);

  // Permission state - get from localStorage
  const [authPermission, setAuthPermission] = useState([]);

  // Modal instance for delete confirmation
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, contextHolder]           = message.useMessage();

  // Trash view states
  const [isTrashView, setIsTrashView]       = useState(false);
  const [trashData, setTrashData]           = useState([]);
  const [trashTableMeta, setTrashTableMeta] = useState(null);
  const [trashPage, setTrashPage]           = useState(1);
  const [trashPageSize, setTrashPageSize]   = useState(10);
  const [settingsData, setSettingsData]     = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load permissions from localStorage on component mount
  useEffect(() => {
    try {
      const auth = localStorage.getItem("auth");
      if (auth) {
        const parsedAuth = JSON.parse(auth);

        if (Array.isArray(parsedAuth?.user?.roles?.[0]?.permissions)) {
          setAuthPermission(parsedAuth.user.roles[0].permissions);
          return;
        }
      }

      // fallback: try permission from localStorage
      const permissions = localStorage.getItem("permission");
      if (permissions) {
        const parsedPermissions = JSON.parse(permissions);
        if (Array.isArray(parsedPermissions)) {
          setAuthPermission(parsedPermissions);
        } else {
          setAuthPermission([]);
        }
      } else {
        setAuthPermission([]);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      setAuthPermission([]);
    }
  }, []);

  // Load filter options (brands, categories, subcategories, product types)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [brandsRes, catsRes, subsRes, typesRes, subSubsRes, attrValsRes] =
          await Promise.all([
            getDatas("/admin/brands"),
            getDatas("/admin/categories"),
            getDatas("/admin/sub-categories"),
            getDatas("/admin/product-types"),
            getDatas("/admin/sub-sub-categories"),
            getDatas("/admin/attribute-values"),
          ]);

        if (brandsRes?.success)
          setBrands(brandsRes.result.data || brandsRes.result || []);
        if (catsRes?.success)
          setCategories(catsRes.result.data || catsRes.result || []);
        if (subsRes?.success)
          setSubCategories(subsRes.result.data || subsRes.result || []);
        if (typesRes?.success)
          setProductTypes(typesRes.result.data || typesRes.result || []);
        if (subSubsRes?.success)
          setSubSubCategories(
            subSubsRes.result.data || subSubsRes.result || []
          );
        if (attrValsRes?.success)
          setAttributeValues(
            attrValsRes.result.data || attrValsRes.result || []
          );
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Helper function to check if user has specific permission
  const hasPermission = (permissionName) => {
    if (!permissionName || !Array.isArray(authPermission)) return false;
    return authPermission.some((p) => p.name === permissionName);
  };

  const columns = [
    {
      title: "SL",
      key: "sl",
      width: 60,
      render: (_, __, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 110,
      render: (src, record) => (
        <img
          src={src}
          alt={record.name}
          style={{
            width: "95px",
            height: "95px",
            objectFit: "cover",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => handleImagePreview(src)}
        />
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
        <div
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
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
            {record.category?.name && (
              <p style={{ margin: 0, fontWeight: 700 }}>
                Category:{" "}
                <span style={{ fontWeight: 300 }}>{record.category.name}</span>
              </p>
            )}
            {record.sub_category?.name && (
              <p style={{ margin: 0, fontWeight: 700 }}>
                Sub Category:{" "}
                <span style={{ fontWeight: 300 }}>
                  {record.sub_category.name}
                </span>
              </p>
            )}
            {record.sub_sub_category?.name && (
              <p style={{ margin: 0, fontWeight: 700 }}>
                Sub Sub Category:{" "}
                <span style={{ fontWeight: 300 }}>
                  {record.sub_sub_category.name}
                </span>
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Variation Price Range",
      key: "variation_price_range",
      width: 190,
      render: (_, record) => {
        if (!record.variations || record.variations.length === 0) {
          return (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No Variations"
              style={{ fontSize: "12px" }}
            />
          );
        }

        return (
          <Popover
            content={
              <div
                style={{ maxHeight: "400px", overflow: "auto", width: "600px" }}
              >
                <Table
                  dataSource={record.variations}
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                  columns={[
                    {
                      title: "Variations Name",
                      width: 150,
                      render: (_, variation) => (
                        <div>
                          {variation.attribute_value_1 && (
                            <Tag color="red" style={{ marginBottom: 2 }}>
                              {variation.attribute_value_1.attribute?.name} -{" "}
                              {variation.attribute_value_1.value}
                            </Tag>
                          )}
                          {variation.attribute_value_2 && (
                            <Tag color="red" style={{ marginBottom: 2 }}>
                              {variation.attribute_value_2.attribute?.name} -{" "}
                              {variation.attribute_value_2.value}
                            </Tag>
                          )}
                          {variation.attribute_value_3 && (
                            <Tag color="red" style={{ marginBottom: 2 }}>
                              {variation.attribute_value_3.attribute?.name} -{" "}
                              {variation.attribute_value_3.value}
                            </Tag>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: "Stock Report",
                      width: 200,
                      render: (_, variation) => (
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            Total Current Stock:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.total_current_stock}
                            </span>
                          </p>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            Total Purchase Qty:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.total_purchase_qty}
                            </span>
                          </p>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            Total Sell Qty:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.total_sell_qty}
                            </span>
                          </p>
                        </div>
                      ),
                    },
                    {
                      title: "Variation Prices",
                      width: 200,
                      render: (_, variation) => (
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            Buy Price:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.buy_price}
                            </span>
                          </p>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            MRP:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.mrp}
                            </span>
                          </p>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            Offer Price:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.offer_price}
                            </span>
                          </p>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            Sell Price:{" "}
                            <span style={{ fontWeight: 300 }}>
                              {variation.sell_price}
                            </span>
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            }
            title="Product Variations"
            trigger="click"
            placement="right"
          >
            <span
              style={{
                color: "#52c41a",
                cursor: "pointer",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {record.variation_price_range?.min_price} --{" "}
              {record.variation_price_range?.max_price}
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </span>
          </Popover>
        );
      },
    },
    {
      title: "Product Prices",
      key: "product_prices",
      width: 200,
      render: (_, record) => (
        <div
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>
            Buy Price:{" "}
            <span style={{ fontWeight: 300 }}>{record.buy_price}</span>
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            MRP: <span style={{ fontWeight: 300 }}>{record.mrp}</span>
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            Offer Price:{" "}
            <span style={{ fontWeight: 300 }}>{record.offer_price}</span>
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            Sell Price:{" "}
            <span style={{ fontWeight: 300 }}>{record.sell_price}</span>
          </p>
        </div>
      ),
    },
    {
      title: "Stock Report",
      key: "stock_report",
      width: 220,
      render: (_, record) => (
        <div
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>
            Total Current Stock:{" "}
            <span style={{ fontWeight: 300 }}>
              {record.current_stock_range?.total_current_stock}
            </span>
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            Total Purchase Qty:{" "}
            <span style={{ fontWeight: 300 }}>
              {record.current_stock_range?.total_purchase_qty}
            </span>
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            Total Sell Qty:{" "}
            <span style={{ fontWeight: 300 }}>
              {record.current_stock_range?.total_sell_qty}
            </span>
          </p>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Product View">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          {hasPermission("products-update") && (
            <Tooltip title="Product Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}

          {hasPermission("products-create") && (
            <Tooltip title="Product Duplicate">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(record.id)}
              />
            </Tooltip>
          )}
          {hasPermission("products-delete") && (
            <Tooltip title="Product Delete">
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}/>
            </Tooltip>
          )}
        </Space>
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
          type: "success",
          content: "Copy failed",
      });
    }
  };

  // helper to normalize attributes (attribute_value_1..3)
  const normalizedVariations = useMemo(() => {
    if (!selectedProduct?.variations?.length) return [];

    return selectedProduct.variations.map((v) => {
      const attrs = [];
      for (let i = 1; i <= 3; i++) {
        const key = `attribute_value_${i}`;
        const av = v?.[key];
        if (av && typeof av === "object") {
          attrs.push({
            slot: i,
            attributeId: av.attribute_id,
            attributeName: av.attribute?.name ?? `Attribute ${i}`,
            valueId: av.id,
            value: av.value,
          });
        }
      }
      return {
        variationId: v.id,
        attrs,
      };
    });
  }, [selectedProduct]);

  const handleProductInfo = (record) => {
    setSelectedProduct(record);
    setIsModalOpen(true);
  }

  // Trash columns for trash view
  const trashColumns = [
    {
      title: "SL",
      key: "sl",
      width: 50,
      render: (_, __, i) => (trashPage - 1) * trashPageSize + i + 1,
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 110,
      render: (src, r) => (
        <img
          src={src}
          alt={r.name}
          style={{
            width: 95,
            height: 95,
            objectFit: "cover",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => handleImagePreview(src)}
        />
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
      title: "Brand",
      key: "brand",
      width: 140,
      render: (_, r) => r?.brand?.name || "—",
    },
    {
      title: "Actions",
      key: "trash_actions",
      width: 220,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => handleRestore(record.id)}>
            Restore
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handlePermanentDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

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
    setLoading(true);

    try {
      const [productRes, settingRes] = await Promise.all([
        getDatas(`/admin/products/${record.id}`),
        getDatas("/admin/settings/list", { key: "frontend_base_url" }),
      ]);

      if (productRes?.success) {
        setPreviewData(productRes.result);
      }

      if (settingRes?.success) {
        const baseUrlSetting = settingRes.result.find(
          (item) => item.key === "frontend_base_url"
        );

        setSettingsData(baseUrlSetting.value || "http://localhost:3000/");
      }
    } catch (error) {
      console.error("Error fetching product preview data:", error);
      message.error("Failed to fetch product details or setting data");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePreview = (imageSrc) => {
    setPreviewImage(imageSrc);
    setImagePreviewModal(true);
  };

  const handleEdit = (record) => {
    if (hasPermission("products-update")) {
      navigate(`/product-edit/${record.id}`);
    } else {
      message.error("You don't have permission to edit Product");
    }
  };

  const handleCopy = async (id) => {
    if (hasPermission("products-create")) {
      try {
        const res = await getDatas(`/admin/products/copy/${id}`, {}, "POST");
        if (res?.success) {
          message.success("Product copied successfully");
          window.location.reload();
        }
      } catch {
        message.error("Error copying product");
      }
    } else {
      message.error("You don't have permission to copy Product");
    }
  };

  const handleDelete = async (record) => {
    if (!hasPermission("products-delete")) {
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
          const res = await deleteData(`/admin/products/${record.id}`,{},"DELETE");
          if (res?.success) {
            messageApi.open({
                type: "success",
                content: "Product deleted successfully",
            });

            // Refresh list instead of window.reload()
            setLoading(true);
            try {
              const params = {
                page: currentPage,
                paginate_size: pageSize,
                search_key: debouncedSearchQuery,
                status: productStatus,
              };
              const refreshed = await getDatas("/admin/products", params);
              if (refreshed?.success) {
                setTableData(refreshed.result);
                setProducts(refreshed.result?.data || []);
              }
            } finally {
              setLoading(false);
            }
          } else {
            message.error(res?.message || "Delete failed");
          }
        } catch (e) {
          console.error(e);
          message.error("Error deleting product");
        }
      },
    });
  };

  const handleProductAdd = () => {
    if (hasPermission("products-create")) {
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
      const res = await postData("/admin/products/bulk/update/status", {
        product_ids: selectedRowKeys,
        status: bulkStatusValue,
      });

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

        // Refresh data instead of full page reload
        const refreshData = async () => {
          setLoading(true);
          try {
            const res = await getDatas("/admin/products", {
              page: currentPage,
              paginate_size: pageSize,
              search_key: debouncedSearchQuery,
              status: productStatus,
            });

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

  const fetchTrashData = async () => {
    setLoading(true);
    try {
      const res = await getDatas("/admin/products/trash", {
        page: trashPage,
        paginate_size: trashPageSize,
      });

      if (res?.success) {
        setTrashData(res.result?.data || []);
        setTrashTableMeta({
          total: res.result?.meta?.total || 0,
          current_page: res.result?.meta?.current_page || 1,
          per_page: res.result?.meta?.per_page || trashPageSize,
        });
      }
    } catch {
      message.error("Failed to load trash list");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTrash = () => {
    const next = !isTrashView;
    setIsTrashView(next);
    setSelectedRowKeys([]);
    if (next) {
      fetchTrashData();
    } else {
      // When switching back to normal view, refresh the product list
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("paginate_size", pageSize);
      if (debouncedSearchQuery) {
        params.append("search_key", debouncedSearchQuery);
      }
      params.append("status", productStatus);

      if (brandIds.length > 0) {
        brandIds.forEach((bId) => params.append("brand_ids[]", bId));
      }
      if (categoryIds.length > 0) {
        categoryIds.forEach((cId) => params.append("category_ids[]", cId));
      }
      if (subCategoryIds.length > 0) {
        subCategoryIds.forEach((sId) =>
          params.append("sub_category_ids[]", sId)
        );
      }
      if (subSubCategoryIds.length > 0) {
        subSubCategoryIds.forEach((ssId) =>
          params.append("sub_sub_category_ids[]", ssId)
        );
      }
      if (attributeValueIds.length > 0) {
        attributeValueIds.forEach((avId) =>
          params.append("attribute_value_ids[]", avId)
        );
      }
      if (tagIds.length > 0) {
        tagIds.forEach((tId) => params.append("tag_ids[]", tId));
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

      getDatas("/admin/products", paramsObj)
        .then((res) => {
          if (res?.success) {
            setTableData(res.result);
            setProducts(res.result?.data || []);
          }
        })
        .catch(() => message.error("Error fetching products"))
        .finally(() => setLoading(false));
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await putData(`/admin/products/${id}/restore`, {});
      if (res?.success) {
        message.success("Restored successfully");
        fetchTrashData();

        // If not in trash view, refresh the product list to show the restored item
        if (!isTrashView) {
          setLoading(true);
          try {
            const params = new URLSearchParams();
            params.append("page", currentPage);
            params.append("paginate_size", pageSize);
            if (debouncedSearchQuery) {
              params.append("search_key", debouncedSearchQuery);
            }
            params.append("status", productStatus);

            // Add filter parameters as arrays with [] syntax
            if (brandIds.length > 0) {
              brandIds.forEach((bId) => params.append("brand_ids[]", bId));
            }
            if (categoryIds.length > 0) {
              categoryIds.forEach((cId) =>
                params.append("category_ids[]", cId)
              );
            }
            if (subCategoryIds.length > 0) {
              subCategoryIds.forEach((sId) =>
                params.append("sub_category_ids[]", sId)
              );
            }
            if (subSubCategoryIds.length > 0) {
              subSubCategoryIds.forEach((ssId) =>
                params.append("sub_sub_category_ids[]", ssId)
              );
            }
            if (attributeValueIds.length > 0) {
              attributeValueIds.forEach((avId) =>
                params.append("attribute_value_ids[]", avId)
              );
            }
            if (tagIds.length > 0) {
              tagIds.forEach((tId) => params.append("tag_ids[]", tId));
            }
            if (productTypeId) {
              params.append("product_type_id", productTypeId);
            }
            if (dateRange?.[0] && dateRange?.[1]) {
              params.append(
                "start_date",
                dayjs(dateRange[0]).format("YYYY-MM-DD")
              );
              params.append(
                "end_date",
                dayjs(dateRange[1]).format("YYYY-MM-DD")
              );
            }
            if (
              minPrice !== undefined &&
              minPrice !== null &&
              minPrice !== ""
            ) {
              params.append("min_price", String(minPrice));
            }
            if (
              maxPrice !== undefined &&
              maxPrice !== null &&
              maxPrice !== ""
            ) {
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

            const refreshed = await getDatas("/admin/products", paramsObj);
            if (refreshed?.success) {
              setTableData(refreshed.result);
              setProducts(refreshed.result?.data || []);
            }
          } finally {
            setLoading(false);
          }
        }
      } else {
        message.error(res?.msg || "Restore failed");
      }
    } catch {
      message.error("Restore failed");
    }
  };

  const handlePermanentDelete = async (id) => {
    modal.confirm({
      title: "Permanently delete this product?",
      content: "This cannot be undone.",
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No",
      centered: true,
      onOk: async () => {
        try {
          const res = await deleteData(
            `/admin/products/${id}/permanent-delete`,
            {}
          );
          if (res?.success) {
            message.success("Permanently deleted");
            fetchTrashData();
          } else {
            message.error(res?.msg || "Delete failed");
          }
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  const handleBulkTrashAction = async (action) => {
    if (selectedRowKeys.length === 0)
      return message.error("Select at least one product");

    if (action === "bulk-restore") {
      try {
        const res = await putData("/admin/products/bulk/restore", {
          product_ids: selectedRowKeys,
        });
        if (res?.success) {
          message.success("Bulk restore done");
          setSelectedRowKeys([]);
          setIsActionShow(false);
          fetchTrashData();

          // If not in trash view, refresh the product list to show restored items
          if (!isTrashView) {
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
                brandIds.forEach((bId) => params.append("brand_ids[]", bId));
              }
              if (categoryIds.length > 0) {
                categoryIds.forEach((cId) =>
                  params.append("category_ids[]", cId)
                );
              }
              if (subCategoryIds.length > 0) {
                subCategoryIds.forEach((sId) =>
                  params.append("sub_category_ids[]", sId)
                );
              }
              if (subSubCategoryIds.length > 0) {
                subSubCategoryIds.forEach((ssId) =>
                  params.append("sub_sub_category_ids[]", ssId)
                );
              }
              if (attributeValueIds.length > 0) {
                attributeValueIds.forEach((avId) =>
                  params.append("attribute_value_ids[]", avId)
                );
              }
              if (tagIds.length > 0) {
                tagIds.forEach((tId) => params.append("tag_ids[]", tId));
              }
              if (productTypeId) {
                params.append("product_type_id", productTypeId);
              }
              if (dateRange?.[0] && dateRange?.[1]) {
                params.append(
                  "start_date",
                  dayjs(dateRange[0]).format("YYYY-MM-DD")
                );
                params.append(
                  "end_date",
                  dayjs(dateRange[1]).format("YYYY-MM-DD")
                );
              }
              if (
                minPrice !== undefined &&
                minPrice !== null &&
                minPrice !== ""
              ) {
                params.append("min_price", String(minPrice));
              }
              if (
                maxPrice !== undefined &&
                maxPrice !== null &&
                maxPrice !== ""
              ) {
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

              const refreshed = await getDatas("/admin/products", paramsObj);
              if (refreshed?.success) {
                setTableData(refreshed.result);
                setProducts(refreshed.result?.data || []);
              }
            } finally {
              setLoading(false);
            }
          }
        } else {
          message.error(res?.msg || "Bulk restore failed");
        }
      } catch {
        message.error("Bulk restore failed");
      }
    }

    if (action === "bulk-permanent-delete") {
      modal.confirm({
        title: "Permanently delete selected products?",
        content: "This cannot be undone.",
        okText: "Yes, delete",
        okType: "danger",
        cancelText: "No",
        centered: true,
        onOk: async () => {
          try {
            const res = await deleteData(
              "/admin/products/bulk/permanent-delete",
              { product_ids: selectedRowKeys }
            );
            if (res?.success) {
              message.success("Bulk permanent delete done");
              setSelectedRowKeys([]);
              setIsActionShow(false);
              fetchTrashData();
            } else {
              message.error(res?.msg || "Bulk delete failed");
            }
          } catch {
            message.error("Bulk delete failed");
          }
        },
      });
    }
  };

  const handleBulkDelete = async (action) => {
    if (selectedRowKeys.length === 0) return message.error("Select at least one product");
    if (action === "bulk-delete") {
      try {
        const res = await deleteData("/admin/products/bulk/delete", {
          data: {
            product_ids: selectedRowKeys,
          },
        });
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

        // Add basic parameters
        params.append("page", currentPage);
        params.append("paginate_size", pageSize);
        if (debouncedSearchQuery) {
          params.append("search_key", debouncedSearchQuery);
        }
        params.append("status", productStatus);

        // Add filter parameters as arrays with [] syntax
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

        // Dates
        if (dateRange?.[0] && dateRange?.[1]) {
          params.append("start_date", dayjs(dateRange[0]).format("YYYY-MM-DD"));
          params.append("end_date", dayjs(dateRange[1]).format("YYYY-MM-DD"));
        }

        // Prices
        if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
          params.append("min_price", String(minPrice));
        }
        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
          params.append("max_price", String(maxPrice));
        }

        // Convert URLSearchParams to object for getDatas
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
  }, [
    currentPage,
    pageSize,
    productStatus,
    debouncedSearchQuery,
    brandIds,
    categoryIds,
    subCategoryIds,
    subSubCategoryIds,
    attributeValueIds,
    tagIds,
    dateRange,
    minPrice,
    maxPrice,
    productTypeId,
  ]);

  // Fetch trash data when trash view or pagination changes
  useEffect(() => {
    if (isTrashView) {
      fetchTrashData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrashView, trashPage, trashPageSize]);

  // Redirect to normal view if trash is empty
  useEffect(() => {
    if (
      isTrashView &&
      !loading &&
      trashData.length === 0 &&
      trashTableMeta?.total === 0
    ) {
      message.info("Trash is empty");
      setIsTrashView(false);
    }
  }, [isTrashView, loading, trashData, trashTableMeta]);

  return (
    <>
      {modalContextHolder}
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">All Products</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "All Products" },
            ]}
          />
        </div>
      </div>

      {/* Filter Section (Responsive) */}
      <div className="product-filter-section" style={{ marginBottom: 16 }}>
        <div className="filter-desktop-actions" style={{ marginBottom: 12 }}>
          <Row gutter={16} justify="space-between" align="middle">
            <Col>
              <Tabs
                  activeKey={activeTab}
                  onChange={(key) => {
                    setActiveTab(key);
                    setProductStatus(key);
                  }}
                  items={[
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
                <Button icon={<FilterOutlined />} onClick={() => setFiltersOpen((v) => !v)}>
                  {filtersOpen ? "Hide Filters" : "Show Filters"}
                </Button>

                {isActionShow && (
                  <Select value={selectedAction} onChange={isTrashView ? handleBulkTrashAction : handleBulkAction} placeholder="Action" style={{ width: 150 }}>
                    {isTrashView ? (
                      <>
                        <Option value="bulk-restore">Bulk Restore</Option>
                        <Option value="bulk-permanent-delete">
                          Bulk Permanent Delete
                        </Option>
                      </>
                    ) : (
                      <Option value="bulk-status-update">Bulk Status Update</Option>
                    )}
                  </Select>
                )}

                {isActionShow && (
                  <Select value={selectedAction} onChange={handleBulkDelete} placeholder="Action" style={{ width: 150 }}>
                    <Option value="bulk-delete">Bulk Delete</Option>
                  </Select>
                )}

                {hasPermission("products-create") && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleProductAdd}>
                    Add
                  </Button>
                )}

                {hasPermission("products-delete") && (
                  <Button icon={<DeleteOutlined />} onClick={handleToggleTrash}>
                    {isTrashView ? "Back to List" : "Trash"}
                  </Button>
                )}

                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                  Back
                </Button>
              </Space>
            </Col>

          </Row>
        </div>


        {/* Mobile Actions (Always Visible) */}
        <div className="filter-mobile-actions" style={{ marginBottom: 12 }}>
          <Space size="small" style={{ width: "100%" }}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFiltersOpen((v) => !v)}
              style={{ flex: 1 }}
            >
              {filtersOpen ? "Hide" : "Filters"}
            </Button>

            {isActionShow && (
              <Select
                value={selectedAction}
                onChange={
                  isTrashView ? handleBulkTrashAction : handleBulkAction
                }
                placeholder="Action"
                style={{ flex: 1 }}
              >
                {isTrashView ? (
                  <>
                    <Option value="bulk-restore">Bulk Restore</Option>
                    <Option value="bulk-permanent-delete">
                      Bulk Permanent Delete
                    </Option>
                  </>
                ) : (
                  <Option value="bulk-status-update">Bulk Status Update</Option>
                )}
              </Select>
            )}

            {hasPermission("products-create") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleProductAdd}
                style={{ flex: 1 }}
              >
                Add
              </Button>
            )}

            {hasPermission("products-delete") && (
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                onClick={handleToggleTrash}
                style={{ flex: 1 }}
              >
                {isTrashView ? "Back" : "Trash"}
              </Button>
            )}

            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
              style={{ flex: 1 }}
            >
              Back
            </Button>
          </Space>
        </div>

        {/* Collapsible wrapper */}
        <div className={`product-filter-collapsible ${filtersOpen ? "is-open" : ""}`} aria-hidden={!filtersOpen} aria-expanded={filtersOpen}>
          {/* Desktop Layout */}
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
                  <Select
                    mode="multiple"
                    value={brandIds}
                    onChange={setBrandIds}
                    placeholder="Select Brand"
                    style={{ width: 180 }}
                    allowClear
                  >
                    {brands.map((b) => (
                      <Option key={b.id} value={b.id}>
                        {b.name}
                      </Option>
                    ))}
                  </Select>

                  {/* Category Filter */}
                  <Select
                    mode="multiple"
                    value={categoryIds}
                    onChange={setCategoryIds}
                    placeholder="Select Category"
                    style={{ width: 180 }}
                    allowClear
                  >
                    {categories.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>

                  {/* Sub Category Filter */}
                  <Select
                    mode="multiple"
                    value={subCategoryIds}
                    onChange={setSubCategoryIds}
                    placeholder="Select Sub Category"
                    style={{ width: 180 }}
                    allowClear
                  >
                    {subCategories.map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name}
                      </Option>
                    ))}
                  </Select>

                  {/* Product Type Filter */}
                  <Select
                    value={productTypeId}
                    onChange={setProductTypeId}
                    placeholder="Select Product Type"
                    style={{ width: 180 }}
                    allowClear
                  >
                    {productTypes.map((t) => (
                      <Option key={t.id} value={t.id}>
                        {t.name}
                      </Option>
                    ))}
                  </Select>

                  {/* Sub-Sub Category */}
                  <Select
                    mode="multiple"
                    value={subSubCategoryIds}
                    onChange={setSubSubCategoryIds}
                    placeholder="Select Sub Sub Category"
                    style={{ width: 200 }}
                    allowClear
                  >
                    {subSubCategories.map((ssc) => (
                      <Option key={ssc.id} value={ssc.id}>
                        {ssc.name}
                      </Option>
                    ))}
                  </Select>

                  {/* Attribute Values */}
                  <Select
                    mode="multiple"
                    value={attributeValueIds}
                    onChange={setAttributeValueIds}
                    placeholder="Select Attribute Values"
                    style={{ width: 240 }}
                    allowClear
                    maxTagCount="responsive"
                    showSearch
                    optionFilterProp="children"
                  >
                    {attributeValues.map((av) => (
                      <Option key={av.id} value={av.id}>
                        {av.attribute?.name
                          ? `${av.attribute.name} — ${av.value}`
                          : av.value}
                      </Option>
                    ))}
                  </Select>

                  {/* Date Range */}
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={(v) => setDateRange(v)}
                    style={{ width: 260 }}
                    allowEmpty={[true, true]}
                  />

                  {/* Price Range */}
                  <InputNumber
                    value={minPrice}
                    onChange={setMinPrice}
                    placeholder="Min Price"
                    style={{ width: 120 }}
                    min={0}
                  />

                  <InputNumber
                    value={maxPrice}
                    onChange={setMaxPrice}
                    placeholder="Max Price"
                    style={{ width: 120 }}
                    min={0}
                  />

                  <Button onClick={clearFilters}>Clear Filters</Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Mobile Layout */}
          <div className="filter-mobile">
            <div className="filter-mobile-inputs">
              <AntInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />

              <Select
                value={productStatus}
                onChange={handleStatusChange}
                placeholder="Status"
                style={{ width: "100%" }}
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>

              <Select
                mode="multiple"
                value={brandIds}
                onChange={setBrandIds}
                placeholder="Brand"
                allowClear
                style={{ width: "100%" }}
              >
                {brands.map((b) => (
                  <Option key={b.id} value={b.id}>
                    {b.name}
                  </Option>
                ))}
              </Select>

              <Select
                mode="multiple"
                value={categoryIds}
                onChange={setCategoryIds}
                placeholder="Category"
                allowClear
                style={{ width: "100%" }}
              >
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>

              <Select
                mode="multiple"
                value={subCategoryIds}
                onChange={setSubCategoryIds}
                placeholder="Sub Category"
                allowClear
                style={{ width: "100%" }}
              >
                {subCategories.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name}
                  </Option>
                ))}
              </Select>

              <Select
                value={productTypeId}
                onChange={setProductTypeId}
                placeholder="Product Type"
                allowClear
                style={{ width: "100%" }}
              >
                {productTypes.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>

              {/* Sub Sub Category */}
              <Select
                mode="multiple"
                value={subSubCategoryIds}
                onChange={setSubSubCategoryIds}
                placeholder="Sub Sub Category"
                allowClear
                style={{ width: "100%" }}
              >
                {subSubCategories.map((ssc) => (
                  <Option key={ssc.id} value={ssc.id}>
                    {ssc.name}
                  </Option>
                ))}
              </Select>

              {/* Attribute Values */}
              <Select
                mode="multiple"
                value={attributeValueIds}
                onChange={setAttributeValueIds}
                placeholder="Attribute Values"
                allowClear
                style={{ width: "100%" }}
                maxTagCount="responsive"
                showSearch
                optionFilterProp="children"
              >
                {attributeValues.map((av) => (
                  <Option key={av.id} value={av.id}>
                    {av.attribute?.name
                      ? `${av.attribute.name} — ${av.value}`
                      : av.value}
                  </Option>
                ))}
              </Select>

              {/* Date Range */}
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(v) => setDateRange(v)}
                style={{ width: "100%" }}
                allowEmpty={[true, true]}
              />

              {/* Price Range */}
              <InputNumber
                value={minPrice}
                onChange={setMinPrice}
                placeholder="Min Price"
                style={{ width: "100%" }}
                min={0}
              />
              <InputNumber
                value={maxPrice}
                onChange={setMaxPrice}
                placeholder="Max Price"
                style={{ width: "100%" }}
                min={0}
              />

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

          {/* Desktop Table */}
          <div className="product-table-desktop">
            {isTrashView ? (
              <Table
                rowSelection={rowSelection}
                columns={trashColumns}
                dataSource={trashData}
                loading={loading}
                tableLayout="fixed"
                size="small"
                bordered
                scroll={{ x: "max-content" }}
                rowKey="id"
                pagination={{
                  current: trashPage,
                  pageSize: trashPageSize,
                  total: trashTableMeta?.total || 0,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                  onChange: (page, size) => {
                    setTrashPage(page);
                    setTrashPageSize(size);
                  },
                }}
              />
            ) : (
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={products}
                loading={loading}
                tableLayout="fixed"
                size="small"
                bordered
                scroll={{ x: "max-content" }}
                rowKey="id"
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
            )}
          </div>

          {/* Mobile Table */}
          <div className="product-table-mobile">
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                Loading...
              </div>
            ) : products.length > 0 ? (
              products.map((item) => {
                const hasVariations =
                  item?.variations && item?.variations.length > 0;
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

                    {/* Price Section */}
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

                    {/* Actions & Status */}
                    <div className="mobile-bottom">
                      <div className="mobile-actions">
                        <Tooltip title="Product View">
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(item)}
                          />
                        </Tooltip>
                        {hasPermission("products-update") && (
                          <Tooltip title="Product Edit">
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(item)}
                            />
                          </Tooltip>
                        )}
                        {hasPermission("products-create") && (
                          <Tooltip title="Product Copy">
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(item.id)}
                            />
                          </Tooltip>
                        )}
                        {hasPermission("products-delete") && (
                          <Tooltip title="Product Delete">
                            <Button
                              size="small"
                              danger
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

      {/* Product Preview Modal */}
      <Modal
        title="Product Preview"
        open={previewModal}
        onCancel={() => setPreviewModal(false)}
        footer={null}
        width={900}
      >
        {loading ? (
          <Spin />
        ) : (
          previewData && (
            <Row gutter={24}>
              {/* Left: Product Image */}
              <Col span={10}>
                <img
                  src={previewData.image || "/free.jpg"}
                  alt={previewData.name}
                  style={{ width: "100%", borderRadius: 8 }}
                />
                {previewData.images && previewData.images.length > 0 && (
                  <Row gutter={8} style={{ marginTop: 8 }}>
                    {previewData.images.map((img, idx) => (
                      <Col key={idx} span={6}>
                        <img
                          src={img.image}
                          alt={`variation-${idx}`}
                          style={{ width: "100%", borderRadius: 4 }}
                        />
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
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      title="View Product"
                      onClick={() =>
                        window.open(
                          `${settingsData.replace(/\/$/, "")}/product/${
                            previewData.slug
                          }`,
                          "_blank"
                        )
                      }
                      className="view-button"
                    >
                      View
                    </Button>
                  )}
                </h3>

                <p>
                  <strong>SKU:</strong> {previewData.sku || "N/A"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <Tag
                    color={previewData.status === "active" ? "green" : "red"}
                    style={{ marginLeft: 8 }}
                  >
                    {previewData.status === "active" ? "Active" : "Inactive"}
                  </Tag>
                </p>

                {previewData.category && previewData.brand && (
                  <p>
                    <strong>Category:</strong> {previewData.category.name},{" "}
                    <strong>Brand:</strong> {previewData.brand.name}
                  </p>
                )}

                {/* Price Range */}
                {previewData.variation_price_range && (
                  <p
                    style={{ fontSize: 18, fontWeight: 600, color: "#27ae60" }}
                  >
                    {previewData.variation_price_range.min_price} Tk -{" "}
                    {previewData.variation_price_range.max_price} Tk
                  </p>
                )}

                {/* Description */}
                {previewData.description && (
                  <div style={{ marginTop: 16 }}>
                    <h4>Description:</h4>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: previewData.description,
                      }}
                      style={{ maxHeight: 200, overflowY: "auto" }}
                    />
                  </div>
                )}

                {/* Variations Table */}
                {previewData.variations?.data?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Table
                      columns={columns}
                      dataSource={previewData.variations.data}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>
                )}
              </Col>
            </Row>
          )
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        title="Image Preview"
        open={imagePreviewModal}
        onCancel={() => setImagePreviewModal(false)}
        footer={null}
      >
        {previewImage && (
          <img src={previewImage} alt="Preview" style={{ width: "100%" }} />
        )}
      </Modal>

      {/* Bulk Status Update Modal */}
      <Modal
        title="Change Product Status"
        open={bulkStatusModal}
        onOk={handleBulkStatusUpdate}
        onCancel={() => {
          setBulkStatusModal(false);
          setBulkStatusValue("");
        }}
        width={300}
      >
        <Select
          value={bulkStatusValue}
          onChange={setBulkStatusValue}
          placeholder="Select Status"
          style={{ width: "100%" }}
        >
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

    </>
  );
}
