import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import "dotenv/config";

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "u451653929_ImranSir",
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// Set up directory paths
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_FILE = path.join(process.cwd(), "db_store.json");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, JPG, and WEBP image formats are allowed"));
    }
  },
});

const DEFAULT_SETTINGS = {
  siteNameBn: "স্টুডেন্টস কেয়ার মডেল স্কুল",
  siteNameEn: "Students Care Model School",
  addressBn: "কর্ণফুলী, চট্টগ্রাম",
  addressEn: "Karnafuli, Chattogram",
  eiin: "134256",
  foundedYear: "২০১৫",
  helpline: "01812-345678",
  email: "info@studentscaremodel.edu.bd",
  website: "www.studentscaremodel.edu.bd",
  bannerColor: "#025644",
  bannerFontSize: 32,
  bannerGradient: true,
  logoUrl: "",
};

const INITIAL_STUDENTS = [
  {
    sl: 1024,
    photo: "",
    roll: "12",
    name: "Aarav Hossain",
    class: "Class VIII",
    section: "A",
    guardian: "Rashid Hossain",
    phone: "01711223344",
    created_at: new Date().toISOString(),
  },
  {
    sl: 1025,
    photo: "",
    roll: "05",
    name: "Maya Rahman",
    class: "Class VI",
    section: "B",
    guardian: "Sumi Rahman",
    phone: "01712998877",
    created_at: new Date().toISOString(),
  },
  {
    sl: 1026,
    photo: "",
    roll: "18",
    name: "Tanvir Ahmed",
    class: "Class IX",
    section: "A",
    guardian: "Karim Ahmed",
    phone: "01718554433",
    created_at: new Date().toISOString(),
  },
  {
    sl: 1027,
    photo: "",
    roll: "22",
    name: "Nadia Islam",
    class: "Class VII",
    section: "C",
    guardian: "Lipi Islam",
    phone: "01719112233",
    created_at: new Date().toISOString(),
  },
];

