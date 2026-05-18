"""
resume_parser.py — Font-Aware Resume Parser with Feature Scoring
=================================================================
Uses PyMuPDF dict-mode for font metadata + OpenResume-inspired feature
scoring.  No LLM APIs — fully local, deterministic parsing.

Pipeline:
  1. Extract text items with font metadata (bold, size, position)
  2. Group text items into lines by y-coordinate
  3. Group lines into sections by header detection (keyword + bold/CAPS/size)
  4. Divide sections into subsections (vertical gap / bold marker)
  5. Extract fields via feature scoring per subsection

Returns structured JSON:
  { name, email, phone, linkedin, education, experience, skills,
    languages, projects, location, confidence }
"""

from __future__ import annotations

import re
import statistics
from dataclasses import dataclass, field as dc_field
from typing import Any, Callable

import fitz  # PyMuPDF
from rapidfuzz import fuzz, process
from pydantic import BaseModel


# ───────────────────────────── Text Item ──────────────────────────────

@dataclass
class TextItem:
    """A single span of text with its PDF visual metadata."""
    text: str
    x: float = 0.0
    y: float = 0.0
    x2: float = 0.0
    y2: float = 0.0
    font_name: str = ""
    font_size: float = 0.0
    is_bold: bool = False

Line = list[TextItem]
Lines = list[Line]
Subsections = list[Lines]


# ──────────────────────── Pydantic Output Models ──────────────────────

class BasicInfo(BaseModel):
    """Contact & summary info extracted from resume header/profile."""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    bio: str = ""


