import { createCookieSessionStorage, json } from '@remix-run/node';
import fetch from 'node-fetch'; // 서버사이드에서 사용할 fetch
import { SRTService } from './srt.server';

const SRT_LOGIN_URL = 'https://etk.srail.kr/cmc/01/selectLoginInfo.do';
const KTX_LOGIN_URL = 'https://www.letskorail.com/korail/com/login.do';

// 세션 스토리지 설정
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'train_session',
    secrets: ['s3cr3t'], // 실제 환경에서는 환경변수로 관리
    sameSite: 'lax',
  },
});

interface LoginResult {
  success: boolean;
  message?: string;
  sessionId?: string;
}

export async function login(
  type: 'SRT' | 'KTX',
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    if (type === 'SRT') {
      const srtService = SRTService.getInstance();
      await srtService.login(username, password);

      // 세션 정보 저장
      const srtSession = srtService.getSession();
      if (!srtSession) {
        throw new Error('세션 생성 실패');
      }

      return {
        success: true,
        sessionId: srtSession.sessionKey,
      };
    } else {
      // KTX 로그인 로직...
      throw new Error('KTX 로그인은 아직 구현되지 않았습니다');
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '로그인에 실패했습니다',
    };
  }
}
