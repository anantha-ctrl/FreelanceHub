const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, TableOfContents, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, Header, Footer
} = require('docx');

const CONTENT_W = 9360;
const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const HEAD_FILL = "1F3A93";   // deep blue
const ALT_FILL = "EEF2FB";

function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); }
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, ...opts })] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 40 },
    children: [new TextRun(text)] });
}
function numbered(text, ref = "nums") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 40 },
    children: [new TextRun(text)] });
}

// Generic table builder: headers = [..], rows = [[..],[..]]
function table(headers, rows, widths) {
  const colW = widths || headers.map(() => Math.floor(CONTENT_W / headers.length));
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htxt, i) => new TableCell({
      borders, width: { size: colW[i], type: WidthType.DXA },
      shading: { fill: HEAD_FILL, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: htxt, bold: true, color: "FFFFFF", size: 20 })] })]
    }))
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      borders, width: { size: colW[i], type: WidthType.DXA },
      shading: { fill: ri % 2 ? ALT_FILL : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20 })] })]
    }))
  }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: colW, rows: [headerRow, ...bodyRows] });
}

// ---------- TITLE PAGE ----------
const titlePage = [
  new Paragraph({ spacing: { before: 2200, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "FreelanceHub", bold: true, size: 72, color: "1F3A93" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Full-Stack Freelancer Social Platform", bold: true, size: 32, color: "444444" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Project Report", size: 28, italics: true, color: "666666" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "React  ·  Node.js / Express  ·  MySQL (Sequelize)", size: 24, color: "333333" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1600, after: 40 },
    children: [new TextRun({ text: "Submitted by: ____________________", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Guide: ____________________", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Date: June 2026", size: 24 })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- TOC ----------
const tocPage = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Table of Contents")] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- BODY ----------
const body = [];

// 1. Abstract
body.push(h1("1. Abstract"));
body.push(p("FreelanceHub is a full-stack social platform that lets freelancers showcase their skills through an Instagram-style post feed while giving administrators full moderation control. The system provides interactive messaging/chatting, job proposals with custom cover letters and bid rates, a customer support helpdesk, and real-time notifications. Every post passes through an admin approval workflow before appearing in the public feed. The platform features role-based session management, a live analytics dashboard, a premium dark/light theme, and custom mobile-responsive viewport toggle interfaces."));
body.push(p("The application is built on a React 18 single-page frontend and a Node.js / Express REST API, backed by a MySQL database accessed through the Sequelize ORM. This report documents the system's objectives, architecture, database design, modules, implementation highlights, security measures, the development and bug-fixing work carried out, and testing results."));

// 2. Introduction
body.push(h1("2. Introduction"));
body.push(h2("2.1 Overview"));
body.push(p("Freelancers need a focused space to publish their offerings and be discovered, while platform owners need moderation tools to keep content trustworthy. FreelanceHub addresses both needs in a single, modern web application with separate user and admin experiences."));
body.push(h2("2.2 Problem Statement"));
body.push(p("Generic social networks are noisy and lack quality control, and most freelancer marketplaces hide talent behind paywalls. There is a need for an open, moderated, visually rich feed where verified freelancer posts can be browsed, liked, and discussed, with administrators able to approve, reject, and manage users and content."));
body.push(h2("2.3 Objectives"));
body.push(bullet("Provide secure user registration, login, and session management."));
body.push(bullet("Allow freelancers to create, edit, and delete posts with image uploads."));
body.push(bullet("Enforce an admin approval workflow before posts go live."));
body.push(bullet("Enable social engagement through likes and inline comments."));
body.push(bullet("Deliver real-time notifications and a live analytics dashboard."));
body.push(bullet("Give administrators moderation tools and detailed activity logs."));
body.push(bullet("Provide real-time proposal submissions and user-to-user direct messaging."));
body.push(bullet("Enable support ticket creation and a centralized administrator support desk."));
body.push(bullet("Ensure absolute mobile responsiveness across all devices and viewport sizes."));
body.push(h2("2.4 Scope"));
body.push(p("The system covers the complete user journey (registration to engagement) and the complete admin journey (moderation to reporting). It is a development/learning-grade application running locally on XAMPP's MySQL, with an optional Cloudinary integration for production image hosting."));

// 3. System Requirements
body.push(h1("3. System Requirements"));
body.push(h2("3.1 Software Requirements"));
body.push(table(["Component", "Requirement"], [
  ["Operating System", "Windows / macOS / Linux"],
  ["Runtime", "Node.js 16 or higher"],
  ["Database", "MySQL 5.7+ / MariaDB (XAMPP, port 3306)"],
  ["Database Tool", "MySQL Workbench (optional)"],
  ["Browser", "Any modern browser (Chrome, Edge, Firefox)"],
], [3120, 6240]));
body.push(h2("3.2 Hardware Requirements"));
body.push(table(["Component", "Minimum"], [
  ["Processor", "Dual-core 2.0 GHz"],
  ["RAM", "4 GB (8 GB recommended)"],
  ["Storage", "500 MB free space"],
], [3120, 6240]));

// 4. Technology Stack
body.push(h1("4. Technology Stack"));
body.push(table(["Layer", "Technology"], [
  ["Frontend", "React 18, Tailwind CSS, Framer Motion"],
  ["Routing", "React Router v6"],
  ["State", "React Context API"],
  ["HTTP Client", "Axios"],
  ["Charts", "Recharts"],
  ["Backend", "Node.js, Express.js"],
  ["Database", "MySQL accessed via Sequelize ORM"],
  ["Authentication", "JWT (jsonwebtoken) + bcryptjs"],
  ["Image Upload", "Multer + Cloudinary (local disk fallback)"],
  ["Security", "Helmet, xss-clean, express-rate-limit, CORS"],
], [3120, 6240]));

// 5. System Architecture
body.push(h1("5. System Architecture"));
body.push(p("FreelanceHub follows a three-tier client–server architecture:"));
body.push(numbered("Presentation Tier — A React single-page application served on http://localhost:3000. It renders the user and admin interfaces and communicates with the backend through Axios.", "arch"));
body.push(numbered("Application Tier — A Node.js / Express REST API on http://localhost:5001 that handles authentication, business logic, validation, file uploads, and moderation.", "arch"));
body.push(numbered("Data Tier — A MySQL database (freehub) accessed through the Sequelize ORM, storing users, posts, likes, comments, sessions, and block records.", "arch"));
body.push(p("Requests flow: React → Axios → Express routes → middleware (JWT verify, rate limit) → controllers → Sequelize models → MySQL. Responses are shaped by a normalize() utility before being returned as JSON. Uploaded images are served statically from /uploads."));

// 6. Database Design
body.push(h1("6. Database Design"));
body.push(p("The database (freehub) is created and synchronised automatically on first run. It contains six tables linked by foreign keys:"));
body.push(table(["Table", "Purpose", "Key Fields"], [
  ["users", "Registered users and admins", "id, name, email, password (bcrypt), role, profileImage, bio, skills, isBlocked"],
  ["posts", "Freelancer posts + approval state", "id, userId, title, description, category, budget, image, approvalStatus, likesCount, commentsCount"],
  ["login_logs", "Login / session records", "id, userId, loginTime, logoutTime, sessionStatus, ipAddress, deviceInfo, tokenId"],
  ["likes", "Post likes", "id, userId, postId"],
  ["comments", "Post comments", "id, userId, postId, comment"],
  ["blocked_users", "Block records", "id, userId, blockedBy, blockedReason"],
], [1700, 3000, 4660]));
body.push(p("Relationships: a User has many Posts, Likes, Comments and LoginLogs; a Post belongs to a User and has many Likes and Comments. All primary keys are UUIDs (CHAR(36)). The full schema is available as database/freehub.sql for import into MySQL Workbench.", { italics: true }));

// 7. Modules & Features
body.push(h1("7. Modules and Features"));
body.push(h2("7.1 User Module"));
body.push(bullet("Registration, login, and a 5-hour auto-expiring secure session."));
body.push(bullet("Create, edit, and delete posts with optional image upload."));
body.push(bullet("Instagram-style infinite-scroll feed with search and category filters."));
body.push(bullet("Like and inline-comment on approved posts."));
body.push(bullet("Real-time notification bell in the header with an unread badge."));
body.push(bullet("Live dashboard: post/like/comment stats and a 7-day engagement chart."));
body.push(bullet("Profile management: photo upload, bio, skills, member-since, change password."));
body.push(bullet("Post status filter tabs (All / Approved / Pending / Rejected) and session history."));
body.push(bullet("Submit proposals (bid rates and cover letters) directly to client posts."));
body.push(bullet("Interactive messaging / chat panel with active conversations."));
body.push(bullet("Helpdesk ticket creation and interactive admin support desk."));
body.push(bullet("Single post detail page (/post/:id) for job application and reviews."));
body.push(h2("7.2 Admin Module"));
body.push(bullet("Dashboard with live platform statistics and charts."));
body.push(bullet("Post approval workflow — approve or reject with a reason."));
body.push(bullet("User management — block or unblock with a reason."));
body.push(bullet("Activity logs with login/logout time, IP, device, and session status."));
body.push(bullet("CSV export of activity logs."));
body.push(bullet("Admin-only protected routes and no session auto-logout for admins."));
body.push(bullet("Support inbox with live message stream to resolve user helpdesk queries."));

// 8. Implementation Highlights
body.push(h1("8. Implementation Highlights"));
body.push(h2("8.1 Authentication and Sessions"));
body.push(p("Passwords are hashed with bcryptjs (12 salt rounds) before storage. On login a JWT is issued and a session record is written to login_logs. Regular users receive a 5-hour token and see a live countdown bar; administrators receive a non-expiring token and are never auto-logged-out. An Axios interceptor logs users out automatically when a 401 (expired/invalid token) is received."));
body.push(h2("8.2 Post Approval Workflow"));
body.push(p("New posts are created with status 'pending' and are invisible in the public feed. An administrator reviews each post and either approves it (it becomes live) or rejects it with a reason. Editing an approved post re-submits it for approval."));
body.push(h2("8.3 Real-Time Notifications"));
body.push(p("Notifications are derived live from database activity — likes and comments on the user's posts and admin approval/rejection events — without a separate table. A header bell polls the API every 25 seconds, shows an unread-count badge, and presents recent items in a dropdown."));
body.push(h2("8.4 Engagement Analytics"));
body.push(p("The user dashboard requests a my-stats endpoint that aggregates the last seven days of likes and comments on the user's posts (bucketed by day) and computes accurate totals across all posts, powering the stat cards and the Recharts engagement graph."));
body.push(h2("8.5 Image Upload and Serving"));
body.push(p("Uploads use Multer. When Cloudinary credentials are absent, images are stored on local disk in an auto-created uploads/ folder and served from /uploads with an explicit cross-origin resource policy so the React app can display them."));
body.push(h2("8.6 Mobile View Responsiveness and Layout"));
body.push(p("To offer a top-tier mobile experience, multi-pane layouts (Chat, Proposals, Support Desk, and Admin Support Inbox) were optimized. On mobile viewports (width < 768px), these components collapse into a single-pane interface. Dynamic Back buttons in detailed view headers allow users to toggle back to thread lists. The bottom navigation bar has been aligned and updated with a centered '+' button that includes micro-animations and unique active state glowing effects. Standard headers stack vertically on smaller viewports to prevent overflow."));
body.push(h2("8.7 Local Network Media Delivery Helper"));
body.push(p("When testing the application on local networks using mobile devices, hardcoded loopback references (localhost/127.0.0.1) caused missing avatars and post images. A utility function getAssetURL was created to rewrite loopback URLs dynamically to the active browser hostname (e.g. the server's local IP address like 192.168.x.x), ensuring that all media resources render flawlessly during local development and remote debugging."));

// 9. Security
body.push(h1("9. Security Features"));
body.push(bullet("JWT authentication — 5-hour expiry for users, non-expiring for admins."));
body.push(bullet("Session records in the database, invalidated on logout or block."));
body.push(bullet("bcryptjs password hashing with 12 salt rounds (one-way, salted)."));
body.push(bullet("Rate limiting on the API and stricter limits on auth endpoints."));
body.push(bullet("Helmet security headers, with a cross-origin policy for served images."));
body.push(bullet("xss-clean middleware against cross-site scripting."));
body.push(bullet("Role-based route guards separating user and admin access."));
body.push(bullet("Blocked-user session termination and a 401 auto-logout interceptor."));

// 10. Development Work Log
body.push(h1("10. Development and Enhancement Log"));
body.push(p("The following work was carried out to bring the project to its current state, covering setup, bug fixes, and feature additions:"));
body.push(table(["#", "Area", "Work Done"], [
  ["1", "Setup", "Identified the project runs on MySQL (Sequelize), not MongoDB; configured the database connection and environment."],
  ["2", "Database", "Generated database/freehub.sql (schema + seed) for MySQL Workbench via an export script; verified auto-creation of the freehub database."],
  ["3", "Bug Fix", "Fixed Activity Logs showing 'Invalid Date' and 'Deleted User' — corrected the normalize() utility that was destroying Date objects and not populating the user relation."],
  ["4", "Feature", "Removed session auto-logout for admins (users keep the 5-hour timeout)."],
  ["5", "UI", "Replaced the 'FH' text mark with a custom SVG brand logo on the login screen."],
  ["6", "Feature", "Made the user dashboard fully real-time (live 7-day engagement chart and accurate stat totals via a new my-stats endpoint)."],
  ["7", "Bug Fix", "Fixed 'Failed to create post' — auto-created the uploads/ directory, served images statically, and corrected the stored image URL."],
  ["8", "Feature", "Implemented real-time notifications derived from live likes/comments/approvals (new /users/notifications endpoint)."],
  ["9", "Feature", "Added a header notification bell with unread badge and live polling, placed next to the New Post action."],
  ["10", "Feature", "Built the comment feature — clickable comment panel with live add/list, wired to the backend."],
  ["11", "Bug Fix", "Fixed post images not displaying (blocked by Helmet's cross-origin resource policy)."],
  ["12", "Feature", "Enhanced the profile page — photo upload, bio/skills/member-since, post status filter tabs, and change password."],
  ["13", "Docs", "Updated README.md to reflect the real MySQL stack, port, endpoints, and features."],
  ["14", "Feature", "Integrated real-time proposals status updates, chat notifications, and proposal submissions dynamically into the activity feed."],
  ["15", "Feature", "Redesigned Landing page showcasing all core platform areas (Feed, Chat, Proposals, Support Desk) with Framer Motion animations."],
  ["16", "Bug Fix", "Fixed Admin Dashboard pending approvals counter to use correct database count instead of filtering recent posts."],
  ["17", "Feature", "Made Proposals, Chat Desk, Support Desk, and Admin Support Inbox pages fully responsive on mobile by implementing single-pane toggling viewports and header Back buttons."],
  ["18", "UI Fix", "Aligned the bottom navigation bar and centered the '+' Create button cleanly on mobile screens; added active state animations in CSS."],
  ["19", "UI Fix", "Made the PageHeader responsive to stack elements vertically on mobile viewports and hide duplicate headers."],
  ["20", "Bug Fix", "Resolved missing images on mobile views by adding getAssetURL helper to dynamically rewrite localhost paths to browser hostnames."],
  ["21", "UI Fix", "Corrected the SVG brand Logo.jsx to cleanly render the custom Freelance_Logo.png image as an img tag."],
  ["22", "Bug Fix", "Fixed 404 error on 'View Post' link by creating a dedicated single PostDetail page and registering the post/:id route."],
  ["23", "UI Fix", "Configured custom website tab favicon.png in index.html to statically load the brand icon via the public directory."],
], [560, 1700, 7100]));

// 11. Testing
body.push(h1("11. Testing"));
body.push(p("Each backend feature was verified end-to-end through API calls against the running server. Representative results:"));
body.push(table(["Test Case", "Result"], [
  ["User registration and login", "Pass — JWT issued, session logged"],
  ["Create post (with and without image)", "Pass — 201, image served from /uploads"],
  ["Admin approve / reject post", "Pass — status updates, feed reflects change"],
  ["Like and comment on a post", "Pass — counts update, author notified"],
  ["Real-time notifications", "Pass — like/comment/approval events appear"],
  ["Dashboard my-stats aggregation", "Pass — accurate 7-day chart and totals"],
  ["Profile photo upload + change password", "Pass — avatar saved, re-login with new password"],
  ["Submit job proposals and accept/reject", "Pass — status changes and proposal records persist"],
  ["Direct message exchanges and threads list", "Pass — real-time list updates and message delivery"],
  ["Submit support ticket and admin chat reply", "Pass — messages render and ticket status updates"],
  ["Local network testing on mobile devices", "Pass — getAssetURL successfully rewrites hosts and displays images"],
], [5200, 4160]));

// 12. Conclusion
body.push(h1("12. Conclusion"));
body.push(p("FreelanceHub successfully delivers a moderated, socially-engaging platform for freelancers. It combines a polished React interface with a secure Express API and a relational MySQL backend, demonstrating a complete full-stack workflow: authentication, role-based access, content moderation, real-time engagement, file uploads, and live analytics. All planned modules are functional and verified."));

// 13. Future Enhancements
body.push(h1("13. Future Enhancements"));
body.push(bullet("WebSocket-based push notifications for instant updates."));
body.push(bullet("Direct messaging and collaboration requests between users."));
body.push(bullet("Follow/unfollow and a personalised feed."));
body.push(bullet("Payment integration for premium freelancer profiles."));
body.push(bullet("Full-text search and advanced filtering."));
body.push(bullet("Cloud deployment with CI/CD and managed database hosting."));

// ---------- DOCUMENT ----------
const doc = new Document({
  creator: "FreelanceHub",
  title: "FreelanceHub Project Report",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: "1F3A93", font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3A93", space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: "2E4A9E", font: "Calibri" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "nums", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "arch", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "FreelanceHub Project Report   |   Page ", size: 18, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })] })] })
    },
    children: [...titlePage, ...tocPage, ...body]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("FreelanceHub_Project_Report.docx", buf);
  console.log("Wrote FreelanceHub_Project_Report.docx (" + buf.length + " bytes)");
});
