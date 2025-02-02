import { json, type ActionFunctionArgs } from '@remix-run/node';
import { SRTService } from '~/services/srt.server';
import { sessionStorage } from '~/services/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );
  const sessionKey = session.get('sessionKey');
  const trainType = session.get('trainType');

  if (!sessionKey || trainType !== 'SRT') {
    return json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const departureStation = formData.get('departureStation')?.toString();
    const arrivalStation = formData.get('arrivalStation')?.toString();
    const date = formData.get('date')?.toString();
    const time = formData.get('time')?.toString();

    if (!departureStation || !arrivalStation || !date) {
      return json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const srtService = SRTService.getInstance();

    // 세션 유효성 검증
    const isValid = await srtService.isAuthenticated(sessionKey);
    if (!isValid) {
      return json({ error: '세션이 만료되었습니다.' }, { status: 401 });
    }

    const trains = await srtService.searchTrains(
      sessionKey,
      departureStation,
      arrivalStation,
      date,
      time,
    );

    return json({ trains });
  } catch (error) {
    console.error('Train search error:', error);
    return json(
      { error: '열차 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
