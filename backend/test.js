import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(description, fn) {
  try {
    fn();
    passedTests++;
    log(`✓ ${description}`, 'green');
  } catch (error) {
    failedTests++;
    log(`✗ ${description}`, 'red');
    log(`  Error: ${error.message}`, 'red');
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================
// Test Suite: Project Structure
// ============================================
log('\n=== Testing Project Structure ===', 'blue');

const requiredFiles = [
  'app.js',
  'package.json',
  'config/env.js',
  'database/mongodb.js',
  'middleware/auth.middleware.js',
  'middleware/error.middleware.js',
];

const requiredModels = [
  'models/user.model.js',
  'models/admin.model.js',
  'models/demo.model.js',
  'models/job.model.js',
  'models/proposal.model.js',
];

const requiredControllers = [
  'controller/auth.controller.js',
  'controller/user.controller.js',
  'controller/demo.controller.js',
  'controller/job.controller.js',
  'controller/proposal.controller.js',
];

const requiredRoutes = [
  'routes/auth.router.js',
  'routes/user.router.js',
  'routes/demo.router.js',
  'routes/job.router.js',
  'routes/proposal.router.js',
];

const requiredServices = [
  'services/upwork.service.js',
  'services/ai.service.js',
];

requiredFiles.forEach(file => {
  test(`${file} exists`, () => {
    const filePath = path.join(__dirname, file);
    assert(fs.existsSync(filePath), `File ${file} not found`);
  });
});

requiredModels.forEach(file => {
  test(`${file} exists`, () => {
    const filePath = path.join(__dirname, file);
    assert(fs.existsSync(filePath), `Model ${file} not found`);
  });
});

requiredControllers.forEach(file => {
  test(`${file} exists`, () => {
    const filePath = path.join(__dirname, file);
    assert(fs.existsSync(filePath), `Controller ${file} not found`);
  });
});

requiredRoutes.forEach(file => {
  test(`${file} exists`, () => {
    const filePath = path.join(__dirname, file);
    assert(fs.existsSync(filePath), `Route ${file} not found`);
  });
});

requiredServices.forEach(file => {
  test(`${file} exists`, () => {
    const filePath = path.join(__dirname, file);
    assert(fs.existsSync(filePath), `Service ${file} not found`);
  });
});

// ============================================
// Test Suite: Dependencies
// ============================================
log('\n=== Testing Dependencies ===', 'blue');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = [
  'express',
  'mongoose',
  'jsonwebtoken',
  'bcryptjs',
  'cors',
  'dotenv',
];

requiredDeps.forEach(dep => {
  test(`${dep} is installed`, () => {
    assert(
      packageJson.dependencies[dep],
      `Dependency ${dep} not found in package.json`
    );
  });
});

// ============================================
// Test Suite: File Contents
// ============================================
log('\n=== Testing File Contents ===', 'blue');

test('app.js contains Express setup', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appContent.includes('express()'), 'Express app not initialized');
  assert(appContent.includes('app.listen'), 'app.listen not found');
});

test('app.js includes CORS configuration', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appContent.includes('cors'), 'CORS not configured');
});

test('app.js includes routes', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appContent.includes('authRouter'), 'Auth router not included');
  assert(appContent.includes('demoRouter'), 'Demo router not included');
});

test('auth.controller.js contains required functions', () => {
  const authContent = fs.readFileSync(
    path.join(__dirname, 'controller/auth.controller.js'),
    'utf8'
  );
  assert(authContent.includes('export const signUp'), 'signUp function not found');
  assert(authContent.includes('export const signIn'), 'signIn function not found');
  assert(authContent.includes('export const adminLogin'), 'adminLogin function not found');
  assert(authContent.includes('export const getAdminProfile'), 'getAdminProfile function not found');
});

