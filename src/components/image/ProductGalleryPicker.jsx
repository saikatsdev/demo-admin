import { useState } from "react";
import { Modal, Button, Row, Col, Tabs, Upload, message, } from "antd";
import { PlusOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { postData } from "../../api/common/common";

const { Dragger } = Upload;

export default function ProductGalleryPicker({gallery = [],fetchMore,hasMore,loadingMore,onChange,onUploadSuccess}) {
    // State
    const [images, setImages]                 = useState([]);
    const [galleryOpen, setGalleryOpen]       = useState(false);
    const [activeTab, setActiveTab]           = useState("gallery");
    const [fileList, setFileList]             = useState([]);

    const selectedIds = images.map(img => img.uid);

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
                // Handle Laravel Resource Collection wrapping (res.result.data) or direct arrays
                let newGalleryItems = [];
                if (res.result?.data && Array.isArray(res.result.data)) {
                    newGalleryItems = res.result.data;
                } else if (Array.isArray(res.result)) {
                    newGalleryItems = res.result;
                } else if (res.result) {
                    newGalleryItems = [res.result];
                }
                
                onUploadSuccess?.(newGalleryItems);
                onSuccess(res, file);
                message.success(`${file.name} uploaded successfully`);
            } else {
                onError(new Error(res.message || "Upload failed"));
                message.error(`${file.name} upload failed.`);
            }
        } catch (error) {
            onError(error);
            message.error(`${file.name} upload failed.`);
        }
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);

        // Check if all files in the current batch are successfully uploaded
        const allDone = newFileList.length > 0 && newFileList.every(file => file.status === 'done');
        
        if (allDone) {
            setTimeout(() => {
                setActiveTab("gallery");
                // Clear the upload list after switching so it's fresh for next time
                setFileList([]);
            }, 500);
        }
    };

    const handleSelect = (item) => {
        if (images.find(img => img.uid === item.id)) {
            removeImage(item.id);
            return;
        }

        const img = new Image();
        img.onload = () => {
            onChange?.({
                file       : null,
                width      : img.width,
                height     : img.height,
                galleryPath: item.original_path,
                uid        : item.id
            });
        };

        img.src = item.img_path;

        setImages(prev => [
            ...prev,
            {
                uid: item.id,
                url: item.img_path
            }
        ]);
    };

    const removeImage = (uid) => {
        setImages(prev => prev.filter(img => img.uid !== uid));
        onChange?.({ remove: true, uid });
    };

    const uploadProps = {
        name: 'file',
        multiple: true,
        fileList,
        customRequest: handleCustomUpload,
        onChange: handleUploadChange,
        showUploadList: {
            showRemoveIcon: true,
            showDownloadIcon: false,
        },
    };

    return (
        <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div onClick={() => setGalleryOpen(true)}
                    style={{
                        width         : 80,
                        height        : 80,
                        display       : "flex",
                        justifyContent: "center",
                        alignItems    : "center",
                        border        : "1px dashed #ccc",
                        borderRadius  : 8,
                        cursor        : "pointer"
                    }}
                >
                    <PlusOutlined />
                </div>

                {images.map((img) => (
                    <div key={img.uid} style={{ position: "relative" }}>
                        <img src={img.url}
                            style={{
                                width       : 80,
                                height      : 80,
                                objectFit   : "fill",
                                borderRadius: 8
                            }}
                        />

                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeImage(img.uid)}
                            style={{
                                position    : "absolute",
                                top         : -8,
                                right       : -8,
                                background  : "#ff4d4f",
                                color       : "#fff",
                                borderRadius: "50%",
                                width       : 20,
                                height      : 20,
                                padding     : 0
                            }}
                        />
                    </div>
                ))}
            </div>

            <Modal 
                title="Select Images" 
                open={galleryOpen} 
                footer={null} 
                onCancel={() => setGalleryOpen(false)} 
                width={800}
                style={{ top: 20 }}
            >
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
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
                                            Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                                            banned files.
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
                                        {gallery.map((item) => {
                                            const selected = selectedIds.includes(item.id);

                                            return (
                                                <Col span={6} key={item.id}>
                                                    <div onClick={() => handleSelect(item)}
                                                        style={{
                                                            border      : selected ? "2px solid #1677ff": "1px solid #eee",
                                                            borderRadius: 6,
                                                            overflow    : "hidden",
                                                            cursor      : "pointer",
                                                            position    : "relative"
                                                        }}
                                                    >
                                                        <img src={item.img_path}
                                                            style={{
                                                                width    : "100%",
                                                                height   : 80,
                                                                objectFit: "cover",
                                                                opacity  : selected ? 0.7: 1
                                                            }}
                                                        />

                                                        {selected && (
                                                            <div
                                                                style={{
                                                                    position      : "absolute",
                                                                    top           : 4,
                                                                    right         : 4,
                                                                    width         : 20,
                                                                    height        : 20,
                                                                    borderRadius  : "50%",
                                                                    background    : "#1677ff",
                                                                    color         : "#fff",
                                                                    display       : "flex",
                                                                    alignItems    : "center",
                                                                    justifyContent: "center",
                                                                    fontSize      : 12,
                                                                    fontWeight    : "bold"
                                                                }}
                                                            >
                                                                ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            );
                                        })}

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
                    ]}
                />
            </Modal>
        </>
    );
}