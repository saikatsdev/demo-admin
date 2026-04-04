import { useRef, useState } from "react";
import { Modal, Button, Row, Col } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function ProductImagePicker({ gallery = [], fetchMore, hasMore, loadingMore, onChange }) {
    // States
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [galleryOpen, setGalleryOpen]       = useState(false);
    const [selectedIds, setSelectedIds]       = useState([]);
    const [preview, setPreview]               = useState(null);

    const fileInputRef = useRef(null);

    // Device upload
    const handleDeviceUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);

        setPreview(objectUrl);
        setSelectedIds([]);

        const img = new window.Image();
        img.onload = function () {
            const width = img.width;
            const height = img.height;
            onChange?.({ file, width, height, galleryPath: null });
            URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;

        setImageModalOpen(false);
    };

    const handleSelectGallery = (item) => {
        setSelectedIds([item.id]);
        setPreview(item.img_path);

        const img = new window.Image();

        img.onload = function () {
            const width = img.width;
            const height = img.height;
            onChange?.({ file: null, width, height, galleryPath: item.original_path });
        };

        img.src = item.img_path;

        setGalleryOpen(false);
    };

    return (
        <>
            {preview ? (
                <img src={preview} alt="selected" className="gallary-uploaded-img" onClick={() => setImageModalOpen(true)} style={{ cursor: "pointer", width: 120, height: 120, objectFit: "fill", borderRadius: 8 }}/>
            ) : (
                <div className="gallary-modal-box" onClick={() => setImageModalOpen(true)}
                    style={{
                        width         : 120,
                        height        : 120,
                        display       : "flex",
                        justifyContent: "center",
                        alignItems    : "center",
                        border        : "1px dashed #ccc",
                        borderRadius  : 8,
                        cursor        : "pointer"
                    }}
                >
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                </div>
            )}

            <Modal title="Select Image Source" open={imageModalOpen} onCancel={() => setImageModalOpen(false)} footer={null}>
                <Button type="primary" block onClick={() => fileInputRef.current.click()}>
                    📱 Upload From Device
                </Button>

                <Button block style={{ marginTop: 10 }} onClick={() => {setImageModalOpen(false);setGalleryOpen(true);}}>
                    🖼️ Choose From Gallery
                </Button>

                <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleDeviceUpload}/>
            </Modal>

            <Modal title="Select From Gallery" open={galleryOpen} onCancel={() => setGalleryOpen(false)} footer={null} width={600}>
                <Row gutter={[16, 16]}>
                    {gallery.map((item) => (
                        <Col span={6} key={item.id}>
                            <div className={`sub-gallary-images-box ${selectedIds.includes(item.id) ? "sub-selected" : ""}`} onClick={() => handleSelectGallery(item)}
                                style={{
                                    border      : selectedIds.includes(item.id) ? "2px solid #1890ff": "1px solid #eee",
                                    borderRadius: 6,
                                    overflow    : "hidden",
                                    cursor      : "pointer"
                                }}
                            >
                                <img src={item.img_path} className="sub-gallery-img" style={{ width: "100%", height: 80, objectFit: "fill" }}/>
                            </div>
                        </Col>
                    ))}

                    <Col span={24} style={{ textAlign: "center", marginTop: 10 }}>
                        {hasMore && (
                            <button type="button" className="gallary-load-more-btn" disabled={loadingMore} onClick={fetchMore}>
                                {loadingMore ? "Loading…" : "Load more"}
                            </button>
                        )}
                    </Col>
                </Row>
            </Modal>
        </>
    );
}