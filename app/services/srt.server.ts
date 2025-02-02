import { json } from '@remix-run/node';

interface SRTSession {
  sessionKey: string;
  // 다른 필요한 세션 정보들...
}

export class SRTService {
  private static instance: SRTService;
  private baseUrl = 'https://etk.srail.kr';
  private session: SRTSession | null = null;

  private constructor() {}

  static getInstance(): SRTService {
    if (!SRTService.instance) {
      SRTService.instance = new SRTService();
    }
    return SRTService.instance;
  }

  async login(username: string, password: string): Promise<Response> {
    try {
      const loginUrl = `${this.baseUrl}/cmc/01/selectLoginInfo.do`;
      const formData = new URLSearchParams({
        srchDvCd: '1',
        srchDvNm: username,
        hmpgPwdCphd: password,
      });

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('로그인 요청 실패');
      }

      const text = await response.text();
      if (text.includes('error')) {
        throw new Error('로그인 실패');
      }

      // 세션 정보 저장
      const cookies = response.headers.get('set-cookie');
      this.session = {
        sessionKey: cookies || '',
      };

      return json({ success: true });
    } catch (error) {
      console.error('SRT 로그인 에러:', error);
      throw error;
    }
  }

  // 세션 유효성 검사
  isAuthenticated(): boolean {
    return !!this.session;
  }

  // 세션 정보 가져오기
  getSession(): SRTSession | null {
    return this.session;
  }
}
