import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { SRTService } from '~/services/srt.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const srtService = SRTService.getInstance();
    const stations = await srtService.getStations();
    return json({ stations });
  } catch (error) {
    console.error('Station fetch error:', error);
    return json(
      { error: '역 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
