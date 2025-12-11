const axios = require("axios");

class UpworkService {
  constructor() {
    this.baseURL = "https://www.upwork.com/api";
    this.apiKey = process.env.UPWORK_API_KEY;
    this.apiSecret = process.env.UPWORK_API_SECRET;
    this.accessToken = process.env.UPWORK_ACCESS_TOKEN;
    this.accessTokenSecret = process.env.UPWORK_ACCESS_TOKEN_SECRET;

    // ✅ Bind all methods so `this` never becomes undefined
    this.searchJobs = this.searchJobs.bind(this);
    this.getJobById = this.getJobById.bind(this);
    this.getMockJobs = this.getMockJobs.bind(this);
  }

  // ✅ Search jobs safely
  async searchJobs(userPreferences = { keywords: [] }) {
    try {
      const safeKeywords = Array.isArray(userPreferences.keywords)
        ? userPreferences.keywords
        : typeof userPreferences.keywords === "string"
        ? userPreferences.keywords.split(" ")
        : [];

      const params = {
        q: safeKeywords.join(", "),
        sort: "recency",
        page_size: 50,
        page_offset: 0,
      };

  console.log(" Calling Upwork API with params:", params);
  console.log(userPreferences);
  // 🔹 For now, use mock data (no real API)
  const jobs = this.getMockJobs({ keywords: safeKeywords });
  // Return an explicit promise to make behavior consistent with real API
  return Promise.resolve(jobs);

      /* --- Uncomment when using real API ---
      const response = await axios.get(`${this.baseURL}/profiles/v2/search/jobs`, {
        params,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      return response.data.jobs || [];
      */
    } catch (error) {
      console.error(" Upwork API Error:", error.message);
      throw new Error("Failed to fetch jobs from Upwork");
    }
  }

  //  Get single job safely
  async getJobById(jobId) {
    try {
      const allJobs = this.getMockJobs({ keywords: [""] });
      const found = allJobs.find((job) => job.id === jobId) || null;
      return Promise.resolve(found);
    } catch (error) {
      console.error("❌ Upwork API Error:", error.message);
      return null;
    }
  }

  //  Generate mock jobs safely
  getMockJobs(userPreferences = { keywords: [] }) {
    const safeKeywords = Array.isArray(userPreferences.keywords)
      ? userPreferences.keywords
      : typeof userPreferences.keywords === "string"
      ? userPreferences.keywords.split(" ")
      : [];

    const keywords = safeKeywords.join(" ");

    return [
      {
        id: "job_001",
        ciphertext: "~01abc123def456",
        title: `${keywords || "Frontend"} Developer Needed for E-commerce Project`,
        description: `We are looking for an experienced ${keywords || "Frontend"} developer with strong skills in React and Node.js. Must have experience building scalable e-commerce solutions. Long-term project with possibility of extension.`,
        job_type: "hourly",
        hourly_budget: { min: 30, max: 75 },
        skills: safeKeywords.length ? safeKeywords : ["React", "Node", "API"],
        category2: "Web Development",
        subcategory2: "Full Stack Development",
        duration: "1 to 3 months",
        workload: "30+ hrs/week",
        proposals: 12,
        date_created: new Date(Date.now() - 2 * 86400000).toISOString(),
        client: {
          country: "United States",
          city: "San Francisco",
          total_spent: 25000,
          total_hires: 15,
          rating: 4.8,
          hire_rate: 80,
          payment_verified: true,
          jobs_posted: 25,
          open_jobs: 2
        },
      },
      {
        id: "job_002",
        ciphertext: "~02xyz789ghi012",
        title: `Full Stack ${keywords || "MERN"} Developer - SaaS Application`,
        description: `Need a full-stack developer proficient in ${keywords} technologies...`,
        job_type: "fixed",
        budget: 5000,
        skills: safeKeywords.length ? safeKeywords : ["JavaScript", "React", "MongoDB"],
        category2: "Web Development",
        subcategory2: "Web Application",
        duration: "3 to 6 months",
        workload: "Full-time",
        proposals: 8,
        date_created: new Date(Date.now() - 86400000).toISOString(),
        client: {
          country: "United Kingdom",
          city: "London",
          total_spent: 50000,
          total_hires: 25,
          total_reviews: 30,
          rating: 4.9,
          payment_verified: true,
          hire_rate: 85,
          jobs_posted: 35,
          open_jobs: 3
        },
      },
    ];
  }
}

module.exports = new UpworkService();
