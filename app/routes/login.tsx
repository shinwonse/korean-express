import { json, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { SRTService } from '~/services/srt.server';
import { commitSession, getSession } from '~/sessions';
import { v4 as uuidv4 } from 'uuid';

export async function action({ request }: ActionFunctionArgs) {
  console.log('Login action started');

  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  console.log('Form data received:', {
    username: username ? '***' : undefined,
  });

  if (!username || !password) {
    console.log('Missing credentials');
    return json(
      { error: '아이디와 비밀번호를 입력해주세요.' },
      { status: 400 },
    );
  }

  const session = await getSession(request.headers.get('Cookie'));
  const sessionId = uuidv4();
  session.set('sessionId', sessionId);

  console.log('New session created:', {
    id: sessionId,
    data: session.data,
    cookie: request.headers.get('Cookie'),
  });

  try {
    console.log('Attempting SRT login...');
    const srtService = SRTService.getInstance();
    const success = await srtService.login(sessionId, username, password);

    console.log('SRT login result:', success);

    if (!success) {
      session.unset('sessionId');
      console.log('Login failed, session cleared:', session.data);
      return json(
        { error: '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.' },
        {
          status: 401,
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        },
      );
    }

    const cookie = await commitSession(session);
    console.log('Login successful, redirecting with cookie:', {
      sessionId,
      cookie,
      sessionData: session.data,
    });

    return redirect('/booking/srt/station', {
      headers: {
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('Login error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    session.unset('sessionId');
    return json(
      { error: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 500,
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      },
    );
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          로그인
        </h1>
        <Form method="post" className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              아이디
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          {actionData?.error && (
            <div className="text-sm text-red-500">{actionData.error}</div>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            로그인
          </button>
        </Form>
      </div>
    </div>
  );
}
