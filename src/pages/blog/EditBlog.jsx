import {Input as AntInput,Breadcrumb,Button,Col,Form,Row,Select,Upload, message} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { TextArea } = AntInput;

export default function EditBlog() {
  // Hook
  useTitle("Edit Blog Post");

  const navigate = useNavigate();

  // State
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [messageApi, contextHolder]           = message.useMessage();

  // Variable
  const { id } = useParams();

  //Method
  useEffect(() => {
    const fetchSingleData = async () => {
      const res = await getDatas(`/admin/blog-posts/${id}`);

      if (res?.success) {

        setFileList([
          {
            uid: "-1",
            name: "blog-image.png",
            status: "done",
            url: res.result.image,
          },
        ]);

        form.setFieldsValue({
          title: res.result.title,
          category_id: res.result.category.id,
          tags: res.result.tags.map((tag) => tag.id),
          description: res.result.description,
          status: res.result.status,
          meta_title: res.result.meta_title,
          meta_tag: res.result.meta_tag,
          meta_description: res.result.meta_description,
        });
      }
    };

    if (id) {
      fetchSingleData();
    }
  }, [id, form]);

  // For Category
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const [catRes, tagRes] = await Promise.all([
        getDatas("/admin/blog-post-categories"),
        getDatas("/admin/tags")
      ]);

      if (isMounted) {
        setCategories(catRes?.result?.data || []);
        setTags(tagRes?.result?.data || []);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (values) => {
    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (key !== "image") {
        formData.append(key, values[key]);
      }
    });

    values.tag_ids?.forEach((tagId) => {
      formData.append("tag_ids[]", tagId);
    });

    formData.append("description", values.description);

    const imageFile = fileList[0]?.originFileObj;

    if (imageFile) {
      formData.append("image", imageFile);
    }

    formData.append("_method", "PUT");

    const res = await postData(`/admin/blog-posts/${id}`, formData);

    if(res && res?.success){
      messageApi.open({
        type: "success",
        content: res.msg,
      });

      setTimeout(() => {
        navigate("/blogs");
      }, 500);
    }
  }
  return (
    <>
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">All Blog Posts</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "All Blog Posts" },
            ]}
          />
        </div>
      </div>

      <div>
        <div className="blog-form">
          <div className="blog-post-head">
              <h2 className="blog-post-title">
                  Edit Post Information
              </h2>

              <button className="blog-post-back-btn">
                  <i className="back-icon">←</i>
                  Back
              </button>
          </div>

          <div className="blog-form-layout">
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Blog Title" name="title">
                    <AntInput placeholder="Enter blog title" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Category" name="category_id">
                    <Select
                      placeholder="Choose Categories"
                      options={categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                    <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Blog Tags" name="tags">
                    <Select mode="multiple" placeholder="Select Tags" options={tags.map((tag) => ({value: tag.id,label: tag.name}))}/>
                  </Form.Item>
                </Col>
              </Row>

              {/* Description */}
              <Form.Item label="Description" name="description">
                <TextArea rows={6} placeholder="Enter description..." />
              </Form.Item>

              {/* Image Upload */}
              <Form.Item label="Image" name="image">
                <Upload listType="picture-card" fileList={fileList} onChange={({ fileList: newFileList }) => setFileList(newFileList)} beforeUpload={() => false}>
                  <div>+</div>
                  {fileList.length >= 1 ? null : "Upload"}
                </Upload>
              </Form.Item>

              {/* Img Width + Height */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Img Width" name="width" initialValue={1920}>
                    <AntInput />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Img Height" name="height" initialValue={720}>
                    <AntInput />
                  </Form.Item>
                </Col>
              </Row>

              {/* Meta Title + Tag */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Meta Title" name="meta_title">
                    <AntInput />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Description" name="meta_description">
                    <TextArea rows={2} placeholder="Enter description..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Meta Tag" name="meta_tag">
                    <AntInput />
                  </Form.Item>
                </Col>
              </Row>

              {/* Submit */}
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Update Post
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
