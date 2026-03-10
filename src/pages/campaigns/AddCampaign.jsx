import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import "./AddCampaign.css";
import ImagePicker from "../../components/image/ImagePicker";

export default function AddCampaign() {
    // Hook
    useTitle("Add Campaign");

    // Variable
    const navigate = useNavigate();
    
    // State
    const [form]                                    = Form.useForm();
    const [query, setQuery]                         = useState("");
    const [showInput, setShowInput]                 = useState(true);
    const [showCampaignInput, setShowCampaignInput] = useState(true);
    const [searchProducts, setSearchProducts]       = useState([]);
    const [selectedProducts, setSelectedProducts]   = useState([]);
    const [messageApi, contextHolder]               = message.useMessage();
    const [page, setPage]                           = useState(1);
    const [hasMore, setHasMore]                     = useState(true);
    const [loadingMore, setLoadingMore]             = useState(false);
    const [loading, setLoading]                     = useState(false);
    const [gallery, setGallery]                     = useState();
    const [errors, setErros]                        = useState({});
    const [addedProductIds, setAddedProductIds]     = useState(new Set());
    const [applyToAll, setApplyToAll]               = useState({});

    useEffect(() => {
        fetchMedia(page);
    }, []);

    const fetchMedia = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            setLoadingMore(true);

            const res = await getDatas(`/admin/gallary?page=${pageNumber}`);

            if (res && res?.success) {
                const data = res.result.data;

                if (pageNumber > 1) {
                    setGallery(prev => [...prev, ...data]);
                } else {
                    setGallery(data);
                }

                const meta = res.result.meta;
                setPage(meta.current_page);
                setHasMore(meta.current_page < meta.last_page);
            }
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
        if (query.trim() !== "") {
            fetchProducts(query);
        } else {
            setSearchProducts([]);
        }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    const fetchProducts = async (search) => {
        try {
            const res = await getDatas('/admin/products/search', {search_key: search })
            setSearchProducts(res?.result || []);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    const handleAddProduct = (product) => {
        setSelectedProducts(sp => {
            const exists = sp.find(p => p.id === product.id);

            if (exists) {
                return sp.filter(p => p.id !== product.id);
            } else {
                return [...sp, product];
            }
        });

        setAddedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(product.id)) {
                next.delete(product.id);
            } else {
                next.add(product.id);
            }
            return next;
        });
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts(sp => sp.filter(p => p.id !== productId));
        setAddedProductIds(prev => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
        });
    };

    const handleDiscountChange = (item, variation, value) => {

        const isApplyAll = applyToAll[item.id];

        const currentKey = `discount_value_${item.id}_${variation?.id || "default"}`;

        form.setFieldValue(currentKey, value);

        if (!isApplyAll) return;

        if (item.variations && item.variations.length > 0) {
            item.variations.forEach((varItem) => {

                if (varItem.id === variation.id) return;

                const key = `discount_value_${item.id}_${varItem.id}`;

                form.setFieldValue(key, value);
            });
        }
    };

    const handleTypeChange = (item, variation, value) => {

        const isApplyAll = applyToAll[item.id];

        const currentKey = `discount_type_${item.id}_${variation?.id || "default"}`;

        form.setFieldValue(currentKey, value);

        if (!isApplyAll) return;

        if (item.variations && item.variations.length > 0) {
            item.variations.forEach((varItem) => {

                if (varItem.id === variation.id) return;

                const key = `discount_type_${item.id}_${varItem.id}`;

                form.setFieldValue(key, value);
            });
        }
    };

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("title", values.title);
        formData.append("start_date", values.start_date);
        formData.append("end_date", values.end_date);
        formData.append("status", values.status);

        const image = values.image?.[0];
        if (image) {
            if (image.originFileObj) {
                formData.append("image", image.originFileObj);
            } else if (image.isFromGallery) {
                formData.append("image", image.galleryPath);
                formData.append("width", values.width);
                formData.append("height", values.height);
            }
        }

        selectedProducts.forEach((product, index) => {
            formData.append(`items[${index}][product_id]`, product.id);

            // product with variations
            if (product.variations && product.variations.length > 0) {
                formData.append(`items[${index}][discount]`, 0);
                formData.append(`items[${index}][discount_type]`, "");

                product.variations.forEach((variation, vIndex) => {
                    const discountValue = values[`discount_value_${product.id}_${variation.id}`];
                    const discountType = values[`discount_type_${product.id}_${variation.id}`];

                    formData.append(`items[${index}][variations][${vIndex}][variation_id]`, variation.id);
                    formData.append(`items[${index}][variations][${vIndex}][discount]`,discountValue ?? 0);
                    formData.append(`items[${index}][variations][${vIndex}][discount_type]`,discountType ?? "");
                });
            } else {
                // normal product
                const discountValue = values[`discount_value_${product.id}_default`];
                const discountType = values[`discount_type_${product.id}_default`];

                formData.append(`items[${index}][discount]`, discountValue ?? 0);
                formData.append(`items[${index}][discount_type]`, discountType ?? "");
            }
        });

        try {
            setLoading(true);

            const res = await postData("/admin/campaigns", formData);

            if (res && res.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/campaigns");
                }, 500);
            } else {
                setErros(res?.errors || {});
            }
        } catch (error) {
            console.error("Campaign submission error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: "600" }}>
                        Campaign Add
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "Campaign Add" }]}/>
                </div>
            </div>

            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
                <div></div>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" initialValues={{width:"3600", height:"1920", start_date: new Date().toISOString().split("T")[0]}}>
                <div className="form-container">
                    <div className="form-left">
                        <div className="left-side-product" onClick={() => setShowInput(!showInput)}>
                            <h2 style={{ margin: 0, color: "#000" }}>Add Product in Campaign</h2>
                            <span style={{ fontSize: "20px" }}>{showInput ? "➖" : "➕"}</span>
                        </div>

                        <hr />

                        {showInput && (
                            <div className="campaign" style={{ position: "relative" }}>
                                <label className="campaign-label">
                                    Add a new product
                                </label>
                                <input type="text" placeholder="Search Product..." className="campaign-input" value={query} onChange={(e) => setQuery(e.target.value)}/>

                                {searchProducts.length > 0 && (
                                    <ul className="campaign-ul">
                                        {searchProducts.map((product) => {
                                            const isAdded = addedProductIds.has(product.id);

                                            const categoryNames = product.categories?.length ? product.categories.map((c) => c.name).join(", ") : "No Category";

                                            return (
                                                <li key={product.id} className="campaign-ul-li">
                                                    <img src={product.img_path} alt={product.name} className="campaign-product-img"/>
                                                    <div className="product-info">
                                                        <strong>{product.name}</strong> <br />
                                                        <small>{categoryNames}</small>
                                                    </div>
                                                    <button onClick={() => handleAddProduct(product)} className="campaign-product-btn">
                                                        {isAdded ? 'Added' : 'Add'}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}

                        {selectedProducts.length > 0 && (
                            <div className="campaign-search-product-section">
                                {selectedProducts.map((item) => (
                                    <div key={item.id} className="campaign-product-card">

                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

                                            <img src={item.img_path || "/free.jpg"} alt={item.name || "Product"} className="campaign-product-image"/>

                                            <h2 style={{ flex: 1, margin: 0, fontSize: 16 }}>
                                                {item.name}
                                            </h2>

                                            <button type="button" onClick={() => handleRemoveProduct(item.id)} className="campaign-product-button">
                                                <DeleteOutlined />
                                            </button>

                                        </div>

                                        {item.variations && item.variations.length > 0 && (
                                            <div style={{ marginBottom: 8, marginTop: 8 }}>
                                                <label>
                                                    <input type="checkbox" checked={!!applyToAll[item.id]} onChange={(e) =>
                                                            setApplyToAll((prev) => ({
                                                                ...prev,
                                                                [item.id]: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                    Apply same discount to all variations
                                                </label>
                                            </div>

                                        )}

                                        {(item.variations && item.variations.length > 0 ? item.variations : [null]).map((v, idx) => {
                                            const hasVariation = !!v;

                                            const fieldDiscount = `discount_value_${item.id}_${v?.id || "default"}`;

                                            const fieldType = `discount_type_${item.id}_${v?.id || "default"}`;

                                            return (
                                                <div className="campaign-variations-block" key={v?.id || idx}>
                                                    <div style={{ flex: 2 }}>
                                                        {hasVariation ? (
                                                            <>
                                                                <strong>
                                                                    {v.attribute_value_1?.value || "Default"}
                                                                </strong>

                                                                <div style={{ fontSize: 14, color: "magenta", marginTop: 4 }}>
                                                                    MRP: <span>৳{v.mrp}</span>
                                                                </div>

                                                            </>
                                                        ) : (

                                                            <>
                                                                <strong style={{color:"maroon"}}>Main Product</strong>

                                                                <div style={{ fontSize: 14, marginTop: 4, marginBottom:10, color:"magenta" }}>
                                                                    MRP: <span>৳{item.mrp}</span>
                                                                </div>
                                                            </>

                                                        )}

                                                    </div>

                                                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                                                        <Form.Item name={fieldDiscount} rules={[{ required: true, message: "Enter discount value" }]} style={{ flex: 1 }}>
                                                            <input type="number" placeholder="Discount" className="campaign-input-discount" onChange={(e) => handleDiscountChange(item, v, e.target.value)}/>
                                                        </Form.Item>

                                                        <Form.Item name={fieldType} initialValue="fixed" rules={[{ required: true, message: "Select type" }]} style={{ flex: 1 }}>
                                                            <select className="campaign-select-box" onChange={(e) => handleTypeChange(item, v, e.target.value)}>
                                                                <option value="">Type</option>
                                                                <option value="percentage">Percentage</option>
                                                                <option value="fixed">Fixed</option>
                                                            </select>
                                                        </Form.Item>
                                                    </div>
                                                </div>

                                            );
                                        })}
                                    </div>

                                ))}

                            </div>
                        )}
                    </div>

                    <div className="form-right">
                        <div className="campaing-form-right" onClick={() => setShowCampaignInput(!showCampaignInput)}>
                            <h2 style={{ color: "#000" }}>Campaign Information</h2>
                            <span style={{ fontSize: "20px" }}>{showCampaignInput ? "➖" : "➕"}</span>
                        </div>

                        {showCampaignInput && (
                            <>
                                <Form.Item name="title" label="Campaign Title" rules={[{ required: true }]}>
                                    <AntInput placeholder="Campaign Name" />
                                    {errors.title && <p style={{ color: "red" }}>{errors.title[0]}</p>}
                                </Form.Item>

                                <Form.Item name="start_date" label="Campaign Start Date" rules={[{ required: true }]}>
                                    <AntInput type="date" />
                                </Form.Item>

                                <Form.Item name="end_date" label="Campaign End Date" rules={[{ required: true }]}>
                                    <AntInput type="date" />
                                </Form.Item>

                                <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                                </Form.Item>

                                <ImagePicker form={form} name="image" label="Image" gallery={gallery}  hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)}/>

                                <Form.Item name="width" label="Width" rules={[{ required: true }]}>
                                    <AntInput type="number" />
                                </Form.Item>

                                <Form.Item name="height" label="Height" rules={[{ required: true }]}>
                                    <AntInput type="number" />
                                </Form.Item>
                            </>
                        )}
                    </div>
                </div>

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Submit
                        </Button>
                        <Button htmlType="reset">Reset</Button>
                    </Space>
                </Form.Item>
            </Form>
        </>
    );
}
