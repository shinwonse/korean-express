import { useParams } from '@remix-run/react';
import { useForm } from 'react-hook-form';
import { cn } from '~/lib/cn';

interface AuthForm {
  username: string;
  password: string;
}

export default function AuthPage() {
  const { trainType } = useParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthForm>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    // TODO: 실제 로그인 로직 구현
    console.log(data);
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

          <form
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
          </form>
        </div>
      </main>
    </div>
  );
}
