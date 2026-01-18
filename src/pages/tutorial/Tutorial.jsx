import { useState } from "react";
import { PlayCircle } from "lucide-react";
import "./tutorial.css";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";

const tutorialGroups = {
  "Dashboard": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "User Management": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Product Management": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Marketing Tools": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
  ],

  "Order Management": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
  ],

  "Courier Management": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Fake Order Solution": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
  ],

  "Report": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Blog Management": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Seo Pages": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
  ],

  "Campaigns": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Section & Banner": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Category Section": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
  ],

  "CMS": [
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
  ],

  "Settings": [
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
    "https://www.youtube.com/embed/j_MeXPfD_5c",
    "https://www.youtube.com/embed/FnNjJJ2zyig",
  ],
};

export default function TutorialSection() {
  const categories = Object.keys(tutorialGroups);
  const [active, setActive] = useState(categories[0]);

  return (
    <div className="tutorial-wrapper">
      <div className="pagehead d-flex justify-content-between align-items-center mb-4">
        <h1 className="title">Tutorial</h1>
        <Breadcrumb
          items={[
            { title: <Link to="/dashboard">Dashboard</Link> },
            { title: "Tutorial" },
          ]}
        />
      </div>

      <div className="row tutorial-row">
        <div className="col-lg-3 col-12">
          <div className="side">
            <div className="list-group h-100">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setActive(item)}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                    active === item ? "active" : ""
                  }`}
                >
                  <PlayCircle size={18} /> {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9 col-12 video-section">
          <h3 className="group-title">{active} Tutorials</h3>
          <div className="video-grid">
            {tutorialGroups[active].map((video, index) => (
              <div className="video-card" key={index}>
                <p className="video-name">Video {index + 1}</p>
                <div className="video-box">
                  <iframe
                    src={video}
                    title={`video-${index}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
