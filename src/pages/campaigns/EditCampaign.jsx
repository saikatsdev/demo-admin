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
                        id            : item.product.id,
                        name          : item.product.name,
                        image         : item.product.img_path,
                        category      : item.product.category,
                        discount_value: item.discount,
                        discount_type : item.discount_type,
                    }))
                );

                const discountFields = {};

                campaign.campaign_products.forEach((item) => {
                    discountFields[`discount_value_${item.product.id}`] = item.discount;
                    discountFields[`discount_type_${item.product.id}`] = item.discount_type;
                });
                
                form.setFieldsValue(discountFields);
            }
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
            product_id: product.id,
            discount: values[`discount_value_${product.id}`],
            discount_type: values[`discount_type_${product.id}`],
        }));

        const formData = new FormData();

        formData.append("title", values.title);
        formData.append("start_date", values.start_date);
        formData.append("end_date", values.end_date);
        formData.append("status", values.status);
        formData.append("width", values.width);
        formData.append("height", values.height);

        if (values.image) {
            formData.append("image", values.image);
        }

        items.forEach((item, index) => {
            Object.entries(item).forEach(([key, value]) => {
                formData.append(`items[${index}][${key}]`, value);
            });
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

            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" initialValues={{width:"1800", height:"960", start_date: new Date().toISOString().split("T")[0]}}>
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
                                    <ul className="campaingn-ul">
                                        {searchProducts.map((product) => (
                                            <li className="campaign-ul-li" key={product.id} onClick={() => handleSelectProduct(product)}>
                                                <img src={product.image || product.img_path} alt="Product" className="campaign-product-img"/>
                                                <div>
                                                    {product.name} <br />
                                                    {product.category?.name}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {selectedProducts.length > 0 && (
                            <div className="search-product-section" style={{ marginTop: "20px" }}>
                                {selectedProducts.map((item) => (
                                    <div key={item.id} className="product-card">
                                        <div className="product-card-top">
                                            <img src={item.image || item.img_path} alt={item.name || "Product"} className="camp-product-image"/>
                                            <h2 className="product-name">{item.name}</h2>
                                            <button className="delete-btn" type="button" onClick={() => handleRemoveProduct(item.id)}>
                                                <DeleteOutlined />
                                            </button>
                                        </div>

                                        <div className="product-card-bottom">
                                            <Form.Item name={`discount_value_${item.id}`} label="Discount Value" rules={[{ required: true, message: "Enter discount value" }]}>
                                                <input type="number" placeholder="Enter Value" />
                                            </Form.Item>

                                            <Form.Item  name={`discount_type_${item.id}`} label="Type" rules={[{ required: true, message: "Select type" }]}>
                                                <select>
                                                    <option value="">Select One</option>
                                                    <option value="percentage">Percentage</option>
                                                    <option value="fixed">Fixed</option>
                                                </select>
                                            </Form.Item>
                                        </div>
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
