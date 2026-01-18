import { Row, Col, Spin, Button, Progress, Table } from "antd";
import { LoadingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useMemo } from "react";

export default function CourierInfo({
  record,
  name,
  loading,
  courierData,
  courierDataTableShow,
  setCourierDataTableShow,
  curierDeliveryReports,
  localOrderSummary,
}) {
  const columns = [
    {
      title: <span style={{ fontSize: 12 }}>Courier</span>,
      dataIndex: "courier_name",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.logo && (
            <img
              src={record.logo}
              alt={record.courier_name}
              style={{ width: 26, height: 26, objectFit: "contain" }}
            />
          )}
          <strong>{record.courier_name}</strong>
        </div>
      ),
    },
    {
      title: <span style={{ fontSize: 12 }}>Total</span>,
      dataIndex: "total_parcels",
    },
    {
      title: <span style={{ color: "green", fontSize: 12 }}>Delivered</span>,
      dataIndex: "delivered_parcels",
    },
    {
      title: <span style={{ color: "#1C558B", fontSize: 12 }}>Success %</span>,
      dataIndex: "success_percentage",
      render: (v) => `${v}%`,
    },
    {
      title: <span style={{ color: "red", fontSize: 12 }}>Returned</span>,
      dataIndex: "canceled_parcels",
    },
  ];

  const tableDataWithTotal = useMemo(() => {
    const list = Array.isArray(courierData) ? courierData : [];

    const totals = list.reduce(
      (acc, item) => {
        acc.total += Number(item.total_parcels || 0);
        acc.delivered += Number(item.delivered_parcels || 0);
        acc.returned += Number(item.canceled_parcels || 0);
        return acc;
      },
      { total: 0, delivered: 0, returned: 0 }
    );

    const successPct =
      totals.total > 0
        ? Math.round((totals.delivered / totals.total) * 100)
        : 0;

    return [
      ...list,
      {
        courier_name: "Total",
        logo: null,
        total_parcels: totals.total,
        delivered_parcels: totals.delivered,
        canceled_parcels: totals.returned,
        success_percentage: successPct,
      },
    ];
  }, [courierData]);

  return (
    <>
      <div
        className="customer-information"
        style={{ padding: "8px", width: 500 }}
      >
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <div className="main-section">
              <h4
                className="fw-semibold text-secondary border-bottom pb-2 mb-2"
                style={{ fontSize: "20px" }}
              >
                Customer Information
              </h4>
              <p style={{ marginBottom: "4px", display: "flex", gap: "5px" }}>
                <span className="fw-semibold">Customer Name:</span>
                <span style={{ fontWeight: 700 }}>{name}</span>
              </p>
              <p style={{ marginBottom: "4px", display: "flex", gap: "5px" }}>
                <span className="fw-semibold">Mobile Number:</span>
                <span style={{ fontWeight: 700 }}>{record.phone_number}</span>
              </p>
              <p style={{ marginBottom: "4px", display: "flex", gap: "5px" }}>
                <span className="fw-semibold">Customer Address:</span>
                <span style={{ fontWeight: 700 }}>
                  {record.address_details}
                </span>
              </p>
            </div>
          </Col>

          <Col span={12}>
            <div className="main-section bg-white border rounded-3 shadow-sm">
              <h4
                className="fw-semibold text-secondary border-bottom pb-2 mb-2"
                style={{ fontSize: "20px" }}
              >
                Order History
              </h4>

              <div className="order-summary">
                {[
                  {
                    label: "Total Orders",
                    value: curierDeliveryReports?.total_parcel || 0,
                    color: "#1c558b",
                  },
                  {
                    label: "Delivered Orders",
                    value: curierDeliveryReports?.success_parcel || 0,
                    color: "red",
                  },
                  {
                    label: "Canceled Orders",
                    value: curierDeliveryReports?.cancelled_parcel || 0,
                    color: "orange",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="d-flex justify-content-between mb-1"
                    style={{ fontWeight: 700 }}
                  >
                    <span>{item.label}:</span>
                    <span
                      style={{
                        color: item.color,
                        minWidth: 80,
                        textAlign: "left",
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Col>

          <Col span={24}>
            <div className="main-section">
              {loading ? (
                <div style={{ textAlign: "center" }}>
                  <Spin
                    indicator={
                      <LoadingOutlined style={{ fontSize: 24 }} spin />
                    }
                  />
                </div>
              ) : (
                <div className="customer-delivery-success-rate">
                  <Row gutter={[16, 0]} justify="space-between" align="middle">
                    <Col span={24}>
                      <div className="courier-info-dis">
                        <h5 style={{ fontSize: "16px", color: "#7a7a7a" }}>
                          Delivery Success Rate
                        </h5>
                        <div
                          className="customer-delivery-success-btn"
                          style={{ display: "flex", gap: "8px" }}
                        >
                          <Button
                            size="small"
                            style={{
                              backgroundColor: "#1C558B",
                              color: "white",
                              padding: "3px 10px 5px 10px",
                            }}
                          >
                            Re-Check
                          </Button>

                          <Button
                            size="small"
                            style={{
                              color: "#1C558B",
                              padding: "3px 10px 5px 10px",
                            }}
                            onClick={() =>
                              setCourierDataTableShow(!courierDataTableShow)
                            }
                          >
                            <ArrowDownOutlined /> Details
                          </Button>
                        </div>
                      </div>
                      <Progress
                        percent={Math.round(
                          curierDeliveryReports?.success_ratio ?? 0
                        )}
                        strokeColor="#1C558B"
                        strokeWidth={10}
                        className="custom-progress"
                        format={(percent) => `${percent}%`}
                      />
                    </Col>
                  </Row>

                  {courierDataTableShow &&
                    courierData &&
                    courierData.length > 0 && (
                      <div className="table-section" style={{ marginTop: 10 }}>
                        <Table
                          dataSource={tableDataWithTotal}
                          rowKey="courier_name"
                          pagination={false}
                          size="small"
                          bordered
                          rowClassName={(record) =>
                            record.courier_name === "Total" ? "total-row" : ""
                          }
                          columns={columns}
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          </Col>

          <Col span={24}>
            <div className="main-section">
              <div className="customer-ongoing-orders">
                <Row gutter={[0, 10]}>
                  <Col span={24}>
                    <div className="customer-ongoing-text-section">
                      <h5>Ongoing Orders</h5>
                      <p>{localOrderSummary?.total_order || 0}</p>
                      <div className="spinner-square">
                        <div className="square-1 square"></div>
                        <div className="square-2 square"></div>
                        <div className="square-3 square"></div>
                        <div className="square-4 square"></div>
                        <div className="square-5 square"></div>
                        <div className="square-6 square"></div>
                      </div>
                    </div>
                  </Col>

                  <Col span={24}>
                    {loading ? (
                      <div style={{ textAlign: "center" }}>
                        <Spin
                          indicator={
                            <LoadingOutlined style={{ fontSize: 24 }} spin />
                          }
                        />
                      </div>
                    ) : (
                      <div className="cutomer-ongoing-bottom-section">
                        <Row
                          gutter={[16, 0]}
                          justify="space-between"
                          align="middle"
                        >
                          <Col span={12}>
                            <div className="top-section">
                              <h5>
                                Total Order :{" "}
                                {localOrderSummary?.total_order || 0}
                              </h5>
                            </div>
                            <div className="buttom-section">
                              <h5>
                                BDT : {localOrderSummary?.total_amount || 0}
                              </h5>
                            </div>
                          </Col>
                          <Col span={12} style={{ textAlign: "right" }}>
                            <Button
                              type="primary"
                              size="small"
                              style={{
                                backgroundColor: "#faad14",
                                borderColor: "#faad14",
                              }}
                            >
                              On Hold
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}
