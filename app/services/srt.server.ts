import { json } from '@remix-run/node';

interface SRTLoginResponse {
  resultCode: string;
  resultMessage: string;
  key?: string;
}

interface SRTSession {
  key: string;
  memberNumber: string;
  createdAt: Date;
}

interface Station {
  stationCode: string;
  stationName: string;
}

export interface Train {
  trainNo: string;
  departureTime: string;
  arrivalTime: string;
  departureStation: string;
  arrivalStation: string;
  duration: string;
  specialSeatStatus: string;
  normalSeatStatus: string;
  reservationStatus: string;
  price: {
    special: number;
    normal: number;
  };
}

interface TrainSearchResponse {
  resultCode: string;
  resultMessage: string;
  data?: {
    trains: Train[];
  };
}

export class SRTService {
  private static instance: SRTService;
  private baseUrl = 'https://etk.srail.kr';
  private sessions: Map<string, SRTSession> = new Map();

  private constructor() {}

  public static getInstance(): SRTService {
    if (!SRTService.instance) {
      SRTService.instance = new SRTService();
    }
    return SRTService.instance;
  }

  private getHeaders(sessionKey?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (sessionKey) {
      headers['Cookie'] = `JSESSIONID_ETK=${sessionKey}; SR_MB_CD=1`;
    }

    return headers;
  }

