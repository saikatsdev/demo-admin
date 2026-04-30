import { useRef, useState } from "react";
import { Upload, Modal, Button, Form, Row, Col, Tabs, Progress, message } from "antd";
import { PlusOutlined, InboxOutlined } from "@ant-design/icons";
import { postData } from "../../api/common/common";

const { Dragger } = Upload;

export default function ImagePicker({form,name = "image",label = "Image",gallery = [],fetchMore,hasMore,loadingMore, onUploadSuccess}) {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("gallery");
    const [selectedIds, setSelectedIds] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState([]);

    const imageValue = Form.useWatch(name, form);

    const handleSelect = (item) => {
        setSelectedIds([item.id]);

        form.setFieldsValue({
            [name]: [
                {
                    uid: item.id,
                    name: "gallery-image.jpg",
                    status: "done",
                    url: item.img_path,
                    originFileObj: null,
                    isFromGallery: true,
                    galleryPath: item.original_path,
                },
            ],
        });

        setImageModalOpen(false);
    };

    const handleCustomUpload = async ({ file, onProgress, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append("images[]", file);

        try {
            const res = await postData("/admin/gallary/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (event) => {
                    const percent = Math.floor((event.loaded / event.total) * 100);
                    onProgress({ percent });
                },
            });

            if (res && res.success) {
                const newGalleryItems = Array.isArray(res.result) ? res.result : (res.result?.data || []);
                onUploadSuccess?.(newGalleryItems);
                onSuccess(res, file);
            } else {
                onError(new Error(res.message || "Upload failed"));
                message.error(res.message || "Upload failed");
            }
        } catch (error) {
            onError(error);
            message.error("An error occurred during upload.");
        }
    };

    const handleUploadChange = ({ fileList }) => {
        setUploadingFiles(fileList);
        const allDone = fileList.length > 0 && fileList.every(file => file.status === 'done');
        if (allDone) {
            setTimeout(() => {
                setActiveTab("gallery");
                setUploadingFiles([]);
            }, 1000);
        }
    };

    return (
        <>
            <Form.Item label={label} name={name} valuePropName="fileList">
                <>
                    <Upload
                        listType="picture-card"
                        showUploadList={false}
                        beforeUpload={() => false}
                        style={{ display: "none" }}
                    />

                    {imageValue?.length ? (
                        <img
                            className="gallary-uploaded-img"
                            src={imageValue[0].url}
                            alt="selected"
                            onClick={() => {
                                setImageModalOpen(true);
                                setActiveTab("gallery");
                            }}
                        />
                    ) : (
                        <div
                            className="gallary-modal-box"
                            onClick={() => {
                                setImageModalOpen(true);
                                setActiveTab("gallery");
                            }}
                        >
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    )}
                </>
            </Form.Item>

            <Modal
                title="Image Library"
                open={imageModalOpen}
                onCancel={() => setImageModalOpen(false)}
                footer={null}
                width={800}
                style={{ top: 20 }}
            >
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
                        {
                            key: "gallery",
                            label: "Gallery",
                            children: (
                                <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden', padding: '10px 5px' }}>
                                    <Row gutter={[16, 16]}>
                                        {gallery.map((item) => (
                                            <Col span={6} key={item.id}>
                                                <div
                                                    className={`sub-gallary-images-box ${
                                                        selectedIds.includes(item.id)
                                                            ? "sub-selected"
                                                            : ""
                                                    }`}
                                                    onClick={() => handleSelect(item)}
                                                    style={{
                                                        border      : selectedIds.includes(item.id) ? "2px solid #1890ff": "1px solid #eee",
                                                        borderRadius: 6,
                                                        overflow    : "hidden",
                                                        cursor      : "pointer",
                                                        position    : "relative"
                                                    }}
                                                >
                                                    <img
                                                        src={item.img_path}
                                                        className="sub-gallery-img"
                                                        style={{ width: "100%", height: 80, objectFit: "cover" }}
                                                    />
                                                    {selectedIds.includes(item.id) && (
                                                        <div style={{
                                                            position: 'absolute', top: 4, right: 4, background: '#1890ff', color: '#fff',
                                                            width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>✓</div>
                                                    )}
                                                </div>
                                            </Col>
                                        ))}

                                        <Col span={24} style={{ textAlign: "center", marginTop: 20 }}>
                                            {hasMore && (
                                                <Button
                                                    type="default"
                                                    disabled={loadingMore}
                                                    onClick={fetchMore}
                                                    loading={loadingMore}
                                                >
                                                    {loadingMore ? "Loading…" : "Load more"}
                                                </Button>
                                            )}

                                            {!hasMore && (
                                                <p className="no-more-items">
                                                    No more images to load
                                                </p>
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                            )
                        },
                        {
                            key: "upload",
                            label: "Add Files",
                            children: (
                                <div style={{ padding: '20px 0' }}>
                                    <Dragger
                                        multiple={true}
                                        customRequest={handleCustomUpload}
                                        onChange={handleUploadChange}
                                        fileList={uploadingFiles}
                                        showUploadList={true}
                                        accept="image/*"
                                    >
                                        <p className="ant-upload-drag-icon">
                                            <InboxOutlined />
                                        </p>
                                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                        <p className="ant-upload-hint">
                                            Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
                                        </p>
                                    </Dragger>
                                </div>
                            )
                        }
                    ]}
                />
            </Modal>
        </>
    );
}