class Education(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    start_year: str = ""
    end_year: str = ""


class Experience(BaseModel):
    company: str = ""
    title: str = ""
    duration: str = ""
    description: str = ""


class Project(BaseModel):
    name: str = ""
    description: str = ""
    technologies: str = ""


class ParseResult(BaseModel):
    basic_info: BasicInfo = BasicInfo()
    education: list[Education] = []
    experience: list[Experience] = []
    skills: list[str] = []
    languages: list[str] = []
    projects: list[Project] = []
    confidence: float = 0.0


# ─────────────────────── Canonical Skill Lists ────────────────────────

CANONICAL_SKILLS: list[str] = [
    # ── Programming Languages ──
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C", "C#", "Go",
    "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    "Perl", "Haskell", "Lua", "Dart", "Shell", "Bash", "SQL", "HTML", "CSS",
    "Objective-C", "Elixir", "Erlang", "Clojure", "F#", "Groovy", "Julia",
    "Fortran", "COBOL", "Assembly", "Solidity", "VHDL", "Verilog",
    "SystemVerilog", "TCL", "LabVIEW", "Ada", "Prolog", "Lisp",
    "Scheme", "OCaml", "Zig", "Nim", "Crystal", "CoffeeScript",
    "PowerShell", "VBA", "ABAP", "Apex",
    # ── Frontend / UI ──
    "React", "React Native", "Next.js", "Vue.js", "Angular", "Svelte",
    "Tailwind CSS", "Bootstrap", "jQuery", "Redux", "Zustand", "MobX",
    "HTML5", "CSS3", "SASS", "LESS", "Three.js", "Framer Motion",
    "Storybook", "Material UI", "Chakra UI", "Ant Design", "Styled Components",
    "Emotion", "Radix UI", "shadcn/ui", "Gatsby", "Nuxt.js", "Remix",
    "Astro", "Solid.js", "Alpine.js", "HTMX", "Stimulus", "Turbo",
    "Blazor", "Vaadin", "Flutter", "Ionic", "Capacitor", "Expo",
    "SwiftUI", "Jetpack Compose", "Xamarin", "MAUI",
    # ── Backend / API ──
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "Spring", "ASP.NET", ".NET", "Ruby on Rails", "Gin", "Fiber",
    "NestJS", "GraphQL", "Socket.IO", "WebRTC", "gRPC", "tRPC",
    "Hono", "Koa", "Fastify", "Laravel", "Symfony", "CodeIgniter",
    "Strapi", "Directus", "Payload CMS", "Sanity", "Contentful",
    "Phoenix", "Actix", "Axum", "Warp", "Rocket",
    "Ktor", "Micronaut", "Quarkus", "Dropwizard",
    # ── Databases / Storage ──
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite", "Cassandra",
    "DynamoDB", "Firebase", "Cloudinary", "Prisma", "Elasticsearch",
    "Neo4j", "CouchDB", "MariaDB", "Oracle", "SQL Server", "InfluxDB",
    "TimescaleDB", "Pinecone", "Weaviate", "ChromaDB", "Milvus",
    "RabbitMQ", "Kafka", "NATS", "ZeroMQ", "Celery", "BullMQ",
    "MinIO", "Ceph",
    # ── Cloud / DevOps / Infra ──
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
    "Jenkins", "GitHub Actions", "CI/CD", "Nginx", "Linux", "Ansible",
    "Vercel", "Render", "Netlify", "Heroku", "DigitalOcean", "Linode",
    "CloudFlare", "Pulumi", "ArgoCD", "Helm", "Istio", "Envoy",
    "Prometheus", "Grafana", "Datadog", "ELK Stack", "Splunk", "Loki",
    "Vagrant", "Chef", "Puppet", "SaltStack", "Packer",
    "Apache", "HAProxy", "Traefik", "Caddy",
    "AWS Lambda", "AWS EC2", "AWS S3", "AWS ECS", "AWS EKS",
    "AWS RDS", "AWS SQS", "AWS SNS", "AWS CloudFront",
    "Azure DevOps", "Azure Functions", "Google Cloud Functions",
    "Cloud Run", "App Engine", "BigQuery",
    # ── ML / AI / Data Science ──
    "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy",
    "Keras", "OpenCV", "Hugging Face", "LangChain", "spaCy", "NLTK",
    "XGBoost", "LightGBM", "CatBoost", "Matplotlib", "Seaborn",
    "Plotly", "Streamlit", "Gradio", "MLflow", "DVC", "Weights & Biases",
    "Apache Spark", "PySpark", "Hadoop", "Airflow", "Dagster",
    "dbt", "Snowflake", "Databricks", "SageMaker", "Vertex AI",
    "ONNX", "TensorRT", "Triton", "Ray", "Dask",
    "Stable Diffusion", "DALL-E", "GPT", "BERT", "Transformers",
    "YOLO", "Detectron2", "MediaPipe", "DeepFace",
    "Jupyter", "Colab", "Anaconda", "SciPy", "Statsmodels",
    # ── Mobile Development ──
    "Android", "iOS", "React Native", "Flutter", "SwiftUI",
    "Jetpack Compose", "Xamarin", "Cordova", "PhoneGap", "NativeScript",
    "Kotlin Multiplatform", "ARKit", "ARCore", "CoreML", "Core Data",
    "Realm", "Room", "Retrofit", "Alamofire", "Dagger", "Hilt",
    # ── Design / UX ──
    "Figma", "Sketch", "Adobe XD", "InVision", "Zeplin",
    "Adobe Photoshop", "Adobe Illustrator", "Adobe After Effects",
    "Adobe Premiere Pro", "Canva", "Blender", "Maya",
    "Cinema 4D", "Unity", "Unreal Engine", "Godot",
    # ── Testing / QA ──
    "Jest", "Mocha", "Chai", "Cypress", "Playwright", "Selenium",
    "Puppeteer", "JUnit", "TestNG", "Pytest", "Robot Framework",
    "Appium", "Detox", "Enzyme", "React Testing Library",
    "Vitest", "K6", "Locust", "JMeter", "Postman",
    "SonarQube", "Snyk", "Trivy", "OWASP",
    # ── Embedded / IoT / ECE ──
    "Arduino", "Raspberry Pi", "ESP32", "STM32", "FPGA",
    "ARM", "RISC-V", "PIC", "AVR", "MSP430",
    "RTOS", "FreeRTOS", "Zephyr", "Mbed", "PlatformIO",
    "MQTT", "Zigbee", "LoRa", "BLE", "CAN Bus", "I2C", "SPI", "UART",
    "PCB Design", "KiCad", "Eagle", "Altium", "OrCAD",
    "MATLAB Simulink", "ModelSim", "Vivado", "Quartus",
    "Signal Processing", "DSP", "VLSI", "ASIC",
    "AutoCAD", "SolidWorks", "CATIA", "Fusion 360", "ANSYS",
    # ── Business / Analytics / PM ──
    "Excel", "Power BI", "Tableau", "Looker", "Metabase",
    "Google Analytics", "Mixpanel", "Amplitude", "Segment",
    "Salesforce", "HubSpot", "SAP", "ServiceNow", "Workday",
    "JIRA", "Confluence", "Trello", "Asana", "Notion",
    "Monday.com", "Linear", "ClickUp", "Basecamp",
    "Slack", "Microsoft Teams", "Zoom",
    # ── Security / Networking ──
    "Wireshark", "Nmap", "Burp Suite", "Metasploit", "Kali Linux",
    "Splunk", "Nessus", "OpenSSL", "Vault",
    "OAuth 2.0", "SAML", "LDAP", "SSO", "RBAC",
    "VPN", "Firewall", "WAF", "SSL/TLS",
    # ── Tools / Misc ──
    "Git", "Jira", "Postman", "VS Code", "Vim", "Neovim",
    "Webpack", "Vite", "REST API", "WebSocket", "OAuth", "JWT",
    "Leaflet", "Mapbox", "Stripe", "Twilio", "Cloudinary", "Swagger",
    "OpenAPI", "gRPC", "Protocol Buffers", "Thrift",
    "RPC", "SOAP", "XML", "JSON", "YAML", "TOML",
    "ESLint", "Prettier", "Husky", "Turborepo", "Nx", "Lerna",
    "npm", "yarn", "pnpm", "pip", "Poetry", "Conda",
    "Homebrew", "apt", "dnf", "snap", "flatpak",
    "Vim", "Emacs", "IntelliJ IDEA", "Eclipse", "NetBeans",
    "Xcode", "Android Studio", "Visual Studio",
    "Agile", "Scrum", "Kanban", "DevOps", "SDLC",
    "Microservices", "Serverless", "Event-Driven", "CQRS",
    "Domain-Driven Design", "Clean Architecture",
    "Data Structures", "Algorithms", "System Design",
    "OOP", "Functional Programming", "Design Patterns",
    "MERN", "MEAN", "LAMP", "JAMstack",
]

PROGRAMMING_LANGUAGES: set[str] = {
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C", "C#", "Go",
    "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    "Perl", "Haskell", "Lua", "Dart", "Shell", "Bash", "SQL",
    "Objective-C", "Elixir", "Erlang", "Clojure", "F#", "Groovy", "Julia",
    "Fortran", "COBOL", "Assembly", "Solidity", "VHDL", "Verilog",
    "SystemVerilog", "TCL", "Ada", "Prolog", "Lisp", "Scheme", "OCaml",
    "Zig", "Nim", "Crystal", "PowerShell", "VBA", "ABAP", "Apex",
}


# ──────────────────── Step 1 — Rich Text Extraction ───────────────────

def _extract_text_items(pdf_bytes: bytes) -> tuple[list[TextItem], str]:
    """Extract every text span from the PDF with font metadata.

    Handles:
      - Multi-page resumes: adds page-height offset to y-coordinates
      - Two-column layouts: detects column gap, reorders right-column
        items below left-column items so the reading order is correct.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_items: list[TextItem] = []
    plain_parts: list[str] = []

    y_offset = 0.0  # cumulative offset for multi-page support

    for page in doc:
        page_width = page.rect.width
        page_height = page.rect.height
        page_items: list[TextItem] = []

        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]  # type: ignore[index]
        for block in blocks:
            if block.get("type") != 0:  # type: ignore[union-attr]
                continue
            for line_data in block.get("lines", []):  # type: ignore[union-attr]
                for span in line_data["spans"]:
                    raw = span["text"]
                    if not raw.strip():
                        continue
                    font = span.get("font", "")
                    bbox = span["bbox"]
                    is_bold = (
                        "Bold" in font or "bold" in font
                        or "CMBX" in font   # Computer Modern Bold Extended
                        or "SFBX" in font   # SF Bold Extended (LaTeX)
                        or "-Bd" in font     # e.g., Helvetica-Bd
                        or "Demi" in font    # DemiBold
                        or "Black" in font   # font weight Black
                        or font.endswith("B") # e.g., ArialB
                    )
                    page_items.append(TextItem(
                        text=raw,
                        x=bbox[0], y=bbox[1],
                        x2=bbox[2], y2=bbox[3],
                        font_name=font,
                        font_size=span.get("size", 0.0),
                        is_bold=is_bold,
                    ))
                    plain_parts.append(raw)

        # ── Column detection for this page ──
        page_items = _reorder_columns(page_items, page_width)

        # Apply cumulative y-offset for multi-page
        for it in page_items:
            it.y += y_offset
            it.y2 += y_offset
        all_items.extend(page_items)

        y_offset += page_height

    doc.close()
    return all_items, "\n".join(plain_parts)


def _reorder_columns(items: list[TextItem], page_width: float) -> list[TextItem]:
    """Detect multi-column layouts (2-col or 3-col) and reorder items
    so columns read left-to-right, top-to-bottom.

    Header items (above the start of body columns) are kept untouched.
    """
    if not items or page_width <= 0 or len(items) < 20:
        return items

    # ── Find ALL column boundaries ──
    boundaries = _find_column_boundaries(items, page_width)
    if not boundaries:
        return items

    # ── Detect body start (header region is centered, not columnar) ──
    left_edge = page_width * 0.15
    max_y = max(it.y for it in items)
    body_start_y = max_y
    first_boundary = boundaries[0]
    for yt in range(0, int(max_y), 10):
        has_left_margin = any(
            it.x < left_edge and yt <= it.y < yt + 25 for it in items
        )
        has_right_col = any(
            it.x >= first_boundary and yt <= it.y < yt + 25 for it in items
        )
        if has_left_margin and has_right_col:
            body_start_y = float(yt)
            break

    header = [it for it in items if it.y < body_start_y]
    body = [it for it in items if it.y >= body_start_y]

    # ── Split body into columns ──
    all_bounds = [0.0] + boundaries + [page_width + 1]
    columns: list[list[TextItem]] = []
    for i in range(len(all_bounds) - 1):
        col = [it for it in body if all_bounds[i] <= it.x < all_bounds[i + 1]]
        if col:
            columns.append(col)

    if len(columns) <= 1:
        return items

    # ── Concatenate columns vertically ──
    reordered: list[TextItem] = list(header)
    running_max_y = max((it.y2 for it in header), default=0.0)

    for col in columns:
        y_shift = running_max_y + 20.0 - min(it.y for it in col)
        for it in col:
            reordered.append(TextItem(
                text=it.text,
                x=it.x, y=it.y + y_shift,
                x2=it.x2, y2=it.y2 + y_shift,
                font_name=it.font_name,
                font_size=it.font_size,
                is_bold=it.is_bold,
            ))
        running_max_y = max(it.y2 + y_shift for it in col)

    return reordered


def _find_column_boundaries(items: list[TextItem],
                            page_width: float) -> list[float]:
    """Return a sorted list of x-boundaries that separate columns.

    Returns [] if no multi-column layout detected.
    Supports 2-column and 3-column layouts.
    """
    total = len(items)
    candidates: list[tuple[float, float]] = []  # (boundary, score)

    # Scan every 5px from 20% to 80% of page width
    lo = int(page_width * 0.20)
    hi = int(page_width * 0.80)
    for bx in range(lo, hi + 1, 5):
        boundary = float(bx)

        # Count crossings (spans that straddle this boundary)
        crossing = sum(
            1 for it in items if it.x < boundary and it.x2 > boundary + 2
        )
        cross_pct = crossing / total
        if cross_pct > 0.06:
            continue

        n_left = sum(1 for it in items if it.x < boundary)
        n_right = sum(1 for it in items if it.x >= boundary)

        # Both sides need ≥15% of total
        if n_left < total * 0.15 or n_right < total * 0.15:
            continue

        balance = min(n_left, n_right) / max(n_left, n_right)
        score = balance * (1.0 - cross_pct * 5)
        if score >= 0.35:
            candidates.append((boundary, score))

    if not candidates:
        return []

    # ── Cluster nearby candidates and pick peaks ──
    # Sort by boundary position
    candidates.sort(key=lambda c: c[0])

    # Cluster within a generous radius — PDF column gaps can be wide
    # (e.g. bullet chars in the gutter create separate candidate peaks).
    # Use max(50, 8% of page_width) to handle various page sizes.
    cluster_radius = max(50.0, page_width * 0.08)

    clusters: list[tuple[float, float]] = []
    cluster_start = candidates[0]
    for i in range(1, len(candidates)):
        if candidates[i][0] - cluster_start[0] < cluster_radius:
            # Same cluster — keep higher score
            if candidates[i][1] > cluster_start[1]:
                cluster_start = candidates[i]
        else:
            clusters.append(cluster_start)
            cluster_start = candidates[i]
    clusters.append(cluster_start)

    # ── Post-filter: merge boundaries that are too close ──
    # A real column needs at least 10% of page width; discard thin slices.
    min_col_width = page_width * 0.10
    merged: list[tuple[float, float]] = [clusters[0]]
    for i in range(1, len(clusters)):
        if clusters[i][0] - merged[-1][0] < min_col_width:
            # Keep the one with the higher score
            if clusters[i][1] > merged[-1][1]:
                merged[-1] = clusters[i]
        else:
            merged.append(clusters[i])

    # Return boundaries sorted by position (supports 2-col and 3-col)
    return [b for b, _ in sorted(merged, key=lambda c: c[0])]


# ──────────────── Step 2 — Group Text Items into Lines ────────────────

def _group_into_lines(items: list[TextItem], tolerance: float = 4.0) -> Lines:
    """Group spans into logical lines based on y-coordinate proximity."""
    if not items:
        return []
    sorted_items = sorted(items, key=lambda i: (round(i.y, 1), i.x))
    lines: Lines = [[sorted_items[0]]]
    for item in sorted_items[1:]:
        if abs(item.y - lines[-1][0].y) <= tolerance:
            lines[-1].append(item)
        else:
            lines.append([item])
    return lines


# ──────────────── Step 3 — Group Lines into Sections ──────────────────

SECTION_KEYWORDS: dict[str, list[str]] = {
    "education":      ["education", "academic", "qualification", "academics",
                       "educational background", "scholastic record"],
    "experience":     ["experience", "employment", "work history",
                       "professional experience", "work experience",
                       "professional background", "internship",
                       "internships", "professional summary",
                       "career history", "relevant experience"],
    "skills":         ["skills", "technical skills", "core competencies",
                       "tech stack", "competencies", "proficiencies",
                       "technical proficiencies", "tools & technologies",
                       "areas of expertise", "skill set", "expertise"],
    "projects":       ["projects", "personal projects", "academic projects",
                       "side projects", "key projects", "notable projects",
                       "project experience", "project work"],
    "certifications": ["certifications", "certificates", "licenses",
                       "coding profiles", "professional development",
                       "training", "courses", "coursework",
                       "online courses", "moocs"],
    "achievements":   ["achievements", "awards", "honors", "accomplishments",
                       "recognitions", "extracurricular", "activities",
                       "leadership", "volunteer", "volunteering",
                       "publications", "research", "patents"],
    "summary":        ["summary", "objective", "about me", "profile summary",
                       "career overview", "career objective", "about",
                       "personal statement", "professional profile",
                       "executive summary", "bio", "overview",
                       "career summary"],
    "languages":      ["languages", "language proficiency", "known languages",
                       "language skills", "linguistic skills",
                       "spoken languages"],
}

# ─────────── Spoken / Natural Languages List ──────────────────────────

SPOKEN_LANGUAGES: set[str] = {
    # ── Indian ──
    "English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam",
    "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu", "Odia",
    "Assamese", "Sanskrit", "Konkani", "Sindhi", "Dogri", "Manipuri",
    "Kashmiri", "Maithili", "Bodo", "Santali", "Tulu", "Bhojpuri",
    # ── European ──
    "French", "German", "Spanish", "Portuguese", "Italian", "Dutch",
    "Swedish", "Norwegian", "Danish", "Finnish", "Polish", "Czech",
    "Greek", "Turkish", "Russian", "Ukrainian", "Romanian", "Hungarian",
    "Serbian", "Croatian", "Bosnian", "Slovak", "Slovenian",
    "Bulgarian", "Lithuanian", "Latvian", "Estonian", "Albanian",
    "Macedonian", "Icelandic", "Irish", "Welsh", "Scottish Gaelic",
    "Catalan", "Basque", "Galician", "Maltese", "Luxembourgish",
    "Belarusian", "Moldovan", "Montenegrin",
    # ── East Asian ──
    "Japanese", "Chinese", "Mandarin", "Cantonese", "Korean",
    "Taiwanese", "Hokkien", "Hakka",
    # ── Southeast Asian ──
    "Thai", "Vietnamese", "Indonesian", "Malay", "Tagalog", "Filipino",
    "Burmese", "Khmer", "Lao", "Javanese", "Cebuano",
    # ── Middle Eastern / Central Asian ──
    "Arabic", "Hebrew", "Persian", "Farsi", "Kurdish", "Pashto",
    "Dari", "Uzbek", "Kazakh", "Turkmen", "Tajik", "Azerbaijani",
    "Armenian", "Georgian",
    # ── African ──
    "Swahili", "Amharic", "Yoruba", "Igbo", "Hausa", "Zulu",
    "Xhosa", "Afrikaans", "Somali", "Tigrinya", "Oromo", "Twi",
    "Shona", "Kinyarwanda", "Lingala", "Wolof",
    # ── South Asian / other ──
    "Nepali", "Sinhala", "Dzongkha", "Tibetan", "Maldivian",
    # ── Sign / constructed ──
    "Sign Language", "ASL", "BSL", "Esperanto", "Latin",
}

# Words that look like section headers but aren't when they appear in
# body text — used as a guard.
_FALSE_HEADER_WORDS = {"the", "a", "an", "i", "my", "we", "our", "to", "and"}


def _line_text(line: Line) -> str:
    return " ".join(item.text for item in line).strip()


def _median_font_size(lines: Lines) -> float:
    sizes = [it.font_size for ln in lines for it in ln if it.font_size > 0]
    return statistics.median(sizes) if sizes else 10.0


def _majority_font(lines: Lines) -> str:
    """Return the most common font name across all spans (the 'body' font)."""
    from collections import Counter
    fonts = Counter()
    for ln in lines:
        for it in ln:
            if it.text.strip():
                fonts[it.font_name] += 1
    return fonts.most_common(1)[0][0] if fonts else ""


def _detect_section(line: Line, med_fs: float, maj_font: str = "") -> str | None:
    """Return a section key if *line* is a section header, else None.

    Real section headers are short (1-3 words), have no numbers, and
    often use bold / ALL-CAPS / larger font / different font from body.
    Lines like "Secondary Education (CBSE) 85%" are NOT headers.
    Category labels like "Languages: Python, JavaScript" are NOT headers.
    """
    text = _line_text(line)
    words = text.split()
    if not words or len(words) > 4:
        return None
    if words[0].lower() in _FALSE_HEADER_WORDS:
        return None
    # Section headers never contain digits (years, %, GPA)
    if re.search(r"\d", text):
        return None
    # Section headers never contain parenthetical content like (CBSE)
    if re.search(r"\(.*\)", text):
        return None
    # Category labels with colons followed by content are NOT section headers
    # e.g., "Languages: Python, JavaScript" or "Frontend: React.js, Next.js"
    if re.search(r":\s*\S", text):
        return None

    low = text.lower().strip()
    for key, kws in SECTION_KEYWORDS.items():
        if any(kw in low for kw in kws):
            any_bold = any(it.is_bold for it in line)
            is_upper = text.replace(" ", "").isalpha() and text.isupper()
            bigger   = any(it.font_size > med_fs * 1.05 for it in line)
            short    = len(words) <= 2
            # detect lines using a distinctly different font from body text
            # (e.g. SFCC small caps headers vs SFRM body)
            diff_font = (
                bool(maj_font)
                and all(it.font_name != maj_font for it in line if it.text.strip())
            )
            if any_bold or is_upper or bigger or short or diff_font:
                return key
    return None


def _group_lines_into_sections(lines: Lines) -> dict[str, Lines]:
    med_fs = _median_font_size(lines)
    maj_font = _majority_font(lines)
    sections: dict[str, Lines] = {}
    cur_key = "profile"
    cur_lines: Lines = []

    for line in lines:
        sec = _detect_section(line, med_fs, maj_font)
        if sec:
            # Store current accumulated lines under the current section
            if cur_key in sections:
                sections[cur_key].extend(cur_lines)
            else:
                sections[cur_key] = cur_lines
            cur_key = sec
            cur_lines = []
        else:
            cur_lines.append(line)

    # Flush the last section
    if cur_key in sections:
        sections[cur_key].extend(cur_lines)
    else:
        sections[cur_key] = cur_lines
    return sections


# ──────────── Step 3.5 — Divide Sections into Subsections ────────────

BULLET_CHARS = set("•-*–—▪▸►○●⬤⚬⦁∙⋅◦‣")


def _is_bullet_line(line: Line) -> bool:
    first = line[0].text.strip() if line else ""
    return bool(first) and first[0] in BULLET_CHARS


def _strip_bullets(text: str) -> str:
    return text.lstrip("".join(BULLET_CHARS) + " ")


def _divide_into_subsections(lines: Lines) -> Subsections:
    """Split a section's lines into subsections by vertical gap or bold."""
    if not lines:
        return []

    # Compute typical vertical gap
    gaps: list[float] = []
    for i in range(1, len(lines)):
        prev_bottom = max(it.y2 for it in lines[i - 1])
        curr_top = min(it.y for it in lines[i])
        g = curr_top - prev_bottom
        if g > 0:
            gaps.append(g)
    typical = statistics.median(gaps) if gaps else 12.0
    threshold = typical * 1.4

    subs: Subsections = [[lines[0]]]
    for i in range(1, len(lines)):
        prev_bottom = max(it.y2 for it in lines[i - 1])
        curr_top = min(it.y for it in lines[i])
        gap = curr_top - prev_bottom

        new_sub = False
        if gap > threshold and not _is_bullet_line(lines[i]):
            # Bullet lines are always continuations — never start a
            # new subsection purely because of vertical space.
            new_sub = True
        elif (lines[i][0].is_bold
              and not _is_bullet_line(lines[i])):
            # Don't let metric-only bold lines (GPA, %, scores) start
            # new subsections — they belong with the previous entry.
            lt = _line_text(lines[i]).strip()
            if re.match(r"^[\d.%/\s]+$", lt):  # e.g. "85%", "2023 94.1%"
                new_sub = False
            elif re.match(r"^(?:CGPA|GPA|Percentage|Score|Grade)\s*:", lt, re.I):
                new_sub = False
            else:
                new_sub = True

        if new_sub:
            subs.append([lines[i]])
        else:
            subs[-1].append(lines[i])
    return subs


# ─────────────────── Feature Scoring Engine ───────────────────────────

FeatureSet = list[tuple[Callable[[TextItem], Any], int]]


def _aggregate_lines(lines: Lines) -> list[TextItem]:
    """Create one TextItem per line — aggregates all spans on the line.

    This is critical: PyMuPDF splits text into font-spans so
    "Vignana Jyothi Institute of Engineering" may become 3+ spans.
    Scoring must happen on full-line text to pick up the complete
    institution / degree / company name.
    """
    items: list[TextItem] = []
    for line in lines:
        text = " ".join(it.text for it in line).strip()
        if not text:
            continue
        items.append(TextItem(
            text=text,
            x=min(it.x for it in line),
            y=min(it.y for it in line),
            x2=max(it.x2 for it in line),
            y2=max(it.y2 for it in line),
            font_name=line[0].font_name,
            font_size=max(it.font_size for it in line),
            is_bold=any(it.is_bold for it in line),
        ))

    # ── Join hyphenated line-breaks ──
    # Two-column layouts often hyphenate: "Pub-" + "lic School" → "Public School"
    merged: list[TextItem] = []
    for item in items:
        if (merged and merged[-1].text.rstrip().endswith("-")
                and item.text and item.text[0].islower()):
            prev = merged[-1]
            joined = prev.text.rstrip()[:-1] + item.text.strip()
            merged[-1] = TextItem(
                text=joined,
                x=prev.x, y=prev.y,
                x2=max(prev.x2, item.x2),
                y2=max(prev.y2, item.y2),
                font_name=prev.font_name,
                font_size=max(prev.font_size, item.font_size),
                is_bold=prev.is_bold or item.is_bold,
            )
        else:
            merged.append(item)
    return merged


def _score_items(items: list[TextItem], fs: FeatureSet) -> list[tuple[str, int]]:
    """Run feature scoring and return (text, score) pairs."""
    results: list[tuple[str, int]] = []
    for it in items:
        s = sum(weight for fn, weight in fs if fn(it))
        results.append((it.text.strip(), s))
    return results


def _best_text(items: list[TextItem], fs: FeatureSet, *,
               allow_negative: bool = False,
               concat_ties: bool = False) -> str:
    """Return the text item with the highest feature score."""
    if not items:
        return ""
    scored = _score_items(items, fs)
    mx = max(s for _, s in scored)
    if not allow_negative and mx <= 0:
        return ""
    winners = [t for t, s in scored if s == mx]
    return " ".join(dict.fromkeys(winners)) if concat_ties else winners[0]


# ────────────────── Common Feature Functions ──────────────────────────

def _is_bold(it: TextItem) -> bool:
    return it.is_bold

def _has_number(it: TextItem) -> bool:
    return bool(re.search(r"\d", it.text))

def _has_letter(it: TextItem) -> bool:
    return bool(re.search(r"[a-zA-Z]", it.text))

def _has_comma(it: TextItem) -> bool:
    return "," in it.text

def _has_at(it: TextItem) -> bool:
    return "@" in it.text

def _has_slash(it: TextItem) -> bool:
    return "/" in it.text

def _has_paren(it: TextItem) -> bool:
    return bool(re.search(r"\(\d", it.text))

def _is_all_upper(it: TextItem) -> bool:
    t = re.sub(r"[^A-Za-z]", "", it.text)
    return len(t) > 1 and t == t.upper()

def _only_letters_spaces(it: TextItem) -> bool:
    return bool(re.match(r"^[A-Za-z\s.]+$", it.text.strip()))

def _has_4w(it: TextItem) -> bool:
    return len(it.text.split()) >= 4

def _has_5w(it: TextItem) -> bool:
    return len(it.text.split()) >= 5

def _match_email(it: TextItem) -> bool:
    return bool(re.search(r"\S+@\S+\.\S+", it.text))

def _match_phone(it: TextItem) -> bool:
    return bool(re.search(
        r"\+?\d[\d\s\-().]{7,}\d", it.text))

def _match_url(it: TextItem) -> bool:
    return bool(re.search(
        r"(?:https?://|www\.)\S+|linkedin\.com|github\.com", it.text, re.I))

def _match_city_state(it: TextItem) -> bool:
    return bool(re.search(r"[A-Z][a-zA-Z\s]+,\s*[A-Z]", it.text))


# ──── Date helpers ────

_DATE_RNG = re.compile(
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s*\d{4})"
    r"\s*[-–—]+\s*"
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s*\d{4}"
    r"|[Pp]resent|[Cc]urrent)",
    re.I,
)
_YEAR_RNG = re.compile(
    r"((?:19|20)\d{2})\s*[-–—]+\s*((?:19|20)\d{2}|[Pp]resent|[Cc]urrent)")
