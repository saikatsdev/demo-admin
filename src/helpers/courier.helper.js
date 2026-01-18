export const formatCourierData = (courierDeliveryReport) => {
    if (!courierDeliveryReport || typeof courierDeliveryReport !== "object") {
        return [];
    }

    return Object.entries(courierDeliveryReport)
    .filter(([key]) => key !== "summary").map(([_, courier]) => ({
        courier_name      : courier?.name || "",
        logo              : courier?.logo || null,
        total_parcels     : Number(courier?.total_parcel || 0),
        delivered_parcels : Number(courier?.success_parcel || 0),
        canceled_parcels  : Number(courier?.cancelled_parcel || 0),
        success_percentage: Math.round(Number(courier?.success_ratio || 0)),
    }));
};