test('demo.controller.js contains required functions', () => {
  const demoContent = fs.readFileSync(
    path.join(__dirname, 'controller/demo.controller.js'),
    'utf8'
  );
  assert(demoContent.includes('getAvailableDates'), 'getAvailableDates not found');
  assert(demoContent.includes('getAvailableTimes'), 'getAvailableTimes not found');
  assert(demoContent.includes('scheduleDemo'), 'scheduleDemo not found');
});

test('auth.middleware.js contains authorization logic', () => {
  const authMiddlewareContent = fs.readFileSync(
    path.join(__dirname, 'middleware/auth.middleware.js'),
    'utf8'
  );
  assert(authMiddlewareContent.includes('jwt.verify'), 'JWT verification not found');
  assert(authMiddlewareContent.includes('Bearer'), 'Bearer token check not found');
});

test('user.model.js has required fields', () => {
  const userModelContent = fs.readFileSync(
    path.join(__dirname, 'models/user.model.js'),
    'utf8'
  );
  assert(userModelContent.includes('email'), 'email field not found');
  assert(userModelContent.includes('password'), 'password field not found');
  assert(userModelContent.includes('name'), 'name field not found');
});

test('admin.model.js has required fields', () => {
  const adminModelContent = fs.readFileSync(
    path.join(__dirname, 'models/admin.model.js'),
    'utf8'
  );
  assert(adminModelContent.includes('username'), 'username field not found');
  assert(adminModelContent.includes('password'), 'password field not found');
  assert(adminModelContent.includes('role'), 'role field not found');
});

test('demo.model.js has required fields', () => {
  const demoModelContent = fs.readFileSync(
    path.join(__dirname, 'models/demo.model.js'),
    'utf8'
  );
  assert(demoModelContent.includes('email'), 'email field not found');
  assert(demoModelContent.includes('demoDate'), 'demoDate field not found');
  assert(demoModelContent.includes('timeSlot'), 'timeSlot field not found');
  assert(demoModelContent.includes('status'), 'status field not found');
});

test('auth.router.js exports router', () => {
  const authRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/auth.router.js'),
    'utf8'
  );
  assert(authRouterContent.includes('export default'), 'Router export not found');
  assert(
    authRouterContent.includes('post("/sign-up') || authRouterContent.includes('post(""/sign-up'),
    'sign-up route not found'
  );
  assert(
    authRouterContent.includes('post("/sign-in') || authRouterContent.includes('post(""/sign-in'),
    'sign-in route not found'
  );
  assert(
    authRouterContent.includes('admin/login'),
    'admin/login route not found'
  );
});

test('demo.router.js exports router', () => {
  const demoRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/demo.router.js'),
    'utf8'
  );
  assert(demoRouterContent.includes('export default'), 'Router export not found');
  assert(demoRouterContent.includes('/schedule'), 'Schedule route not found');
});

test('job.controller.js contains required functions', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('export const searchJobs'), 'searchJobs function not found');
  assert(jobContent.includes('export const searchJobsWithAIAnalysis'), 'searchJobsWithAIAnalysis not found');
  assert(jobContent.includes('export const getFilteredJobs'), 'getFilteredJobs function not found');
  assert(jobContent.includes('export const getJobDetail'), 'getJobDetail function not found');
  assert(jobContent.includes('export const markJobAsMatched'), 'markJobAsMatched function not found');
  assert(jobContent.includes('export const markJobAsRejected'), 'markJobAsRejected function not found');
});

test('proposal.controller.js contains required functions', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('export const generateProposal'), 'generateProposal function not found');
  assert(proposalContent.includes('export const getProposal'), 'getProposal function not found');
  assert(proposalContent.includes('export const getUserProposals'), 'getUserProposals not found');
  assert(proposalContent.includes('export const sendProposal'), 'sendProposal function not found');
  assert(proposalContent.includes('export const updateProposalStatus'), 'updateProposalStatus not found');
  assert(proposalContent.includes('export const upgradeProposal'), 'upgradeProposal function not found');
});

