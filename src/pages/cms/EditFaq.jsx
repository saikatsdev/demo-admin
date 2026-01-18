import useTitle from "../../hooks/useTitle"

import { Input as AntInput, Breadcrumb, Button, Form, Select,message } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import { useEffect } from "react";

export default function EditFaq() {
    // Hook
    useTitle("Edit FAQ");

    const navigate = useNavigate();
    const {id}     = useParams();

    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // Method
    useEffect(() => {
        const getFaq = async () => {
            const res = await getDatas(`/admin/faqs/${id}`);

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    question: data.question,
                    answer: data.answer,
                    status: data.status,
                });
            }
        }

        getFaq();
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('question', values.question);
        formData.append('answer', values.answer);
        formData.append('status', values.status);
        formData.append('_method', "PUT");

        const res = await postData(`/admin/faqs/${id}`, formData);

        messageApi.open({
            type: "success",
            content: res.msg,
        });

        setTimeout(() => {
            navigate("/faqs");
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
                    <h1 className="title">Edit FAQ</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit FAQ" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <h2 style={{ textAlign: "center", color: "#000", fontSize: "2rem" }}>
                    Create FAQ
                </h2>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item name="question" label="Question" rules={[{ required: true }]}>
                            <AntInput placeholder="Enter question" />
                        </Form.Item>

                        <Form.Item label="Answer" name="answer">
                            <ReactQuill theme="snow" placeholder="Write answer..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                        </Form.Item>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                        </Form.Item>

                        <div style={{marginTop:"40px"}}>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Update Faq
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    )
}
