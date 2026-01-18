import useTitle from "../../../hooks/useTitle"
import { ArrowLeftOutlined  } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message,} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { postData } from "../../../api/common/common";

export default function AddBlockUser() {
    // Hook
    useTitle("Add Block User");

    // Variable
    const navigate = useNavigate();

    // State
    const [loading, setLoading]                 = useState(false);
    const [form]                                = Form.useForm();
    const [messageApi, contextHolder]           = message.useMessage();

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('is_block', values.is_block ? 1 : 0);
        formData.append('is_permanent_block', values.is_permanent_block ? 1 : 0);
        formData.append('is_permanent_unblock', 1);

        formData.append('phone_number', values.phone_number);
        if (values.ip_address) formData.append('ip_address', values.ip_address);
        
        try {
            setLoading(true);
            const res = await postData("/admin/block-users", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/block-users");
                }, 400);
            }
        } catch (error) {
            console.log("Something went wrong", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Block User</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Block User" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Block</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{width:450, height:450}}>
                        <Form.Item label="Phone Number" name="phone_number" required={true}>
                            <AntInput placeholder="Enter phone number" />
                        </Form.Item>

                        <Form.Item label="IP Address" name="ip_address">
                            <AntInput placeholder="Enter ip address" />
                        </Form.Item>

                        <Form.Item name="is_block" label="Block" rules={[{ required: true }]}>
                            <Select options={[{ value: "1", label: "Yes" },{ value: "0", label: "no" }]} placeholder="Select Any"/>
                        </Form.Item>

                        <Form.Item name="is_permanent_block" label="Permanent Block" rules={[{ required: true }]}>
                            <Select options={[{ value: "1", label: "Yes" },{ value: "0", label: "no" }]} placeholder="Select Any"/>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                {loading ? "Submiting..." : "Submit"}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
