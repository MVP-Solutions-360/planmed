import { LocalTrackingProvider } from '../providers/LocalTrackingProvider';

export class TrackingService {
  private provider: LocalTrackingProvider;

  constructor() {
    this.provider = new LocalTrackingProvider();
  }

  getVisitorUuid(): string | null {
    if (!import.meta.client) return null;
    let uuid = localStorage.getItem('planmed_session_id');
    if (!uuid) {
      uuid = crypto.randomUUID();
      localStorage.setItem('planmed_session_id', uuid);
    }
    return uuid;
  }

  track(eventType: string, pagePath: string, payload: any = null) {
    this.provider.trackEvent(eventType, pagePath, {
      ...payload,
      visitorId: this.getVisitorUuid()
    });
  }
}

export const trackingService = new TrackingService();
