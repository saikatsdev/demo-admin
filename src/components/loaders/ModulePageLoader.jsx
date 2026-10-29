import { AppstoreOutlined } from "@ant-design/icons";
import "./ModulePageLoader.css";

export default function ModulePageLoader() {
    return (
        <section className="module-page-loader" role="status" aria-live="polite" aria-label="Loading module page">
            <div className="module-page-loader__topline">
                <div className="module-page-loader__identity">
                    <span className="module-page-loader__icon" aria-hidden="true">
                        <AppstoreOutlined />
                    </span>
                    <div>
                        <strong>Loading workspace</strong>
                        <span>Preparing your module and permissions</span>
                    </div>
                </div>

                <div className="module-page-loader__status" aria-hidden="true">
                    <i />
                    Loading
                </div>
            </div>

            <div className="module-page-loader__progress" aria-hidden="true">
                <span />
            </div>

            <div className="module-page-loader__heading" aria-hidden="true">
                <div>
                    <span className="module-skeleton module-skeleton--title" />
                    <span className="module-skeleton module-skeleton--subtitle" />
                </div>
                <span className="module-skeleton module-skeleton--button" />
            </div>

            <div className="module-page-loader__stats" aria-hidden="true">
                {[0, 1, 2, 3].map((item) => (
                    <div className="module-page-loader__stat" key={item}>
                        <span className="module-skeleton module-skeleton--stat-icon" />
                        <div>
                            <span className="module-skeleton module-skeleton--stat-label" />
                            <span className="module-skeleton module-skeleton--stat-value" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="module-page-loader__content" aria-hidden="true">
                <div className="module-page-loader__toolbar">
                    <span className="module-skeleton module-skeleton--search" />
                    <span className="module-skeleton module-skeleton--filter" />
                </div>

                {[0, 1, 2, 3, 4].map((row) => (
                    <div className="module-page-loader__row" key={row}>
                        <span className="module-skeleton module-skeleton--avatar" />
                        <span className="module-skeleton module-skeleton--cell-wide" />
                        <span className="module-skeleton module-skeleton--cell" />
                        <span className="module-skeleton module-skeleton--cell" />
                        <span className="module-skeleton module-skeleton--action" />
                    </div>
                ))}
            </div>
        </section>
    );
}