_SINGLE_YEAR = re.compile(r"\b((?:19|20)\d{2})\b")

def _match_date(it: TextItem) -> bool:
    return bool(_DATE_RNG.search(it.text) or _YEAR_RNG.search(it.text))

_DATE_FS: FeatureSet = [(_match_date, 4), (_has_letter, -1)]


# ──── Descriptor helpers ────

def _bullet_descriptions(lines: Lines) -> list[str]:
    """Collect bullet-point descriptions from lines."""
    descs: list[str] = []
    buf: list[str] = []
    for line in lines:
        raw = _line_text(line)
        if not raw:
            continue
        if raw[0] in BULLET_CHARS:
            if buf:
                descs.append(" ".join(buf))
                buf = []
            buf.append(_strip_bullets(raw))
        else:
            buf.append(raw)
    if buf:
        descs.append(" ".join(buf))
    return descs


def _desc_start_idx(lines: Lines) -> int:
    """Index of the first bullet-point or 3rd+ line (whichever comes first)."""
    for i, ln in enumerate(lines):
        if _is_bullet_line(ln):
            return i
    return min(2, len(lines))


# ───────────────────── Profile Extraction ─────────────────────────────

_NAME_FS: FeatureSet = [
    (_only_letters_spaces, 3), (_is_bold, 2), (_is_all_upper, 2),
    (_has_at, -4), (_has_number, -4), (_has_paren, -4),
    (_has_comma, -4), (_has_slash, -4), (_has_4w, -2),
]
_EMAIL_FS: FeatureSet = [
    (_match_email, 4), (_is_bold, -1), (_is_all_upper, -1), (_has_paren, -4),
]
_PHONE_FS: FeatureSet = [(_match_phone, 4), (_has_letter, -4)]
_LOC_FS: FeatureSet = [
    (_match_city_state, 4), (_is_bold, -1),
    (_has_at, -4), (_has_paren, -3), (_has_slash, -4),
]
_URL_FS: FeatureSet = [
    (_match_url, 4), (_is_bold, -1),
    (_has_at, -4), (_has_paren, -3), (_has_comma, -4), (_has_4w, -4),
]

