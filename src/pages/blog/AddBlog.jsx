import {Input as AntInput,Breadcrumb,Button,Col,Form,Row,Select,Upload,message} from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function AddBlog() {
  // Hook
  useTitle("Add Blog Post");

  // State
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [messageApi, contextHolder]           = message.useMessage();

  const navigate = useNavigate();

  //Method

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

    setLoading(true);

    try {
      const res = await postData("/admin/blog-posts", formData);

      if(res && res?.success){
        messageApi.open({
          type: "success",
          content: res.msg,
        });

        setTimeout(() => {
          navigate("/blogs");
        }, 500);
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
          <h1 className="title">Add Blog Posts</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "Add Blog Posts" },
            ]}
          />
        </div>
      </div>

      <div>
        <div className="blog-form">
          <h2 style={{ textAlign: "center", color: "#000", fontSize: "2rem" }}>
            Create a New Post
          </h2>
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
                    <Select placeholder="Choose Categories" options={categories.map((cat) => ({value: cat.id,label: cat.name}))}/>
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
                  <Form.Item label="Blog Tags" name="tag_ids">
                    <Select mode="multiple" placeholder="Select Tags" options={tags.map((tag) => ({value: tag.id,label: tag.name}))}/>
                  </Form.Item>
                </Col>
              </Row>

              {/* Description */}
              <Form.Item label="Description" name="description">
                <ReactQuill theme="snow" placeholder="Write blog description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
              </Form.Item>

              {/* Image Upload */}
              <Form.Item label="Image" name="image">
                <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} fileList={fileList}  onChange={({ fileList }) => setFileList(fileList)}>
                  <div>+</div>
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
                  <Form.Item label="Meta Description" name="meta_description">
                    <AntInput />
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
                  {loading ? "Submiting..." : "Submit"}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
