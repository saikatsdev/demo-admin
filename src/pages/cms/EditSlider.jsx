import { ArrowLeftOutlined, CloudUploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const DEVICE_SIZES = {
    desktop: { width: 4360, height: 1826 },
    tablet:  { width: 1040, height: 540 },
    mobile:  { width: 480, height: 220 },
};

export default function EditSlider() {
    // Variable
    const {id} = useParams();

    // Hook
    useTitle("Edit Slider");

    // State
    const [loading, setLoading]     = useState(false);
    const [image, setImage]         = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [form]                    = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    //Method
    useEffect(() => {
        let isMounted = true;
        const fetchSlider = async () => {
            setLoading(true);
            const res = await getDatas(`/admin/sliders/${id}`);

            const list = res?.result || [];

            const size = DEVICE_SIZES[list.type] || {};

            if(isMounted && list){
                form.setFieldsValue({
                    title : list.title || "",
                    status: list.status || "",
                    type  : list.type || "",
                    width:  list.width  || size.width  || "",
                    height: list.height || size.height || "",
                });

                if (list.image) {
                    setImage(list.image);
                }
            }

            setLoading(false);
        }

        fetchSlider();

        return () => {
            isMounted = false;
        }
    }, [id, form]);

    const onFinish = async (values) => {
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("status", values.status);
        formData.append("type", values.type);
        formData.append("width", values.width);
        formData.append("height", values.height);
        formData.append('_method', 'PUT');

        if (imageFile) {
            formData.append("image", imageFile);
        }

        setLoading(true);
        const res = await postData(`/admin/sliders/${id}`, formData, {headers: {'Content-type': 'multipart/form-data'}});

        if(res?.success){
            setLoading(false);
            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Home Sliders</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Home Sliders" },
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

            <div className="slider-form-wrapper">
                <Form layout="vertical" onFinish={onFinish} form={form} onValuesChange={(changed) => {
                    if (changed.type) {
                        const size = DEVICE_SIZES[changed.type];
                        if (size) {
                            form.setFieldsValue(size);
                        }
                    }
                }}>
                    <div className="slider-form">
                        <div className="image-block">
                            <div className="image-card">
                                {image ? (
                                    <>
                                        <img src={image} alt="Uploaded" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />

                                        <button className="image-btn" onClick={() => setImage(null)}>
                                            ×
                                        </button>
                                    </>
                                ) : (
                                    <span>No image selected</span>
                                )}

                                <label htmlFor="file-upload">
                                    <CloudUploadOutlined />
                                    Upload
                                </label>

                                <input id="file-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange}/>
                            </div>
                        </div>
                        <div className="form-block">
                            <Form.Item name="title" label="Home Slider Title">
                                <AntInput placeholder="Enter your title..." />
                            </Form.Item>

                            <Form.Item name="status" label="Home Slider Status" rules={[{ required: true }]}>
                                <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                            </Form.Item>

                            <Form.Item name="type" label="Slider Type" rules={[{ required: true }]}>
                                <Select options={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' },{ value: 'mobile', label: 'Mobile' }]} />
                            </Form.Item>

                            <div style={{display:"flex"}}>
                                <div style={{width:"50%", marginRight:"5px"}}>
                                    <Form.Item name="width" label="Width">
                                        <AntInput placeholder="Enter width..." />
                                    </Form.Item>
                                </div>

                                <div style={{width:"50%"}}>
                                    <Form.Item name="height" label="Height">
                                        <AntInput placeholder="Enter height..." />
                                    </Form.Item>
                                </div>
                            </div>

                            <div style={{textAlign:"right"}}>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        {loading && (
                                            <LoadingOutlined />
                                        )}
                                        Update Slider
                                    </Button>
                                </Form.Item>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </>
    )
}
