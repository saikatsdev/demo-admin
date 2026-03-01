import { ArrowLeftOutlined, DeleteOutlined, InboxOutlined, PlusOutlined } from "@ant-design/icons";
import {Button,Card,Col,Divider,Form,Image,Input,message,Modal,Row,Select,Space,Table,Tag,Typography,Upload} from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams,useSearchParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {useAppSettings} from "../../contexts/useAppSettings";
import Permalink from "../../components/products/Permalink";

const { Title, Text } = Typography;

export default function ProductEdit() {
    // Hook
    useTitle("Edit Product");
    const { settings} = useAppSettings();
	
	const [searchParams] = useSearchParams();
    const page = searchParams.get("page") || 1;
    const pageSize = searchParams.get("pageSize") || 10;

    const { id }   = useParams();
    const navigate = useNavigate();

    const [loading, setLoading]                                     = useState(false);
    const [errors, setErrors]                                       = useState({});
    const [title, setTitle]                                         = useState("");
    const [productId, setProductId]                                 = useState("");
    const [categoryId, setCategoryId]                               = useState([]);
    const [subCategoryId, setSubCategoryId]                         = useState("");
    const [subSubCategoryId, setSubSubCategoryId]                   = useState("");
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
    const [categories, setCategories]                               = useState(null);
    const [subCategories, setSubCategories]                         = useState([]);
    const [subSubCategories, setSubSubCategories]                   = useState([]);
    const [subCategoryLoading, setSubCategoryLoading]               = useState(false);
    const [subSubCategoryLoading, setSubSubCategoryLoading]         = useState(false);
    const [brands, setBrands]                                       = useState(null);
    const [productTypes, setProductTypes]                           = useState(null);
    const [isSubCategoryShow, setIsSubCategoryShow]                 = useState(false);
    const [isSubSubCategoryShow, setIsSubSubCategoryShow]           = useState(false);
    const [isStockMaintain, setIsStockMaintain]                     = useState(false);
    const [isStockMaintainWithDirect, setIsStockMaintainWithDirect] = useState(false);
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
    const [thumbnailWidth, setThumbnailWidth]                       = useState(null);
    const [thumbnailHeight, setThumbnailHeight]                     = useState(null);
    const [galleryWidths, setGalleryWidths]                         = useState([]);
    const [galleryHeights, setGalleryHeights]                       = useState([]);

    const galleryProcessedFiles = useRef(new Set());

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

                const categoryIds = Array.isArray(p.categories) && p.categories.length? p.categories.map(c => c.id) : p.categories?.id ? [p.categories.id] : [];

                setTitle(p.name || "");
                setCategoryId(categoryIds);
                setSoldQty(p.total_sell_qty);
                setSlug(p.slug);

                if (categoryIds.length > 0) {
                    try {
                        const subRes = await getDatas("/admin/sub-categories/list", {category_ids: categoryIds});
                        if (subRes?.success && subRes?.result) {
                            let categories = [];

                            if (Array.isArray(subRes.result)) {
                                categories = subRes.result;
                            } else if (
                                subRes.result.data &&
                                Array.isArray(subRes.result.data)
                            ) {
                                categories = subRes.result.data;
                            } else if (
                                typeof subRes.result === "object" &&
                                subRes.result.id
                            ) {
                                categories = [subRes.result];
                            }

                            setSubCategories(categories);
                        }
                    } catch (error) {
                        console.error("Error loading subcategories:", error);
                        setSubCategories([]);
                    }
                }

                if (p.sub_category?.id) {
                    try {
                        const subSubRes = await getDatas("/admin/sub-sub-categories", {sub_category_id : p.sub_category.id});
                        
                        if (subSubRes?.success && subSubRes?.result) {
                            let categories = [];

                            if (Array.isArray(subSubRes.result)) {
                                categories = subSubRes.result;
                            } else if (
                                subSubRes.result.data &&
                                Array.isArray(subSubRes.result.data)
                            ) {
                                categories = subSubRes.result.data;
                            } else if (
                                typeof subSubRes.result === "object" &&
                                subSubRes.result.id
                            ) {
                                categories = [subSubRes.result];
                            }

                            setSubSubCategories(categories);
                        }
                    } catch (error) {
                        console.error("Error loading sub-subcategories:", error);
                        setSubSubCategories([]);
                    }
                }

                setProductId(p.id || "");
                setSubCategoryId(p.sub_category?.id);
                setSubSubCategoryId(p.sub_sub_category?.id || "");
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

                // Images
                setImagePreview(
                    p.images.map(img => ({
                        id  : img.id,
                        url : img.image,
                        type: "old"
                    }))
                );

                if (p.variations?.length > 0) setProductData(p);
            }
        };
        init();
    }, [id]);

    useEffect(() => {
        if (!settings) return;

        const subShow             = settings.is_sub_category_show;
        const subSubShow          = settings.is_sub_sub_category_show;
        const stockMaintain       = settings.is_stock_maintain;
        const stockMaintainDirect = settings.is_stock_maintain_with_direct_product;

        setIsSubCategoryShow(subShow === "1");
        setIsSubSubCategoryShow(subSubShow === "1");
        setIsStockMaintain(stockMaintain === "1");
        setIsStockMaintainWithDirect(stockMaintainDirect === "1");
    }, [settings]);

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

    const handleCategoryChange = async (values) => {
        setCategoryId(values);
        setSubCategoryId("");
        setSubSubCategoryId("");
        setSubCategories([]);
        setSubSubCategories([]);

        if (!values || values.length === 0) return;

        setSubCategoryLoading(true);

        try {
            const res = await getDatas("/admin/sub-categories/list", {category_ids:values});

            if (res?.success && res?.result) {
                let categories = [];

                if (Array.isArray(res.result)) {
                    categories = res.result;
                }else if (res.result && Array.isArray(res.result || [])) {
                    categories = res.result;
                }else if (typeof res.result === "object" && res.result.id) {
                    categories = [res.result];
                }

                setSubCategories(categories);
            } else {
                setSubCategories([]);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            setSubCategories([]);
            message.error("Failed to load subcategories");
        } finally {
            setSubCategoryLoading(false);
        }
    };

    const handleSubCategoryChange = async (value) => {
        setSubCategoryId(value);
        setSubSubCategoryId("");
        setSubSubCategories([]);
        if (!value) return;

        setSubSubCategoryLoading(true);
        try {
            const res = await getDatas("/admin/sub-sub-categories", {sub_category_id:value});

            if (res?.success && res?.result) {
                let categories = [];

                if (Array.isArray(res.result)) {
                    categories = res.result;
                }else if (res.result.data && Array.isArray(res.result.data)) {
                    categories = res.result.data;
                }else if (typeof res.result === "object" && res.result.id) {
                    categories = [res.result];
                }

                setSubSubCategories(categories);
            } else {
                setSubSubCategories([]);
            }
        } catch (error) {
            console.error("Error fetching sub-subcategories:", error);
            setSubSubCategories([]);
            message.error("Failed to load sub-subcategories");
        } finally {
            setSubSubCategoryLoading(false);
        }
    };

    const singleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
            message.error("Please select a valid image file (jpg, jpeg, png, webp, gif)");
            return;
        }

        setThumbnail(file);

        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = function () {
            setThumbnailWidth(img.width);
            setThumbnailHeight(img.height);

            URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;

        const reader = new FileReader();
        reader.onload = (e) => {
            setThumbnailPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGalleryImageFileChange = (info) => {
        const { fileList } = info;
        const newFiles = fileList.filter((file) => file.originFileObj);

        const unprocessedFiles = newFiles.filter((file) => {
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            return !galleryProcessedFiles.current.has(fileKey);
        });

        if (unprocessedFiles.length > 0) {
            const validImages = unprocessedFiles.filter((file) =>
                /\.(jpe?g|png|webp|gif)$/i.test(file.name)
            );

            if (validImages.length !== unprocessedFiles.length) {
                message.error("Some files are not valid image formats");
            }

            validImages.forEach((file) => {
                const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
                galleryProcessedFiles.current.add(fileKey);

                setImages((prev) => [...prev, file.originFileObj]);

                const img = new window.Image();
                const objectUrl = URL.createObjectURL(file.originFileObj);

                img.onload = function () {
                    setGalleryWidths((prev) => [...prev, img.width]);
                    setGalleryHeights((prev) => [...prev, img.height]);
                    URL.revokeObjectURL(objectUrl);
                };

                img.src = objectUrl;

                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreview((prev) => [...prev, e.target.result]);
                };
                reader.readAsDataURL(file.originFileObj);
            });
        }
    };

    const deleteImg = (index) => {
        const target = imagePreview[index];

        if (target?.type === "old" && target?.id) {
            setDeletedGalleryIds(prev =>
                prev.includes(target.id) ? prev : [...prev, target.id]
            );
        }

        setImagePreview(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
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

    const handleColorImageChange = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
            message.error("Please select a valid image file (jpg, jpeg, png, webp, gif)");
            return;
        }

        const newImages = [...colorImages];
        newImages[index] = file;
        setColorImages(newImages);

        const reader = new FileReader();
        reader.onload = () => {
            const newPreview = [...colorImagePreview];
            newPreview[index] = reader.result;
            setColorImagePreview(newPreview);
        };
        reader.readAsDataURL(file);
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

            categoryId.forEach(id => {
                formData.append("category_ids[]", id);
            });

            formData.append("sub_category_id", subCategoryId || "");
            formData.append("sub_sub_category_id", subSubCategoryId || "");
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
            // formData.append("width", width || "1000");
            // formData.append("height", height || "1000");
            formData.append("video_url", videoUrl || "");
            formData.append("_method", "put");

            if (thumbnail) {
                formData.append("image", thumbnail);
                formData.append("width", thumbnailWidth || "1000");
                formData.append("height", thumbnailHeight || "1000");
            }

            images.forEach((image, index) => {
                formData.append("gallery_images[]", image);
                formData.append("gallery_widths[]", galleryWidths[index] || "");
                formData.append("gallery_heights[]", galleryHeights[index] || "");
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
                if (img) {
                    formData.append(`variations[${i}][image]`, img);
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

            const res = await postData(`/admin/products/${id}`, formData, {headers: { "Content-Type": "multipart/form-data" },});

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
                
                navigate(`/products?page=${page}&pageSize=${pageSize}`);
            } else {
                setErrors(res.errors || {});
                
                messageApi.open({
                    type: "success",
                    content: "Update failed!",
                });
            }
        } catch {
            message.error("An error occurred while updating");
        } finally {
            setLoading(false);
        }
    };

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

    const regular = Number(regularPrice);
    const offer   = Number(offerPrice);

    const isInvalidOffer = offerPrice !== "" && regularPrice !== "" && !Number.isNaN(regular) && !Number.isNaN(offer) && offer > regular;

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="products-info-top">
                <Title level={3}>Edit Product</Title>
        
                <Permalink slug={slug} setSlug={setSlug} productId={productId} settings={settings}/>
        
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back
                </Button>
            </div>

            <Row gutter={16}>
                <Col xs={24} lg={16}>
                    <Card title="Product Information" bordered>
                        <Form layout="vertical">
                            <Row gutter={12}>
                                <Col span={24}>
                                    <Form.Item label="Product Name" required>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="" status={errors?.name ? "error" : ""}/>
                                    {errors?.name && (
                                        <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                                            {errors.name.map((error, index) => (
                                                <div key={index}>{error}</div>
                                            ))}
                                        </div>
                                    )}
                                    </Form.Item>
                                </Col>
            
                                <Col span={8}>
                                    <Form.Item label="Category" validateStatus={errors?.category_id ? "error" : ""} help={errors?.category_id?.[0]} required>
                                        <Select mode="multiple" placeholder="Categories" value={categoryId || undefined} loading={categories === null} onChange={handleCategoryChange} options={(categories || []).map((c) => ({label: c.name,value: c.id,}))}
                                        />
                                    </Form.Item>
                                </Col>
            
                                {isSubCategoryShow && (
                                    <Col span={8}>
                                        <Form.Item label="Sub Category">
                                            <Select placeholder="Sub Categories" value={subCategoryId} loading={subCategoryLoading} onChange={handleSubCategoryChange} options={(subCategories || []).map((sc) => ({label: sc.name,value: sc.id,}))}
                                        />
                    
                                        </Form.Item>
                                    </Col>
                                )}
            
                                {isSubSubCategoryShow && (
                                    <Col span={8}>
                                        <Form.Item label="Sub Sub Category">
                                            <Select placeholder="Sub Sub Categories" value={subSubCategoryId || undefined} loading={subSubCategoryLoading} onChange={(v) => setSubSubCategoryId(v)} options={(subSubCategories || []).map((ssc) => ({label: ssc.name,value: ssc.id}))}/>
                                        </Form.Item>
                                    </Col>
                                )}

                                <Col span={8}>
                                    <Form.Item label="Brand">
                                        <Select placeholder="Brand" value={brandId || undefined} onChange={setBrandId} options={(brands || []).map((b) => ({label: b.name,value: b.id,}))}/>
                                    </Form.Item>
                                </Col>

                                <Col span={8}>
                                    <Form.Item label="Status">
                                        <Select placeholder="Select" value={status || undefined} onChange={setStatus} options={[{label:"Active",value:"active"},{label:"Inactive",value:"inactive"}]}/>
                                    </Form.Item>
                                </Col>
            
                                <Col span={8}>
                                    <Form.Item label="Product Type">
                                        <Select placeholder="Select" value={productTypeId || undefined} onChange={setProductTypeId} options={(productTypes || []).map((t) => ({label: t.name,value: t.id,}))}/>
                                    </Form.Item>
                                </Col>
            
                                <Col span={8}>
                                    <Form.Item label="Sold Quantity">
                                        <Input value={soldQty} onChange={(e) => setSoldQty(e.target.value)} placeholder="0"/>
                                    </Form.Item>
                                </Col>
            
                                <Col span={8}>
                                    <Form.Item label="Is Free Shipping">
                                        <Select placeholder="Is Free Shipping" value={isFreeShipping} onChange={setIsFreeShipping} options={[{label: "No", value: "0" },{label: "Yes", value: "1" }]}/>
                                    </Form.Item>
                                </Col>

                                {isStockMaintain && (
                                    <Col span={8}>
                                        <Form.Item label="Current Stock">
                                            <Input placeholder="0" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} disabled={!isStockMaintainWithDirect}/>
                                        </Form.Item>
                                    </Col>
                                )}

                                <Col span={8}>
                                    <Form.Item label="Minimum Quantity" required>
                                        <Input placeholder="1" value={minimumQuantity} onChange={(e) => setMinimumQuantity(e.target.value)}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item label="Product SKU">
                                        <Input value={sku} onChange={(e) => setSku(e.target.value)}/>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item label="Video Url">
                                        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}/>
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item label="Short Description">
                                        <ReactQuill theme="snow" value={shortDescription} onChange={setShortDescription} placeholder="Write your product description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px"}}/>
                                    </Form.Item>
                                </Col>
            
                                <Col span={24}>
                                    <Form.Item label="Description">
                                        <ReactQuill theme="snow" value={description} onChange={setDescription} placeholder="Write your product description..." modules={modules} style={{backgroundColor: "#fff",borderRadius: 5,height: "300px",marginBottom: "20px",}}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Product Images" bordered>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            <div>
                                <Text strong style={{ display: "block", marginBottom: 8 }}>
                                    Thumbnail <span style={{ color: "#ff4d4f" }}>*</span>
                                </Text>
                                <input type="file" id="thumbnail-upload" accept="image/*" onChange={singleFileChange} style={{ display: "none" }}/>

                                <label htmlFor="thumbnail-upload">
                                    <div style={{border: "2px dashed #d9d9d9",borderRadius: 8,padding: "20px",textAlign: "center",cursor: "pointer",background: "#fafafa", transition: "all 0.3s",borderColor: errors?.image ? "#ff4d4f" : "#d9d9d9",}}>
                                        <InboxOutlined style={{fontSize: 48,color: "#bfbfbf",marginBottom: 16}}/>
                                        <div style={{ color: "#666" }}>Choose File</div>
                                    </div>
                                </label>

                                {errors?.image && (
                                    <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                                        {errors.image.map((error, index) => (
                                            <div key={index}>{error}</div>
                                        ))}
                                    </div>

                                )}

                                {thumbnailPreview && (
                                    <div style={{marginTop: 12,position: "relative",display: "inline-block"}}>

                                        <Image src={thumbnailPreview} alt="Thumbnail preview" style={{width: 100,height: 100, objectFit: "fill", borderRadius: 8}}/>

                                        <Button type="text"/>
                                    </div>
                                )}
                            </div>
            
                            <div>
                                <Text strong style={{ display: "block", marginBottom: 8 }}>
                                    Gallery Images
                                </Text>

                                <Upload multiple showUploadList={false} beforeUpload={() => false} onChange={handleGalleryImageFileChange} accept="image/*">
                                    <Button type="dashed" style={{ width: "100%" }}>
                                        Choose Files
                                    </Button>
                                </Upload>

                                {imagePreview.length > 0 && (
                                    <div style={{marginTop: 12,display: "flex",flexWrap: "wrap",gap: 8}}>
                                        {imagePreview.map((image, index) => (
                                            <div key={index} style={{position: "relative",display: "inline-block",}}>
                                                <Image src={image.url} alt={`Gallery ${index + 1}`} style={{width: 80,height: 80, objectFit: "cover",borderRadius: 8}}/>

                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteImg(index)}
                                                    style={{position: "absolute",top: -8,right: -8,background: "#ff4d4f",color: "white",borderRadius: "50%",width: 20,height: 20,minWidth: 20,display: "flex",alignItems: "center",justifyContent: "center",fontSize: 10}}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        
            <Divider />
        
            <Row gutter={16}>
                <Col xs={24} lg={24}>
                    <Card id="pricing-design-a" title="Product Price And Product Variation" bordered>
                        <Row justify="space-between" style={{ marginBottom: 12 }}>
                            <Col>
                                <Space>
                                    <Button type="default" icon={<PlusOutlined />} onClick={addVariationField}>
                                        Add Variation
                                    </Button>

                                    <Button type="default" icon={<PlusOutlined />} onClick={() => setVariationMultiplyModal(true)}>
                                        Variation Multiply
                                    </Button>

                                    {dynamicInputs.length > 0 && (
                                        <Button danger disabled={selectedVariationRows.length === 0} onClick={handleBulkDeleteVariations}>
                                            Delete Selected ({selectedVariationRows.length})
                                        </Button>
                                    )}
                                </Space>
                            </Col>

                            <Col>
                                {dynamicInputs.length > 0 && (
                                    <Space>
                                        <input type="checkbox" checked={selectAllVariations} onChange={(e) => handleSelectAllVariations(e.target.checked)} style={{ marginRight: 8 }}/>
                                        <Text strong>Select All</Text>
                                    </Space>
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
                                        title: "Buy Price",
                                        dataIndex: "buyPrice",
                                        width: 120,
                                        render: (_, record) => (
                                            <Input placeholder="0" value={variationBuyPrice[record.index]} onChange={(e) =>updateVariationField(record.index,"buyPrice",e.target.value)}/>
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
                                                <input type="file" accept="image/*" onChange={(e) => handleColorImageChange(e, record.index)} style={{ width: "100%", fontSize: "12px" }}/>
                                                {colorImagePreview[record.index] && (
                                                    <div style={{position: "relative",display: "inline-block",}}>
                                                        <Image src={colorImagePreview[record.index]} alt={`Variation ${record.index + 1}`} style={{width: 50,height: 50, objectFit: "cover",borderRadius: 4,}}/>
                                                        <Button type="text" danger icon={<DeleteOutlined />}
                                                        onClick={() => {const newImages = [...colorImages];const newPreview = [...colorImagePreview];newImages[record.index] = null;newPreview[record.index] = null;
                                                            setColorImages(newImages);setColorImagePreview(newPreview);}}
                                                            style={{position: "absolute",top: -8,right: -8,background: "#ff4d4f",color: "white",borderRadius: "50%",width: 20,height: 20,minWidth: 20,display: "flex",alignItems: "center",justifyContent: "center",fontSize: 10,}}
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
        
                        <Row justify="end" style={{ marginTop: 16 }}>
                            <Button type="primary" size="large" onClick={handleSubmit} loading={loading} disabled={isInvalidOffer}>
                                Update Product
                            </Button>
                        </Row>
                    </Card>
                </Col>
            </Row>
        
            <Divider />
        
            <Row gutter={16}>
                <Col xs={24} lg={24}>
                    <Card title="SEO Information" bordered>
                        <Form layout="vertical">
                            <Form.Item label="Meta Title">
                                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)}/>
                            </Form.Item>

                            <Form.Item label="Meta Keywords">
                                <Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)}/>
                            </Form.Item>

                            <Form.Item label="Meta Description">
                                <Input.TextArea rows={4} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)}/>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        
            <Modal title="Please Choose Your Variations" open={variationMultiplyModal} onCancel={() => setVariationMultiplyModal(false)} onOk={handleVariationMultiplySubmit} okText="Submit" width={800}>
                <Form layout="vertical">
                    <Form.Item label="Variations">
                        <Select mode="multiple" placeholder="Select Variations" value={selectedVariationId} onChange={(value) => {setSelectedVariationId(value);
                            const removedAttributeIds = selectedVariationId.filter((id) => !value.includes(id));
                                if (removedAttributeIds.length > 0) {
                                    setSelectedVariationValues((prev) => prev.filter((val) => !removedAttributeIds.includes(val.attribute_id)));
                                }
                            }}
                            options={(allVariations?.data || []).map((v) => ({label: v.name,value: v.id,}))}
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
        
                    {selectedVariationId.map((attrId) => {
                        const attribute = (allVariations?.data || []).find((v) => v.id === attrId);
                        if (!attribute) return null;
            
                        const currentValues = selectedVariationValues.filter(
                            (v) => v.attribute_id === attrId
                        );
        
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
                            <Tag key={tag.id} color="blue" closable onClose={() => {setSelectedVariationValues((prev) => prev.filter((v) => v.id !== tag.id));}} style={{ marginBottom: 6, marginRight: 6 }}>
                                {tag.value}
                            </Tag>
                        ))}

                        {selectedVariationValues.length === 0 && (
                            <Text type="secondary" style={{ fontStyle: "italic" }}>
                                No variation values selected yet
                            </Text>
                        )}
                    </div>
        
                    {/*  Debug section to show what will be created */}
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
                        <Select placeholder="Select Default" value={multiIsDefault} onChange={setMultiIsDefault} options={[{label: "No", value: 0 },{ label: "Yes", value: 1 },]}/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
