import { json, redirect, type ActionFunctionArgs } from '@remix-run/node';
import {
  Form,
  useActionData,
  useNavigation,
  useParams,
} from '@remix-run/react';
import { login, sessionStorage } from '~/services/auth.server';
import { cn } from '~/lib/cn';

interface ActionData {
  error?: string;
  success?: boolean;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const trainType = params.trainType?.toUpperCase();
  if (trainType !== 'SRT' && trainType !== 'KTX') {
    return json<ActionData>(
      { error: '잘못된 기차 유형입니다.' },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    if (!username || !password) {
      return json<ActionData>(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const result = await login(trainType as 'SRT' | 'KTX', username, password);

    if (!result.success || !result.sessionKey) {
      return json<ActionData>(
        { error: result.message || '로그인에 실패했습니다.' },
        { status: 401 },
      );
    }

    const session = await sessionStorage.getSession();
    session.set('sessionKey', result.sessionKey);
    session.set('trainType', trainType);
    session.set('username', username);

    console.log('Saving session:', {
      sessionKey: result.sessionKey,
      trainType,
      username,
    });

    return redirect(`/booking/${params.trainType}/stations`, {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return json<ActionData>(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

export default function AuthPage() {
  const { trainType } = useParams();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className={cn('min-h-screen bg-gray-900 text-gray-100')}>
      <main className={cn('container mx-auto px-4 py-16 sm:px-6 lg:px-8')}>
        <div className={cn('mx-auto max-w-md')}>
          <div className={cn('mb-8 text-center')}>
            <h1 className={cn('text-3xl font-bold')}>
              {trainType?.toUpperCase()} 로그인
            </h1>
            <p className={cn('mt-2 text-gray-400')}>
              {trainType?.toUpperCase()} 서비스 이용을 위해 로그인해주세요
            </p>
          </div>

          <div
            className={cn(
              'rounded-lg bg-gray-800 p-8 shadow-xl',
              'ring-1 ring-gray-700',
            )}
          >
            <Form method="post" className={cn('space-y-6')}>
              <div className={cn('space-y-4')}>
                <div>
                  <label
                    htmlFor="username"
                    className={cn('mb-2 block text-sm font-medium')}
                  >
                    아이디
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className={cn(
                      'block w-full rounded-md border-0 bg-gray-700 px-4 py-2',
                      'text-white placeholder:text-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      'transition-colors duration-200',
                    )}
                    placeholder="회원 아이디를 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className={cn('mb-2 block text-sm font-medium')}
                  >
                    비밀번호
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={cn(
                      'block w-full rounded-md border-0 bg-gray-700 px-4 py-2',
                      'text-white placeholder:text-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      'transition-colors duration-200',
                    )}
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              </div>

              {actionData?.error && (
                <div
                  className={cn(
                    'rounded-md bg-red-500/10 p-3',
                    'text-sm text-red-400',
                  )}
                >
                  {actionData.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'relative w-full rounded-lg bg-blue-600 px-4 py-3',
                  'text-sm font-semibold text-white shadow-sm',
                  'hover:bg-blue-500 focus-visible:outline focus-visible:outline-2',
                  'focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                  'disabled:cursor-not-allowed disabled:opacity-70',
                  'transition-colors duration-200',
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">로그인 중</span>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      ···
                    </span>
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
