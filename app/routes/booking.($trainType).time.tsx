import { useNavigate, useParams, useLocation } from '@remix-run/react';
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { Button } from '~/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '~/lib/cn';
import type { Station } from '~/constants/stations';
import { sessionStorage } from '~/services/auth.server';
import { useLoaderData } from '@remix-run/react';

interface LocationState {
  departure: Station;
  arrival: Station;
  date: string;
}

interface LoaderData {
  times: Array<{
    value: string;
    label: string;
  }>;
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

  if (!sessionKey || !trainType) {
    return redirect('/booking/srt/auth');
  }

  // 2. 시간 목록 생성
  const times = [
    { value: '00', label: '오전 12:00' },
    { value: '02', label: '오전 2:00' },
    { value: '04', label: '오전 4:00' },
    { value: '06', label: '오전 6:00' },
    { value: '08', label: '오전 8:00' },
    { value: '10', label: '오전 10:00' },
    { value: '12', label: '오후 12:00' },
    { value: '14', label: '오후 2:00' },
    { value: '16', label: '오후 4:00' },
    { value: '18', label: '오후 6:00' },
    { value: '20', label: '오후 8:00' },
    { value: '22', label: '오후 10:00' },
  ];

  return json<LoaderData>({ times });
}

export default function TimeRoute() {
  const navigate = useNavigate();
  const { trainType } = useParams();
  const location = useLocation();
  const { departure, arrival, date } = location.state as LocationState;
  const data = useLoaderData<typeof loader>();

  // 에러 처리
  if ('error' in data && typeof data.error === 'string') {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-600">{data.error}</div>
      </div>
    );
  }

  const { times } = data;

  const handleTimeSelect = (timeValue: string) => {
    navigate(`/booking/${trainType}/trains`, {
      state: {
        departure,
        arrival,
        date,
        time: `${timeValue}0000`, // HHMMSS 형식으로 변환
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
    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
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
        <h1 className="text-xl font-semibold text-white">출발 시각 선택</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-1 text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <span>{departure.name}</span>
                <span>→</span>
                <span>{arrival.name}</span>
              </div>
              <div className="text-sm">{formatDate(date)}</div>
            </div>
            {times.map((time) => (
              <button
                key={time.value}
                onClick={() => handleTimeSelect(time.value)}
                className={cn(
                  'w-full px-4 py-4 text-left rounded-lg',
                  'transition-colors border border-gray-800',
                  'hover:bg-gray-800/50 active:bg-gray-800',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-white">
                    {time.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
