import { useEffect, useState } from 'react'
import useTitle from '../../hooks/useTitle'
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getDatas, postData } from '../../api/common/common';

import { Input as AntInput, Breadcrumb, Button, Form, message, Row, Select } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function EditShippingPolicy() {
    // Hook
    useTitle("Edit Shipping Policy");

    // Variable
    const {id} = useParams();
    const navigate = useNavigate();

    // State
    const [form]                      = Form.useForm();
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Method
    useEffect(() => {
        const getPrivacy = async () => {
            const res = await getDatas(`/admin/shipping/policy/${id}`);

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    title:data.title,
                    description:data.description,
                });
            }
        }

        getPrivacy();
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('_method', 'PUT');

        try {
            setLoading(true);
            const res = await postData(`/admin/shipping/policy/${id}`, formData);

            messageApi.open({
                type: "success",
                content: res.msg,
            });

            setTimeout(() => {
                navigate("/shipping-policy");
            }, 400);
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

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

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Update Shipping Policy</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Update Shipping Policy" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <h2 style={{ textAlign: "center", color: "#000", fontSize: "2rem" }}>
                    Update Shipping Policy
                </h2>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item label="Title" name="title">
                            <AntInput placeholder="Enter title" />
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <ReactQuill theme="snow" placeholder="Write description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                {loading ? "Updating.." : "Update"}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
