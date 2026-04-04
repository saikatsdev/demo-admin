import { useRef, useState } from "react";
import { Modal, Button, Row, Col } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

export default function ProductGalleryPicker({gallery = [],fetchMore,hasMore,loadingMore,onChange}) {
    // State
    const [images, setImages]                 = useState([]);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [galleryOpen, setGalleryOpen]       = useState(false);
    const fileInputRef                        = useRef(null);

    const selectedIds = images.map(img => img.uid);

    const handleDeviceUpload = (e) => {
        const files = Array.from(e.target.files || []);

        const newImages = files.map((file) => {
            const uid = `${Date.now()}-${Math.random()}-${file.name}`;
            const url = URL.createObjectURL(file);

            const img = new Image();
            img.onload = () => {
                onChange?.({
                    file,
                    width: img.width,
                    height: img.height,
                    galleryPath: null,
                    uid
                });
            };
            img.src = url;

            return { uid, url };
        });

        setImages(prev => [...prev, ...newImages]);
        setImageModalOpen(false);
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

    return (
        <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div onClick={() => setImageModalOpen(true)}
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

            <Modal title="Select Image Source" open={imageModalOpen} footer={null} onCancel={() => setImageModalOpen(false)}>
                <Button type="primary" block onClick={() => fileInputRef.current.click()}>
                    Upload From Device
                </Button>

                <Button block style={{ marginTop: 10 }} onClick={() => {setImageModalOpen(false);setGalleryOpen(true);}}>
                    Choose From Gallery
                </Button>

                <input type="file" ref={fileInputRef} multiple accept="image/*" hidden onChange={handleDeviceUpload}/>
            </Modal>

            <Modal title="Select From Gallery" open={galleryOpen} footer={null} onCancel={() => setGalleryOpen(false)} width={600}>
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

                    <Col span={24} style={{ textAlign: "center" }}>
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