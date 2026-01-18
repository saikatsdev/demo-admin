import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function AddProductCatelog() {
  // Hook
  useTitle("Add Product Catelog");

  //Variable
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // State
  const [categories, setCategories] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      const res = await getDatas("/admin/categories");

      const list = res?.result?.data || [];

      if (isMounted) {
        const mappedCategories = list.map((cat) => ({
          label: cat.name,
          value: cat.id,
        }));

        // Add "Select All" option
        setCategories([{ label: "Select All", value: "all" }, ...mappedCategories]);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (values) => {
    const formData = new FormData();

    formData.append("name", values.name);
    formData.append("status", values.status);

    values.categories.forEach((id, index) => {
      formData.append(`category_ids[${index}]`, id);
    });

    const res = await postData(
      "/admin/product/catalogs/generate-fb-xml-feed",
      formData
    );

    if (res?.success) {
      messageApi.open({
        type: "success",
        content: res.msg,
      });

      form.resetFields();
      setTimeout(() => {
        navigate("/product/catalogs");
      }, 500);
    }
  };

  const handleCategoryChange = (selectedValues) => {
    if (selectedValues.includes("all")) {
      // Select all real category IDs
      const allIds = categories.filter(c => c.value !== "all").map(c => c.value);
      form.setFieldsValue({ categories: allIds });
    }
  };

  return (
    <>
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">Add Product Catelogs</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "Add Product Catelogs" },
            ]}
          />
        </div>
      </div>

      <div className="catelog-form">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ width: "45%" }}>
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                  <AntInput placeholder="Enter Name" />
                </Form.Item>
              </div>

              <div style={{ width: "45%" }}>
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
              </div>
            </div>

            <div style={{ width: "60%" }}>
              <Form.Item
                name="categories"
                label="Categories"
                rules={[{ required: true }]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  options={categories}
                  placeholder="Select One"
                  onChange={handleCategoryChange}
                />
              </Form.Item>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Space>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Create
                    </Button>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#000000ff",
                        border: "1px solid #929292ff",
                      }}
                      onClick={() => window.history.back()}
                    >
                      Back
                    </Button>
                  </Form.Item>
                </Space>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </>
  );
}
