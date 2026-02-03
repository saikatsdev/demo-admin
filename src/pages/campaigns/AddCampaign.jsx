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
    const [gallery, setGallery]                     = useState([]);

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

        const image = values.image?.[0];
        
        if (image) {
            if (image.originFileObj) {
                formData.append('image', image.originFileObj);
            } else if (image.isFromGallery) {
                formData.append('image', image.galleryPath);
                formData.append("width", values.width);
                formData.append("height", values.height);
            }
        }

        items.forEach((item, index) => {
            Object.entries(item).forEach(([key, value]) => {
                formData.append(`items[${index}][${key}]`, value);
            });
        });

        try {
            setLoading(true);

            const res = await postData("/admin/campaigns", formData);

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
                        Campaign Add
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Campaign Add" },
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
                                    <ul className="campaingn-ul">
                                        {searchProducts.map((product) => (
                                            <li className="campaign-ul-li" key={product.id} onClick={() => handleSelectProduct(product)}>
                                                <img src={product.img_path} alt="Product" className="campaign-product-img"/>
                                                <div>
                                                    {product.name} <br />
                                                    {product?.category?.name}
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
                                            <img src={item.img_path || "/free.jpg"} alt={item.name || "Product"} className="camp-product-image"/>
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
