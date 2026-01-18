import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Input as AntInput,
  Breadcrumb,
  Button,
  Form,
  Select,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import "./CategorySection.css";

export default function AddCategorySection() {
  // Hook
  useTitle("Add Category Section | Service Key");

  // Variable
  const [form] = Form.useForm();

  // State
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

  // Method
  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: "",
        link: "",
        width: "",
        height: "",
        fileList: [],
      },
    ]);
  };

  // Remove a section by ID
  const handleRemoveSection = (id) => {
    setSections((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchedCategories = async () => {
      const res = await getDatas("/admin/categories");

      const list = res?.result?.data || [];

      if (isMounted) {
        setCategories(list);
      }
    };

    fetchedCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("position", values.position);
      formData.append("status", values.status);
      formData.append("link", values.link || "");

      const sections = values.sections || [];

      sections.forEach((section, index) => {
        formData.append(`items[${index}][category_id]`, section.category);
        formData.append(`items[${index}][link]`, section.link || "");
        formData.append(`items[${index}][width]`, section.width || "");
        formData.append(`items[${index}][height]`, section.height || "");

        if (section.fileList?.length) {
          formData.append(
            `items[${index}][image]`,
            section.fileList[0].originFileObj
          );
        }
      });

      const res = await postData("/admin/category-sections", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.success) {
        messageApi.open({
          type: "success",
          content: res.msg,
        });

        form.resetFields();
      }
    } catch (error) {
      console.error(error);
      messageApi.open({
        type: "error",
        content: "Something went wrong while submitting the form.",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">Category Section Add</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "Category Section Add" },
            ]}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end pb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>

      <div className="category-section-form-wrapper">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <div className="category-section-form">
            <div className="category-section-grid">
              <Form.Item label="Title" name="title">
                <AntInput placeholder="Enter title" />
              </Form.Item>

              <Form.Item label="Position" name="position">
                <AntInput placeholder="Enter position" />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
                initialValue="active"
              >
                <Select
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </Form.Item>

              <div className="category-section-buttons">
                <Button type="primary" onClick={handleAddSection}>
                  Add Category Section
                </Button>
                <Button type="primary" htmlType="submit">
                  Create
                </Button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
              flexWrap: "wrap",
            }}
          >
            {sections.map((section, index) => (
              <div key={section.id}>
                <div className="show-section-form-wrapper">
                  <div className="show-section-form">
                    <Form.Item
                      label="Category"
                      name={["sections", index, "category"]}
                      rules={[
                        { required: true, message: "Please select category" },
                      ]}
                    >
                      <Select placeholder="Select Category">
                        {categories?.map((item) => (
                          <Select.Option key={item.id} value={item.id}>
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Link"
                      name={["sections", index, "link"]}
                      rules={[{ required: true, message: "Please enter link" }]}
                    >
                      <AntInput placeholder="Enter link" />
                    </Form.Item>
                  </div>

                  <div style={{ padding: "10px" }}>
                    <Form.Item
                      label="Upload"
                      name={["sections", index, "fileList"]}
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                    >
                      <Upload listType="picture-card" beforeUpload={false}>
                        <button
                          style={{
                            color: "inherit",
                            cursor: "inherit",
                            border: 0,
                            background: "none",
                          }}
                          type="button"
                        >
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </button>
                      </Upload>
                    </Form.Item>
                  </div>

                  <div className="show-section-form">
                    <Form.Item
                      label="Width"
                      name={["sections", index, "width"]}
                      rules={[{ required: true, message: "Enter width" }]}
                    >
                      <AntInput placeholder="Enter width" />
                    </Form.Item>

                    <Form.Item
                      label="Height"
                      name={["sections", index, "height"]}
                      rules={[{ required: true, message: "Enter height" }]}
                    >
                      <AntInput placeholder="Enter height" />
                    </Form.Item>
                  </div>

                  <div style={{ padding: "10px" }}>
                    <Button
                      color="danger"
                      variant="solid"
                      onClick={() => handleRemoveSection(section.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Form>
      </div>
    </>
  );
}
