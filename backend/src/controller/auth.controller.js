import mongoose from 'mongoose';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FRONTEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URI,
  GOOGLE_OAUTH_SUCCESS_REDIRECT_URL,
  GOOGLE_OAUTH_FAILURE_REDIRECT_URL,
  UPWORK_CLIENT_ID,
  UPWORK_CLIENT_SECRET,
  UPWORK_OAUTH_REDIRECT_URI,
  FREELANCER_BASE_URL,
  FREELANCER_ACCOUNTS_BASE_URL,
  FREELANCER_CLIENT_ID,
  FREELANCER_CLIENT_SECRET,
  FREELANCER_OAUTH_REDIRECT_URI,
  FREELANCER_OAUTH_SCOPE,
  FREELANCER_OAUTH_ADVANCED_SCOPES,
  FREELANCER_OAUTH_PROMPT,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_JWT_EXPIRES_IN,
} from '../config/env.js';

const GOOGLE_OAUTH_AUTHORIZE_URL =
  'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_OAUTH_USERINFO_URL =
  'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_OAUTH_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

const createUserToken = userId =>
  jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const normalizeEmail = email =>
  String(email || '')
    .trim()
    .toLowerCase();
const ADMIN_EMAIL_NORMALIZED = normalizeEmail(ADMIN_EMAIL);

const isAdminEmail = email =>
  Boolean(ADMIN_EMAIL_NORMALIZED) &&
  normalizeEmail(email) === ADMIN_EMAIL_NORMALIZED;

const createAdminToken = () =>
  jwt.sign(
    {
      role: 'admin',
      email: ADMIN_EMAIL_NORMALIZED,
    },
    JWT_SECRET,
    {
      expiresIn: ADMIN_JWT_EXPIRES_IN || JWT_EXPIRES_IN,
    }
  );

const sanitizeUser = user => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture || null,
  authProvider: user.authProvider,
  freelancerConnected: Boolean(user.freelancerAuth?.accessToken),
});

const ensureGoogleOAuthConfig = () => {
  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_OAUTH_REDIRECT_URI
  ) {
    const error = new Error(
      'Google OAuth is not configured. Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_OAUTH_REDIRECT_URI.'
    );
    error.statusCode = 500;
    error.code = 'GOOGLE_OAUTH_NOT_CONFIGURED';
    throw error;
  }
};

const getGoogleSuccessRedirectUrl = () =>
  GOOGLE_OAUTH_SUCCESS_REDIRECT_URL ||
  `${FRONTEND_URL || 'http://localhost:5173'}/user/sign-in`;

const getGoogleFailureRedirectUrl = () =>
  GOOGLE_OAUTH_FAILURE_REDIRECT_URL || getGoogleSuccessRedirectUrl();

const getFreelancerSuccessRedirectUrl = () =>
  `${FRONTEND_URL || 'http://localhost:5173'}/user/sign-in`;

const getFreelancerFailureRedirectUrl = () => getFreelancerSuccessRedirectUrl();

const redirectFreelancerFailure = (res, code, message) => {
  const failureUrl = new URL(getFreelancerFailureRedirectUrl());
  failureUrl.searchParams.set('oauth', 'failed');
  failureUrl.searchParams.set('provider', 'freelancer');
  failureUrl.searchParams.set('code', code);
  failureUrl.searchParams.set('message', message);
  return res.redirect(failureUrl.toString());
};

