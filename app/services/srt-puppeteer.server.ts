import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

interface SRTSession {
  browser: Browser;
  page: Page;
}

export class SRTPuppeteerService {
  private static instance: SRTPuppeteerService;
  private baseUrl = 'https://etk.srail.kr';
  private sessions: Map<string, SRTSession> = new Map();

  private constructor() {}

  public static getInstance(): SRTPuppeteerService {
    if (!SRTPuppeteerService.instance) {
      SRTPuppeteerService.instance = new SRTPuppeteerService();
    }
    return SRTPuppeteerService.instance;
  }

  private async initSession(sessionId: string): Promise<SRTSession> {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    const session = { browser, page };
    this.sessions.set(sessionId, session);
    return session;
  }

  private async getSession(sessionId: string): Promise<SRTSession> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = await this.initSession(sessionId);
    }
    return session;
  }

  public async login(
    sessionId: string,
    username: string,
    password: string,
  ): Promise<boolean> {
    try {
      const { page } = await this.getSession(sessionId);

      // Navigate to login page
      await page.goto(`${this.baseUrl}/main.do`);
      await page.waitForSelector('#wrap');

      // Click login button to open login form
      await page.click('.login_btn');
      await page.waitForSelector('#srchDvNm01');

      // Fill in login form
      await page.type('#srchDvNm01', username);
      await page.type('#hmpgPwdCphd01', password);

      // Submit login form
      await page.click('.btn_login');

      // Wait for navigation and check if login was successful
      await page.waitForNavigation();

      const errorElement = await page.$('.alert_msg');
      if (errorElement) {
        const errorText = await page.evaluate(
          (el: Element) => el.textContent,
          errorElement,
        );
        console.error('Login failed:', errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  public async getAvailableDates(
    sessionId: string,
    departureStation: string,
    arrivalStation: string,
    date: string,
  ): Promise<boolean> {
    try {
      const { page } = await this.getSession(sessionId);

      // Navigate to main page
      await page.goto(`${this.baseUrl}/main.do`);
      await page.waitForSelector('#wrap');

      // Fill departure and arrival stations
      await page.type('#dptRsStnCd', departureStation);
      await page.type('#arvRsStnCd', arrivalStation);

      // Set date
      await page.evaluate((dateValue: string) => {
        const dateInput = document.querySelector('#dptDt') as HTMLInputElement;
        if (dateInput) {
          dateInput.value = dateValue;
        }
      }, date);

      // Click search button
      await page.click('.btn_search');

      // Wait for results
      await page.waitForSelector('.tbl_wrap');

      // Check if trains are available
      const noResultElement = await page.$('.noResult');
      return !noResultElement;
    } catch (error) {
      console.error('Error checking available dates:', error);
      return false;
    }
  }

  public async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.browser.close();
      this.sessions.delete(sessionId);
    }
  }
}
