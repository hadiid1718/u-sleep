import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
// Test Framework
// ─────────────────────────────────────────────
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;
const failedDetails = [];
const suiteResults = {};
let currentSuite = '';

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function suite(name) {
  currentSuite = name;
  suiteResults[name] = { passed: 0, failed: 0 };
  log(`\n${'─'.repeat(50)}`, 'dim');
  log(`  ${name}`, 'blue');
  log(`${'─'.repeat(50)}`, 'dim');
}

function test(description, fn) {
  try {
    fn();
    passedTests++;
    suiteResults[currentSuite].passed++;
    log(`  ✓ ${description}`, 'green');
  } catch (error) {
    failedTests++;
    suiteResults[currentSuite].failed++;
    log(`  ✗ ${description}`, 'red');
    log(`    → ${error.message}`, 'yellow');
    failedDetails.push({ suite: currentSuite, test: description, error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(content, search, message) {
  if (!content.includes(search)) throw new Error(message || `Expected content to include "${search}"`);
}

function assertIncludesAll(content, searches, prefix = '') {
  for (const s of searches) {
    assertIncludes(content, s, `${prefix}"${s}" not found`);
  }
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(__dirname, relativePath));
}

// ═════════════════════════════════════════════
//  1. PROJECT STRUCTURE & FILE EXISTENCE
// ═════════════════════════════════════════════
suite('1. Project Structure — Core Files');

const coreFiles = [
  'app.js',
  'package.json',
  'config/env.js',
  'config/arcjet.js',
  'database/mongodb.js',
  'middleware/auth.middleware.js',
  'middleware/error.middleware.js',
  'middleware/arcject.middleware.js',
];

coreFiles.forEach(f => {
  test(`${f} exists`, () => assert(fileExists(f), `Missing: ${f}`));
});

suite('1. Project Structure — Models');

const models = [
  'models/user.model.js',
  'models/admin.model.js',
  'models/demo.model.js',
  'models/job.model.js',
  'models/proposal.model.js',
];

models.forEach(f => {
  test(`${f} exists`, () => assert(fileExists(f), `Missing: ${f}`));
});

suite('1. Project Structure — Controllers');

const controllers = [
  'controller/auth.controller.js',
  'controller/user.controller.js',
  'controller/demo.controller.js',
  'controller/job.controller.js',
  'controller/proposal.controller.js',
];

controllers.forEach(f => {
  test(`${f} exists`, () => assert(fileExists(f), `Missing: ${f}`));
});

suite('1. Project Structure — Routes');

const routes = [
  'routes/auth.router.js',
  'routes/user.router.js',
  'routes/demo.router.js',
  'routes/job.router.js',
  'routes/proposal.router.js',
];

routes.forEach(f => {
  test(`${f} exists`, () => assert(fileExists(f), `Missing: ${f}`));
});

suite('1. Project Structure — Services');

['services/upwork.service.js', 'services/ai.service.js'].forEach(f => {
  test(`${f} exists`, () => assert(fileExists(f), `Missing: ${f}`));
});

// ═════════════════════════════════════════════
//  2. DEPENDENCIES & PACKAGE.JSON
// ═════════════════════════════════════════════
suite('2. Dependencies & package.json');

const packageJson = JSON.parse(readSource('package.json'));

const requiredDeps = [
  'express', 'mongoose', 'jsonwebtoken', 'bcryptjs',
  'cors', 'dotenv', 'cookie-parser', '@arcjet/node',
];

requiredDeps.forEach(dep => {
  test(`Dependency: ${dep}`, () => {
    assert(packageJson.dependencies[dep], `"${dep}" missing from dependencies`);
  });
});

test('package.json type is "module" (ESM)', () => {
  assert(packageJson.type === 'module', 'type !== "module"');
});

test('package.json has "start" script', () => {
  assert(packageJson.scripts?.start, 'start script missing');
});

test('package.json has "test" script pointing to test.js', () => {
  assert(packageJson.scripts?.test?.includes('test.js'), 'test script misconfigured');
});

test('package.json has "dev" script with nodemon', () => {
  assert(packageJson.scripts?.dev?.includes('nodemon'), 'dev script missing nodemon');
  assert(packageJson.devDependencies?.nodemon, 'nodemon not in devDependencies');
});

test('ESLint is configured as devDependency', () => {
  assert(packageJson.devDependencies?.eslint, 'eslint missing from devDependencies');
});

// ═════════════════════════════════════════════
//  3. APP.JS — Express Server Configuration
// ═════════════════════════════════════════════
suite('3. app.js — Express Server');

const appContent = readSource('app.js');

test('Initializes Express application', () => {
  assertIncludes(appContent, 'express()', 'express() not called');
});

test('Configures CORS with origin, credentials, methods, headers', () => {
  assertIncludesAll(appContent, ['cors(', 'origin', 'credentials', 'methods', 'allowedHeaders'], 'CORS: ');
});

test('Parses JSON and URL-encoded bodies', () => {
  assertIncludes(appContent, 'express.json()', 'express.json() missing');
  assertIncludes(appContent, 'express.urlencoded', 'express.urlencoded missing');
});

test('Uses cookie-parser middleware', () => {
  assertIncludes(appContent, 'cookieParser', 'cookie-parser not used');
});

test('Uses Arcjet rate-limit/bot middleware', () => {
  assertIncludes(appContent, 'arcjetMiddleware', 'Arcjet middleware not applied');
});

test('Registers all 5 route modules', () => {
  assertIncludesAll(appContent, ['authRouter', 'userRouter', 'demoRouter', 'jobRouter', 'proposalRouter'], 'Router missing: ');
});

test('Mounts routes under /api/v1 namespace', () => {
  assertIncludesAll(appContent, [
    '/api/v1/auth', '/api/v1/users', '/api/v1/demo', '/api/v1/jobs', '/api/v1/proposals',
  ], 'Route mount missing: ');
});

test('Applies global error middleware last', () => {
  assertIncludes(appContent, 'app.use(errorMiddleware)', 'Error middleware not applied globally');
});

test('Starts server with app.listen on PORT', () => {
  assertIncludes(appContent, 'app.listen(PORT', 'app.listen(PORT) missing');
});

test('Connects to database on startup', () => {
  assertIncludes(appContent, 'await connectToDatabase()', 'connectToDatabase() not called on startup');
});

test('Creates default admin on startup', () => {
  assertIncludes(appContent, 'await createDefaultAdmin()', 'createDefaultAdmin() not called on startup');
});

test('Exports app as default', () => {
  assertIncludes(appContent, 'export default app', 'app not exported');
});

// ═════════════════════════════════════════════
//  4. CONFIGURATION
// ═════════════════════════════════════════════
suite('4. Configuration — env.js');

const envContent = readSource('config/env.js');

test('Loads dotenv with environment-specific file', () => {
  assertIncludes(envContent, 'dotenv.config', 'dotenv.config not called');
  assertIncludes(envContent, 'process.env.NODE_ENV', 'NODE_ENV not referenced');
});

test('Exports core environment variables', () => {
  assertIncludesAll(envContent, [
    'PORT', 'FRONTEND_URL', 'NODE_ENV', 'DB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN',
  ], 'Env var missing: ');
});

test('Exports admin credentials', () => {
  assertIncludesAll(envContent, ['ADMIN_USERNAME', 'ADMIN_PASSWORD'], 'Admin env: ');
});

test('Exports Arcjet config', () => {
  assertIncludesAll(envContent, ['ARCJET_KEY', 'ARCJET_ENV'], 'Arcjet env: ');
});

test('Exports Upwork API credentials', () => {
  assertIncludesAll(envContent, [
    'UPWORK_API_KEY', 'UPWORK_API_SECRET', 'UPWORK_CLIENT_ID',
    'UPWORK_CLIENT_SECRET', 'UPWORK_ACCESS_TOKEN', 'UPWORK_REFRESH_TOKEN',
  ], 'Upwork env: ');
});

test('Exports AI service keys', () => {
  assertIncludesAll(envContent, [
    'OPENAI_API_KEY', 'OPENAI_MODEL', 'OPENAI_ORG_ID',
    'GOOGLE_GEMINI_API_KEY', 'GOOGLE_GEMINI_MODEL',
  ], 'AI env: ');
});

test('Exports feature flags', () => {
  assertIncludesAll(envContent, [
    'USE_BACKGROUND_JOBS', 'JOB_CACHE_TTL', 'JOB_CACHE_ENABLED', 'PROPOSAL_GENERATION_TIMEOUT',
  ], 'Feature flag: ');
});

suite('4. Configuration — arcjet.js');

const arcjetContent = readSource('config/arcjet.js');

test('Imports and configures @arcjet/node', () => {
  assertIncludesAll(arcjetContent, ['arcjet', 'shield', 'detectBot', 'tokenBucket'], 'Arcjet import: ');
});

test('Shield protection is LIVE', () => {
  assertIncludes(arcjetContent, 'shield(', 'shield not configured');
  assertIncludes(arcjetContent, '"LIVE"', 'Shield not in LIVE mode');
});

test('Bot detection allows search engine crawlers', () => {
  assertIncludes(arcjetContent, 'CATEGORY:SEARCH_ENGINE', 'Search engine bots not allowed');
});

test('Token bucket rate limiting is configured', () => {
  assertIncludesAll(arcjetContent, ['refillRate', 'interval', 'capacity'], 'Rate limit: ');
});

// ═════════════════════════════════════════════
//  5. DATABASE
// ═════════════════════════════════════════════
suite('5. Database — mongodb.js');

const mongoContent = readSource('database/mongodb.js');

test('Uses mongoose.connect with DB_URI', () => {
  assertIncludes(mongoContent, 'mongoose.connect(DB_URI)', 'mongoose.connect(DB_URI) missing');
});

test('Validates DB_URI presence before connecting', () => {
  assertIncludes(mongoContent, 'if (!DB_URI)', 'DB_URI validation missing');
});

test('Handles connection errors with process.exit(1)', () => {
  assertIncludes(mongoContent, 'process.exit(1)', 'process.exit(1) missing on DB error');
});

test('Logs connected environment', () => {
  assertIncludes(mongoContent, 'NODE_ENV', 'NODE_ENV not logged');
});

// ═════════════════════════════════════════════
//  6. MODELS — Schema Definitions
// ═════════════════════════════════════════════
suite('6. Models — User');

const userModel = readSource('models/user.model.js');

test('Has name field with min/max length validation', () => {
  assertIncludesAll(userModel, ['name', 'minlength', 'maxlength', 'required', 'trim'], 'User name: ');
});

test('Has email field with unique, lowercase, trim', () => {
  assertIncludesAll(userModel, ['email', 'unique', 'lowercase', 'trim'], 'User email: ');
});

test('Has password field with minlength 6', () => {
  assertIncludes(userModel, 'minlength', 'Password minlength missing');
});

test('Has jobPreferences with keywords, rateType, hourlyRate, fixedRate', () => {
  assertIncludesAll(userModel, ['jobPreferences', 'keywords', 'rateType', 'hourlyRate', 'fixedRate'], 'jobPreferences: ');
});

test('rateType enum has hourly and fixed', () => {
  assertIncludesAll(userModel, ["'hourly'", "'fixed'"], 'rateType enum: ');
});

test('Has hourlyRateRange and fixedRateRange with min/max', () => {
  assertIncludesAll(userModel, ['hourlyRateRange', 'fixedRateRange'], 'Rate ranges: ');
});

test('Has userRole enum (freelancer, agency)', () => {
  assertIncludesAll(userModel, ["'freelancer'", "'agency'"], 'userRole enum: ');
});

test('Has badJobCriteria array', () => {
  assertIncludes(userModel, 'badJobCriteria', 'badJobCriteria missing');
});

test('Has upworkProfileUrl', () => {
  assertIncludes(userModel, 'upworkProfileUrl', 'upworkProfileUrl missing');
});

test('Has isFlagged, flagReason, flaggedAt for account moderation', () => {
  assertIncludesAll(userModel, ['isFlagged', 'flagReason', 'flaggedAt'], 'Flag fields: ');
});

test('Has stats object with all counters', () => {
  assertIncludesAll(userModel, [
    'jobsViewed', 'jobsMatched', 'proposalsSent', 'proposalsAccepted', 'proposalsRejected',
  ], 'Stats: ');
});

test('Has timestamps enabled', () => {
  assertIncludes(userModel, 'timestamps', 'timestamps missing');
});

suite('6. Models — Admin');

const adminModel = readSource('models/admin.model.js');

test('Has username (required, unique, trim, minlength)', () => {
  assertIncludesAll(adminModel, ['username', 'required', 'unique', 'trim', 'minlength'], 'Admin username: ');
});

test('Has password with select: false for security', () => {
  assertIncludes(adminModel, 'select: false', 'Password select:false missing');
});

test('Has role enum (admin, super_admin)', () => {
  assertIncludesAll(adminModel, ["'admin'", "'super_admin'"], 'Admin role enum: ');
});

test('Has isActive boolean', () => {
  assertIncludes(adminModel, 'isActive', 'isActive missing');
});

test('Has timestamps', () => {
  assertIncludes(adminModel, 'timestamps', 'timestamps missing');
});

suite('6. Models — Demo');

const demoModel = readSource('models/demo.model.js');

test('Has email with regex validation', () => {
  assertIncludesAll(demoModel, ['email', 'match', 'required'], 'Demo email: ');
});

test('Has optional name, company, phone', () => {
  assertIncludesAll(demoModel, ['name', 'company', 'phone'], 'Demo optional fields: ');
});

test('Has demoDate (required)', () => {
  assertIncludesAll(demoModel, ['demoDate', 'Date', 'required'], 'Demo demoDate: ');
});

test('Has timeSlot with 9 enum values (09:00 AM – 05:00 PM)', () => {
  assertIncludesAll(demoModel, ['timeSlot', 'enum', '09:00 AM', '05:00 PM'], 'Demo timeSlot: ');
});

test('Has status enum (scheduled, completed, cancelled, no-show)', () => {
  assertIncludesAll(demoModel, ["'scheduled'", "'completed'", "'cancelled'", "'no-show'"], 'Demo status: ');
});

test('Has notes field with maxlength', () => {
  assertIncludesAll(demoModel, ['notes', 'maxlength'], 'Demo notes: ');
});

suite('6. Models — Job');

const jobModel = readSource('models/job.model.js');

test('Has upworkJobId (required, unique, indexed)', () => {
  assertIncludesAll(jobModel, ['upworkJobId', 'required', 'unique', 'index'], 'Job upworkJobId: ');
});

test('Has title and description (required)', () => {
  assertIncludesAll(jobModel, ['title', 'description'], 'Job core fields: ');
});

test('Has skills array, proposalsCount, duration, workloadHoursPerWeek', () => {
  assertIncludesAll(jobModel, ['skills', 'proposalsCount', 'duration', 'workloadHoursPerWeek'], 'Job details: ');
});

test('Has budgetType enum (fixed, hourly)', () => {
  assertIncludesAll(jobModel, ["'fixed'", "'hourly'"], 'budgetType enum: ');
});

test('Has budget object with amount and currency', () => {
  assertIncludesAll(jobModel, ['budget', 'amount', 'currency'], 'Job budget: ');
});

test('Has hourlyRate with min/max', () => {
  assertIncludesAll(jobModel, ['hourlyRate', 'min', 'max'], 'Job hourlyRate: ');
});

test('Has clientInfo with rating, paymentVerified, totalHires, country', () => {
  assertIncludesAll(jobModel, ['clientInfo', 'rating', 'paymentVerified', 'totalHires', 'country'], 'clientInfo: ');
});

test('Has aiAnalysis with matchScore, recommendation, greenFlags, redFlags, reasoning', () => {
  assertIncludesAll(jobModel, ['aiAnalysis', 'matchScore', 'recommendation', 'greenFlags', 'redFlags', 'reasoning'], 'aiAnalysis: ');
});

test('Has userId ref to User model', () => {
  assertIncludesAll(jobModel, ['userId', "ref: 'User'"], 'Job userId ref: ');
});

test('Has matchStatus enum (pending, matched, rejected, archived)', () => {
  assertIncludesAll(jobModel, ["'pending'", "'matched'", "'rejected'", "'archived'"], 'matchStatus enum: ');
});

test('Has cache fields (isCached, cacheExpiry, isActive)', () => {
  assertIncludesAll(jobModel, ['isCached', 'cacheExpiry', 'isActive'], 'Cache fields: ');
});

test('Has TTL index on cacheExpiry', () => {
  assertIncludes(jobModel, 'expireAfterSeconds', 'TTL index missing');
});

suite('6. Models — Proposal');

const proposalModel = readSource('models/proposal.model.js');

test('Has userId and jobId refs (required, indexed)', () => {
  assertIncludesAll(proposalModel, ['userId', 'jobId', "ref: 'User'", "ref: 'Job'", 'required', 'index'], 'Proposal refs: ');
});

test('Has upworkJobId (required)', () => {
  assertIncludes(proposalModel, 'upworkJobId', 'upworkJobId missing');
});

test('Has content (required) and contentType enum', () => {
  assertIncludesAll(proposalModel, ['content', 'contentType', "'original'", "'upgraded_with_case_study'"], 'Proposal content: ');
});

test('Has caseStudy nested object (title, description, results)', () => {
  assertIncludesAll(proposalModel, ['caseStudy', 'title', 'description', 'results'], 'caseStudy: ');
});

test('Has status with full workflow enum (7 statuses)', () => {
  assertIncludesAll(proposalModel, [
    "'draft'", "'sent'", "'received'", "'viewed'", "'accepted'", "'rejected'", "'withdrawn'",
  ], 'Proposal status enum: ');
});

test('Has statusHistory array with timestamp and notes', () => {
  assertIncludesAll(proposalModel, ['statusHistory', 'timestamp', 'notes'], 'statusHistory: ');
});

test('Has bid fields (bidAmount, estimatedDuration, deliveryDate)', () => {
  assertIncludesAll(proposalModel, ['bidAmount', 'estimatedDuration', 'deliveryDate'], 'Bid fields: ');
});

test('Has AI generation metadata (aiService, aiModel, generatedAt)', () => {
  assertIncludesAll(proposalModel, ['aiService', 'aiModel', 'generatedAt'], 'AI metadata: ');
});

test('aiService enum includes openai and gemini', () => {
  assertIncludesAll(proposalModel, ["'openai'", "'gemini'"], 'aiService enum: ');
});

test('Has userRating (1-5) and userFeedback', () => {
  assertIncludesAll(proposalModel, ['userRating', 'userFeedback', 'min: 1', 'max: 5'], 'User rating: ');
});

test('Has compound indexes for performance', () => {
  assertIncludesAll(proposalModel, [
    'userId: 1, jobId: 1',
    'userId: 1, status: 1',
    'upworkJobId: 1, userId: 1',
  ], 'Proposal index: ');
});

// ═════════════════════════════════════════════
//  7. MIDDLEWARE
// ═════════════════════════════════════════════
suite('7. Middleware — auth.middleware.js');

const authMiddleware = readSource('middleware/auth.middleware.js');

test('Extracts Bearer token from Authorization header', () => {
  assertIncludesAll(authMiddleware, ['authorization', 'Bearer', 'split'], 'Token extraction: ');
});

test('Verifies JWT with jwt.verify and JWT_SECRET', () => {
  assertIncludesAll(authMiddleware, ['jwt.verify', 'JWT_SECRET'], 'JWT verify: ');
});

test('Handles admin tokens (decoded.adminId → req.admin)', () => {
  assertIncludesAll(authMiddleware, ['decoded.adminId', 'req.admin', 'req.adminId'], 'Admin token: ');
});

test('Handles user tokens (decoded.userId → req.user)', () => {
  assertIncludesAll(authMiddleware, ['decoded.userId', 'req.user'], 'User token: ');
});

test('Looks up Admin/User in DB and excludes password', () => {
  assertIncludesAll(authMiddleware, ["select('-password')", 'Admin.findById', 'User.findById'], 'DB lookup: ');
});

test('Returns 401 for missing or invalid tokens', () => {
  assertIncludesAll(authMiddleware, ['401', 'Unauthorized'], '401 response: ');
});

suite('7. Middleware — error.middleware.js');

const errorMiddleware = readSource('middleware/error.middleware.js');

test('Handles CastError (404 Resource Not Found)', () => {
  assertIncludesAll(errorMiddleware, ['CastError', '404', 'Resource Not Found'], 'CastError: ');
});

test('Handles MongoDB duplicate key error (11000)', () => {
  assertIncludesAll(errorMiddleware, ['11000', 'Duplicate field'], 'Duplicate key: ');
});

test('Handles Mongoose ValidationError', () => {
  assertIncludesAll(errorMiddleware, ['ValidationError', 'err.errors'], 'ValidationError: ');
});

test('Defaults to 500 Server Error', () => {
  assertIncludesAll(errorMiddleware, ['500', 'Server Error'], 'Default 500: ');
});

test('Logs errors to console', () => {
  assertIncludes(errorMiddleware, 'console.error', 'console.error missing');
});

suite('7. Middleware — arcject.middleware.js');

const arcjetMW = readSource('middleware/arcject.middleware.js');

test('Calls aj.protect with rate limit token', () => {
  assertIncludes(arcjetMW, 'aj.protect(req', 'aj.protect not called');
});

test('Returns 429 for rate limit exceeded', () => {
  assertIncludesAll(arcjetMW, ['429', 'isRateLimit', 'Rate Limit'], '429 response: ');
});

test('Returns 403 for bot detection', () => {
  assertIncludesAll(arcjetMW, ['403', 'isBot', 'Bots are not allowed'], '403 bot response: ');
});

// ═════════════════════════════════════════════
//  8. CONTROLLERS — Auth
// ═════════════════════════════════════════════
suite('8. Controllers — auth.controller.js');

const authController = readSource('controller/auth.controller.js');

test('Exports createDefaultAdmin function', () => {
  assertIncludes(authController, 'export const createDefaultAdmin', 'createDefaultAdmin not exported');
});

test('createDefaultAdmin checks for existing admin before creating', () => {
  assertIncludesAll(authController, ['Admin.findOne', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'], 'Default admin: ');
});

test('createDefaultAdmin creates super_admin role', () => {
  assertIncludes(authController, 'super_admin', 'super_admin role missing');
});

test('Exports adminLogin function', () => {
  assertIncludes(authController, 'export const adminLogin', 'adminLogin not exported');
});

test('adminLogin validates username and password presence', () => {
  assertIncludes(authController, '!username || !password', 'Input validation missing');
});

test('adminLogin checks isActive status', () => {
  assertIncludes(authController, '!admin.isActive', 'isActive check missing');
});

test('adminLogin uses select("+password") for password field', () => {
  assertIncludes(authController, 'select("+password")', 'select("+password") missing');
});

test('adminLogin signs JWT with adminId and role', () => {
  assertIncludesAll(authController, ['adminId: admin._id', 'role: admin.role'], 'Admin JWT payload: ');
});

test('Exports getAdminProfile function', () => {
  assertIncludes(authController, 'export const getAdminProfile', 'getAdminProfile not exported');
});

test('getAdminProfile reads adminId from req.admin or req.adminId', () => {
  assertIncludesAll(authController, ['req.admin?._id', 'req.adminId'], 'Admin profile auth: ');
});

test('Exports signUp with MongoDB transaction session', () => {
  assertIncludesAll(authController, [
    'export const signUp', 'startSession', 'startTransaction', 'commitTransaction', 'abortTransaction',
  ], 'signUp transaction: ');
});

test('signUp checks for existing user by email', () => {
  assertIncludes(authController, 'User.findOne({ email })', 'Existing user check missing');
});

test('signUp returns 409 for duplicate email', () => {
  assertIncludes(authController, '409', '409 status code missing');
});

test('signUp hashes password with bcrypt (genSalt + hash)', () => {
  assertIncludesAll(authController, ['bcrypt.genSalt', 'bcrypt.hash'], 'Password hashing: ');
});

test('signUp signs JWT with userId', () => {
  assertIncludes(authController, 'userId: newUsers[0]._id', 'signUp JWT userId missing');
});

test('signUp returns 201 with token and user data', () => {
  assertIncludesAll(authController, ['201', 'token', 'user: newUsers[0]'], 'signUp response: ');
});

test('Exports signIn function', () => {
  assertIncludes(authController, 'export const signIn', 'signIn not exported');
});

test('signIn validates password with bcrypt.compare', () => {
  assertIncludes(authController, 'bcrypt.compare', 'bcrypt.compare missing');
});

test('signIn returns 404 for non-existent user', () => {
  assertIncludes(authController, '404', '404 for missing user');
});

test('signIn returns 401 for invalid password', () => {
  assertIncludes(authController, '401', '401 for wrong password');
});

test('Exports signOut function (clears cookie)', () => {
  assertIncludesAll(authController, ['export const signOut', 'clearCookie'], 'signOut: ');
});

// ═════════════════════════════════════════════
//  9. CONTROLLERS — User
// ═════════════════════════════════════════════
suite('9. Controllers — user.controller.js');

const userController = readSource('controller/user.controller.js');

test('Exports getUsers (all users, password excluded)', () => {
  assertIncludesAll(userController, ['export const getUsers', 'User.find()', 'select("-password")'], 'getUsers: ');
});

test('Exports getUser (single user by ID)', () => {
  assertIncludesAll(userController, ['export const getUser', 'User.findById', 'req.params.id'], 'getUser: ');
});

test('Exports updateUser with runValidators', () => {
  assertIncludesAll(userController, ['export const updateUser', 'findByIdAndUpdate', 'runValidators'], 'updateUser: ');
});

test('Exports deleteUser', () => {
  assertIncludesAll(userController, ['export const deleteUser', 'findByIdAndDelete'], 'deleteUser: ');
});

test('Exports flagUser with isFlagged boolean validation', () => {
  assertIncludesAll(userController, ['export const flagUser', 'isFlagged', 'flagReason', 'flaggedAt'], 'flagUser: ');
});

test('flagUser validates isFlagged is boolean', () => {
  assertIncludes(userController, "typeof isFlagged !== 'boolean'", 'isFlagged type check missing');
});

// ═════════════════════════════════════════════
//  10. CONTROLLERS — Demo
// ═════════════════════════════════════════════
suite('10. Controllers — demo.controller.js');

const demoController = readSource('controller/demo.controller.js');

test('Exports getAvailableDates (excludes weekends, next 30 days)', () => {
  assertIncludesAll(demoController, ['export const getAvailableDates', 'getDay()', '!== 0', '!== 6'], 'getAvailableDates: ');
});

test('Exports getAvailableTimes with date validation', () => {
  assertIncludesAll(demoController, ['export const getAvailableTimes', 'Invalid date format', '400'], 'getAvailableTimes: ');
});

test('getAvailableTimes checks booked slots against 9 default time slots', () => {
  assertIncludesAll(demoController, ['09:00 AM', '05:00 PM', 'bookedSlots'], 'Time slots: ');
});

test('Exports scheduleDemo with email, demoDate, timeSlot validation', () => {
  assertIncludesAll(demoController, [
    'export const scheduleDemo', '!email || !demoDate || !timeSlot',
  ], 'scheduleDemo validation: ');
});

test('scheduleDemo validates email format with regex', () => {
  assertIncludes(demoController, 'emailRegex', 'Email regex validation missing');
});

test('scheduleDemo checks for time slot conflicts (409)', () => {
  assertIncludesAll(demoController, ['existingDemo', '409', 'already booked'], 'Slot conflict: ');
});

test('scheduleDemo checks for user duplicate booking', () => {
  assertIncludes(demoController, 'userExistingDemo', 'User duplicate booking check missing');
});

test('scheduleDemo returns 201 on success', () => {
  assertIncludes(demoController, '201', '201 status missing');
});

test('Exports getAllDemos with pagination, filtering, sorting', () => {
  assertIncludesAll(demoController, [
    'export const getAllDemos', 'skip', 'limit', 'sort', 'countDocuments',
  ], 'getAllDemos: ');
});

test('Exports getDemoById', () => {
  assertIncludesAll(demoController, ['export const getDemoById', 'Demo.findById'], 'getDemoById: ');
});

test('Exports updateDemoStatus with valid status check', () => {
  assertIncludesAll(demoController, [
    'export const updateDemoStatus', 'validStatuses', 'runValidators',
  ], 'updateDemoStatus: ');
});

test('Exports cancelDemo', () => {
  assertIncludesAll(demoController, ['export const cancelDemo', "'cancelled'"], 'cancelDemo: ');
});

// ═════════════════════════════════════════════
//  11. CONTROLLERS — Job
// ═════════════════════════════════════════════
suite('11. Controllers — job.controller.js');

const jobController = readSource('controller/job.controller.js');

test('Exports searchJobs (non-blocking, returns immediately)', () => {
  assertIncludesAll(jobController, [
    'export const searchJobs', 'upworkService.searchJobs', 'pending',
  ], 'searchJobs: ');
});

test('searchJobs validates authentication and keywords', () => {
  assertIncludesAll(jobController, [
    'User not authenticated', 'At least one keyword is required',
  ], 'searchJobs validation: ');
});

test('searchJobs applies bad job filters and rate matching', () => {
  assertIncludesAll(jobController, [
    'applyBadJobFilters', 'applyRateMatching', 'badJobCriteria',
  ], 'searchJobs filters: ');
});

test('searchJobs saves jobs to DB with insertMany (ignores duplicates)', () => {
  assertIncludesAll(jobController, ['insertMany', 'ordered: false', '11000'], 'searchJobs DB: ');
});

test('Exports getFilteredJobs with pagination', () => {
  assertIncludesAll(jobController, [
    'export const getFilteredJobs', 'page', 'limit', 'skip', 'countDocuments',
  ], 'getFilteredJobs: ');
});

test('Exports getJobDetail with ownership verification', () => {
  assertIncludesAll(jobController, [
    'export const getJobDetail', 'job.userId', 'Unauthorized', '403',
  ], 'getJobDetail: ');
});

test('Exports markJobAsMatched (updates user stats)', () => {
  assertIncludesAll(jobController, [
    'export const markJobAsMatched', "'matched'", 'stats.jobsMatched',
  ], 'markJobAsMatched: ');
});

test('Exports markJobAsRejected with rejection reason', () => {
  assertIncludesAll(jobController, [
    'export const markJobAsRejected', "'rejected'", 'rejectionReason',
  ], 'markJobAsRejected: ');
});

test('Exports searchJobsWithAIAnalysis with scoring', () => {
  assertIncludesAll(jobController, [
    'export const searchJobsWithAIAnalysis', 'calculateMatchScore', 'matchScore',
  ], 'searchJobsWithAIAnalysis: ');
});

test('calculateMatchScore awards points for budget, client quality, clarity, competition', () => {
  assertIncludesAll(jobController, [
    'score = 50', 'score += 30', 'paymentVerified', 'description.length', 'proposalsCount',
  ], 'Match score logic: ');
});

test('extractGreenFlags identifies positive signals', () => {
  assertIncludesAll(jobController, [
    'Payment Verified', 'Top Rated', 'Low Competition', 'Clear Requirements', 'Experienced Buyer',
  ], 'Green flags: ');
});

test('extractRedFlags identifies warning signals', () => {
  assertIncludesAll(jobController, [
    'Payment Not Verified', 'Low Rating', 'High Competition', 'Vague Description', 'New Client',
  ], 'Red flags: ');
});

test('generateReasoning produces score-based explanation', () => {
  assertIncludes(jobController, 'generateReasoning', 'generateReasoning missing');
});

test('searchJobsWithAIAnalysis updates user stats (jobsViewed)', () => {
  assertIncludes(jobController, "'stats.jobsViewed'", 'jobsViewed stat update missing');
});

// ═════════════════════════════════════════════
//  12. CONTROLLERS — Proposal
// ═════════════════════════════════════════════
suite('12. Controllers — proposal.controller.js');

const proposalController = readSource('controller/proposal.controller.js');

test('Exports generateProposal (non-blocking with async background)', () => {
  assertIncludesAll(proposalController, [
    'export const generateProposal', 'generateProposalAsync', 'generating',
  ], 'generateProposal: ');
});

test('generateProposal checks for existing proposal before creating', () => {
  assertIncludes(proposalController, 'Proposal.findOne({ jobId, userId })', 'Existing proposal check missing');
});

test('generateProposal creates draft proposal first', () => {
  assertIncludesAll(proposalController, ['Proposal.create', "'draft'"], 'Draft creation: ');
});

test('generateProposalAsync calls aiService and updates proposal', () => {
  assertIncludesAll(proposalController, [
    'aiService.generateProposal', 'generatedAt', 'contentType',
  ], 'Async generation: ');
});

test('generateProposalAsync handles errors gracefully', () => {
  assertIncludesAll(proposalController, [
    'Error generating proposal', 'Proposal generation failed',
  ], 'Generation error handling: ');
});

test('Exports getProposal with ownership check', () => {
  assertIncludesAll(proposalController, [
    'export const getProposal', 'populate', 'Unauthorized', '403',
  ], 'getProposal: ');
});

test('Exports getUserProposals with pagination, filtering, stats', () => {
  assertIncludesAll(proposalController, [
    'export const getUserProposals', 'page', 'limit', 'skip', 'countDocuments', 'stats',
  ], 'getUserProposals: ');
});

test('Exports sendProposal with bid details and status history', () => {
  assertIncludesAll(proposalController, [
    'export const sendProposal', 'bidAmount', 'estimatedDuration', 'statusHistory',
  ], 'sendProposal: ');
});

test('sendProposal validates content is not empty', () => {
  assertIncludes(proposalController, 'Proposal content is empty', 'Empty content check missing');
});

test('sendProposal increments proposalsSent stat', () => {
  assertIncludes(proposalController, "'stats.proposalsSent'", 'proposalsSent stat missing');
});

test('Exports updateProposalStatus with valid status enum check', () => {
  assertIncludesAll(proposalController, [
    'export const updateProposalStatus', 'validStatuses', 'Invalid status',
  ], 'updateProposalStatus: ');
});

test('updateProposalStatus tracks status changes and updates stats', () => {
  assertIncludesAll(proposalController, [
    'oldStatus', 'statusHistory', 'proposalsAccepted', 'proposalsRejected',
  ], 'Status tracking: ');
});

test('Exports upgradeProposal with case study validation', () => {
  assertIncludesAll(proposalController, [
    'export const upgradeProposal', 'Case study is required',
  ], 'upgradeProposal: ');
});

test('upgradeProposal validates existing content', () => {
  assertIncludes(proposalController, 'No proposal content to upgrade', 'Content check missing');
});

test('upgradeProposalAsync calls aiService.upgradeProposalWithCaseStudy', () => {
  assertIncludes(proposalController, 'aiService.upgradeProposalWithCaseStudy', 'AI upgrade call missing');
});

test('Exports copyProposal with ownership check', () => {
  assertIncludesAll(proposalController, ['export const copyProposal', 'Unauthorized'], 'copyProposal: ');
});

test('Exports rateProposal with rating validation (1-5)', () => {
  assertIncludesAll(proposalController, [
    'export const rateProposal', 'rating < 1', 'rating > 5',
  ], 'rateProposal: ');
});

test('Exports deleteProposal with ownership check', () => {
  assertIncludesAll(proposalController, [
    'export const deleteProposal', 'findByIdAndDelete', 'Unauthorized',
  ], 'deleteProposal: ');
});

test('Exports getProposalStats with acceptance rate calculation', () => {
  assertIncludesAll(proposalController, [
    'export const getProposalStats', 'acceptanceRate',
  ], 'getProposalStats: ');
});

// ═════════════════════════════════════════════
//  13. ROUTES — Endpoint Definitions
// ═════════════════════════════════════════════
suite('13. Routes — auth.router.js');

const authRouter = readSource('routes/auth.router.js');

test('POST /sign-up', () => assertIncludes(authRouter, '"/sign-up"', '/sign-up route missing'));
test('POST /sign-in', () => assertIncludes(authRouter, '"/sign-in"', '/sign-in route missing'));
test('POST /sign-out', () => assertIncludes(authRouter, '"/sign-out"', '/sign-out route missing'));
test('POST /admin/login', () => assertIncludes(authRouter, '"/admin/login"', '/admin/login route missing'));
test('GET /admin/profile (protected)', () => {
  assertIncludesAll(authRouter, ['"/admin/profile"', 'authorize', 'getAdminProfile'], 'Admin profile route: ');
});

suite('13. Routes — user.router.js');

const userRouter = readSource('routes/user.router.js');

test('GET / (list users)', () => assertIncludes(userRouter, 'getUsers', 'getUsers handler missing'));
test('GET /:id (protected)', () => {
  assertIncludesAll(userRouter, ['getUser', 'authorize'], 'getUser protected route: ');
});
test('PUT /:id (protected update)', () => {
  assertIncludesAll(userRouter, ['updateUser', 'authorize'], 'updateUser protected: ');
});
test('PUT /:id/flag (protected flag)', () => {
  assertIncludesAll(userRouter, ['flagUser', 'authorize', '/flag'], 'flagUser route: ');
});
test('DELETE /:id (protected delete)', () => {
  assertIncludesAll(userRouter, ['deleteUser', 'authorize'], 'deleteUser protected: ');
});

suite('13. Routes — demo.router.js');

const demoRouter = readSource('routes/demo.router.js');

test('GET /available-dates (public)', () => assertIncludes(demoRouter, '/available-dates', 'available-dates route missing'));
test('GET /available-times/:date (public)', () => assertIncludes(demoRouter, '/available-times/:date', 'available-times route missing'));
test('POST /schedule (public)', () => assertIncludes(demoRouter, '/schedule', '/schedule route missing'));
test('GET /all (admin — all demos)', () => assertIncludes(demoRouter, '/all', '/all route missing'));
test('GET /:id (admin — single demo)', () => assertIncludes(demoRouter, 'getDemoById', 'getDemoById handler missing'));
test('PUT /:id/status (admin — update status)', () => assertIncludes(demoRouter, '/status', '/status route missing'));
test('DELETE /:id (admin — cancel demo)', () => assertIncludes(demoRouter, 'cancelDemo', 'cancelDemo handler missing'));

suite('13. Routes — job.router.js');

const jobRouter = readSource('routes/job.router.js');

test('POST /search (protected)', () => {
  assertIncludesAll(jobRouter, ["'/search'", 'authorize', 'searchJobs'], 'POST /search: ');
});
test('POST /search-with-ai (protected)', () => {
  assertIncludesAll(jobRouter, ["'/search-with-ai'", 'authorize', 'searchJobsWithAIAnalysis'], 'POST /search-with-ai: ');
});
test('GET /filtered (protected)', () => {
  assertIncludesAll(jobRouter, ["'/filtered'", 'authorize', 'getFilteredJobs'], 'GET /filtered: ');
});
test('GET /:jobId (protected)', () => {
  assertIncludesAll(jobRouter, ["'/:jobId'", 'authorize', 'getJobDetail'], 'GET /:jobId: ');
});
test('PUT /:jobId/match (protected)', () => {
  assertIncludesAll(jobRouter, ["'/:jobId/match'", 'authorize', 'markJobAsMatched'], 'PUT /match: ');
});
test('PUT /:jobId/reject (protected)', () => {
  assertIncludesAll(jobRouter, ["'/:jobId/reject'", 'authorize', 'markJobAsRejected'], 'PUT /reject: ');
});

suite('13. Routes — proposal.router.js');

const proposalRouter = readSource('routes/proposal.router.js');

test('GET /stats/summary (protected)', () => {
  assertIncludesAll(proposalRouter, ["'/stats/summary'", 'authorize', 'getProposalStats'], 'GET /stats: ');
});
test('GET / (protected — user proposals)', () => {
  assertIncludesAll(proposalRouter, ['getUserProposals', 'authorize'], 'GET /: ');
});
test('POST /job/:jobId/generate (protected)', () => {
  assertIncludesAll(proposalRouter, ["'/job/:jobId/generate'", 'authorize', 'generateProposal'], 'POST /generate: ');
});
test('GET /:proposalId (protected)', () => {
  assertIncludesAll(proposalRouter, ['getProposal', 'authorize'], 'GET /:proposalId: ');
});
test('POST /:proposalId/send (protected)', () => {
  assertIncludesAll(proposalRouter, ['/send', 'authorize', 'sendProposal'], 'POST /send: ');
});
test('PATCH /:proposalId/status (protected)', () => {
  assertIncludesAll(proposalRouter, ['/status', 'authorize', 'updateProposalStatus'], 'PATCH /status: ');
});
test('POST /:proposalId/upgrade (protected)', () => {
  assertIncludesAll(proposalRouter, ['/upgrade', 'authorize', 'upgradeProposal'], 'POST /upgrade: ');
});
test('POST /:proposalId/copy (protected)', () => {
  assertIncludesAll(proposalRouter, ['/copy', 'authorize', 'copyProposal'], 'POST /copy: ');
});
test('POST /:proposalId/rate (protected)', () => {
  assertIncludesAll(proposalRouter, ['/rate', 'authorize', 'rateProposal'], 'POST /rate: ');
});
test('DELETE /:proposalId (protected)', () => {
  assertIncludesAll(proposalRouter, ['deleteProposal', 'authorize'], 'DELETE /:proposalId: ');
});

// ═════════════════════════════════════════════
//  14. SERVICES — Upwork
// ═════════════════════════════════════════════
suite('14. Services — upwork.service.js');

const upworkService = readSource('services/upwork.service.js');

test('Uses UpworkService class pattern', () => {
  assertIncludes(upworkService, 'class UpworkService', 'Class not defined');
});

test('Exports singleton instance', () => {
  assertIncludes(upworkService, 'export default new UpworkService()', 'Singleton export missing');
});

test('Constructor initializes baseUrl, cacheTTL, cacheEnabled', () => {
  assertIncludesAll(upworkService, ['this.baseUrl', 'this.cacheTTL', 'this.cacheEnabled'], 'Constructor: ');
});

test('transformUpworkJob maps API response to Job schema format', () => {
  assertIncludesAll(upworkService, [
    'transformUpworkJob', 'upworkJobId', 'upworkUrl', 'clientInfo', 'cacheExpiry',
  ], 'Transform: ');
});

test('searchJobs checks cache first when enabled', () => {
  assertIncludesAll(upworkService, ['this.cacheEnabled', 'getCachedJobs'], 'Cache check: ');
});

test('searchJobs calls Upwork API with Bearer token', () => {
  assertIncludesAll(upworkService, ['Bearer', 'this.accessToken', 'fetch(url'], 'API call: ');
});

test('searchJobs falls back to cache on API error', () => {
  assertIncludes(upworkService, 'await this.getCachedJobs(keywords)', 'Fallback to cache missing');
});

test('buildSearchQuery constructs URLSearchParams with all filter types', () => {
  assertIncludesAll(upworkService, [
    'buildSearchQuery', 'URLSearchParams', 'budget_min', 'budget_max', 'hourly_rate_min',
  ], 'Query builder: ');
});

test('getCachedJobs queries by keywords and cacheExpiry', () => {
  assertIncludesAll(upworkService, ['getCachedJobs', 'cacheExpiry', '$gt'], 'getCachedJobs: ');
});

test('cacheJobs uses bulkWrite with upsert', () => {
  assertIncludesAll(upworkService, ['cacheJobs', 'bulkWrite', 'upsert'], 'Bulk cache: ');
});

test('cleanExpiredCache deletes expired cached jobs', () => {
  assertIncludesAll(upworkService, ['cleanExpiredCache', 'deleteMany', '$lt'], 'Cache cleanup: ');
});

test('applyBadJobFilters removes jobs matching bad criteria', () => {
  assertIncludesAll(upworkService, [
    'applyBadJobFilters', 'low budget', 'no verified payment', 'low rating',
    'unclear description', 'too many proposals', 'unverified client',
  ], 'Bad job filters: ');
});

test('applyRateMatching filters by hourly or fixed rate', () => {
  assertIncludesAll(upworkService, [
    'applyRateMatching', 'hourly', 'fixed', 'hourlyRate', 'budget',
  ], 'Rate matching: ');
});

// ═════════════════════════════════════════════
//  15. SERVICES — AI
// ═════════════════════════════════════════════
suite('15. Services — ai.service.js');

const aiService = readSource('services/ai.service.js');

test('Uses AIProposalService class pattern', () => {
  assertIncludes(aiService, 'class AIProposalService', 'Class not defined');
});

test('Exports singleton instance', () => {
  assertIncludes(aiService, 'export default new AIProposalService()', 'Singleton export missing');
});

test('Constructor initializes both API keys and configurable timeout', () => {
  assertIncludesAll(aiService, [
    'this.openaiApiKey', 'this.geminiApiKey', 'this.timeout',
    'this.openaiModel', 'this.geminiModel',
  ], 'Constructor: ');
});

test('generateProposal dispatches to OpenAI or Gemini based on param', () => {
  assertIncludesAll(aiService, [
    'generateProposal', "aiService === 'gemini'", 'generateWithGemini', 'generateWithOpenAI',
  ], 'AI dispatch: ');
});

test('generateProposal validates job and user are provided', () => {
  assertIncludes(aiService, 'Job and user details are required', 'Input validation missing');
});

test('generateWithOpenAI calls api.openai.com/v1/chat/completions', () => {
  assertIncludesAll(aiService, [
    'generateWithOpenAI', 'api.openai.com/v1/chat/completions',
  ], 'OpenAI endpoint: ');
});

test('generateWithOpenAI configures temperature, max_tokens, top_p', () => {
  assertIncludesAll(aiService, ['temperature', 'max_tokens', 'top_p'], 'OpenAI params: ');
});

test('generateWithGemini calls generativelanguage.googleapis.com', () => {
  assertIncludesAll(aiService, [
    'generateWithGemini', 'generativelanguage.googleapis.com',
  ], 'Gemini endpoint: ');
});

test('generateWithGemini uses systemInstruction and generationConfig', () => {
  assertIncludesAll(aiService, ['systemInstruction', 'generationConfig', 'maxOutputTokens'], 'Gemini config: ');
});

test('Both generators use AbortController for timeout protection', () => {
  const abortCount = (aiService.match(/AbortController/g) || []).length;
  assert(abortCount >= 4, `Expected ≥4 AbortController instances, found ${abortCount}`);
});

test('Both generators handle AbortError specifically', () => {
  assertIncludesAll(aiService, ['AbortError', 'generation timed out'], 'Timeout handling: ');
});

test('buildPrompt includes job details, freelancer profile, and instructions', () => {
  assertIncludesAll(aiService, [
    'buildPrompt', 'JOB DETAILS', 'FREELANCER PROFILE', 'INSTRUCTIONS',
  ], 'Prompt builder: ');
});

test('buildPrompt optionally includes case study section', () => {
  assertIncludes(aiService, 'CASE STUDY TO INCORPORATE', 'Case study section missing');
});

test('upgradeProposalWithCaseStudy enhances existing proposals', () => {
  assertIncludesAll(aiService, [
    'upgradeProposalWithCaseStudy', 'upgradeWithOpenAI', 'upgradeWithGemini',
  ], 'Upgrade method: ');
});

test('upgradePrompt instructs AI to maintain structure and integrate case study', () => {
  assertIncludesAll(aiService, [
    'Keep the original structure', 'Naturally integrate the case study',
  ], 'Upgrade prompt: ');
});

// ═════════════════════════════════════════════
//  16. PRODUCTION — Security Checks
// ═════════════════════════════════════════════
suite('16. Production — Security');

test('CORS restricts origin to FRONTEND_URL', () => {
  assertIncludesAll(appContent, ['origin:FRONTEND_URL', 'credentials: true'], 'CORS security: ');
});

test('CORS allows only specific HTTP methods', () => {
  assertIncludesAll(appContent, ["'GET'", "'POST'", "'PUT'", "'DELETE'", "'PATCH'"], 'CORS methods: ');
});

test('Passwords are never sent in API responses (select: false / select("-password"))', () => {
  assertIncludes(adminModel, 'select: false', 'Admin password select:false');
  assertIncludes(userController, 'select("-password")', 'User password excluded');
  assertIncludes(authMiddleware, "select('-password')", 'Middleware excludes password');
});

test('JWT tokens use configurable expiration (JWT_EXPIRES_IN)', () => {
  assertIncludes(authController, 'JWT_EXPIRES_IN', 'JWT expiration not configurable');
});

test('Admin login checks account active status before auth', () => {
  assertIncludes(authController, '!admin.isActive', 'Active status check missing');
});

test('Arcjet provides bot protection and rate limiting in production', () => {
  assertIncludesAll(arcjetContent, ['shield', 'detectBot', 'tokenBucket', '"LIVE"'], 'Arcjet protection: ');
});

test('All job/proposal routes require authorize middleware', () => {
  const jobRouteCount = (jobRouter.match(/authorize/g) || []).length;
  const proposalRouteCount = (proposalRouter.match(/authorize/g) || []).length;
  assert(jobRouteCount >= 6, `Job routes authorize count: ${jobRouteCount} (expected ≥6)`);
  assert(proposalRouteCount >= 9, `Proposal routes authorize count: ${proposalRouteCount} (expected ≥9)`);
});

test('Proposal operations verify user ownership before access', () => {
  const ownershipChecks = (proposalController.match(/userId\.toString\(\) !== userId/g) || []).length;
  assert(ownershipChecks >= 4, `Ownership checks: ${ownershipChecks} (expected ≥4)`);
});

// ═════════════════════════════════════════════
//  17. PRODUCTION — Error Handling
// ═════════════════════════════════════════════
suite('17. Production — Error Handling');

test('All controllers use try-catch with next(error) pattern', () => {
  for (const file of controllers) {
    const content = readSource(file);
    assertIncludes(content, 'try', `${file}: try block missing`);
    assertIncludes(content, 'catch', `${file}: catch block missing`);
    assertIncludes(content, 'next(', `${file}: next(error) missing`);
  }
});

test('Error middleware handles CastError, DuplicateKey, ValidationError', () => {
  assertIncludesAll(errorMiddleware, ['CastError', '11000', 'ValidationError'], 'Error types: ');
});

test('Error middleware returns JSON with success:false and error message', () => {
  assertIncludesAll(errorMiddleware, ['success:false', 'error:error.message'], 'Error response: ');
});

test('Services handle API errors gracefully with fallbacks', () => {
  assertIncludes(upworkService, 'Upwork API Error', 'Upwork error handling missing');
  assertIncludes(aiService, 'API Error', 'AI error handling missing');
});

test('Upwork service falls back to cache on API failure', () => {
  assertIncludes(upworkService, 'await this.getCachedJobs(keywords)', 'Cache fallback missing');
});

test('Background job errors are caught and logged (not crash server)', () => {
  assertIncludes(jobController, 'Background job fetch error', 'Background error catching missing');
  assertIncludes(proposalController, 'Background proposal generation error', 'Background proposal error missing');
});

// ═════════════════════════════════════════════
//  18. PRODUCTION — Performance & Scalability
// ═════════════════════════════════════════════
suite('18. Production — Performance');

test('Job search is non-blocking (returns immediately, processes in background)', () => {
  assertIncludesAll(jobController, [
    'upworkService.searchJobs(keywords, filters)', '.then(', '.catch(',
  ], 'Non-blocking search: ');
});

test('Proposal generation is non-blocking', () => {
  assertIncludesAll(proposalController, [
    'generateProposalAsync(', '.catch(',
  ], 'Non-blocking generation: ');
});

test('Job caching with configurable TTL and auto-expiry TTL index', () => {
  assertIncludes(upworkService, 'cacheTTL', 'cacheTTL missing');
  assertIncludes(jobModel, 'expireAfterSeconds: 0', 'TTL index missing');
});

test('Upwork service uses bulkWrite for efficient batch database operations', () => {
  assertIncludes(upworkService, 'bulkWrite', 'bulkWrite missing');
});

test('Pagination implemented in getFilteredJobs and getUserProposals', () => {
  assertIncludesAll(jobController, ['skip', 'limit', 'pages'], 'Job pagination: ');
  assertIncludesAll(proposalController, ['skip', 'limit', 'pages'], 'Proposal pagination: ');
});

test('AI service has configurable timeout (PROPOSAL_GENERATION_TIMEOUT)', () => {
  assertIncludesAll(aiService, ['PROPOSAL_GENERATION_TIMEOUT', 'this.timeout', 'setTimeout'], 'AI timeout: ');
});

test('getAllDemos limits max page size to 100', () => {
  assertIncludes(demoController, 'Math.min(Math.max(', 'Page size limit missing');
});

test('Job insertMany uses ordered:false for faster parallel inserts', () => {
  assertIncludes(jobController, 'ordered: false', 'ordered:false missing');
});

// ═════════════════════════════════════════════
//  19. PRODUCTION — Data Integrity
// ═════════════════════════════════════════════
suite('19. Production — Data Integrity');

test('signUp uses MongoDB transaction (session, commit, abort)', () => {
  assertIncludesAll(authController, [
    'startSession', 'startTransaction', 'commitTransaction', 'abortTransaction',
  ], 'Transaction: ');
});

test('User email is unique and lowercase', () => {
  assertIncludesAll(userModel, ['unique: true', 'lowercase: true'], 'Email uniqueness: ');
});

test('Admin username is unique', () => {
  assertIncludes(adminModel, 'unique: true', 'Admin username uniqueness missing');
});

test('Proposal has compound unique index (userId + jobId)', () => {
  assertIncludes(proposalModel, '{ unique: true }', 'Compound unique index missing');
});

test('Job upworkJobId is unique with index', () => {
  assertIncludesAll(jobModel, ['unique: true', 'index: true'], 'upworkJobId index: ');
});

test('All models enable timestamps', () => {
  for (const model of models) {
    const content = readSource(model);
    assertIncludes(content, 'timestamps', `${model}: timestamps missing`);
  }
});

test('Proposal status transitions tracked in statusHistory', () => {
  assertIncludesAll(proposalController, [
    'statusHistory.push', 'timestamp', 'notes',
  ], 'Status history tracking: ');
});

test('User stats updated atomically with $inc', () => {
  assertIncludesAll(jobController, ['$inc', 'stats.jobsMatched'], 'Atomic stats: ');
  assertIncludesAll(proposalController, ['$inc', 'stats.proposalsSent'], 'Atomic proposal stats: ');
});

// ═════════════════════════════════════════════
//  20. PRODUCTION — Integration & Wiring
// ═════════════════════════════════════════════
suite('20. Production — Integration');

test('job.controller.js imports and uses upworkService', () => {
  assertIncludesAll(jobController, [
    "import upworkService from '../services/upwork.service.js'",
    'upworkService.searchJobs', 'upworkService.applyBadJobFilters', 'upworkService.applyRateMatching',
  ], 'Upwork integration: ');
});

test('job.controller.js imports and uses aiService', () => {
  assertIncludes(jobController, "import aiService from '../services/ai.service.js'", 'AI service import missing');
});

test('proposal.controller.js imports and uses aiService', () => {
  assertIncludesAll(proposalController, [
    "import aiService from '../services/ai.service.js'",
    'aiService.generateProposal', 'aiService.upgradeProposalWithCaseStudy',
  ], 'AI integration: ');
});

test('auth.middleware.js imports both User and Admin models', () => {
  assertIncludesAll(authMiddleware, [
    "import User from '../models/user.model.js'",
    "import Admin from '../models/admin.model.js'",
  ], 'Middleware model imports: ');
});

test('app.js imports createDefaultAdmin from auth controller', () => {
  assertIncludes(appContent, "import { createDefaultAdmin } from './controller/auth.controller.js'", 'createDefaultAdmin import missing');
});

test('app.js imports arcjetMiddleware', () => {
  assertIncludes(appContent, "import arcjetMiddleware from './middleware/arcject.middleware.js'", 'Arcjet middleware import missing');
});

// ═════════════════════════════════════════════
//  SUMMARY
// ═════════════════════════════════════════════
log('\n' + '═'.repeat(50), 'cyan');
log('  TEST RESULTS SUMMARY', 'bold');
log('═'.repeat(50), 'cyan');

log(`\n  ✓ Passed:  ${passedTests}`, 'green');
log(`  ✗ Failed:  ${failedTests}`, failedTests > 0 ? 'red' : 'green');
log(`  ─ Total:   ${passedTests + failedTests}`, 'cyan');
log(`  ☰ Suites:  ${Object.keys(suiteResults).length}`, 'cyan');

if (failedTests > 0) {
  log('\n' + '─'.repeat(50), 'red');
  log('  FAILED TESTS:', 'red');
  log('─'.repeat(50), 'red');
  failedDetails.forEach(({ suite, test, error }) => {
    log(`\n  [${suite}]`, 'yellow');
    log(`  ✗ ${test}`, 'red');
    log(`    → ${error}`, 'dim');
  });
}

// Suite breakdown
log('\n' + '─'.repeat(50), 'dim');
log('  SUITE BREAKDOWN:', 'cyan');
log('─'.repeat(50), 'dim');
Object.entries(suiteResults).forEach(([name, { passed, failed }]) => {
  const status = failed === 0 ? colors.green + '✓' : colors.red + '✗';
  log(`  ${status} ${name} ${colors.dim}(${passed}/${passed + failed})${colors.reset}`);
});

log('\n' + '═'.repeat(50), 'cyan');
process.exit(failedTests > 0 ? 1 : 0);
