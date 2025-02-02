import { useNavigate, useParams, useLocation } from '@remix-run/react';
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { Button } from '~/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '~/lib/cn';
import type { Station } from '~/constants/stations';
import { SRTService } from '~/services/srt.server';
import { useLoaderData } from '@remix-run/react';
import { sessionStorage } from '~/services/auth.server';

interface LocationState {
  departure: Station;
  arrival: Station;
}

interface DateInfo {
  value: string;
  label: string;
}

interface LoaderData {
  dates: DateInfo[];
  departureStation: string;
  arrivalStation: string;
  departureCode: string;
  arrivalCode: string;
}

interface LoaderError {
  error: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  // 1. 세션 확인
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );
  const sessionKey = session.get('sessionKey');
  const trainType = session.get('trainType');

  console.log('Session cookie:', request.headers.get('Cookie'));
  console.log('Session data:', { sessionKey, trainType });

  if (!sessionKey || !trainType) {
    return redirect('/booking/srt/auth');
  }

  // 2. URL 파라미터 확인
  const url = new URL(request.url);
  const dep = url.searchParams.get('dep');
  const arr = url.searchParams.get('arr');

  if (!dep || !arr) {
    return json<LoaderError>(
      { error: '출발역과 도착역을 선택해주세요.' },
      { status: 400 },
    );
  }

  // 3. 역 코드 매핑
  const stationMap: Record<string, string> = {
    SSR: '0551', // 수서
    BSN: '0025', // 부산
    // ... 다른 역 코드들
  };

  const departureCode = stationMap[dep];
  const arrivalCode = stationMap[arr];

  if (!departureCode || !arrivalCode) {
    return json<LoaderError>(
      { error: '잘못된 역 코드입니다.' },
      { status: 400 },
    );
  }

  // 4. 오늘 날짜부터 2주간의 날짜 생성
  const dates: DateInfo[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: date.toISOString().split('T')[0].replace(/-/g, ''),
      label: `${date.getMonth() + 1}월 ${date.getDate()}일 (${
        ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
      })`,
    });
  }

  return json<LoaderData>({
    dates,
    departureStation: dep,
    arrivalStation: arr,
    departureCode,
    arrivalCode,
  });
}

export default function DateRoute() {
  const navigate = useNavigate();
  const { trainType } = useParams();
  const location = useLocation();
  const { departure, arrival } = location.state as LocationState;
  const data = useLoaderData<typeof loader>();

  // 에러 처리
  if ('error' in data) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-600">{data.error}</div>
      </div>
    );
  }

  const { dates, departureStation, arrivalStation } = data;

  const handleDateSelect = (dateStr: string) => {
    navigate(`/booking/${trainType}/time`, {
      state: {
        departure,
        arrival,
        date: dateStr,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateStr: string) => {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[date.getDay()];
    return { month: Number(month), day: Number(day), dayOfWeek };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 -ml-2 h-12 w-12 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-white">출발일 선택</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <span>{departure.name}</span>
              <span>→</span>
              <span>{arrival.name}</span>
            </div>
            {dates.map((date) => {
              const { month, day, dayOfWeek } = formatDate(date.value);
              const isWeekend = dayOfWeek === '토' || dayOfWeek === '일';
              return (
                <button
                  key={date.value}
                  onClick={() => handleDateSelect(date.value)}
                  className={cn(
                    'w-full px-4 py-4 text-left rounded-lg',
                    'transition-colors border border-gray-800',
                    'hover:bg-gray-800/50 active:bg-gray-800',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-medium text-white">
                        {month}월 {day}일
                      </span>
                      <span
                        className={cn(
                          'ml-2 text-sm',
                          isWeekend ? 'text-red-400' : 'text-gray-400',
                        )}
                      >
                        {dayOfWeek}요일
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
