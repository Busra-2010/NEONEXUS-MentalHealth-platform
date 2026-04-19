import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  institutionId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

class JWTUtils {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (process.env.NODE_ENV === 'production' && this.secret === 'fallback-secret-key') {
      console.warn('⚠️ WARNING: Using fallback JWT secret in production!');
    }
  }

  /**
   * Generate an access token
   */
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(
      payload as Record<string, any>, 
      this.secret, 
      {
        expiresIn: this.expiresIn,
        issuer: 'neonexus-api',
        audience: 'neonexus-frontend'
      } as jwt.SignOptions
    );
  }

  /**
   * Generate a refresh token (longer expiry)
   */
  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(
      payload as Record<string, any>, 
      this.secret, 
      {
        expiresIn: '30d',
        issuer: 'neonexus-api',
        audience: 'neonexus-frontend'
      } as jwt.SignOptions
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'neonexus-api',
        audience: 'neonexus-frontend'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}

// Create singleton instance
const jwtUtils = new JWTUtils();

export default jwtUtils;