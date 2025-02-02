import { createCookieSessionStorage } from '@remix-run/node';

// 세션 스토리지 설정
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'korean_express_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: ['s3cr3t'], // TODO: 실제 배포 시에는 환경 변수에서 가져오기
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
  },
});

// 세션 가져오기
export async function getSession(cookieHeader: string | null) {
  return sessionStorage.getSession(cookieHeader);
}

// 세션 커밋하기
export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

// 세션 파기하기
export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
}
