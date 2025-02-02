import { useParams, Form, useActionData } from '@remix-run/react';
import { useForm } from 'react-hook-form';
import { json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { cn } from '~/lib/cn';
import { login, sessionStorage } from '~/services/auth.server';

interface AuthForm {
  username: string;
  password: string;
}

const SRT_LOGIN_URL = 'https://etk.srail.kr/cmc/01/selectLoginInfo.do';
const KTX_LOGIN_URL = 'https://www.letskorail.com/korail/com/login.do';

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const trainType = params.trainType?.toUpperCase() as 'SRT' | 'KTX';

  const result = await login(trainType, username, password);

  if (!result.success) {
    return json({ error: result.message }, { status: 400 });
  }

  // 세션 생성
  const session = await sessionStorage.getSession();
  session.set('sessionId', result.sessionId);

  // 다음 단계로 리다이렉트
  return redirect(`/booking/${trainType.toLowerCase()}/select-station`, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export default function AuthPage() {
  const { trainType } = useParams();
  const actionData = useActionData<typeof action>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AuthForm>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await fetch('/api/srt/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '로그인에 실패했습니다');
      }

      // 로그인 성공 시 다음 단계로 이동
      // TODO: 다음 단계 구현
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error ? error.message : '로그인에 실패했습니다',
      });
    }
  });

  return (
    <div className={cn('min-h-screen bg-gray-900 text-gray-100')}>
      <main className={cn('container mx-auto px-4 sm:px-6 lg:px-8 py-16')}>
        <div className={cn('max-w-md mx-auto')}>
          <h1
            className={cn(
              'text-2xl sm:text-3xl font-bold text-center text-white mb-8',
            )}
          >
            {trainType?.toUpperCase()} 로그인
          </h1>

          <Form
            method="post"
            onSubmit={onSubmit}
            className={cn('space-y-6 bg-gray-800 p-6 rounded-lg shadow-xl')}
          >
            <div>
              <label
                htmlFor="username"
                className={cn('block text-sm font-medium text-gray-300 mb-2')}
              >
                아이디
              </label>
              <input
                id="username"
                {...register('username', {
                  required: '아이디를 입력해주세요',
                  minLength: {
                    value: 4,
                    message: '아이디는 4자 이상이어야 합니다',
                  },
                })}
                className={cn(
                  'w-full px-4 py-2 bg-gray-700 border rounded-md',
                  'text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.username
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600',
                )}
                placeholder="아이디를 입력하세요"
              />
              {errors.username && (
                <p className={cn('mt-1 text-sm text-red-500')}>
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className={cn('block text-sm font-medium text-gray-300 mb-2')}
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: {
                    value: 8,
                    message: '비밀번호는 8자 이상이어야 합니다',
                  },
                })}
                className={cn(
                  'w-full px-4 py-2 bg-gray-700 border rounded-md',
                  'text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600',
                )}
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password && (
                <p className={cn('mt-1 text-sm text-red-500')}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full px-4 py-3 bg-blue-600 text-white rounded-lg',
                'hover:bg-blue-700 transition-colors font-medium',
                'shadow-lg hover:shadow-blue-500/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>

            {errors.root && (
              <p className={cn('text-sm text-red-500 text-center')}>
                {errors.root.message}
              </p>
            )}
          </Form>
        </div>
      </main>
    </div>
  );
}
