import useTitle from "../../../hooks/useTitle"

import { ArrowLeftOutlined } from "@ant-design/icons";
import { PlusOutlined } from '@ant-design/icons';
import { Input as AntInput, Breadcrumb, Button, Form, message, Upload } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../../api/common/common";

export default function AddAbout() {
    // Hook
    useTitle("Add About");

    const normFile = e => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const navigate = useNavigate();

    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('width', values.width);
        formData.append('height', values.height);

        if (values.image && values.image.length > 0) {
            const file = values.image[0];
            if (file.originFileObj) {
                formData.append("image", file.originFileObj);
            }
        }

        const res = await postData("/admin/abouts", formData, {headers:{ "Content-Type": "multipart/form-data" }});

        messageApi.open({
            type: "success",
            content: res.msg,
        });

        setTimeout(() => {
            navigate("/about");
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
                    <h1 className="title">Add About</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add About" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Create About</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item label="Title" name="title">
                            <AntInput placeholder="Enter title" />
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <ReactQuill theme="snow" placeholder="Write description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                        </Form.Item>

                        <Form.Item label="Upload" valuePropName="fileList" getValueFromEvent={normFile} name="image">
                            <Upload beforeUpload={() => false} listType="picture-card">
                                <button style={{ color: 'inherit', cursor: 'inherit', border: 0, background: 'none' }} type="button">
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </button>
                            </Upload>
                        </Form.Item>

                        <div style={{display:"flex", justifyContent:"space-between"}}>
                            <Form.Item label="Width" name="width">
                                <AntInput placeholder="Enter width" />
                            </Form.Item>

                            <Form.Item label="Height" name="height">
                                <AntInput placeholder="Enter height" />
                            </Form.Item>
                        </div>

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
