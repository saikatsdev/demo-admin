import useTitle from "../../../hooks/useTitle"
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Select } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../../api/common/common";

export default function AddTermsCondition() {
    // Hook
    useTitle("Add Terms & Condition");

    // Variable
    const navigate = useNavigate();

    // State
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('status', values.status);

        const res = await postData("/admin/terms-and-conditions", formData);

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
                    <h1 className="title">Add Terms & Condition</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Terms & Condition" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Terms & Condition</h2>

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