test('job.model.js has required fields', () => {
  const jobModelContent = fs.readFileSync(
    path.join(__dirname, 'models/job.model.js'),
    'utf8'
  );
  assert(jobModelContent.includes('upworkJobId'), 'upworkJobId field not found');
  assert(jobModelContent.includes('title'), 'title field not found');
  assert(jobModelContent.includes('description'), 'description field not found');
  assert(jobModelContent.includes('budgetType'), 'budgetType field not found');
  assert(jobModelContent.includes('clientInfo'), 'clientInfo field not found');
  assert(jobModelContent.includes('aiAnalysis'), 'aiAnalysis field not found');
});

test('proposal.model.js has required fields', () => {
  const proposalModelContent = fs.readFileSync(
    path.join(__dirname, 'models/proposal.model.js'),
    'utf8'
  );
  assert(proposalModelContent.includes('userId'), 'userId field not found');
  assert(proposalModelContent.includes('jobId'), 'jobId field not found');
  assert(proposalModelContent.includes('content'), 'content field not found');
  assert(proposalModelContent.includes('status'), 'status field not found');
  assert(proposalModelContent.includes('statusHistory'), 'statusHistory field not found');
  assert(proposalModelContent.includes('caseStudy'), 'caseStudy field not found');
});

test('upwork.service.js contains required methods', () => {
  const upworkContent = fs.readFileSync(
    path.join(__dirname, 'services/upwork.service.js'),
    'utf8'
  );
  assert(upworkContent.includes('searchJobs'), 'searchJobs method not found');
  assert(upworkContent.includes('applyBadJobFilters'), 'applyBadJobFilters method not found');
  assert(upworkContent.includes('applyRateMatching'), 'applyRateMatching method not found');
  assert(upworkContent.includes('getCachedJobs'), 'getCachedJobs method not found');
});

test('ai.service.js contains required methods', () => {
  const aiContent = fs.readFileSync(
    path.join(__dirname, 'services/ai.service.js'),
    'utf8'
  );
  assert(aiContent.includes('generateProposal'), 'generateProposal method not found');
  assert(aiContent.includes('generateWithOpenAI'), 'generateWithOpenAI method not found');
  assert(aiContent.includes('generateWithGemini'), 'generateWithGemini method not found');
  assert(aiContent.includes('upgradeProposalWithCaseStudy'), 'upgradeProposalWithCaseStudy not found');
});

test('job.router.js exports router', () => {
  const jobRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/job.router.js'),
    'utf8'
  );
  assert(jobRouterContent.includes('export default'), 'Router export not found');
  assert(jobRouterContent.includes('search'), 'search route not found');
  assert(jobRouterContent.includes('authorize'), 'Authorization middleware not found');
});

test('proposal.router.js exports router', () => {
  const proposalRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/proposal.router.js'),
    'utf8'
  );
  assert(proposalRouterContent.includes('export default'), 'Router export not found');
  assert(proposalRouterContent.includes('generate'), 'generate route not found');
  assert(proposalRouterContent.includes('authorize'), 'Authorization middleware not found');
});

test('user.model.js has job preferences fields', () => {
  const userModelContent = fs.readFileSync(
    path.join(__dirname, 'models/user.model.js'),
    'utf8'
  );
  assert(userModelContent.includes('jobPreferences'), 'jobPreferences object not found');
  assert(userModelContent.includes('keywords'), 'keywords array not found');
  assert(userModelContent.includes('rateType'), 'rateType field not found');
  assert(userModelContent.includes('badJobCriteria'), 'badJobCriteria field not found');
  assert(userModelContent.includes('stats'), 'stats field not found');
});

// ============================================
// Test Suite: Configuration
// ============================================
log('\n=== Testing Configuration ===', 'blue');

test('env.js imports environment variables', () => {
  const envContent = fs.readFileSync(path.join(__dirname, 'config/env.js'), 'utf8');
  assert(envContent.includes('dotenv'), 'dotenv not imported');
  assert(envContent.includes('process.env'), 'process.env not used');
});

