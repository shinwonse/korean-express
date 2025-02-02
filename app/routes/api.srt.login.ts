import { ActionFunctionArgs, json } from '@remix-run/node';
import { SRTService } from '~/services/srt.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json(
        { error: '아이디와 비밀번호를 입력해주세요' },
        { status: 400 },
      );
    }

    const srtService = SRTService.getInstance();
    const response = await srtService.login(username, password);

    return response;
  } catch (error) {
    console.error('SRT 로그인 API 에러:', error);
    return json(
      {
        error:
          error instanceof Error ? error.message : 'SRT 로그인에 실패했습니다',
      },
      { status: 500 },
    );
  }
}