# Terms that spaCy GPE incorrectly picks up from resumes
_GPE_BLACKLIST = {
    "react", "next.js", "node.js", "express", "linkedin", "github",
    "angular", "vue", "django", "flask", "fastapi", "docker",
}


def _extract_profile(profile_lines: Lines, full_text: str) -> dict[str, str]:
    """Extract contact info from the profile/header section.

    Returns dict with keys: name, email, phone, linkedin, github,
    portfolio, location.
    """
    # Use per-span items for email/phone/url (single span), but
    # aggregate for name/location (may span multiple font-runs).
    span_items = [it for ln in profile_lines for it in ln]
    agg_items  = _aggregate_lines(profile_lines)
    name     = _best_text(agg_items, _NAME_FS)
    email    = _best_text(span_items, _EMAIL_FS)
    phone    = _best_text(span_items, _PHONE_FS)
    location = _best_text(agg_items, _LOC_FS)
    url      = _best_text(span_items, _URL_FS)

    # ── Extract LinkedIn, GitHub, Portfolio URLs from profile spans ──
    linkedin = ""
    github = ""
    portfolio = ""
    _URL_RE = re.compile(r"https?://\S+|(?:www\.)?\S+\.\S+/\S*")

    for it in span_items:
        low = it.text.lower().strip()
        if not low:
            continue

        # LinkedIn
        if not linkedin and "linkedin.com" in low:
            m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/\S+", it.text, re.I)
            linkedin = m.group(0) if m else it.text.strip()
            continue

        # GitHub
        if not github and "github.com" in low:
            m = re.search(r"(?:https?://)?(?:www\.)?github\.com/\S+", it.text, re.I)
            github = m.group(0) if m else it.text.strip()
            continue

        # Portfolio — any URL not matching linkedin/github/email providers
        if not portfolio:
            m = _URL_RE.search(it.text)
            if m:
                candidate = m.group(0).rstrip(".,;:)")
                skip_domains = (
                    "linkedin.com", "github.com", "mailto:",
                    "gmail.com", "outlook.com", "yahoo.com",
                    "hotmail.com", "google.com", "facebook.com",
                    "twitter.com", "x.com", "instagram.com",
                )
                if not any(d in candidate.lower() for d in skip_domains):
                    portfolio = candidate

    # ── Also scan full text for GitHub/LinkedIn if not found in profile ──
    if not linkedin:
        m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+", full_text, re.I)
        if m:
            linkedin = m.group(0)
    if not github:
        m = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w-]+", full_text, re.I)
        if m:
            github = m.group(0)

    # Fallback location via spaCy GPE on header text only
    if not location:
        try:
            import spacy
            # Do not trigger runtime model downloads; they can fail in locked environments.
            try:
                nlp = spacy.load("en_core_web_sm")
            except OSError:
                nlp = spacy.blank("en")
            header_text = " ".join(it.text for it in span_items[:30])
            doc = nlp(header_text)
            gpes = [
                ent.text for ent in doc.ents
                if ent.label_ == "GPE" and ent.text.lower() not in _GPE_BLACKLIST
            ]
            location = ", ".join(dict.fromkeys(gpes))
        except BaseException:
            pass

    return dict(name=name, email=email, phone=phone,
                linkedin=linkedin, github=github,
                portfolio=portfolio, location=location)