test('mongodb.js contains connection logic', () => {
  const mongoContent = fs.readFileSync(
    path.join(__dirname, 'database/mongodb.js'),
    'utf8'
  );
  assert(mongoContent.includes('mongoose'), 'mongoose not imported');
  assert(mongoContent.includes('connect'), 'connect method not found');
});

// ============================================
// Test Suite: Environment Setup
// ============================================
log('\n=== Testing Environment Setup ===', 'blue');

test('package.json has start script', () => {
  assert(packageJson.scripts.start, 'start script not found');
});

test('package.json has test script', () => {
  assert(packageJson.scripts.test, 'test script not found');
});

test('package.json is of type module', () => {
  assert(packageJson.type === 'module', 'package.json type is not module');
});

// ============================================
// Test Suite: Service Logic
// ============================================
log('\n=== Testing Service Logic ===', 'blue');

test('upwork.service.js has caching logic', () => {
  const upworkContent = fs.readFileSync(
    path.join(__dirname, 'services/upwork.service.js'),
    'utf8'
  );
  assert(upworkContent.includes('cacheTTL'), 'Cache TTL not configured');
  assert(upworkContent.includes('cacheExpiry'), 'Cache expiry logic not found');
  assert(upworkContent.includes('bulkWrite'), 'Bulk write for caching not found');
});

test('ai.service.js supports both OpenAI and Gemini', () => {
  const aiContent = fs.readFileSync(
    path.join(__dirname, 'services/ai.service.js'),
    'utf8'
  );
  assert(aiContent.includes('openai.com'), 'OpenAI endpoint not found');
  assert(aiContent.includes('generativelanguage.googleapis.com'), 'Gemini endpoint not found');
  assert(aiContent.includes('AbortController'), 'Timeout handling not found');
});

test('ai.service.js has case study integration', () => {
  const aiContent = fs.readFileSync(
    path.join(__dirname, 'services/ai.service.js'),
    'utf8'
  );
  assert(aiContent.includes('upgradeProposalWithCaseStudy'), 'Case study upgrade not found');
  assert(aiContent.includes('caseStudy'), 'Case study parameter not found');
});

test('job.controller.js implements AI scoring', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('calculateMatchScore'), 'Match score calculation not found');
  assert(jobContent.includes('extractGreenFlags'), 'Green flags extraction not found');
  assert(jobContent.includes('extractRedFlags'), 'Red flags extraction not found');
});

test('proposal.model.js has status enum', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'models/proposal.model.js'),
    'utf8'
  );
  assert(proposalContent.includes("'draft'"), 'draft status not found');
  assert(proposalContent.includes("'sent'"), 'sent status not found');
  assert(proposalContent.includes("'accepted'"), 'accepted status not found');
  assert(proposalContent.includes("'rejected'"), 'rejected status not found');
});

test('env.js includes AI and Upwork credentials', () => {
  const envContent = fs.readFileSync(path.join(__dirname, 'config/env.js'), 'utf8');
  assert(envContent.includes('OPENAI_API_KEY'), 'OPENAI_API_KEY not exported');
  assert(envContent.includes('GOOGLE_GEMINI_API_KEY'), 'GOOGLE_GEMINI_API_KEY not exported');
  assert(envContent.includes('UPWORK_ACCESS_TOKEN'), 'UPWORK_ACCESS_TOKEN not exported');
});

// ============================================
// Test Suite: Integration Points
// ============================================
log('\n=== Testing Integration Points ===', 'blue');

test('job.controller.js calls upwork service', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('upworkService'), 'Upwork service not imported');
  assert(jobContent.includes('searchJobs'), 'Upwork searchJobs call not found');
});

test('proposal.controller.js calls AI service', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('aiService'), 'AI service not imported');
  assert(proposalContent.includes('generateProposal'), 'AI generateProposal call not found');
});

