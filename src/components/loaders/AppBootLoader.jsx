import { CheckCircleFilled, SafetyCertificateFilled } from "@ant-design/icons";
import "./AppBootLoader.css";

export default function AppBootLoader() {
    return (
        <main className="app-boot-loader" role="status" aria-live="polite" aria-label="Loading admin workspace">
            <div className="app-boot-loader__glow app-boot-loader__glow--one" />
            <div className="app-boot-loader__glow app-boot-loader__glow--two" />

            <section className="app-boot-loader__card">
                <div className="app-boot-loader__brand" aria-hidden="true">
                    <span className="app-boot-loader__brand-mark">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span className="app-boot-loader__brand-name">Admin Portal</span>
                </div>

                <div className="app-boot-loader__spinner" aria-hidden="true">
                    <span className="app-boot-loader__orbit app-boot-loader__orbit--outer" />
                    <span className="app-boot-loader__orbit app-boot-loader__orbit--inner" />
                    <span className="app-boot-loader__spinner-core">
                        <SafetyCertificateFilled />
                    </span>
                </div>

                <div className="app-boot-loader__copy">
                    <h1>Preparing your workspace</h1>
                    <p>Loading enabled modules and securing your session.</p>
                </div>

                <div className="app-boot-loader__progress" aria-hidden="true">
                    <span />
                </div>

                <div className="app-boot-loader__checks" aria-hidden="true">
                    <span><CheckCircleFilled /> Secure session</span>
                    <span className="app-boot-loader__checks-active">
                        <i /> Loading modules
                    </span>
                </div>
            </section>

            <p className="app-boot-loader__footer">Please wait a moment</p>
        </main>
    );
}