const createFreelancerState = (userId = null, intent = 'connect') =>
  jwt.sign(
    {
      provider: 'freelancer',
      userId,
      intent,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

const readFreelancerState = state => {
  if (!state) return null;
  try {
    const decoded = jwt.verify(String(state), JWT_SECRET);
    if (decoded?.provider !== 'freelancer') return null;
    return decoded;
  } catch {
    return null;
  }
};

const redirectGoogleFailure = (res, code, message) => {
  const failureUrl = new URL(getGoogleFailureRedirectUrl());
  failureUrl.searchParams.set('oauth', 'failed');
  failureUrl.searchParams.set('code', code);
  failureUrl.searchParams.set('message', message);
  return res.redirect(failureUrl.toString());
};

//----------------------- User Auth ----------------------//
//----------------------- User Auth ----------------------//
//----------------------- User Auth ----------------------//

export const signUp = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    //Logic to create a new User
    const { name, email, password } = req.body;
    if (isAdminEmail(email)) {
      const error = new Error('Admin email cannot be used for user sign up');
      error.statusCode = 403;
      throw error;
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error(
        !existingUser.password
          ? 'This email is already registered with OAuth. Please continue with OAuth sign-in.'
          : 'User already exist with this email'
      );
      error.statusCode = 409;
      if (!existingUser.password) {
        error.code = 'OAUTH_ACCOUNT_EXISTS';
      }
      throw error;
    }

    //Hahs Password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const newUsers = await User.create(
      [
        {
          name,
          email,
          password: hashedpassword,
          authProvider: 'local',
        },
      ],
      { session }
    );

    const token = createUserToken(newUsers[0]._id);

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        token,
        user: sanitizeUser(newUsers[0]),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (isAdminEmail(email)) {
      const error = new Error(
        'Admin account must sign in from the admin portal'
      );
      error.statusCode = 403;
      throw error;
    }
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('No user exist with this email');
      error.statusCode = 404;
      throw error;
    }

    if (!user.password) {
      const error = new Error(
        'This account uses OAuth sign-in. Please continue with OAuth.'
      );
      error.statusCode = 400;
      error.code = 'OAUTH_SIGNIN_REQUIRED';
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid password');
      error.statusCode = 401;
      throw error;
    }
    const token = createUserToken(user._id);

    res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: 'User signed out successfully',
    }); // Invalidate the token on the client side by clearing it from storage
  } catch (error) {
    next(error);
  }
};

//----------------------- Admin Auth ----------------------//

