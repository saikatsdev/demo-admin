import { ArrowLeftOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message, Card, Row, Col, Tooltip } from "antd";
import dayjs from "dayjs";
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
                width     : campaign.width || "3600",
                height    : campaign.height || "1920",
            });

            if (campaign?.image) {
              setPreviewImage(campaign.image);
            }

            if (campaign.campaign_products && Array.isArray(campaign.campaign_products)) {
                const mappedProducts = campaign.campaign_products.map((item) => ({
                    ...item.product,
                    image: item.product.img_path,
                    mrp: item.mrp,
                }));
                
                setSelectedProducts(mappedProducts);

                // Keep track of initially added product IDs
                const initialIds = new Set(mappedProducts.map(p => p.id));
                setAddedProductIds(initialIds);

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

        const image = values.image?.[0] || values.image;
        if (image) {
            if (image.originFileObj) {
                formData.append("image", image.originFileObj);
            } else if (image instanceof File) {
                formData.append("image", image);
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
                        Edit Campaign Settings
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/campaigns">Campaigns</Link> },
                            { title: "Edit Campaign" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div></div>
                <Button icon={<ArrowLeftOutlined />} size="large" onClick={() => window.history.back()} style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                    Back
                </Button>
            </div>

            <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSubmit} 
                autoComplete="off" 
                initialValues={{ width: "3600", height: "1920" }}
            >
                <Row gutter={[24, 24]}>
                    {/* Left Column: Product Configurations */}
                    <Col xs={24} lg={16}>
                        <Card 
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowInput(!showInput)}>
                                    <span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>
                                        🎯 Edit Products in Campaign
                                    </span>
                                    <span style={{ fontSize: "14px", color: '#94a3b8' }}>{showInput ? "➖ Hide Section" : "➕ Show Section"}</span>
                                </div>
                            }
                            bordered={false}
                            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', borderRadius: '12px', marginBottom: 24 }}
                            bodyStyle={{ display: showInput ? 'block' : 'none', padding: '20px' }}
                        >
                            <div style={{ position: "relative", marginBottom: 8 }}>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                                    Search & Add New Products
                                </label>
                                <AntInput 
                                    placeholder="Search by product name, brand or SKU..." 
                                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                    value={query} 
                                    onChange={(e) => setQuery(e.target.value)}
                                    style={{ height: '42px', borderRadius: '6px' }}
                                />

                                {searchProducts.length > 0 && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '100%', 
                                        left: 0, 
                                        right: 0, 
                                        zIndex: 1000, 
                                        background: '#fff', 
                                        borderRadius: '8px', 
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                                        border: '1px solid #e2e8f0', 
                                        maxHeight: '320px', 
                                        overflowY: 'auto',
                                        marginTop: '8px',
                                        padding: '8px'
                                    }}>
                                        {searchProducts.map((product) => {
                                            const isAdded = addedProductIds.has(product.id);
                                            const categoryNames = product.categories?.length ? product.categories.map((c) => c.name).join(", ") : "No Category";
                                            return (
                                                <div 
                                                    key={product.id} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '12px', 
                                                        padding: '10px', 
                                                        borderRadius: '6px', 
                                                        transition: 'background 0.2s', 
                                                        marginBottom: '4px',
                                                        background: isAdded ? '#f0fdf4' : '#fff',
                                                        border: isAdded ? '1px solid #bbf7d0' : '1px solid transparent'
                                                    }}
                                                >
                                                    <img 
                                                        src={product.image || product.img_path || "/placeholder.jpg"} 
                                                        alt={product.name} 
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{product.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{categoryNames || product.category_name}</div>
                                                    </div>
                                                    <Button 
                                                        type={isAdded ? "primary" : "default"} 
                                                        size="small" 
                                                        danger={isAdded}
                                                        onClick={() => handleAddProduct(product)}
                                                        style={{ borderRadius: '4px' }}
                                                    >
                                                        {isAdded ? 'Remove' : 'Add'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {selectedProducts.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#475569', marginBottom: '16px' }}>
                                    📋 Configured Campaign Items ({selectedProducts.length})
                                </div>
                                <Row gutter={[16, 16]}>
                                    {selectedProducts.map((item) => (
                                        <Col xs={24} md={12} key={item.id}>
                                            <Card 
                                                bordered={false}
                                                style={{ 
                                                    borderRadius: '12px', 
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    border: '1px solid #e2e8f0',
                                                    height: '100%'
                                                }}
                                                bodyStyle={{ padding: '18px' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                                    <img 
                                                        src={item.img_path || item.image || "/placeholder.jpg"} 
                                                        alt={item.name} 
                                                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{item.name}</h4>
                                                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                                                            MRP: <span style={{ fontWeight: 600, color: '#6366f1' }}>৳{item.mrp || 0}</span>
                                                        </div>
                                                    </div>
                                                    <Tooltip title="Remove Product">
                                                        <Button 
                                                            type="text" 
                                                            danger 
                                                            icon={<DeleteOutlined />} 
                                                            onClick={() => handleRemoveProduct(item.id)}
                                                            style={{ background: '#fff1f0', borderRadius: '6px' }}
                                                        />
                                                    </Tooltip>
                                                </div>
                                                
                                                {item.variations && item.variations.length > 0 && (
                                                    <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={!!applyToAll[item.id]} 
                                                                onChange={(e) => setApplyToAll(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                                style={{ accentColor: '#6366f1' }}
                                                            />
                                                            Apply same discount to all variations
                                                        </label>
                                                    </div>
                                                )}
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {(item.variations && item.variations.length > 0 ? item.variations : [null]).map((v, idx) => {
                                                        const hasVariation = !!v;
                                                        const fieldDiscount = `discount_value_${item.id}_${v?.id || "default"}`;
                                                        const fieldType = `discount_type_${item.id}_${v?.id || "default"}`;

                                                        return (
                                                            <div 
                                                                key={v?.id || idx} 
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'space-between', 
                                                                    gap: '12px',
                                                                    background: '#f8fafc',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #f1f5f9'
                                                                }}
                                                            >
                                                                <div style={{ flex: 1 }}>
                                                                    {hasVariation ? (
                                                                        <div>
                                                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                                                                {v.attribute_value_1?.value || "Default"}
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                                                MRP: <span style={{ fontWeight: 600 }}>৳{v.mrp}</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                                                                                Main Product
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                                                MRP: <span style={{ fontWeight: 600 }}>৳{item.mrp}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '8px', width: '180px', flexShrink: 0 }}>
                                                                    <Form.Item 
                                                                        name={fieldDiscount} 
                                                                        rules={[{ required: true, message: "Required" }]} 
                                                                        style={{ margin: 0, flex: 1 }}
                                                                    >
                                                                        <AntInput 
                                                                            type="number" 
                                                                            placeholder="Discount" 
                                                                            onChange={(e) => handleDiscountChange(item, v, e.target.value)}
                                                                            style={{ borderRadius: '6px', height: '36px' }}
                                                                        />
                                                                    </Form.Item>

                                                                    <Form.Item 
                                                                        name={fieldType} 
                                                                        initialValue="fixed" 
                                                                        rules={[{ required: true, message: "Required" }]} 
                                                                        style={{ margin: 0, flex: 1 }}
                                                                    >
                                                                        <Select 
                                                                            options={[
                                                                                { value: "percentage", label: "Percent (%)" },
                                                                                { value: "fixed", label: "Fixed (৳)" }
                                                                            ]} 
                                                                            onChange={(value) => handleTypeChange(item, v, value)}
                                                                            style={{ height: '36px' }}
                                                                        />
                                                                    </Form.Item>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}
                    </Col>

                    {/* Right Column: Campaign Information */}
                    <Col xs={24} lg={8}>
                        <Card 
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowCampaignInput(!showCampaignInput)}>
                                    <span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>
                                        📝 Campaign Information
                                    </span>
                                    <span style={{ fontSize: "14px", color: '#94a3b8' }}>{showCampaignInput ? "➖" : "➕"}</span>
                                </div>
                            }
                            bordered={false}
                            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', borderRadius: '12px', marginBottom: 24 }}
                            bodyStyle={{ display: showCampaignInput ? 'block' : 'none', padding: '20px' }}
                        >
                            <Form.Item name="title" label={<span style={{ fontWeight: 500 }}>Campaign Title</span>} rules={[{ required: true, message: "Please enter campaign title" }]}>
                                <AntInput placeholder="e.g. Summer Clearance Sale" style={{ height: '40px', borderRadius: '6px' }} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="start_date" label={<span style={{ fontWeight: 500 }}>Start Date</span>} rules={[{ required: true, message: "Start date is required" }]}>
                                        <AntInput type="date" style={{ height: '40px', borderRadius: '6px' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="end_date" label={<span style={{ fontWeight: 500 }}>End Date</span>} rules={[{ required: true, message: "End date is required" }]}>
                                        <AntInput type="date" style={{ height: '40px', borderRadius: '6px' }} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="status" label={<span style={{ fontWeight: 500 }}>Status</span>} rules={[{ required: true }]} initialValue="active">
                                <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]} style={{ height: '40px' }} />
                            </Form.Item>

                            {/* Banner Image Custom Premium Upload Component */}
                            <Form.Item 
                                name="image" 
                                label={<span style={{ fontWeight: 500 }}>Campaign Banner Image</span>} 
                                valuePropName="file" 
                                getValueFromEvent={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setPreviewImage(URL.createObjectURL(file));
                                    } 
                                    return file;
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="campaign-edit-upload"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setPreviewImage(URL.createObjectURL(file));
                                                form.setFieldValue("image", file);
                                            }
                                        }}
                                    />
                                    <label 
                                        htmlFor="campaign-edit-upload"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '24px 16px',
                                            border: '2px dashed #e2e8f0',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px', marginBottom: '6px' }}>📤</span>
                                        <span style={{ fontWeight: 500, fontSize: '13px', color: '#475569' }}>Click to Upload New Image</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>PNG, JPG, JPEG up to 5MB</span>
                                    </label>
                                </div>
                            </Form.Item>

                            {previewImage && (
                                <div style={{ 
                                    background: '#f8fafc', 
                                    padding: '12px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    textAlign: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textAlign: 'left', fontWeight: 500 }}>Active Image Preview:</div>
                                    <img 
                                        src={previewImage} 
                                        alt="Preview" 
                                        style={{ maxWidth: "100%", height: "auto", maxHeight: "150px", borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                                    />
                                </div>
                            )}

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="width" label={<span style={{ fontWeight: 500 }}>Banner Width (px)</span>} rules={[{ required: true }]}>
                                        <AntInput type="number" style={{ height: '40px', borderRadius: '6px' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="height" label={<span style={{ fontWeight: 500 }}>Banner Height (px)</span>} rules={[{ required: true }]}>
                                        <AntInput type="number" style={{ height: '40px', borderRadius: '6px' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Action buttons under campaign info */}
                        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <Form.Item style={{ margin: 0 }}>
                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ borderRadius: '6px', paddingLeft: 24, paddingRight: 24 }}>
                                        {loading ? "Updating Campaign..." : "Update Campaign"}
                                    </Button>
                                    <Button htmlType="reset" size="large" style={{ borderRadius: '6px' }}>
                                        Reset
                                    </Button>
                                </Space>
                            </Form.Item>
                        </div>
                    </Col>
                </Row>
            </Form>
        </>
    );
}
