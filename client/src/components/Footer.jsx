import React from "react";
import "../DocHubLayoutDesign/footer.css";

export default function footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerGrid">
          <div className="footerBrand">
            {/* Replace text with your logo img if you have one */}
            <div className="footerLogo">DocHub</div>
          </div>

          <div className="footerCol">
            <div className="footerTitle">DOCHUB</div>
            <a className="footerLink" href="#">Home</a>
            <a className="footerLink" href="#">Catalog</a>
            <a className="footerLink" href="#">Login</a>
          </div>

          <div className="footerCol">
            <div className="footerTitle">VENDOR DATA PRODUCTS</div>
            <a className="footerLink" href="#">Legend Marketplace</a>
            <a className="footerLink" href="#">Confluence Page</a>
            <a className="footerLink" href="#">Keystone</a>
            <a className="footerLink" href="#">Data Product Dashboard</a>
          </div>

          <div className="footerCol">
            <div className="footerTitle">ENGINEERING</div>
            <a className="footerLink" href="#">EngHub</a>
            <a className="footerLink" href="#">Webinars</a>
            <a className="footerLink" href="#">Documentation</a>
            <a className="footerLink" href="#">Coder Workspace</a>
          </div>

          <div className="footerCol">
            <div className="footerTitle">GOLDMAN SACHS</div>
            <a className="footerLink" href="#">GSWeb</a>
            <a className="footerLink" href="#">Marquee</a>
            <a className="footerLink" href="#">Marquee</a>
            <a className="footerLink" href="#">Marquee</a>
          </div>
        </div>

        <div className="footerBottom">
          <span>© {new Date().getFullYear()} Goldman Sachs</span>
          <span className="footerBottomLinks">
            <a className="footerLinkInline" href="#">Privacy</a>
            <a className="footerLinkInline" href="#">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
