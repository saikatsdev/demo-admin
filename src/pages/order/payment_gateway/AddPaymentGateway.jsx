
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Upload,Select,message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { postData } from "../../../api/common/common";
import { useState } from "react";

export default function AddPaymentGateway() {
    // Hook
    useTitle("Add Payment Gateway");

    const navigate = useNavigate();

    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(false);

    // Method
    const normFile = e => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('phone_number', values.phone_number);
        formData.append('status', values.status);

        if (values.image && values.image.length > 0) {
            const file = values.image[0];
            if (file.originFileObj) {
                formData.append("image", file.originFileObj);
            }
        }

        formData.append("width", values.width);
        formData.append("height", values.height);

        try {
            setLoading(true);

            const res = await postData("/admin/payment-gateways", formData);

            messageApi.open({
                type: "success",
                content: res.msg,
            });

            setTimeout(() => {
                navigate("/payment-gateways");
            }, 400);
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
                    <h1 className="title">Add Payment Gateway</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Payment Gateway" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Add Payment Gateway</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{width:1200, height:960}}>
                        <Form.Item name="name" label="GateWay Name" rules={[{ required: true }]}>
                            <AntInput placeholder="Enter Name" />
                        </Form.Item>

                        <Form.Item name="phone_number" label="Phone Number">
                            <AntInput placeholder="Enter Phone Number" />
                        </Form.Item>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                        </Form.Item>

                        <Form.Item label="Upload" name="image" valuePropName="fileList" getValueFromEvent={normFile}>
                            <Upload  beforeUpload={() => false} listType="picture-card">
                                <button style={{ color: 'inherit', cursor: 'inherit', border: 0, background: 'none' }} type="button">
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </button>
                            </Upload>
                        </Form.Item>

                        <div style={{display:"flex", alignItems:"center", gap:"16px",justifyContent:"space-between"}}>
                            <Form.Item name="width" label="Width" rules={[{ required: true }]}>
                                <AntInput placeholder="Enter Name" />
                            </Form.Item>

                            <Form.Item name="height" label="Height" rules={[{ required: true }]}>
                                <AntInput placeholder="Enter Height" />
                            </Form.Item>
                        </div>

                        <div style={{marginTop:"40px"}}>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    {loading ? "Submiting..." : "Submit"}
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    )
}
