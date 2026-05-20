import { useState, useEffect } from "react";
import useTitle from "../../../hooks/useTitle";
import { ArrowLeftOutlined, InfoCircleOutlined, PictureOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Row, Col, Space, Typography, message, Spin } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { postData, getDatas } from "../../../api/common/common";
import ImagePicker from "../../../components/image/ImagePicker";
import "./About.css";

const { Text, Title } = Typography;

export default function EditAbout() {
    // Hook
    useTitle("Edit About");

    const { id } = useParams();
    const navigate = useNavigate();

    // Form Instance & Messages
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // States
    const [loading, setLoading]         = useState(false);
    const [fetching, setFetching]       = useState(true);
    
    // Gallery States
    const [gallery, setGallery]         = useState([]);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch Gallery Media
    useEffect(() => {
        fetchMedia(page);
    }, []);

    const fetchMedia = async (pageNumber = 1) => {
        try {
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
            setLoadingMore(false);
        }
    };

    // Fetch Existing About Data
    useEffect(() => {
        let isAlive = true;

        const fetchAboutData = async () => {
            try {
                setFetching(true);
                const res = await getDatas(`/admin/abouts/${id}`);

                if (isAlive && res && res.success) {
                    const data = res.result || {};

                    form.setFieldsValue({
                        title: data.title,
                        description: data.description,
                        width: data.width || 800,
                        height: data.height || 800,
                        image: data.image
                            ? [
                                {
                                    uid: "-1",
                                    name: "existing.png",
                                    status: "done",
                                    url: data.image,
                                }
                            ]
                            : [],
                    });
                }
            } catch (error) {
                console.error("Error fetching about entry:", error);
                message.error("Failed to load About entry data");
            } finally {
                if (isAlive) setFetching(false);
            }
        };

        fetchAboutData();

        return () => {
            isAlive = false;
        };
    }, [id, form]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append('title', values.title || "");
            formData.append('description', values.description || "");
            formData.append('width', values.width || 800);
            formData.append('height', values.height || 800);
            formData.append('_method', 'PUT');

            const imageValue = values.image;
            if (imageValue && imageValue.length > 0) {
                const imgObj = imageValue[0];
                if (imgObj.isFromGallery) {
                    formData.append("image", imgObj.galleryPath);
                } else if (imgObj.originFileObj) {
                    formData.append("image", imgObj.originFileObj);
                }
            }

            const res = await postData(`/admin/abouts/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res && res.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "About entry updated successfully",
                    duration: 3
                });

                setTimeout(() => {
                    navigate("/about");
                }, 400);
            } else {
                messageApi.open({
                    type: "error",
                    content: res?.message || "Failed to update About entry",
                });
            }
        } catch (error) {
            console.error("Error updating About entry:", error);
            messageApi.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ReactQuill custom toolbar modules
    const modules = {
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
    };

    if (fetching) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" tip="Loading about page data..." />
            </div>
        );
    }

    return (
        <div className="about-container">
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Edit About</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/about">About Pages</Link> },
                            { title: "Edit About" },
                        ]}
                    />
                </div>
                <Button className="premium-back-btn" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back to List
                </Button>
            </div>

            <div className="premium-card">
                <div className="card-content">
                    <Form form={form} layout="vertical" onFinish={handleSubmit} className="premium-form" initialValues={{width:800, height:800}}>
                        <div className="form-grid">
                            <div className="upload-section">
                                <div className="upload-title-badge">
                                    <PictureOutlined style={{ color: '#6366f1' }} />
                                    <span>About Showcase Image</span>
                                </div>

                                <Form.Item name="image" rules={[{ required: true, message: "Please select/upload an image" }]} style={{ marginBottom: 8 }}>
                                    <ImagePicker gallery={gallery} hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)} onUploadSuccess={(newItems) => setGallery(prev => [...newItems, ...prev])}/>
                                </Form.Item>

                                <div className="size-info-badge">
                                    <div className="badge-dot" />
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        Supports JPG, PNG, WEBP (Max 2MB)
                                    </Text>
                                </div>

                                <div className="dimensions-wrapper">
                                    <Space style={{ marginBottom: 12 }}>
                                        <InfoCircleOutlined style={{ color: '#6366f1' }} />
                                        <Text strong style={{ fontSize: '13px' }}>Image Dimension (Optional)</Text>
                                    </Space>
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item label="Width (px)" name="width" style={{ marginBottom: 0 }}>
                                                <AntInput className="premium-input" placeholder="e.g. 800" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Height (px)" name="height" style={{ marginBottom: 0 }}>
                                                <AntInput className="premium-input" placeholder="e.g. 600" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            </div>

                            <div className="form-details-section">
                                <Form.Item label="About Title" name="title" rules={[{ required: true, message: "Please enter a title" }]}>
                                    <AntInput className="premium-input" placeholder="e.g. Who We Are & Our Vision" />
                                </Form.Item>

                                <Form.Item label="About Description" name="description" rules={[{ required: true, message: "Please write a description" }]}>
                                    <ReactQuill className="premium-quill" theme="snow" placeholder="Write detailed description here..." modules={modules} />
                                </Form.Item>

                                <div className="submit-section">
                                    <Button type="primary" htmlType="submit" loading={loading} className="premium-submit-btn" block>
                                        {loading ? "SAVING CHANGES..." : "UPDATE ABOUT PAGE"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}