# ──────────────────── Education Extraction ────────────────────────────

_SCHOOL_KWS = [
    "University", "College", "Institute", "School", "Academy",
    "Vidyalaya", "IIT", "NIT", "IIIT", "BITS", "NSIT",
    "Polytechnic", "Conservatory", "Seminary", "Lyceum",
    "Community College", "Technical School", "Trade School",
    "Campus", "Faculdade", "Universidade", "Hochschule",
    "Ecole", "Grande Ecole", "Grandes Ecoles",
]

def _has_school(it: TextItem) -> bool:
    return any(k.lower() in it.text.lower() for k in _SCHOOL_KWS)

_DEGREE_KWS = [
    "Associate", "Bachelor", "Master", "PhD", "Ph.D", "Doctorate",
    "B.S.", "M.S.", "B.A.", "M.A.", "B.Tech", "M.Tech", "B.E.", "M.E.",
    "MBA", "BBA", "BCA", "MCA", "B.Sc", "M.Sc", "B.Com", "M.Com",
    "Diploma", "Intermediate", "Higher Secondary", "SSC", "HSC",
    "CBSE", "ICSE", "Class X", "Class XII",
    "High School", "Secondary School", "Primary",
    "B.Pharm", "M.Pharm", "MBBS", "MD", "MS", "BDS", "MDS",
    "LLB", "LLM", "B.Arch", "M.Arch", "B.Des", "M.Des",
    "BE", "ME", "MTech", "BTech", "BSc", "MSc",
    "BBA", "BMS", "BFA", "MFA", "BMus", "BEd", "MEd",
    "GED", "A-Level", "O-Level", "GCSE", "IB",
    "Post Graduate", "Postgraduate", "PG Diploma",
    "Undergraduate", "Graduate", "Degree",
]