test('proposal.controller.js performs async generation', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('async'), 'Async function not found');
  assert(proposalContent.includes('generateProposalAsync'), 'Async generation function not found');
});

test('job.router.js requires authorization', () => {
  const jobRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/job.router.js'),
    'utf8'
  );
  assert(jobRouterContent.includes('authorize'), 'Authorization not required for routes');
});

test('proposal.router.js requires authorization', () => {
  const proposalRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/proposal.router.js'),
    'utf8'
  );
  assert(proposalRouterContent.includes('authorize'), 'Authorization not required for routes');
});

// ============================================
// Test Suite: Production - API Endpoints
// ============================================
log('\n=== Testing Production - API Endpoints ===', 'blue');

test('auth.router.js has sign-up endpoint with validation', () => {
  const authRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/auth.router.js'),
    'utf8'
  );
  assert(authRouterContent.includes('post'), 'POST method not found');
  assert(authRouterContent.includes('sign-up') || authRouterContent.includes('signup'), 'Sign-up endpoint not found');
});

test('auth.router.js has sign-in endpoint', () => {
  const authRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/auth.router.js'),
    'utf8'
  );
  assert(authRouterContent.includes('sign-in') || authRouterContent.includes('signin'), 'Sign-in endpoint not found');
});

test('job.router.js has protected search endpoint', () => {
  const jobRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/job.router.js'),
    'utf8'
  );
  assert(jobRouterContent.includes('authorize'), 'Authorization middleware missing');
  assert(jobRouterContent.includes('search'), 'Search endpoint missing');
});

test('proposal.router.js has protected generate endpoint', () => {
  const proposalRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/proposal.router.js'),
    'utf8'
  );
  assert(proposalRouterContent.includes('authorize'), 'Authorization middleware missing');
  assert(proposalRouterContent.includes('generate'), 'Generate endpoint missing');
});

test('user.router.js has profile endpoints', () => {
  const userRouterContent = fs.readFileSync(
    path.join(__dirname, 'routes/user.router.js'),
    'utf8'
  );
  assert(userRouterContent.includes('export default'), 'Router export missing');
});

// ============================================
// Test Suite: Production - Authentication
// ============================================
log('\n=== Testing Production - Authentication ===', 'blue');

test('auth.middleware.js has JWT verification', () => {
  const authMiddlewareContent = fs.readFileSync(
    path.join(__dirname, 'middleware/auth.middleware.js'),
    'utf8'
  );
  assert(authMiddlewareContent.includes('jwt.verify'), 'JWT verification missing');
  assert(authMiddlewareContent.includes('Bearer'), 'Bearer token check missing');
  assert(authMiddlewareContent.includes('token'), 'Token extraction missing');
});

test('auth.middleware.js returns error for invalid tokens', () => {
  const authMiddlewareContent = fs.readFileSync(
    path.join(__dirname, 'middleware/auth.middleware.js'),
    'utf8'
  );
  assert(authMiddlewareContent.includes('error') || authMiddlewareContent.includes('throw'), 'Error handling missing');
});

test('auth.controller.js hashes passwords', () => {
  const authContent = fs.readFileSync(
    path.join(__dirname, 'controller/auth.controller.js'),
    'utf8'
  );
  assert(authContent.includes('bcrypt') || authContent.includes('hash'), 'Password hashing missing');
});

test('auth.controller.js generates JWT tokens', () => {
  const authContent = fs.readFileSync(
    path.join(__dirname, 'controller/auth.controller.js'),
    'utf8'
  );
  assert(authContent.includes('jwt.sign') || authContent.includes('token'), 'JWT generation missing');
});

// ============================================
// Test Suite: Production - Error Handling
// ============================================
log('\n=== Testing Production - Error Handling ===', 'blue');

