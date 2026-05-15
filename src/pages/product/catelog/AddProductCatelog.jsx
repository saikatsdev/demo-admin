import { Input as AntInput, Breadcrumb, Button, Form, Select, message, Card} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import { ArrowLeft, Package, Layers, Settings2, PlusCircle, CheckCircle2, LayoutGrid } from "lucide-react";

export default function AddProductCatelog() {
    // Hook
    useTitle("Add Product Catelog");

    //Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // State
    const [categories, setCategories] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [errors, setErrors]         = useState({});
    const [loading, setLoading]       = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            const res = await getDatas("/admin/categories");

            const list = res?.result?.data || [];

            if (isMounted) {
                const mappedCategories = list.map((cat) => ({label: cat.name,value: cat.id}));

                setCategories([{ label: "Select All Categories", value: "all" }, ...mappedCategories]);
            }
        };

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("status", values.status);

        values.categories.forEach((id, index) => {
            formData.append(`category_ids[${index}]`, id);
        });

        try {
            setLoading(true);

            const res = await postData("/admin/product/catalogs/generate-fb-xml-feed",formData);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                form.resetFields();

                setTimeout(() => {
                    navigate("/product/catalogs");
                }, 500);
            }else{
                setErrors(res?.errors)
                messageApi.open({
                    type: "error",
                    content: res?.msg || "Something Went Wrong",
                });
            }
        } catch (error) {
            console.error(error);
        }finally{
            setLoading(false);
        }
    };

    const handleCategoryChange = (selectedValues) => {
        if (selectedValues.includes("all")) {
            const allIds = categories.filter(c => c.value !== "all").map(c => c.value);
            form.setFieldsValue({ categories: allIds });
        }
    };

    return (
        <div style={{ padding: "24px"}}>
            {contextHolder}

            {/* Header Section */}
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "24px",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                padding: "20px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
            }}>
                <div>
                    <h1 style={{ 
                        fontSize: "24px", 
                        fontWeight: "700", 
                        margin: 0, 
                        color: "#1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <LayoutGrid size={28} className="text-primary" style={{ color: "#1890ff" }} />
                        Add Product Catalog
                    </h1>
                    <Breadcrumb 
                        style={{ marginTop: "8px" }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/product/catalogs">Catalogs</Link> },
                            { title: "New Catalog" }
                        ]}
                    />
                </div>

                <Button 
                    icon={<ArrowLeft size={18} />} 
                    onClick={() => window.history.back()}
                    style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        height: "40px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                    }}
                >
                    Back
                </Button>
            </div>

            <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
                <Card 
                    bordered={false}
                    style={{ 
                        borderRadius: "16px", 
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                        overflow: "hidden"
                    }}
                    bodyStyle={{ padding: "32px" }}
                >
                    <div style={{ marginBottom: "24px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#1a1a1a" }}>Catalog Information</h2>
                        <p style={{ color: "#666", fontSize: "14px" }}>Configure your product catalog for Facebook Feed integration. This will generate an XML feed based on selected categories.</p>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <Form.Item 
                                name="name" 
                                label={<span style={{ fontWeight: "600", color: "#444" }}>Catalog Name</span>}
                                rules={[{ required: true, message: "Please enter a catalog name" }]} 
                                validateStatus={errors?.name ? "error" : ""} 
                                help={errors?.name?.[0]}
                            >
                                <AntInput 
                                    prefix={<Package size={18} style={{ color: "#bfbfbf", marginRight: "8px" }} />}
                                    placeholder="e.g. Summer Collection Feed" 
                                    style={{ height: "45px", borderRadius: "8px" }}
                                />
                            </Form.Item>

                            <Form.Item 
                                name="status" 
                                label={<span style={{ fontWeight: "600", color: "#444" }}>Status</span>}
                                rules={[{ required: true }]} 
                                initialValue="active"
                            >
                                <Select 
                                    suffixIcon={<Settings2 size={18} style={{ color: "#bfbfbf" }} />}
                                    options={[
                                        { value: "active", label: "Active" },
                                        { value: "inactive", label: "Inactive" }
                                    ]}
                                    style={{ height: "45px" }}
                                    className="custom-select-height"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item 
                            name="categories" 
                            label={<span style={{ fontWeight: "600", color: "#444" }}>Source Categories</span>}
                            rules={[{ required: true, message: "Please select at least one category" }]}
                        >
                            <Select 
                                mode="multiple" 
                                showSearch 
                                optionFilterProp="label" 
                                options={categories} 
                                placeholder="Select categories to include in the feed" 
                                onChange={handleCategoryChange}
                                style={{ width: "100%", borderRadius: "8px" }}
                                suffixIcon={<Layers size={18} style={{ color: "#bfbfbf" }} />}
                                dropdownStyle={{ borderRadius: "12px" }}
                                maxTagCount="responsive"
                            />
                        </Form.Item>

                        <div style={{ 
                            marginTop: "32px", 
                            paddingTop: "24px", 
                            borderTop: "1px solid #f0f0f0",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px"
                        }}>
                            <Button 
                                size="large"
                                onClick={() => window.history.back()}
                                style={{ borderRadius: "10px", fontWeight: "600", minWidth: "120px" }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                size="large"
                                icon={<PlusCircle size={20} />}
                                style={{ 
                                    borderRadius: "10px", 
                                    fontWeight: "600", 
                                    minWidth: "160px",
                                    height: "45px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.35)"
                                }}
                            >
                                Create Catalog
                            </Button>
                        </div>
                    </Form>
                </Card>

                {/* Info Card for Context */}
                <Card 
                    bordered={false}
                    style={{ 
                        borderRadius: "16px", 
                        background: "linear-gradient(135deg, #f0f7ff 0%, #e6f7ff 100%)",
                        border: "1px solid #bae7ff"
                    }}
                >
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{ 
                            background: "#fff", 
                            padding: "10px", 
                            borderRadius: "12px", 
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" 
                        }}>
                            <CheckCircle2 size={24} style={{ color: "#1890ff" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#003a8c", margin: "0 0 4px 0" }}>Pro Tip: Facebook Feed Optimization</h3>
                            <p style={{ color: "#0050b3", fontSize: "13px", margin: 0 }}>
                                To maximize your Facebook ad performance, ensure your selected categories contain products with high-quality images and accurate descriptions. 
                                The generated XML feed will automatically sync with your Facebook Commerce Manager.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
