import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import "./edit-campaign.css";

export default function EditCampaign() {
    const { id } = useParams();

    // Hook
    useTitle("Edit Campaign");

    // Variable
    const navigate = useNavigate();
    
    // State
    const [form]                                    = Form.useForm();
    const [query, setQuery]                         = useState("");
    const [showInput, setShowInput]                 = useState(true);
    const [showCampaignInput, setShowCampaignInput] = useState(true);
    const [searchProducts, setSearchProducts]       = useState([]);
    const [selectedProducts, setSelectedProducts]   = useState([]);
    const [campaign, setCampaign]                   = useState(null);
    const [messageApi, contextHolder]               = message.useMessage();
    const [previewImage, setPreviewImage]           = useState(null);
    const [loading, setLoading]                     = useState(false);
    const [mode, setMode]                             = useState("search");
    const [open, setOpen]                             = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categoryProducts, setCategoryProducts]     = useState([]);
    const [categories, setcategories]                 = useState([]);

    const toggleCategory = async (cat) => {
        const exists = selectedCategories.some(c => c.id === cat.id);

        const values = exists ? selectedCategories.filter(c => c.id !== cat.id) : [...selectedCategories, cat];

        setSelectedCategories(values);

        if (values.length === 0) {
            setCategoryProducts([]);
            return;
        }

        const res = await getDatas("/admin/products", {category_ids: values.map(v => v.id)});

        if (res?.success) {
            setCategoryProducts(res?.result?.data ?? []);
        }
    };

    useEffect(() => {
        const getCategories = async () => {
            const res = await getDatas("/admin/categories/list");

            if(res && res?.success){
                setcategories(res?.result || []);
            }
        }

        getCategories();
    }, []);

    // Get Campaign
    useEffect(() => {
        let isMounted = true;

        const getCampaign = async () => {
            const res = await getDatas(`/admin/campaigns/${id}`);

            if(isMounted){
                setCampaign(res?.result);
                setSelectedProducts(res?.result?.campaign_products);
            }
        }

        getCampaign();

        return () => {
            isMounted = false;
        }
    }, []);

    useEffect(() => {
        if (!campaign) return;

        const startDate = campaign.start_date?.split(" ")[0] || "";
        const endDate   = campaign.end_date?.split(" ")[0] || "";

        form.setFieldsValue({
            title     : campaign.title,
            start_date: startDate,
            end_date  : endDate,
            width     : campaign.width ?? 4360,
            height    : campaign.height ?? 1826,
            status    : campaign.status,
        });

        if (campaign?.image) {
            setPreviewImage(campaign.image);
        }

        if (Array.isArray(campaign.campaign_products)) {
            setSelectedProducts(
                campaign.campaign_products.map(cp => ({
                    id   : cp.product.id,
                    name : cp.product.name,
                    image: cp.product.img_path,
                    category: cp.product.category,
                }))
            );

            const discountFields = {};

            campaign.campaign_products.forEach(cp => {
                discountFields[`discount_value_${cp.product.id}`] = Number(cp.discount);
                discountFields[`discount_type_${cp.product.id}`]  = cp.discount_type;
            });

            form.setFieldsValue(discountFields);
        }
    }, [campaign]);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        form.setFieldValue("image", null);
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
            const res = await getDatas(`/admin/products?search_key=${search}`);
            setSearchProducts(res?.result?.data || []);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    const handleSelectProduct = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            setSelectedProducts((prev) => [...prev, product]);
        }

        setQuery("");
        setSearchProducts([]);
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    const handleSubmit = async (values) => {
        const items = selectedProducts.map((product) => ({
            product_id   : product.id,
            discount     : values[`discount_value_${product.id}`],
            discount_type: values[`discount_type_${product.id}`],
        }));

        const formData = new FormData();

        formData.append("title", values.title);
        formData.append("start_date", values.start_date);
        formData.append("end_date", values.end_date);
        formData.append("status", values.status);
        formData.append("width", values.width);
        formData.append("height", values.height);

        formData.append("_method", "PUT");

        if (values.image) {
            formData.append("image", values.image);
        }

        items.forEach((item, index) => {
            Object.entries(item).forEach(([key, value]) => {
                formData.append(`items[${index}][${key}]`, value);
            });
        });

        try {
            setLoading(true);

            const res = await postData(`/admin/campaigns/${id}`, formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/campaigns");
                }, 500);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: "600" }}>
                        Edit Campaign
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Campaign" },
                        ]}
                    />
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

            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" initialValues={{width:"200", height:"200", start_date: new Date().toISOString().split("T")[0]}}>
                <div className="form-container">
                    <div className="form-left">
                        <div className="left-side-product" onClick={() => setShowInput(!showInput)}>
                            <h2 style={{ margin: 0, color: "#000" }}>Add Product in Campaign</h2>
                            <span style={{ fontSize: "20px" }}>{showInput ? "➖" : "➕"}</span>
                        </div>

                        <hr />

                        <div className="campaign">
                            <label className="campaign-label">Add a new product</label>

                            <div className="campaign-option-tabs">
                                <button className={mode === "search" ? "active" : ""} type="button" onClick={() => setMode("search")}>
                                    Search Product
                                </button>

                                <button className={mode === "category" ? "active" : ""} type="button" onClick={() => setMode("category")}>
                                    Select by Category
                                </button>
                            </div>

                            {mode === "search" && (
                                <>
                                    <AntInput placeholder="Search Product..." className="campaign-input" value={query} onChange={(e) => setQuery(e.target.value)}/>

                                    {searchProducts.length > 0 && (
                                        <ul className="campaingn-ul">
                                            {searchProducts.map((product) => (
                                                <li key={product.id} className="campaign-ul-li" onClick={() => handleSelectProduct(product)}>
                                                    <img src={product.img_path || product.image} alt={product.name} className="campaign-product-img"/>
                                                    <div>
                                                        {product.name} <br />
                                                        {product?.category?.name}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}

                            {mode === "category" && (
                                <>
                                    <div className="multi-select">
                                        <div className="multi-select-input" onClick={() => setOpen(!open)}>
                                            {selectedCategories.length === 0 && (
                                                <span className="placeholder">Select Categories…</span>
                                            )}

                                            {selectedCategories.map((cat) => (
                                                <span key={cat.id} className="campaign-tag">
                                                    {cat.name}
                                                    <button type="button" className="campaign-remove-tag" onClick={(e) => toggleCategory(cat, e)}>
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>

                                        {open && (
                                            <ul className="multi-select-dropdown">
                                                {categories.map((cat) => {
                                                    const isSelected = selectedCategories.some((c) => c.id === cat.id);
                                                    return (
                                                        <li key={cat.id} className={isSelected ? "selected" : ""} onClick={(e) => toggleCategory(cat, e)}>
                                                            <input type="checkbox" readOnly checked={isSelected} />
                                                            {cat.name}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>

                                    {categoryProducts.length > 0 && (
                                        <ul className="campaingn-ul">
                                            {categoryProducts.map((product) => (
                                                <li key={product.id} className="campaign-ul-li" onClick={() => handleSelectProduct(product)}>
                                                    <img src={product.img_path || product.image} alt={product.name} className="campaign-product-img"/>
                                                    <div>{product.name}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}

                            {selectedProducts.length > 0 && (
                                <div className="search-product-section" style={{ marginTop: "20px" }}>
                                    {selectedProducts?.map((item) => (
                                        <div key={item?.id} className="product-card">
                                            <div className="product-card-top">
                                                <img src={item.image} alt={item?.name || "Product"} className="camp-product-image"/>
                                                <h2 className="product-name">{item?.name}</h2>
                                                <button className="delete-btn" type="button" onClick={() => handleRemoveProduct(item?.id)}>
                                                    <DeleteOutlined />
                                                </button>
                                            </div>

                                            <div className="product-card-bottom">
                                                <Form.Item name={`discount_value_${item?.id}`} label="Discount Value">
                                                    <AntInput type="number" placeholder="Enter Value" />
                                                </Form.Item>

                                                <Form.Item name={`discount_type_${item?.id}`} label="Type" initialValue={"fixed"}>
                                                    <Select options={[{ value: "fixed", label: "Fixed" },{ value: "percentage", label: "Percentage" },]}placeholder="Select Type"/>
                                                </Form.Item>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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

                                <Form.Item name="image" label="Banner Image" getValueFromEvent={(e) => e?.target?.files?.[0]} valuePropName="file">
                                    <>
                                        <AntInput type="file" id="image" onChange={handleImageChange} />

                                        {previewImage && (
                                            <div className="edit-campaign-img">
                                                <img src={previewImage} alt="Campaign Preview" className="preview-img" />
                                                <button type="button" onClick={handleRemoveImage} className="preview-img-button" title="Remove Image">
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </>
                                </Form.Item>


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
                        <Button type="primary" htmlType="submit">
                            {loading ? "Updating..." : "Update"}
                        </Button>
                        <Button htmlType="reset">Reset</Button>
                    </Space>
                </Form.Item>
            </Form>
        </>
    )
}
