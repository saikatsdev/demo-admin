import {Input as AntInput,Breadcrumb,Button,Tag,Space,Table,Form,Modal, Select,message, Upload} from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { getDatas, postData } from "../../api/common/common";

const { Option } = Select;

export default function SEO() {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [messageApi, contextHolder]           = message.useMessage();
    const [seoData, setSeoData] = useState([]);
    const [filter, setFilter] = useState("all");
    const [editingData, setEditingData] = useState(null);

    useEffect(() => {
        let isMounted  = true;

        const fetchedSeoData = async () => {
            const res = await getDatas("/admin/seo");

            if(res && res?.success){
                if(isMounted){
                    setSeoData(res?.result?.data || []);
                }
            }
        }

        fetchedSeoData();

        return () => {
            isMounted = false;
        }
    }, []);

    const filteredData = seoData.filter((item) => filter === "all" ? true : item.status === filter);

    const columns = [
        {
            title: "Image",
            dataIndex: "img_path",
            key: "img_path",
            render: (img_path) => <img src={img_path} alt="seo" style={{ width: 50, height: 50, borderRadius: 5 }} />,
        },
        { 
            title: "Page", 
            dataIndex: "page", 
            key: "page"
        },
        { 
            title: "Seo Title", 
            dataIndex: "meta_title", 
            key: "meta_title" 
        },
        { 
            title: "Seo Description", 
            dataIndex: "meta_description", 
            key: "meta_description" 
        },
        { 
            title: "Seo Keywords", 
            dataIndex: "meta_keywords", 
            key: "meta_keywords",
            render: (meta_keywords) => {
                const keywords = typeof meta_keywords === "string" ? meta_keywords.split(",") : meta_keywords || [];
                return (
                <>
                    {keywords.map((keyword, index) => (
                        <Tag color="blue" key={index} style={{ marginBottom: 4 }}>
                            {keyword}
                        </Tag>
                    ))}
                </>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "published" ? "green" : status === "draft" ? "orange" : "red"} style={{ textTransform: "capitalize" }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => handleEdit(record)}>Edit</Button>
                    <Button danger size="small">Delete</Button>
                </Space>
            ),
        },
    ];

    const counts = {
        all: seoData.length,
        published: seoData.filter((i) => i.status === "published").length,
        draft: seoData.filter((i) => i.status === "draft").length,
    };

    const handleAdd = () => {
        setIsModalOpen(true);
        setEditMode(false);
        setEditingData(null);

        form.resetFields();
    }

    const handleEdit = (record) => {
        setIsModalOpen(true);
        setEditMode(true);
        setEditingData(record);
        
        form.setFieldsValue({
            page: record.page,
            meta_title: record.meta_title,
            meta_description: record.meta_description,
            meta_keywords: record.meta_keywords,
            status: record.status,
        });
    }

    const onClose = () => {
        setIsModalOpen(false);
    }

    const handleFinish = async (values) => {
        
        const formData = new FormData();

        formData.append("page", values.page);
        formData.append("meta_title", values.meta_title);
        formData.append("meta_description", values.meta_description);
        formData.append("meta_keywords", values.meta_keywords);
        formData.append("status", values.status);
        formData.append("width", values.width);
        formData.append("height", values.height);

        if (values.img_path && values.img_path.length > 0) {
            formData.append("img_path", values.img_path[0].originFileObj);
        }

        if(editMode) formData.append("_method", "PUT");

        try {
            setLoading(true);
            if(editMode){
                const res = await postData(`/admin/seo/${editingData.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

                if(res && res?.success){
                    messageApi.open({
                        type: "success",
                        content: res.msg,
                    });
                }
            }else{
                const res = await postData("/admin/seo", formData, { headers: { 'Content-Type': 'multipart/form-data' } });

                if(res && res?.success){
                    messageApi.open({
                        type: "success",
                        content: res.msg,
                    });
                }
            }

            const refreshedRes = await getDatas("/admin/seo");

            if(refreshedRes && refreshedRes.success){
                setSeoData(refreshedRes?.result?.data || []);
            }

            setIsModalOpen(false);
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
                    <h1 className="title" style={{ fontWeight: "600" }}>
                        Seo Pages
                    </h1>
                </div>
                <div className="head-actions">
                <Breadcrumb
                    items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Seo Pages" },
                    ]}
                />
                </div>
            </div>

            <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                    {["all", "published", "draft"].map((key) => (
                        <Button key={key} type={filter === key ? "primary" : "default"} style={{ marginRight: 8 }} onClick={() => setFilter(key)}>
                            {key.charAt(0).toUpperCase() + key.slice(1)} ({counts[key]})
                        </Button>
                    ))}
                    </div>
                    <Button type="primary" onClick={handleAdd}>+ Add SEO Page</Button>
                </div>
                <Table bordered loading={loading} columns={columns} dataSource={filteredData} rowKey="id"/>
            </div>

            <Modal title={editMode ? "Edit Seo Page" : "Add SEO Page"} open={isModalOpen} onCancel={() => {form.resetFields();onClose();}}
                footer={[
                    <Button key="cancel" onClick={() => onClose()}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                        {editMode ? "Edit Page" : "Add Page"}
                    </Button>,
                ]}
                >
                <Form form={form} layout="vertical" onFinish={handleFinish}  initialValues={{width:"1260", height:"960"}}>
                    <Form.Item label="SEO Page" name="page" rules={[{ required: true, message: "Please select SEO page type" }]}>
                        <Select placeholder="Select SEO Page">
                            <Option value="home">Home Page</Option>
                            <Option value="product">Product Page</Option>
                            <Option value="about">About Page</Option>
                            <Option value="product-details">Details Page</Option>
                            <Option value="contact">Contact Page</Option>
                            <Option value="privacy-policy">Privacy & Policy Page</Option>
                            <Option value="refund-policy">Refund Policy Page</Option>
                            <Option value="thank-you">Thank You Page</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="SEO Title" name="meta_title" rules={[{ required: true, message: "Please enter SEO title" }]}>
                        <AntInput placeholder="Enter SEO title" />
                    </Form.Item>

                    <Form.Item label="SEO Description" name="meta_description" rules={[{ required: true, message: "Please enter short description" }]}>
                        <AntInput.TextArea rows={3} placeholder="Enter seo description" />
                    </Form.Item>

                    <Form.Item label="SEO Keywords" name="meta_keywords" rules={[{ required: true, message: "Please enter keywords" }]}>
                        <AntInput placeholder="Enter keywords separated by comma" />
                    </Form.Item>

                    <Form.Item label="SEO Image" name="img_path" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)} rules={[{ required: false }]}>
                        <Upload name="img_path" listType="picture-card" maxCount={1} beforeUpload={() => false}>
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                    </Form.Item>

                    <div style={{display:"flex", justifyContent:"space-around"}}>
                        <Form.Item label="Width" name="width" rules={[{ required: true, message: "Please enter width" }]}>
                            <AntInput placeholder="Enter width" />
                        </Form.Item>

                        <Form.Item label="Height" name="height" rules={[{ required: true, message: "Please enter height" }]}>
                            <AntInput placeholder="Enter height" />
                        </Form.Item>
                    </div>

                    <Form.Item label="Status" name="status" rules={[{ required: true, message: "Please select status" }]}>
                        <Select placeholder="Select status">
                            <Option value="published">Published</Option>
                            <Option value="draft">Draft</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
