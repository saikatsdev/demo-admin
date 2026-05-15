import { Input as AntInput, Breadcrumb, Button, Col, Form, Row, Select, Upload, message, Card, Space, Divider, Typography, ConfigProvider, theme, Tooltip } from "antd";
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, PictureOutlined, SearchOutlined, SettingOutlined, InfoCircleOutlined, InboxOutlined } from "@ant-design/icons";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function AddBlog() {
    // Hook
    useTitle("Add Blog Post");
    const { token } = theme.useToken();
    const navigate = useNavigate();

    // State
    const [form]                      = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]       = useState(false);
    const [tags, setTags]             = useState([]);
    const [fileList, setFileList]     = useState([]);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [catRes, tagRes] = await Promise.all([
                    getDatas("/admin/blog-post-categories"),
                    getDatas("/admin/tags")
                ]);

                if (isMounted) {
                    setCategories(catRes?.result?.data || []);
                    setTags(tagRes?.result?.data || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    const modules = {
        toolbar: {
            container: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ align: [] }],
                ["blockquote", "code-block"],
                ["link", "image"],
                ["clean"],
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
    };

    const handleSubmit = async (values) => {
        const formData = new FormData();

        Object.keys(values).forEach((key) => {
            if (!["image", "tag_ids"].includes(key) && values[key] !== undefined) {
                formData.append(key, values[key]);
            }
        });

        if (values.tag_ids) {
            values.tag_ids.forEach((tagId) => {
                formData.append("tag_ids[]", tagId);
            });
        }

        const imageFile = fileList[0]?.originFileObj;
        if (imageFile) {
            formData.append("image", imageFile);
        }

        setLoading(true);

        try {
            const res = await postData("/admin/blog-posts", formData);

            if(res && res?.success){
                messageApi.success(res.msg || "Blog post created successfully");
                setTimeout(() => {
                    navigate("/blogs");
                }, 1000);
            } else {
                messageApi.error(res?.msg || "Failed to create blog post");
            }
        } catch (error) {
            console.error(error);
            messageApi.error("An error occurred while submitting the form");
        } finally{
            setLoading(false);
        }
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    borderRadius: 12,
                    colorPrimary: "#4f46e5",
                },
                components: {
                    Card: {
                        headerBg: "rgba(255, 255, 255, 0.8)",
                    },
                    Button: {
                        borderRadius: 8,
                        fontWeight: 500,
                    }
                },
            }}
        >
            {contextHolder}
            <div style={{ padding: "0 24px 40px", maxWidth: "1600px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh" }}>
                
                <div style={{ 
                    display       : "flex",
                    justifyContent: "space-between",
                    alignItems    : "center",
                    padding       : "24px 0",
                    background    : "transparent",
                    borderBottom  : "1px solid #e2e8f0",
                    marginBottom  : "32px"
                }}>
                    <Space direction="vertical" size={0}>
                        <Breadcrumb
                            items={[
                                { title: <Link to="/dashboard" style={{ color: "#64748b" }}>Dashboard</Link> },
                                { title: <Link to="/blogs" style={{ color: "#64748b" }}>Blogs</Link> },
                                { title: <span style={{ color: "#1e293b", fontWeight: 500 }}>Create Post</span> },
                            ]}
                        />
                        <Title level={2} style={{ margin: "8px 0 0 0", color: "#0f172a", fontWeight: 700 }}>Add New Article</Title>
                    </Space>
                    <Space size="middle">
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/blogs")} style={{ borderRadius: "8px" }}>
                            Back to List
                        </Button>

                        <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => form.submit()}> 
                            Publish Now
                        </Button>
                    </Space>
                </div>

                <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{ status: "active", width: 1920, height: 720 }} requiredMark="optional">
                    <Row gutter={[32, 32]}>
                        <Col xs={24} lg={16}>
                            <Space direction="vertical" size={32} style={{ width: "100%" }}>
                                
                                <Card title={<Space><FileTextOutlined style={{ color: "#4f46e5" }} /><span>Article Details</span></Space>}
                                    bordered={false}
                                    style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                                >
                                    <Form.Item label="Article Title" name="title" rules={[{ required: true, message: "A title is required to publish" }]}>
                                        <AntInput size="large" placeholder="Enter a catchy title..." style={{ fontSize: "1.1rem", padding: "12px 16px" }}/>
                                    </Form.Item>

                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item label="Category" name="category_id" rules={[{ required: true, message: "Please select a category" }]}>
                                                <Select size="large" placeholder="Select Category" options={categories.map((cat) => ({value: cat.id, label: cat.name}))} style={{ width: "100%" }}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Tags" name="tag_ids">
                                                <Select mode="multiple" size="large" placeholder="Add tags (SEO)" options={tags.map((tag) => ({value: tag.id, label: tag.name}))}/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                <Card 
                                    title={
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                            <Space><FileTextOutlined style={{ color: "#4f46e5" }} /><span>Content Editor</span></Space>
                                            <Tooltip title="Formatting tools help make your content more readable.">
                                                <InfoCircleOutlined style={{ color: "#94a3b8" }} />
                                            </Tooltip>
                                        </div>
                                    }
                                    bordered={false}
                                    style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                                >
                                    <Form.Item name="description" rules={[{ required: true, message: "Content cannot be empty" }]}>
                                        <ReactQuill theme="snow" modules={modules} placeholder="Begin your masterpiece here..." style={{ height: "500px", marginBottom: "60px" }}/>
                                    </Form.Item>
                                </Card>
                            </Space>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Space direction="vertical" size={32} style={{ width: "100%" }}>
                                
                                <Card title={<Space><SettingOutlined style={{ color: "#4f46e5" }} /><span>Publishing</span></Space>}
                                    bordered={false}
                                    style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                                >
                                    <Form.Item label="Post Status" name="status" style={{ marginBottom: "16px" }}>
                                        <Select 
                                            size="large"
                                            options={[
                                                { value: "active", label: "🟢 Active (Live)" },
                                                { value: "inactive", label: "🔴 Inactive (Draft)" }
                                            ]}
                                        />
                                    </Form.Item>
                                    
                                    <Divider style={{ margin: "16px 0" }} />
                                    
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <Text type="secondary">Word Count:</Text>
                                            <Text strong>Calculated on save</Text>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <Text type="secondary">Reading Time:</Text>
                                            <Text strong>~0 min</Text>
                                        </div>
                                    </div>
                                    
                                    <Button type="primary" block loading={loading} onClick={() => form.submit()}>
                                        Save Changes
                                    </Button>
                                </Card>

                                <Card title={<Space><PictureOutlined style={{ color: "#4f46e5" }} /><span>Featured Image</span></Space>}
                                    bordered={false}
                                    style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                                >
                                    <Form.Item name="image">
                                        <Dragger 
                                            maxCount={1} 
                                            beforeUpload={() => false} 
                                            fileList={fileList}  
                                            onChange={({ fileList }) => setFileList(fileList)}
                                            showUploadList={false}
                                            style={{ 
                                                background: "#f8fafc", 
                                                border: "2px dashed #e2e8f0",
                                                padding: fileList.length > 0 ? "0" : "20px",
                                                overflow: "hidden",
                                                height: "220px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            {fileList.length > 0 ? (
                                                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                                    <img 
                                                        src={fileList[0].url || (fileList[0].originFileObj ? URL.createObjectURL(fileList[0].originFileObj) : "")} 
                                                        alt="Preview" 
                                                        style={{ width: "100%", height: "220px", objectFit: "cover" }} 
                                                    />
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        background: "rgba(0,0,0,0.4)",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        opacity: 0,
                                                        transition: "opacity 0.3s",
                                                        color: "#white"
                                                    }}
                                                    className="upload-overlay"
                                                    >
                                                        <PictureOutlined style={{ fontSize: "24px", color: "#fff" }} />
                                                        <Text style={{ color: "#fff", marginTop: "8px" }}>Change Image</Text>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="ant-upload-drag-icon">
                                                        <InboxOutlined style={{ color: "#4f46e5" }} />
                                                    </p>
                                                    <p className="ant-upload-text">Click or drag image to this area</p>
                                                    <p className="ant-upload-hint">Support for a single upload. Max 2MB.</p>
                                                </>
                                            )}
                                        </Dragger>
                                    </Form.Item>
                                    
                                    <Divider plain><Text type="secondary" style={{ fontSize: "12px" }}>Dimensions (Optional)</Text></Divider>
                                    
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item label="Width" name="width">
                                                <AntInput placeholder="1920" suffix="px" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Height" name="height">
                                                <AntInput placeholder="720" suffix="px" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                <Card title={<Space><SearchOutlined style={{ color: "#4f46e5" }} /><span>SEO Meta Data</span></Space>}
                                    bordered={false}
                                    style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}
                                >
                                    <Form.Item label="Meta Title" name="meta_title" tooltip="Overrides the main title in search results.">
                                        <AntInput placeholder="SEO Title..." />
                                    </Form.Item>

                                    <Form.Item label="Meta Description" name="meta_description" tooltip="Summary shown in Google search results.">
                                        <AntInput.TextArea rows={3} placeholder="Write a brief summary..." />
                                    </Form.Item>
                                    
                                    <Form.Item label="Meta Keywords" name="meta_tag">
                                        <AntInput placeholder="e.g. tech, health, lifestyle" />
                                    </Form.Item>
                                </Card>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </div>

            <style>{`
                .ql-container {
                    border-bottom-left-radius: 12px !important;
                    border-bottom-right-radius: 12px !important;
                    border: 1px solid #e2e8f0 !important;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 16px !important;
                }
                .ql-toolbar {
                    border-top-left-radius: 12px !important;
                    border-top-right-radius: 12px !important;
                    border: 1px solid #e2e8f0 !important;
                    background: #f8fafc !important;
                    padding: 12px !important;
                }
                .ql-editor {
                    min-height: 400px !important;
                    padding: 20px !important;
                }
                .ql-snow.ql-toolbar button, .ql-snow .ql-toolbar button {
                    width: 32px !important;
                    height: 32px !important;
                }
                .ant-card-head {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 0 24px !important;
                    min-height: 56px !important;
                }
                .ant-card-head-title {
                    font-weight: 600 !important;
                    font-size: 16px !important;
                    color: #334155 !important;
                }
                .ant-form-item-label label {
                    font-weight: 500 !important;
                    color: #64748b !important;
                    font-size: 14px !important;
                }
                .ant-upload-drag {
                    border-radius: 12px !important;
                }
                .ant-input, .ant-select-selector {
                    border-color: #e2e8f0 !important;
                }
                .ant-input:hover, .ant-select-selector:hover {
                    border-color: #4f46e5 !important;
                }
                .ant-upload-drag:hover .upload-overlay {
                    opacity: 1 !important;
                }
                .ant-breadcrumb-link {
                    color: #94a3b8 !important;
                }
                .ant-breadcrumb-link a {
                    color: #94a3b8 !important;
                }
                .ant-breadcrumb-link a:hover {
                    color: #4f46e5 !important;
                }
            `}</style>
        </ConfigProvider>
    );
}
