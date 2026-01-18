import { useEffect } from 'react'
import useTitle from '../../../hooks/useTitle'
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getDatas, postData } from '../../../api/common/common';
import { Input as AntInput, Breadcrumb, Button, Form, message, Select } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function EditTermsCondition() {
    // Hook
    useTitle("Edit Terms & Condition");

    // Variable
    const navigate = useNavigate();
    const {id}     = useParams();

    // State
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // Method
    useEffect(() => {
        const getPrivacy = async () => {
            const res = await getDatas(`/admin/terms-and-conditions/${id}`);

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    title:data.title,
                    description:data.description,
                    status:data.status,
                });
            }
        }

        getPrivacy();
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('status', values.status);
        formData.append('_method', 'PUT');

        const res = await postData(`/admin/terms-and-conditions/${id}`, formData);

        messageApi.open({
            type: "success",
            content: res.msg,
        });

        setTimeout(() => {
            navigate("/terms-and-conditions");
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
                    <h1 className="title">Update Terms & Condition</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Update Terms & Condition" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <h2 style={{ textAlign: "center", color: "#000", fontSize: "2rem" }}>
                    Update Terms & Condition
                </h2>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item label="Title" name="title">
                            <AntInput placeholder="Enter title" />
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <ReactQuill theme="snow" placeholder="Write description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                        </Form.Item>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
