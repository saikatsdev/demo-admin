import { useRef, useState } from "react";
import { Upload, Modal, Button, Form, Row, Col } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function ImagePicker({form,name = "image",label = "Image",gallery = [],fetchMore,hasMore,loadingMore}) {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const fileInputRef = useRef(null);

    const imageValue = Form.useWatch(name, form);

    const handleDeviceUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        form.setFieldsValue({
            [name]: [
                {
                    uid: "-1",
                    name: file.name,
                    status: "done",
                    originFileObj: file,
                    url: URL.createObjectURL(file),
                },
            ],
        });

        setImageModalOpen(false);
    };

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

        setGalleryOpen(false);
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
                            onClick={() => setImageModalOpen(true)}
                        />
                    ) : (
                        <div
                            className="gallary-modal-box"
                            onClick={() => setImageModalOpen(true)}
                        >
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    )}
                </>
            </Form.Item>

            {/* Select source modal */}
            <Modal
                title="Select Image Source"
                open={imageModalOpen}
                onCancel={() => setImageModalOpen(false)}
                footer={null}
            >
                <Button
                    type="primary"
                    block
                    onClick={() => fileInputRef.current.click()}
                >
                    📱 Upload From Device
                </Button>

                <Button
                    block
                    style={{ marginTop: 10 }}
                    onClick={() => {
                        setImageModalOpen(false);
                        setGalleryOpen(true);
                    }}
                >
                    🖼️ Choose From Gallery
                </Button>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleDeviceUpload}
                />
            </Modal>

            {/* Gallery modal */}
            <Modal
                title="Select From Gallery"
                open={galleryOpen}
                onCancel={() => setGalleryOpen(false)}
                footer={null}
                width={600}
            >
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
                            >
                                <img
                                    src={item.img_path}
                                    className="sub-gallery-img"
                                />
                            </div>
                        </Col>
                    ))}

                    <Col span={24} style={{ textAlign: "center", marginTop: 10 }}>
                        {hasMore && (
                            <button
                                type="button"
                                className="gallary-load-more-btn"
                                disabled={loadingMore}
                                onClick={fetchMore}
                            >
                                {loadingMore ? "Loading…" : "Load more"}
                            </button>
                        )}

                        {!hasMore && (
                            <p className="no-more-items">
                                No more images to load
                            </p>
                        )}
                    </Col>
                </Row>
            </Modal>
        </>
    );
}
