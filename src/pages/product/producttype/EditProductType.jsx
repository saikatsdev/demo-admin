import useTitle from "../../../hooks/useTitle";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message,Select } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";

export default function EditProductType() {
    // Hook
    useTitle("Edit Product Type");

    // Variable
    const {id} = useParams();
    const navigate = useNavigate();

    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(false);

    // Method
    useEffect(() => {
        const getType = async () => {
            const res = await getDatas(`/admin/product-types/${id}`);

            if (res && res.success) {
                const data = res.result || {};

                form.setFieldsValue({
                    name: data.name,
                    status: data.status,
                });
            }
        };

        getType();
    }, [id, form]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('status', values.status);

        formData.append("_method", "PUT");

        try {
            setLoading(true);

            const res = await postData(`/admin/product-types/${id}`, formData);
            
            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/product-types");
                }, 300);
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
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
                    <h1 className="title">Edit Product Type</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Product Type" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Edi Product Type</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item label="Name" name="name">
                            <AntInput placeholder="Enter name" />
                        </Form.Item>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                Update
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
