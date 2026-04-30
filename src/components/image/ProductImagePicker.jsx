import { useState } from "react";
import { Modal, Button, Row, Col, Tabs, Upload, message } from "antd";
import { PlusOutlined, InboxOutlined } from "@ant-design/icons";
import { postData } from "../../api/common/common";

const { Dragger } = Upload;

export default function ProductImagePicker({ gallery = [], fetchMore, hasMore, loadingMore, onChange, onUploadSuccess }) {
    // States
    const [galleryOpen, setGalleryOpen]       = useState(false);
    const [activeTab, setActiveTab]           = useState("gallery");
    const [selectedIds, setSelectedIds]       = useState([]);
    const [preview, setPreview]               = useState(null);
    const [fileList, setFileList]             = useState([]);

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
            }
        } catch (error) {
            onError(error);
        }
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);

        const allDone = newFileList.length > 0 && newFileList.every(file => file.status === 'done');
        if (allDone) {
            setTimeout(() => {
                setActiveTab("gallery");
                setFileList([]);
            }, 500);
        }
    };

    const uploadProps = {
        name: 'file',
        multiple: true,
        fileList,
        customRequest: handleCustomUpload,
        onChange: handleUploadChange,
        showUploadList: true,
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
                <img src={preview} alt="selected" className="gallary-uploaded-img" onClick={() => setGalleryOpen(true)} style={{ cursor: "pointer", width: 120, height: 120, objectFit: "fill", borderRadius: 8 }}/>
            ) : (
                <div className="gallary-modal-box" onClick={() => setGalleryOpen(true)}
                    style={{
                        width         : 120,
                        height        : 120,
                        display       : "flex",
                        flexDirection : "column",
                        justifyContent: "center",
                        alignItems    : "center",
                        border        : "1px dashed #ccc",
                        borderRadius  : 8,
                        cursor        : "pointer"
                    }}
                >
                    <PlusOutlined style={{ fontSize: 24, color: "#888" }} />
                    <div style={{ marginTop: 8, color: "#888" }}>Upload</div>
                </div>
            )}

            <Modal 
                title="Select Thumbnail" 
                open={galleryOpen} 
                onCancel={() => setGalleryOpen(false)} 
                footer={null} 
                width={800}
                style={{ top: 20 }}
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'upload',
                        label: 'Upload Files',
                        children: (
                            <div style={{ padding: '20px 0' }}>
                                <Dragger {...uploadProps}>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                    <p className="ant-upload-hint">
                                        You can upload multiple images here to add to your gallery.
                                    </p>
                                </Dragger>
                            </div>
                        )
                    },
                    {
                        key: 'gallery',
                        label: 'Gallery',
                        children: (
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden', padding: '10px 5px' }}>
                                <Row gutter={[16, 16]}>
                                    {gallery.map((item) => (
                                        <Col span={6} key={item.id}>
                                            <div className={`sub-gallary-images-box ${selectedIds.includes(item.id) ? "sub-selected" : ""}`} onClick={() => handleSelectGallery(item)}
                                                style={{
                                                    border      : selectedIds.includes(item.id) ? "2px solid #1890ff": "1px solid #eee",
                                                    borderRadius: 6,
                                                    overflow    : "hidden",
                                                    cursor      : "pointer",
                                                    position    : "relative"
                                                }}
                                            >
                                                <img src={item.img_path} className="sub-gallery-img" style={{ width: "100%", height: 80, objectFit: "cover" }}/>
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
                                            <Button type="default" loading={loadingMore} onClick={fetchMore}>
                                                {loadingMore ? "Loading…" : "Load more"}
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </div>
                        )
                    }
                ]} />
            </Modal>
        </>
    );
}