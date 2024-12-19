const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;  // Default to 5000 if not set in .env
const DB_FILE_PATH = process.env.DB_FILE_PATH || './serviceRequests.db'; 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Files will be saved in the 'uploads' directory


app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database(DB_FILE_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create service_requests table if not exists
db.run(
  `CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    serviceType TEXT NOT NULL,
    message TEXT,
    purchaseDate TEXT NOT NULL
  )`,
  (err) => {
    if (err) {
      console.error('Error creating service_requests table:', err.message);
    } else {
      console.log('Service requests table ready.');
    }
  }
);

// Create job_applications table if not exists
db.run(
  `CREATE TABLE IF NOT EXISTS job_applicationss (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    currentLocation TEXT NOT NULL,
    preferredLocation TEXT NOT NULL,
    totalExperience TEXT NOT NULL,
    currentSalary TEXT NOT NULL,
    expectedSalary TEXT NOT NULL,
    noticePeriod TEXT NOT NULL,
    linkedin TEXT NOT NULL,
    resume TEXT NOT NULL,
    jobId TEXT NOT NULL,             
    jobDescription TEXT NOT NULL    
  )`,
  (err) => {
    if (err) {
      console.error('Error creating job_applications table:', err.message);
    } else {
      console.log('Job applicationss table ready.');
    }
  }
);

// API endpoint for service requests
app.post('/api/service-request', (req, res) => {
  const { name, email, phone, serviceType, message, purchaseDate } = req.body;

  if (!name || !email || !serviceType || !purchaseDate) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  const sql = `INSERT INTO service_requests (name, email, phone, serviceType, message, purchaseDate)
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(sql, [name, email, phone, serviceType, message, purchaseDate], function (err) {
    if (err) {
      console.error('Error inserting data:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to save the service request.' });
    }

    db.all(`SELECT * FROM service_requests`, [], (err, rows) => {
      if (err) {
        console.error('Error retrieving data:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch data after insertion.' });
      }

      console.log('Current Database Records:', rows);

      res.status(200).json({ success: true, message: 'Service request submitted successfully!' });
    });
  });
});

app.post('/api/job-applications', upload.single('resume'), (req, res) => {
    console.log('Incoming job application data:', req.body);
    console.log('Incoming file (if any):', req.file); // This will contain the uploaded file details
  
    const {
      firstName,
      lastName,
      email,
      phone,
      currentLocation,
      preferredLocation,
      totalExperience,
      currentSalary,
      expectedSalary,
      noticePeriod,
      linkedin,
      jobId,
      jobDescription,
    } = req.body;
  
    // Check for missing fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !currentLocation ||
      !preferredLocation ||
      !totalExperience ||
      !currentSalary ||
      !expectedSalary ||
      !noticePeriod ||
      !linkedin ||
      !req.file || 
      !jobId ||
      !jobDescription
    ) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
  
    // Use req.file.path to store the file path in the database
    const resume = req.file.path;
  
    const sql = `INSERT INTO job_applicationss 
      (firstName, lastName, email, phone, currentLocation, preferredLocation, totalExperience, currentSalary, expectedSalary, noticePeriod, linkedin, resume, jobId, jobDescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    db.run(
      sql,
      [
        firstName,
        lastName,
        email,
        phone,
        currentLocation,
        preferredLocation,
        totalExperience,
        currentSalary,
        expectedSalary,
        noticePeriod,
        linkedin,
        resume,
        jobId,
        jobDescription,
      ],
      function (err) {
        if (err) {
          console.error('Error inserting data:', err.message);
          return res.status(500).json({ success: false, message: 'Failed to save the job application.' });
        }
  
        res.status(200).json({ success: true, message: 'Job applications submitted successfully!' });
      }
    );
  });

  db.run(
    `CREATE TABLE IF NOT EXISTS chatbot_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error('Error creating chatbot_details table:', err.message);
      } else {
        console.log('Chatbot details table ready.');
      }
    }
  );
  
  // Endpoint to save chatbot interaction details
  app.post('/api/chatbot-details', (req, res) => {
    const { name, email, phone, timestamp } = req.body;
  
    // Validate input
    if (!name || !email || !phone || !timestamp) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
  
    const sql = `INSERT INTO chatbot_details (name, email, phone, timestamp) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, email, phone, timestamp], function (err) {
      if (err) {
        console.error('Error saving chatbot details:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to save chatbot details.' });
      }
      res.status(200).json({ success: true, message: 'Details saved successfully!' });
    });
  });

  // Endpoint to fetch all service requests
app.get('/api/service-requests', (req, res) => {
  const sql = 'SELECT * FROM service_requests';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error retrieving data from service_requests:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch service requests.' });
    }

    res.status(200).json({ success: true, data: rows });
  });
});

// Endpoint to fetch all job applications
app.get('/api/job-applications', (req, res) => {
  const sql = 'SELECT * FROM job_applicationss';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error retrieving data from job_applicationss:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch job applications.' });
    }

    res.status(200).json({ success: true, data: rows });
  });
});

// Endpoint to fetch all chatbot details
app.get('/api/chatbot-details', (req, res) => {
  const sql = 'SELECT * FROM chatbot_details';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error retrieving data from chatbot_details:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch chatbot details.' });
    }

    res.status(200).json({ success: true, data: rows });
  });
});

  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