  public async login(username: string, password: string): Promise<SRTSession> {
    try {
      // 1. 초기 페이지 방문
      const mainResponse = await fetch(`${this.baseUrl}/main.do`, {
        headers: this.getHeaders(),
      });

      if (!mainResponse.ok) {
        throw new Error('Failed to access main page');
      }

      const mainCookies = mainResponse.headers.get('set-cookie');
      console.log('Initial cookies:', mainCookies);

      if (!mainCookies) {
        throw new Error('No cookies received from main page');
      }

      const sessionMatch = mainCookies.match(/JSESSIONID_ETK=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : '';
      console.log('Initial session ID:', sessionId);

      // 2. 로그인 요청
      const loginFormData = new URLSearchParams({
        srchDvCd: '2', // 이메일 로그인
        srchDvNm: username,
        hmpgPwdCphd: password,
      });

      const loginResponse = await fetch(
        `${this.baseUrl}/cmc/01/selectLoginInfo.do`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(sessionId),
            Referer: `${this.baseUrl}/main.do`,
            Origin: this.baseUrl,
          },
          body: loginFormData,
        },
      );

      if (!loginResponse.ok) {
        console.error('Login response status:', loginResponse.status);
        throw new Error('Login request failed');
      }

      const loginCookies = loginResponse.headers.get('set-cookie');
      console.log('Login response cookies:', loginCookies);

      const loginText = await loginResponse.text();
      console.log('Login response text:', loginText);

      // 3. 로그인 실패 메시지 확인
      if (loginText.includes('alert')) {
        const errorMatch = loginText.match(/alert\(['"](.*?)['"]\)/);
        if (errorMatch) {
          throw new Error(
            decodeURIComponent(errorMatch[1].replace(/\\+/g, ' ')),
          );
        }
        throw new Error('로그인에 실패했습니다.');
      }

      // 4. 로그인 성공 확인 (리다이렉션이 있으면 성공)
      if (
        loginText.includes("location.replace('/main.do')") ||
        loginText.includes("location.href='/main.do'")
      ) {
        // 5. 세션 검증을 위한 마이페이지 접근
        const verifyResponse = await fetch(
          `${this.baseUrl}/mrs/mrscfm/mrscfmP01.do`,
          {
            headers: {
              ...this.getHeaders(sessionId),
              Referer: `${this.baseUrl}/main.do`,
            },
          },
        );

        const verifyText = await verifyResponse.text();
        console.log(
          'Verify response (마이페이지 접근):',
          !verifyText.includes('로그인이 필요합니다'),
        );

        // 마이페이지 접근이 가능하면 로그인 성공
        if (!verifyText.includes('로그인이 필요합니다')) {
          // 최종 세션 확인
          const finalCookies = verifyResponse.headers.get('set-cookie');
          const finalSessionMatch = finalCookies?.match(
            /JSESSIONID_ETK=([^;]+)/,
          );
          const finalSessionId = finalSessionMatch
            ? finalSessionMatch[1]
            : sessionId;

          console.log('Final session ID:', finalSessionId);

          const session: SRTSession = {
            key: finalSessionId,
            memberNumber: username,
            createdAt: new Date(),
          };

          // 세션 맵에 저장
          this.sessions.set(finalSessionId, session);
          return session;
        }
      }

      throw new Error('로그인에 실패했습니다.');
    } catch (error) {
      console.error('SRT login error:', error);
      throw error;
    }
  }

  public async isAuthenticated(sessionKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/main.do`, {
        headers: this.getHeaders(sessionKey),
      });

      if (!response.ok) {
        return false;
      }

      const html = await response.text();
      return html.includes('로그아웃') || html.includes('logout');
    } catch {
      return false;
    }
  }

  public async logout(sessionKey: string): Promise<void> {
    try {
      await fetch(
        `${this.baseUrl}/cmc/01/selectLoginInfo.do?pageId=TK0701000000`,
        {
          method: 'GET',
          headers: this.getHeaders(sessionKey),
        },
      );
    } catch (error) {
      console.error('SRT logout error:', error);
      throw error;
    }
  }

  public async searchTrains(
    sessionKey: string,
    departureStation: string,
    arrivalStation: string,
    date: string,
    time: string = '000000',
  ): Promise<Train[]> {
    try {
      // 1. 조회 페이지 접근
      const searchPageResponse = await fetch(
        `${this.baseUrl}/hpg/20/hpg21000/hpg21100/selectScheduleList.do`,
        {
          headers: {
            ...this.getHeaders(sessionKey),
            Referer: `${this.baseUrl}/main.do`,
          },
        },
      );

      if (!searchPageResponse.ok) {
        throw new Error('Failed to access search page');
      }

      // 2. 열차 조회 요청
      const formData = new URLSearchParams({
        dptRsStnCd: departureStation, // 출발역 코드
        arvRsStnCd: arrivalStation, // 도착역 코드
        dptDt: date, // 출발일(YYYYMMDD)
        dptTm: time, // 출발시각(HHMMSS)
        chtnDvCd: '1', // 1: 편도
        psgNum: '1', // 승객 수
        seatAttCd: '015', // 015: 일반실
        isRequest: 'Y', // 조회 요청 여부
        dptRsStnNm: '', // 출발역 이름 (선택)
        arvRsStnNm: '', // 도착역 이름 (선택)
      });

      const response = await fetch(
        `${this.baseUrl}/hpg/20/hpg21000/hpg21100/selectScheduleList.do`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(sessionKey),
            Referer: `${this.baseUrl}/hpg/20/hpg21000/hpg21100/selectScheduleList.do`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Train search failed');
      }

      const html = await response.text();

      // 3. 로그인 세션 만료 체크
      if (html.includes('로그인이 필요합니다')) {
        throw new Error('Session expired');
      }

      // 4. 열차 정보 파싱
      const data = await response.json();
      const trainList = data.trainListMap?.trainList || [];

      return trainList.map((train: any) => ({
        trainNo: train.trainNo,
        departureTime: train.dptTm,
        arrivalTime: train.arvTm,
        departureStation: train.dptRsStnNm,
        arrivalStation: train.arvRsStnNm,
        duration: train.runTm,
        specialSeatStatus: train.sprmRsvPsbStr,
        normalSeatStatus: train.gnrmRsvPsbStr,
        reservationStatus: train.rsvPsbStr,
        price: {
          special: parseInt(train.sprmRsvPrc, 10),
          normal: parseInt(train.gnrmRsvPrc, 10),
        },
      }));
    } catch (error) {
      console.error('SRT train search error:', error);
      throw error;
    }
  }

  public async getStations(): Promise<Station[]> {
    try {
      // 정적 역 정보 반환 (SRT는 역 목록이 고정되어 있음)
      return [
        { stationCode: '0551', stationName: '수서' },
        { stationCode: '0552', stationName: '동탄' },
        { stationCode: '0553', stationName: '평택지제' },
        { stationCode: '0502', stationName: '천안아산' },
        { stationCode: '0297', stationName: '오송' },
        { stationCode: '0010', stationName: '대전' },
        { stationCode: '0015', stationName: '동대구' },
        { stationCode: '0507', stationName: '신경주' },
        { stationCode: '0020', stationName: '울산' },
        { stationCode: '0025', stationName: '부산' },
        { stationCode: '0508', stationName: '광주송정' },
        { stationCode: '0509', stationName: '목포' },
      ];
    } catch (error) {
      console.error('SRT stations error:', error);
      throw error;
    }
  }
}