def _has_degree(it: TextItem) -> bool:
    t = it.text
    for d in _DEGREE_KWS:
        if d.lower() in t.lower():
            return True
    return bool(re.search(r"\b[ABM]\.[A-Za-z]+\.?\b", t))

def _match_gpa(it: TextItem) -> bool:
    return bool(re.search(r"\b\d\.\d{1,2}\b", it.text))

_SCHOOL_FS: FeatureSet = [(_has_school, 4), (_has_degree, -4), (_has_number, -3)]
_DEGREE_FS: FeatureSet = [(_has_degree, 4), (_has_school, -4), (_has_number, -2)]
_GPA_FS: FeatureSet    = [(_match_gpa, 4), (_has_comma, -3)]


def _years_from_items(items: list[TextItem]) -> tuple[str, str]:
    """Extract (start_year, end_year) from text items."""
    all_text = " ".join(it.text for it in items)
    m = _YEAR_RNG.search(all_text)
    if m:
        return m.group(1), m.group(2)
    years = _SINGLE_YEAR.findall(all_text)
    if len(years) >= 2:
        return years[0], years[1]
    if len(years) == 1:
        return years[0], ""
    return "", ""


def _clean_date_suffix(text: str) -> str:
    """Strip trailing year ranges and dates from text (e.g. institution names)."""
    # Remove trailing year ranges: "2023 – 2027", "2021 – 2023", "2021"
    text = re.sub(r"\s*\d{4}\s*[–\-—]+\s*(?:\d{4}|[Pp]resent|[Cc]urrent)\s*$", "", text)
    text = re.sub(r"\s+\d{4}\s*$", "", text)
    # Remove trailing month-year ranges
    text = re.sub(
        r"\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\w*\.?\s*\d{4}"
        r"\s*[–\-—]+\s*"
        r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\w*\.?\s*\d{4}|[Pp]resent|[Cc]urrent)\s*$",
        "", text, flags=re.I)
    return text.strip()


def _extract_education(section_lines: Lines) -> list[Education]:
    subs = _divide_into_subsections(section_lines)
    entries: list[Education] = []
    for sub in subs:
        # Aggregate spans into whole-line items so feature scoring sees
        # "Vignana Jyothi Institute of Engineering and Technology"
        # instead of just the span containing "Institute".
        items = _aggregate_lines(sub)
        school = _best_text(items, _SCHOOL_FS, allow_negative=True)
        degree_raw = _best_text(items, _DEGREE_FS, allow_negative=True)

        # ── Fallback: when institution looks like a metric (CGPA/GPA/%)
        # and the degree line contains comma-separated parts, split them.
        # Common in Indian resumes: "B.Tech, CSE, VNR VJIET"
        _school_bad = bool(re.match(
            r"^(?:CGPA|GPA|Percentage|Score|Grade)\s*:|^\d+\.?\d*\s*%?$",
            school.strip(), re.I))
        field_from_comma = ""
        if _school_bad and "," in degree_raw:
            parts = [p.strip() for p in degree_raw.split(",") if p.strip()]
            if len(parts) >= 2:
                degree_raw = parts[0]
                school = parts[-1]
                if len(parts) >= 3:
                    field_from_comma = ", ".join(parts[1:-1])

        # Split degree + field  ("B.Tech in Computer Science & Engineering")
        degree = degree_raw
        field_of_study = field_from_comma
        if not field_of_study:
            for sep in [" in ", " of "]:
                if sep in degree_raw:
                    parts = degree_raw.split(sep, 1)
                    degree = parts[0].strip()
                    field_of_study = parts[1].strip()
                    break

        # If no field from degree text, check other line-items for field keywords
        if not field_of_study:
            _FIELD_KWS = ["science", "engineering", "arts", "commerce",
                          "business", "computer", "information",
                          "technology", "mathematics", "physics",
                          "electronics", "electrical", "mechanical",
                          "civil", "chemical"]
            for it in items:
                if it.text.strip() == degree_raw or it.text.strip() == school:
                    continue
                low = it.text.lower()
                if any(f in low for f in _FIELD_KWS):
                    # Clean: remove GPA / year fragments
                    clean = re.sub(r"\b\d[\d.]*\b", "", it.text)
                    clean = re.sub(r"CGPA|GPA|cgpa|gpa", "", clean).strip(" \n|–—-:")
                    if clean:
                        field_of_study = clean
                    break

        # Clean up institution: strip date ranges and trailing location
        school = _clean_date_suffix(school)
        # Strip trailing "City, State" or "City, Country" patterns
        school = re.sub(r",?\s+[A-Z][a-z]+,\s+[A-Z][a-z]+\s*$", "", school).strip()

        sy, ey = _years_from_items(items)

        # Clean up field — strip GPA and date fragments
        if field_of_study:
            field_of_study = re.sub(
                r"\s*(?:CGPA|GPA|cgpa|gpa)\s*:?\s*\d+\.\d+(?:/\d+)?\s*",
                "", field_of_study).strip()
            field_of_study = _clean_date_suffix(field_of_study)

        # Clean up degree — strip percentage, "Full-time" prefix, and dates
        degree = re.sub(r"\s+\d+\.?\d*%$", "", degree).strip()
        degree = re.sub(r"^Full-time\s+", "", degree, flags=re.I).strip()
        degree = _clean_date_suffix(degree)

        # If degree looks like a GPA line ("CGPA: 10"), skip or try to find real degree
        if re.match(r"^(?:CGPA|GPA|Percentage)\s*:", degree, re.I):
            degree = ""

        if school or degree:
            entries.append(Education(
                institution=school, degree=degree,
                field=field_of_study,
                start_year=sy, end_year=ey,
            ))
    return entries


# ──────────────────── Experience Extraction ───────────────────────────

_JOB_TITLE_KWS = [
    "Engineer", "Developer", "Manager", "Analyst", "Designer",
    "Intern", "Lead", "Director", "Architect", "Consultant",
    "Coordinator", "Specialist", "Associate", "Scientist",
    "Founder", "Co-Founder", "CTO", "CEO", "VP", "Administrator",
    "Researcher", "Fellow", "Trainee", "Assistant", "Head",
    "Officer", "Executive", "Programmer", "Tester",
    "Full Stack", "Frontend", "Backend", "Software", "Senior", "Junior",
    "DevOps", "SRE", "SDE", "Data", "QA", "Product", "Project",
    "Technician", "Operator", "Supervisor", "Principal",
    "Staff", "Contractor", "Freelance", "Mentor", "Tutor",
    "Coach", "Instructor", "Professor", "Lecturer", "Teacher",
    "Strategist", "Planner", "Auditor", "Compliance",
    "Volunteer", "Apprentice", "Trainee", "Cadet",
    "Member", "Contributor", "Maintainer",
]

def _has_job_title(it: TextItem) -> bool:
    return any(k.lower() in it.text.lower() for k in _JOB_TITLE_KWS)

_TITLE_FS: FeatureSet = [(_has_job_title, 4), (_has_number, -4), (_has_5w, -2)]


def _extract_experience(section_lines: Lines) -> list[Experience]:
    """Extract experience entries.

    Handles two formats:
      A) Structured — bold header line "Title – Company DateRange" + description lines
      B) Bullet-point — "• Title – Description" per line (e.g. certifications section)
    """
    if not section_lines:
        return []

    # Detect format: if MOST lines start with bullets, use bullet parser
    agg_all = _aggregate_lines(section_lines)
    bullet_count = sum(1 for it in agg_all if it.text.strip()[:1] in BULLET_CHARS)
    total = len(agg_all)
    is_bullet_format = total > 0 and (bullet_count / total) > 0.4

    if is_bullet_format:
        return _extract_experience_bullets(section_lines)
    else:
        return _extract_experience_structured(section_lines)


