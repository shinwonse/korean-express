import { createCookieSessionStorage } from '@remix-run/node';
import { SRTService } from './srt.server';

// 세션 스토리지 설정
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'train_session',
    secrets: ['s3cr3t'], // 실제 환경에서는 환경변수로 관리
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
  },
});

interface LoginResult {
  success: boolean;
  message?: string;
  sessionKey?: string;
}

export async function login(
  type: 'SRT' | 'KTX',
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    if (type === 'SRT') {
      const srtService = SRTService.getInstance();
      const session = await srtService.login(username, password);

      // 세션 생성 성공 확인
      if (!session || !session.key) {
        return {
          success: false,
          message: '세션 생성에 실패했습니다.',
        };
      }

      // 로그인 성공 시 세션 키 반환
      return {
        success: true,
        sessionKey: session.key,
      };
    } else {
      // KTX 로그인 로직
      throw new Error('KTX 로그인은 아직 구현되지 않았습니다');
    }
  } catch (error) {
    console.error('Login service error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '로그인에 실패했습니다',
    };
  }
}

export async function isAuthenticated(
  type: 'SRT' | 'KTX',
  sessionKey: string,
): Promise<boolean> {
  try {
    if (type === 'SRT') {
      const srtService = SRTService.getInstance();
      return await srtService.isAuthenticated(sessionKey);
    }
    return false;
  } catch {
    return false;
  }
}

export async function logout(
  type: 'SRT' | 'KTX',
  sessionKey: string,
): Promise<void> {
  if (type === 'SRT') {
    const srtService = SRTService.getInstance();
    await srtService.logout(sessionKey);
  }
}
