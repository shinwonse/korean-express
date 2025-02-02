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
      headers['Cookie'] = `JSESSIONID=${sessionKey}; SR_MB_CD=1`;
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
      if (!mainCookies) {
        throw new Error('No cookies received from main page');
      }

      const sessionMatch = mainCookies.match(/JSESSIONID=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : '';

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
        throw new Error('Login request failed');
      }

      const loginText = await loginResponse.text();
      console.log('Login response:', loginText);

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
        loginText.includes('location.replace') ||
        loginText.includes('location.href')
      ) {
        // 5. 세션 유효성 검증
        const verifyResponse = await fetch(`${this.baseUrl}/main.do`, {
          headers: {
            ...this.getHeaders(sessionId),
            Referer: `${this.baseUrl}/cmc/01/selectLoginInfo.do`,
          },
        });

        const verifyText = await verifyResponse.text();
        console.log('Verify response:', verifyText.includes('로그아웃'));

        // 6. 세션 생성 및 반환
        const session: SRTSession = {
          key: sessionId,
          memberNumber: username,
          createdAt: new Date(),
        };
        return session;
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
      const formData = new URLSearchParams();
      formData.append('dptRsStnCd', departureStation);
      formData.append('arvRsStnCd', arrivalStation);
      formData.append('dptDt', date);
      formData.append('dptTm', time);
      formData.append('chtnDvCd', '1'); // 편도
      formData.append('psgNum', '1'); // 승객 수
      formData.append('seatAttCd', '015'); // 일반실
      formData.append('arriveTime', 'N'); // 도착시각 기준 여부
      formData.append('pageId', 'TK0101010000'); // 페이지 ID

      const response = await fetch(
        `${this.baseUrl}/hpg/contents/search/list.do`,
        {
          method: 'POST',
          headers: this.getHeaders(sessionKey),
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Train search failed');
      }

      const data = await response.json();

      // HTML 파싱 대신 JSON 응답 처리
      if (!data.outDataSets || !data.outDataSets.dsOutput1) {
        return [];
      }

      return data.outDataSets.dsOutput1.map((train: any) => ({
        trainNo: train.stlbTrnNo,
        departureTime: train.dptTm,
        arrivalTime: train.arvTm,
        departureStation: train.dptRsStnNm,
        arrivalStation: train.arvRsStnNm,
        duration: train.reqTime,
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
