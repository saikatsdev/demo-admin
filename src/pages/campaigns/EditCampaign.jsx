import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import {Input as AntInput, Breadcrumb, Button, Form, Select, Space, message } from "antd";
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
    const [applyToAll, setApplyToAll]               = useState({});
    const [addedProductIds, setAddedProductIds]     = useState(new Set());

    // Get Campaign
    useEffect(() => {
        let isMounted = true;

        const getCampaign = async () => {
            const res = await getDatas(`/admin/campaigns/${id}`);

            if(isMounted){
                setCampaign(res?.result);
            }
        }

        getCampaign();

        return () => {
            isMounted = false;
        }
    }, [id]);

    useEffect(() => {
        if (campaign) {
            const startDate = campaign.start_date?.split(" ")[0] || "";
            const endDate = campaign.end_date?.split(" ")[0] || "";

            form.setFieldsValue({
                title     : campaign.title,
                start_date: startDate,
                end_date  : endDate,
                status    : campaign.status,
            });

            if (campaign?.image) {
              setPreviewImage(campaign.image);
            }

            if (campaign.campaign_products && Array.isArray(campaign.campaign_products)) {
                setSelectedProducts(
                    campaign.campaign_products.map((item) => ({
                        ...item.product,
                        image: item.product.img_path,
                        mrp: item.mrp,
                    }))
                );

                const discountFields = {};

                campaign.campaign_products.forEach((item) => {
                    const product = item.product;

                    if (product.variations && product.variations.length > 0) {
                        product.variations.forEach((v) => {
                            discountFields[`discount_value_${product.id}_${v.id}`] = v.discount;
                            discountFields[`discount_type_${product.id}_${v.id}`] = v.discount_type;
                        });
                    } else {
                        discountFields[`discount_value_${product.id}_default`] = item.discount;
                        discountFields[`discount_type_${product.id}_default`] = item.discount_type;
                    }
                });

                form.setFieldsValue(discountFields);
            }
        }
    }, [campaign]);

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
            const res = await getDatas('/admin/products/search', {search_key: search });

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
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
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

        formData.append('_method','PUT');

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

            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" initialValues={{width:"3600", height:"1920", start_date: new Date().toISOString().split("T")[0]}}>
                <div className="form-container">
                    <div className="form-left">
                        <div className="left-side-product" onClick={() => setShowInput(!showInput)}>
                            <h2 style={{ margin: 0, color: "#000" }}>Edit Product in Campaign</h2>
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
                                            return (
                                                <li key={product.id} className="campaign-ul-li">
                                                    <img src={product.img_path} alt={product.name} className="campaign-product-img"/>
                                                    <div className="product-info">
                                                        <strong>{product.name}</strong> <br />
                                                        <small>{product.category_name || 'No Category'}</small>
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

                                            <img src={item.img_path || item.image} alt={item.name || "Product"} className="campaign-product-image"/>

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

                                <Form.Item name="image" label="Banner Image" valuePropName="file" getValueFromEvent={(e) => {const file = e.target.files[0];
                                    if (file) {setPreviewImage(URL.createObjectURL(file));} return file;
                                }}
                                >
                                    <input type="file" accept="image/*" />
                                </Form.Item>

                                {previewImage && (
                                    <div className="edit-campaign-img">
                                        <img src={previewImage} alt="Preview" style={{width: 200,height: "auto",marginTop: 10,borderRadius: 6,border: "1px solid #ddd"}}/>
                                    </div>
                                )}

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
                            Update
                        </Button>
                        <Button htmlType="reset">Reset</Button>
                    </Space>
                </Form.Item>
            </Form>
        </>
    )
}