// Read database or initialize
function getDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Error parsing db_store.json, resetting to defaults", e);
    }
  }
  const initialDb = {
    settings: DEFAULT_SETTINGS,
    slider: null,
    students: INITIAL_STUDENTS,
    examSeatPlans: [],
    studentRecords: [],
  };
  saveDb(initialDb);
  return initialDb;
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static uploads
  app.use("/uploads", express.static(UPLOADS_DIR));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ==========================================
  // API Routes (Node.js / Express Backend)
  // ==========================================

  // 1. Get Settings & Banner (/api/banner)
  const getBannerHandler = (req, res) => {
    const db = getDb();
    res.json({
      status: "success",
      settings: db.settings,
      slider: db.slider,
    });
  };

  app.get("/api/banner", getBannerHandler);

  // 2. Save Settings & Banner (/api/banner)
  const saveBannerHandler = (req, res) => {
    upload.single("logo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ status: "error", message: err.message });
      }

      const db = getDb();
      const body = req.body;

      let logoUrl = db.settings.logoUrl;
      if (req.file) {
        logoUrl = "uploads/" + req.file.filename;
      } else if (body.logoUrl !== undefined) {
        logoUrl = body.logoUrl;
      }

      db.settings = {
        siteNameBn: body.siteNameBn || db.settings.siteNameBn,
        siteNameEn: body.siteNameEn || db.settings.siteNameEn,
        addressBn: body.addressBn || db.settings.addressBn,
        addressEn: body.addressEn || db.settings.addressEn,
        eiin: body.eiin || db.settings.eiin,
        foundedYear: body.foundedYear || db.settings.foundedYear,
        helpline: body.helpline || db.settings.helpline,
        email: body.email || db.settings.email,
        website: body.website || db.settings.website,
        bannerColor: body.bannerColor || db.settings.bannerColor,
        bannerFontSize: body.bannerFontSize ? parseInt(body.bannerFontSize, 10) : db.settings.bannerFontSize,
        bannerGradient: body.bannerGradient === "true" || body.bannerGradient === "1" || body.bannerGradient === true,
        logoUrl,
      };

      saveDb(db);

      res.json({
        status: "success",
        message: "Settings and banner parameters saved successfully!",
        settings: db.settings,
      });
    });
  };
  app.post("/api/banner", saveBannerHandler);

  // 3. Save Slider (/api/slider)
  const saveSliderHandler = (req, res) => {
    const db = getDb();
    let sliderJson = req.body.slider;

    if (!sliderJson && req.body) {
      if (req.body.slider !== undefined) {
        sliderJson = req.body.slider;
      } else if (Array.isArray(req.body)) {
        sliderJson = req.body;
      }
    }

    if (typeof sliderJson === "string") {
      try {
        db.slider = JSON.parse(sliderJson);
      } catch (e) {
        return res.status(400).json({ status: "error", message: "Invalid slider JSON format" });
      }
    } else if (Array.isArray(sliderJson)) {
      db.slider = sliderJson;
    } else if (sliderJson) {
      db.slider = [sliderJson];
    }

    saveDb(db);

    res.json({
      status: "success",
      message: "Slider parameters saved successfully!",
      slider: db.slider,
    });
  };
  app.post("/api/slider", saveSliderHandler);

  // 3.1 Save Frontend Data (/api/frontend-data)
  const saveFrontendDataHandler = (req, res) => {
    const db = getDb();
    const data = req.body;
    db.settings = { ...db.settings, ...data };
    saveDb(db);
    res.json({ status: "success", message: "Data saved" });
  };
  app.post("/api/frontend-data", saveFrontendDataHandler);

  // 4. Insert Student (/api/students)
  const insertStudentHandler = async (req, res) => {
    const handleSave = async (req, res) => {
      const body = req.body || {};
      const roll = body.roll;
      const name = body.name;
      const className = body.class_name || body.class;
      const section = body.section || "A";
      const guardian = body.guardian || "N/A";
      const phone = body.mobile_number || body.phone;
      const address = body.address || "N/A";

      if (!roll || !name || !className || !phone) {
        return res.status(400).json({
          status: "error",
          message: "Validation Failed: Roll, Name, Class, and Phone Number are mandatory.",
        });
      }

      let photoPath = "";
      if (req.file) {
        photoPath = "uploads/" + req.file.filename;
      } else if (body.photo) {
        photoPath = body.photo;
      }

      try {
        const query = 'INSERT INTO students (name, roll, class_name, section, mobile_number, address, guardian) VALUES (?, ?, ?, ?, ?, ?, ?);';
        await getPool().execute(query, [name, roll, className, section, phone, address, guardian]);

        // Also update local fallback store
        const db = getDb();
        const newStudent = {
          sl: Date.now(),
          photo: photoPath,
          roll,
          name,
          class: className,
          section,
          guardian,
          phone,
          created_at: new Date().toISOString(),
        };
        db.students.unshift(newStudent);
        saveDb(db);

        return res.status(201).json({
          status: "success",
          message: "Student record has been successfully inserted into MySQL database table!",
          student: {
            name,
            roll,
            class: className,
            section,
            guardian,
            mobile_number: phone,
            address,
            photo: photoPath || "No Photo Uploaded",
          },
        });
      } catch (e) {
        console.error("MySQL Insert error:", e);
        // Fallback to local store if MySQL fails
        const db = getDb();
        const newStudent = {
          sl: Date.now(),
          photo: photoPath,
          roll,
          name,
          class: className,
          section,
          guardian,
          phone,
          created_at: new Date().toISOString(),
        };
        db.students.unshift(newStudent);
        saveDb(db);

        return res.status(201).json({
          status: "success",
          message: "Student record saved to local store (MySQL fallback)!",
          student: newStudent,
        });
      }
    };

    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      upload.single("photo")(req, res, (err) => {
        if (err) {
          return res.status(400).json({ status: "error", message: err.message });
        }
        handleSave(req, res);
      });
    } else {
      handleSave(req, res);
    }
  };
  app.post("/api/students", insertStudentHandler);

  // 5. Get Students List (/api/students)
  const getStudentsHandler = async (req, res) => {
    try {
      const [rows] = await getPool().execute("SELECT * FROM students ORDER BY id DESC");
      const students = rows.map((r, idx) => ({
        sl: r.id || (1024 + idx),
        photo: r.image_url || r.photo || "",
        roll: r.roll,
        name: r.name,
        class: r.class_name || r.class,
        section: r.section || "A",
        guardian: r.guardian || "N/A",
        phone: r.mobile_number || r.phone,
        created_at: r.created_at || new Date().toISOString(),
      }));

      const classFilter = req.query.class;
      const sectionFilter = req.query.section;
      const searchFilter = req.query.search;

      let filtered = [...students];

      if (classFilter) {
        filtered = filtered.filter((s) => s.class.toLowerCase() === classFilter.toLowerCase());
      }
      if (sectionFilter) {
        filtered = filtered.filter((s) => s.section.toLowerCase() === sectionFilter.toLowerCase());
      }
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.roll.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q)
        );
      }

      return res.json({
        status: "success",
        count: filtered.length,
        students: filtered,
      });
    } catch (e) {
      console.error("MySQL fetch error, using local fallback:", e);
      const db = getDb();
      const classFilter = req.query.class;
      const sectionFilter = req.query.section;
      const searchFilter = req.query.search;

      let filtered = [...db.students];

      if (classFilter) {
        filtered = filtered.filter((s) => s.class.toLowerCase() === classFilter.toLowerCase());
      }
      if (sectionFilter) {
        filtered = filtered.filter((s) => s.section.toLowerCase() === sectionFilter.toLowerCase());
      }
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.roll.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q)
        );
      }

      res.json({
        status: "success",
        count: filtered.length,
        students: filtered,
      });
    }
  };
  app.get("/api/students", getStudentsHandler);

  // 6. Student Login (/api/login)
  const loginHandler = (req, res) => {
    const db = getDb();
    const body = req.body;

    const username = body.username ? body.username.trim() : "";
    const password = body.password ? body.password.trim() : "";
    const className = body.class ? body.class.trim() : "";
    const roll = body.roll ? body.roll.trim() : "";
    const phone = body.phone ? body.phone.trim() : "";

    if (username) {
      const cleanUser = username.toLowerCase();
      const cleanPass = password.toLowerCase();

      if (cleanUser === "admin" && (cleanPass === "admin" || cleanPass === "admin123")) {
        return res.json({
          status: "success",
          role: "admin",
          message: "Admin successfully authenticated!",
          user: { name: "Administrator", username: "admin", role: "admin" },
        });
      } else if (cleanUser === "teacher" && (cleanPass === "teacher" || cleanPass === "teacher123")) {
        return res.json({
          status: "success",
          role: "teacher",
          message: "Teacher successfully authenticated!",
          user: { name: "Teacher Panel", username: "teacher", role: "teacher" },
        });
      } else if ((cleanUser === "guardian" || cleanUser === "student") && (cleanPass === "guardian" || cleanPass === "student" || cleanPass === "guardian123")) {
        return res.json({
          status: "success",
          role: "student",
          message: "Guardian / Student successfully authenticated!",
          user: { name: "Guardian Portal", username: "guardian", role: "student" },
        });
      } else if (cleanUser === "accountant" && (cleanPass === "accountant" || cleanPass === "accountant123")) {
        return res.json({
          status: "success",
          role: "accountant",
          message: "Accountant successfully authenticated!",
          user: { name: "Accounts Department", username: "accountant", role: "accountant" },
        });
      } else if (cleanUser === "superadmin" && (cleanPass === "superadmin" || cleanPass === "superadmin123")) {
        return res.json({
          status: "success",
          role: "superadmin",
          message: "Super Admin successfully authenticated!",
          user: { name: "Super Administrator", username: "superadmin", role: "superadmin" },
        });
      } else {
        return res.status(401).json({
          status: "error",
          message: `Authentication failed: Invalid credentials provided for ${username}.`,
        });
      }
    }

    // Student Check
    if (className && roll && phone) {
      const student = db.students.find(
        (s) =>
          s.class.toLowerCase() === className.toLowerCase() &&
          s.roll === roll &&
          s.phone === phone
      );

      if (student) {
        return res.json({
          status: "success",
          role: "student",
          message: "Student successfully authenticated!",
          student: {
            sl: student.sl,
            roll: student.roll,
            name: student.name,
            class: student.class,
            section: student.section,
            photo: student.photo,
          },
        });
      } else {
        return res.status(401).json({
          status: "error",
          message: "Authentication failed: Invalid Class, Roll, or Phone Number combinations.",
        });
      }
    }

    res.status(400).json({
      status: "error",
      message: "Bad Request: Please provide admin or student login details.",
    });
  };
  app.post("/api/login", loginHandler);

  // 7. Reset Student Password/Phone (/api/reset-password)
  const resetPasswordHandler = (req, res) => {
    const db = getDb();
    const body = req.body;

    const roll = body.roll ? body.roll.trim() : "";
    const className = body.class ? body.class.trim() : "";
    const phone = body.phone ? body.phone.trim() : "";
    const newPhone = body.new_phone ? body.new_phone.trim() : "";

    if (!roll || !className || !phone) {
      return res.status(400).json({
        status: "error",
        message: "Validation Failed: Roll, Class, and Current Phone are required.",
      });
    }

    const studentIndex = db.students.findIndex(
      (s) =>
        s.class.toLowerCase() === className.toLowerCase() &&
        s.roll === roll &&
        s.phone === phone
    );

    if (studentIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Verification failed: Student record matching these details was not found.",
      });
    }

    if (!newPhone) {
      return res.json({
        status: "success",
        message: "Student identity verified successfully.",
        student: {
          name: db.students[studentIndex].name,
        },
      });
    }

    db.students[studentIndex].phone = newPhone;
    saveDb(db);

    res.json({
      status: "success",
      message: "Student phone contact details successfully updated in the database!",
    });
  };
  app.post("/api/reset-password", resetPasswordHandler);

  // 8. Save Seat Plan (/api/seat-plan)
  const saveSeatPlanHandler = (req, res) => {
    const db = getDb();
    const { examTerm, class: className, section, roomNumber, layoutType } = req.body;

    const studentsInClass = db.students.filter(
      (s) => s.class.toLowerCase() === className.toLowerCase() && s.section === section
    );

    if (studentsInClass.length === 0) {
      return res.status(404).json({ status: "error", message: "No students found for this class and section" });
    }

    const assignedStudents = studentsInClass.map((s, i) => ({
      studentId: s.sl,
      rollNo: s.roll,
      rowNumber: Math.floor(i / 2) + 1,
      columnNumber: (i % 2) + 1,
    }));

    const newPlan = {
      id: Date.now(),
      examTerm,
      class: className,
      section,
      roomNumber,
      layoutType,
      students: assignedStudents,
      createdAt: new Date().toISOString(),
    };

    db.examSeatPlans.push(newPlan);
    saveDb(db);

    res.json({
      status: "success",
      message: "Seat plan generated and saved successfully!",
      plan: newPlan,
    });
  };
  app.post("/api/seat-plan", saveSeatPlanHandler);

  // 9. Get Student Report
  const getStudentReportHandler = (req, res) => {
    const db = getDb();
    const studentId = parseInt(req.params.studentId, 10);
    const student = db.students.find((s) => s.sl === studentId);
    
    if (!student) {
        return res.status(404).json({ status: "error", message: "Student not found" });
    }

    const record = db.studentRecords.find((r) => r.sl === studentId);
    
    res.json({
      status: "success",
      student,
      report: record || { attendance: null, marks: [], remarks: "" }
    });
  };
  app.get("/api/student-report/:studentId", getStudentReportHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node.js Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Node.js server:", err);
});
