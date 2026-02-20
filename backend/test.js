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
];

const requiredControllers = [
  'controller/auth.controller.js',
  'controller/user.controller.js',
  'controller/demo.controller.js',
];

const requiredRoutes = [
  'routes/auth.router.js',
  'routes/user.router.js',
  'routes/demo.router.js',
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
// Summary
// ============================================
log('\n=== Test Summary ===', 'cyan');
log(`Passed: ${passedTests}`, 'green');
log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
log(`Total: ${passedTests + failedTests}`, 'cyan');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