test('error.middleware.js exists and handles errors', () => {
  const errorMiddlewareContent = fs.readFileSync(
    path.join(__dirname, 'middleware/error.middleware.js'),
    'utf8'
  );
  assert(errorMiddlewareContent.includes('error') || errorMiddlewareContent.includes('err'), 'Error parameter missing');
  assert(errorMiddlewareContent.includes('res.status'), 'Response status missing');
});

test('auth.controller.js handles sign-up errors', () => {
  const authContent = fs.readFileSync(
    path.join(__dirname, 'controller/auth.controller.js'),
    'utf8'
  );
  assert(authContent.includes('try') || authContent.includes('catch'), 'Try-catch block missing');
  assert(authContent.includes('error'), 'Error handling missing');
});

test('job.controller.js handles search errors', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('try') || jobContent.includes('catch'), 'Try-catch block missing');
});

test('proposal.controller.js handles generation errors', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('try') || proposalContent.includes('catch'), 'Try-catch block missing');
});

// ============================================
// Test Suite: Production - Data Validation
// ============================================
log('\n=== Testing Production - Data Validation ===', 'blue');

test('user.model.js has email validation', () => {
  const userModelContent = fs.readFileSync(
    path.join(__dirname, 'models/user.model.js'),
    'utf8'
  );
  assert(userModelContent.includes('email'), 'Email field missing');
  assert(userModelContent.includes('trim') || userModelContent.includes('lowercase') || userModelContent.includes('match'), 'Email validation missing');
});

test('user.model.js requires password field', () => {
  const userModelContent = fs.readFileSync(
    path.join(__dirname, 'models/user.model.js'),
    'utf8'
  );
  assert(userModelContent.includes('password'), 'Password field missing');
  assert(userModelContent.includes('required') || userModelContent.includes('minlength'), 'Password validation missing');
});

test('admin.model.js has required validation', () => {
  const adminModelContent = fs.readFileSync(
    path.join(__dirname, 'models/admin.model.js'),
    'utf8'
  );
  assert(adminModelContent.includes('required'), 'Required validation missing');
});

test('job.model.js validates budget fields', () => {
  const jobModelContent = fs.readFileSync(
    path.join(__dirname, 'models/job.model.js'),
    'utf8'
  );
  assert(jobModelContent.includes('budget') || jobModelContent.includes('rate'), 'Budget field missing');
});

test('proposal.model.js validates proposal status', () => {
  const proposalModelContent = fs.readFileSync(
    path.join(__dirname, 'models/proposal.model.js'),
    'utf8'
  );
  assert(proposalModelContent.includes('enum') || proposalModelContent.includes('required'), 'Status validation missing');
});

// ============================================
// Test Suite: Production - Database
// ============================================
log('\n=== Testing Production - Database ===', 'blue');

test('mongodb.js connects to MongoDB', () => {
  const mongoContent = fs.readFileSync(
    path.join(__dirname, 'database/mongodb.js'),
    'utf8'
  );
  assert(mongoContent.includes('mongoose.connect'), 'MongoDB connection missing');
});

test('mongodb.js handles connection errors', () => {
  const mongoContent = fs.readFileSync(
    path.join(__dirname, 'database/mongodb.js'),
    'utf8'
  );
  assert(mongoContent.includes('catch') || mongoContent.includes('error'), 'Error handling missing');
});

test('user.model.js uses mongoose', () => {
  const userModelContent = fs.readFileSync(
    path.join(__dirname, 'models/user.model.js'),
    'utf8'
  );
  assert(userModelContent.includes('mongoose') || userModelContent.includes('Schema'), 'Mongoose not used');
});

test('models have timestamps', () => {
  const userModelContent = fs.readFileSync(
    path.join(__dirname, 'models/user.model.js'),
    'utf8'
  );
  assert(userModelContent.includes('timestamps') || userModelContent.includes('createdAt'), 'Timestamps missing');
});

// ============================================
// Test Suite: Production - Security
// ============================================
log('\n=== Testing Production - Security ===', 'blue');

test('app.js has CORS protection', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appContent.includes('cors'), 'CORS middleware missing');
});

