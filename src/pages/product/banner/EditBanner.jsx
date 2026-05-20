import { ArrowLeftOutlined, InfoCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message, Space, Card, Row, Col, Typography, Divider } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

import "./css/section-banner.css";
import ImagePicker from "../../../components/image/ImagePicker";

const { Text } = Typography;

const DEVICE_SIZES = {
    desktop: { width: 4360, height: 1826 },
    tablet:  { width: 1040, height: 540 },
    mobile:  { width: 480, height: 220 },
};

export default function EditBanner() {
    // Hook
    useTitle("Edit Section Banner");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();

    // State
    const [messageApi, contextHolder]   = message.useMessage();
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [fetching, setFetching]       = useState(true);
    const [gallery, setGallery]         = useState([]);
    const [sections, setSections]       = useState([]);

    // Method
    useEffect(() => {
        fetchMedia(page);
        fetchSections();
    }, []);

    const fetchSections = async () => {
        const res = await getDatas("/admin/sections/list");
        if(res && res?.success){
            const mapped = (res.result || []).map(item => ({value: item.id, label: item.title}));
            setSections(mapped);
        }
    }

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

    useEffect(() => {
        let isAlive = true;
        const getData = async () => {
            try {
                setFetching(true);
                const res = await getDatas(`/admin/banners/${id}`);
                if(!isAlive) return;

                if(res?.success){
                    const banner = res?.result;
                    const size = DEVICE_SIZES[banner.device_type] || {};

                    const imageFileList = banner.image
                        ? [
                            {
                                uid: "-1",
                                name: "banner.png",
                                status: "done",            
                                url: banner.image,
                            },
                        ]
                        : [];

                    form.setFieldsValue({
                        section_id : banner.section_id,
                        title      : banner.title,
                        device_type: banner.device_type,
                        type       : banner.type,
                        link       : banner.link,
                        description: banner.description,
                        status     : banner.status,
                        image      : imageFileList,
                        width      : banner.width  || size.width  || "",
                        height     : banner.height || size.height || "",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch banner:", error);
                message.error("Failed to load banner details");
            } finally {
                setFetching(false);
            }
        }
        getData();
        return () => { isAlive = false; }
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('section_id', values.section_id);
        formData.append('device_type', values.device_type);
        formData.append('type', values.type);
        formData.append('link', values.link);
        formData.append("status", values.status);
        formData.append("description", values.description);
        formData.append('_method', "PUT");

        const image = values.image?.[0];
        if (image) {
            if (image.originFileObj) {
                formData.append('image', image.originFileObj);
            } else if (image.isFromGallery) {
                formData.append('image', image.galleryPath);
            }
        }

        try {
            setLoading(true);
            const res = await postData(`/admin/banners/${id}`, formData);

            if(res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                navigate("/section-list", {
                    state: {viewType: "banner"},
                });
            }
        } catch (error) {
            console.log(error);
            message.error("Failed to update banner");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="section-banner-container">
            {contextHolder}
            <div className="section-banner-header">
                <div className="section-banner-title">
                    <h1>Edit Section Banner</h1>
                    <p>Modify existing banner configuration and media.</p>
                </div>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="btn-secondary">
                        Back
                    </Button>
                </Space>
            </div>

            <Breadcrumb
                style={{ marginBottom: 24 }}
                items={[
                    { title: <Link to="/dashboard">Dashboard</Link> },
                    { title: "Banners" },
                    { title: "Edit Banner" },
                ]}
            />

            <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSubmit} 
                onValuesChange={(changed) => {
                    if (changed.device_type) {
                        const size = DEVICE_SIZES[changed.device_type];
                        if (size) form.setFieldsValue(size);
                    }
                }}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card className="banner-card" title="Banner Information" loading={fetching}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="title" label="Banner Title" rules={[{ required: true, message: 'Please enter banner title' }]}>
                                        <AntInput size="large" placeholder="e.g. Summer Collection 2024" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="section_id" label="Target Section" rules={[{ required: true, message: 'Select a section' }]}>
                                        <Select size="large" options={sections} placeholder="Select Section"/>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="type" label="Banner Type" rules={[{ required: true }]}>
                                        <Select size="large" options={[{ value: "1", label: 'Feature Banner' }, { value: "0", label: 'Standard Banner' }]} placeholder="Select Type"/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="link" label="Redirect Link" rules={[{ required: true, message: 'Redirect link is required' }]}>
                                        <AntInput size="large" placeholder="https://example.com/collection" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="description" label="Short Description" rules={[{ required: true, message: "Description is required" }]}>
                                        <AntInput.TextArea rows={4} placeholder="Describe the banner purpose or content..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card className="banner-card" title="Display Media" style={{ marginBottom: 24 }} loading={fetching}>
                            <div className="media-upload-section">
                                <Form.Item name="image" rules={[{ required: true, message: 'Banner image is required' }]}>
                                    <ImagePicker 
                                        gallery={gallery} 
                                        hasMore={hasMore} 
                                        loadingMore={loadingMore} 
                                        fetchMore={() => fetchMedia(page + 1)}
                                    />
                                </Form.Item>
                                <Text type="secondary" size="small">
                                    <InfoCircleOutlined /> Recommended size: 
                                    <b> {form.getFieldValue('width')}x{form.getFieldValue('height')}px</b>
                                </Text>
                            </div>
                        </Card>

                        <Card className="banner-card" title="Settings" loading={fetching}>
                            <Form.Item name="device_type" label="Target Device">
                                <Select 
                                    size="large"
                                    options={[
                                        {value: "desktop", label: 'Desktop'},
                                        {value: "tablet", label: 'Tablet'},
                                        {value: "mobile", label: 'Mobile'}
                                    ]} 
                                />
                            </Form.Item>

                            <div className="form-field-group">
                                <span className="form-field-group-title">Custom Dimensions (px)</span>
                                <Row gutter={10}>
                                    <Col span={12}>
                                        <Form.Item name="width" label="Width" rules={[{ required: true }]}>
                                            <AntInput placeholder="W" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="height" label="Height" rules={[{ required: true }]}>
                                            <AntInput placeholder="H" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <Form.Item name="status" label="Visibility Status">
                                <Select size="large" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                            </Form.Item>

                            <Divider />

                            <Form.Item style={{margin: 0}}>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    block 
                                    size="large" 
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    style={{height: '50px', borderRadius: '8px', fontWeight: '600'}}
                                >
                                    {loading ? "Updating..." : "Update Banner"}
                                </Button>
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
