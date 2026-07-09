import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined, RocketOutlined, BarcodeOutlined, GlobalOutlined, InfoCircleOutlined, DollarOutlined, AppstoreOutlined } from "@ant-design/icons";
import {Button,Card,Col,Divider,Form,Image,Input,message,Modal,Row,Select,Space,Table,Tag,Typography,Checkbox,Upload, Tooltip} from "antd";
import { useEffect, useMemo,useState } from "react";
import { useNavigate, useParams,useSearchParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {useAppSettings} from "../../contexts/useAppSettings";
import Permalink from "../../components/products/Permalink";
import ProductImagePicker from "../../components/image/ProductImagePicker";
import ProductGalleryPicker from "../../components/image/ProductGalleryPicker";

const { Title, Text } = Typography;
const DEFAULT_PRODUCT_PAGE_SIZE = 50;

export default function ProductEdit() {
    // Hook
    useTitle("Edit Product");
    const { settings} = useAppSettings();
	
	const [searchParams] = useSearchParams();
    const page = searchParams.get("page") || 1;
    const pageSize = searchParams.get("paginate_size") || searchParams.get("pageSize") || DEFAULT_PRODUCT_PAGE_SIZE;

    const { id }   = useParams();
    const navigate = useNavigate();

    const [loading, setLoading]                                     = useState(false);
    const [errors, setErrors]                                       = useState({});
    const [title, setTitle]                                         = useState("");
    const [productId, setProductId]                                 = useState("");
    const [categoryIds, setCategoryIds]                               = useState([]);
    const [brandId, setBrandId]                                     = useState("");
    const [status, setStatus]                                       = useState("");
    const [productTypeId, setProductTypeId]                         = useState("");
    const [sku, setSku]                                             = useState("");
    const [videoUrl, setVideoUrl]                                   = useState("");
    const [description, setDescription]                             = useState("");
    const [shortDescription, setShortDescription]                   = useState("");
    const [isFreeShipping, setIsFreeShipping]                       = useState("0");
    const [minimumQuantity, setMinimumQuantity]                     = useState("1");
    const [currentStock, setCurrentStock]                           = useState("0");
    const [soldQty, setSoldQty]                                     = useState("");
    const [buyPrice, setBuyPrice]                                   = useState("");
    const [regularPrice, setRegularPrice]                           = useState("");
    const [offerPrice, setOfferPrice]                               = useState("");
    const [metaTitle, setMetaTitle]                                 = useState("");
    const [metaKeywords, setMetaKeywords]                           = useState("");
    const [metaDescription, setMetaDescription]                     = useState("");
    const [categories, setCategories]                               = useState([]);
    const [brands, setBrands]                                       = useState(null);
    const [productTypes, setProductTypes]                           = useState(null);
    const [dynamicInputs, setDynamicInputs]                         = useState([]);
    const [allVariations, setAllVariations]                         = useState({ data: [] });
    const [productData, setProductData]                             = useState(null);
    const [attributes, setAttributes]                               = useState([]);
    const [selectedAttributeId, setSelectedAttributeId]             = useState([]);
    const [attributeValue, setAttributeValue]                       = useState([]);
    const [variationBuyPrice, setVariationBuyPrice]                 = useState([]);
    const [variationRegularPrice, setVariationRegularPrice]         = useState([]);
    const [variationOfferPrice, setVariationOfferPrice]             = useState([]);
    const [itemCurrentStock, setItemCurrentStock]                   = useState([]);
    const [isDefault, setIsDefault]                                 = useState([]);
    const [variationDescription, setVariationDescription]           = useState([]);
    const [colorImages, setColorImages]                             = useState([]);
    const [colorImagePreview, setColorImagePreview]                 = useState([]);
    const [slug, setSlug]                                           = useState("");
    const [selectedVariationRows, setSelectedVariationRows]         = useState([]);
    const [selectAllVariations, setSelectAllVariations]             = useState(false);
    const [variationMultiplyModal, setVariationMultiplyModal]       = useState(false);
    const [selectedVariationId, setSelectedVariationId]             = useState([]);
    const [selectedVariationValues, setSelectedVariationValues]     = useState([]);
    const [multiBuyPrice, setMultiBuyPrice]                         = useState("");
    const [multiRegularPrice, setMultiRegularPrice]                 = useState("");
    const [multiOfferPrice, setMultiOfferPrice]                     = useState("");
    const [multiStock, setMultiStock]                               = useState("");
    const [multiIsDefault, setMultiIsDefault]                       = useState(0);
    const [messageApi, contextHolder]                               = message.useMessage();
    const [thumbnailPreview, setThumbnailPreview]                   = useState("");
    const [thumbnail, setThumbnail]                                 = useState(null);
    const [images, setImages]                                       = useState([]);
    const [imagePreview, setImagePreview]                           = useState([]);
    const [deletedGalleryIds, setDeletedGalleryIds]                 = useState([]);
    const [loadingMore, setLoadingMore]                             = useState(false);
    const [gallery, setGallery]                                     = useState([]);
    const [gallaryPage, setGallaryPage]                             = useState(1);
    const [hasMore, setHasMore]                                     = useState(true);
    const [comboSearchQuery, setComboSearchQuery]                   = useState("");
    const [comboSearchResults, setComboSearchResults]               = useState([]);
    const [comboSearchLoading, setComboSearchLoading]               = useState(false);
    const [comboProducts, setComboProducts]                         = useState([]);

    const [variationIds, setVariationIds] = useState([]);

    const fetchMedia = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            setLoadingMore(true);

            const res = await getDatas(`/admin/gallary?page=${pageNumber}`);

            if (res && res?.success) {
                const data = res.result.data;

                if (pageNumber > 1) {
                    setGallery(prev => [...prev, ...data]);
                } else {
                    setGallery(data);
                }

                const meta = res.result.meta;
                setGallaryPage(meta.current_page);
                setHasMore(meta.current_page < meta.last_page);
            }
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchMedia(gallaryPage);
    }, []);

    const fetchComboProducts = async (query) => {
        if (!query.trim()) {
            setComboSearchResults([]);
            return;
        }
        setComboSearchLoading(true);
        try {
            const res = await getDatas("/admin/products/search", { search_key: query });
            if (res?.success) {
                setComboSearchResults(res?.result || []);
            }
        } catch (error) {
            console.error("Failed to search products:", error);
        } finally {
            setComboSearchLoading(false);
        }
    };

    useEffect(() => {
        if (!comboSearchQuery) {
            setComboSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            fetchComboProducts(comboSearchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [comboSearchQuery]);

    useEffect(() => {
        if (!productTypeId || !productTypes) return;
        const type = productTypes.find(t => t.id === productTypeId);
        if (type?.name !== "Combo Product") {
            setComboProducts([]);
            setComboSearchQuery("");
            setComboSearchResults([]);
        }
    }, [productTypeId, productTypes]);

    useEffect(() => {
        const init = async () => {
            setDynamicInputs([]);
            setSelectedAttributeId([]);
            setAttributes([]);
            setAttributeValue([]);
            setVariationBuyPrice([]);
            setVariationRegularPrice([]);
            setVariationOfferPrice([]);
            setItemCurrentStock([]);
            setIsDefault([]);
            setVariationDescription([]);
            setColorImages([]);
            setColorImagePreview([]);
            setProductData(null);

            const catRes = await getDatas("/admin/categories/list");
            if (catRes?.success) setCategories(catRes.result);

            const brandRes = await getDatas("/admin/brands/list");
            if (brandRes?.success) setBrands(brandRes.result);

            const typeRes = await getDatas("/admin/product-types/list");
            if (typeRes?.success) setProductTypes(typeRes.result);

            const variationRes = await getDatas("/admin/attributes");
            if (variationRes?.success) {
                let attrs = [];
                if (Array.isArray(variationRes.result)) {
                    attrs = variationRes.result;
                } else if (Array.isArray(variationRes.result?.data)) {
                    attrs = variationRes.result.data;
                } else if (
                    variationRes.result &&
                    typeof variationRes.result === "object"
                ) {
                    attrs = variationRes.result.data && Array.isArray(variationRes.result.data) ? variationRes.result.data : [];
                }
                setAllVariations({ data: attrs });
            }

            const res = await getDatas(`/admin/products/${id}`);

            if (res?.success) {

                const p = res.result;

                const catIds = p.categories?.map(c => `cat-${c.id}`) || [];
                const subIds = p.sub_categories?.map(s => `sub-${s.id}`) || [];
                const subSubIds = p.sub_sub_categories?.map(s => `subsub-${s.id}`) || [];

                // merge all
                const allSelected = [...catIds, ...subIds, ...subSubIds];

                setCategoryIds(allSelected);

                setTitle(p.name || "");
                setSoldQty(p.total_sell_qty);
                setSlug(p.slug);

                setProductId(p.id || "");
                setBrandId(p.brand?.id || "");
                setStatus(p.status || "");
                setProductTypeId(p.product_type?.id || "");
                setSku(p.sku || "");
                setVideoUrl(p.video_url || "");
                setDescription(p.description || "");
                setShortDescription(p.short_description || "");
                setIsFreeShipping(p.free_shipping ? "1" : "0");
                setMinimumQuantity(p.minimum_qty || "1");
                setCurrentStock(p.current_stock || "0");
                setBuyPrice(p.buy_price || "");
                setRegularPrice(p.mrp || "");
                setOfferPrice(p.offer_price || "");
                setMetaTitle(p.meta_title || "");
                setMetaKeywords(p.meta_keywords || "");
                setMetaDescription(p.meta_description || "");
                setThumbnailPreview(p.image || "");

                setImagePreview(
                    p.images.map(img => ({
                        id  : img.id,
                        url : img.image,
                        type: "old"
                    }))
                );

                if (p.combo_items && p.combo_items.length > 0) {
                    setComboProducts(p.combo_items.map(item => item.product));
                }

                if (p.variations?.length > 0) setProductData(p);

                const ids = p.variations.map(v => v.id || null);
                setVariationIds(ids);
            }
        };
        init();
    }, [id]);

    useEffect(() => {
        if (allVariations?.data?.length > 0 && productData?.variations?.length > 0) {
            const p = productData;

            setDynamicInputs(Array(p.variations.length).fill(""));
            setVariationBuyPrice(p.variations.map((v) => v.buy_price || ""));
            setVariationRegularPrice(p.variations.map((v) => v.mrp || ""));
            setVariationOfferPrice(p.variations.map((v) => v.offer_price || ""));
            setItemCurrentStock(p.variations.map((v) => v.current_stock || ""));
            setIsDefault(p.variations.map((v) => v.is_default || 0));
            setVariationDescription(p.variations.map((v) => v.description || ""));
            setColorImagePreview(p.variations.map((v) => v.image || null));

            const attrIds = p.variations.map((v) => {
                let ids = [];
                if (v.attribute_value_1) ids.push(v.attribute_value_1.attribute_id);
                if (v.attribute_value_2) ids.push(v.attribute_value_2.attribute_id);
                if (v.attribute_value_3) ids.push(v.attribute_value_3.attribute_id);
                return Array.from(new Set(ids.filter(Boolean)));
            });
            setSelectedAttributeId(attrIds);

            const attrVals = p.variations.map((v) => {
                let vals = [];
                if (v.attribute_value_1) vals.push(v.attribute_value_1);
                if (v.attribute_value_2) vals.push(v.attribute_value_2);
                if (v.attribute_value_3) vals.push(v.attribute_value_3);
                return vals;
            });

            setAttributeValue(attrVals);

            //  Fix: Set attributes properly for dropdown display
            const attrData = p.variations.map((v) => {
                let attrs = [];
                if (v.attribute_value_1) {
                    const attr1 = allVariations.data.find(
                    (a) => a.id === v.attribute_value_1.attribute_id
                    );
                    if (attr1) attrs.push(attr1);
                }

                if (v.attribute_value_2) {
                    const attr2 = allVariations.data.find((a) => a.id === v.attribute_value_2.attribute_id);
                    if (attr2) attrs.push(attr2);
                }

                if (v.attribute_value_3) {
                    const attr3 = allVariations.data.find((a) => a.id === v.attribute_value_3.attribute_id);
                    if (attr3) attrs.push(attr3);
                }

                const seen = new Set();
                const unique = [];
                for (const a of attrs) {
                    if (a && !seen.has(a.id)) {
                        unique.push(a);
                        seen.add(a.id);
                    }
                }
                return unique;
            });
            setAttributes(attrData);
        }
    }, [allVariations?.data, productData]);

    const handleImageChange = ({ file, width, height, galleryPath }) => {
        setThumbnailPreview("");
        if (file) {
            setThumbnail({file: file,path: null,width,height});
        } else {
            setThumbnail({file: null,path: galleryPath,width,height});
        }
    };

    const handleGalleryImageFileChange = ({file,width,height,galleryPath,uid,remove}) => {
        if (remove) {
            const targetOld = imagePreview.find(img => img.id === uid);

            if (targetOld && targetOld.type === "old" && targetOld.id) {
                setDeletedGalleryIds(prev =>
                    prev.includes(targetOld.id) ? prev : [...prev, targetOld.id]
                );
                setImagePreview(prev => prev.filter(img => img.id !== uid));
            }

            setImages(prev => prev.filter(img => img.uid !== uid));
            return;
        }

        if (file) {
            setImages(prev => [
                ...prev,
                {uid,file,path: null,width,height}
            ]);
        } else {
            setImages(prev => [
                ...prev,
                {uid,file: null,path: galleryPath,width,height}
            ]);
        }
    };

    const addVariationField = () => {
        setDynamicInputs((prev) => ["", ...prev]);
        setSelectedAttributeId((prev) => [[], ...prev]);
        setAttributes((prev) => [[], ...prev]);
        setAttributeValue((prev) => [[], ...prev]);
        setVariationBuyPrice((prev) => ["", ...prev]);
        setVariationRegularPrice((prev) => ["", ...prev]);
        setVariationOfferPrice((prev) => ["", ...prev]);
        setItemCurrentStock((prev) => ["", ...prev]);
        setIsDefault((prev) => [0, ...prev]);
        setVariationDescription((prev) => ["", ...prev]);
        setColorImages((prev) => [null, ...prev]);
        setColorImagePreview((prev) => [null, ...prev]);

        setBuyPrice("");
        setRegularPrice("");
        setOfferPrice("");

        setSelectedVariationRows([]);
        setSelectAllVariations(false);
    };

    const removeVariationField = (index) => {
        setDynamicInputs((prev) => prev.filter((_, i) => i !== index));
        setVariationBuyPrice((prev) => prev.filter((_, i) => i !== index));
        setVariationRegularPrice((prev) => prev.filter((_, i) => i !== index));
        setVariationOfferPrice((prev) => prev.filter((_, i) => i !== index));
        setItemCurrentStock((prev) => prev.filter((_, i) => i !== index));
        setIsDefault((prev) => prev.filter((_, i) => i !== index));
        setAttributeValue((prev) => prev.filter((_, i) => i !== index));
        setColorImages((prev) => prev.filter((_, i) => i !== index));
        setColorImagePreview((prev) => prev.filter((_, i) => i !== index));
        setVariationDescription((prev) => prev.filter((_, i) => i !== index));
        setSelectedAttributeId((prev) => prev.filter((_, i) => i !== index));
        setAttributes((prev) => prev.filter((_, i) => i !== index));

        if (dynamicInputs.length === 1) {
        // This will be the last variation being removed
        // Normal pricing will be shown automatically when dynamicInputs becomes empty
        }
    };

    const handleSelectAllVariations = (checked) => {
        setSelectAllVariations(checked);
        if (checked) {
            setSelectedVariationRows(dynamicInputs.map((_, index) => index));
        } else {
            setSelectedVariationRows([]);
        }
    };

    const handleSelectVariationRow = (index, checked) => {
        if (checked) {
            setSelectedVariationRows((prev) => [...prev, index]);
        } else {
            setSelectedVariationRows((prev) => prev.filter((i) => i !== index));
        }
    };

    const handleBulkDeleteVariations = () => {
        if (selectedVariationRows.length === 0) {
            message.warning("Please select variations to delete");
            return;
        }

        // Sort indices in descending order to avoid index shifting issues
        const sortedIndices = [...selectedVariationRows].sort((a, b) => b - a);

        sortedIndices.forEach((index) => {
            setDynamicInputs((prev) => prev.filter((_, i) => i !== index));
            setVariationBuyPrice((prev) => prev.filter((_, i) => i !== index));
            setVariationRegularPrice((prev) => prev.filter((_, i) => i !== index));
            setVariationOfferPrice((prev) => prev.filter((_, i) => i !== index));
            setItemCurrentStock((prev) => prev.filter((_, i) => i !== index));
            setIsDefault((prev) => prev.filter((_, i) => i !== index));
            setAttributeValue((prev) => prev.filter((_, i) => i !== index));
            setColorImages((prev) => prev.filter((_, i) => i !== index));
            setColorImagePreview((prev) => prev.filter((_, i) => i !== index));
            setVariationDescription((prev) => prev.filter((_, i) => i !== index));
            setSelectedAttributeId((prev) => prev.filter((_, i) => i !== index));
            setAttributes((prev) => prev.filter((_, i) => i !== index));
        });

        setSelectedVariationRows([]);
        setSelectAllVariations(false);
        message.success(
            `${selectedVariationRows.length} variation(s) deleted successfully`
        );

        //  If all variations are deleted, normal pricing will be shown automatically
        // when dynamicInputs becomes empty
    };

    const handleAttributeValue = (index, selectedIds = null) => {
        const attributeIds = selectedIds || selectedAttributeId[index] || [];
        const newAttributes = allVariations?.data?.filter((i) => attributeIds.includes(i.id)) || [];

        let updated = [...attributes];
        updated[index] = newAttributes;
        setAttributes(updated);

        let attrVal = [...attributeValue];
        if (!attrVal[index]) attrVal[index] = [];

        const currentValues = attrVal[index] || [];
        const filteredValues = currentValues.filter((val) => attributeIds.includes(val.attribute_id));

        attrVal[index] = filteredValues;
        setAttributeValue(attrVal);
    };

    const handleColorImageChange = (data, index) => {
        const newImages = [...colorImages];
        const newPreview = [...colorImagePreview];

        newImages[index] = {
            file: data.file || null,
            path: data.galleryPath || null,
        };

        newPreview[index] = data.file
            ? URL.createObjectURL(data.file)
            : data.galleryPath;

        setColorImages(newImages);
        setColorImagePreview(newPreview);
    };

    const updateVariationField = (index, field, value) => {
        const setters = {
            buyPrice    : setVariationBuyPrice,
            regularPrice: setVariationRegularPrice,
            offerPrice  : setVariationOfferPrice,
            stock       : setItemCurrentStock,
            default     : setIsDefault,
            description : setVariationDescription,
        };

        const setter = setters[field];
        if (setter) {
            setter((prev) => {
                const updated = [...prev];
                updated[index] = value;
                return updated;
            });
        }
    };

    const handleVariationMultiplySubmit = () => {
        if (!selectedVariationId.length) {
            message.error("Please select at least one variation");
            return;
        }
    
        if (!selectedVariationValues.length) {
            message.error("Please select at least one variation value");
            return;
        }
    
        const groupedValues = {};
        selectedVariationValues.forEach((value) => {
            if (!groupedValues[value.attribute_id]) {
                groupedValues[value.attribute_id] = [];
            }
            groupedValues[value.attribute_id].push(value);
        });
    
        const attributeGroups = Object.values(groupedValues);
        let flattened = [];
    
        if (attributeGroups.length === 3) {
            flattened = attributeGroups[0].flatMap((v1) =>
                attributeGroups[1].flatMap((v2) =>
                attributeGroups[2].map((v3) => [v1, v2, v3])
                )
            );
        } else if (attributeGroups.length === 2) {
            flattened = attributeGroups[0].flatMap((v1) =>
                attributeGroups[1].map((v2) => [v1, v2])
            );
        } else {
            flattened = attributeGroups[0].map((v1) => [v1]);
        }
    
        flattened.forEach((combo) => {
            setDynamicInputs((prev) => ["", ...prev]);
            setVariationBuyPrice((prev) => [multiBuyPrice, ...prev]);
            setVariationRegularPrice((prev) => [multiRegularPrice, ...prev]);
            setVariationOfferPrice((prev) => [multiOfferPrice, ...prev]);
            setItemCurrentStock((prev) => [multiStock, ...prev]);
            setIsDefault((prev) => [multiIsDefault, ...prev]);
            setVariationDescription((prev) => ["", ...prev]);
            setColorImages((prev) => [null, ...prev]);
            setColorImagePreview((prev) => [null, ...prev]);
        
            setSelectedAttributeId((prev) => [
                combo.map((c) => c.attribute_id),
                ...prev,
            ]);
        
            setAttributeValue((prev) => [combo, ...prev]);
        
            const selectedAttributes = (allVariations?.data || []).filter((v) =>
                combo.some((c) => c.attribute_id === v.id)
            );
            setAttributes((prev) => [selectedAttributes, ...prev]);
        });
    
        setVariationMultiplyModal(false);
        setSelectedVariationId([]);
        setSelectedVariationValues([]);
        setMultiBuyPrice("");
        setMultiRegularPrice("");
        setMultiOfferPrice("");
        setMultiStock("");
        setMultiIsDefault(0);
    
        setBuyPrice("");
        setRegularPrice("");
        setOfferPrice("");
    
        setSelectedVariationRows([]);
        setSelectAllVariations(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});
        try {
            const formData = new FormData();
            formData.append("name", title);
            formData.append("brand_id", brandId || "");

            const category_ids = [];
            const sub_category_ids = [];
            const sub_sub_category_ids = [];

            categoryIds.forEach(item => {
                const [type, id] = item.split("-");

                if (type === "cat") category_ids.push(id);
                if (type === "sub") sub_category_ids.push(id);
                if (type === "subsub") sub_sub_category_ids.push(id);
            });

            category_ids.forEach(id => formData.append("category_ids[]", id));
            sub_category_ids.forEach(id => formData.append("sub_category_ids[]", id));
            sub_sub_category_ids.forEach(id => formData.append("sub_sub_category_ids[]", id));

            formData.append("minimum_qty", minimumQuantity || "1");
            formData.append("free_shipping", isFreeShipping || "0");
            formData.append("status", status || "active");
            formData.append("product_type_id", productTypeId || "");
            formData.append("description", description || "");
            formData.append("short_description", shortDescription || "");
            formData.append("offer_price", offerPrice || "0");
            formData.append("mrp", regularPrice || "0");
            formData.append("buy_price", buyPrice || "0");
            formData.append("current_stock", currentStock || "0");
            formData.append("total_sell_qty", soldQty || 0);
            formData.append("meta_title", metaTitle || "");
            formData.append("meta_keywords", metaKeywords || "");
            formData.append("meta_description", metaDescription || "");
            formData.append("sku", sku || "");
            formData.append("video_url", videoUrl || "");
            formData.append("_method", "put");

            const selectedType = productTypes?.find(t => t.id === productTypeId);
            const isCombo = selectedType?.name === "Combo Product";
            formData.append("is_combo", isCombo ? "1" : "0");

            comboProducts.forEach((p) => {
                formData.append("combo_product_ids[]", p.id);
            });

            if (thumbnail?.file || thumbnail?.path) {
                if (thumbnail.file) {
                    formData.append("image", thumbnail.file);
                } else if (thumbnail.path) {
                    formData.append("image", thumbnail.path);
                }

                if (thumbnail.width) {
                    formData.append("width", thumbnail.width);
                }

                if (thumbnail.height) {
                    formData.append("height", thumbnail.height);
                }
            }

            images.forEach((img) => {
                if (img.file) {
                    formData.append("gallery_images[]", img.file);
                } else {
                    formData.append("gallery_images[]", img.path);
                }

                formData.append("gallery_widths[]", img.width || "");
                formData.append("gallery_heights[]", img.height || "");
            });

            const uniqueAttributes = [...new Set(attributeValue.flat().filter((x) => x?.attribute_id).map((x) => x.attribute_id)),];

            const attributeSlotMap = {};
            uniqueAttributes.slice(0, 3).forEach((attrId, idx) => {attributeSlotMap[attrId] = idx + 1;});

            for (let i = 0; i < attributeValue.length; i++) {
                const items = attributeValue[i] || [];

                items.forEach((attr) => {
                    const slot = attributeSlotMap[attr.attribute_id];

                    if (slot) {
                        formData.append(`variations[${i}][attribute_value_id_${slot}]`,attr.id);
                    }
                });
            }

            variationBuyPrice.forEach((val, i) => {
                if (val !== undefined && val !== "") {
                    formData.append(`variations[${i}][buy_price]`, val || "0");
                }
            });

            variationRegularPrice.forEach((val, i) => {
                if (val !== undefined && val !== "") {
                    formData.append(`variations[${i}][mrp]`, val || "0");
                }
            });

            variationOfferPrice.forEach((val, i) => {
                if (val !== undefined && val !== "") {
                    formData.append(`variations[${i}][offer_price]`, val || "0");
                }
            });

            itemCurrentStock.forEach((val, i) => {
                if (val !== undefined && val !== "") {
                    formData.append(`variations[${i}][current_stock]`, val || "1");
                }
            });

            isDefault.forEach((val, i) => {
                if (val !== undefined) {
                    formData.append(`variations[${i}][is_default]`, val ? 1 : 0);
                }
            });

            colorImages.forEach((img, i) => {
                if (img?.file) {
                    formData.append(`variations[${i}][image]`, img.file);
                } 
                else if (img?.path) {
                    formData.append(`variations[${i}][image]`, img.path);
                }
            });

            variationDescription.forEach((val, i) => {
                if (val !== undefined && val !== "") {
                    formData.append(`variations[${i}][description]`, val || "");
                }
            });

            deletedGalleryIds.forEach(id =>
                formData.append("delete_gallery_image_ids[]", id)
            );

            variationIds.forEach((vid, i) => {
                if (vid) {
                    formData.append(`variations[${i}][id]`, vid);
                }
            });

            const res = await postData(`/admin/products/${id}`, formData);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: "Product updated successfully!",
                });
                
                navigate(`/products?page=${page}&paginate_size=${pageSize}`);
            } else {
                setErrors(res.errors || {});
                
                messageApi.open({
                    type: "error",
                    content: "Update failed!",
                });
            }
        } catch {
            message.error("An error occurred while updating");
        } finally {
            setLoading(false);
        }
    };

    const modules = useMemo(() => ({
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
        history: {
            delay: 500,
            maxStack: 100,
            userOnly: true,
        },
    }), []);

    const regular = Number(regularPrice);
    const offer   = Number(offerPrice);

    const isInvalidOffer = offerPrice !== "" && regularPrice !== "" && !Number.isNaN(regular) && !Number.isNaN(offer) && offer > regular;

    const selectedProductType = productTypes?.find(t => t.id === productTypeId);
    const isComboProduct = selectedProductType?.name === "Combo Product";

    return (
        <div style={{ background: '#f4f7fe', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            
                <div style={{
                    background: '#fff',
                    padding: '16px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24
                }}>
                    <Space size="middle">
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => window.history.back()} 
                            style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px' }}
                        />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Edit Product</Title>
                                <Tag color="blue" style={{ borderRadius: '4px', fontWeight: 600 }}>ID: {productId}</Tag>
                            </div>
                            <Permalink slug={slug} setSlug={setSlug} productId={productId} settings={settings}/>
                        </div>
                    </Space>
                    <Space>
                        <Button 
                            icon={<CloseOutlined />} 
                            onClick={() => window.history.back()}
                            style={{ borderRadius: '8px' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<SaveOutlined />}
                            onClick={handleSubmit} 
                            loading={loading} 
                            disabled={isInvalidOffer}
                            style={{ 
                                borderRadius: '8px', 
                                background: '#2563eb', 
                                height: '40px', 
                                padding: '0 24px',
                                fontWeight: 600,
                                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            Update Product
                        </Button>
                    </Space>
                </div>

                <div style={{ padding: '0 24px' }}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                                {/* General Information */}
                                <Card 
                                    title={<Space><InfoCircleOutlined style={{ color: '#3b82f6' }} />General Information</Space>}
                                    variant="borderless"
                                    style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                >
                                    <Form layout="vertical">
                                        <Row gutter={20}>
                                            <Col span={24}>
                                                <Form.Item label={<Text strong style={{ color: '#475569' }}>Product Name</Text>} required>
                                                    <Input 
                                                        size="large"
                                                        value={title} 
                                                        onChange={(e) => setTitle(e.target.value)} 
                                                        placeholder="Enter product name" 
                                                        status={errors?.name ? "error" : ""}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                    {errors?.name && (
                                                        <div style={{ color: "#ef4444", marginTop: 4, fontSize: '12px' }}>
                                                            {errors.name.map((error, index) => (
                                                                <div key={index}>{error}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Form.Item>
                                            </Col>
                        
                                            <Col span={8}>
                                                <Form.Item label="Brand">
                                                    <Select 
                                                        size="large"
                                                        placeholder="Select Brand" 
                                                        value={brandId || undefined} 
                                                        onChange={setBrandId} 
                                                        options={(brands|| []).map((b) => ({label: b.name,value: b.id,}))}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                </Form.Item>
                                            </Col>
        
                                            <Col span={8}>
                                                <Form.Item label="Status">
                                                    <Select 
                                                        size="large"
                                                        placeholder="Select Status" 
                                                        value={status || undefined} 
                                                        onChange={setStatus} 
                                                        options={[{ label: "Active", value: "active" },{ label: "Inactive", value: "inactive" },]}
                                                    />
                                                </Form.Item>
                                            </Col>
        
                                            <Col span={8}>
                                                <Form.Item label="Product Type">
                                                    <Select size="large" placeholder="Select Type" value={productTypeId || undefined} onChange={setProductTypeId} options={(productTypes || []).map((t) => ({label: t.name,value: t.id,}))}/>
                                                </Form.Item>
                                            </Col>

                                            {isComboProduct && (
                                                <Col span={24}>
                                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                                                        <Text strong style={{ display: 'block', marginBottom: 12, color: '#334155' }}>
                                                            <AppstoreOutlined style={{ marginRight: 6 }} />Combo Products
                                                        </Text>
                                                        <Select
                                                            showSearch
                                                            size="large"
                                                            placeholder="Search and select products for combo..."
                                                            value={undefined}
                                                            onSearch={setComboSearchQuery}
                                                            onChange={(value) => {
                                                                const product = comboSearchResults.find(p => p.id === value);
                                                                if (product && !comboProducts.find(p => p.id === product.id)) {
                                                                    setComboProducts(prev => [...prev, product]);
                                                                }
                                                                setComboSearchQuery("");
                                                            }}
                                                            filterOption={false}
                                                            loading={comboSearchLoading}
                                                            notFoundContent={comboSearchQuery ? "No products found" : "Type to search..."}
                                                            options={comboSearchResults
                                                                .filter(p => !comboProducts.find(cp => cp.id === p.id))
                                                                .map(p => ({
                                                                    label: p.name,
                                                                    value: p.id,
                                                                    product: p,
                                                                }))}
                                                            optionRender={(option) => (
                                                                <Space size={10}>
                                                                    {option.data.product?.image && (
                                                                        <img src={option.data.product.image} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                                                                    )}
                                                                    <span>{option.data.product?.name}</span>
                                                                </Space>
                                                            )}
                                                            style={{ width: '100%', borderRadius: 8 }}
                                                        />
                                                        {comboProducts.length > 0 && (
                                                            <div style={{ marginTop: 12 }}>
                                                                <Divider orientation="left" style={{ fontSize: 12, margin: '8px 0', color: '#64748b' }}>
                                                                    Selected Products ({comboProducts.length})
                                                                </Divider>
                                                                <Row gutter={[8, 8]}>
                                                                    {comboProducts.map(product => (
                                                                        <Col key={product.id} xs={24} sm={12}>
                                                                            <Card
                                                                                size="small"
                                                                                style={{ borderRadius: 8, background: '#fff' }}
                                                                            >
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                                                        {product.image && (
                                                                                            <img
                                                                                                src={product.image}
                                                                                                alt=""
                                                                                                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                                                                                            />
                                                                                        )}
                                                                                        <div style={{ minWidth: 0 }}>
                                                                                            <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</Text>
                                                                                            <Text type="secondary" style={{ fontSize: 11 }}>৳{product.sell_price || product.mrp || "N/A"}</Text>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button
                                                                                        type="text"
                                                                                        danger
                                                                                        size="small"
                                                                                        icon={<DeleteOutlined />}
                                                                                        onClick={() => setComboProducts(prev => prev.filter(p => p.id !== product.id))}
                                                                                        style={{ flexShrink: 0 }}
                                                                                    />
                                                                                </div>
                                                                            </Card>
                                                                        </Col>
                                                                    ))}
                                                                </Row>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            )}
                        
                                            <Col span={8}>
                                                <Form.Item label="Sold Quantity">
                                                    <Input size="large" value={soldQty} onChange={(e) => setSoldQty(e.target.value)} placeholder="0"/>
                                                </Form.Item>
                                            </Col>
                        
                                            <Col span={8}>
                                                <Form.Item label="Free Shipping">
                                                    <Select size="large" value={isFreeShipping} onChange={setIsFreeShipping} options={[{ label: "No", value: "0" },{ label: "Yes", value: "1" },]}/>
                                                </Form.Item>
                                            </Col>
        
                                            <Col span={8}>
                                                <Form.Item label="Stock Quantity">
                                                    <Input size="large" placeholder="0" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)}/>
                                                </Form.Item>
                                            </Col>
        
                                            <Col span={8}>
                                                <Form.Item label="Min. Order Qty" required>
                                                    <Input size="large" placeholder="1" value={minimumQuantity} onChange={(e) => setMinimumQuantity(e.target.value)}/>
                                                </Form.Item>
                                            </Col>
        
                                            <Col span={8}>
                                                <Form.Item label="Product SKU">
                                                    <Input size="large" prefix={<BarcodeOutlined style={{ color: '#94a3b8' }} />} value={sku} onChange={(e) => setSku(e.target.value)}/>
                                                </Form.Item>
                                            </Col>
        
                                            <Col span={8}>
                                                <Form.Item label="Video URL">
                                                    <Input size="large" placeholder="YouTube/Vimeo link" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}/>
                                                </Form.Item>
                                            </Col>
                        
                                            <Col span={24}>
                                                <Form.Item label="Short Description">
                                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <ReactQuill theme="snow" value={shortDescription} onChange={setShortDescription} placeholder="Write a brief overview..." modules={modules} style={{ height: "200px", border: 'none' }}/>
                                                    </div>
                                                    <div style={{ height: '45px' }}></div>
                                                </Form.Item>
                                            </Col>
                        
                                            <Col span={24}>
                                                <Form.Item label="Full Description">
                                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <ReactQuill theme="snow" value={description} onChange={setDescription} placeholder="Detailed product specifications..." modules={modules} style={{ height: "350px", border: 'none' }}/>
                                                    </div>
                                                    <div style={{ height: '45px' }}></div>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card>

                                {/* Media Section */}
                                <Card 
                                    title={<Space><PlusOutlined style={{ color: '#3b82f6' }} />Product Media</Space>}
                                    variant="borderless"
                                    style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                >
                                    <Row gutter={[20, 20]}>
                                        <Col xs={24} md={10}>
                                            <div className="media-picker-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
                                                <Text strong style={{ display: "block", marginBottom: 12, fontSize: '14px' }}>
                                                    Main Thumbnail <span style={{ color: "#ff4d4f" }}>*</span>
                                                </Text>
                                                <ProductImagePicker name="image" gallery={gallery} hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)} onChange={handleImageChange} onUploadSuccess={(newImages) => { setGallery(prev => [...newImages, ...prev]);}} initialValue={thumbnailPreview}/>
                                                {errors?.image && (
                                                    <div style={{ color: "#ef4444", marginTop: 8, fontSize: '12px' }}>
                                                        {errors.image.map((error, index) => (
                                                            <div key={index}>{error}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                        <Col xs={24} md={14}>
                                            <div className="media-picker-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
                                                <Text strong style={{ display: "block", marginBottom: 12, fontSize: '14px' }}>
                                                    Product Gallery
                                                </Text>
                                                <ProductGalleryPicker gallery={gallery} hasMore={hasMore} fetchMore={() => fetchMedia(page + 1)} loadingMore={loadingMore} onChange={handleGalleryImageFileChange} onUploadSuccess={(newImages) => { setGallery(prev => [...newImages, ...prev]); }} initialValues={imagePreview}/>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Space>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                                {/* Categories Section */}
                                <Card 
                                    title={<Space><AppstoreOutlined style={{ color: '#3b82f6' }} />Categorization</Space>}
                                    variant="borderless"
                                    style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                >
                                    <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                                        <Checkbox.Group style={{ width: "100%" }} value={categoryIds} onChange={(checkedValues) => setCategoryIds(checkedValues)}>
                                            {categories?.map(category => (
                                                <div key={category.id} style={{ marginBottom: 16, background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                                    <Checkbox value={`cat-${category.id}`}>
                                                        <Text strong style={{ fontSize: '14px', color: '#1e293b' }}>{category.name}</Text>
                                                    </Checkbox>
                                                    
                                                    <div style={{ marginLeft: 24, marginTop: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {category.sub_categories?.map(sub => (
                                                            <div key={sub.id}>
                                                                <Checkbox value={`sub-${sub.id}`}>
                                                                    <Text style={{ fontSize: '13px' }}>{sub.name}</Text>
                                                                </Checkbox>
                                                                
                                                                <div style={{ marginLeft: 24, marginTop: 6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {sub.sub_sub_categories?.map(subsub => (
                                                                        <Checkbox key={subsub.id} value={`subsub-${subsub.id}`}>
                                                                            <Text type="secondary" style={{ fontSize: '12px' }}>{subsub.name}</Text>
                                                                        </Checkbox>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </Checkbox.Group>
                                    </div>
                                </Card>
                            </Space>
                        </Col>
                    </Row>

                    {/* Pricing & Variation Section */}
                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col span={24}>
                            <Card 
                                id="pricing-design-a" 
                                title={<Space><DollarOutlined style={{ color: '#3b82f6' }} />Pricing & Variations</Space>}
                                variant="borderless"
                                style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                extra={
                                    <Space>
                                        <Button type="default" icon={<PlusOutlined />} onClick={addVariationField} style={{ borderRadius: '6px' }}>
                                            Add Single
                                        </Button>
                                        <Button type="primary" icon={<RocketOutlined />} onClick={() => setVariationMultiplyModal(true)} style={{ borderRadius: '6px', background: '#0ea5e9' }}>
                                            Variation Wizard
                                        </Button>
                                    </Space>
                                }
                            >
                                <Row justify="space-between" style={{ marginBottom: 16 }}>
                                    <Col>
                                        {dynamicInputs.length > 0 && (
                                            <Button danger ghost icon={<DeleteOutlined />} disabled={selectedVariationRows.length === 0} onClick={handleBulkDeleteVariations} style={{ borderRadius: '6px' }}>
                                                Bulk Delete ({selectedVariationRows.length})
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
            
                            {dynamicInputs.length > 0 ? (
                                <div style={{ overflowX: "auto" }}>
                                    <Table bordered pagination={false} scroll={{ x: true }} dataSource={dynamicInputs.map((_, index) => ({key: index,index}))}
                                        columns={[
                                        {
                                            title: (
                                                <input type="checkbox" checked={selectAllVariations} onChange={(e) => handleSelectAllVariations(e.target.checked)}/>
                                            ),
                                            dataIndex: "select",
                                            width: 50,
                                            render: (_, record) => (
                                                <input type="checkbox" checked={selectedVariationRows.includes(record.index)} onChange={(e) => handleSelectVariationRow(record.index,e.target.checked)}/>
                                            ),
                                        },
                                        {
                                            title: "Variations",
                                            dataIndex: "variations",
                                            width: 250,
                                            render: (_, record) => (
                                                <Space direction="vertical" style={{ width: "100%" }}>
                                                    <Select mode="multiple" placeholder="Select Attributes" style={{ width: "100%" }} value={selectedAttributeId[record.index] || []} onChange={(val) => {
                                                        let updated = [...selectedAttributeId];
                                                        updated[record.index] = val;
                                                        setSelectedAttributeId(updated);
                                                        handleAttributeValue(record.index, val);
                                                    }}
                                                    options={(allVariations?.data || []).map((v) => ({label: v.name,value: v.id,}))}/>
                                                    {attributes[record.index]?.map((attr, i) => {
                                                        const currentValue = attributeValue[
                                                            record.index
                                                        ]?.find((val) => val.attribute_id === attr.id);
                        
                                                        return (
                                                            <Select key={i} placeholder={`Select ${attr.name}`} style={{ width: "100%" }} value={currentValue?.id || undefined}
                                                            onChange={(val) => {
                                                                let updated = [...attributeValue];
                                                                if (!updated[record.index])
                                                                updated[record.index] = [];
                            
                                                                updated[record.index] = updated[
                                                                record.index
                                                                ].filter((v) => v.attribute_id !== attr.id);
                            
                                                                const selectedValue = attr.values.find((v) => v.id === val);
                                                                if (selectedValue) {
                                                                    updated[record.index].push(selectedValue);
                                                                }
                            
                                                                setAttributeValue(updated);
                                                            }}
                                                            options={(attr.values || []).map((v) => ({label: v.value,value: v.id,}))}
                                                            />
                                                        );
                                                    })}
                                                </Space>
                                            ),
                                        },
                                        {
                                            title: "Regular Price",
                                            dataIndex: "regularPrice",
                                            width: 130,
                                            render: (_, record) => (
                                                <Input placeholder="0" value={variationRegularPrice[record.index]} onChange={(e) => updateVariationField(record.index,"regularPrice",e.target.value)}/>
                                            ),
                                        },
                                        {
                                            title: "Offer Price",
                                            dataIndex: "offerPrice",
                                            width: 120,
                                            render: (_, record) => (
                                                <Input placeholder="0" value={variationOfferPrice[record.index]} onChange={(e) => updateVariationField(record.index,"offerPrice",e.target.value)}/>
                                            ),
                                        },
                                        {
                                            title: "Stock",
                                            dataIndex: "stock",
                                            width: 100,
                                            render: (_, record) => (
                                                <Input placeholder="1" value={itemCurrentStock[record.index]} onChange={(e) =>updateVariationField(record.index,"stock",e.target.value)}/>
                                            ),
                                        },
                                        {
                                            title: "Default",
                                            dataIndex: "default",
                                            width: 100,
                                            render: (_, record) => (
                                                <Select placeholder="No" value={isDefault[record.index]} onChange={(val) => updateVariationField(record.index, "default", val)} options={[{ label: "No", value: 0 },{ label: "Yes", value: 1 }]}/>
                                            ),
                                        },
                                        {
                                            title: "Image",
                                            dataIndex: "image",
                                            width: 150,
                                            render: (_, record) => (
                                                <Space direction="vertical" style={{ width: "100%" }}>
                                                    <ProductImagePicker gallery={gallery} hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)} onChange={(data) => handleColorImageChange(data, record.index)}/>

                                                    {colorImagePreview[record.index] && (
                                                        <div style={{ position: "relative", display: "inline-block" }}>
                                                            <Image src={colorImagePreview[record.index]} alt={`Variation ${record.index + 1}`}
                                                                style={{
                                                                    width       : 50,
                                                                    height      : 50,
                                                                    objectFit   : "cover",
                                                                    borderRadius: 4,
                                                                }}
                                                            />

                                                            <Button type="text" danger icon={<DeleteOutlined />}
                                                                onClick={() => {
                                                                    const newImages = [...colorImages];
                                                                    const newPreview = [...colorImagePreview];

                                                                    newImages[record.index] = null;
                                                                    newPreview[record.index] = null;

                                                                    setColorImages(newImages);
                                                                    setColorImagePreview(newPreview);
                                                                }}
                                                                style={{
                                                                    position      : "absolute",
                                                                    top           : -8,
                                                                    right         : -8,
                                                                    background    : "#ff4d4f",
                                                                    color         : "white",
                                                                    borderRadius  : "50%",
                                                                    width         : 20,
                                                                    height        : 20,
                                                                    minWidth      : 20,
                                                                    display       : "flex",
                                                                    alignItems    : "center",
                                                                    justifyContent: "center",
                                                                    fontSize      : 10,
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </Space>
                                            ),
                                        },
                                        {
                                            title: "Description",
                                            dataIndex: "description",
                                            width: 200,
                                            render: (_, record) => (
                                                <Input.TextArea placeholder="Description" rows={2} value={variationDescription[record.index]} onChange={(e) =>updateVariationField(record.index,"description",e.target.value)}/>
                                            ),
                                        },
                                        {
                                            title: "Action",
                                            dataIndex: "action",
                                            fixed: "right",
                                            width: 80,
                                            render: (_, record) => (
                                                <Button danger size="small" onClick={() => removeVariationField(record.index)}>
                                                    Delete
                                                </Button>
                                            ),
                                        },
                                        ]}
                                    />
                                </div>
                            ) : (
                                <Card size="small" bordered style={{ background: "#f8fbff" }}>
                                    <Space align="center">
                                        <Tag color="#1677ff" style={{ marginRight: 8 }}>
                                            $
                                        </Tag>
                                        <Text strong>Product Pricing (Without Variation)</Text>
                                    </Space>

                                    <Row gutter={12} style={{ marginTop: 12 }}>
                                        <Col xs={24} lg={8}>
                                            <Form layout="vertical">
                                                <Form.Item label="Regular Price" required>
                                                    <Input placeholder="Enter Regular Price" value={regularPrice} onChange={(e) => setRegularPrice(e.target.value)} status={errors?.mrp ? "error" : ""}/>

                                                    {errors?.mrp && (
                                                        <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                                                            {errors.mrp.map((error, index) => (
                                                                <div key={index}>{error}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Form.Item>
                                            </Form>
                                        </Col>

                                        <Col xs={24} lg={8}>
                                            <Form layout="vertical">
                                                <Form.Item label="Offer Price" validateStatus={isInvalidOffer ? "error" : ""} help={isInvalidOffer ? "Offer price cannot be greater than regular price" : "" }>
                                                    <Input placeholder="Enter Offer Price" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)}/>
                                                </Form.Item>
                                            </Form>
                                        </Col>
                                    </Row>

                                </Card>
                            )}
                        </Card>
                    </Col>
                </Row>
            
                {/* SEO Information */}
                    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                        <Col span={24}>
                            <Card 
                                title={<Space><GlobalOutlined style={{ color: '#3b82f6' }} />SEO & Search Discovery</Space>}
                                variant="borderless"
                                style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            >
                                <Form layout="vertical">
                                    <Row gutter={20}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Meta Title">
                                                <Input size="large" placeholder="Enter SEO Title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)}/>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Meta Keywords">
                                                <Input size="large" placeholder="e.g. fashion, summer, dress" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item label="Meta Description">
                                                <Input.TextArea rows={4} placeholder="Enter a search-friendly description..." value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)}/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </div>
        
            <Modal title="Please Choose Your Variations" open={variationMultiplyModal} onCancel={() => setVariationMultiplyModal(false)} onOk={handleVariationMultiplySubmit} okText="Submit" width={800}>
                <Form layout="vertical">
                    <Form.Item label="Variations">
                        <Select mode="multiple" placeholder="Select Variations" value={selectedVariationId} onChange={(value) => {setSelectedVariationId(value);
                            const removedAttributeIds = selectedVariationId.filter((id) => !value.includes(id));
                                if (removedAttributeIds.length > 0) {
                                    setSelectedVariationValues((prev) => prev.filter((val) => !removedAttributeIds.includes(val.attribute_id)));
                                }
                            }}
                            options={(allVariations?.data || []).map((v) => ({label: v.name,value: v.id,}))} style={{ width: "100%" }}
                        />
                    </Form.Item>
        
                    {selectedVariationId.map((attrId) => {const attribute = (allVariations?.data || []).find((v) => v.id === attrId);

                        if (!attribute) return null;
            
                        const currentValues = selectedVariationValues.filter((v) => v.attribute_id === attrId);
            
                        return (
                            <Form.Item key={attrId} label={`Select ${attribute.name} Values`}>
                                <Select mode="multiple" placeholder={`Select ${attribute.name} values`} value={currentValues.map((v) => v.id)} onChange={(valueIds) => {
                                        const otherValues = selectedVariationValues.filter((v) => v.attribute_id !== attrId);
                    
                                        const newValues = (attribute.values || []).filter((v) => valueIds.includes(v.id));
                    
                                        setSelectedVariationValues([...otherValues, ...newValues]);
                                    }}
                                    options={(attribute.values || []).map((v) => ({label: v.value,value: v.id}))} style={{ width: "100%" }}
                                />
                            </Form.Item>
                        );
                    })}
        
                    <div style={{ marginBottom: 12 }}>
                        <Text strong style={{ display: "block", marginBottom: 8 }}>
                            Selected Variation Values:
                        </Text>

                        {selectedVariationValues.map((tag) => (
                            <Tag key={tag.id} color="blue" closable onClose={() => {setSelectedVariationValues((prev) =>prev.filter((v) => v.id !== tag.id));}} style={{ marginBottom: 6, marginRight: 6 }}>
                                {tag.value}
                            </Tag>
                        ))}

                        {selectedVariationValues.length === 0 && (
                            <Text type="secondary" style={{ fontStyle: "italic" }}>
                                No variation values selected yet
                            </Text>
                        )}
                    </div>
        
                    {selectedVariationValues.length > 0 && (
                        <div style={{marginBottom: 12,padding: 12,background: "#f0f2f5",borderRadius: 6,}}>
                            <Text strong style={{ display: "block", marginBottom: 8 }}>
                                Preview - Combinations that will be created:
                            </Text>
                            {(() => {
                                const groupedValues = {};
                                selectedVariationValues.forEach((value) => {
                                    if (!groupedValues[value.attribute_id]) {
                                        groupedValues[value.attribute_id] = [];
                                    }
                                    groupedValues[value.attribute_id].push(value);
                                });
            
                                const attributeGroups = Object.values(groupedValues);
                                let combinations = [];
                
                                if (attributeGroups.length === 3) {
                                    combinations = attributeGroups[0].flatMap((v1) => attributeGroups[1].flatMap((v2) => attributeGroups[2].map((v3) => [v1.value,v2.value,v3.value,])));
                                } else if (attributeGroups.length === 2) {
                                    combinations = attributeGroups[0].flatMap((v1) => attributeGroups[1].map((v2) => [v1.value, v2.value]));
                                } else {
                                    combinations = attributeGroups[0].map((v1) => [v1.value]);
                                }
            
                                return (
                                    <div>
                                        {combinations.map((combo, index) => (
                                            <Tag key={index} color="green" style={{ marginBottom: 4, marginRight: 4 }}>
                                                {combo.join(" + ")}
                                            </Tag>
                                        ))}
                                        
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary">
                                                Total variations: {combinations.length}
                                            </Text>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
        
                    <Form.Item label="Buy Price">
                        <Input placeholder="Enter Buy Price" value={multiBuyPrice} onChange={(e) => setMultiBuyPrice(e.target.value)}/>
                    </Form.Item>

                    <Form.Item label="Regular Price">
                        <Input placeholder="Enter Regular Price" value={multiRegularPrice} onChange={(e) => setMultiRegularPrice(e.target.value)}/>
                    </Form.Item>

                    <Form.Item label="Offer Price">
                        <Input placeholder="Enter Offer Price" value={multiOfferPrice} onChange={(e) => setMultiOfferPrice(e.target.value)}/>
                    </Form.Item>

                    <Form.Item label="Current Stock">
                        <Input placeholder="Enter Stock" value={multiStock} onChange={(e) => setMultiStock(e.target.value)}/>
                    </Form.Item>

                    <Form.Item label="Is Default">
                        <Select placeholder="Select Default" value={multiIsDefault} onChange={setMultiIsDefault} options={[{ label: "No", value: 0 },{ label: "Yes", value: 1 },]}/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