def _extract_experience_bullets(section_lines: Lines) -> list[Experience]:
    """Parse bullet-point experience/certification entries."""
    agg = _aggregate_lines(section_lines)
    entries: list[Experience] = []
    for it in agg:
        raw = it.text.strip()
        if not raw:
            continue
        # Strip bullet character
        raw = _strip_bullets(raw)
        if not raw:
            continue

        # Split on first " – " or " - " to get title and description
        parts = re.split(r"\s*[–—]\s*", raw, maxsplit=1)
        title = parts[0].strip() if parts else raw
        desc = parts[1].strip() if len(parts) > 1 else ""

        # Extract date range if present
        dur_match = _DATE_RNG.search(raw) or _YEAR_RNG.search(raw)
        duration = dur_match.group(0) if dur_match else ""

        if title:
            entries.append(Experience(
                company="", title=title,
                duration=duration, description=desc,
            ))
    return entries


def _extract_experience_structured(section_lines: Lines) -> list[Experience]:
    """Parse structured experience: bold header + description lines.

    Handles multiple header formats:
      - "Title – Company DateRange"
      - "Company | Title" (next line: "Location | DateRange")
      - "Title at Company"
    """
    subs = _divide_into_subsections(section_lines)
    entries: list[Experience] = []
    for sub in subs:
        agg = _aggregate_lines(sub)
        if not agg:
            continue

        header = agg[0].text

        # Check for date range in header OR second line
        dur_match = _DATE_RNG.search(header) or _YEAR_RNG.search(header)
        duration = dur_match.group(0) if dur_match else ""

        # Check second line for date if not found in header
        if not duration and len(agg) > 1:
            line2 = agg[1].text
            dur_match2 = _DATE_RNG.search(line2) or _YEAR_RNG.search(line2)
            if dur_match2:
                duration = dur_match2.group(0)

        # Remove date from header to isolate title and company
        header_clean = header
        if dur_match:
            header_clean = header[:dur_match.start()].strip()

        # Try pipe separator first: "Company | Title"
        if "|" in header_clean:
            pipe_parts = [p.strip() for p in header_clean.split("|") if p.strip()]
            if len(pipe_parts) >= 2:
                # Heuristic: if second part has job title keyword, it's "Company | Title"
                if any(kw.lower() in pipe_parts[1].lower() for kw in _JOB_TITLE_KWS):
                    company = pipe_parts[0]
                    title = pipe_parts[1]
                else:
                    title = pipe_parts[0]
                    company = pipe_parts[1]
            elif pipe_parts:
                title = pipe_parts[0]
                company = ""
            else:
                title = header_clean
                company = ""
        else:
            # Split on " – " or " - " (em-dash/en-dash between role and org)
            # Require space on BOTH sides to avoid splitting compound words
            # like "Open-source" or "Full-stack"
            parts = re.split(r"\s+[–—-]\s+", header_clean, maxsplit=1)
            title = parts[0].strip() if parts else ""
            company = parts[1].strip() if len(parts) > 1 else ""

        # Clean location from company and title ("Company Location")
        _loc_pat = re.compile(r",?\s+[A-Z][a-z]+,\s+[A-Z][a-z]+\s*$")
        company = _loc_pat.sub("", company).strip().rstrip(" |")
        title = _loc_pat.sub("", title).strip().rstrip(" |")

        # Description = non-header/date lines
        descs: list[str] = []
        tech_line = ""
        skip_2nd = (not dur_match and duration)  # 2nd line was date
        for i, item in enumerate(agg[1:], 1):
            if skip_2nd and i == 1:
                continue  # skip the location/date line
            t = item.text.strip()
            if re.match(r"^(?:Skills|Tech)\s*:", t, re.I):
                tech_line = t
            # Skip pure location lines (e.g., "Hyderabad, Telangana")
            elif re.match(r"^[A-Z][a-z]+,\s+[A-Z][a-z]+$", t):
                continue
            else:
                descs.append(t)

        desc = " ".join(descs)
        if tech_line:
            desc = f"{desc} | {tech_line}" if desc else tech_line

        if title or company:
            entries.append(Experience(
                company=company, title=title,
                duration=duration, description=desc,
            ))
    return entries


# ───────────────────── Project Extraction ─────────────────────────────

_LINK_RE = re.compile(r"(?:Live|Demo|GitHub|§|https?://|www\.)", re.I)
_TECH_PREFIX_RE = re.compile(r"^Tech(?:nologies|nology|:|\s*Stack)", re.I)


def _looks_like_tech_list(text: str) -> bool:
    """Check if text looks like a comma-separated tech list (e.g. 'React, Node.js, MongoDB')."""
    parts = [p.strip() for p in text.split(",") if p.strip()]
    if len(parts) < 2:
        return False
    # Most parts should be short (≤3 words) and match known skills
    matched = 0
    for p in parts:
        if len(p.split()) > 3:
            return False
        for skill in CANONICAL_SKILLS:
            # Use word-boundary matching to avoid single-letter false positives
            # ("C" matching "caching", "R" matching "streaming", etc.)
            pat = re.compile(r"\b" + re.escape(skill) + r"\b", re.I)
            if pat.search(p):
                matched += 1
                break
    return matched >= len(parts) * 0.6


def _extract_projects(section_lines: Lines) -> list[Project]:
    # If section is empty, it might have been missed — return early
    if not section_lines:
        return []

    # For this resume style, each project is a 3-line block:
    #   Line A:  <icon> | ProjectName (Subtitle)  Live GitHub
    #   Line B:  Description sentence
    #   Line C:  Tech: framework1, framework2, ...
    #
    # We detect project-header lines by checking for bold spans (CMBX*).
    # We group lines into per-project blocks, then extract fields.

    entries: list[Project] = []
    project_blocks: list[Lines] = []
    current_block: Lines = []

    for ln in section_lines:
        # A line with bold spans that is NOT a tech/skills line = new project
        has_bold = any(it.is_bold for it in ln)
        lt = _line_text(ln)
        lt_stripped = _strip_bullets(lt)
        # Detect tech/skills lines: "Tech: ...", "Technologies used: ...", "Skills: ..."
        is_tech = bool(re.match(
            r"^(?:Tech(?:nolog(?:ies|y))?(?:\s+used)?|Skills)\s*:",
            lt_stripped, re.I,
        ))
        # Bullet lines with bold text are NOT new project headers
        is_bullet = bool(lt.strip()) and lt.strip()[0] in BULLET_CHARS

        if has_bold and not is_tech and not is_bullet:
            if current_block:
                project_blocks.append(current_block)
            current_block = [ln]
        else:
            current_block.append(ln)

    if current_block:
        project_blocks.append(current_block)

    for block in project_blocks:
        agg = _aggregate_lines(block)
        if not agg:
            continue

        header = agg[0].text

        # Extract project name from bold spans on the header line
        bold_spans = [it.text.strip() for it in block[0] if it.is_bold]
        name = " ".join(bold_spans).strip() if bold_spans else ""

        # Extract subtitle / technologies from parentheses in header
        tech_from_header = ""
        paren_match = re.search(r"\((.+?)\)", header)
        if paren_match:
            tech_from_header = paren_match.group(1).strip()
            # Remove paren content from name if it got included
            name = name.replace(f"({tech_from_header})", "").strip()

        # Clean name: remove link words, "Link" word, and special chars
        name = re.sub(r"\s*(?:Live|Demo|GitHub|§|�|\|)\s*", " ", name).strip()
        name = re.sub(r"\bLink\b", "", name).strip()
        name = name.strip(" |–—-")

        if not name:
            continue

        # Description and tech from remaining lines
        desc_parts: list[str] = []
        tech_str = tech_from_header

        for i, item in enumerate(agg[1:]):
            t = item.text.strip()
            # Strip bullet prefix for matching
            t_nobullet = _strip_bullets(t)
            if re.match(r"^(?:Tech(?:nolog(?:ies|y))?(?:\s+used)?|Skills)\s*:", t_nobullet, re.I):
                tech_str = re.sub(
                    r"^(?:Tech(?:nolog(?:ies|y))?(?:\s+used)?|Skills)\s*:\s*",
                    "", t_nobullet, flags=re.I,
                ).strip()
            elif not tech_str and _looks_like_tech_list(t):
                # Line is comma-separated tech names (italic/slanted font)
                tech_str = t
            else:
                # Skip icon-only or link-only fragments
                if len(t) > 5 and not re.match(r"^[§�|\s]+$", t):
                    # Skip link-only lines (e.g. "§ GitHub — Live Demo")
                    t_clean = re.sub(r"^[\s—–\u2012-]+", "", t)
                    if _LINK_RE.match(t_clean) and len(t) < 40:
                        continue
                    desc_parts.append(t)

        # If no explicit Tech line, extract tech names from description
        if not tech_str and desc_parts:
            all_desc = " ".join(desc_parts)
            techs_found: list[str] = []
            for skill in CANONICAL_SKILLS:
                pat = re.compile(r"\b" + re.escape(skill) + r"\b", re.I)
                if pat.search(all_desc):
                    techs_found.append(skill)
            if techs_found:
                tech_str = ", ".join(techs_found)

        entries.append(Project(
            name=name,
            description=" ".join(desc_parts),
            technologies=tech_str,
        ))

    return entries


