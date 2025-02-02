import { json, type ActionFunctionArgs } from '@remix-run/node';
import { login, sessionStorage } from '~/services/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || !password) {
      return json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const result = await login('SRT', username.toString(), password.toString());

    if (!result.success) {
      return json(
        { error: result.message || '로그인에 실패했습니다.' },
        { status: 401 },
      );
    }

    const session = await sessionStorage.getSession();
    session.set('sessionKey', result.sessionKey);
    session.set('trainType', 'SRT');

    return json(
      { success: true },
      {
        headers: {
          'Set-Cookie': await sessionStorage.commitSession(session),
        },
      },
    );
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