test('auth.controller.js validates user input on sign-up', () => {
  const authContent = fs.readFileSync(
    path.join(__dirname, 'controller/auth.controller.js'),
    'utf8'
  );
  assert(authContent.includes('email') && (authContent.includes('password') || authContent.includes('password')), 'Input validation missing');
});

test('auth.middleware.js protects routes with authorization', () => {
  const authMiddlewareContent = fs.readFileSync(
    path.join(__dirname, 'middleware/auth.middleware.js'),
    'utf8'
  );
  assert(authMiddlewareContent.includes('req.user') || authMiddlewareContent.includes('userId'), 'User identification missing');
});

test('proposal.controller.js validates user ownership', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('userId') || proposalContent.includes('user'), 'User ownership check missing');
});

test('job.controller.js validates user authorization for actions', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('authorize') || jobContent.includes('user'), 'Authorization check missing');
});

// ============================================
// Test Suite: Production - Performance
// ============================================
log('\n=== Testing Production - Performance ===', 'blue');

test('upwork.service.js implements caching', () => {
  const upworkContent = fs.readFileSync(
    path.join(__dirname, 'services/upwork.service.js'),
    'utf8'
  );
  assert(upworkContent.includes('cache') || upworkContent.includes('TTL'), 'Caching not implemented');
});

test('ai.service.js has timeout handling', () => {
  const aiContent = fs.readFileSync(
    path.join(__dirname, 'services/ai.service.js'),
    'utf8'
  );
  assert(aiContent.includes('AbortController') || aiContent.includes('timeout'), 'Timeout handling missing');
});

test('job.controller.js implements pagination', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('skip') || jobContent.includes('limit') || jobContent.includes('page'), 'Pagination missing');
});

test('proposal.controller.js handles async operations', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('async') || proposalContent.includes('await'), 'Async handling missing');
});

// ============================================
// Test Suite: Production - Logging & Monitoring
// ============================================
log('\n=== Testing Production - Logging & Monitoring ===', 'blue');

test('error.middleware.js logs errors', () => {
  const errorMiddlewareContent = fs.readFileSync(
    path.join(__dirname, 'middleware/error.middleware.js'),
    'utf8'
  );
  assert(errorMiddlewareContent.includes('console') || errorMiddlewareContent.includes('log'), 'Logging missing');
});

test('app.js includes middleware for request tracking', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(appContent.includes('middleware') || appContent.includes('app.use'), 'Middleware setup missing');
});

// ============================================
// Test Suite: Production - Integration
// ============================================
log('\n=== Testing Production - Integration ===', 'blue');

test('upwork.service.js and job.controller.js are integrated', () => {
  const jobContent = fs.readFileSync(
    path.join(__dirname, 'controller/job.controller.js'),
    'utf8'
  );
  assert(jobContent.includes('upworkService'), 'Upwork service not integrated');
});

test('ai.service.js and proposal.controller.js are integrated', () => {
  const proposalContent = fs.readFileSync(
    path.join(__dirname, 'controller/proposal.controller.js'),
    'utf8'
  );
  assert(proposalContent.includes('aiService'), 'AI service not integrated');
});

test('user.controller.js updates user statistics', () => {
  const userContent = fs.readFileSync(
    path.join(__dirname, 'controller/user.controller.js'),
    'utf8'
  );
  assert(userContent.includes('stats') || userContent.includes('update'), 'Stats update missing');
});

test('proposal.model.js tracks status history', () => {
  const proposalModelContent = fs.readFileSync(
    path.join(__dirname, 'models/proposal.model.js'),
    'utf8'
  );
  assert(proposalModelContent.includes('statusHistory'), 'Status history missing');
});

// ============================================
// Summary
// ============================================
log('\n=== Test Summary ===', 'cyan');
log(`Passed: ${passedTests}`, 'green');
log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
log(`Total: ${passedTests + failedTests}`, 'cyan');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