# ──────────────────── Skills & Languages ──────────────────────────────

def _extract_skills(section_lines: Lines, full_text: str) -> list[str]:
    """Extract ALL technical skills (languages + frameworks + tools + DBs).

    Parses "Category: item1, item2" format from skills section PLUS
    fuzzy-matches against the full resume text.
    """
    section_text = " ".join(_line_text(ln) for ln in section_lines)
    combined = f"{section_text}\n{full_text}"

    found: set[str] = set()

    # Exact match from canonical list (includes programming languages)
    for skill in CANONICAL_SKILLS:
        pat = re.compile(r"\b" + re.escape(skill) + r"\b", re.I)
        if pat.search(combined):
            found.add(skill)

    # Fuzzy match from skills section text
    if section_text:
        # Remove category labels like "Languages:", "Frameworks:", etc.
        cleaned = re.sub(r"(?:Languages|Frameworks|Databases?|Tools|Cloud|Development\s+Tools|Dev\s+Tools)\s*(?:&\s*\w+)?\s*:", ",", section_text, flags=re.I)
        candidates = re.split(r"[,;|•·:\n\r\t]+", cleaned)
        candidates = [c.strip() for c in candidates if 1 <= len(c.strip()) <= 40]
        for cand in candidates:
            best = process.extractOne(
                cand, CANONICAL_SKILLS, scorer=fuzz.token_sort_ratio)
            if best and best[1] >= 82:
                found.add(best[0])

    return sorted(found)

def _extract_spoken_languages(section_lines: Lines) -> list[str]:
    """Extract spoken / natural languages from the Languages section.

    Handles formats like:
      - "English, Hindi, Telugu"
      - "• English: Advanced (C1)"
      - "English – Fluent"
    Strips proficiency levels and returns just the language names.
    """
    text = " ".join(_line_text(ln) for ln in section_lines)
    candidates = re.split(r"[,;|•·\n\r\t]+", text)
    result: list[str] = []
    for c in candidates:
        c = c.strip()
        if not c:
            continue
        # Strip proficiency: "English: Advanced (C1)" → "English"
        c = re.sub(r"\s*[:–—-]\s*.*$", "", c).strip()
        # Strip parenthetical: "English (Native)" → "English"
        c = re.sub(r"\s*\(.*?\)", "", c).strip()
        for lang in SPOKEN_LANGUAGES:
            if lang.lower() == c.lower():
                result.append(lang)
                break
    return sorted(set(result))


# ──────────────────── Bio / Summary Extraction ───────────────────────

def _extract_bio(sections: dict[str, Lines]) -> str:
    """Extract a bio/summary paragraph from the resume.

    Looks in the 'summary' section first (Career Overview, About Me,
    Professional Summary, etc.), then falls back to long non-header
    lines in the 'profile' section.
    """
    # Primary: dedicated summary section
    summary_lines = sections.get("summary", [])
    if summary_lines:
        parts: list[str] = []
        for ln in summary_lines:
            text = " ".join(it.text for it in ln).strip()
            if text:
                # Strip bullet prefixes
                text = text.lstrip("".join(BULLET_CHARS) + " ")
                parts.append(text)
        bio = " ".join(parts).strip()
        if len(bio) > 20:
            return bio[:1000]  # cap at reasonable length

    # Fallback: long paragraph lines in the profile section
    profile_lines = sections.get("profile", [])
    if profile_lines:
        candidates: list[str] = []
        for ln in profile_lines:
            text = " ".join(it.text for it in ln).strip()
            # Only non-bold, non-link, long-ish lines
            all_bold = all(it.is_bold for it in ln if it.text.strip())
            has_url = bool(re.search(r"https?://|@|linkedin|github", text, re.I))
            if len(text) > 50 and not all_bold and not has_url:
                candidates.append(text)
        if candidates:
            return " ".join(candidates).strip()[:1000]

    return ""


# ──────────────────── Confidence Scoring ──────────────────────────────

def _compute_confidence(r: ParseResult) -> float:
    score = 0.0
    total = 7.0
    if r.education:  score += 1.0
    if r.experience: score += 1.0
    if r.skills:     score += 1.0
    if r.languages:  score += 0.5
    if r.projects:   score += 0.5
    bi = r.basic_info
    if bi.location:  score += 0.3
    if bi.phone:     score += 0.2
    if bi.linkedin or bi.github: score += 0.3
    if bi.bio:       score += 0.2
    # Detail bonus
    if any(e.institution and e.degree for e in r.education):
        score += 0.75
    if any(e.title for e in r.experience):
        score += 0.75
    return round(min(score / total, 1.0), 2)


# ─────────────────────── Public API ───────────────────────────────────

def parse_resume_bytes(pdf_bytes: bytes) -> dict[str, Any]:
    """Parse a PDF resume and return structured data."""
    items, plain = _extract_text_items(pdf_bytes)
    if not items:
        return ParseResult(confidence=0.0).model_dump()

    lines = _group_into_lines(items)
    sections = _group_lines_into_sections(lines)

    # Profile / contact info
    profile = _extract_profile(sections.get("profile", []), plain)

    # Bio / summary
    bio = _extract_bio(sections)

    # Build BasicInfo
    basic_info = BasicInfo(
        phone=profile.get("phone", ""),
        location=profile.get("location", ""),
        linkedin=profile.get("linkedin", ""),
        github=profile.get("github", ""),
        portfolio=profile.get("portfolio", ""),
        bio=bio,
    )

    # Sections
    education  = _extract_education(sections.get("education", []))
    experience = _extract_experience(sections.get("experience", []))
    skills     = _extract_skills(sections.get("skills", []), plain)
    projects   = _extract_projects(sections.get("projects", []))

    # Spoken languages — from dedicated "languages" section
    spoken_langs = _extract_spoken_languages(sections.get("languages", []))

    result = ParseResult(
        basic_info=basic_info,
        education=education,
        experience=experience,
        skills=skills,
        languages=spoken_langs,
        projects=projects,
    )
    result.confidence = _compute_confidence(result)
    return result.model_dump()