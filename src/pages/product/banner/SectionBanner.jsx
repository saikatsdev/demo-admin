import {ArrowLeftOutlined  } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message,Space } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

import "./css/section-banner.css";
import ImagePicker from "../../../components/image/ImagePicker";

const DEVICE_SIZES = {
    desktop: { width: 4360, height: 1826 },
    tablet:  { width: 1040, height: 540 },
    mobile:  { width: 480, height: 220 },
};

export default function SectionBanner() {
    // Hook
    useTitle("Add Section Banner");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // State
    const [messageApi, contextHolder]   = message.useMessage();
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading]         = useState(false);
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
            const mapped = (res.result || []).map(item => ({value: item.id,label: item.title}));

            setSections(mapped);
        }
    }

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

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('section_id', values.section_id);
        formData.append('title', values.title);
        formData.append('device_type', values.device_type);
        formData.append('type', values.type);
        formData.append('link', values.link);
        formData.append("status", values.status);
        formData.append("description", values.description);
        formData.append('link', values.link);

        formData.append('width', values.width);
        formData.append('height', values.height);

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
            const res = await postData("/admin/banners", formData);

            if(res?.success){
                form.resetFields();
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
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Section Banner</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Section Banner" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div></div>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <div className="section-banner-wrapper">
                <div className="section-banner-form">
                    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{width:4360, height:1826, device_type:"desktop"}} onValuesChange={(changed) => {
                        if (changed.device_type) {
                            const size = DEVICE_SIZES[changed.device_type];
                            form.setFieldsValue(size);
                        }
                    }}>
                        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                            <AntInput placeholder="Enter title" />
                        </Form.Item>

                        <Form.Item name="section_id" label="Section" rules={[{ required: true }]}>
                            <Select options={sections} placeholder="Select Section"/>
                        </Form.Item>

                        <Form.Item name="device_type" label="Device Type" rules={[{ required: true }]}>
                            <Select options={[{ value: "desktop", label: 'Desktop' }, { value: "tablet", label: 'Tablet' },{ value: "mobile", label: 'Mobile' }]} placeholder="Select Device"/>
                        </Form.Item>

                        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                            <Select options={[{ value: 1, label: 'Yes' }, { value: 0, label: 'No' }]} placeholder="Select Type"/>
                        </Form.Item>

                        <Form.Item name="link" label="Link" rules={[{ required: true }]}>
                            <AntInput placeholder="Enter link" />
                        </Form.Item>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                        </Form.Item>

                        <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
                            <AntInput.TextArea placeholder="Enter description..." />
                        </Form.Item>

                        <ImagePicker form={form} name="image" label="Image" gallery={gallery}  hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)}/>

                        <div style={{display:"flex", gap:"10px"}}>
                            <Form.Item name="width" label="Width" rules={[{ required: true }]}>
                                <AntInput placeholder="Enter width" />
                            </Form.Item>

                            <Form.Item name="height" label="Height" rules={[{ required: true }]}>
                                <AntInput placeholder="Enter height" />
                            </Form.Item>
                        </div>

                        <Form.Item style={{textAlign:"right"}}>
                            <Button type="primary" htmlType="submit">
                                {loading ? "Creating..." : "Create Section Banner"}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