export const adminSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      const error = new Error('Admin credentials are not configured');
      error.statusCode = 500;
      throw error;
    }

    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isAdminEmail(email)) {
      const error = new Error('Invalid admin credentials');
      error.statusCode = 401;
      throw error;
    }

    const normalizedPassword = String(password);
    let passwordMatches = false;

    if (String(ADMIN_PASSWORD).startsWith('$2')) {
      passwordMatches = await bcrypt.compare(
        normalizedPassword,
        String(ADMIN_PASSWORD)
      );
    } else {
      passwordMatches = normalizedPassword === String(ADMIN_PASSWORD);
    }

    if (!passwordMatches) {
      const error = new Error('Invalid admin credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = createAdminToken();

    res.status(200).json({
      success: true,
      message: 'Admin signed in successfully',
      data: {
        token,
        admin: {
          email: ADMIN_EMAIL_NORMALIZED,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

//----------------------- Google OAuth ----------------------//

export const startGoogleOAuth = async (req, res, next) => {
  try {
    ensureGoogleOAuthConfig();

    const state = req.query.state || 'signin';

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state: String(state),
    });

    return res.redirect(`${GOOGLE_OAUTH_AUTHORIZE_URL}?${params.toString()}`);
  } catch (error) {
    return next(error);
  }
};

export const handleGoogleOAuthCallback = async (req, res, next) => {
  try {
    ensureGoogleOAuthConfig();

    const {
      code,
      state,
      error: oauthError,
      error_description: errorDescription,
    } = req.query;

    if (oauthError) {
      return redirectGoogleFailure(
        res,
        'GOOGLE_OAUTH_DENIED',
        errorDescription
          ? `Google OAuth failed: ${String(errorDescription)}`
          : `Google OAuth failed: ${String(oauthError)}`
      );
    }

    if (!code) {
      return redirectGoogleFailure(
        res,
        'GOOGLE_OAUTH_CODE_MISSING',
        'Missing authorization code from Google callback.'
      );
    }

    const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => null);

    if (!tokenResponse.ok || !tokenData?.access_token) {
      return redirectGoogleFailure(
        res,
        'GOOGLE_TOKEN_EXCHANGE_FAILED',
        'Could not exchange Google authorization code for access token.'
      );
    }

    if (tokenData.id_token) {
      const verifyResponse = await fetch(
        `${GOOGLE_OAUTH_TOKEN_INFO_URL}?id_token=${encodeURIComponent(tokenData.id_token)}`
      );
      const verifyData = await verifyResponse.json().catch(() => null);

      if (!verifyResponse.ok || verifyData?.aud !== GOOGLE_CLIENT_ID) {
        return redirectGoogleFailure(
          res,
          'GOOGLE_ID_TOKEN_INVALID',
          'Google ID token validation failed. Please try again.'
        );
      }
    }

    const profileResponse = await fetch(GOOGLE_OAUTH_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json().catch(() => null);

    if (!profileResponse.ok || !profileData?.email) {
      return redirectGoogleFailure(
        res,
        'GOOGLE_PROFILE_FETCH_FAILED',
        'Failed to fetch Google profile data.'
      );
    }

    const googleEmail = String(profileData.email).toLowerCase().trim();
    const googleName =
      (profileData.name && String(profileData.name).trim()) ||
      googleEmail.split('@')[0];

    let user = await User.findOne({ email: googleEmail });

    if (!user) {
      user = await User.create({
        name: googleName,
        email: googleEmail,
        authProvider: 'google',
        isEmailVerified: profileData.email_verified === true,
        profilePicture: profileData.picture || '',
        googleId: profileData.sub || null,
      });
    } else {
      user.name = user.name || googleName;
      user.profilePicture = profileData.picture || user.profilePicture;
      user.googleId = profileData.sub || user.googleId;
      user.isEmailVerified =
        profileData.email_verified === true || user.isEmailVerified;

      if (!user.password) {
        user.authProvider = 'google';
      } else if (user.authProvider !== 'both') {
        user.authProvider = 'both';
      }

      await user.save();
    }

    const token = createUserToken(user._id);
    const successUrl = new URL(getGoogleSuccessRedirectUrl());
    successUrl.searchParams.set('oauth', 'success');
    successUrl.searchParams.set('provider', 'google');
    successUrl.searchParams.set('state', String(state || 'signin'));
    successUrl.searchParams.set('token', token);
    successUrl.searchParams.set(
      'user',
      encodeURIComponent(JSON.stringify(sanitizeUser(user)))
    );

    return res.redirect(successUrl.toString());
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    error.code = error.code || 'GOOGLE_OAUTH_CALLBACK_FAILED';
    error.message =
      error.message ||
      'An unexpected error occurred while completing Google OAuth.';
    return next(error);
  }
};

//----------------------- Upwork OAuth ----------------------//

const UPWORK_OAUTH_AUTHORIZE_URL =
  'https://www.upwork.com/ab/account-security/oauth2/authorize';
const UPWORK_OAUTH_TOKEN_URL = 'https://www.upwork.com/api/v3/oauth2/token';

const ensureUpworkOAuthConfig = () => {
  if (
    !UPWORK_CLIENT_ID ||
    !UPWORK_CLIENT_SECRET ||
    !UPWORK_OAUTH_REDIRECT_URI
  ) {
    const error = new Error(
      'Upwork OAuth is not configured. Missing UPWORK_CLIENT_ID, UPWORK_CLIENT_SECRET, or UPWORK_OAUTH_REDIRECT_URI.'
    );
    error.statusCode = 500;
    error.code = 'UPWORK_OAUTH_NOT_CONFIGURED';
    throw error;
  }
};

export const startUpworkOAuth = async (req, res, next) => {
  try {
    ensureUpworkOAuthConfig();

    const state = req.query.state || '';
    const scope = req.query.scope || '';

    const params = new URLSearchParams({
      client_id: UPWORK_CLIENT_ID,
      redirect_uri: UPWORK_OAUTH_REDIRECT_URI,
      response_type: 'code',
    });

    if (scope) {
      params.set('scope', scope);
    }

    if (state) {
      params.set('state', String(state));
    }

    return res.redirect(`${UPWORK_OAUTH_AUTHORIZE_URL}?${params.toString()}`);
  } catch (error) {
    return next(error);
  }
};

export const handleUpworkOAuthCallback = async (req, res, next) => {
  try {
    ensureUpworkOAuthConfig();

    const {
      code,
      error: oauthError,
      error_description: errorDescription,
    } = req.query;

    if (oauthError) {
      const error = new Error(
        errorDescription
          ? `Upwork OAuth failed: ${errorDescription}`
          : `Upwork OAuth failed: ${oauthError}`
      );
      error.statusCode = 400;
      error.code = 'UPWORK_OAUTH_FAILED';
      throw error;
    }

    if (!code) {
      const error = new Error('Missing OAuth authorization code in callback.');
      error.statusCode = 400;
      error.code = 'UPWORK_OAUTH_CODE_MISSING';
      throw error;
    }

    const basicAuth = Buffer.from(
      `${UPWORK_CLIENT_ID}:${UPWORK_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch(UPWORK_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: UPWORK_OAUTH_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => null);

    if (!tokenResponse.ok || !tokenData?.access_token) {
      const error = new Error(
        'Failed to exchange Upwork OAuth code for token.'
      );
      error.statusCode = 502;
      error.code = 'UPWORK_TOKEN_EXCHANGE_FAILED';
      error.diagnostics = {
        status: tokenResponse.status,
        response: tokenData,
      };
      throw error;
    }

    const successPayload = {
      success: true,
      message:
        'Upwork OAuth callback received and token exchange succeeded. Store token persistence as needed.',
      data: {
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
      },
    };

    if (FRONTEND_URL) {
      const url = new URL(FRONTEND_URL);
      url.searchParams.set('upworkOAuth', 'success');
      return res.redirect(url.toString());
    }

    return res.status(200).json(successPayload);
  } catch (error) {
    return next(error);
  }
};

//----------------------- Freelancer OAuth ----------------------//

const FREELANCER_DEFAULT_BASE_URL = (
  FREELANCER_BASE_URL || 'https://www.freelancer.com'
).replace(/\/$/, '');
const FREELANCER_DEFAULT_ACCOUNTS_URL = (
  FREELANCER_ACCOUNTS_BASE_URL || 'https://accounts.freelancer.com'
).replace(/\/$/, '');

const ensureFreelancerOAuthConfig = () => {
  if (
    !FREELANCER_CLIENT_ID ||
    !FREELANCER_CLIENT_SECRET ||
    !FREELANCER_OAUTH_REDIRECT_URI
  ) {
    const error = new Error(
      'Freelancer OAuth is not configured. Missing FREELANCER_CLIENT_ID, FREELANCER_CLIENT_SECRET, or FREELANCER_OAUTH_REDIRECT_URI.'
    );
    error.statusCode = 500;
    error.code = 'FREELANCER_OAUTH_NOT_CONFIGURED';
    throw error;
  }
};

const normalizeScopeList = (value, delimiter = ' ') => {
  const items = String(value || '')
    .split(/[\s,]+/)
    .map(item => item.trim())
    .filter(Boolean);

  if (items.length === 0) return '';
  return delimiter === ',' ? items.join(',') : items.join(' ');
};

export const startFreelancerOAuth = async (req, res, next) => {
  try {
    ensureFreelancerOAuthConfig();

    let userId = req.user?._id || req.user?.id || req.query.userId || null;
    if (!userId && req.query.appToken) {
      try {
        const decoded = jwt.verify(String(req.query.appToken), JWT_SECRET);
        userId = decoded?.userId || null;
      } catch {
        userId = null;
      }
    }
    const scope = normalizeScopeList(
      req.query.scope || FREELANCER_OAUTH_SCOPE || 'basic',
      ' '
    );
    const prompt =
      req.query.prompt || FREELANCER_OAUTH_PROMPT || 'select_account consent';
    const advancedScopes = normalizeScopeList(
      req.query.advanced_scopes ?? FREELANCER_OAUTH_ADVANCED_SCOPES ?? '',
      ','
    );
    const state = createFreelancerState(
      userId ? String(userId) : null,
      String(req.query.state || 'connect')
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: FREELANCER_CLIENT_ID,
      redirect_uri: FREELANCER_OAUTH_REDIRECT_URI,
      scope: String(scope),
      prompt: String(prompt),
    });

    if (advancedScopes) {
      params.set('advanced_scopes', advancedScopes);
    }

    if (state) {
      params.set('state', String(state));
    }

    return res.redirect(
      `${FREELANCER_DEFAULT_ACCOUNTS_URL}/oauth/authorise?${params.toString()}`
    );
  } catch (error) {
    return next(error);
  }
};

export const handleFreelancerOAuthCallback = async (req, res, next) => {
  try {
    ensureFreelancerOAuthConfig();

    const {
      code,
      state,
      error: oauthError,
      error_description: errorDescription,
    } = req.query;

    if (oauthError) {
      return redirectFreelancerFailure(
        res,
        'FREELANCER_OAUTH_DENIED',
        errorDescription
          ? `Freelancer OAuth failed: ${String(errorDescription)}`
          : `Freelancer OAuth failed: ${String(oauthError)}`
      );
    }

    if (!code) {
      return redirectFreelancerFailure(
        res,
        'FREELANCER_OAUTH_CODE_MISSING',
        'Missing authorization code from Freelancer callback.'
      );
    }

    const tokenResponse = await fetch(
      `${FREELANCER_DEFAULT_ACCOUNTS_URL}/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          client_id: FREELANCER_CLIENT_ID,
          client_secret: FREELANCER_CLIENT_SECRET,
          redirect_uri: FREELANCER_OAUTH_REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json().catch(() => null);

    if (!tokenResponse.ok || !tokenData?.access_token) {
      return redirectFreelancerFailure(
        res,
        'FREELANCER_TOKEN_EXCHANGE_FAILED',
        'Could not exchange Freelancer authorization code for access token.'
      );
    }

    const selfResponse = await fetch(
      `${FREELANCER_DEFAULT_BASE_URL}/api/users/0.1/self/`,
      {
        headers: {
          'Freelancer-OAuth-V1': tokenData.access_token,
        },
      }
    );

    const selfData = await selfResponse.json().catch(() => null);
    const freelancerProfile = selfData?.result || {};
    const freelancerUserId = freelancerProfile?.id;
    const freelancerEmail = String(freelancerProfile?.email || '')
      .toLowerCase()
      .trim();
    const freelancerUsername =
      freelancerProfile?.display_name ||
      freelancerProfile?.username ||
      (freelancerEmail ? freelancerEmail.split('@')[0] : null) ||
      'Freelancer User';
    const profilePicture =
      freelancerProfile?.avatar_large ||
      freelancerProfile?.avatar ||
      freelancerProfile?.profile_logo ||
      '';

    const fallbackEmail = freelancerUserId
      ? `freelancer_${String(freelancerUserId)}@freelancer.local`
      : null;
    const identityEmail = freelancerEmail || fallbackEmail;

    const decodedState = readFreelancerState(state);
    let user = null;

    if (decodedState?.userId) {
      user = await User.findById(decodedState.userId);
    }

    if (!user && freelancerUserId) {
      user = await User.findOne({
        'freelancerAuth.freelancerUserId': String(freelancerUserId),
      });
    }

    if (!user && freelancerEmail) {
      user = await User.findOne({ email: freelancerEmail });
    }

    if (!user && identityEmail) {
      user = await User.create({
        name: freelancerUsername,
        email: identityEmail,
        authProvider: 'freelancer',
        isEmailVerified: Boolean(freelancerEmail),
        profilePicture,
      });
    }

    if (user) {
      user.name = user.name || freelancerUsername;
      user.profilePicture = profilePicture || user.profilePicture;
      user.isEmailVerified = user.isEmailVerified || Boolean(freelancerEmail);

      if (user.password && user.authProvider !== 'both') {
        user.authProvider = 'both';
      } else if (!user.password && user.authProvider === 'local') {
        user.authProvider = 'freelancer';
      }

      user.freelancerAuth = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + Number(tokenData.expires_in) * 1000)
          : null,
        scope: tokenData.scope || null,
        freelancerUserId: freelancerUserId ? String(freelancerUserId) : null,
        connectedAt: new Date(),
      };

      await user.save();
    } else {
      return redirectFreelancerFailure(
        res,
        'FREELANCER_ACCOUNT_LINK_FAILED',
        'Freelancer account connected but could not be linked to an app user.'
      );
    }

    const successUrl = new URL(getFreelancerSuccessRedirectUrl());
    successUrl.searchParams.set('oauth', 'success');
    successUrl.searchParams.set('provider', 'freelancer');

    if (user) {
      const token = createUserToken(user._id);
      successUrl.searchParams.set('token', token);
      successUrl.searchParams.set(
        'user',
        encodeURIComponent(JSON.stringify(sanitizeUser(user)))
      );
    }

    return res.redirect(successUrl.toString());
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    error.code = error.code || 'FREELANCER_OAUTH_CALLBACK_FAILED';
    error.message =
      error.message ||
      'An unexpected error occurred while completing Freelancer OAuth.';
    return next(error);
  }
};
