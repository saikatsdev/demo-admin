import useTitle from "../../../hooks/useTitle"

import { Input as AntInput, Breadcrumb, Button, Form, message } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect } from "react";

export default function EditContact() {
    // Hook
    useTitle("Edit Contact");

    // Variable
    const navigate = useNavigate();
    const {id} = useParams();

    // State
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // Method
    useEffect(() => {
        const getContact = async () => {
            const res = await getDatas(`/admin/contacts/${id}`);

            if(res && res?.success){
                const data = res?.result || [];
                form.setFieldsValue({
                    name:data.name,
                    phone_number:data.phone,
                    email:data.email,
                    description:data.description,
                });
            }
        }

        getContact();
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('phone', values.phone_number);
        formData.append('email', values.email);
        formData.append('description', values.description);
        formData.append('_method', 'PUT');

        const res = await postData(`/admin/contacts/${id}`, formData);

        messageApi.open({
            type: "success",
            content: res.msg,
        });

        setTimeout(() => {
            navigate("/contacts");
        }, 400);
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
                    <h1 className="title">Add Contact</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Contact" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <h2 style={{ textAlign: "center", color: "#000", fontSize: "2rem" }}>
                    Create Contact
                </h2>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item label="Name" name="name">
                            <AntInput placeholder="Enter name" />
                        </Form.Item>

                        <Form.Item label="Phone Number" name="phone_number">
                            <AntInput placeholder="Enter phone number" />
                        </Form.Item>

                        <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                            <AntInput placeholder="Enter Email" />
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <ReactQuill theme="snow" placeholder="Write description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                        </Form.Item>

                        <div style={{marginTop:"40px"}}>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Update
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    )
}
