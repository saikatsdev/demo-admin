import { ArrowLeftOutlined, CloudUploadOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const DEVICE_SIZES = {
    desktop: { width: 4360, height: 1826 },
    tablet:  { width: 1040, height: 540 },
    mobile:  { width: 480, height: 220 },
};

export default function AddSlider() {
    // Hooks
    useTitle("Add Slider");

    // Variable
    const navigate = useNavigate();

    // State
    const [image, setImage]           = useState(null);
    const [loading, setLoading]       = useState(false);
    const [imageFile, setImageFile]   = useState(null);
    const [form]                                = Form.useForm();
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

    const onFinish = async (values) => {
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("status", values.status);
            formData.append("type", values.type);
            formData.append("width", values.width);
            formData.append("height", values.height);

            if (imageFile) {
                formData.append("image", imageFile);
            }

            try {
                setLoading(true);
                const res = await postData("/admin/sliders", formData, { headers: { "Content-Type": "multipart/form-data", },});

                if(res && res.success){
                    messageApi.open({
                        type: "success",
                        content: res.msg,
                    });

                    navigate("/sliders");
                }
            } catch (error) {
                console.log(error);
            }finally{
                setLoading(false);
            }
        } catch (error) {
            console.error("Error adding slider:", error);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Home Sliders</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Home Sliders" },
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
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{width:4360, height:1826, type:"desktop"}} onValuesChange={(changed) => {
                    if (changed.type) {
                        const size = DEVICE_SIZES[changed.type];
                        form.setFieldsValue(size);
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
                            <Form.Item label="Home Slider Title" name="title">
                                <AntInput placeholder="Enter your title..." />
                            </Form.Item>

                            <Form.Item name="status" label="Home Slider Status" rules={[{ required: true, message: "Please select a status" }]} initialValue={"active"}>
                                <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                            </Form.Item>

                            <Form.Item name="type" label="Slider Type" rules={[{ required: true }]} initialValue="1">
                                <Select options={[{value:'1', label: 'Select Type', disabled: true},{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' },{ value: 'mobile', label: 'Mobile' }]} />
                            </Form.Item>

                            <div style={{display:"flex"}}>
                                <div style={{width:"50%", marginRight:"5px"}}>
                                    <Form.Item label="Slider Width" name="width">
                                        <AntInput placeholder="Enter width..."/>
                                    </Form.Item>
                                </div>

                                <div style={{width:"50%"}}>
                                    <Form.Item label="Slider Height" name="height">
                                        <AntInput placeholder="Enter height..."/>
                                    </Form.Item>
                                </div>
                            </div>

                            <div style={{textAlign:"right"}}>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading}>
                                        {loading ? "Creating..." : "Add Slider"}
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
